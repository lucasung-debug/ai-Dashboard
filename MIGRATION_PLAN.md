# React 마이그레이션 계획: ai-Dashboard → FinPulse v2

**상태**: 계획 단계
**기간**: 약 4-6주
**목표**: ai-Dashboard를 React + TypeScript + Tailwind + shadcn/ui로 완전 마이그레이션하면서 모든 기능 유지 및 확장

---

## 📊 마이그레이션 개요

### 현재 상태 (ai-Dashboard)
```
✅ 기술 스택: Vanilla JS + 커스텀 CSS + Chart.js
✅ 데이터 저장: JSON 파일 기반
✅ 백엔드: FastAPI (Python)
✅ 기능: 거래, 구독/고정비, Excel/CSV 업로드, Telegram 봇, LLM 파싱

현재 상태:
- Phase 2 완료
- 33개 API 엔드포인트
- 3,266줄 JavaScript 코드
- 반응형 디자인 + 다크모드
```

### 마이그레이션 목표 (FinPulse v2)
```
🎯 기술 스택: React + TypeScript + Tailwind CSS + shadcn/ui
🎯 상태 관리: Zustand (lightweight) 또는 Context API
🎯 데이터 페칭: TanStack Query (React Query)
🎯 백엔드: FastAPI 유지
🎯 기능: 모든 기존 기능 + 새로운 기능 추가

마이그레이션 목표:
- 모든 ai-Dashboard 기능 보존
- clear-coast-finance 디자인 적용
- 현대적이고 유지보수 가능한 코드
- TypeScript 타입 안정성
- 향상된 성능 및 사용자 경험
```

---

## 🏗️ Phase 1: 프로젝트 환경 구축 (1주)

### 1.1 프로젝트 초기화

```bash
# 1. 새 Vite + React 프로젝트 생성
npm create vite@latest ai-dashboard-react -- --template react-ts
cd ai-dashboard-react

# 2. 의존성 설치
npm install

# 3. shadcn/ui 설정
npx shadcn-ui@latest init

# 4. 추가 라이브러리 설치
npm install \
  @tanstack/react-query \
  zustand \
  axios \
  date-fns \
  recharts \
  react-router-dom \
  framer-motion \
  clsx \
  class-variance-authority \
  tailwind-merge \
  zod \
  @hookform/resolvers \
  react-hook-form \
  sonner \
  lucide-react
```

