/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATA-MANAGER.JS - Cross-Tab Data Synchronization & Caching
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - localStorage-based data caching with TTL
 * - Cross-tab event synchronization
 * - Real-time updates on data changes
 * - Cache invalidation and refresh logic
 */

// ─────────────────────────────────────────────────────────────────────────
// Data Manager Class
// ─────────────────────────────────────────────────────────────────────────

class DataManager {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
        this.ttl = {
            transactions: 5 * 60 * 1000,      // 5 minutes
            subscriptions: 5 * 60 * 1000,     // 5 minutes
            summary: 2 * 60 * 1000,           // 2 minutes
            exchangeRate: 24 * 60 * 60 * 1000 // 24 hours
        };

        this.setupStorageListener();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Storage Event Listener
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Setup listener for storage changes (cross-tab sync)
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === null) {
                // Clear all
                this.clearCache();
            } else if (e.key && e.key.startsWith('app_')) {
                // Data changed in another tab
                const key = e.key.replace('app_', '');
                this.invalidateCache(key);
                this.notifyObservers(key, e.newValue);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Cache Management
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Get cached data or null if expired
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     */
    getFromCache(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        const ttl = this.ttl[key] || 5 * 60 * 1000;

        if (now - entry.timestamp > ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set cache value
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    setCache(key, value, ttl = null) {
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });

        // Also store in localStorage for cross-tab sync
        try {
            localStorage.setItem(`app_${key}`, JSON.stringify({
                value: value,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('localStorage quota exceeded:', e);
        }
    }

    /**
     * Invalidate cache for a key
     * @param {string} key - Cache key
     */
    invalidateCache(key) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(`app_${key}`);
        } catch (e) {
            console.warn('Error removing from localStorage:', e);
        }

        // Notify observers
        this.notifyObservers(key, null);
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('app_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('Error clearing localStorage:', e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Observer Pattern
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to data changes
     * @param {string} key - Cache key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.observers.has(key)) {
            this.observers.set(key, new Set());
        }

        this.observers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.observers.get(key).delete(callback);
        };
    }

    /**
     * Notify all observers of a data change
     * @param {string} key - Cache key
     * @param {any} value - New value
     */
    notifyObservers(key, value) {
        if (this.observers.has(key)) {
            this.observers.get(key).forEach(callback => {
                try {
                    callback(value);
                } catch (e) {
                    console.error('Observer callback error:', e);
                }
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Data Operations
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Get transactions for a month
     * @param {string} month - YYYY-MM format
     * @returns {Promise<any>} Transactions data
     */
    async getTransactions(month) {
        const cacheKey = `transactions_${month}`;
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await apiGet(`/api/ledger/transactions?month=${month}`);
            if (response && response.data) {
                this.setCache(cacheKey, response.data);
                return response.data;
            }
        } catch (e) {
            console.error('Error fetching transactions:', e);
        }

        return null;
    }

    /**
     * Get all subscriptions
     * @returns {Promise<any>} Subscriptions data
     */
    async getSubscriptions() {
        const cacheKey = 'subscriptions';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await apiGet('/api/subscriptions');
            if (response && response.data) {
                this.setCache(cacheKey, response.data);
                return response.data;
            }
        } catch (e) {
            console.error('Error fetching subscriptions:', e);
        }

        return null;
    }

    /**
     * Get dashboard summary
     * @param {string} month - YYYY-MM format
     * @returns {Promise<any>} Summary data
     */
    async getDashboardSummary(month) {
        const cacheKey = `summary_${month}`;
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await apiPost('/api/ledger/dashboard-summary', {
                month: month,
                currencies: ['KRW', 'USD']
            });

            if (response && response.data) {
                this.setCache(cacheKey, response.data);
                return response.data;
            }
        } catch (e) {
            console.error('Error fetching dashboard summary:', e);
        }

        return null;
    }

    /**
     * Get exchange rates
     * @returns {Promise<any>} Exchange rate data
     */
    async getExchangeRates() {
        const cacheKey = 'exchangeRates';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await apiGet('/api/ledger/exchange-rates');
            if (response && response.data) {
                this.setCache(cacheKey, response.data);
                return response.data;
            }
        } catch (e) {
            console.error('Error fetching exchange rates:', e);
        }

        return null;
    }

    /**
     * Invalidate all transaction caches
     */
    invalidateTransactions() {
        // Clear all transaction_* keys
        for (const [key] of this.cache) {
            if (key.startsWith('transactions_')) {
                this.invalidateCache(key);
            }
        }
    }

    /**
     * Invalidate all summary caches
     */
    invalidateSummaries() {
        // Clear all summary_* keys
        for (const [key] of this.cache) {
            if (key.startsWith('summary_')) {
                this.invalidateCache(key);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event Triggering
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Trigger refresh event for all tabs
     * @param {string} eventName - Event name
     * @param {any} data - Event data
     */
    triggerRefresh(eventName, data = null) {
        try {
            localStorage.setItem(`app_event_${eventName}`, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));

            // Clean up after 1 second
            setTimeout(() => {
                try {
                    localStorage.removeItem(`app_event_${eventName}`);
                } catch (e) {
                    console.warn('Error removing event from localStorage:', e);
                }
            }, 1000);
        } catch (e) {
            console.warn('Error triggering refresh:', e);
        }
    }

    /**
     * Watch for specific event across tabs
     * @param {string} eventName - Event name to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unwatch function
     */
    watchEvent(eventName, callback) {
        const handleStorage = (e) => {
            if (e.key === `app_event_${eventName}` && e.newValue) {
                try {
                    const eventData = JSON.parse(e.newValue);
                    callback(eventData);
                } catch (error) {
                    console.error('Error parsing event data:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorage);

        // Return unwatch function
        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Global Instance
// ─────────────────────────────────────────────────────────────────────────

const dataManager = new DataManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
