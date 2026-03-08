/**
 * settings.js - 설정 페이지 로직
 * 사용자 설정 관리, 데이터 백업/복원, 테마 관리
 */

// ═══ STATE ═══
let currentSettings = null;

// ═══ INITIALIZATION ═══
document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings page loaded');

    // Initialize theme
    initTheme();

    // Load settings
    loadSettings();

    // Setup drag-and-drop for restore modal
    setupDropZone();

    // Bind theme buttons
    updateThemeButtonStyles();
});

// ═══ SETTINGS LOADING & RENDERING ═══
async function loadSettings() {
    try {
        const response = await apiGet('/settings');
        currentSettings = response;
        renderSettingsForm();
    } catch (error) {
        console.error('Failed to load settings:', error);
        // Use default settings if load fails
        currentSettings = {
            id: 'default',
            nickname: '사용자',
            default_currency: 'KRW',
            timezone: 'Asia/Seoul',
            theme: 'dark',
            notification_days_before: 3
        };
        renderSettingsForm();
        showWarning('설정 로드 실패. 기본값으로 표시합니다.');
    }
}

function renderSettingsForm() {
    if (!currentSettings) return;

    // Profile settings
    document.getElementById('nickname-input').value = currentSettings.nickname || '사용자';
    document.getElementById('currency-select').value = currentSettings.default_currency || 'KRW';
    document.getElementById('timezone-select').value = currentSettings.timezone || 'Asia/Seoul';
    document.getElementById('notification-days-input').value = currentSettings.notification_days_before || 3;

    // Theme buttons
    updateThemeButtonStyles();
}

async function saveUserSettings() {
    const settings = {
        id: currentSettings.id || 'default',
        nickname: document.getElementById('nickname-input').value || '사용자',
        default_currency: document.getElementById('currency-select').value,
        timezone: document.getElementById('timezone-select').value,
        theme: currentSettings.theme || 'dark',
        notification_days_before: parseInt(document.getElementById('notification-days-input').value) || 3
    };

    try {
        await apiPut('/settings', settings);
        currentSettings = settings;
        showSuccess('설정이 저장되었습니다.');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('설정 저장 실패');
    }
}

// ═══ THEME MANAGEMENT ═══
function setTheme(theme) {
    // Update current settings
    currentSettings.theme = theme;

    // Update localStorage and DOM
    localStorage.setItem('theme', theme);
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);

    // Update button styles
    updateThemeButtonStyles();

    // Save to backend
    apiPut('/settings', currentSettings).catch(err => {
        console.error('Failed to save theme preference:', err);
    });
}

function updateThemeButtonStyles() {
    const lightBtn = document.getElementById('theme-light-btn');
    const darkBtn = document.getElementById('theme-dark-btn');

    const currentTheme = currentSettings?.theme || 'dark';

    if (lightBtn && darkBtn) {
        if (currentTheme === 'light') {
            lightBtn.classList.add('border-primary-9', 'bg-primary-9/10');
            darkBtn.classList.remove('border-primary-9', 'bg-primary-9/10');
        } else {
            darkBtn.classList.add('border-primary-9', 'bg-primary-9/10');
            lightBtn.classList.remove('border-primary-9', 'bg-primary-9/10');
        }
    }
}

// ═══ BACKUP & RESTORE ═══
async function exportBackup() {
    try {
        const link = document.createElement('a');
        link.href = '/ledger/export/backup';
        link.download = `가계부_백업_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        showSuccess('백업이 다운로드되었습니다.');
    } catch (error) {
        console.error('Backup export failed:', error);
        showError('백업 다운로드 실패');
    }
}

function openRestoreModal() {
    document.getElementById('restore-modal').classList.remove('hidden');
    // Reset file input
    document.getElementById('restore-file-input').value = '';
}

function closeRestoreModal() {
    document.getElementById('restore-modal').classList.add('hidden');
}

function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    // Click to select file
    dropZone.addEventListener('click', () => {
        document.getElementById('restore-file-input').click();
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-primary-9', 'bg-primary-9/5');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-primary-9', 'bg-primary-9/5');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-primary-9', 'bg-primary-9/5');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('restore-file-input').files = files;
            restoreFromFile();
        }
    });
}

async function restoreFromFile() {
    const file = document.getElementById('restore-file-input').files[0];
    if (!file) return;

    if (!confirm('현재 모든 데이터가 백업 파일로 덮어씌워집니다.\n진행하시겠습니까?')) {
        return;
    }

    // Second confirmation for safety
    if (!confirm('⚠️ 최종 확인: 정말로 복원하시겠습니까?\n되돌릴 수 없습니다.')) {
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/ledger/import/restore', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Restore failed');
        }

        const result = await response.json();
        closeRestoreModal();
        showSuccess(`${result.count}개 항목이 복원되었습니다.`);

        // Reload page after 1 second to reflect restored data
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Restore failed:', error);
        showError('백업 복원 실패: ' + error.message);
    }
}

// ═══ DATA RESET ═══
async function resetAllData() {
    if (!confirm('정말로 모든 데이터를 초기화하시겠습니까?\n⚠️ 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }

    if (!confirm('⚠️ 최종 확인: 정말로 초기화하시겠습니까?\n모든 거래, 예산, 목표 데이터가 삭제됩니다.')) {
        return;
    }

    try {
        // Suggest backup before reset
        if (confirm('초기화하기 전에 현재 데이터를 백업하시겠습니까?')) {
            exportBackup();
            // Wait for user to complete download
            showWarning('백업을 완료한 후 초기화를 진행하세요.');
            return;
        }

        // TODO: Implement actual data reset endpoints
        // For now, just show a message
        showWarning('데이터 초기화 기능은 아직 구현 중입니다.');

        // Once endpoints are available:
        // await apiPost('/ledger/reset/transactions', {});
        // await apiPost('/ledger/reset/budgets', {});
        // await apiPost('/ledger/reset/assets', {});
        // showSuccess('모든 데이터가 초기화되었습니다.');
        // setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Data reset failed:', error);
        showError('초기화 실패');
    }
}

// ═══ UTILITIES ═══
function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR');
}
