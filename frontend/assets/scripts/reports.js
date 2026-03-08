/**
 * reports.js - 재무 보고서 페이지 로직
 * 월별/연간 보고서 데이터 로딩 및 렌더링
 */

// ═══ STATE ═══
let currentReportMonth = new Date().toISOString().slice(0, 7);  // YYYY-MM
let currentReportYear = new Date().getFullYear();

let monthlyReportData = null;
let annualReportData = null;

let chartInstances = {
    budgetVsActual: null,
    categoryBreakdown: null,
    monthlyTrend: null,
    fixedVariable: null
};

// ═══ INITIALIZATION ═══
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reports page loaded');

    // Initialize theme
    initTheme();

    // Set current month/year
    document.getElementById('report-month-label').textContent = formatMonthLabel(currentReportMonth);
    document.getElementById('report-year-label').textContent = `${currentReportYear}년`;

    // Bind event listeners
    document.getElementById('btn-prev-report-month').addEventListener('click', () => changeReportMonth(-1));
    document.getElementById('btn-next-report-month').addEventListener('click', () => changeReportMonth(1));
    document.getElementById('btn-prev-year').addEventListener('click', () => changeReportYear(-1));
    document.getElementById('btn-next-year').addEventListener('click', () => changeReportYear(1));

    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

    document.getElementById('btn-export-csv').addEventListener('click', () => exportReportCsv());

    // Load initial data
    loadMonthlyReport();
    loadAnnualReport();

    // Auto-refresh every 5 minutes
    setInterval(() => {
        const currentTab = document.querySelector('[data-report-tab].active')?.dataset.reportTab || 'monthly';
        if (currentTab === 'monthly') loadMonthlyReport();
        else loadAnnualReport();
    }, 5 * 60 * 1000);

    // Handle window resize for responsive charts
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            redrawAllCharts();
        }, 500);
    });
});

// ═══ MONTH NAVIGATION ═══
function changeReportMonth(offset) {
    const date = new Date(currentReportMonth + '-01');
    date.setMonth(date.getMonth() + offset);
    currentReportMonth = date.toISOString().slice(0, 7);

    document.getElementById('report-month-label').textContent = formatMonthLabel(currentReportMonth);
    loadMonthlyReport();
}

function changeReportYear(offset) {
    currentReportYear += offset;
    document.getElementById('report-year-label').textContent = `${currentReportYear}년`;
    loadAnnualReport();
}

// ═══ TAB SWITCHING ═══
function switchReportTab(tabName) {
    // Update active tab
    document.querySelectorAll('[data-report-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.reportTab === tabName);
    });

    // Show/hide views
    document.getElementById('view-monthly-report').classList.toggle('hidden', tabName !== 'monthly');
    document.getElementById('view-annual-report').classList.toggle('hidden', tabName !== 'annual');

    // Load data if needed
    if (tabName === 'monthly') {
        loadMonthlyReport();
    } else {
        loadAnnualReport();
    }
}

// ═══ DATA LOADING ═══
async function loadMonthlyReport() {
    try {
        console.log(`Loading monthly report for ${currentReportMonth}`);

        const response = await apiPost('/api/ledger/dashboard-summary', {
            month: currentReportMonth,
            currencies: ['KRW']
        });

        monthlyReportData = response;
        renderMonthlyReport();
    } catch (error) {
        console.error('Failed to load monthly report:', error);
        showError('월간 보고서 로드 실패');
    }
}

async function loadAnnualReport() {
    try {
        console.log(`Loading annual report for ${currentReportYear}`);

        const months = [];
        for (let m = 1; m <= 12; m++) {
            const month = `${currentReportYear}-${String(m).padStart(2, '0')}`;
            try {
                const data = await apiPost('/api/ledger/dashboard-summary', {
                    month,
                    currencies: ['KRW']
                });
                months.push({ month, ...data });
            } catch (e) {
                console.warn(`Could not load data for ${month}`, e);
                months.push({ month, summary: {}, category_breakdown: [], daily_breakdown: [] });
            }
        }

        annualReportData = {
            year: currentReportYear,
            months,
            summary: calculateAnnualSummary(months)
        };

        renderAnnualReport();
    } catch (error) {
        console.error('Failed to load annual report:', error);
        showError('연간 보고서 로드 실패');
    }
}

