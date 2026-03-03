import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.ledger import router as ledger_router, init_ledger_data

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SUBSCRIPTIONS_FILE = DATA_DIR / "subscriptions.json"

# 초기 데이터 (파일 없을 때만 생성)
DEFAULT_DATA = [
    {"id": "chatgpt", "name": "ChatGPT Plus", "price": 20.0, "currency": "USD", "start_date": "2023-11-15", "next_billing": "2023-12-15", "active": True},
    {"id": "claude", "name": "Claude Pro", "price": 20.0, "currency": "USD", "start_date": "2023-12-01", "next_billing": "2024-01-01", "active": True},
    {"id": "gemini", "name": "Google One AI Premium", "price": 19.99, "currency": "USD", "start_date": "2024-02-10", "next_billing": "2024-03-10", "active": False},
    {"id": "github", "name": "GitHub Copilot", "price": 10.0, "currency": "USD", "start_date": "2022-09-05", "next_billing": "2023-10-05", "active": True},
]

if not SUBSCRIPTIONS_FILE.exists():
    with open(SUBSCRIPTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)

app = FastAPI(title="AI Dashboard & Ledger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register ledger API routes
app.include_router(ledger_router)

# Serve frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


class SubscriptionModel(BaseModel):
    id: Optional[str] = None
    name: str
    price: float
    currency: str = "USD"  # USD 또는 KRW
    start_date: str
    next_billing: Optional[str] = None  # AI 구독용 (일반 고정비에는 불필요)
    active: bool = True
    cancel_scheduled: bool = False  # 해지 예약 여부
    trial: bool = False  # 무료체험 여부
    scheduled_change: Optional[Dict[str, Any]] = None
    category: str = "AI 구독료"
    icon: Optional[str] = None
    billing_cycle: Optional[str] = None  # 매일/매주/매월/매년/기타 (일반 고정비용)
    billing_cycle_custom: Optional[str] = None  # 기타 선택 시 수기입력


def load_subscriptions() -> List[Dict[str, Any]]:
    with open(SUBSCRIPTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for item in data:
            if "category" not in item:
                item["category"] = "AI 구독료"
            if "icon" not in item:
                item["icon"] = None
            if "billing_cycle" not in item:
                item["billing_cycle"] = None
            if "billing_cycle_custom" not in item:
                item["billing_cycle_custom"] = None
        return data


def save_subscriptions(data: List[Dict[str, Any]]) -> None:
    with open(SUBSCRIPTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.get("/api/subscriptions")
async def get_subscriptions():
    try:
        return {"status": "success", "data": load_subscriptions()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/subscriptions")
async def create_subscription(sub: SubscriptionModel):
    try:
        subscriptions = load_subscriptions()
        # ID 자동 생성 (없을 경우)
        import uuid
        new_sub = sub.model_dump()
        new_sub["id"] = str(uuid.uuid4())
        subscriptions.append(new_sub)
        save_subscriptions(subscriptions)
        return {"status": "success", "data": new_sub}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, sub: SubscriptionModel):
    try:
        subscriptions = load_subscriptions()
        for i, s in enumerate(subscriptions):
            if s["id"] == sub_id:
                updated = sub.model_dump()
                updated["id"] = sub_id
                subscriptions[i] = updated
                save_subscriptions(subscriptions)
                return {"status": "success", "data": updated}
        raise HTTPException(status_code=404, detail="구독 정보를 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/subscriptions/{sub_id}")
async def delete_subscription(sub_id: str):
    try:
        subscriptions = load_subscriptions()
        filtered = [s for s in subscriptions if s["id"] != sub_id]
        if len(filtered) == len(subscriptions):
            raise HTTPException(status_code=404, detail="구독 정보를 찾을 수 없습니다.")
        save_subscriptions(filtered)
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 해지예약 토글 ────────────────────────────────────────
@app.patch("/api/subscriptions/{sub_id}/cancel")
async def toggle_cancel_subscription(sub_id: str):
    """해지예약 상태를 토글 (예약 ↔ 취소)"""
    try:
        subscriptions = load_subscriptions()
        for i, s in enumerate(subscriptions):
            if s["id"] == sub_id:
                current = s.get("cancel_scheduled", False)
                subscriptions[i]["cancel_scheduled"] = not current
                save_subscriptions(subscriptions)
                return {"status": "success", "cancel_scheduled": not current}
        raise HTTPException(status_code=404, detail="구독 정보를 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 구독 상태 자동 체크 ─────────────────────────────────
def check_subscription_status():
    """해지예약 만료 및 무료체험 시작일 자동 체크"""
    try:
        subscriptions = load_subscriptions()
        today = str(date.today())
        changed = False

        for sub in subscriptions:
            # 해지예약: 다음 결제일이 지났으면 비활성화
            if sub.get("cancel_scheduled") and sub.get("active"):
                if today >= sub.get("next_billing", ""):
                    sub["active"] = False
                    sub["cancel_scheduled"] = False
                    changed = True
                    print(f"[자동 해지] {sub['name']} — 결제일({sub['next_billing']}) 경과")

            # 무료체험: 구독 시작일이 지났으면 활성화
            if sub.get("trial") and not sub.get("active"):
                if today >= sub.get("start_date", ""):
                    sub["active"] = True
                    sub["trial"] = False
                    changed = True
                    print(f"[체험→활성] {sub['name']} — 시작일({sub['start_date']}) 경과")

            # 변경예약: effective_date가 지났으면 자동 적용
            sc = sub.get("scheduled_change")
            if sc and today >= sc.get("effective_date", ""):
                old_name = sub["name"]
                sub["name"] = sc.get("name", sub["name"])
                sub["price"] = sc.get("price", sub["price"])
                sub["currency"] = sc.get("currency", sub["currency"])
                sub["scheduled_change"] = None
                changed = True
                print(f"[변경 적용] {old_name} → {sub['name']} (${sub['price']})")

        if changed:
            save_subscriptions(subscriptions)
            print(f"[상태 체크 완료] {today} — 변경사항 저장됨")
        else:
            print(f"[상태 체크 완료] {today} — 변경 없음")
            
        # 가계부 연동 실행
        sync_fixed_costs_to_ledger(subscriptions, today)
    except Exception as e:
        print(f"[상태 체크 실패] {e}")

def sync_fixed_costs_to_ledger(subscriptions, today_str):
    """오늘 날짜 기준으로 결제일이 도래한 고정비를 가계부에 자동 기록"""
    try:
        from backend.ledger import get_transactions, create_transaction, TransactionModel
        txns = get_transactions()
        
        # 이미 연동된 내역 확인 (중복 방지)
        synced_set = set()
        for t in txns:
            if t.get("linked_subscription_id"):
                synced_set.add((t["linked_subscription_id"], t["date"]))

        today = date.today()
        # today_str is yyyy-mm-dd
        
        for sub in subscriptions:
            if not sub.get("active"): continue
            sub_id = sub.get("id")
            if not sub_id: continue

            should_pay_today = False
            
            # AI 구독 혹은 next_billing이 있는 경우
            if sub.get("next_billing"):
                if sub["next_billing"] == today_str:
                    should_pay_today = True
            # 일반 고정비 (주기 기반)
            elif sub.get("billing_cycle"):
                start_date_str = sub.get("start_date")
                if not start_date_str: continue
                try:
                    sd = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                    if today >= sd:
                        if sub["billing_cycle"] == "매월" and today.day == sd.day:
                            should_pay_today = True
                        elif sub["billing_cycle"] == "매년" and today.month == sd.month and today.day == sd.day:
                            should_pay_today = True
                        elif sub["billing_cycle"] == "매주" and today.weekday() == sd.weekday():
                            should_pay_today = True
                        elif sub["billing_cycle"] == "매일":
                            should_pay_today = True
                except Exception:
                    pass
            
            if should_pay_today:
                if (sub_id, today_str) not in synced_set:
                    txn = TransactionModel(
                        type="expense",
                        date=today_str,
                        amount=sub["price"],
                        currency=sub.get("currency", "KRW"),
                        category_medium="고정지출" if sub.get("category") != "AI 구독료" else "구독/IT",
                        category_small=sub.get("category", "정기구독"),
                        description=sub["name"],
                        linked_subscription_id=sub_id,
                        icon=sub.get("icon", "💸")
                    )
                    create_transaction(txn)
                    synced_set.add((sub_id, today_str))
                    print(f"[가계부 자동 연동 완료] {sub['name']} ({today_str})")
                    
    except Exception as e:
        print(f"[가계부 연동 로직 실패] {e}")


# ─── 환율 캐시 ───────────────────────────────────────────
EXCHANGE_RATE_FILE = DATA_DIR / "exchange_rate.json"

async def fetch_and_save_exchange_rate():
    """frankfurter.app에서 USD→KRW 환율 조회 후 저장"""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get("https://api.frankfurter.app/latest?from=USD&to=KRW")
            res.raise_for_status()
            data = res.json()
            rate = data["rates"]["KRW"]
            cache = {
                "rate": rate,
                "date": str(date.today()),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            with open(EXCHANGE_RATE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            print(f"[환율 업데이트] 1 USD = {rate} KRW ({cache['updated_at']})")
            return rate
    except Exception as e:
        print(f"[환율 조회 실패] {e}")
        return None

@app.get("/api/exchange-rate")
async def get_exchange_rate():
    """환율 반환 — 오늘 캐시 있으면 캐시 사용, 없으면 즉시 조회"""
    # 캐시 확인
    if EXCHANGE_RATE_FILE.exists():
        with open(EXCHANGE_RATE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
        if cache.get("date") == str(date.today()):
            return {"rate": cache["rate"], "date": cache["date"], "source": "cache"}

    # 캐시 없으면 즉시 조회
    rate = await fetch_and_save_exchange_rate()
    if rate:
        return {"rate": rate, "date": str(date.today()), "source": "live"}
    raise HTTPException(status_code=503, detail="환율 조회 실패")

# ─── 스케줄러 (환율 + 구독 상태 자동 체크) ────────────────
@app.on_event("startup")
async def start_scheduler():
    # 서버 시작 시 구독 상태 1회 체크
    check_subscription_status()
    # 가계부 기본 데이터 초기화
    init_ledger_data()

    scheduler = AsyncIOScheduler(timezone="Asia/Seoul")
    # 매일 오후 4시: 환율 자동 조회
    scheduler.add_job(
        fetch_and_save_exchange_rate,
        trigger="cron",
        hour=16,
        minute=0,
        id="daily_exchange_rate"
    )
    # 매일 자정: 구독 상태 자동 체크 (해지예약 만료, 체험 활성화)
    scheduler.add_job(
        check_subscription_status,
        trigger="cron",
        hour=0,
        minute=5,
        id="daily_subscription_check"
    )
    scheduler.start()
    print("[스케줄러 시작] 환율(16시) + 구독상태(00시) 자동 체크")
