Auth.requireAuth();
renderNavUser();

let ticketMap = {};

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

async function loadTickets() {
    const sel = document.getElementById('ticketSelect');
    sel.innerHTML = '<option value="">— Loading… —</option>';
    try {
        const tickets = await API.getTickets();
        const eligible = tickets.filter(
            t => t.status === 'RESOLVED' || t.status === 'CLOSED'
        );
        ticketMap = {};
        eligible.forEach(t => ticketMap[t.id] = t);
        sel.innerHTML = '<option value="">— Select a resolved/closed ticket —</option>' +
            eligible.map(t =>
                `<option value="${t.id}">${t.ticketNumber} — ${t.title} [${t.status}]</option>`
            ).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Error loading tickets</option>';
    }
}

document.getElementById('ticketSelect').addEventListener('change', function() {
    const preview = document.getElementById('ticketPreview');
    const ticket  = ticketMap[this.value];
    if (!ticket) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    preview.innerHTML = `
        <strong>${ticket.ticketNumber}: ${ticket.title}</strong><br>
        <span style="font-size:12px">
            Device: ${ticket.deviceName} &nbsp;|&nbsp;
            Priority: ${ticket.priority} &nbsp;|&nbsp;
            Status: ${ticket.status}
        </span>
    `;
});

async function generateReport() {
    const ticketId = document.getElementById('ticketSelect').value;
    if (!ticketId) { toast('Please select a ticket', 'error'); return; }

    const btn = document.getElementById('reportBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> AI is generating report…';
    document.getElementById('resultArea').innerHTML = '';

    try {
        const result = await API.generateReport(ticketId);
        renderResult(result);
        toast('Incident report generated — saved to ticket', 'success');
    } catch (e) {
        toast(e.message, 'error');
        document.getElementById('resultArea').innerHTML =
            `<div class="alert alert-danger" style="margin-top:16px">⚠️ ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📄 Generate Incident Report';
    }
}

function renderResult(r) {
    document.getElementById('resultArea').innerHTML = `
        <div class="card" style="margin-top:20px">
            <div class="card-header">
                📄 AI Incident Report — ${r.ticketNumber || ''}
                <span style="font-size:12px;color:var(--text-muted)">
                    ${r.generatedAt ? new Date(r.generatedAt).toLocaleString() : ''}
                </span>
            </div>
            <div class="card-body">
                ${section('📝 Executive Summary',  r.summary)}
                ${section('⏱️ Timeline',           r.timeline)}
                ${section('🔎 Root Cause',          r.rootCause)}
                ${section('🛠️ Resolution',          r.resolution)}
                ${section('💡 Recommendations',     r.recommendations)}
            </div>
        </div>
    `;
}

function section(title, body) {
    return `
        <div class="ai-result-section">
            <div class="ai-result-section-title">${title}</div>
            <div class="ai-result-section-body" style="white-space:pre-line">${body || '—'}</div>
        </div>
    `;
}

// Pre-fill from URL param
const params = new URLSearchParams(window.location.search);
if (params.get('ticketId')) {
    loadTickets().then(() => {
        document.getElementById('ticketSelect').value = params.get('ticketId');
        document.getElementById('ticketSelect').dispatchEvent(new Event('change'));
    });
} else {
    loadTickets();
}