function calculateAnnualSummary(months) {
    const summary = {
        total_income: 0,
        total_expense: 0,
        total_balance: 0,
        total_fixed: 0
    };

    months.forEach(m => {
        summary.total_income += m.summary?.monthly_income || 0;
        summary.total_expense += m.summary?.monthly_expense || 0;
        summary.total_balance += m.summary?.monthly_balance || 0;
        summary.total_fixed += m.summary?.fixed_costs_total || 0;
    });

    summary.monthly_avg_expense = Math.round(summary.total_expense / 12);

    return summary;
}

// ═══ RENDERING ═══
function renderMonthlyReport() {
    if (!monthlyReportData) return;

    const { summary = {}, category_breakdown = [] } = monthlyReportData;

    // Update summary cards
    document.getElementById('monthly-income').textContent = formatCurrency(summary.monthly_income || 0);
    document.getElementById('monthly-expense').textContent = formatCurrency(summary.monthly_expense || 0);
    document.getElementById('monthly-balance').textContent = formatCurrency(summary.monthly_balance || 0);
    document.getElementById('monthly-fixed').textContent = formatCurrency(summary.fixed_costs_total || 0);

    // Render charts
    renderBudgetVsActualChart();
    renderCategoryBreakdownChart();

    // Render category table
    renderMonthlycategoryTable(category_breakdown);
}

function renderAnnualReport() {
    if (!annualReportData) return;

    const { summary = {} } = annualReportData;

    // Update summary cards
    document.getElementById('annual-income').textContent = formatCurrency(summary.total_income || 0);
    document.getElementById('annual-expense').textContent = formatCurrency(summary.total_expense || 0);
    document.getElementById('annual-balance').textContent = formatCurrency(summary.total_balance || 0);
    document.getElementById('annual-monthly-avg').textContent = formatCurrency(summary.monthly_avg_expense || 0);

    // Render charts
    renderMonthlyTrendChart();
    renderFixedVariableChart();

    // Render category table
    renderAnnualCategoryTable();
}

function renderMonthlycategoryTable(categories) {
    const tbody = document.getElementById('monthly-category-table');

    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-slate-9">카테고리 데이터 없음</td></tr>';
        return;
    }

    const totalExpense = categories.reduce((sum, c) => sum + (c.amount || 0), 0);

    tbody.innerHTML = categories
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .map(cat => {
            const percentage = totalExpense > 0 ? ((cat.amount / totalExpense) * 100).toFixed(1) : 0;
            return `
                <tr class="border-b border-slate-4 dark:border-slateD-4 hover:bg-slate-2 dark:hover:bg-slateD-2 transition">
                    <td class="py-3">${cat.category || '기타'}</td>
                    <td class="py-3 text-right font-mono">${formatCurrency(cat.amount || 0)}</td>
                    <td class="py-3 text-right text-slate-9">${percentage}%</td>
                </tr>
            `;
        })
        .join('');
}

function renderAnnualCategoryTable() {
    const tbody = document.getElementById('annual-category-table');

    if (!annualReportData || !annualReportData.months) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-slate-9">데이터 없음</td></tr>';
        return;
    }

    // Aggregate categories from all months
    const categoryMap = {};
    annualReportData.months.forEach(month => {
        if (month.category_breakdown && Array.isArray(month.category_breakdown)) {
            month.category_breakdown.forEach(cat => {
                const key = cat.category || '기타';
                categoryMap[key] = (categoryMap[key] || 0) + (cat.amount || 0);
            });
        }
    });

    const categories = Object.entries(categoryMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-slate-9">카테고리 데이터 없음</td></tr>';
        return;
    }

    const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

    tbody.innerHTML = categories
        .map(cat => {
            const percentage = totalExpense > 0 ? ((cat.amount / totalExpense) * 100).toFixed(1) : 0;
            return `
                <tr class="border-b border-slate-4 dark:border-slateD-4 hover:bg-slate-2 dark:hover:bg-slateD-2 transition">
                    <td class="py-3">${cat.category}</td>
                    <td class="py-3 text-right font-mono">${formatCurrency(cat.amount)}</td>
                    <td class="py-3 text-right text-slate-9">${percentage}%</td>
                </tr>
            `;
        })
        .join('');
}

