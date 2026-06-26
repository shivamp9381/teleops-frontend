Auth.requireAuth();
renderNavUser();

// Only managers and admins can access this page
if (!Auth.isAdmin()) {
    window.location.href = 'profile.html';
}

let currentTab = 'team';
const isSuperAdmin = Auth.isSuperAdmin();

// ─── Page Setup ──────────────────────────────────────────────────────────────

function initPage() {
    if (isSuperAdmin) {
        // Show super admin tabs
        document.getElementById('tab-all').style.display     = 'inline-flex';
        document.getElementById('tab-managers').style.display = 'inline-flex';
        document.getElementById('tab-inactive').style.display = 'inline-flex';
        document.getElementById('statsBar').style.display     = 'block';
        document.getElementById('pageTitle').textContent      = 'User Management';
        loadUserStats();
    }
}

// ─── Toast Helper ─────────────────────────────────────────────────────────────

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

// ─── Tab Switching ────────────────────────────────────────────────────────────

function switchTab(tab) {
    currentTab = tab;
    const allTabs = ['team', 'engineers', 'all', 'managers', 'inactive'];
    allTabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) {
            el.className = t === tab ? 'btn btn-primary' : 'btn btn-ghost';
        }
    });
    loadUsers();
}

// ─── Load User Stats (Super Admin) ───────────────────────────────────────────

