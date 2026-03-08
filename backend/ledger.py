"""
가계부 (Household Account Book) Backend Module
─────────────────────────────────────────────
Provides: Transaction CRUD, Asset management, Category management,
          Excel/CSV upload with rule-based auto-categorization,
          Multi-currency exchange rate (KRW/USD/JPY).
"""

import csv
import io
import json
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

# ─── Data Directory ───────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
ASSETS_FILE = DATA_DIR / "assets.json"
CATEGORIES_FILE = DATA_DIR / "categories.json"
CATEGORIZATION_RULES_FILE = DATA_DIR / "categorization_rules.json"
EXCHANGE_RATES_FILE = DATA_DIR / "exchange_rates.json"
BUDGETS_FILE = DATA_DIR / "budgets.json"

router = APIRouter(prefix="/api/ledger", tags=["ledger"])

# ═══════════════════════════════════════════════════════════
# 1. PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════

class TransactionModel(BaseModel):
    id: Optional[str] = None
    type: str  # income / expense / transfer
    date: str  # YYYY-MM-DD
    amount: float
    currency: str = "KRW"
    applied_exchange_rate: Optional[float] = None  # 입력 시점 고정 환율
    category_medium: str = ""  # 중분류
    category_small: str = ""   # 소분류
    payment_method_id: Optional[str] = None  # 자산 ID
    description: str = ""
    memo: str = ""
    icon: Optional[str] = None  # 이모지/스티커
    linked_subscription_id: Optional[str] = None
    created_at: Optional[str] = None


class AssetModel(BaseModel):
    id: Optional[str] = None
    name: str
    type: str  # account / credit_card / debit_card / cash / e_wallet
    icon: Optional[str] = None  # 이모지
    memo: str = ""


class BudgetModel(BaseModel):
    id: Optional[str] = None
    month: str  # YYYY-MM
    amount: float
    currency: str = "KRW"


class CategorizationRuleModel(BaseModel):
    keyword: str
    category_medium: str
    category_small: str


# ═══════════════════════════════════════════════════════════
# 2. DEFAULT DATA (카테고리 프리셋 - 웹 검색 기반)
# ═══════════════════════════════════════════════════════════

DEFAULT_CATEGORIES = {
    "income": {
        "급여": ["본봉", "상여금", "성과급", "수당"],
        "부수입": ["아르바이트", "프리랜서", "강사료"],
        "금융소득": ["이자", "배당금", "투자수익"],
        "기타수입": ["용돈", "선물", "환급금", "중고판매"]
    },
    "expense": {
        "식비": ["식료품", "외식", "배달", "카페/간식"],
        "주거/통신": ["월세", "관리비", "공과금", "통신비", "인터넷"],
        "교통/차량": ["대중교통", "택시", "주유비", "주차비", "차량정비"],
        "생활용품": ["생필품", "세제/위생", "가전/가구"],
        "의류/미용": ["의류", "신발/가방", "미용/화장품", "네일/헤어"],
        "건강/의료": ["병원비", "약값", "건강검진", "영양제", "운동"],
        "문화/여가": ["영화/공연", "여행", "취미", "구독서비스", "게임"],
        "교육": ["학원비", "교재", "온라인강의", "자격증"],
        "경조사/선물": ["축의금", "부의금", "선물"],
        "금융/보험": ["저축", "보험료", "대출상환", "투자"],
        "반려동물": ["사료/간식", "병원비", "용품"],
        "기타지출": ["예비비", "세금", "기부"]
    },
    "transfer": {
        "이체": ["계좌이체", "적금이체", "투자이체"]
    }
}

