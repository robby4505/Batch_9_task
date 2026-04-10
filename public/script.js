const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let conversation = [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userMessage = input.value.trim();
  if (!userMessage) return;
  
  // Tampilkan pesan user
  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';
  
  // Tampilkan loading
  const loadingMsg = appendMessage('bot', '🤔 Sedang mencari informasi...');
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });
    
    const data = await response.json();
    
    // Hapus loading
    loadingMsg.remove();
    
    if (data.result) {
      appendMessage('bot', data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      appendMessage('bot', '⚠️ Maaf, terjadi kesalahan.');
    }
    
  } catch (error) {
    loadingMsg.remove();
    appendMessage('bot', `❌ Error: ${error.message}`);
  }
  
  // Auto scroll ke bawah
  chatBox.scrollTop = chatBox.scrollHeight;
});

function appendMessage(role, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return messageDiv;
}