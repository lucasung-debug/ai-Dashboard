# ai-Dashboard 상세 디자인 & 구현 가이드

> clear-coast-finance 레퍼런스 템플릿 분석을 토대로 작성

---

## 🎨 디자인 시스템 (Design System)

### 1. 색상 팔레트 (Radix Color Scale)

#### 기본 그레이스케일
```css
/* Light Mode (Slate) */
:root {
  --slate-1: #fcfcfd;    /* Background */
  --slate-2: #f8f9fa;    /* Surface */
  --slate-3: #f0f1f4;    /* Hover background */
  --slate-4: #e8eaed;    /* Border */
  --slate-9: #626a75;    /* Text secondary */
  --slate-12: #1a1d23;   /* Text primary */
}

/* Dark Mode (SlateD) */
:root.dark {
  --slate-1: #111113;    /* Background */
  --slate-2: #1a1b1f;    /* Surface */
  --slate-3: #25272d;    /* Hover background */
  --slate-4: #2e3038;    /* Border */
  --slateD-9: #9da3ad;   /* Text secondary */
  --slateD-12: #edeef0;  /* Text primary */
}
```

#### 의미론적 색상 (Semantic Colors)
```css
/* Primary (Blue) - 주요 액션 */
--primary-600: #3e63dd;  /* Light mode */
--primary-9: #5472e4;    /* Dark mode */
--primary-hover: #3c4dd5;

/* Success (Mint/Green) - 수입, 긍정 */
--success-11: #86ead4;
--success-12: #58d5ba;

/* Danger (Ruby/Red) - 지출, 경고 */
--danger-9: #e54666;
--danger-11: #ff9592;

/* Warning (Amber/Orange) - 주의, 이체 */
--warning-9: #ffc53d;
--warning-10: #ffba18;
```

#### Dark Mode 카드 배경
```css
/* fixed.html에서 사용하는 암색 */
--dark-bg: #0f172a;        /* 페이지 배경 */
--dark-card: #1e293b;      /* 카드 배경 */
--dark-border: #334155;    /* 테두리 색상 */
--dark-muted: #64748b;     /* 연한 텍스트 */
```

### 2. 타이포그래피 (Typography)

```css
/* Font Family */
body {
  font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* Font Sizes (TailwindCSS 시맨틱) */
.text-xs        { font-size: 0.75rem;   line-height: 1rem; }     /* 12px */
.text-sm        { font-size: 0.875rem;  line-height: 1.25rem; }  /* 14px */
.text-base      { font-size: 1rem;      line-height: 1.5rem; }   /* 16px */
.text-lg        { font-size: 1.125rem;  line-height: 1.75rem; }  /* 18px */
.text-xl        { font-size: 1.25rem;   line-height: 1.75rem; }  /* 20px */
.text-2xl       { font-size: 1.5rem;    line-height: 2rem; }     /* 24px */
.text-3xl       { font-size: 1.875rem;  line-height: 2.25rem; }  /* 30px */

/* Font Weights */
font-weight: 400;  /* Regular (기본) */
font-weight: 500;  /* Medium (버튼, 라벨) */
font-weight: 600;  /* Semibold (섹션 제목) */
font-weight: 700;  /* Bold (페이지 제목) */
```

### 3. 간격 시스템 (Spacing Scale)

```css
/* Tailwind Spacing (4px 기반) */
4px  (p-1, m-1)
8px  (p-2, m-2)
12px (p-3, m-3)
16px (p-4, m-4)
20px (p-5, m-5)
24px (p-6, m-6)
32px (p-8, m-8)
40px (p-10, m-10)
48px (p-12, m-12)

/* 특정 용도 */
gap-3:   12px (카테고리 요약 카드 그리드)
gap-4:   16px (일반 그리드)
gap-6:   24px (메인 섹션 간)
```

### 4. Border Radius

