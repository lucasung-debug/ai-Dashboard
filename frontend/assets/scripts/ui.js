/* ============================================================================
   UI.JS - UI Component Management
   ============================================================================
   Handles modals, tabs, notifications, and other interactive UI elements.
   ============================================================================ */

/* ============================================================================
   1. MODAL MANAGEMENT
   ============================================================================ */

/**
 * Open a modal by ID
 * @param {string} modalId - ID of the modal element
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.warn(`Modal not found: ${modalId}`);
    return;
  }

  modal.classList.remove('hidden');

  // Focus on first input in modal
  const firstInput = modal.querySelector('input, textarea, select');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

/**
 * Close a modal by ID
 * @param {string} modalId - ID of the modal element
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.warn(`Modal not found: ${modalId}`);
    return;
  }

  modal.classList.add('hidden');
}

/**
 * Toggle modal visibility
 * @param {string} modalId - ID of the modal element
 */
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.warn(`Modal not found: ${modalId}`);
    return;
  }

  if (modal.classList.contains('hidden')) {
    openModal(modalId);
  } else {
    closeModal(modalId);
  }
}

/**
 * Setup modal backdrop click to close
 * Modal must have class "modal-overlay" for this to work
 */
function setupModalBackdropClose() {
  document.addEventListener('click', (e) => {
    // Check if clicked element has class 'modal-overlay'
    if (e.target.classList.contains('modal-overlay')) {
      // Close this modal
      e.target.classList.add('hidden');
    }
  });
}

/**
 * Setup modal close buttons (buttons with data-close-modal attribute)
 */
function setupModalCloseButtons() {
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const modalId = closeBtn.dataset.closeModal;
      closeModal(modalId);
    }
  });
}

/**
 * Setup all modal-related functionality
 */
function initModals() {
  setupModalBackdropClose();
  setupModalCloseButtons();

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close all visible modals (last one first)
      const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
      if (modals.length > 0) {
        modals[modals.length - 1].classList.add('hidden');
      }
    }
  });
}

/* ============================================================================
   2. TAB MANAGEMENT
   ============================================================================ */

/**
 * Switch to a tab by name
 * @param {string} tabName - Name/ID of the tab
 * @param {string} containerSelector - CSS selector for tab container (optional)
 */
function switchTab(tabName, containerSelector = null) {
  // Hide all tab content in container
  let container = null;
  if (containerSelector) {
    container = document.querySelector(containerSelector);
  } else {
    container = document.body;
  }

  const allViews = container.querySelectorAll('[data-tab-content]');
  allViews.forEach((view) => {
    view.classList.add('hidden');
  });

  // Deactivate all tab buttons
  const allBtns = container.querySelectorAll('[data-tab-btn]');
  allBtns.forEach((btn) => {
    btn.classList.remove('active');
  });

  // Show selected view
  const selectedView = container.querySelector(
    `[data-tab-content="${tabName}"]`
  );
  if (selectedView) {
    selectedView.classList.remove('hidden');
  }

  // Activate selected button
  const selectedBtn = container.querySelector(`[data-tab-btn="${tabName}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
}

/**
 * Setup tab navigation listeners
 */
function initTabs() {
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab-btn]');
    if (tabBtn) {
      const tabName = tabBtn.dataset.tabBtn;
      const container = tabBtn.closest('[data-tab-nav]')?.parentElement;
      const containerSelector = container ? `[id="${container.id}"]` : null;
      switchTab(tabName, containerSelector);
    }
  });
}

/* ============================================================================
   3. NOTIFICATION/TOAST SYSTEM
   ============================================================================ */

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (0 = no auto-dismiss)
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} anim-slide-up`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }

  return toast;
}

/**
 * Shorthand for success notification
 */
function showSuccess(message, duration = 3000) {
  return showNotification(message, 'success', duration);
}

/**
 * Shorthand for error notification
 */
function showError(message, duration = 3000) {
  return showNotification(message, 'danger', duration);
}

