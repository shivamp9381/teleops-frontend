Auth.requireAuth();
renderNavUser();

let currentTab = 'active';

const SEV_BADGE = {
    CRITICAL: 'badge-red', HIGH: 'badge-orange',
    MEDIUM: 'badge-amber', LOW: 'badge-cyan'
};
const STATUS_BADGE = {
    ACTIVE: 'badge-red', ACKNOWLEDGED: 'badge-amber', RESOLVED: 'badge-green'
};

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

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-active').className =
        tab === 'active' ? 'btn btn-primary' : 'btn btn-ghost';
    document.getElementById('tab-all').className =
        tab === 'all' ? 'btn btn-primary' : 'btn btn-ghost';
    loadAlarms();
}

async function loadAlarms() {
    document.getElementById('alarmTable').innerHTML =
        '<tr class="loading-row"><td colspan="6">Loading…</td></tr>';
    document.getElementById('tableTitle').textContent =
        currentTab === 'active' ? 'Active Alarms' : 'All Alarms';
    try {
        const alarms = currentTab === 'active'
            ? await API.getActiveAlarms()
            : await API.getAlarms();
        renderTable(alarms);
    } catch (e) {
        document.getElementById('alarmTable').innerHTML =
            `<tr class="loading-row"><td colspan="6">Error: ${e.message}</td></tr>`;
    }
}

function renderTable(alarms) {
    const tb = document.getElementById('alarmTable');
    if (!alarms.length) {
        tb.innerHTML = `<tr><td colspan="6">
            <div class="empty-state">
                <div class="icon">✅</div>
                <h3>No alarms found</h3>
            </div>
        </td></tr>`;
        return;
    }
    const canAct = Auth.isEngineer();
    tb.innerHTML = alarms.map(a => `
        <tr>
            <td><span class="badge ${SEV_BADGE[a.severity] || 'badge-gray'}">${a.severity}</span></td>
            <td>
                <strong>${a.title}</strong>
                ${a.rcaResult ? `<span title="RCA done" style="margin-left:6px">🤖</span>` : ''}
            </td>
            <td>${a.deviceName || '—'}</td>
            <td><span class="badge ${STATUS_BADGE[a.status] || 'badge-gray'}">${a.status}</span></td>
            <td style="font-size:12px;color:var(--text-muted)">
                ${a.raisedAt ? new Date(a.raisedAt).toLocaleString() : '—'}
            </td>
            <td>
                <div class="action-row">
                    ${canAct && a.status === 'ACTIVE' ? `
                    <button class="btn btn-warning btn-sm"
                        onclick="acknowledgeAlarm('${a.id}')">
                        👁️ Ack
                    </button>` : ''}
                    ${canAct && a.status !== 'RESOLVED' ? `
                    <button class="btn btn-success btn-sm"
                        onclick="openResolveModal('${a.id}')">
                        ✅ Resolve
                    </button>` : ''}
                    ${canAct ? `
                    <a href="ai-rca.html?alarmId=${a.id}" class="btn btn-ghost btn-sm">
                        🤖 RCA
                    </a>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function openRaiseModal() {
    // Load devices into dropdown
    const sel = document.getElementById('aDeviceId');
    sel.innerHTML = '<option value="">— Loading… —</option>';
    document.getElementById('raiseModal').classList.add('open');
    try {
        const devices = await API.getDevices();
        sel.innerHTML = '<option value="">— Select Device —</option>' +
            devices.map(d =>
                `<option value="${d.id}">${d.name} (${d.ipAddress}) — ${d.status}</option>`
            ).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Error loading devices</option>';
    }
    document.getElementById('aSeverity').value = '';
    document.getElementById('aTitle').value = '';
    document.getElementById('aDesc').value = '';
}

async function raiseAlarm() {
    const deviceId  = document.getElementById('aDeviceId').value;
    const severity  = document.getElementById('aSeverity').value;
    const title     = document.getElementById('aTitle').value.trim();
    const description = document.getElementById('aDesc').value.trim();

    if (!deviceId || !severity || !title || !description) {
        toast('Please fill all required fields', 'error');
        return;
    }

    try {
        await API.raiseAlarm({ deviceId, severity, title, description });
        toast('Alarm raised successfully', 'success');
        closeModal('raiseModal');
        loadAlarms();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function acknowledgeAlarm(id) {
    try {
        await API.acknowledgeAlarm(id);
        toast('Alarm acknowledged', 'success');
        loadAlarms();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openResolveModal(id) {
    document.getElementById('resolveAlarmId').value = id;
    document.getElementById('resolveNote').value = '';
    document.getElementById('resolveModal').classList.add('open');
}

async function submitResolve() {
    const id   = document.getElementById('resolveAlarmId').value;
    const note = document.getElementById('resolveNote').value.trim();
    if (note.length < 10) {
        toast('Resolution note must be at least 10 characters', 'error');
        return;
    }
    try {
        await API.resolveAlarm(id, note);
        toast('Alarm resolved', 'success');
        closeModal('resolveModal');
        loadAlarms();
    } catch (e) {
        toast(e.message, 'error');
    }
}

// Hide raise button for READ_ONLY
if (!Auth.isEngineer()) {
    document.getElementById('raiseAlarmBtn').style.display = 'none';
}

loadAlarms();