```css
rounded-lg:   8px    /* 버튼, 입력창, 작은 요소 */
rounded-xl:   12px   /* 일부 카드, 모달 내부 */
rounded-2xl:  16px   /* 메인 카드, 대형 요소 */
rounded-full: 50%    /* 필 모양 버튼, 아바타 */

/* Mobile 모달 특수 */
border-radius: 20px 20px 0 0;  /* 모바일 바텀시트 (위만 둥근 모서리) */
border-radius: 16px;            /* 데스크탑 모달 (모든 모서리) */
```

---

## 🧩 컴포넌트 패턴

### 1. Card Component

```html
<!-- 기본 카드 -->
<div class="bg-white dark:bg-slate-2 rounded-2xl p-5
            border border-slate-4 dark:border-slate-4
            shadow-sm">
  <!-- 컨텐츠 -->
</div>

<!-- 상호작용 카드 (호버 효과) -->
<div class="bg-white dark:bg-dark-card rounded-xl p-5
            border border-gray-200 dark:border-dark-border
            shadow-sm transition-colors
            hover:border-gray-300 dark:hover:border-dark-muted/50">
  <!-- 컨텐츠 -->
</div>

<!-- 경고/강조 카드 (상단 색상 바) -->
<div class="bg-white dark:bg-dark-card rounded-xl p-5
            border border-gray-200 dark:border-dark-border
            relative overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-0.5
              bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
  <!-- 컨텐츠 -->
</div>
```

### 2. Button Component

```html
<!-- Primary Button -->
<button class="bg-primary-600 hover:bg-primary-500
               text-white px-3 py-1.5 rounded-lg
               text-xs font-medium transition-colors
               disabled:opacity-50 disabled:cursor-not-allowed">
  액션
</button>

<!-- Secondary Button -->
<button class="bg-slate-3 dark:bg-slateD-4
               text-slate-12 dark:text-slateD-12
               px-3 py-1.5 rounded-lg text-xs font-medium
               hover:bg-slate-4 dark:hover:bg-slateD-5
               transition-colors">
  보조 액션
</button>

<!-- Ghost Button (아이콘 버튼) -->
<button class="p-2 rounded-lg
               hover:bg-slate-3 dark:hover:bg-slateD-3
               transition-colors">
  <svg class="w-5 h-5"></svg>
</button>

<!-- Tab Button -->
<button class="px-4 py-2 text-sm font-medium
               border-b-2 border-primary-500
               text-slate-12 dark:text-slateD-12">
  활성 탭
</button>
<button class="px-4 py-2 text-sm font-medium
               border-b-2 border-transparent
               text-slate-9 dark:text-slateD-9
               hover:text-slate-12 dark:hover:text-slateD-12">
  비활성 탭
</button>

<!-- Pill/Filter Button -->
<button class="px-3 py-1.5 rounded-full
               bg-primary-9 text-white font-medium">
  활성
</button>
<button class="px-3 py-1.5 rounded-full
               bg-slate-3 dark:bg-slateD-4
               text-slate-12 dark:text-slateD-12">
  비활성
</button>
```

### 3. Modal Component

```html
<!-- Modal 전체 구조 -->
<div id="modal-name"
     class="modal-overlay hidden"
     onclick="if(event.target===this) closeModal('modal-name')">

  <!-- 모바일: 바텀시트, 데스크탑: 중앙 모달 -->
  <div class="modal-body bg-white dark:bg-slate-2
              border-t md:border md:border-slate-4
              dark:md:border-slateD-4
              rounded-t-[20px] md:rounded-2xl
              anim-slide-up md:anim-fade">

    <!-- 헤더 (선택사항) -->
    <div class="flex justify-between items-center
                p-5 border-b border-slate-4 dark:border-slateD-4">
      <h2 class="text-lg font-bold">제목</h2>
      <button onclick="closeModal('modal-name')"
              class="p-2 rounded-lg hover:bg-slate-3 dark:hover:bg-slateD-3">
        ✕
      </button>
    </div>

    <!-- 바디 (스크롤 가능) -->
    <div class="p-5 space-y-4 max-h-[80vh] md:max-h-none overflow-y-auto">
      <!-- 폼 필드 등 -->
    </div>

    <!-- 푸터 (액션 버튼) -->
    <div class="flex gap-3 p-5 border-t border-slate-4 dark:border-slateD-4
                sticky bottom-0 bg-white dark:bg-slate-2">
      <button onclick="closeModal('modal-name')"
              class="flex-1 ... secondary-button">취소</button>
      <button onclick="saveForm()"
              class="flex-1 ... primary-button">저장</button>
    </div>
  </div>
</div>

<!-- CSS 스타일 -->
<style>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  backdrop-filter: blur(4px);
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
  }
}

.modal-body {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .modal-body {
    border-radius: 16px;
    max-height: 80vh;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-slide-up {
  animation: slideUp 0.25s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-fade {
  animation: fadeInUp 0.3s ease-out forwards;
}
</style>
```

