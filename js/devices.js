Auth.requireAuth();
renderNavUser();

let allDevices = [];

const TYPE_ICON = {
    TOWER_4G: '📡', TOWER_5G: '📡', ROUTER: '🔀',
    FIREWALL: '🛡️', SWITCH: '🔌', BASE_STATION: '📻'
};

const STATUS_CLASS = {
    ONLINE: 'badge-green', OFFLINE: 'badge-red',
    DEGRADED: 'badge-amber', MAINTENANCE: 'badge-cyan'
};

function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const id = 'toast-' + Date.now();
    c.insertAdjacentHTML('beforeend', `
        <div class="toast ${type}" id="${id}">
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-body">
                <div class="toast-msg">${msg}</div>
            </div>
        </div>
    `);
    setTimeout(() => document.getElementById(id)?.remove(), 3500);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Device';
    document.getElementById('editId').value = '';
    ['dName','dIp','dLocation','dVendor','dModel','dDesc'].forEach(id =>
        document.getElementById(id).value = '');
    document.getElementById('dType').value = '';
    document.getElementById('dStatus').value = 'ONLINE';
    document.getElementById('deviceModal').classList.add('open');
}

function openEditModal(dev) {
    document.getElementById('modalTitle').textContent = 'Edit Device';
    document.getElementById('editId').value = dev.id;
    document.getElementById('dName').value = dev.name;
    document.getElementById('dType').value = dev.type;
    document.getElementById('dIp').value = dev.ipAddress;
    document.getElementById('dStatus').value = dev.status;
    document.getElementById('dLocation').value = dev.location;
    document.getElementById('dVendor').value = dev.vendor || '';
    document.getElementById('dModel').value = dev.model || '';
    document.getElementById('dDesc').value = dev.description || '';
    document.getElementById('deviceModal').classList.add('open');
}

function openStatusModal(id, currentStatus) {
    document.getElementById('statusDeviceId').value = id;
    document.getElementById('newStatus').value = currentStatus;
    document.getElementById('statusModal').classList.add('open');
}

async function saveDevice() {
    const btn = document.getElementById('saveDeviceBtn');
    const id = document.getElementById('editId').value;
    const payload = {
        name:        document.getElementById('dName').value.trim(),
        type:        document.getElementById('dType').value,
        status:      document.getElementById('dStatus').value,
        ipAddress:   document.getElementById('dIp').value.trim(),
        location:    document.getElementById('dLocation').value.trim(),
        vendor:      document.getElementById('dVendor').value.trim(),
        model:       document.getElementById('dModel').value.trim(),
        description: document.getElementById('dDesc').value.trim()
    };
    if (!payload.name || !payload.type || !payload.ipAddress || !payload.location) {
        toast('Please fill all required fields', 'error');
        return;
    }
    btn.disabled = true;
    try {
        if (id) {
            await API.updateDevice(id, payload);
            toast('Device updated successfully', 'success');
        } else {
            await API.createDevice(payload);
            toast('Device added successfully', 'success');
        }
        closeModal('deviceModal');
        loadDevices();
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function saveStatus() {
    const id = document.getElementById('statusDeviceId').value;
    const status = document.getElementById('newStatus').value;
    try {
        await API.updateDeviceStatus(id, status);
        toast('Status updated', 'success');
        closeModal('statusModal');
        loadDevices();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteDevice(id, name) {
    if (!confirm(`Delete device "${name}"? This cannot be undone.`)) return;
    try {
        await API.deleteDevice(id);
        toast('Device deleted', 'success');
        loadDevices();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function applyFilter() {
    const type   = document.getElementById('filterType').value;
    const status = document.getElementById('filterStatus').value;
    const filtered = allDevices.filter(d =>
        (!type   || d.type   === type) &&
        (!status || d.status === status)
    );
    renderTable(filtered);
}

function renderTable(devices) {
    const tb = document.getElementById('deviceTable');
    const isAdmin = Auth.isAdmin();
    const isSuperAdmin = Auth.isSuperAdmin();

    if (!devices.length) {
        tb.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <div class="icon">🖥️</div>
                <h3>No devices found</h3>
            </div>
        </td></tr>`;
        return;
    }

    tb.innerHTML = devices.map(d => `
        <tr>
            <td>
                <strong>${TYPE_ICON[d.type] || '📦'} ${d.name}</strong>
                ${d.model ? `<div style="font-size:11px;color:var(--text-muted)">${d.model}</div>` : ''}
            </td>
            <td>${d.type.replace('_', ' ')}</td>
            <td><span class="badge ${STATUS_CLASS[d.status] || 'badge-gray'}">${d.status}</span></td>
            <td><code style="font-size:12px;color:var(--cyan)">${d.ipAddress}</code></td>
            <td>${d.location}</td>
            <td>${d.vendor || '—'}</td>
            <td>
                <div class="action-row">
                    ${Auth.isEngineer() ? `
                    <button class="btn btn-warning btn-sm"
                        onclick="openStatusModal('${d.id}','${d.status}')">
                        ⚡ Status
                    </button>` : ''}
                    ${isAdmin ? `
                    <button class="btn btn-ghost btn-sm"
                        onclick='openEditModal(${JSON.stringify(d)})'>
                        ✏️ Edit
                    </button>` : ''}
                    ${isSuperAdmin ? `
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteDevice('${d.id}','${d.name}')">
                        🗑️
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadDevices() {
    document.getElementById('deviceTable').innerHTML =
        '<tr class="loading-row"><td colspan="7">Loading…</td></tr>';
    try {
        allDevices = await API.getDevices();
        applyFilter();
    } catch (e) {
        document.getElementById('deviceTable').innerHTML =
            `<tr class="loading-row"><td colspan="7">Error: ${e.message}</td></tr>`;
    }
}

// Show add button only for admins
if (!Auth.isAdmin()) {
    document.getElementById('addDeviceBtn').style.display = 'none';
}

loadDevices();