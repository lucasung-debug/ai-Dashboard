"""
Telegram Bot for AI Dashboard — Mobile Notification Auto-Save
─────────────────────────────────────────────────────────────
Flow:
  User sends bank/card SMS text → parse → confirm → save to ledger

Phase 1: Regex-based parsing
Phase 2: LLM parsing with regex fallback (via notification_parser.py)
Phase 3: Interactive field editing via ConversationHandler
"""

import json
import logging
import os
import re
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Ledger API base (same process)
LEDGER_API_BASE = os.getenv("LEDGER_API_BASE", "http://localhost:8000/api/ledger")

# ─── ConversationHandler states ────────────────────────────
CONFIRMING = 0
EDITING_FIELD = 1
CHOOSING_EDIT = 2

# ─── In-memory state (single user) ────────────────────────
_pending: dict = {}  # chat_id → parsed result dict


# ═══════════════════════════════════════════════════════════
# 1. REGEX PARSER (Phase 1)
# ═══════════════════════════════════════════════════════════

def _clean_amount(raw: str) -> Optional[float]:
    """'15,000원' → 15000.0"""
    cleaned = re.sub(r"[,원\s]", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_date(text: str) -> str:
    """Extract YYYY-MM-DD from text. Falls back to today."""
    # YYYY.MM.DD or YYYY-MM-DD
    m = re.search(r"(\d{4})[.\-](\d{2})[.\-](\d{2})", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return str(date.today())


def _detect_type(text: str) -> str:
    """Detect transaction type from text."""
    if re.search(r"입금|수입|받음|급여|환급", text):
        return "income"
    if re.search(r"이체|송금|transfer", text, re.IGNORECASE):
        return "transfer"
    return "expense"  # default: 승인, 결제, 출금 → expense


def _extract_merchant(text: str, tx_type: str) -> str:
    """
    Extract merchant name from various bank/card notification patterns.
    Each bank has a slightly different format.
    """
    # Remove common header patterns: [KB국민카드] 홍길동님 → skip
    text = re.sub(r"\[.+?\]\s*", "", text)
    text = re.sub(r"홍길동님?\s*", "", text)

    # Pattern: amount + merchant + keyword (승인/결제)
    # e.g. "15,000원 스타벅스강남점 승인"
    m = re.search(r"\d[\d,]*원\s+(.+?)\s+(?:승인|결제|이용)", text)
    if m:
        return m.group(1).strip()

    # Pattern: keyword + amount + merchant
    # e.g. "출금 50,000원 ATM출금 잔액..."
    # e.g. "결제 맥도날드역삼점 잔여한도"
    m = re.search(r"(?:출금|결제|승인)\s+\d[\d,]*원\s+(.+?)(?:\s+잔액|\s+잔여|$)", text)
    if m:
        return m.group(1).strip()

    # Pattern: amount + merchant (no keyword), e.g. Toss "12,000원 결제 피자헛"
    m = re.search(r"\d[\d,]*원\s+(?:결제|승인|출금)\s+(.+?)(?:\s+\d{4}|\s+잔|$)", text)
    if m:
        return m.group(1).strip()

    # Pattern: for 신한카드: "9,500원 결제 맥도날드역삼점 잔여한도"
    m = re.search(r"\d[\d,]*원\s+결제\s+(.+?)(?:\s+잔여|$)", text)
    if m:
        return m.group(1).strip()

    # Last resort: take the first non-numeric word-ish token after cleaning
    tokens = re.findall(r"[가-힣a-zA-Z][가-힣a-zA-Z0-9]*", text)
    # filter out common non-merchant words
    stop = {"출금", "입금", "이체", "승인", "결제", "잔액", "잔여한도", "원", "페이", "ATM"}
    candidates = [t for t in tokens if t not in stop and len(t) >= 2]
    return candidates[0] if candidates else "알수없음"


def _extract_first_amount(text: str) -> Optional[float]:
    """
    Extract the FIRST amount (payment amount), ignoring balance/limit amounts.
    Heuristic: the first '원' occurrence is usually the transaction amount.
    """
    # Find all amount patterns
    amounts = re.findall(r"(\d[\d,]*)\s*원", text)
    if not amounts:
        return None
    # Return the first one (balance/limit appears after keywords like 잔액/잔여)
    return _clean_amount(amounts[0] + "원")


def _get_category(merchant: str) -> dict:
    """Reuse ledger's categorization rules from data/categorization_rules.json."""
    rules_file = Path(__file__).parent / "data" / "categorization_rules.json"
    if rules_file.exists():
        with open(rules_file, "r", encoding="utf-8") as f:
            rules = json.load(f)
        desc_lower = merchant.lower()
        for rule in rules:
            if rule["keyword"].lower() in desc_lower:
                return {
                    "category_medium": rule["category_medium"],
                    "category_small": rule["category_small"],
                }
    return {"category_medium": "기타지출", "category_small": "예비비"}


def parse_notification_text(text: str) -> dict:
    """
    Parse a Korean bank/card notification SMS into a structured dict.
    Returns: {amount, currency, type, merchant, date, category_medium, category_small}
    """
    tx_type = _detect_type(text)
    amount = _extract_first_amount(text)
    merchant = _extract_merchant(text, tx_type)
    txn_date = _extract_date(text)
    cats = _get_category(merchant)

    return {
        "amount": amount,
        "currency": "KRW",
        "type": tx_type,
        "merchant": merchant,
        "date": txn_date,
        "category_medium": cats["category_medium"],
        "category_small": cats["category_small"],
    }


# ═══════════════════════════════════════════════════════════
# 2. FORMAT HELPERS
# ═══════════════════════════════════════════════════════════

_TYPE_LABEL = {"expense": "지출", "income": "수입", "transfer": "이체"}
_TYPE_EMOJI = {"expense": "💸", "income": "💰", "transfer": "↔️"}


def _format_amount(amount: Optional[float]) -> str:
    if amount is None:
        return "알수없음"
    return f"{int(amount):,}원"


def _format_parsed(parsed: dict) -> str:
    tx_type = parsed.get("type", "expense")
    return (
        f"📲 *파싱 결과:*\n"
        f"유형: {_TYPE_EMOJI.get(tx_type, '')} {_TYPE_LABEL.get(tx_type, tx_type)}\n"
        f"금액: {_format_amount(parsed.get('amount'))}\n"
        f"내용: {parsed.get('merchant', '알수없음')}\n"
        f"분류: {parsed.get('category_medium', '')} \\> {parsed.get('category_small', '')}\n"
        f"날짜: {parsed.get('date', str(date.today()))}"
    )


def _confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ 저장", callback_data="save"),
            InlineKeyboardButton("✏️ 수정", callback_data="edit"),
            InlineKeyboardButton("❌ 취소", callback_data="cancel"),
        ]
    ])