### 4. Form Input Component

```html
<!-- Text Input -->
<div class="space-y-1">
  <label class="text-xs font-medium text-slate-9 dark:text-slateD-9">레이블</label>
  <input type="text"
         placeholder="입력하세요..."
         class="w-full bg-white dark:bg-slate-2
                border border-slate-4 dark:border-slateD-4
                text-slate-12 dark:text-slateD-12
                text-sm rounded-lg p-2.5
                outline-none
                focus:border-primary-500
                placeholder-slate-9/50 dark:placeholder-slateD-9/50
                transition-colors">
</div>

<!-- Searchable Select (with datalist) -->
<div class="space-y-1">
  <label class="text-xs font-medium">카테고리</label>
  <input list="categories-list"
         placeholder="검색..."
         class="w-full bg-white dark:bg-slate-2
                border border-slate-4 dark:border-slateD-4
                text-sm rounded-lg p-2.5
                outline-none focus:border-primary-500
                transition-colors">
  <datalist id="categories-list">
    <option value="AI 구독료">
    <option value="생산성">
    <option value="엔터테인먼트">
  </datalist>
</div>

<!-- Number Input -->
<input type="number"
       placeholder="0"
       inputmode="decimal"
       step="0.01"
       class="w-full bg-white dark:bg-slate-2
              border border-slate-4 dark:border-slateD-4
              text-sm rounded-lg p-2.5
              outline-none focus:border-primary-500
              transition-colors">

<!-- Date Input -->
<input type="date"
       class="w-full bg-white dark:bg-slate-2
              border border-slate-4 dark:border-slateD-4
              text-sm rounded-lg p-2.5
              outline-none focus:border-primary-500
              transition-colors">
```

### 5. Data Display Components

#### KPI Cards (요약 지표)
```html
<div class="grid grid-cols-3 gap-3">
  <div class="bg-white dark:bg-slate-2 rounded-2xl p-4
              border border-slate-4 dark:border-slateD-4">
    <p class="text-[11px] font-medium text-success-11 mb-1">수입</p>
    <p class="text-lg font-bold text-success-12 tabular-nums">₩0</p>
  </div>

  <div class="bg-white dark:bg-slate-2 rounded-2xl p-4
              border border-slate-4 dark:border-slateD-4">
    <p class="text-[11px] font-medium text-danger-9 mb-1">지출</p>
    <p class="text-lg font-bold text-danger-11 tabular-nums">₩0</p>
  </div>

  <div class="bg-white dark:bg-slate-2 rounded-2xl p-4
              border border-slate-4 dark:border-slateD-4">
    <p class="text-[11px] font-medium text-primary-9 mb-1">잔액</p>
    <p class="text-lg font-bold text-slate-12 dark:text-slateD-12 tabular-nums">₩0</p>
  </div>
</div>
```

#### Progress Bar
```html
<div>
  <div class="flex justify-between items-center mb-2">
    <p class="text-xs font-medium">예산</p>
    <p class="text-xs text-slate-9 dark:text-slateD-9">0 / 3,000,000</p>
  </div>
  <div class="w-full bg-slate-3 dark:bg-slateD-3 rounded-full h-3 mb-1.5">
    <div class="h-3 rounded-full bg-primary-9 transition-all" style="width: 0%"></div>
  </div>
</div>
```

