Auth.requireAuth();
renderNavUser();

let currentUser = null;

// ─── Toast Helper ───────────────────────────────────────────────────────────

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

// ─── Role Badge Helper ───────────────────────────────────────────────────────

function roleBadge(role) {
    const map = {
        SUPER_ADMIN:  { cls: 'badge-red',    label: '⚡ Super Admin' },
        NOC_MANAGER:  { cls: 'badge-purple', label: '👔 Manager' },
        NOC_ENGINEER: { cls: 'badge-blue',   label: '🔧 Engineer' },
        READ_ONLY:    { cls: 'badge-gray',   label: '👁️ Read Only' }
    };
    const m = map[role] || { cls: 'badge-gray', label: role };
    return `<span class="badge ${m.cls}">${m.label}</span>`;
}

// ─── Load Profile ────────────────────────────────────────────────────────────

async function loadProfile() {
    try {
        const profile = await API.getMyProfile();
        currentUser = profile;
        renderProfile(profile);
    } catch (e) {
        toast('Failed to load profile: ' + e.message, 'error');
    }
}

function renderProfile(p) {
    // Avatar initials
    const initials = (p.name || '?')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;

    // Core info
    document.getElementById('profileName').textContent = p.name || '—';
    document.getElementById('profileEmail').textContent = p.email || '—';
    document.getElementById('profileRoleBadge').innerHTML = roleBadge(p.role);
    document.getElementById('profileStatus').innerHTML = p.active
        ? '<span class="badge badge-green">● Active</span>'
        : '<span class="badge badge-red">● Inactive</span>';

    // Dates
    document.getElementById('profileSince').textContent = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : '—';
    document.getElementById('profileUpdated').textContent = p.updatedAt
        ? new Date(p.updatedAt).toLocaleDateString()
        : '—';

    // Activity stats
    document.getElementById('alarmsRaisedStat').innerHTML = `
        <div class="stat-row-label">🔔 Alarms Raised</div>
        <div class="stat-row-value color-red">${p.alarmsRaised ?? 0}</div>
    `;
    document.getElementById('ticketsCreatedStat').innerHTML = `
        <div class="stat-row-label">🎫 Tickets Created</div>
        <div class="stat-row-value color-blue">${p.ticketsCreated ?? 0}</div>
    `;
    document.getElementById('ticketsResolvedStat').innerHTML = `
        <div class="stat-row-label">✅ Alarms Resolved</div>
        <div class="stat-row-value color-green">${p.ticketsResolved ?? 0}</div>
    `;
    document.getElementById('ticketsAssignedStat').innerHTML = `
        <div class="stat-row-label">📌 Open Assigned Tickets</div>
        <div class="stat-row-value color-amber">${p.ticketsAssigned ?? 0}</div>
    `;

    // Pre-fill edit form
    document.getElementById('editName').value  = p.name  || '';
    document.getElementById('editEmail').value = p.email || '';
}

// ─── Update Profile ──────────────────────────────────────────────────────────

async function updateProfile() {
    const name = document.getElementById('editName').value.trim();
    if (!name || name.length < 2) {
        toast('Name must be at least 2 characters', 'error');
        return;
    }

    try {
        const updated = await API.updateMyProfile({ name });
        toast('Profile updated successfully', 'success');

        // Update nav display
        const user = Auth.getUser();
        if (user) {
            user.name = updated.name;
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
            renderNavUser();
        }

        // Reload full profile
        loadProfile();
    } catch (e) {
        toast(e.message, 'error');
    }
}

// ─── Change Password ─────────────────────────────────────────────────────────

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword     = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) {
        toast('Current password is required', 'error');
        return;
    }
    if (newPassword.length < 8) {
        toast('New password must be at least 8 characters', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        toast('New passwords do not match', 'error');
        return;
    }
    if (currentPassword === newPassword) {
        toast('New password must be different from current password', 'error');
        return;
    }

    try {
        await API.changeMyPassword({ currentPassword, newPassword });
        toast('Password changed successfully. Please log in again.', 'success');

        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value     = '';
        document.getElementById('confirmPassword').value = '';

        // Log out after password change (security best practice)
        setTimeout(() => {
            Auth.logout();
        }, 2000);
    } catch (e) {
        toast(e.message, 'error');
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

loadProfile();