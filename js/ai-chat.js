Auth.requireAuth();
renderNavUser();

function addMessage(text, role) {
    const box = document.getElementById('chatBox');
    const isUser = role === 'user';
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `
        ${isUser ? '' : '<div class="chat-avatar">🤖</div>'}
        <div class="chat-bubble">${escapeHtml(text)}</div>
        ${isUser ? '<div class="chat-avatar" style="background:var(--accent-glow)">👤</div>' : ''}
    `;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const btn   = document.getElementById('sendBtn');
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    input.value = '';
    btn.disabled = true;
    input.disabled = true;

    // Thinking indicator
    const box = document.getElementById('chatBox');
    const thinking = document.createElement('div');
    thinking.id = 'thinking';
    thinking.className = 'chat-msg ai';
    thinking.innerHTML = `
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble" style="color:var(--text-muted)">
            <span class="spinner" style="color:var(--accent)"></span> Thinking…
        </div>
    `;
    box.appendChild(thinking);
    box.scrollTop = box.scrollHeight;

    try {
        const result = await API.aiChat(question);
        document.getElementById('thinking')?.remove();
        addMessage(result.answer || 'No response received.', 'ai');
    } catch (e) {
        document.getElementById('thinking')?.remove();
        addMessage(`⚠️ Error: ${e.message}`, 'ai');
    } finally {
        btn.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

function quickAsk(q) {
    document.getElementById('chatInput').value = q;
    sendMessage();
}