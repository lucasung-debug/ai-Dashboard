/* ============================================================================
   API.JS - Unified Fetch Wrapper and API Client
   ============================================================================
   Provides centralized API communication with error handling, retry logic,
   and timeout support.
   ============================================================================ */

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second, exponential backoff
};

/**
 * Main API call function with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retryAttempts,
  } = options;

  const url = `${API_CONFIG.baseURL}${endpoint}`;

  // Set default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const finalHeaders = { ...defaultHeaders, ...headers };

  // Prepare fetch options
  const fetchOptions = {
    method,
    headers: finalHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Retry logic with exponential backoff
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Parse and return response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return response.text();
      }
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Retry with exponential backoff
      if (attempt < retries - 1) {
        const delayMs = API_CONFIG.retryDelay * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('API call failed after retries');
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status = 500, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/* ============================================================================
   CONVENIENCE METHODS
   ============================================================================ */

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional options
 * @returns {Promise<any>} Response data
 */
async function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {object} options - Additional options
 * @returns {Promise<any>} Response data
 */
async function apiPost(endpoint, body = {}, options = {}) {
  return apiCall(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {object} options - Additional options
 * @returns {Promise<any>} Response data
 */
async function apiPut(endpoint, body = {}, options = {}) {
  return apiCall(endpoint, { ...options, method: 'PUT', body });
}

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {object} options - Additional options
 * @returns {Promise<any>} Response data
 */
async function apiPatch(endpoint, body = {}, options = {}) {
  return apiCall(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional options
 * @returns {Promise<any>} Response data
 */
async function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'DELETE' });
}

/* ============================================================================
   SPECIFIC API ENDPOINTS
   ============================================================================ */

/**
 * Fetch subscriptions
 * @returns {Promise<any>} Subscriptions data
 */
async function fetchSubscriptions() {
  try {
    const data = await apiGet('/subscriptions');
    return data;
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    showError('구독 목록을 불러올 수 없습니다.');
    throw error;
  }
}

/**
 * Create subscription
 * @param {object} subscription - Subscription data
 * @returns {Promise<any>} Created subscription
 */
async function createSubscription(subscription) {
  try {
    const data = await apiPost('/subscriptions', subscription);
    showSuccess('구독이 추가되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    showError('구독 추가에 실패했습니다.');
    throw error;
  }
}

/**
 * Update subscription
 * @param {string} id - Subscription ID
 * @param {object} subscription - Updated subscription data
 * @returns {Promise<any>} Updated subscription
 */
async function updateSubscription(id, subscription) {
  try {
    const data = await apiPut(`/subscriptions/${id}`, subscription);
    showSuccess('구독이 수정되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to update subscription:', error);
    showError('구독 수정에 실패했습니다.');
    throw error;
  }
}

/**
 * Delete subscription
 * @param {string} id - Subscription ID
 * @returns {Promise<any>} Response
 */
async function deleteSubscription(id) {
  try {
    const data = await apiDelete(`/subscriptions/${id}`);
    showSuccess('구독이 삭제되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to delete subscription:', error);
    showError('구독 삭제에 실패했습니다.');
    throw error;
  }
}

/**
 * Toggle subscription cancellation
 * @param {string} id - Subscription ID
 * @returns {Promise<any>} Updated subscription
 */
async function toggleSubscriptionCancel(id) {
  try {
    const data = await apiPatch(`/subscriptions/${id}/cancel`);
    showSuccess('상태가 변경되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to toggle cancellation:', error);
    showError('상태 변경에 실패했습니다.');
    throw error;
  }
}

/**
 * Fetch exchange rate
 * @returns {Promise<any>} Exchange rate data
 */
async function fetchExchangeRate() {
  try {
    const cached = localStorage.getItem('exchangeRate');
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      // Use cache if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        return { rate };
      }
    }

    const data = await apiGet('/exchange-rate');

    // Cache the result
    localStorage.setItem(
      'exchangeRate',
      JSON.stringify({
        rate: data.rate,
        timestamp: Date.now(),
      })
    );

    return data;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    // Return cached rate if available, or default
    const cached = localStorage.getItem('exchangeRate');
    if (cached) {
      return JSON.parse(cached);
    }
    return { rate: 1300 }; // Default fallback
  }
}

/**
 * Fetch transactions
 * @returns {Promise<any>} Transactions data
 */
async function fetchTransactions() {
  try {
    const data = await apiGet('/transactions');
    return data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    showError('거래 목록을 불러올 수 없습니다.');
    throw error;
  }
}

/**
 * Create transaction
 * @param {object} transaction - Transaction data
 * @returns {Promise<any>} Created transaction
 */
async function createTransaction(transaction) {
  try {
    const data = await apiPost('/transactions', transaction);
    showSuccess('거래가 추가되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    showError('거래 추가에 실패했습니다.');
    throw error;
  }
}

/**
 * Update transaction
 * @param {string} id - Transaction ID
 * @param {object} transaction - Updated transaction data
 * @returns {Promise<any>} Updated transaction
 */
async function updateTransaction(id, transaction) {
  try {
    const data = await apiPut(`/transactions/${id}`, transaction);
    showSuccess('거래가 수정되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    showError('거래 수정에 실패했습니다.');
    throw error;
  }
}

/**
 * Delete transaction
 * @param {string} id - Transaction ID
 * @returns {Promise<any>} Response
 */
async function deleteTransaction(id) {
  try {
    const data = await apiDelete(`/transactions/${id}`);
    showSuccess('거래가 삭제되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    showError('거래 삭제에 실패했습니다.');
    throw error;
  }
}

/**
 * Fetch budgets
 * @returns {Promise<any>} Budgets data
 */
async function fetchBudgets() {
  try {
    const data = await apiGet('/budgets');
    return data;
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    return { data: [] };
  }
}

/**
 * Save budget
 * @param {object} budget - Budget data
 * @returns {Promise<any>} Saved budget
 */
async function saveBudget(budget) {
  try {
    const data = await apiPost('/budgets', budget);
    showSuccess('예산이 저장되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to save budget:', error);
    showError('예산 저장에 실패했습니다.');
    throw error;
  }
}

/**
 * Fetch user assets
 * @returns {Promise<any>} Assets data
 */
async function fetchAssets() {
  try {
    const data = await apiGet('/assets');
    return data;
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return { data: [] };
  }
}

/**
 * Update assets
 * @param {object} assets - Assets data
 * @returns {Promise<any>} Updated assets
 */
async function updateAssets(assets) {
  try {
    const data = await apiPut('/assets', assets);
    showSuccess('자산이 업데이트되었습니다.');
    return data;
  } catch (error) {
    console.error('Failed to update assets:', error);
    showError('자산 업데이트에 실패했습니다.');
    throw error;
  }
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Set API base URL (for testing or different environments)
 * @param {string} url - New base URL
 */
function setAPIBaseURL(url) {
  API_CONFIG.baseURL = url;
}

/**
 * Get API base URL
 * @returns {string} Current base URL
 */
function getAPIBaseURL() {
  return API_CONFIG.baseURL;
}

/**
 * Check if API is available (health check)
 * @returns {Promise<boolean>} Whether API is available
 */
async function checkAPIHealth() {
  try {
    // Try to fetch exchange rate as a simple health check
    await apiGet('/exchange-rate');
    return true;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}

/* Export for use in other modules if needed */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiCall,
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    APIError,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionCancel,
    fetchExchangeRate,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchBudgets,
    saveBudget,
    fetchAssets,
    updateAssets,
    setAPIBaseURL,
    getAPIBaseURL,
    checkAPIHealth,
  };
}
