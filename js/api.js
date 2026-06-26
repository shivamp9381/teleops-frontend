// ============================================================
// API Helper — All backend calls go through here
// ============================================================

const API = {

    async request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, opts);
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(json.message || `HTTP ${res.status}`);
        }
        return json.data !== undefined ? json.data : json;
    },

    // ── AUTH ────────────────────────────────────────────────────────────────
    login: (email, password) =>
        API.request('POST', '/auth/login', { email, password }),

    register: (payload) =>
        API.request('POST', '/auth/register', payload),

    me: () => API.request('GET', '/auth/me'),

    // ── DASHBOARD ───────────────────────────────────────────────────────────
    dashboardStats: () => API.request('GET', '/dashboard/stats'),

    // ── DEVICES ─────────────────────────────────────────────────────────────
    getDevices: () => API.request('GET', '/devices'),
    getDevice: (id) => API.request('GET', `/devices/${id}`),
    createDevice: (d) => API.request('POST', '/devices', d),
    updateDevice: (id, d) => API.request('PUT', `/devices/${id}`, d),
    deleteDevice: (id) => API.request('DELETE', `/devices/${id}`),
    updateDeviceStatus: (id, status) =>
        API.request('PATCH', `/devices/${id}/status`, { status }),

    // ── ALARMS ──────────────────────────────────────────────────────────────
    getAlarms: () => API.request('GET', '/alarms'),
    getActiveAlarms: () => API.request('GET', '/alarms/active'),
    getAlarm: (id) => API.request('GET', `/alarms/${id}`),
    raiseAlarm: (a) => API.request('POST', '/alarms', a),
    acknowledgeAlarm: (id) =>
        API.request('PATCH', `/alarms/${id}/acknowledge`),
    resolveAlarm: (id, note) =>
        API.request('PATCH', `/alarms/${id}/resolve`,
            { resolutionNote: note }),

    // ── TICKETS ─────────────────────────────────────────────────────────────
    getTickets: () => API.request('GET', '/tickets'),
    getActiveTickets: () => API.request('GET', '/tickets/active'),
    getTicket: (id) => API.request('GET', `/tickets/${id}`),
    createTicket: (t) => API.request('POST', '/tickets', t),
    assignTicket: (id, userId) =>
        API.request('PATCH', `/tickets/${id}/assign`,
            { assignedToUserId: userId }),
    resolveTicket: (id, resolution) =>
        API.request('PATCH', `/tickets/${id}/resolve`, { resolution }),
    closeTicket: (id) => API.request('PATCH', `/tickets/${id}/close`),

    // ── AI ───────────────────────────────────────────────────────────────────
    performRca: (alarmId) =>
        API.request('POST', '/ai/rca', { alarmId }),
    summarizeLogs: (logContent, context) =>
        API.request('POST', '/ai/log-summary', { logContent, context }),
    generateReport: (ticketId) =>
        API.request('POST', '/ai/incident-report', { ticketId }),
    aiChat: (question) =>
        API.request('POST', '/ai/chat', { question }),

    // ── USER MANAGEMENT ──────────────────────────────────────────────────────

    // Own profile (all authenticated users)
    getMyProfile: () =>
        API.request('GET', '/users/me/profile'),

    updateMyProfile: (payload) =>
        API.request('PATCH', '/users/me/profile', payload),

    changeMyPassword: (payload) =>
        API.request('PATCH', '/users/me/password', payload),

    // Team (manager + admin)
    getMyTeam: () =>
        API.request('GET', '/users/team'),

    getActiveEngineers: () =>
        API.request('GET', '/users/engineers/active'),

    // User lookup
    getAllUsers: () =>
        API.request('GET', '/users'),

    getUserStats: () =>
        API.request('GET', '/users/stats'),

    getUsersByRole: (role) =>
        API.request('GET', `/users/role/${role}`),

    getUserProfile: (id) =>
        API.request('GET', `/users/${id}/profile`),

    // Admin actions (Super Admin only)
    activateUser: (id) =>
        API.request('PATCH', `/users/${id}/activate`),

    deactivateUser: (id) =>
        API.request('PATCH', `/users/${id}/deactivate`),

    updateUserRole: (id, payload) =>
        API.request('PATCH', `/users/${id}/role`, payload)
};