#### Table (Transaction List)
```html
<table class="w-full text-xs">
  <thead class="text-left text-slate-9 dark:text-slateD-9
                border-b border-slate-4 dark:border-slateD-4">
    <tr>
      <th class="p-2 font-medium">날짜</th>
      <th class="p-2 font-medium">설명</th>
      <th class="p-2 font-medium text-right">금액</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-slate-3 dark:border-slateD-3
               hover:bg-slate-2 dark:hover:bg-slateD-2
               transition-colors">
      <td class="p-2">2024-03-08</td>
      <td class="p-2">스타벅스</td>
      <td class="p-2 text-right text-danger-9">-₩5,000</td>
    </tr>
  </tbody>
</table>
```

### 6. Navigation Components

#### Horizontal Tab Navigation
```html
<nav class="flex gap-2 border-b border-slate-4 dark:border-slateD-4
            overflow-x-auto hide-scrollbar">
  <button onclick="switchTab('all')"
          class="px-4 py-2 text-sm font-medium
                 border-b-2 border-primary-500
                 text-slate-12 dark:text-slateD-12
                 whitespace-nowrap">
    전체
  </button>
  <button onclick="switchTab('ai')"
          class="px-4 py-2 text-sm font-medium
                 border-b-2 border-transparent
                 text-slate-9 dark:text-slateD-9
                 hover:text-slate-12 dark:hover:text-slateD-12
                 whitespace-nowrap transition-colors">
    AI 서비스
  </button>
</nav>

<!-- CSS: 스크롤바 숨기기 -->
<style>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
```

---

## 📐 레이아웃 패턴

### 1. 반응형 그리드 시스템

```html
<!-- 1 열 (모바일) → 2 열 (태블릿) → 4 열 (데스크탑) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="...card">Item 1</div>
  <div class="...card">Item 2</div>
  <div class="...card">Item 3</div>
  <div class="...card">Item 4</div>
</div>

<!-- 비대칭 그리드: 메인 콘텐츠 + 사이드바 -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2">
    <!-- 메인 콘텐츠 (더 큼) -->
  </div>
  <div class="lg:col-span-1">
    <!-- 사이드바 -->
  </div>
</div>

<!-- 2x2 차트 그리드 -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="...card h-64">차트 1</div>
  <div class="...card h-64">차트 2</div>
  <div class="...card h-64">차트 3</div>
  <div class="...card h-64">차트 4</div>
</div>
```

### 2. Flexbox Layouts

```html
<!-- 헤더: 제목 + 액션 -->
<div class="flex justify-between items-center">
  <h2 class="text-lg font-bold">제목</h2>
  <button class="...primary-button">+ 추가</button>
</div>

<!-- 카드 내부: 타이틀 + 값 -->
<div class="flex justify-between items-center mb-2">
  <p class="text-xs font-medium">라벨</p>
  <p class="text-sm text-primary-9">값</p>
</div>

<!-- 전체 높이 사용 -->
<div class="flex flex-col h-screen">
  <header class="flex-shrink-0 ...">헤더</header>
  <main class="flex-1 overflow-y-auto ...">메인 콘텐츠</main>
  <footer class="flex-shrink-0 ...">푸터</footer>
</div>
```

### 3. Mobile-First Responsive

```html
<!-- 모바일: 스택, 태블릿+: 행 -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="md:flex-1">좌측</div>
  <div class="md:flex-1">우측</div>
</div>

<!-- 모바일: 풀스크린, 데스크탑: 최대 너비 -->
<div class="w-full max-w-5xl mx-auto px-4">
  <!-- 콘텐츠 -->
</div>

<!-- 모바일: 하단 탭바 정렬, 데스크탑: 좌측 사이드바 -->
<div class="flex flex-col-reverse md:flex-row">
  <nav class="md:w-64 ...">탭/메뉴</nav>
  <main class="flex-1 ...">콘텐츠</main>
</div>
```

---

## 🎬 애니메이션 & 트랜지션