DEFAULT_CATEGORIZATION_RULES = [
    {"keyword": "스타벅스", "category_medium": "식비", "category_small": "카페/간식"},
    {"keyword": "메가커피", "category_medium": "식비", "category_small": "카페/간식"},
    {"keyword": "투썸", "category_medium": "식비", "category_small": "카페/간식"},
    {"keyword": "이디야", "category_medium": "식비", "category_small": "카페/간식"},
    {"keyword": "배달의민족", "category_medium": "식비", "category_small": "배달"},
    {"keyword": "쿠팡이츠", "category_medium": "식비", "category_small": "배달"},
    {"keyword": "요기요", "category_medium": "식비", "category_small": "배달"},
    {"keyword": "쿠팡", "category_medium": "생활용품", "category_small": "생필품"},
    {"keyword": "네이버페이", "category_medium": "생활용품", "category_small": "생필품"},
    {"keyword": "다이소", "category_medium": "생활용품", "category_small": "생필품"},
    {"keyword": "올리브영", "category_medium": "의류/미용", "category_small": "미용/화장품"},
    {"keyword": "무신사", "category_medium": "의류/미용", "category_small": "의류"},
    {"keyword": "지그재그", "category_medium": "의류/미용", "category_small": "의류"},
    {"keyword": "CGV", "category_medium": "문화/여가", "category_small": "영화/공연"},
    {"keyword": "메가박스", "category_medium": "문화/여가", "category_small": "영화/공연"},
    {"keyword": "롯데시네마", "category_medium": "문화/여가", "category_small": "영화/공연"},
    {"keyword": "넷플릭스", "category_medium": "문화/여가", "category_small": "구독서비스"},
    {"keyword": "유튜브", "category_medium": "문화/여가", "category_small": "구독서비스"},
    {"keyword": "카카오T", "category_medium": "교통/차량", "category_small": "택시"},
    {"keyword": "타다", "category_medium": "교통/차량", "category_small": "택시"},
    {"keyword": "GS칼텍스", "category_medium": "교통/차량", "category_small": "주유비"},
    {"keyword": "SK에너지", "category_medium": "교통/차량", "category_small": "주유비"},
    {"keyword": "교보문고", "category_medium": "교육", "category_small": "교재"},
    {"keyword": "알라딘", "category_medium": "교육", "category_small": "교재"},
    {"keyword": "급여", "category_medium": "급여", "category_small": "본봉"},
    {"keyword": "월급", "category_medium": "급여", "category_small": "본봉"},
    {"keyword": "상여", "category_medium": "급여", "category_small": "상여금"},
]

DEFAULT_ASSETS = [
    {"id": "cash", "name": "현금", "type": "cash", "icon": "💵", "memo": ""},
    {"id": "main_account", "name": "주거래 통장", "type": "account", "icon": "🏦", "memo": ""},
    {"id": "credit_card", "name": "신용카드", "type": "credit_card", "icon": "💳", "memo": ""},
    {"id": "debit_card", "name": "체크카드", "type": "debit_card", "icon": "💳", "memo": ""},
]

# ═══════════════════════════════════════════════════════════
# 3. FILE I/O HELPERS
# ═══════════════════════════════════════════════════════════