/**
 * Shorthand for warning notification
 */
function showWarning(message, duration = 3000) {
  return showNotification(message, 'warning', duration);
}

/**
 * Shorthand for info notification
 */
function showInfo(message, duration = 3000) {
  return showNotification(message, 'info', duration);
}

/* ============================================================================
   4. DROPDOWN/MENU MANAGEMENT
   ============================================================================ */

/**
 * Toggle dropdown menu
 * @param {string} dropdownId - ID of dropdown element
 */
function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) {
    console.warn(`Dropdown not found: ${dropdownId}`);
    return;
  }

  dropdown.classList.toggle('hidden');
}

/**
 * Close dropdown by ID
 * @param {string} dropdownId - ID of dropdown element
 */
function closeDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  dropdown.classList.add('hidden');
}

/**
 * Close all open dropdowns
 */
function closeAllDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
    dropdown.classList.add('hidden');
  });
}

/**
 * Setup dropdown functionality
 */
function initDropdowns() {
  // Toggle on button click
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-toggle-dropdown]');
    if (toggleBtn) {
      const dropdownId = toggleBtn.dataset.toggleDropdown;
      toggleDropdown(dropdownId);
      e.stopPropagation();
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // Don't close when clicking inside dropdown
  document.addEventListener('click', (e) => {
    const dropdown = e.target.closest('[data-dropdown]');
    if (dropdown) {
      e.stopPropagation();
    }
  });
}

/* ============================================================================
   5. FORM UTILITIES
   ============================================================================ */

/**
 * Clear form fields
 * @param {string} formId - ID of form element
 */
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`Form not found: ${formId}`);
    return;
  }

  form.reset();
}

/**
 * Get form data as object
 * @param {string} formId - ID of form element
 * @returns {object} Form data
 */
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`Form not found: ${formId}`);
    return {};
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  return data;
}

/**
 * Set form data from object
 * @param {string} formId - ID of form element
 * @param {object} data - Data object
 */
function setFormData(formId, data) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`Form not found: ${formId}`);
    return;
  }

  Object.keys(data).forEach((key) => {
    const field = form.elements[key];
    if (field) {
      field.value = data[key];
    }
  });
}

/**
 * Validate form (checks required fields)
 * @param {string} formId - ID of form element
 * @returns {boolean} Whether form is valid
 */
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.warn(`Form not found: ${formId}`);
    return false;
  }

  return form.checkValidity();
}

/* ============================================================================
   6. LOADING STATE
   ============================================================================ */

/**
 * Show loading state on element
 * @param {string} elementId - ID of element
 */
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.classList.add('loading');
}

/**
 * Hide loading state on element
 * @param {string} elementId - ID of element
 */
function hideLoading(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.classList.remove('loading');
}

/* ============================================================================
   7. UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Scroll to element smoothly
 * @param {string} elementId - ID of element
 */
function scrollToElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Add active class to element and siblings
 * @param {HTMLElement} element - Element to activate
 */
function setActive(element) {
  if (!element) return;

  const siblings = element.parentElement.children;
  Array.from(siblings).forEach((sibling) => {
    sibling.classList.remove('active');
  });

  element.classList.add('active');
}

/**
 * Toggle class on element
 * @param {string} elementId - ID of element
 * @param {string} className - Class name
 */
function toggleClass(elementId, className) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.classList.toggle(className);
}

/**
 * Debounce function for event handlers
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {function} Debounced function
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for event handlers
 * @param {function} func - Function to throttle
 * @param {number} delay - Delay in ms
 * @returns {function} Throttled function
 */
function throttle(func, delay = 300) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/* ============================================================================
   8. INITIALIZATION
   ============================================================================ */

/**
 * Initialize all UI functionality
 */
function initUI() {
  initModals();
  initTabs();
  initDropdowns();
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', initUI);

// Also try to init immediately in case DOM is ready
if (document.readyState === 'loading') {
  // DOM is still loading
} else {
  // DOM is already loaded
  initUI();
}
