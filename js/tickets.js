Auth.requireAuth();
renderNavUser();

let currentTab = 'active';

const PRIO_BADGE = {
    CRITICAL: 'badge-red', HIGH: 'badge-orange',
    MEDIUM: 'badge-amber', LOW: 'badge-cyan'
};
const STATUS_BADGE = {
    OPEN: 'badge-blue', IN_PROGRESS: 'badge-amber',
    RESOLVED: 'badge-green', CLOSED: 'badge-gray'
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
    ['active','all','mine'].forEach(t => {
        document.getElementById(`tab-${t}`).className =
            t === tab ? 'btn btn-primary' : 'btn btn-ghost';
    });
    loadTickets();
}

async function loadTickets() {
    document.getElementById('ticketTable').innerHTML =
        '<tr class="loading-row"><td colspan="7">Loading…</td></tr>';
    const titles = {
        active: 'Active Tickets',
        all: 'All Tickets',
        mine: 'My Tickets'
    };
    document.getElementById('tableTitle').textContent =
        titles[currentTab];

    try {
        let tickets;
        if (currentTab === 'active')
            tickets = await API.getActiveTickets();
        else if (currentTab === 'mine')
            tickets = await API.request('GET', '/tickets/my');
        else
            tickets = await API.getTickets();
        renderTable(tickets);
    } catch (e) {
        document.getElementById('ticketTable').innerHTML =
            `<tr class="loading-row"><td colspan="7">Error: ${e.message}</td></tr>`;
    }
}

