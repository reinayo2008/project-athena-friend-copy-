const apiBase = window.ATHENA_API_BASE_URL ?? '';
const loginTab = document.getElementById('loginTab');
const setupTab = document.getElementById('setupTab');
const loginForm = document.getElementById('studentLoginForm');
const setupForm = document.getElementById('studentSetupForm');
const statusMessage = document.getElementById('studentAccessStatus');
const googleSignInButton = document.getElementById('googleSignInButton');
const continueButton = document.getElementById('continueWithExistingAccount');
let isStudentAuthenticated = false;

function selectStudentPanel(panel) {
  const showLogin = panel === 'login';
  loginForm.hidden = !showLogin;
  setupForm.hidden = showLogin;
  loginTab.setAttribute('aria-selected', String(showLogin));
  setupTab.setAttribute('aria-selected', String(!showLogin));
  statusMessage.textContent = '';
}

loginTab.addEventListener('click', () => selectStudentPanel('login'));
setupTab.addEventListener('click', () => selectStudentPanel('setup'));

async function sendAuthRequest(path, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || 'Sign-in request failed.');
  return result;
}

async function enterChat() {
  localStorage.setItem('athenaAccountMode', 'login');
  window.location.replace('page2.html');
}

async function handleGoogleCredential(googleResponse) {
  statusMessage.textContent = 'Verifying Google account...';
  try {
    const path = isStudentAuthenticated ? '/students/google/link' : '/students/google/login';
    await sendAuthRequest(path, { credential: googleResponse.credential });
    isStudentAuthenticated = true;
    await enterChat();
  } catch (error) {
    statusMessage.textContent = error.message;
  }
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
      callback: handleGoogleCredential
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
    if (response.ok) {
      isStudentAuthenticated = true;
      continueButton.hidden = false;
      statusMessage.textContent = 'You are signed in. Link Google to use it for future sign-ins.';
    }
    return undefined;
  })
  .catch(() => {});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  statusMessage.textContent = 'Signing in...';
  try {
    await sendAuthRequest('/students/login', {
      name: document.getElementById('loginName').value.trim(),
      password: document.getElementById('loginPassword').value
    });
    isStudentAuthenticated = true;
    continueButton.hidden = false;
    statusMessage.textContent = 'Account verified. Link Google now to use it for future sign-ins.';
  } catch (error) {
    statusMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('newPassword').value;
  if (password !== document.getElementById('confirmPassword').value) {
    statusMessage.textContent = 'The passwords do not match.';
    return;
  }

  const submitButton = setupForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  statusMessage.textContent = 'Setting up account...';
  try {
    await sendAuthRequest('/students/setup', {
      name: document.getElementById('setupName').value.trim(),
      setup_code: document.getElementById('setupCode').value.trim(),
      password
    });
    isStudentAuthenticated = true;
    continueButton.hidden = false;
    statusMessage.textContent = 'Account created. Link Google now to use it for future sign-ins.';
  } catch (error) {
    statusMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

continueButton.addEventListener('click', enterChat);