def _edit_field_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("💰 금액", callback_data="edit_amount"),
            InlineKeyboardButton("📁 분류", callback_data="edit_category"),
        ],
        [
            InlineKeyboardButton("📅 날짜", callback_data="edit_date"),
            InlineKeyboardButton("📝 내용", callback_data="edit_merchant"),
        ],
        [InlineKeyboardButton("🔙 돌아가기", callback_data="back_confirm")],
    ])


# ═══════════════════════════════════════════════════════════
# 3. SECURITY GUARD
# ═══════════════════════════════════════════════════════════

def _is_allowed(update: Update) -> bool:
    """Only process messages from the configured TELEGRAM_CHAT_ID."""
    if not TELEGRAM_CHAT_ID:
        return True  # no restriction configured
    chat_id = str(update.effective_chat.id)
    return chat_id == TELEGRAM_CHAT_ID


# ═══════════════════════════════════════════════════════════
# 4. SAVE TO LEDGER
# ═══════════════════════════════════════════════════════════

async def _save_transaction(parsed: dict) -> bool:
    """POST parsed data to the local ledger API."""
    payload = {
        "type": parsed.get("type", "expense"),
        "date": parsed.get("date", str(date.today())),
        "amount": parsed.get("amount") or 0,
        "currency": parsed.get("currency", "KRW"),
        "category_medium": parsed.get("category_medium", "기타지출"),
        "category_small": parsed.get("category_small", "예비비"),
        "description": parsed.get("merchant", ""),
        "memo": "텔레그램 봇 자동 저장",
        "icon": _TYPE_EMOJI.get(parsed.get("type", "expense"), "💸"),
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{LEDGER_API_BASE}/transactions", json=payload)
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"[Bot] 저장 실패: {e}")
        return False


