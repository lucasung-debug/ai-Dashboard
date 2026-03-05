"""
LLM-based Korean Financial Notification Parser (Phase 2)
─────────────────────────────────────────────────────────
Calls Claude Haiku to parse bank/card SMS into structured data.
Falls back to regex parser on any error.
"""

import json
import logging
import os
from datetime import date
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


PARSING_SYSTEM_PROMPT = f"""당신은 한국 은행/카드 알림 문자를 파싱하는 전문 파서입니다.
입력된 텍스트에서 다음 필드를 추출하여 JSON으로만 응답하세요. 설명 없이 JSON만 반환하세요.

추출 필드:
- amount: 거래 금액 (숫자만, float). 잔액/잔여한도는 제외하고 실제 거래 금액만 추출
- currency: 통화 코드 (KRW / USD / JPY). 기본값 KRW
- type: 거래 유형 (expense / income / transfer). 승인·결제·출금 → expense, 입금·급여 → income, 이체·송금 → transfer
- merchant: 가맹점명 또는 거래 내용 (문자열). 은행명·개인명 헤더 제외
- date: 거래 날짜 YYYY-MM-DD. 텍스트에 날짜 없으면 오늘({date.today()})

응답 예시:
{{"amount": 15000, "currency": "KRW", "type": "expense", "merchant": "스타벅스강남점", "date": "{date.today()}"}}
"""


async def parse_with_llm(text: str) -> dict:
    """
    Parse Korean bank/card notification text using Claude Haiku.
    On any failure, falls back to regex-based parser.
    """
    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=PARSING_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
        raw = response.content[0].text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        parsed = json.loads(raw)

        # Enrich with category from existing rules
        merchant = parsed.get("merchant", "")
        cats = _get_category(merchant)
        parsed["category_medium"] = cats["category_medium"]
        parsed["category_small"] = cats["category_small"]

        # Ensure date field
        if not parsed.get("date"):
            parsed["date"] = str(date.today())

        logger.info(f"[LLM 파서] 성공: {parsed}")
        return parsed

    except Exception as e:
        logger.warning(f"[LLM 파서] 실패, regex로 폴백: {e}")
        from backend.telegram_bot import parse_notification_text
        return parse_notification_text(text)


def _get_category(merchant: str) -> dict:
    """Reuse ledger categorization rules."""
    rules_file = Path(__file__).parent / "data" / "categorization_rules.json"
    if rules_file.exists():
        import json as _json
        with open(rules_file, "r", encoding="utf-8") as f:
            rules = _json.load(f)
        desc_lower = merchant.lower()
        for rule in rules:
            if rule["keyword"].lower() in desc_lower:
                return {
                    "category_medium": rule["category_medium"],
                    "category_small": rule["category_small"],
                }
    return {"category_medium": "기타지출", "category_small": "예비비"}
