const form = document.querySelector('#removal-form');
const status = document.querySelector('#removal-status');
const removalEmail = (globalThis.SPARTAN_ATLAS_REMOVAL_EMAIL || '').trim();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.className = 'state';
  status.textContent = '';

  const url = document.querySelector('#remove-url').value.trim();
  const reason = document.querySelector('#remove-reason').value.trim();

  if (!url.toLowerCase().startsWith('spartan://')) {
    status.className = 'state error';
    status.textContent = 'Please enter a spartan:// URL.';
    return;
  }

  if (!removalEmail) {
    status.className = 'state error';
    status.textContent = 'Removal email is not configured.';
    return;
  }

  const subject = `Spartan Atlas index removal: ${url}`;
  const body = [
    `Spartan URL: ${url}`,
    '',
    'Reason:',
    reason || '(not provided)',
    '',
    'I am requesting that this URL be removed from the Spartan Atlas search index.',
  ].join('\n');

  const params = new URLSearchParams({ subject, body });
  location.href = `mailto:${removalEmail}?${params}`;
});
