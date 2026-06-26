// ============================================================
// Authentication Helpers
// ============================================================

const Auth = {
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    getUser() {
        const u = localStorage.getItem(CONFIG.USER_KEY);
        return u ? JSON.parse(u) : null;
    },

    setSession(data) {
        localStorage.setItem(CONFIG.TOKEN_KEY, data.accessToken);
        localStorage.setItem(CONFIG.REFRESH_KEY, data.refreshToken);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({
            id:    data.userId,
            name:  data.name,
            email: data.email,
            role:  data.role
        }));
    },

    clearSession() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.REFRESH_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    requireAuth() {
        if (!this.getToken()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    logout() {
        this.clearSession();
        window.location.href = 'index.html';
    },

    isAdmin() {
        const user = this.getUser();
        return user && (
            user.role === 'SUPER_ADMIN' ||
            user.role === 'NOC_MANAGER'
        );
    },

    isSuperAdmin() {
        const user = this.getUser();
        return user && user.role === 'SUPER_ADMIN';
    },

    isEngineer() {
        const user = this.getUser();
        return user && (
            user.role === 'SUPER_ADMIN' ||
            user.role === 'NOC_MANAGER' ||
            user.role === 'NOC_ENGINEER'
        );
    }
};

// Inject user info into nav bar if element exists
function renderNavUser() {
    const el = document.getElementById('nav-user');
    if (el) {
        const user = Auth.getUser();
        if (user) {
            el.textContent = `${user.name} (${user.role})`;
        }
    }
}

// Helper used across pages
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}