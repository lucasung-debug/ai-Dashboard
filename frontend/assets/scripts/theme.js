/* ============================================================================
   THEME.JS - Dark Mode Management
   ============================================================================
   Handles theme initialization, switching, and persistence.
   Manages CSS class on <html> element for dark mode styling.
   ============================================================================ */

/**
 * Initialize theme on page load
 * Priority: 1. LocalStorage, 2. System preference, 3. Default (light)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let isDark = false;

  if (savedTheme !== null) {
    // User has previously set a theme
    isDark = savedTheme === 'dark';
  } else if (prefersDark) {
    // Use system preference
    isDark = true;
  }

  applyTheme(isDark);
}

/**
 * Apply theme by adding/removing 'dark' class on <html>
 * @param {boolean} isDark - Whether to apply dark mode
 */
function applyTheme(isDark) {
  const html = document.documentElement;

  if (isDark) {
    html.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }

  // Persist choice
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  // Dispatch custom event for other scripts
  window.dispatchEvent(
    new CustomEvent('themechange', {
      detail: { isDark },
    })
  );
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(!isDark);
}

/**
 * Get current theme
 * @returns {string} 'light' or 'dark'
 */
function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Set theme explicitly
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
  if (theme === 'dark') {
    applyTheme(true);
  } else if (theme === 'light') {
    applyTheme(false);
  }
}

/**
 * Get theme toggle button element
 * @returns {HTMLElement|null} Theme toggle button
 */
function getThemeToggleButton() {
  return document.getElementById('theme-toggle-btn');
}

/**
 * Setup theme toggle button listener
 */
function setupThemeToggle() {
  const btn = getThemeToggleButton();
  if (btn) {
    btn.addEventListener('click', () => {
      toggleTheme();
      updateThemeToggleIcon();
    });

    // Update icon on load
    updateThemeToggleIcon();
  }
}

/**
 * Update theme toggle button icon/text based on current theme
 */
function updateThemeToggleIcon() {
  const btn = getThemeToggleButton();
  if (!btn) return;

  const isDark = document.documentElement.classList.contains('dark');

  // Update icon (assumes button has innerHTML)
  if (isDark) {
    btn.innerHTML = '☀️';
    btn.title = 'Switch to light mode';
  } else {
    btn.innerHTML = '🌙';
    btn.title = 'Switch to dark mode';
  }
}

/**
 * Listen for system theme changes (if user has not set a preference)
 */
function listenSystemThemeChange() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', (e) => {
    // Only apply if user hasn't set a preference
    if (localStorage.getItem('theme') === null) {
      applyTheme(e.matches);
    }
  });
}

/**
 * Initialize all theme-related functionality
 */
function initThemeSystem() {
  initTheme();
  setupThemeToggle();
  listenSystemThemeChange();
}

// Auto-initialize on script load
document.addEventListener('DOMContentLoaded', initThemeSystem);

// Also try to init immediately in case DOM is ready
if (
  document.readyState === 'loading' ||
  document.readyState === 'interactive'
) {
  initTheme();
} else {
  initThemeSystem();
}