### Keyframe Animations

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-fade {
  animation: fadeInUp 0.3s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-slide-up {
  animation: slideUp 0.25s ease-out forwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.anim-pop-in {
  animation: popIn 0.2s ease-out forwards;
}
```

### Transition Utilities

```html
<!-- 색상 변화 (부드러운) -->
<button class="bg-slate-3 hover:bg-slate-4 transition-colors">

<!-- 모든 속성 변화 -->
<div class="w-0 hover:w-full transition-all duration-300">

<!-- 특정 속성만 (공간) -->
<div class="h-8 hover:h-12 transition-spacing">

<!-- 지연 애니메이션 (cascade) -->
<div class="opacity-0 transition-opacity delay-100 animate-on-load">
```

---

## 🔌 API 통합 패턴

### Fetch & Error Handling

```javascript
// 기본 패턴
async function fetchData(endpoint) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    showErrorNotification('데이터를 불러올 수 없습니다.');
    return null;
  }
}

// 데이터 조회
async function loadSubscriptions() {
  const data = await fetchData('/subscriptions');
  if (data) {
    allSubscriptions = data.data || [];
    renderUI();
  }
}

// 데이터 생성/수정
async function saveSubscription(subscription) {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: subscription.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (!res.ok) throw new Error('Save failed');

    const result = await res.json();
    allSubscriptions = result.data || [];
    closeModal('subscription-modal');
    showSuccessNotification('저장되었습니다.');
    renderUI();
  } catch (error) {
    showErrorNotification('저장에 실패했습니다.');
  }
}

// 데이터 삭제
async function deleteSubscription(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Delete failed');

    await loadSubscriptions();
    showSuccessNotification('삭제되었습니다.');
  } catch (error) {
    showErrorNotification('삭제에 실패했습니다.');
  }
}
```

### 상태 관리

```javascript
// 전역 상태
let allSubscriptions = [];
let currentTab = 'all';
let currentMonth = new Date().toISOString().slice(0, 7);
let exchangeRate = { rate: 1300, lastUpdated: null };

// 상태 업데이트
function updateGlobalState(key, value) {
  if (key === 'allSubscriptions') {
    allSubscriptions = value;
    localStorage.setItem('subscriptions', JSON.stringify(value));
  } else if (key === 'currentMonth') {
    currentMonth = value;
    sessionStorage.setItem('currentMonth', value);
  }
  renderUI();
}

// 로컬스토리지 활용
function loadFromStorage() {
  const saved = localStorage.getItem('subscriptions');
  if (saved) {
    try {
      allSubscriptions = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse stored data');
    }
  }
}

// 캐싱된 환율 (1시간)
async function fetchExchangeRate() {
  const now = Date.now();
  const cached = JSON.parse(localStorage.getItem('exchangeRate') || '{}');

  if (cached.lastUpdated && now - cached.lastUpdated < 3600000) {
    return cached.rate;  // 캐시 사용
  }

  // API에서 새로 조회
  const data = await fetchData('/exchange-rate');
  const rate = data?.rate || 1300;

  localStorage.setItem('exchangeRate', JSON.stringify({
    rate,
    lastUpdated: now
  }));

  return rate;
}
```

---

## 📱 모바일 UX 최적화

### 터치 대상 크기
```css
/* 최소 44x44px (Apple guideline) */
button, a {
  min-height: 44px;
  min-width: 44px;
  /* 또는 */
  padding: 12px 16px;  /* 44px 높이 보장 */
}