### 1.2 프로젝트 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # 헤더
│   │   ├── Sidebar.tsx         # 사이드바 (모바일 드로어)
│   │   ├── BottomNav.tsx       # 모바일 하단 네비게이션
│   │   └── Layout.tsx          # 메인 레이아웃
│   ├── dashboard/
│   │   ├── StatCard.tsx        # KPI 카드
│   │   ├── NetWorthChart.tsx   # 순자산 차트
│   │   ├── SpendingChart.tsx   # 지출 차트
│   │   ├── TransactionList.tsx # 거래 목록
│   │   ├── AddTransactionModal.tsx
│   │   ├── EditTransactionModal.tsx
│   │   ├── BudgetTracker.tsx   # 예산 추적
│   │   ├── AssetAllocation.tsx # 자산 배분
│   │   └── InvestmentTable.tsx # 투자 포트폴리오
│   ├── subscription/
│   │   ├── SubscriptionCard.tsx # 구독 카드
│   │   ├── SubscriptionList.tsx # 구독 목록
│   │   ├── AddSubscriptionModal.tsx
│   │   ├── EditSubscriptionModal.tsx
│   │   └── SubscriptionStats.tsx
│   ├── ui/                     # shadcn/ui 컴포넌트 (자동 생성)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ... (40+ 컴포넌트)
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Toaster.tsx
│       └── ThemeToggle.tsx
├── pages/
│   ├── Dashboard.tsx           # 메인 대시보드
│   ├── Transactions.tsx        # 거래 관리
│   ├── Subscriptions.tsx       # 구독/고정비
│   ├── Upload.tsx              # Excel/CSV 업로드
│   ├── Reports.tsx             # 보고서
│   ├── Settings.tsx            # 설정
│   ├── Investments.tsx         # 투자 포트폴리오 (신규)
│   └── NotFound.tsx            # 404 페이지
├── hooks/
│   ├── useTransactions.ts      # 거래 관련 훅
│   ├── useSubscriptions.ts     # 구독 관련 훅
│   ├── useDashboard.ts         # 대시보드 훅
│   ├── useExchangeRates.ts     # 환율 훅
│   ├── useToast.ts             # 알림 훅
│   ├── useTelegram.ts          # Telegram 봇 훅
│   └── useLLMParser.ts         # LLM 파싱 훅
├── services/
│   ├── api.ts                  # API 클라이언트 (Axios + React Query)
│   ├── ledgerApi.ts            # 가계부 API
│   ├── subscriptionApi.ts      # 구독 API
│   ├── settingsApi.ts          # 설정 API
│   └── telegramApi.ts          # Telegram API
├── store/
│   ├── useAppStore.ts          # Zustand 전역 상태
│   ├── useThemeStore.ts        # 테마 상태
│   └── useNotificationStore.ts # 알림 상태
├── types/
│   ├── transaction.ts          # 거래 타입
│   ├── subscription.ts         # 구독 타입
│   ├── user.ts                 # 사용자 타입
│   ├── api.ts                  # API 응답 타입
│   └── index.ts                # 전체 타입 export
├── utils/
│   ├── formatters.ts           # 날짜, 통화 포매팅
│   ├── validators.ts           # 유효성 검사
│   ├── constants.ts            # 상수 정의
│   ├── storage.ts              # localStorage 유틸
│   └── api-error.ts            # API 에러 처리
├── lib/
│   ├── queryClient.ts          # TanStack Query 설정
│   └── axios-client.ts         # Axios 인스턴스
├── App.tsx                     # 루트 컴포넌트
├── main.tsx                    # 진입점
└── index.css                   # 글로벌 스타일

public/
└── favicon.svg

.env.example
tailwind.config.ts
tsconfig.json
vite.config.ts
```

### 1.3 TypeScript 설정

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 1.4 Tailwind CSS 설정

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import defaultConfig from 'tailwindcss/defaultConfig'

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', ...defaultConfig.theme.fontFamily.sans],
        body: ['DM Sans', ...defaultConfig.theme.fontFamily.sans],
      },
      colors: {
        // clear-coast-finance 색상 팔레트 적용
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```

### 1.5 환경 변수 설정

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
VITE_TELEGRAM_BOT_TOKEN=your_token
VITE_ENVIRONMENT=development
```

---

## 🎨 Phase 2: 기본 레이아웃 및 라우팅 (1주)

### 2.1 라우팅 설정

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import queryClient from '@/lib/queryClient'

import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Subscriptions from '@/pages/Subscriptions'
import Upload from '@/pages/Upload'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Investments from '@/pages/Investments'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}
```

### 2.2 레이아웃 컴포넌트

```typescript
// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useIsMobile } from '@/hooks/use-mobile'

export default function Layout() {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        {!isMobile && <Sidebar />}
        <main className="flex-1 pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
```

### 2.3 상태 관리 설정 (Zustand)

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark'
  currency: 'KRW' | 'USD' | 'JPY'
  language: 'ko' | 'en'

  setTheme: (theme: 'light' | 'dark') => void
  setCurrency: (currency: 'KRW' | 'USD' | 'JPY') => void
  setLanguage: (language: 'ko' | 'en') => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: localStorage.getItem('theme') as 'light' | 'dark' || 'light',
  currency: 'KRW',
  language: 'ko',

  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
  setCurrency: (currency) => set({ currency }),
  setLanguage: (language) => set({ language }),
}))
```

### 2.4 API 클라이언트 설정

```typescript
// src/lib/axios-client.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    throw error
  }
)