function renderTable(tickets) {
    const tb = document.getElementById('ticketTable');
    if (!tickets.length) {
        tb.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <div class="icon">🎫</div>
                <h3>No tickets found</h3>
            </div>
        </td></tr>`;
        return;
    }

    const isAdmin    = Auth.isAdmin();
    const isEngineer = Auth.isEngineer();

    tb.innerHTML = tickets.map(t => `
        <tr>
            <td><code style="color:var(--accent)">${t.ticketNumber}</code></td>
            <td>
                <span class="badge ${PRIO_BADGE[t.priority] || 'badge-gray'}">
                    ${t.priority}
                </span>
            </td>
            <td><strong>${t.title}</strong></td>
            <td>${t.deviceName || '—'}</td>
            <td>
                <span class="badge ${STATUS_BADGE[t.status] || 'badge-gray'}">
                    ${t.status}
                </span>
            </td>
            <td style="font-size:12px">${t.assignedName || '—'}</td>
            <td>
                <div class="action-row">
                    ${isAdmin && (t.status === 'OPEN' ||
                                  t.status === 'IN_PROGRESS') ? `
                    <button class="btn btn-warning btn-sm"
                        onclick="openAssignModal('${t.id}')">
                        👤 Assign
                    </button>` : ''}
                    ${isEngineer && (t.status === 'OPEN' ||
                                      t.status === 'IN_PROGRESS') ? `
                    <button class="btn btn-success btn-sm"
                        onclick="openResolveModal('${t.id}')">
                        ✅ Resolve
                    </button>` : ''}
                    ${isAdmin && t.status === 'RESOLVED' ? `
                    <button class="btn btn-ghost btn-sm"
                        onclick="closeTicket('${t.id}')">
                        🔒 Close
                    </button>` : ''}
                    ${isAdmin && t.status === 'RESOLVED' ? `
                    <a href="ai-report.html?ticketId=${t.id}"
                       class="btn btn-ghost btn-sm">
                        📄 Report
                    </a>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function openCreateModal() {
    const devSel = document.getElementById('tDeviceId');
    const almSel = document.getElementById('tAlarmId');
    devSel.innerHTML = '<option value="">— Loading… —</option>';
    almSel.innerHTML = '<option value="">— Loading… —</option>';

    document.getElementById('createModal').classList.add('open');
    document.getElementById('tTitle').value    = '';
    document.getElementById('tDesc').value     = '';
    document.getElementById('tPriority').value = '';

    try {
        const devices = await API.getDevices();
        devSel.innerHTML =
            '<option value="">— Select Device —</option>' +
            devices.map(d =>
                `<option value="${d.id}">
                    ${d.name} (${d.ipAddress}) — ${d.status}
                </option>`
            ).join('');
    } catch (e) {
        devSel.innerHTML =
            '<option value="">Error loading devices</option>';
    }

    try {
        const alarms = await API.getAlarms();
        almSel.innerHTML =
            '<option value="">— None —</option>' +
            alarms
                .filter(a => a.status !== 'RESOLVED')
                .map(a =>
                    `<option value="${a.id}">
                        [${a.severity}] ${a.title} (${a.deviceName})
                    </option>`
                ).join('');
    } catch (e) {
        almSel.innerHTML =
            '<option value="">No alarms available</option>';
    }
}

async function createTicket() {
    const deviceId    = document.getElementById('tDeviceId').value;
    const priority    = document.getElementById('tPriority').value;
    const alarmId     = document.getElementById('tAlarmId').value;
    const title       = document.getElementById('tTitle').value.trim();
    const description = document.getElementById('tDesc').value.trim();

    if (!deviceId || !priority || !title || !description) {
        toast('Please fill all required fields', 'error');
        return;
    }

    try {
        await API.createTicket({
            deviceId, priority, title, description,
            alarmId: alarmId || null
        });
        toast('Ticket created successfully', 'success');
        closeModal('createModal');
        loadTickets();
    } catch (e) {
        toast(e.message, 'error');
    }
}

// ─── IMPROVED Assign Modal — loads real engineers ─────────────────────────────

async function openAssignModal(ticketId) {
    document.getElementById('assignTicketId').value = ticketId;

    // Replace the plain text input with a dropdown
    const modalBody = document.querySelector('#assignModal .modal-body');
    modalBody.innerHTML = `
        <input type="hidden" id="assignTicketId" value="${ticketId}">
        <div class="form-group">
            <label class="form-label">Assign To *</label>
            <select id="assignUserSelect" class="form-select">
                <option value="">— Loading engineers… —</option>
            </select>
        </div>
    `;

    document.getElementById('assignModal').classList.add('open');

    try {
        const engineers = await API.getActiveEngineers();
        const sel = document.getElementById('assignUserSelect');
        if (!engineers.length) {
            sel.innerHTML =
                '<option value="">No active engineers available</option>';
            return;
        }
        sel.innerHTML =
            '<option value="">— Select Engineer —</option>' +
            engineers.map(e =>
                `<option value="${e.id}">${e.name} (${e.email})</option>`
            ).join('');
    } catch (e) {
        // Fallback to text input if API fails
        const modalBody =
            document.querySelector('#assignModal .modal-body');
        modalBody.innerHTML = `
            <input type="hidden" id="assignTicketId" value="${ticketId}">
            <div class="form-group">
                <label class="form-label">Assign To (User ID) *</label>
                <input type="text" id="assignUserId" class="form-control"
                       placeholder="Enter engineer's user ID">
                <small style="color:var(--text-muted);font-size:11px;
                              margin-top:4px;display:block">
                    Could not load engineers list. Enter ID manually.
                </small>
            </div>
        `;
    }
}

async function submitAssign() {
    const ticketId = document.getElementById('assignTicketId').value;

    // Try dropdown first, then text input
    const select = document.getElementById('assignUserSelect');
    const input  = document.getElementById('assignUserId');
    const userId = select ? select.value : (input ? input.value.trim() : '');

    if (!userId) {
        toast('Please select an engineer', 'error');
        return;
    }

    try {
        await API.assignTicket(ticketId, userId);
        toast('Ticket assigned successfully', 'success');
        closeModal('assignModal');
        loadTickets();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openResolveModal(ticketId) {
    document.getElementById('resolveTicketId').value    = ticketId;
    document.getElementById('resolveTicketNote').value  = '';
    document.getElementById('resolveTicketModal').classList.add('open');
}

async function submitResolveTicket() {
    const id         = document.getElementById('resolveTicketId').value;
    const resolution =
        document.getElementById('resolveTicketNote').value.trim();
    if (resolution.length < 20) {
        toast('Resolution must be at least 20 characters', 'error');
        return;
    }
    try {
        await API.resolveTicket(id, resolution);
        toast('Ticket resolved', 'success');
        closeModal('resolveTicketModal');
        loadTickets();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function closeTicket(id) {
    if (!confirm(
        'Close this ticket? This marks it as permanently closed.'
    )) return;
    try {
        await API.closeTicket(id);
        toast('Ticket closed', 'success');
        loadTickets();
    } catch (e) {
        toast(e.message, 'error');
    }
}

if (!Auth.isEngineer()) {
    document.getElementById('createTicketBtn').style.display = 'none';
}

loadTickets();