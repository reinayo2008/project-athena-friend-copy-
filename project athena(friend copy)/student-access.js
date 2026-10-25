const apiBase = window.ATHENA_API_BASE_URL ?? '';
const statusMessage = document.getElementById('studentAccessStatus');
const googleSignInButton = document.getElementById('googleSignInButton');

async function signInWithGoogle(googleResponse) {
  statusMessage.textContent = 'Verifying Google account...';
  const response = await fetch(`${apiBase}/students/google/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: googleResponse.credential })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || 'Google sign-in failed.');
  window.location.replace('page2.html');
}

async function initializeGoogleSignIn() {
  if (!window.google?.accounts?.id) {
    statusMessage.textContent = 'Google sign-in could not be loaded.';
    return;
  }
  try {
    const response = await fetch(`${apiBase}/students/google/config`);
    const config = await response.json();
    if (!response.ok || !config.client_id) {
      throw new Error('Google sign-in is not configured yet.');
    }
    window.google.accounts.id.initialize({
      client_id: config.client_id,
      callback: async (googleResponse) => {
        try {
          await signInWithGoogle(googleResponse);
        } catch (error) {
          statusMessage.textContent = error.message;
        }
      }
    });
    window.google.accounts.id.renderButton(googleSignInButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 280
    });
  } catch (error) {
    statusMessage.textContent = error.message;
  }
}

window.initializeGoogleSignIn = initializeGoogleSignIn;

fetch(`${apiBase}/students/session`, { credentials: 'include' })
  .then((response) => {
    if (response.ok) window.location.replace('page2.html');
  })
  .catch(() => {});
