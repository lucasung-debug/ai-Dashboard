/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHARTS-DASHBOARD.JS - Chart Configuration & Helpers
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Chart.js configuration for dashboard visualizations
 * All chart rendering logic is in dashboard.js (renderCategoryChart, etc.)
 * This file provides helper utilities for chart styling and data formatting
 */

/**
 * Get color palette based on current theme
 * @returns {Object} Color palette
 */
function getChartColorPalette() {
    const isDark = document.documentElement.classList.contains('dark');

    return {
        primary: isDark ? '#5472e4' : '#3e63dd',
        danger: isDark ? '#ff9592' : '#e54666',
        success: isDark ? '#86ead4' : '#58d5ba',
        warning: isDark ? '#ffc53d' : '#ffba18',
        secondary: isDark ? '#a1a8ff' : '#6b7ee3',
        accent: isDark ? '#d4a574' : '#c4886f',
        text: isDark ? '#9da3ad' : '#626a75',
        grid: isDark ? '#2e3038' : '#e8eaed',
        bg: isDark ? '#111113' : '#ffffff'
    };
}

/**
 * Format currency value for chart labels
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code (default 'KRW')
 * @returns {string} Formatted currency string
 */
function formatChartCurrency(value, currency = 'KRW') {
    if (currency === 'KRW' || currency === '원') {
        return '₩' + value.toLocaleString('ko-KR');
    } else if (currency === 'USD' || currency === '$') {
        return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (currency === 'JPY' || currency === '¥') {
        return '¥' + value.toLocaleString('ja-JP');
    }
    return '₩' + value.toLocaleString('ko-KR');
}

/**
 * Get responsive chart height
 * @returns {string} Height in pixels
 */
function getChartHeight() {
    const width = window.innerWidth;
    if (width < 640) {
        return '200px';  // Mobile
    } else if (width < 1024) {
        return '280px';  // Tablet
    }
    return '360px';  // Desktop
}

/**
 * Setup chart.js plugin for gradient background
 */
function setupChartGradients() {
    // This is a placeholder for future Chart.js plugin integration
    // Example: chart-js-plugin-gradient
}

/**
 * Watch for theme changes and update chart colors
 */
function watchThemeChanges() {
    // Create a MutationObserver to watch for dark class changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                // Theme changed, re-render charts
                if (typeof renderAllCharts === 'function') {
                    renderAllCharts();
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Initialize chart resize observer
 */
function initChartResizeObserver() {
    if (!window.ResizeObserver) {
        return;  // Not supported
    }

    const observer = new ResizeObserver(() => {
        // Debounce resize
        clearTimeout(window.chartResizeTimer);
        window.chartResizeTimer = setTimeout(() => {
            if (typeof renderAllCharts === 'function') {
                renderAllCharts();
            }
        }, 500);
    });

    const chartsContainer = document.querySelector('main');
    if (chartsContainer) {
        observer.observe(chartsContainer);
    }
}

/**
 * Get default chart options (shared across charts)
 * @returns {Object} Default options
 */
function getDefaultChartOptions() {
    const palette = getChartColorPalette();

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: palette.text,
                    font: {
                        family: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        size: 12,
                        weight: 500
                    },
                    padding: 12,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: palette.bg,
                titleColor: palette.text,
                bodyColor: palette.text,
                borderColor: palette.grid,
                borderWidth: 1,
                padding: 8,
                displayColors: true,
                font: {
                    family: "'Pretendard Variable', sans-serif",
                    size: 12
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: palette.text,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: palette.grid,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: palette.text,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: palette.grid,
                    drawBorder: false
                }
            }
        }
    };
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
    watchThemeChanges();
    initChartResizeObserver();
});