export default api
```

---

## 📱 Phase 3: 핵심 페이지 마이그레이션 (2주)

### 3.1 대시보드 페이지

```typescript
// src/pages/Dashboard.tsx
import { useDashboard } from '@/hooks/useDashboard'
import StatCard from '@/components/dashboard/StatCard'
import NetWorthChart from '@/components/dashboard/NetWorthChart'
import SpendingChart from '@/components/dashboard/SpendingChart'
import TransactionList from '@/components/dashboard/TransactionList'
import BudgetTracker from '@/components/dashboard/BudgetTracker'
import AssetAllocation from '@/components/dashboard/AssetAllocation'

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorBoundary error={error} />

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">Financial Overview</h1>
        <p className="text-muted-foreground">March 2026 · All accounts</p>
      </div>

      {/* KPI 카드 (4열 그리드) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={data?.netWorth}
          change={data?.netWorthChange}
          changeType="gain"
          icon="Wallet"
        />
        <StatCard
          title="Monthly Spending"
          value={data?.monthlySpending}
          change={data?.budgetStatus}
          changeType={data?.overBudget ? "loss" : "gain"}
          icon="CreditCard"
        />
        <StatCard
          title="Monthly Savings"
          value={data?.monthlySavings}
          change={data?.savingsRate}
          changeType="gain"
          icon="PiggyBank"
        />
        <StatCard
          title="Subscriptions"
          value={data?.subscriptionCost}
          change={`${data?.activeSubscriptions} active`}
          changeType="neutral"
          icon="TrendingUp"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <NetWorthChart data={data?.netWorthTrend} />
        </div>
        <div className="lg:col-span-2">
          <AssetAllocation data={data?.assets} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BudgetTracker data={data?.budgets} />
        <SpendingChart data={data?.categoryBreakdown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransactionList transactions={data?.recentTransactions} />
      </div>
    </div>
  )
}
```

### 3.2 거래 관리 페이지

```typescript
// src/pages/Transactions.tsx
import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { Button } from '@/components/ui/button'

export default function Transactions() {
  const [filters, setFilters] = useState({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data, isLoading, mutation } = useTransactions(filters)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">거래 내역</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          + 거래 추가
        </Button>
      </div>

      <TransactionFilters onFilterChange={setFilters} />
      <TransactionTable
        data={data}
        isLoading={isLoading}
        onEdit={setEditingId}
      />

      <AddTransactionModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={() => {
          setIsAddOpen(false)
          mutation.refetch()
        }}
      />

      {editingId && (
        <EditTransactionModal
          transactionId={editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => {
            setEditingId(null)
            mutation.refetch()
          }}
        />
      )}
    </div>
  )
}
```

### 3.3 구독/고정비 페이지

```typescript
// src/pages/Subscriptions.tsx
import { useState } from 'react'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import SubscriptionCard from '@/components/subscription/SubscriptionCard'
import SubscriptionStats from '@/components/subscription/SubscriptionStats'
import AddSubscriptionModal from '@/components/subscription/AddSubscriptionModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Subscriptions() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { data: subscriptions, isLoading, mutation } = useSubscriptions()

  const active = subscriptions?.filter(s => s.active) ?? []
  const cancelled = subscriptions?.filter(s => !s.active) ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">구독 & 고정비</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          + 구독 추가
        </Button>
      </div>

      <SubscriptionStats subscriptions={subscriptions} />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">활성 ({active.length})</TabsTrigger>
          <TabsTrigger value="cancelled">해지됨 ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(sub => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={setIsAddOpen}
              onDelete={() => mutation.mutate({ id: sub.id, action: 'delete' })}
            />
          ))}
        </TabsContent>

        <TabsContent value="cancelled" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cancelled.map(sub => (
            <SubscriptionCard key={sub.id} subscription={sub} disabled />
          ))}
        </TabsContent>
      </Tabs>

      <AddSubscriptionModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={() => {
          setIsAddOpen(false)
          mutation.refetch()
        }}
      />
    </div>
  )
}
```

---

## 🚀 Phase 4: 고급 기능 통합 (2주)

### 4.1 Excel/CSV 업로드

```typescript
// src/pages/Upload.tsx
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useExcelUpload } from '@/hooks/useExcelUpload'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Upload() {
  const [preview, setPreview] = useState(null)
  const mutation = useExcelUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    onDrop: async (files) => {
      const file = files[0]
      const result = await mutation.mutateAsync(file)
      setPreview(result)
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">엑셀 & CSV 업로드</h1>

      {!preview && (
        <Card
          {...getRootProps()}
          className={`p-12 border-2 border-dashed cursor-pointer transition ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-center text-gray-600">
            파일을 드래그하거나 클릭하여 업로드
          </p>
        </Card>
      )}

      {preview && (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-semibold">프리뷰: {preview.count}개 거래</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => mutation.mutate({ confirm: true })}>
              확인 & 저장
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              취소
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
```

### 4.2 Telegram 봇 통합

```typescript
// src/hooks/useTelegram.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios-client'

export function useTelegram() {
  // Telegram 봇 상태 조회
  const { data: status } = useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: () => api.get('/api/telegram/status'),
    staleTime: 1000 * 60 * 5,
  })

  // Telegram 봇 활성화/비활성화
  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      api.post('/api/telegram/toggle', { enabled }),
    onSuccess: () => {
      // 캐시 무효화
    },
  })

  return {
    isConnected: status?.connected ?? false,
    chatId: status?.chat_id,
    toggleBot: toggleMutation.mutate,
  }
}
```

### 4.3 LLM 파싱 통합

```typescript
// src/hooks/useLLMParser.ts
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios-client'

export function useLLMParser() {
  return useMutation({
    mutationFn: async (smsText: string) => {
      const response = await api.post('/api/telegram/parse-sms', {
        text: smsText,
      })
      return response.data
    },
  })
}
```

---

## ✨ Phase 5: 새 기능 추가 (2주)

### 5.1 투자 포트폴리오 페이지

```typescript
// src/pages/Investments.tsx
import { useInvestments } from '@/hooks/useInvestments'
import InvestmentTable from '@/components/investments/InvestmentTable'
import InvestmentChart from '@/components/investments/InvestmentChart'
import { Card } from '@/components/ui/card'

export default function Investments() {
  const { data, isLoading } = useInvestments()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">투자 포트폴리오</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">총 투자액</p>
          <p className="text-2xl font-bold">${data?.totalInvested.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">현재 자산</p>
          <p className="text-2xl font-bold">${data?.currentValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">수익/손실</p>
          <p className={`text-2xl font-bold ${data?.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data?.gainLoss.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">수익률</p>
          <p className="text-2xl font-bold">{data?.returnRate}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InvestmentChart data={data?.allocationChart} />
        <InvestmentTable data={data?.holdings} />
      </div>
    </div>
  )
}
```

### 5.2 보고서 페이지

```typescript
// src/pages/Reports.tsx
import { useState } from 'react'
import { useReports } from '@/hooks/useReports'
import MonthlyReport from '@/components/reports/MonthlyReport'
import AnnualReport from '@/components/reports/AnnualReport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const { data } = useReports(selectedMonth)

  const handleExportCSV = () => {
    // CSV 내보내기 로직
  }

  const handleExportPDF = () => {
    // PDF 내보내기 로직
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">보고서</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV}>CSV 내보내기</Button>
          <Button onClick={handleExportPDF}>PDF 내보내기</Button>
        </div>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">월별</TabsTrigger>
          <TabsTrigger value="annual">연간</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <MonthlyReport data={data?.monthly} />
        </TabsContent>

        <TabsContent value="annual">
          <AnnualReport data={data?.annual} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🔧 Phase 6: 배포 및 최적화 (1주)

### 6.1 Dockerfile 업데이트

```dockerfile
# Dockerfile (Node.js 기반)
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 빌드
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine

WORKDIR /app

# Express 또는 간단한 서버 (정적 파일 제공)
COPY --from=builder /app/dist ./dist
RUN npm install -g serve

EXPOSE 3000

# 백엔드는 별도 컨테이너에서 실행
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### 6.2 Docker Compose (프론트엔드 + 백엔드)

```yaml
version: '3.8'

services:
  # React 프론트엔드
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:8000
    depends_on:
      - backend

  # FastAPI 백엔드 (기존)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - ./backend/data:/app/backend/data
```

### 6.3 배포 최적화

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'ES2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 📋 마이그레이션 체크리스트

### Phase 1: 환경 구축
- [ ] Vite + React 프로젝트 생성
- [ ] shadcn/ui 설정
- [ ] Tailwind CSS 구성
- [ ] TypeScript 설정
- [ ] 라우팅 설정
- [ ] 상태 관리 (Zustand) 설정
- [ ] API 클라이언트 설정

### Phase 2: 레이아웃
- [ ] Header 컴포넌트
- [ ] Sidebar 컴포넌트
- [ ] BottomNav 컴포넌트
- [ ] Layout 컴포넌트
- [ ] 테마 시스템

### Phase 3: 페이지 마이그레이션
- [ ] Dashboard 페이지
- [ ] Transactions 페이지
- [ ] Subscriptions 페이지
- [ ] Upload 페이지
- [ ] Settings 페이지

### Phase 4: 고급 기능
- [ ] Excel/CSV 업로드
- [ ] Telegram 봇 통합
- [ ] LLM 파싱
- [ ] 환율 관리

### Phase 5: 새 기능
- [ ] Investments 페이지
- [ ] Reports 페이지
- [ ] Budget Tracker 강화
- [ ] Net Worth 차트

### Phase 6: 배포
- [ ] Dockerfile 업데이트
- [ ] Docker Compose 설정
- [ ] Railway.toml 수정
- [ ] 환경 변수 설정
- [ ] 성능 최적화
- [ ] 번들 크기 분석

---

## 🎯 성능 목표

| 메트릭 | 목표 | 도구 |
|--------|------|------|
| First Contentful Paint | < 1.5초 | Lighthouse |
| Largest Contentful Paint | < 2.5초 | Web Vitals |
| Cumulative Layout Shift | < 0.1 | Web Vitals |
| 번들 크기 | < 200KB (gzip) | Bundle Analyzer |
| Lighthouse Score | > 90 | Lighthouse |

---

## 💾 데이터 마이그레이션

FastAPI 백엔드는 유지되므로 JSON 데이터 마이그레이션 불필요.

```
ai-Dashboard (Vanilla JS) → FinPulse v2 (React)
↓
기존 FastAPI 백엔드 유지
↓
JSON 데이터 파일 유지
```

---

## 🔐 보안 고려사항

- [ ] CORS 설정 검토
- [ ] API 인증 추가 (JWT)
- [ ] XSS 방지 (DOMPurify)
- [ ] CSRF 보호
- [ ] 민감한 데이터 암호화
- [ ] API 레이트 리미팅

---

## 📚 참고 자료

- **clear-coast-finance**: `/tmp/clear-coast-finance`
- **ai-Dashboard (현재)**: `/home/user/ai-Dashboard`
- **Vite 공식 문서**: https://vitejs.dev
- **React Router v6**: https://reactrouter.com
- **shadcn/ui**: https://shadcn.dev
- **TanStack Query**: https://tanstack.com/query

---

## 🚀 시작하기

```bash
# 1. 새 프로젝트 초기화
npm create vite@latest ai-dashboard-react -- --template react-ts
cd ai-dashboard-react

# 2. 의존성 설치
npm install

# 3. shadcn/ui 설정
npx shadcn-ui@latest init

# 4. 개발 서버 시작
npm run dev

# 5. 빌드
npm run build

# 6. 배포
npm run build && docker build -t ai-dashboard-react .
```

---

**작성일**: 2026-03-09
**상태**: 📋 계획 단계 (Phase 1 준비)
**예상 완료**: 4-6주
**우선순위**: 🔴 높음