// ═══ CHARTS ═══
function renderBudgetVsActualChart() {
    if (!monthlyReportData) return;

    const ctx = document.getElementById('chart-budget-vs-actual');
    if (!ctx) return;

    const { summary = {} } = monthlyReportData;
    const income = summary.monthly_income || 0;
    const expense = summary.monthly_expense || 0;
    const balance = income - expense;

    // Destroy previous chart
    if (chartInstances.budgetVsActual) {
        chartInstances.budgetVsActual.destroy();
    }

    const { bgColor, borderColor } = getChartColorPalette();

    chartInstances.budgetVsActual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['수입', '지출', '잔액'],
            datasets: [
                {
                    label: '금액',
                    data: [income, expense, balance],
                    backgroundColor: [
                        'rgba(74, 222, 128, 0.7)',  // green
                        'rgba(239, 68, 68, 0.7)',   // red
                        'rgba(59, 130, 246, 0.7)'   // blue
                    ],
                    borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(220, 38, 38)',
                        'rgb(37, 99, 235)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            ...getDefaultChartOptions(),
            indexAxis: 'x',
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatChartCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryBreakdownChart() {
    if (!monthlyReportData) return;

    const ctx = document.getElementById('chart-category-breakdown');
    if (!ctx) return;

    const { category_breakdown = [] } = monthlyReportData;

    // Destroy previous chart
    if (chartInstances.categoryBreakdown) {
        chartInstances.categoryBreakdown.destroy();
    }

    const labels = category_breakdown.map(c => c.category || '기타');
    const data = category_breakdown.map(c => c.amount || 0);
    const colors = generateCategoryColors(labels.length);

    chartInstances.categoryBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.map((c, i) => c + 'B3'),
                borderColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            ...getDefaultChartOptions(),
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, usePointStyle: true }
                }
            }
        }
    });
}

function renderMonthlyTrendChart() {
    if (!annualReportData) return;

    const ctx = document.getElementById('chart-monthly-trend');
    if (!ctx) return;

    // Destroy previous chart
    if (chartInstances.monthlyTrend) {
        chartInstances.monthlyTrend.destroy();
    }

    const labels = annualReportData.months.map(m =>
        new Date(m.month + '-01').toLocaleDateString('ko-KR', { month: 'short' })
    );
    const incomeData = annualReportData.months.map(m => m.summary?.monthly_income || 0);
    const expenseData = annualReportData.months.map(m => m.summary?.monthly_expense || 0);

    chartInstances.monthlyTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: '수입',
                    data: incomeData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: '지출',
                    data: expenseData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            ...getDefaultChartOptions(),
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatChartCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderFixedVariableChart() {
    if (!annualReportData) return;

    const ctx = document.getElementById('chart-fixed-variable');
    if (!ctx) return;

    // Destroy previous chart
    if (chartInstances.fixedVariable) {
        chartInstances.fixedVariable.destroy();
    }

    const totalFixed = annualReportData.summary?.total_fixed || 0;
    const totalExpense = annualReportData.summary?.total_expense || 0;
    const totalVariable = Math.max(0, totalExpense - totalFixed);

    chartInstances.fixedVariable = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['고정비', '변동비'],
            datasets: [{
                data: [totalFixed, totalVariable],
                backgroundColor: [
                    'rgba(217, 119, 6, 0.7)',    // amber
                    'rgba(59, 130, 246, 0.7)'    // blue
                ],
                borderColor: [
                    'rgb(180, 83, 9)',
                    'rgb(37, 99, 235)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            ...getDefaultChartOptions(),
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, usePointStyle: true }
                }
            }
        }
    });
}

function redrawAllCharts() {
    const currentTab = document.querySelector('[data-report-tab].active')?.dataset.reportTab || 'monthly';

    if (currentTab === 'monthly') {
        renderBudgetVsActualChart();
        renderCategoryBreakdownChart();
    } else {
        renderMonthlyTrendChart();
        renderFixedVariableChart();
    }
}