# ═══════════════════════════════════════════════════════════
# 5. HANDLERS
# ═══════════════════════════════════════════════════════════

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_allowed(update):
        return
    await update.message.reply_text(
        "👋 *AI Dashboard 가계부 봇*\n\n"
        "은행/카드 알림 문자를 여기에 붙여넣으면\n"
        "자동으로 가계부에 저장해드립니다.\n\n"
        "예시:\n`[KB국민카드] 홍길동 15,000원 스타벅스강남점 승인 잔액1,234,567원`",
        parse_mode="Markdown",
    )


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive notification text, parse, show confirmation."""
    if not _is_allowed(update):
        return ConversationHandler.END

    text = update.message.text.strip()
    if not text:
        return ConversationHandler.END

    # Try LLM parser first (Phase 2), fallback to regex
    try:
        from backend.notification_parser import parse_with_llm
        parsed = await parse_with_llm(text)
    except Exception:
        parsed = parse_notification_text(text)

    if parsed.get("amount") is None:
        await update.message.reply_text(
            "❓ 금액을 찾을 수 없습니다. 은행/카드 알림 문자를 그대로 붙여넣어 주세요."
        )
        return ConversationHandler.END

    # Store pending state
    chat_id = update.effective_chat.id
    _pending[chat_id] = parsed

    await update.message.reply_text(
        _format_parsed(parsed),
        parse_mode="Markdown",
        reply_markup=_confirm_keyboard(),
    )
    return CONFIRMING


async def confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle ✅ 저장 / ✏️ 수정 / ❌ 취소."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    data = query.data

    if data == "save":
        parsed = _pending.get(chat_id, {})
        ok = await _save_transaction(parsed)
        if ok:
            await query.edit_message_text("✅ 가계부에 저장되었습니다!")
        else:
            await query.edit_message_text("❌ 저장 중 오류가 발생했습니다. 서버 상태를 확인해주세요.")
        _pending.pop(chat_id, None)
        return ConversationHandler.END

    elif data == "edit":
        await query.edit_message_text(
            "✏️ 무엇을 수정할까요?",
            reply_markup=_edit_field_keyboard(),
        )
        return CHOOSING_EDIT

    elif data == "cancel":
        _pending.pop(chat_id, None)
        await query.edit_message_text("❌ 취소되었습니다.")
        return ConversationHandler.END

    elif data == "back_confirm":
        parsed = _pending.get(chat_id, {})
        await query.edit_message_text(
            _format_parsed(parsed),
            parse_mode="Markdown",
            reply_markup=_confirm_keyboard(),
        )
        return CONFIRMING

    return CONFIRMING


async def choose_edit_field_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle field selection for editing."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    data = query.data

    field_prompts = {
        "edit_amount": ("amount", "💰 새 금액을 입력해주세요 (숫자만, 예: 15000):"),
        "edit_category": ("category", "📁 분류를 입력해주세요\n형식: `중분류 > 소분류`\n예: `식비 > 카페/간식`"),
        "edit_date": ("date", "📅 날짜를 입력해주세요 (형식: YYYY-MM-DD):"),
        "edit_merchant": ("merchant", "📝 내용(가맹점)을 입력해주세요:"),
    }

    if data in field_prompts:
        field, prompt = field_prompts[data]
        context.user_data["editing_field"] = field
        await query.edit_message_text(prompt, parse_mode="Markdown")
        return EDITING_FIELD

    return CHOOSING_EDIT


async def edit_field_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive edited value, update pending, show updated confirmation."""
    if not _is_allowed(update):
        return ConversationHandler.END

    chat_id = update.effective_chat.id
    field = context.user_data.get("editing_field")
    text = update.message.text.strip()
    parsed = _pending.get(chat_id, {})

    if field == "amount":
        # Accept plain number or formatted
        cleaned = re.sub(r"[,원\s]", "", text)
        try:
            parsed["amount"] = float(cleaned)
        except ValueError:
            await update.message.reply_text("❌ 올바른 숫자를 입력해주세요.")
            return EDITING_FIELD

    elif field == "category":
        # Format: "중분류 > 소분류"
        parts = re.split(r"\s*[>→]\s*", text)
        if len(parts) == 2:
            parsed["category_medium"] = parts[0].strip()
            parsed["category_small"] = parts[1].strip()
        else:
            await update.message.reply_text("❌ `중분류 > 소분류` 형식으로 입력해주세요.")
            return EDITING_FIELD

    elif field == "date":
        m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", text)
        if m:
            parsed["date"] = text
        else:
            await update.message.reply_text("❌ YYYY-MM-DD 형식으로 입력해주세요.")
            return EDITING_FIELD

    elif field == "merchant":
        parsed["merchant"] = text

    _pending[chat_id] = parsed

    await update.message.reply_text(
        _format_parsed(parsed),
        parse_mode="Markdown",
        reply_markup=_confirm_keyboard(),
    )
    return CONFIRMING


# ═══════════════════════════════════════════════════════════
# 6. APPLICATION FACTORY
# ═══════════════════════════════════════════════════════════

def create_bot_application() -> Application:
    """Build and return the Telegram Application (not yet running)."""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("[Bot] TELEGRAM_BOT_TOKEN이 설정되지 않았습니다. 봇이 비활성화됩니다.")
        return None

    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler)],
        states={
            CONFIRMING: [CallbackQueryHandler(confirm_callback, pattern="^(save|edit|cancel|back_confirm)$")],
            CHOOSING_EDIT: [
                CallbackQueryHandler(choose_edit_field_callback, pattern="^edit_"),
                CallbackQueryHandler(confirm_callback, pattern="^back_confirm$"),
            ],
            EDITING_FIELD: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_field_handler)],
        },
        fallbacks=[CommandHandler("start", start_handler)],
        per_chat=True,
    )

    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(conv_handler)

    return app
