Auth.requireAuth();
renderNavUser();

let alarmMap = {};

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

async function loadAlarms() {
    const sel = document.getElementById('alarmSelect');
    sel.innerHTML = '<option value="">— Loading… —</option>';
    try {
        const alarms = await API.getAlarms();
        const active = alarms.filter(a => a.status !== 'RESOLVED');
        alarmMap = {};
        active.forEach(a => alarmMap[a.id] = a);
        sel.innerHTML = '<option value="">— Select an active alarm —</option>' +
            active.map(a =>
                `<option value="${a.id}">[${a.severity}] ${a.title} — ${a.deviceName}</option>`
            ).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Error loading alarms</option>';
    }
}

document.getElementById('alarmSelect').addEventListener('change', function() {
    const preview = document.getElementById('alarmPreview');
    const alarm = alarmMap[this.value];
    if (!alarm) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    preview.innerHTML = `
        <strong>${alarm.title}</strong><br>
        <span style="font-size:12px">
            Device: ${alarm.deviceName} &nbsp;|&nbsp;
            Severity: ${alarm.severity} &nbsp;|&nbsp;
            Status: ${alarm.status}
        </span>
    `;
});

async function performRca() {
    const alarmId = document.getElementById('alarmSelect').value;
    if (!alarmId) { toast('Please select an alarm', 'error'); return; }

    const btn = document.getElementById('rcaBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> AI is analyzing… (this may take 5–15 seconds)';
    document.getElementById('resultArea').innerHTML = '';

    try {
        const result = await API.performRca(alarmId);
        renderResult(result);
        toast('RCA complete — result saved to alarm', 'success');
    } catch (e) {
        toast(e.message, 'error');
        document.getElementById('resultArea').innerHTML =
            `<div class="alert alert-danger" style="margin-top:16px">⚠️ ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔍 Analyze with AI';
    }
}

function renderResult(r) {
    document.getElementById('resultArea').innerHTML = `
        <div class="card" style="margin-top:20px">
            <div class="card-header">
                🤖 AI Analysis Result
                <span class="badge badge-blue">${r.confidence || 'N/A'} Confidence</span>
            </div>
            <div class="card-body">
                <div class="ai-result-section">
                    <div class="ai-result-section-title">🔎 Possible Cause</div>
                    <div class="ai-result-section-body">${r.possibleCause || '—'}</div>
                </div>
                <div class="ai-result-section">
                    <div class="ai-result-section-title">🛠️ Suggested Fix</div>
                    <div class="ai-result-section-body">${r.suggestedFix || '—'}</div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
                    Analyzed at: ${r.analyzedAt ? new Date(r.analyzedAt).toLocaleString() : 'just now'}
                    &nbsp;|&nbsp; Result saved to alarm record.
                </div>
            </div>
        </div>
    `;
}

// Pre-fill from URL param
const params = new URLSearchParams(window.location.search);
if (params.get('alarmId')) {
    loadAlarms().then(() => {
        document.getElementById('alarmSelect').value = params.get('alarmId');
        document.getElementById('alarmSelect').dispatchEvent(new Event('change'));
    });
} else {
    loadAlarms();
}