async function loadUserStats() {
    if (!isSuperAdmin) return;
    try {
        const stats = await API.getUserStats();
        document.getElementById('userStatsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Users</div>
                <div class="stat-value color-blue">${stats.totalUsers}</div>
                <div class="stat-sub">${stats.activeUsers} active</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Super Admins</div>
                <div class="stat-value color-red">${stats.totalAdmins}</div>
                <div class="stat-sub">system administrators</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">NOC Managers</div>
                <div class="stat-value color-purple">${stats.totalManagers}</div>
                <div class="stat-sub">team managers</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">NOC Engineers</div>
                <div class="stat-value color-cyan">${stats.totalEngineers}</div>
                <div class="stat-sub">operational engineers</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Read Only</div>
                <div class="stat-value color-amber">${stats.totalReadOnly}</div>
                <div class="stat-sub">view-only users</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Inactive</div>
                <div class="stat-value color-gray">${stats.inactiveUsers}</div>
                <div class="stat-sub">deactivated accounts</div>
            </div>
        `;
    } catch (e) {
        console.error('Failed to load user stats:', e);
    }
}

// ─── Load Users ───────────────────────────────────────────────────────────────

async function loadUsers() {
    document.getElementById('userTable').innerHTML =
        '<tr class="loading-row"><td colspan="6">Loading…</td></tr>';

    const tabTitles = {
        team:      'My Team',
        engineers: 'NOC Engineers',
        all:       'All Users',
        managers:  'NOC Managers',
        inactive:  'Inactive Users'
    };
    document.getElementById('tableTitle').textContent =
        tabTitles[currentTab] || 'Users';

    try {
        let users;

        switch (currentTab) {
            case 'team':
                users = await API.getMyTeam();
                break;
            case 'engineers':
                users = await API.getUsersByRole('NOC_ENGINEER');
                break;
            case 'all':
                users = await API.getAllUsers();
                break;
            case 'managers':
                users = await API.getUsersByRole('NOC_MANAGER');
                break;
            case 'inactive':
                users = (await API.getAllUsers())
                    .filter(u => !u.active);
                break;
            default:
                users = await API.getMyTeam();
        }

        renderTable(users);
    } catch (e) {
        document.getElementById('userTable').innerHTML =
            `<tr class="loading-row"><td colspan="6">Error: ${e.message}</td></tr>`;
    }
}

// ─── Render Table ─────────────────────────────────────────────────────────────

const ROLE_BADGE = {
    SUPER_ADMIN:  'badge-red',
    NOC_MANAGER:  'badge-purple',
    NOC_ENGINEER: 'badge-blue',
    READ_ONLY:    'badge-gray'
};

const ROLE_LABEL = {
    SUPER_ADMIN:  '⚡ Super Admin',
    NOC_MANAGER:  '👔 Manager',
    NOC_ENGINEER: '🔧 Engineer',
    READ_ONLY:    '👁️ Read Only'
};

function renderTable(users) {
    const tb = document.getElementById('userTable');

    if (!users || !users.length) {
        tb.innerHTML = `<tr><td colspan="6">
            <div class="empty-state">
                <div class="icon">👥</div>
                <h3>No users found</h3>
            </div>
        </td></tr>`;
        return;
    }

    tb.innerHTML = users.map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="
                        width:36px;height:36px;border-radius:50%;
                        background:var(--accent);
                        display:flex;align-items:center;justify-content:center;
                        font-size:13px;font-weight:800;color:#fff;
                        flex-shrink:0
                    ">${getInitials(u.name)}</div>
                    <div>
                        <div style="font-weight:600;font-size:14px">${u.name || '—'}</div>
                    </div>
                </div>
            </td>
            <td style="font-size:13px;color:var(--text-muted)">${u.email || '—'}</td>
            <td>
                <span class="badge ${ROLE_BADGE[u.role] || 'badge-gray'}">
                    ${ROLE_LABEL[u.role] || u.role}
                </span>
            </td>
            <td>
                ${u.active
                    ? '<span class="badge badge-green">● Active</span>'
                    : '<span class="badge badge-red">● Inactive</span>'
                }
            </td>
            <td style="font-size:12px;color:var(--text-muted)">
                ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
            </td>
            <td>
                <div class="action-row">
                    <button class="btn btn-ghost btn-sm"
                        onclick="viewProfile('${u.id}')">
                        👤 Profile
                    </button>
                    ${isSuperAdmin && u.role !== 'SUPER_ADMIN' ? `
                    <button class="btn btn-warning btn-sm"
                        onclick="openRoleModal('${u.id}', '${u.name}', '${u.role}')">
                        🔑 Role
                    </button>` : ''}
                    ${isSuperAdmin && u.active && u.role !== 'SUPER_ADMIN' ? `
                    <button class="btn btn-danger btn-sm"
                        onclick="deactivateUser('${u.id}', '${u.name}')">
                        🚫 Deactivate
                    </button>` : ''}
                    ${isSuperAdmin && !u.active ? `
                    <button class="btn btn-success btn-sm"
                        onclick="activateUser('${u.id}', '${u.name}')">
                        ✅ Activate
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ─── View Full Profile Modal ──────────────────────────────────────────────────

async function viewProfile(userId) {
    document.getElementById('profileModalBody').innerHTML =
        '<div style="text-align:center;padding:40px"><span class="spinner" style="color:var(--accent)"></span> Loading…</div>';
    document.getElementById('profileModal').classList.add('open');

    try {
        const p = await API.getUserProfile(userId);
        const initials = getInitials(p.name);

        document.getElementById('profileModalBody').innerHTML = `
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;
                        padding:20px;background:var(--bg-input);border-radius:10px">
                <div style="
                    width:64px;height:64px;border-radius:50%;
                    background:var(--accent);
                    display:flex;align-items:center;justify-content:center;
                    font-size:24px;font-weight:800;color:#fff;
                    flex-shrink:0
                ">${initials}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;margin-bottom:4px">
                        ${p.name || '—'}
                    </div>
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">
                        ${p.email || '—'}
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <span class="badge ${ROLE_BADGE[p.role] || 'badge-gray'}">
                            ${ROLE_LABEL[p.role] || p.role}
                        </span>
                        ${p.active
                            ? '<span class="badge badge-green">● Active</span>'
                            : '<span class="badge badge-red">● Inactive</span>'
                        }
                    </div>
                </div>
            </div>

            <!-- Details Grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
                <div style="background:var(--bg-input);border-radius:8px;padding:14px">
                    <div style="font-size:11px;color:var(--text-muted);
                                text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
                        Member Since
                    </div>
                    <div style="font-weight:600">
                        ${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }) : '—'}
                    </div>
                </div>
                <div style="background:var(--bg-input);border-radius:8px;padding:14px">
                    <div style="font-size:11px;color:var(--text-muted);
                                text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
                        Last Updated
                    </div>
                    <div style="font-weight:600">
                        ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }) : '—'}
                    </div>
                </div>
            </div>

            <!-- Activity Stats -->
            <div style="margin-bottom:8px;font-size:12px;font-weight:700;
                        color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">
                Activity Statistics
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
                <div style="background:var(--bg-input);border-radius:8px;padding:16px;text-align:center">
                    <div style="font-size:28px;font-weight:800;color:var(--red)">
                        ${p.alarmsRaised ?? 0}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                        🔔 Alarms Raised
                    </div>
                </div>
                <div style="background:var(--bg-input);border-radius:8px;padding:16px;text-align:center">
                    <div style="font-size:28px;font-weight:800;color:var(--accent)">
                        ${p.ticketsCreated ?? 0}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                        🎫 Tickets Created
                    </div>
                </div>
                <div style="background:var(--bg-input);border-radius:8px;padding:16px;text-align:center">
                    <div style="font-size:28px;font-weight:800;color:var(--green)">
                        ${p.ticketsResolved ?? 0}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                        ✅ Alarms Resolved
                    </div>
                </div>
                <div style="background:var(--bg-input);border-radius:8px;padding:16px;text-align:center">
                    <div style="font-size:28px;font-weight:800;color:var(--amber)">
                        ${p.ticketsAssigned ?? 0}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                        📌 Open Assigned
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        document.getElementById('profileModalBody').innerHTML =
            `<div class="alert alert-danger">⚠️ ${e.message}</div>`;
    }
}

// ─── Role Change ──────────────────────────────────────────────────────────────

function openRoleModal(userId, userName, currentRole) {
    document.getElementById('roleUserId').value = userId;
    document.getElementById('roleUserName').textContent =
        `Changing role for: ${userName}`;
    document.getElementById('newRole').value = currentRole;
    document.getElementById('roleModal').classList.add('open');
}

async function submitRoleChange() {
    const userId  = document.getElementById('roleUserId').value;
    const newRole = document.getElementById('newRole').value;

    try {
        await API.updateUserRole(userId, { role: newRole });
        toast('Role updated successfully', 'success');
        closeModal('roleModal');
        loadUsers();
        if (isSuperAdmin) loadUserStats();
    } catch (e) {
        toast(e.message, 'error');
    }
}

// ─── Activate / Deactivate ────────────────────────────────────────────────────

async function activateUser(userId, userName) {
    if (!confirm(`Activate account for "${userName}"?`)) return;
    try {
        await API.activateUser(userId);
        toast(`${userName}'s account has been activated`, 'success');
        loadUsers();
        loadUserStats();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deactivateUser(userId, userName) {
    if (!confirm(
        `Deactivate account for "${userName}"?\n\n` +
        `They will not be able to log in. Their data is preserved.`
    )) return;
    try {
        await API.deactivateUser(userId);
        toast(`${userName}'s account has been deactivated`, 'success');
        loadUsers();
        loadUserStats();
    } catch (e) {
        toast(e.message, 'error');
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

initPage();
loadUsers();