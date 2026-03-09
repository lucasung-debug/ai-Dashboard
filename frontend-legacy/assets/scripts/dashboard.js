/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD.JS - Dashboard Data Loading & Logic
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - Fetch dashboard summary data from backend
 * - Handle month navigation and filtering
 * - Update summary cards and KPIs
 * - Manage chart initialization and re-rendering
 * - Handle data refresh and synchronization
 */

// ─────────────────────────────────────────────────────────────────────────
// Global State
// ─────────────────────────────────────────────────────────────────────────

let currentMonth = new Date().toISOString().slice(0, 7);  // YYYY-MM format
let dashboardData = null;
let subscriptionsData = [];
let chartInstances = {};
let isLoading = false;

// ─────────────────────────────────────────────────────────────────────────
// Initialize Dashboard
// ─────────────────────────────────────────────────────────────────────────

/**
 * Initialize dashboard on page load
 */
function initDashboard() {
    // Set initial month picker value
    document.getElementById('month-picker').value = currentMonth;

    // Load initial data
    loadDashboardData(currentMonth);

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadDashboardData(currentMonth);
    }, 30000);

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'dashboardRefresh') {
            loadDashboardData(currentMonth);
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────
// Data Loading Functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Load dashboard summary data from backend
 * @param {string} month - YYYY-MM format
 */
async function loadDashboardData(month) {
    if (isLoading) return;
    isLoading = true;

    try {
        console.log(`Loading dashboard data for ${month}...`);

        // Fetch dashboard summary
        const dashboardResponse = await apiPost('/api/ledger/dashboard-summary', {
            month: month,
            currencies: ['KRW', 'USD']
        });

        if (!dashboardResponse || dashboardResponse.status !== 'success') {
            throw new Error('Failed to load dashboard summary');
        }

        dashboardData = dashboardResponse.data;

        // Fetch subscriptions data
        const subscriptionsResponse = await apiGet('/api/subscriptions');
        if (subscriptionsResponse && subscriptionsResponse.data) {
            subscriptionsData = subscriptionsResponse.data;
        }

        // Update UI with fetched data
        updateSummaryCards();
        updateFixedCostSummary();
        renderAllCharts();
        updateLastUpdateTime();

        console.log('Dashboard data loaded successfully', dashboardData);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        isLoading = false;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Update UI Elements
// ─────────────────────────────────────────────────────────────────────────

/**
 * Update summary card values
 */
function updateSummaryCards() {
    if (!dashboardData) return;

    const { summary } = dashboardData;

    // Format currency (KRW as default)
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '₩0';
        return '₩' + value.toLocaleString('ko-KR');
    };

    // Update total assets
    const totalAssetsEl = document.getElementById('summary-total-assets');
    const assetsSecondaryEl = document.getElementById('summary-assets-secondary');
    if (totalAssetsEl) {
        totalAssetsEl.textContent = formatCurrency(summary.total_assets);
        if (assetsSecondaryEl) {
            assetsSecondaryEl.textContent = summary.currency || 'KRW';
        }
    }

    // Update monthly income
    const incomeEl = document.getElementById('summary-monthly-income');
    const incomeSecondaryEl = document.getElementById('summary-income-secondary');
    if (incomeEl) {
        incomeEl.textContent = formatCurrency(summary.monthly_income);
        if (incomeSecondaryEl) {
            const percentOfAssets = summary.total_assets ?
                ((summary.monthly_income / summary.total_assets) * 100).toFixed(1) : '0';
            incomeSecondaryEl.textContent = `${percentOfAssets}%`;
        }
    }

    // Update monthly expense
    const expenseEl = document.getElementById('summary-monthly-expense');
    const expenseSecondaryEl = document.getElementById('summary-expense-secondary');
    if (expenseEl) {
        expenseEl.textContent = formatCurrency(summary.monthly_expense);
        if (expenseSecondaryEl) {
            const percentOfIncome = summary.monthly_income ?
                ((summary.monthly_expense / summary.monthly_income) * 100).toFixed(1) : '0';
            expenseSecondaryEl.textContent = `${percentOfIncome}%`;
        }
    }

    // Update monthly balance
    const balanceEl = document.getElementById('summary-monthly-balance');
    if (balanceEl) {
        const balance = summary.monthly_income - summary.monthly_expense;
        balanceEl.textContent = formatCurrency(balance);
        balanceEl.style.color = balance >= 0 ? 'var(--success-12)' : 'var(--danger-11)';
    }
}

/**
 * Update fixed cost summary
 */
function updateFixedCostSummary() {
    if (!dashboardData || !subscriptionsData) return;

    const { subscriptions_summary } = dashboardData;

    // Active subscriptions count
    const activeSubEl = document.getElementById('summary-active-subscriptions');
    if (activeSubEl) {
        const activeCount = subscriptionsData.filter(sub => sub.active).length;
        activeSubEl.textContent = activeCount.toString();
    }

    // Total fixed cost
    const totalFixedEl = document.getElementById('summary-total-fixed-cost');
    if (totalFixedEl) {
        const totalFixed = subscriptions_summary?.total_monthly_cost || 0;
        totalFixedEl.textContent = '₩' + totalFixed.toLocaleString('ko-KR');
    }

    // Next billing date
    const nextBillingEl = document.getElementById('summary-next-billing');
    if (nextBillingEl) {
        const nextBilling = findNextBillingDate();
        nextBillingEl.textContent = nextBilling || '예정 없음';
    }
}

/**
 * Find next billing date from subscriptions
 * @returns {string} Formatted date or null
 */
function findNextBillingDate() {
    if (!subscriptionsData || subscriptionsData.length === 0) {
        return null;
    }

    const today = new Date();
    const upcomingSubscriptions = subscriptionsData
        .filter(sub => sub.active && sub.next_billing)
        .sort((a, b) => new Date(a.next_billing) - new Date(b.next_billing));

    if (upcomingSubscriptions.length > 0) {
        const nextDate = new Date(upcomingSubscriptions[0].next_billing);
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        const dateStr = nextDate.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
        return `${dateStr} (${daysUntil}일)`;
    }

    return null;
}

/**
 * Update last update timestamp
 */
function updateLastUpdateTime() {
    const timeEl = document.getElementById('last-update-time');
    if (timeEl) {
        timeEl.textContent = '방금';
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Chart Management
// ─────────────────────────────────────────────────────────────────────────

/**
 * Render all charts
 */
function renderAllCharts() {
    if (!dashboardData) return;

    // Destroy existing charts
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {};

    // Render each chart
    renderCategoryChart();
    renderFixedVsVariableChart();
    renderDailyTrendChart();
    renderSubscriptionTimeline();
}

/**
 * Render category pie chart
 */
function renderCategoryChart() {
    const canvas = document.getElementById('chart-category');
    if (!canvas) return;

    const { category_breakdown } = dashboardData;
    if (!category_breakdown || category_breakdown.length === 0) {
        canvas.parentElement.innerHTML = '<p class="text-center text-slate-9 py-8">데이터 없음</p>';
        return;
    }

    const labels = category_breakdown.map(c => c.category);
    const data = category_breakdown.map(c => c.amount);
    const colors = generateChartColors(labels.length);

    const ctx = canvas.getContext('2d');
    chartInstances.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        color: getChartTextColor(),
                        padding: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ₩${value.toLocaleString('ko-KR')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Update total
    const totalEl = document.getElementById('chart-category-total');
    const total = data.reduce((a, b) => a + b, 0);
    if (totalEl) {
        totalEl.textContent = '₩' + total.toLocaleString('ko-KR');
    }
}

/**
 * Render fixed vs variable expense chart
 */
function renderFixedVsVariableChart() {
    const canvas = document.getElementById('chart-fixed-variable');
    if (!canvas) return;

    const { subscriptions_summary, monthly_expense } = dashboardData;
    const fixedCost = subscriptions_summary?.total_monthly_cost || 0;
    const variableCost = (monthly_expense || 0) - fixedCost;

    const ctx = canvas.getContext('2d');
    chartInstances.fixedVariable = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['지출'],
            datasets: [
                {
                    label: '고정비',
                    data: [fixedCost],
                    backgroundColor: 'var(--primary-600)',
                    borderRadius: 4
                },
                {
                    label: '변동비',
                    data: [variableCost > 0 ? variableCost : 0],
                    backgroundColor: 'var(--danger-9)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: getChartTextColor() },
                    grid: { color: getChartGridColor() }
                },
                y: {
                    ticks: { color: getChartTextColor() }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getChartTextColor(),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ₩${context.parsed.x.toLocaleString('ko-KR')}`;
                        }
                    }
                }
            }
        }
    });

    // Update summary labels
    const fixedLabel = document.getElementById('chart-fixed-label');
    const variableLabel = document.getElementById('chart-variable-label');
    if (fixedLabel) fixedLabel.textContent = `고정비: ₩${fixedCost.toLocaleString('ko-KR')}`;
    if (variableLabel) variableLabel.textContent = `변동비: ₩${Math.max(0, variableCost).toLocaleString('ko-KR')}`;
}

/**
 * Render daily trend chart
 */
function renderDailyTrendChart() {
    const canvas = document.getElementById('chart-daily-trend');
    if (!canvas) return;

    const { daily_breakdown } = dashboardData;
    if (!daily_breakdown || daily_breakdown.length === 0) {
        canvas.parentElement.innerHTML = '<p class="text-center text-slate-9 py-8">데이터 없음</p>';
        return;
    }

    const labels = daily_breakdown.map(d => new Date(d.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }));
    const expenseData = daily_breakdown.map(d => d.expense || 0);

    const ctx = canvas.getContext('2d');
    chartInstances.dailyTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '일별 지출',
                data: expenseData,
                borderColor: 'var(--danger-9)',
                backgroundColor: 'rgba(229, 70, 102, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: 'var(--danger-9)',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: getChartTextColor(),
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 10 }
                    },
                    grid: { color: getChartGridColor() }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getChartTextColor(),
                        callback: (value) => '₩' + value.toLocaleString('ko-KR')
                    },
                    grid: { color: getChartGridColor() }
                }
            },
            plugins: {
                legend: {
                    labels: { color: getChartTextColor() }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `₩${context.parsed.y.toLocaleString('ko-KR')}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render subscription timeline
 */
function renderSubscriptionTimeline() {
    const container = document.getElementById('subscription-timeline');
    if (!container) return;

    if (!subscriptionsData || subscriptionsData.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-9 text-sm py-8">활성 구독 없음</p>';
        return;
    }

    // Sort by next billing date
    const sorted = subscriptionsData
        .filter(sub => sub.active)
        .sort((a, b) => new Date(a.next_billing) - new Date(b.next_billing));

    const today = new Date();
    let html = '';

    sorted.forEach(sub => {
        const nextBilling = new Date(sub.next_billing);
        const daysUntil = Math.ceil((nextBilling - today) / (1000 * 60 * 60 * 24));
        const dateStr = nextBilling.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });

        const categoryColor = getSubscriptionCategoryColor(sub.category);

        html += `
            <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-2 dark:bg-slateD-3">
                <div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${categoryColor}"></div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-12 dark:text-slateD-12 truncate">${sub.name}</p>
                    <p class="text-[11px] text-slate-9 dark:text-slateD-9">${dateStr} (${daysUntil}일)</p>
                </div>
                <p class="text-sm font-semibold text-slate-12 dark:text-slateD-12 flex-shrink-0 tabular-nums">₩${sub.price.toLocaleString('ko-KR')}</p>
            </div>
        `;
    });

    container.innerHTML = html || '<p class="text-center text-slate-9 text-sm py-4">예정된 결제 없음</p>';
}

// ─────────────────────────────────────────────────────────────────────────
// Month Navigation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Set up month navigation event listeners
 */
function setupMonthNavigation() {
    const monthPicker = document.getElementById('month-picker');
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnToday = document.getElementById('btn-today');

    if (monthPicker) {
        monthPicker.addEventListener('change', (e) => {
            currentMonth = e.target.value;
            loadDashboardData(currentMonth);
        });
    }

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            const date = new Date(currentMonth + '-01');
            date.setMonth(date.getMonth() - 1);
            currentMonth = date.toISOString().slice(0, 7);
            monthPicker.value = currentMonth;
            loadDashboardData(currentMonth);
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            const date = new Date(currentMonth + '-01');
            date.setMonth(date.getMonth() + 1);
            currentMonth = date.toISOString().slice(0, 7);
            monthPicker.value = currentMonth;
            loadDashboardData(currentMonth);
        });
    }

    if (btnToday) {
        btnToday.addEventListener('click', () => {
            currentMonth = new Date().toISOString().slice(0, 7);
            monthPicker.value = currentMonth;
            loadDashboardData(currentMonth);
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Theme & Settings
// ─────────────────────────────────────────────────────────────────────────

/**
 * Set up theme button event listeners
 */
function setupThemeButtons() {
    const themeLightBtn = document.getElementById('theme-light-btn');
    const themeDarkBtn = document.getElementById('theme-dark-btn');

    if (themeLightBtn) {
        themeLightBtn.addEventListener('click', () => {
            setTheme('light');
        });
    }

    if (themeDarkBtn) {
        themeDarkBtn.addEventListener('click', () => {
            setTheme('dark');
        });
    }
}

/**
 * Set up currency selector
 */
function setupCurrencySelector() {
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            // Store preference
            localStorage.setItem('preferredCurrency', e.target.value);
            // Reload dashboard data (in future, implement currency conversion)
            loadDashboardData(currentMonth);
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Generate chart colors based on dark mode
 * @param {number} count - Number of colors needed
 * @returns {string[]} Array of color values
 */
function generateChartColors(count) {
    const isDark = document.documentElement.classList.contains('dark');
    const colors = [
        isDark ? '#5472e4' : '#3e63dd',  // Primary
        isDark ? '#ff9592' : '#e54666',  // Danger
        isDark ? '#86ead4' : '#58d5ba',  // Success
        isDark ? '#ffc53d' : '#ffba18',  // Warning
        isDark ? '#a1a8ff' : '#6b7ee3',  // Secondary
        isDark ? '#d4a574' : '#c4886f',  // Accent
    ];

    if (count <= colors.length) {
        return colors.slice(0, count);
    }

    // Generate additional colors if needed
    while (colors.length < count) {
        colors.push(`hsl(${Math.random() * 360}, 70%, 60%)`);
    }

    return colors;
}

/**
 * Get chart text color based on theme
 * @returns {string} Color value
 */
function getChartTextColor() {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? '#9da3ad' : '#626a75';
}

/**
 * Get chart grid color based on theme
 * @returns {string} Color value
 */
function getChartGridColor() {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? '#2e3038' : '#e8eaed';
}

/**
 * Get subscription category color
 * @param {string} category - Category name
 * @returns {string} Color value
 */
function getSubscriptionCategoryColor(category) {
    const colors = {
        'AI': '#5472e4',
        'General': '#86ead4',
        'Entertainment': '#ff9592',
        'Productivity': '#ffc53d',
        'default': '#626a75'
    };

    return colors[category] || colors['default'];
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
function showError(message) {
    console.error(message);
    // Use showDanger from ui.js if available
    if (typeof showDanger === 'function') {
        showDanger(message);
    }
}
