const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let conversation = [];

function appendMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';

  const loading = document.createElement('div');
  loading.className = 'message bot loading';
  loading.textContent = '🤔 Gemini sedang berpikir...';
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });

    const data = await response.json();
    chatBox.removeChild(loading);

    if (data.result) {
      appendMessage('bot', data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      appendMessage('bot', '⚠️ Maaf, tidak ada respons dari AI.');
    }
  } catch (error) {
    chatBox.removeChild(loading);
    appendMessage('bot', `❌ Error: ${error.message}`);
  }
});