/* 입력 필드 */
input {
  min-height: 44px;
  padding: 10px 12px;
}
```

### Safe Area 고려
```css
/* iPhone 노치, 홈 인디케이터 대응 */
@supports (padding: max(0px)) {
  body {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .sticky-footer {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
}
```

### 하단 탭 네비게이션
```html
<nav class="fixed bottom-0 left-0 right-0
            border-t border-slate-4 dark:border-slateD-4
            bg-white dark:bg-slate-2
            md:hidden">  <!-- 모바일만 표시 -->
  <div class="flex justify-around">
    <button class="flex-1 py-3 text-center text-xs font-medium">
      <svg class="w-6 h-6 mx-auto mb-1"></svg>가계부
    </button>
    <button class="flex-1 py-3 text-center text-xs font-medium">
      <svg class="w-6 h-6 mx-auto mb-1"></svg>고정비
    </button>
  </div>
</nav>

<!-- 하단 탭을 위한 여백 -->
<main class="pb-20 md:pb-0">
  <!-- 콘텐츠 -->
</main>
```

### 플로팅 액션 버튼 (FAB)
```html
<!-- 고정된 하단 우측 -->
<button class="fixed bottom-24 right-6 md:bottom-10 md:right-10
               w-14 h-14 rounded-full
               bg-primary-600 hover:bg-primary-500
               text-white shadow-2xl
               flex items-center justify-center
               z-40">
  ➕
</button>

<!-- 또는: CSS로 구성 -->
<style>
.fab {
  position: fixed;
  bottom: 96px;  /* 모바일 탭 위 */
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-600);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 40;
  transition: all 0.3s ease;
}

.fab:hover {
  background: var(--primary-500);
  transform: scale(1.08);
}

@media (min-width: 768px) {
  .fab {
    bottom: 40px;
    right: 40px;
  }
}
</style>
```

---

## 🎨 다크 모드 구현

### CSS 변수 기반 다크모드

```html
<!-- HTML에 dark 클래스 추가 -->
<html class="dark">
  ...
</html>
```

```javascript
// 다크모드 토글
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');

  // 저장
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  // 시스템 테마와 동기화 (선택사항)
  if (isDark) {
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.style.colorScheme = 'light';
  }
}

// 초기화 (페이지 로드 시)
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

initTheme();
```

```css
/* CSS에서 다크모드 색상 지정 */
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
  --border-color: #e5e7eb;
}

:root.dark {
  --bg-color: #111113;
  --text-color: #edeef0;
  --border-color: #2e3038;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 또는 Tailwind 유틸리티 사용 */
.bg-page {
  @apply bg-white dark:bg-slate-1;
}

.text-primary {
  @apply text-slate-12 dark:text-slateD-12;
}
```

---

## ✅ 체크리스트: Phase 1 구현 항목

### CSS 파일 생성 (약 500-800줄)
- [ ] `/frontend/assets/styles/globals.css`
  - CSS 변수 정의 (색상, 폰트, 간격)
  - Reset & normalize
  - 기본 타이포그래피
  - 반응형 breakpoints

- [ ] `/frontend/assets/styles/components.css`
  - Button 변형들
  - Card 스타일
  - Modal 스타일
  - Tab 네비게이션
  - Form 요소
  - 애니메이션 정의

- [ ] `/frontend/assets/styles/layout.css`
  - Header 스타일
  - Navigation 스타일
  - Grid/Flexbox 유틸리티
  - Responsive 레이아웃

### HTML 마크업 리팩토링
- [ ] `/frontend/index.html` (가계부)
  - 컴포넌트 클래스 적용
  - 시맨틱 HTML
  - Aria 속성 추가

- [ ] `/frontend/subscriptions.html` (고정비)
  - 통일된 스타일 적용
  - 컴포넌트 표준화

- [ ] `/frontend/layout.html` (기본 템플릿)
  - 공통 헤더
  - 네비게이션
  - 메인 컨테이너

### JavaScript 유틸리티
- [ ] `/frontend/assets/scripts/theme.js`
  - 다크모드 토글
  - 테마 저장/로드

- [ ] `/frontend/assets/scripts/ui.js`
  - Modal 열기/닫기
  - 탭 전환
  - Toast/Notification

- [ ] `/frontend/assets/scripts/api.js`
  - 공통 fetch 래퍼
  - 에러 핸들링
  - 타임아웃 처리

### 테스트 및 검증
- [ ] 모바일 (< 640px) 반응형 테스트
- [ ] 태블릿 (640-1024px) 반응형 테스트
- [ ] 데스크탑 (> 1024px) 반응형 테스트
- [ ] 다크모드 전체 화면 검증
- [ ] 라이트모드 전체 화면 검증
- [ ] 모든 모달 및 상호작용 테스트

---

## 다음: Phase 2 준비

Phase 1 완료 후:
1. 통합 대시보드 (`dashboard.html`) 개발
2. 가계부 ↔ 고정비 자동 동기화
3. 고급 시각화 (Chart.js)
4. 데이터 연동 강화

