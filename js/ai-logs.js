Auth.requireAuth();
renderNavUser();

function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const id = 'toast-' + Date.now();
    c.insertAdjacentHTML('beforeend', `
        <div class="toast ${type}" id="${id}">
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-body"><div class="toast-msg">${msg}</div></div>
        </div>
    `);
    setTimeout(() => document.getElementById(id)?.remove(), 3500);
}

async function summarizeLogs() {
    const logContent = document.getElementById('logContent').value.trim();
    const context    = document.getElementById('logContext').value.trim();

    if (logContent.length < 50) {
        toast('Log content must be at least 50 characters', 'error');
        return;
    }
    if (logContent.length > 8000) {
        toast('Log content too long (max 8000 chars)', 'error');
        return;
    }

    const btn = document.getElementById('logBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> AI is analyzing logs…';
    document.getElementById('resultArea').innerHTML = '';

    try {
        const result = await API.summarizeLogs(logContent, context || undefined);
        renderResult(result);
        toast('Log summary generated', 'success');
    } catch (e) {
        toast(e.message, 'error');
        document.getElementById('resultArea').innerHTML =
            `<div class="alert alert-danger" style="margin-top:16px">⚠️ ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📋 Summarize Logs with AI';
    }
}

const SEV_BADGE = {
    CRITICAL: 'badge-red', HIGH: 'badge-orange',
    MEDIUM: 'badge-amber', LOW: 'badge-cyan', INFO: 'badge-blue', UNKNOWN: 'badge-gray'
};

function renderResult(r) {
    document.getElementById('resultArea').innerHTML = `
        <div class="card" style="margin-top:20px">
            <div class="card-header">
                🤖 AI Log Analysis
                <span class="badge ${SEV_BADGE[r.severity] || 'badge-gray'}">
                    ${r.severity || 'UNKNOWN'} Severity
                </span>
            </div>
            <div class="card-body">
                <div class="ai-result-section">
                    <div class="ai-result-section-title">📝 Summary</div>
                    <div class="ai-result-section-body">${r.summary || '—'}</div>
                </div>
                <div class="ai-result-section">
                    <div class="ai-result-section-title">🔑 Key Events</div>
                    <div class="ai-result-section-body" style="white-space:pre-line">${r.keyEvents || '—'}</div>
                </div>
            </div>
        </div>
    `;
}