// ═══ EXPORT ═══
function exportReportCsv() {
    const currentTab = document.querySelector('[data-report-tab].active')?.dataset.reportTab || 'monthly';

    let csvContent, filename;

    if (currentTab === 'monthly' && monthlyReportData) {
        csvContent = buildMonthlyCsv();
        filename = `보고서_월별_${currentReportMonth}.csv`;
    } else if (currentTab === 'annual' && annualReportData) {
        csvContent = buildAnnualCsv();
        filename = `보고서_연간_${currentReportYear}.csv`;
    } else {
        showError('내보내기 데이터를 찾을 수 없습니다');
        return;
    }

    downloadCsv(csvContent, filename);
    showSuccess('CSV 파일이 다운로드되었습니다');
}

function buildMonthlyCsv() {
    const { summary = {}, category_breakdown = [] } = monthlyReportData;

    let csv = '월간 재무 보고서\n';
    csv += `월: ${currentReportMonth}\n`;
    csv += '\n';

    // Summary section
    csv += '요약\n';
    csv += `수입,${summary.monthly_income || 0}\n`;
    csv += `지출,${summary.monthly_expense || 0}\n`;
    csv += `잔액,${summary.monthly_balance || 0}\n`;
    csv += `고정비,${summary.fixed_costs_total || 0}\n`;
    csv += '\n';

    // Category breakdown
    csv += '카테고리별 지출\n';
    csv += '카테고리,금액,비율\n';
    const totalExpense = category_breakdown.reduce((sum, c) => sum + (c.amount || 0), 0);
    category_breakdown.forEach(cat => {
        const percentage = totalExpense > 0 ? ((cat.amount / totalExpense) * 100).toFixed(2) : 0;
        csv += `"${cat.category || '기타'}",${cat.amount || 0},${percentage}%\n`;
    });

    return csv;
}

function buildAnnualCsv() {
    const { summary = {} } = annualReportData;

    let csv = '연간 재무 보고서\n';
    csv += `연도: ${currentReportYear}\n`;
    csv += '\n';

    // Summary
    csv += '연간 요약\n';
    csv += `총 수입,${summary.total_income || 0}\n`;
    csv += `총 지출,${summary.total_expense || 0}\n`;
    csv += `순 잔액,${summary.total_balance || 0}\n`;
    csv += `월평균 지출,${summary.monthly_avg_expense || 0}\n`;
    csv += '\n';

    // Monthly breakdown
    csv += '월별 현황\n';
    csv += '월,수입,지출,잔액\n';
    annualReportData.months.forEach(month => {
        csv += `${month.month},${month.summary?.monthly_income || 0},${month.summary?.monthly_expense || 0},${month.summary?.monthly_balance || 0}\n`;
    });

    return csv;
}

function downloadCsv(csvContent, filename) {
    const bom = '\uFEFF';  // UTF-8 BOM
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ═══ UTILITIES ═══
function formatMonthLabel(monthStr) {
    const [year, month] = monthStr.split('-');
    return `${year}년 ${parseInt(month)}월`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatChartCurrency(value) {
    if (value >= 1000000) {
        return '₩' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '₩' + (value / 1000).toFixed(0) + 'K';
    }
    return '₩' + value;
}

function generateCategoryColors(count) {
    const colors = [
        'rgb(59, 130, 246)',    // blue
        'rgb(239, 68, 68)',     // red
        'rgb(34, 197, 94)',     // green
        'rgb(217, 119, 6)',     // amber
        'rgb(168, 85, 247)',    // purple
        'rgb(236, 72, 153)',    // pink
        'rgb(20, 184, 166)',    // teal
        'rgb(249, 115, 22)',    // orange
        'rgb(139, 92, 246)',    // violet
        'rgb(8, 145, 178)'      // cyan
    ];

    return colors.slice(0, count).concat(
        Array(Math.max(0, count - colors.length))
            .fill(0)
            .map((_, i) => `hsl(${(i * 360 / count) % 360}, 70%, 60%)`)
    );
}
