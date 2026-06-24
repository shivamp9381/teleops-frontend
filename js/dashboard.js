Auth.requireAuth();
renderNavUser();

const SEV_BADGE = {
    CRITICAL: 'badge-red',
    HIGH:     'badge-orange',
    MEDIUM:   'badge-amber',
    LOW:      'badge-cyan'
};

const STATUS_BADGE = {
    ACTIVE:       'badge-red',
    ACKNOWLEDGED: 'badge-amber',
    RESOLVED:     'badge-green',
    OPEN:         'badge-blue',
    IN_PROGRESS:  'badge-amber',
    CLOSED:       'badge-gray'
};

async function loadDashboard() {
    try {
        const s = await API.dashboardStats();
        renderStats(s);
    } catch (e) {
        console.error(e);
    }

    try {
        const alarms = await API.getActiveAlarms();
        renderAlarms(alarms.slice(0, 8));
    } catch (e) {
        document.getElementById('recentAlarms').innerHTML =
            '<tr class="loading-row"><td colspan="4">Could not load alarms</td></tr>';
    }

    try {
        const tickets = await API.getActiveTickets();
        renderTickets(tickets.slice(0, 8));
    } catch (e) {
        document.getElementById('recentTickets').innerHTML =
            '<tr class="loading-row"><td colspan="4">Could not load tickets</td></tr>';
    }
}

function renderStats(s) {
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Devices</div>
            <div class="stat-value color-blue">${s.totalDevices}</div>
            <div class="stat-sub">
                <span class="color-green">${s.onlineDevices} online</span> ·
                <span class="color-red">${s.offlineDevices} offline</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Active Alarms</div>
            <div class="stat-value color-red">${s.totalActiveAlarms}</div>
            <div class="stat-sub">
                <span class="color-red">${s.criticalAlarms} critical</span> ·
                <span class="color-amber">${s.highAlarms} high</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Open Tickets</div>
            <div class="stat-value color-amber">${s.openTickets}</div>
            <div class="stat-sub">${s.inProgressTickets} in progress</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Resolved Today</div>
            <div class="stat-value color-green">${s.resolvedTickets}</div>
            <div class="stat-sub">${s.closedTickets} closed total</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Degraded</div>
            <div class="stat-value color-orange">${s.degradedDevices}</div>
            <div class="stat-sub">devices degraded</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Maintenance</div>
            <div class="stat-value color-cyan">${s.maintenanceDevices}</div>
            <div class="stat-sub">in maintenance window</div>
        </div>
    `;
}

function renderAlarms(alarms) {
    const tb = document.getElementById('recentAlarms');
    if (!alarms.length) {
        tb.innerHTML = '<tr class="loading-row"><td colspan="4">✅ No active alarms</td></tr>';
        return;
    }
    tb.innerHTML = alarms.map(a => `
        <tr>
            <td>${a.deviceName || '—'}</td>
            <td><span class="badge ${SEV_BADGE[a.severity] || 'badge-gray'}">${a.severity}</span></td>
            <td>${a.title}</td>
            <td><span class="badge ${STATUS_BADGE[a.status] || 'badge-gray'}">${a.status}</span></td>
        </tr>
    `).join('');
}

function renderTickets(tickets) {
    const tb = document.getElementById('recentTickets');
    if (!tickets.length) {
        tb.innerHTML = '<tr class="loading-row"><td colspan="4">✅ No active tickets</td></tr>';
        return;
    }
    tb.innerHTML = tickets.map(t => `
        <tr>
            <td><code style="color:var(--accent)">${t.ticketNumber}</code></td>
            <td><span class="badge ${SEV_BADGE[t.priority] || 'badge-gray'}">${t.priority}</span></td>
            <td>${t.title}</td>
            <td><span class="badge ${STATUS_BADGE[t.status] || 'badge-gray'}">${t.status}</span></td>
        </tr>
    `).join('');
}

loadDashboard();