def _load_json(filepath: Path, default=None):
    if default is None:
        default = []
    if not filepath.exists():
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(default, f, ensure_ascii=False, indent=2)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(filepath: Path, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# Initialize default files
def init_ledger_data():
    """Initialize default data files if they don't exist."""
    if not CATEGORIES_FILE.exists():
        _save_json(CATEGORIES_FILE, DEFAULT_CATEGORIES)
    if not CATEGORIZATION_RULES_FILE.exists():
        _save_json(CATEGORIZATION_RULES_FILE, DEFAULT_CATEGORIZATION_RULES)
    if not ASSETS_FILE.exists():
        _save_json(ASSETS_FILE, DEFAULT_ASSETS)
    if not TRANSACTIONS_FILE.exists():
        _save_json(TRANSACTIONS_FILE, [])
    if not BUDGETS_FILE.exists():
        _save_json(BUDGETS_FILE, [])


# ═══════════════════════════════════════════════════════════
# 4. EXCHANGE RATE (Multi-Currency: KRW, USD, JPY)
# ═══════════════════════════════════════════════════════════

async def fetch_all_exchange_rates():
    """Fetch USD→KRW, USD→JPY, JPY→KRW rates."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get("https://api.frankfurter.app/latest?from=USD&to=KRW,JPY")
            res.raise_for_status()
            data = res.json()
            rates = {
                "USD_KRW": data["rates"]["KRW"],
                "USD_JPY": data["rates"]["JPY"],
                "JPY_KRW": data["rates"]["KRW"] / data["rates"]["JPY"],
                "base": "USD",
                "date": str(date.today()),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            _save_json(EXCHANGE_RATES_FILE, rates)
            return rates
    except Exception as e:
        print(f"[환율 조회 실패] {e}")
        return None


@router.get("/exchange-rates")
async def get_exchange_rates(refresh: bool = False):
    """Multi-currency exchange rates (USD, KRW, JPY)."""
    if not refresh and EXCHANGE_RATES_FILE.exists():
        cached = _load_json(EXCHANGE_RATES_FILE, {})
        if cached.get("date") == str(date.today()):
            return {"status": "success", "data": cached, "source": "cache"}
    rates = await fetch_all_exchange_rates()
    if rates:
        return {"status": "success", "data": rates, "source": "live"}
    # Fallback to cached
    if EXCHANGE_RATES_FILE.exists():
        cached = _load_json(EXCHANGE_RATES_FILE, {})
        return {"status": "success", "data": cached, "source": "stale_cache"}
    raise HTTPException(status_code=503, detail="환율 조회 실패")


# ═══════════════════════════════════════════════════════════
# 5. CATEGORIES CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/categories")
async def get_categories():
    return {"status": "success", "data": _load_json(CATEGORIES_FILE, DEFAULT_CATEGORIES)}


@router.put("/categories")
async def update_categories(categories: dict):
    _save_json(CATEGORIES_FILE, categories)
    return {"status": "success", "data": categories}


# ═══════════════════════════════════════════════════════════
# 6. ASSETS CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/assets")
async def get_assets():
    return {"status": "success", "data": _load_json(ASSETS_FILE, DEFAULT_ASSETS)}


@router.post("/assets")
async def create_asset(asset: AssetModel):
    assets = _load_json(ASSETS_FILE, [])
    new_asset = asset.model_dump()
    new_asset["id"] = str(uuid.uuid4())
    assets.append(new_asset)
    _save_json(ASSETS_FILE, assets)
    return {"status": "success", "data": new_asset}


@router.put("/assets/{asset_id}")
async def update_asset(asset_id: str, asset: AssetModel):
    assets = _load_json(ASSETS_FILE, [])
    for i, a in enumerate(assets):
        if a["id"] == asset_id:
            updated = asset.model_dump()
            updated["id"] = asset_id
            assets[i] = updated
            _save_json(ASSETS_FILE, assets)
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다.")


@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    assets = _load_json(ASSETS_FILE, [])
    filtered = [a for a in assets if a["id"] != asset_id]
    if len(filtered) == len(assets):
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다.")
    _save_json(ASSETS_FILE, filtered)
    return {"status": "success"}


# ═══════════════════════════════════════════════════════════
# 7. TRANSACTIONS CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/transactions")
async def get_transactions(month: Optional[str] = None):
    """Get transactions, optionally filtered by month (YYYY-MM)."""
    txns = _load_json(TRANSACTIONS_FILE, [])
    if month:
        txns = [t for t in txns if t.get("date", "").startswith(month)]
    txns.sort(key=lambda x: x.get("date", ""), reverse=True)
    return {"status": "success", "data": txns}


@router.post("/transactions")
async def create_transaction(txn: TransactionModel):
    txns = _load_json(TRANSACTIONS_FILE, [])
    new_txn = txn.model_dump()
    new_txn["id"] = str(uuid.uuid4())
    new_txn["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    txns.append(new_txn)
    _save_json(TRANSACTIONS_FILE, txns)
    return {"status": "success", "data": new_txn}


@router.post("/transactions/bulk")
async def create_transactions_bulk(txns: List[TransactionModel]):
    """Bulk insert transactions (from Excel confirm)."""
    existing = _load_json(TRANSACTIONS_FILE, [])
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_list = []
    for txn in txns:
        d = txn.model_dump()
        d["id"] = str(uuid.uuid4())
        d["created_at"] = now
        new_list.append(d)
    existing.extend(new_list)
    _save_json(TRANSACTIONS_FILE, existing)
    return {"status": "success", "count": len(new_list)}


@router.put("/transactions/{txn_id}")
async def update_transaction(txn_id: str, txn: TransactionModel):
    txns = _load_json(TRANSACTIONS_FILE, [])
    for i, t in enumerate(txns):
        if t["id"] == txn_id:
            updated = txn.model_dump()
            updated["id"] = txn_id
            updated["created_at"] = t.get("created_at")
            txns[i] = updated
            _save_json(TRANSACTIONS_FILE, txns)
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="내역을 찾을 수 없습니다.")


@router.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str):
    txns = _load_json(TRANSACTIONS_FILE, [])
    filtered = [t for t in txns if t["id"] != txn_id]
    if len(filtered) == len(txns):
        raise HTTPException(status_code=404, detail="내역을 찾을 수 없습니다.")
    _save_json(TRANSACTIONS_FILE, filtered)
    return {"status": "success"}


# ═══════════════════════════════════════════════════════════
# 8. BUDGETS CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/budgets")
async def get_budgets():
    return {"status": "success", "data": _load_json(BUDGETS_FILE, [])}


@router.post("/budgets")
async def upsert_budget(budget: BudgetModel):
    """Insert or update budget for a given month."""
    budgets = _load_json(BUDGETS_FILE, [])
    for i, b in enumerate(budgets):
        if b["month"] == budget.month:
            updated = budget.model_dump()
            updated["id"] = b["id"]
            budgets[i] = updated
            _save_json(BUDGETS_FILE, budgets)
            return {"status": "success", "data": updated}
    new_b = budget.model_dump()
    new_b["id"] = str(uuid.uuid4())
    budgets.append(new_b)
    _save_json(BUDGETS_FILE, budgets)
    return {"status": "success", "data": new_b}


# ═══════════════════════════════════════════════════════════
# 9. CATEGORIZATION RULES
# ═══════════════════════════════════════════════════════════

@router.get("/categorization-rules")
async def get_rules():
    return {"status": "success", "data": _load_json(CATEGORIZATION_RULES_FILE, DEFAULT_CATEGORIZATION_RULES)}


@router.put("/categorization-rules")
async def update_rules(rules: List[CategorizationRuleModel]):
    data = [r.model_dump() for r in rules]
    _save_json(CATEGORIZATION_RULES_FILE, data)
    return {"status": "success", "data": data}


# ═══════════════════════════════════════════════════════════
# 10. EXCEL / CSV UPLOAD & AUTO-CATEGORIZATION
# ═══════════════════════════════════════════════════════════

def _auto_categorize(description: str, rules: List[dict]) -> dict:
    """Match description text against keyword rules."""
    desc_lower = description.lower()
    for rule in rules:
        if rule["keyword"].lower() in desc_lower:
            return {"category_medium": rule["category_medium"], "category_small": rule["category_small"]}
    return {"category_medium": "기타지출", "category_small": "예비비"}


def _parse_csv_rows(text: str) -> List[dict]:
    """Parse CSV text into list of dicts."""
    reader = csv.reader(io.StringIO(text))
    raw_rows = list(reader)
    if not raw_rows:
        return []

    # Find header row using substring matching on common banking keywords
    keywords = ["날짜", "거래일", "일자", "일시", "date", "금액", "출금", "입금", "내용", "적요", "거래처", "메모", "기재", "내역", "수취", "찾으", "맡기"]
    header_idx = 0
    for idx, row in enumerate(raw_rows):
        matches = 0
        for cell in row:
            val = str(cell).strip().lower()
            if any(k in val for k in keywords):
                matches += 1
        if matches >= 2:
            header_idx = idx
            break

    header_row = raw_rows[header_idx]
    headers = [str(h).strip() if h not in (None, "") else f"col_{i}" for i, h in enumerate(header_row)]

    result = []
    for row in raw_rows[header_idx + 1:]:
        if all(cell in (None, "") for cell in row):
            continue
        row_dict = {}
        for i, h in enumerate(headers):
            val = row[i] if i < len(row) else ""
            row_dict[h] = str(val).strip() if val not in (None, "") else ""
        result.append(row_dict)
    
    return result


def _parse_xlsx_rows(file_bytes: bytes, ext: str) -> List[dict]:
    """Parse Excel file bytes (.xlsx or .xls) into list of dicts."""
    import io
    if ext == "xls":
        import xlrd
        wb = xlrd.open_workbook(file_contents=file_bytes)
        ws = wb.sheet_by_index(0)
        raw_rows = []
        for row_idx in range(ws.nrows):
            raw_rows.append([cell.value for cell in ws.row(row_idx)])
    else:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
        ws = wb.active
        raw_rows = list(ws.iter_rows(values_only=True))

    if not raw_rows:
        return []

    # Find header row using substring matching on common banking keywords
    keywords = ["날짜", "거래일", "일자", "일시", "date", "금액", "출금", "입금", "내용", "적요", "거래처", "메모", "기재", "내역", "수취", "찾으", "맡기"]
    header_idx = 0
    for idx, row in enumerate(raw_rows):
        matches = 0
        for cell in row:
            val = str(cell).strip().lower()
            if any(k in val for k in keywords):
                matches += 1
        if matches >= 2:
            header_idx = idx
            break

    header_row = raw_rows[header_idx]
    headers = [str(h).strip() if h not in (None, "") else f"col_{i}" for i, h in enumerate(header_row)]

    result = []
    for row in raw_rows[header_idx + 1:]:
        if all(cell in (None, "") for cell in row):
            continue
        # Make sure row has same length as headers
        row_dict = {}
        for i, h in enumerate(headers):
            val = row[i] if i < len(row) else ""
            row_dict[h] = str(val).strip() if val not in (None, "") else ""
        result.append(row_dict)
    
    return result


def _normalize_row_to_transaction(row: dict, rules: List[dict]) -> dict:
    """
    Normalize a raw Excel/CSV row to a transaction dict.
    Tries common column name patterns (날짜, 금액, 내용, 적요 etc.).
    """
    # Find date
    date_val = ""
    for key in row.keys():
        kl = key.lower()
        if any(x in kl for x in ["날짜", "거래일", "일자", "일시", "date", "취급일"]):
            if row[key]:
                # yyyy-mm-dd...
                date_val = str(row[key])[:10].replace('.', '-').replace('/', '-')
                break

    # Determine income/expense and amount
    tx_type = "expense"
    amount = 0.0

    # Checking for separate Income/Outcome columns first (e.g., 출금, 입금)
    for key in row.keys():
        kl = key.lower()
        if any(x in kl for x in ["입금", "맡기", "deposit", "in"]):
            if row[key]:
                try:
                    val = float(str(row[key]).replace(",", "").replace("원", "").replace("₩", "").strip())
                    if val > 0:
                        tx_type = "income"
                        amount = val
                        break
                except ValueError:
                    pass
        elif any(x in kl for x in ["출금", "찾으", "지출", "withdrawal", "out"]):
            if row[key]:
                try:
                    val = float(str(row[key]).replace(",", "").replace("원", "").replace("₩", "").strip())
                    if val > 0:
                        tx_type = "expense"
                        amount = val
                        break
                except ValueError:
                    pass

    # If amount is still 0, check for a single 'Amount' column
    if amount == 0.0:
        for key in row.keys():
            kl = key.lower()
            if any(x in kl for x in ["금액", "거래금액", "amount"]):
                if row[key]:
                    try:
                        amt_str = str(row[key]).replace(",", "").replace("원", "").replace("₩", "").strip()
                        # Sometimes - denotes expense in a single column
                        if amt_str.startswith("-"):
                            tx_type = "expense"
                            amount = abs(float(amt_str))
                        else:
                            # Default to expense unless positive explicitly means income 
                            # (but some banks show positive for single column expense)
                            val = abs(float(amt_str))
                            amount = val
                        break
                    except ValueError:
                        pass

    # Find description
    description_parts = []
    for key in row.keys():
        kl = key.lower()
        if any(x in kl for x in ["내용", "적요", "거래처", "메모", "비고", "내역", "기재", "수취", "보낸", "받는", "송금", "description"]):
            val_str = str(row[key]).strip()
            if val_str and val_str not in description_parts:
                description_parts.append(val_str)
    description = " ".join(description_parts).strip()

    cats = _auto_categorize(description, rules)

    return {
        "type": tx_type,
        "date": date_val,
        "amount": amount,
        "currency": "KRW",
        "category_medium": cats["category_medium"],
        "category_small": cats["category_small"],
        "description": description,
        "memo": "",
        "icon": None,
        "payment_method_id": None,
        "applied_exchange_rate": None,
        "linked_subscription_id": None,
    }


@router.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload an Excel/CSV file. Returns auto-categorized preview (NOT saved yet).
    User must confirm via POST /transactions/bulk to actually save.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    content = await file.read()

    if ext == "csv":
        text = content.decode("utf-8-sig")
        rows = _parse_csv_rows(text)
    elif ext in ("xlsx", "xls"):
        rows = _parse_xlsx_rows(content, ext)
    else:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다. (.csv, .xlsx, .xls)")

    if not rows:
        raise HTTPException(status_code=400, detail="빈 파일이거나 데이터를 읽을 수 없습니다.")

    rules = _load_json(CATEGORIZATION_RULES_FILE, DEFAULT_CATEGORIZATION_RULES)
    preview = [_normalize_row_to_transaction(row, rules) for row in rows]
    # Filter out rows with no date or amount
    preview = [p for p in preview if p["date"] and p["amount"] > 0]

    return {
        "status": "success",
        "count": len(preview),
        "columns_detected": list(rows[0].keys()) if rows else [],
        "preview": preview
    }


# ═══════════════════════════════════════════════════════════
# DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════

class DashboardSummaryRequest(BaseModel):
    month: str  # YYYY-MM format
    currencies: Optional[List[str]] = ["KRW"]


@router.post("/dashboard-summary")
async def get_dashboard_summary(request: DashboardSummaryRequest):
    """
    Get aggregated dashboard summary for a given month.
    Includes: total assets, income, expenses, categories, daily breakdown
    """
    try:
        month = request.month  # YYYY-MM
        transactions = _load_json(TRANSACTIONS_FILE, [])

        # Filter transactions for the given month
        monthly_transactions = [
            txn for txn in transactions
            if txn.get("date", "").startswith(month)
        ]

        # Calculate summary metrics
        total_income = 0
        total_expense = 0
        category_breakdown = {}
        daily_breakdown = {}

        for txn in monthly_transactions:
            amount = txn.get("amount", 0)
            txn_type = txn.get("type", "")
            date = txn.get("date", "")
            category = txn.get("category_medium", "기타")

            if txn_type == "income":
                total_income += amount
            elif txn_type == "expense":
                total_expense += amount

                # Track by category
                if category not in category_breakdown:
                    category_breakdown[category] = 0
                category_breakdown[category] += amount

                # Track by day
                if date not in daily_breakdown:
                    daily_breakdown[date] = {"income": 0, "expense": 0}
                daily_breakdown[date]["expense"] += amount

            if txn_type == "income" and date in daily_breakdown:
                daily_breakdown[date]["income"] += amount

        # Calculate total assets (sum of all transactions grouped by asset)
        total_assets = 0
        for txn in transactions:
            if txn.get("type") == "income":
                total_assets += txn.get("amount", 0)
            elif txn.get("type") == "expense":
                total_assets -= txn.get("amount", 0)

        # Format category breakdown
        category_list = [
            {"category": cat, "amount": amount, "percentage": round((amount / total_expense * 100), 1) if total_expense > 0 else 0}
            for cat, amount in sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)
        ]

        # Format daily breakdown
        daily_list = [
            {"date": date, "income": data["income"], "expense": data["expense"]}
            for date, data in sorted(daily_breakdown.items())
        ]

        return {
            "status": "success",
            "data": {
                "month": month,
                "summary": {
                    "total_assets": total_assets,
                    "monthly_income": total_income,
                    "monthly_expense": total_expense,
                    "monthly_balance": total_income - total_expense,
                    "fixed_costs_total": 0,  # Will be populated from subscriptions
                    "currency": "KRW"
                },
                "daily_breakdown": daily_list,
                "category_breakdown": category_list,
                "subscriptions_summary": {
                    "count": 0,
                    "active": 0,
                    "total_monthly_cost": 0,
                    "by_category": {}
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating dashboard summary: {str(e)}")
