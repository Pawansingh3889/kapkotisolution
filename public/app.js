const API = 'https://kapkoti-solution.pawankapkoti3889.workers.dev/api';
const $ = (id) => document.getElementById(id);
const messages = [];
let busy = false;
let submitted = false;
let submission = null;
let savedBrief = '';
$('year').textContent = new Date().getFullYear();

function setBusy(value, status = '') {
  busy = value;
  $('chat-status').textContent = status;
  document.querySelectorAll('.chat-card button').forEach((button) => { button.disabled = value; });
  $('message').disabled = value;
  $('chat-card')?.setAttribute('aria-busy', String(value));
}

async function request(action, body) {
  const response = await fetch(`${API}/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The assistant could not connect. Please try again, or email pawan@kapkotisolution.com.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Your brief has not been confirmed as saved. Please try again.');
  return result;
}

function addMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = role === 'user' ? 'YOU' : 'KAPKOTI ASSISTANT';
  const text = document.createElement('p');
  text.textContent = content;
  bubble.append(author, text);
  $('messages').append(bubble);
  $('messages').scrollTop = $('messages').scrollHeight;
  return bubble;
}

function showBrief() {
  $('chat-panel').hidden = true;
  $('brief-form').hidden = false;
  $('chat-status').textContent = '';
  $('brief').focus();
}

document.querySelectorAll('[data-starter]').forEach((button) => {
  button.addEventListener('click', () => {
    if (busy || submitted) return;
    $('brief-form').hidden = true;
    $('chat-panel').hidden = false;
    $('message').value = button.dataset.starter;
    $('message').focus({ preventScroll: true });
    $('conversation').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});

$('chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = $('message').value.trim();
  if (busy || submitted || !content) return;
  if (messages.length >= 20) {
    $('chat-status').textContent = 'We have a good starting conversation. Choose “Help me frame my problem” to make your brief.';
    return;
  }
  const pending = [...messages, { role: 'user', content }];
  const bubble = addMessage('user', content);
  setBusy(true, 'Taking a moment to understand…');
  try {
    const data = await request('chat', { messages: pending });
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The assistant did not return a reply. Please try again.');
    messages.push({ role: 'user', content }, { role: 'assistant', content: data.reply });
    addMessage('assistant', data.reply);
    $('message').value = '';
    $('starters').hidden = true;
    setBusy(false);
  } catch (error) {
    bubble.remove();
    setBusy(false, error.name === 'TimeoutError' ? 'The assistant took too long. Your message is still here. Please try again, or write your brief directly.' : error.message);
  }
  $('message').focus({ preventScroll: true });
});

$('make-brief').addEventListener('click', async () => {
  if (busy || submitted) return;
  if (!messages.length) {
    $('brief').value ||= $('message').value.trim();
    showBrief();
    return;
  }
  setBusy(true, 'Putting your thoughts into a short brief…');
  try {
    const data = await request('brief', { messages });
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No brief came back. You can try again or write it yourself.');
    $('brief').value = data.reply;
    setBusy(false);
    showBrief();
  } catch (error) {
    setBusy(false, error.name === 'TimeoutError' ? 'That took too long. Please try again or choose “I’ll write it myself”.' : error.message);
  }
});
$('write-brief').addEventListener('click', () => {
  if (!$('brief').value) $('brief').value = [...messages.filter((message) => message.role === 'user').map((message) => message.content), $('message').value.trim()].filter(Boolean).join('\n\n');
  showBrief();
});
$('back-chat').addEventListener('click', () => {
  $('brief-form').hidden = true;
  $('chat-panel').hidden = false;
  $('chat-status').textContent = '';
  $('message').focus();
});
$('contact-method').addEventListener('change', () => {
  const phone = $('contact-method').value === 'phone';
  $('contact').type = phone ? 'tel' : 'email';
  $('contact').autocomplete = phone ? 'tel' : 'email';
  $('contact').value = '';
  $('contact-label').textContent = phone ? 'Phone number, including country code' : 'Email address';
  $('contact').placeholder = phone ? '+91… or +44…' : 'you@example.com';
});
$('brief-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || submitted) return;
  const payload = {
    name: $('name').value.trim(), contactMethod: $('contact-method').value,
    contact: $('contact').value.trim(), brief: $('brief').value.trim(),
    consent: $('consent').checked, messages,
  };
  const fingerprint = JSON.stringify(payload);
  if (!submission || submission.fingerprint !== fingerprint) submission = { id: crypto.randomUUID(), fingerprint };
  setBusy(true, 'Saving your brief for Pawan…');
  try {
    const data = await request('submit', { ...payload, id: submission.id });
    if (data.id !== submission.id) throw new Error('We could not confirm your submission. Please retry without changing the form.');
    savedBrief = `Kapkoti Solution\nReference: ${data.id}\n\n${payload.brief}\n\nConversation\n${messages.map((message) => `${message.role}: ${message.content}`).join('\n\n')}`;
    submitted = true;
    $('brief-form').hidden = true;
    $('success').hidden = false;
    $('reference').textContent = `Your reference: ${data.id}`;
    setBusy(false);
    $('success').focus({ preventScroll: true });
  } catch (error) {
    setBusy(false, error.name === 'TimeoutError' ? 'Confirmation took too long. Please retry: the same brief will not be saved twice.' : error.message);
  }
});
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([savedBrief], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'my-kapkoti-problem-brief.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('beforeunload', (event) => {
  if (!submitted && (messages.length || $('message').value.trim() || $('brief').value.trim())) event.preventDefault();
});
