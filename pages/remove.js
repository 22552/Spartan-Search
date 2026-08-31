const form = document.querySelector('#removal-form');
const status = document.querySelector('#removal-status');
const apiBase = (globalThis.SPARTAN_ATLAS_API_BASE || '').replace(/\/$/, '');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.className = 'state';
  status.textContent = 'Submitting…';

  const url = document.querySelector('#remove-url').value.trim();
  const reason = document.querySelector('#remove-reason').value.trim();
  const contact = document.querySelector('#remove-contact').value.trim();
  const website = document.querySelector('#remove-website').value.trim();

  if (!url.toLowerCase().startsWith('spartan://')) {
    status.className = 'state error';
    status.textContent = 'Please enter a spartan:// URL.';
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/removal-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, reason, contact, website }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Request failed.');

    form.reset();
    status.className = 'state success';
    status.textContent = `Request received. ID: ${data.id}`;
  } catch (error) {
    status.className = 'state error';
    status.textContent = error.message || 'Request failed.';
  }
});
