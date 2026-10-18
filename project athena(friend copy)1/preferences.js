const preferenceKeys = {
  displayMode: 'athenaDisplayMode',
  font: 'athenaFont',
  music: 'athenaMusicEnabled',
  profile: 'athenaProfile'
};

const displayModeInputs = document.querySelectorAll('input[name="displayMode"]');
const appFontSelect = document.getElementById('appFont');
const musicToggle = document.getElementById('musicEnabled');
const profileForm = document.getElementById('profileForm');
const profileColorInput = document.getElementById('profileColor');
const profileNameColorInput = document.getElementById('profileNameColor');
const profilePreviewName = document.getElementById('profilePreviewName');
const profileAvatar = document.getElementById('profileAvatar');
const appOptionsStatus = document.getElementById('appOptionsStatus');
const profileStatus = document.getElementById('profileStatus');

const root = document.documentElement;
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let audioContext = null;
let ambientVoices = [];

function setDisplayMode(mode) {
  const selectedMode = ['light', 'dark', 'sync'].includes(mode) ? mode : 'sync';
  const isDark = selectedMode === 'dark' || (selectedMode === 'sync' && colorScheme.matches);
  root.dataset.displayMode = isDark ? 'dark' : 'light';
  displayModeInputs.forEach((input) => {
    input.checked = input.value === selectedMode;
  });
}

const savedDisplayMode = localStorage.getItem(preferenceKeys.displayMode) || 'sync';
setDisplayMode(savedDisplayMode);

colorScheme.addEventListener('change', () => {
  if ((localStorage.getItem(preferenceKeys.displayMode) || 'sync') === 'sync') {
    setDisplayMode('sync');
  }
});

displayModeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    localStorage.setItem(preferenceKeys.displayMode, input.value);
    setDisplayMode(input.value);
    if (appOptionsStatus) appOptionsStatus.textContent = 'Appearance saved.';
  });
});

const savedFont = localStorage.getItem(preferenceKeys.font) || 'soft';
root.dataset.font = ['soft', 'serif', 'clear'].includes(savedFont) ? savedFont : 'soft';
if (appFontSelect) {
  appFontSelect.value = root.dataset.font;
  appFontSelect.addEventListener('change', () => {
    root.dataset.font = appFontSelect.value;
    localStorage.setItem(preferenceKeys.font, appFontSelect.value);
    if (appOptionsStatus) appOptionsStatus.textContent = 'Font saved.';
  });
}

function stopAmbientMusic() {
  if (!audioContext) return;
  const context = audioContext;
  ambientVoices.forEach(({ oscillator, gain }) => {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(0, context.currentTime, 0.15);
    oscillator.stop(context.currentTime + 0.6);
  });
  ambientVoices = [];
  audioContext = null;
  window.setTimeout(() => context.close().catch(() => {}), 700);
}

async function startAmbientMusic() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    if (appOptionsStatus) appOptionsStatus.textContent = 'Ambient audio is unavailable in this browser.';
    return;
  }

  if (!audioContext) audioContext = new AudioContextConstructor();
  if (audioContext.state === 'suspended') await audioContext.resume();

  const master = audioContext.createGain();
  const lowPass = audioContext.createBiquadFilter();
  master.gain.value = 0.12;
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 700;
  master.connect(lowPass);
  lowPass.connect(audioContext.destination);

  [130.81, 164.81, 196, 261.63].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const voiceGain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    voiceGain.gain.value = index === 3 ? 0.1 : 0.16;
    oscillator.connect(voiceGain);
    voiceGain.connect(master);
    oscillator.start();
    ambientVoices.push({ oscillator, gain: voiceGain });
  });
}

if (musicToggle) {
  musicToggle.checked = localStorage.getItem(preferenceKeys.music) === 'true';
  musicToggle.addEventListener('change', async () => {
    localStorage.setItem(preferenceKeys.music, String(musicToggle.checked));
    if (musicToggle.checked) {
      await startAmbientMusic();
      if (appOptionsStatus) appOptionsStatus.textContent = 'Ambient music is on.';
    } else {
      stopAmbientMusic();
      if (appOptionsStatus) appOptionsStatus.textContent = 'Ambient music is off.';
    }
  });
}

if (localStorage.getItem(preferenceKeys.music) === 'true') {
  startAmbientMusic().catch(() => {
    const resumeSavedMusic = () => startAmbientMusic().catch(() => {});
    document.addEventListener('pointerdown', resumeSavedMusic, { once: true });
    document.addEventListener('keydown', resumeSavedMusic, { once: true });
  });
}

let savedProfile = {};
try {
  const storedProfile = JSON.parse(localStorage.getItem(preferenceKeys.profile) || '{}');
  if (storedProfile && typeof storedProfile === 'object' && !Array.isArray(storedProfile)) {
    savedProfile = storedProfile;
  }
} catch {
  savedProfile = {};
}

const profileFullNameInput = document.getElementById('profileFullName');
const profileDisplayNameInput = document.getElementById('profileDisplayName');
const profileAiNameInput = document.getElementById('profileAiName');
const profilePronounsInput = document.getElementById('profilePronouns');
const profileImageInput = document.getElementById('profileImage');
const removeProfileImageButton = document.getElementById('removeProfileImage');
const useProfileColorInput = document.getElementById('useProfileColor');
const profileAvatarInitial = document.getElementById('profileAvatarInitial');
const profileAvatarImage = document.getElementById('profileAvatarImage');
const profilePictureHistory = document.getElementById('profilePictureHistory');
const profilePictureHistoryList = document.getElementById('profilePictureHistoryList');
const profilePictureHistoryStorageKey = 'athenaProfilePictureHistory';
const maxProfilePictureHistory = 3;
let profileImageData = typeof savedProfile.imageData === 'string' && savedProfile.imageData.length <= 1000000 && /^data:image\/(png|jpeg|webp);base64,[\da-z+/]+=*$/i.test(savedProfile.imageData)
  ? savedProfile.imageData
  : '';
let profileColorChosen = savedProfile.colorChosen === true || (
  savedProfile.colorChosen === undefined && /^#[\da-f]{6}$/i.test(savedProfile.color)
);

function loadProfilePictureHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(profilePictureHistoryStorageKey) || '[]');
    if (!Array.isArray(history)) return [];
    return history.filter((entry) => (
      entry &&
      (entry.imageData === '' || (typeof entry.imageData === 'string' && entry.imageData.length <= 1000000 && /^data:image\/(png|jpeg|webp);base64,[\da-z+/]+=*$/i.test(entry.imageData))) &&
      typeof entry.colorChosen === 'boolean' &&
      /^#[\da-f]{6}$/i.test(entry.color) &&
      (entry.imageData || entry.colorChosen)
    )).slice(0, maxProfilePictureHistory);
  } catch {
    return [];
  }
}

function renderProfilePictureHistory() {
  if (!profilePictureHistory || !profilePictureHistoryList) return;
  const history = loadProfilePictureHistory();
  profilePictureHistory.hidden = history.length === 0;
  profilePictureHistoryList.innerHTML = '';

  history.forEach((entry, index) => {
    const button = document.createElement('button');
    button.className = 'profile-picture-history-button';
    button.type = 'button';
    button.title = `Use previous profile picture ${index + 1}`;
    button.setAttribute('aria-label', `Use previous profile picture ${index + 1}`);
    button.style.backgroundColor = entry.color;

    if (entry.imageData && !entry.colorChosen) {
      const image = document.createElement('img');
      image.src = entry.imageData;
      image.alt = '';
      button.appendChild(image);
    } else {
      const initial = document.createElement('span');
      initial.textContent = (savedProfile.displayName || savedProfile.name || 'A').charAt(0).toUpperCase();
      button.appendChild(initial);
    }

    button.addEventListener('click', () => {
      profileImageData = entry.imageData;
      profileColorInput.value = entry.color;
      profileColorChosen = entry.colorChosen;
      useProfileColorInput.checked = entry.colorChosen;
      profileImageInput.value = '';
      updateProfilePreview();
      profileStatus.textContent = 'Previous picture selected. Save profile to confirm.';
    });
    profilePictureHistoryList.appendChild(button);
  });
}

function updateProfilePreview() {
  const fullName = profileFullNameInput?.value.trim() || '';
  const displayName = profileDisplayNameInput?.value.trim() || '';
  const name = displayName || fullName || 'Athena friend';
  const color = profileColorInput?.value || '#d88e6e';
  const hasProfilePicture = Boolean(profileImageData) || profileColorChosen;
  const showProfileImage = Boolean(profileImageData) && !profileColorChosen;
  if (profilePreviewName) profilePreviewName.textContent = name;
  if (profileAvatar) {
    profileAvatar.hidden = !hasProfilePicture;
    profileAvatar.style.backgroundColor = color;
  }
  if (profileAvatarInitial) {
    profileAvatarInitial.textContent = (displayName || fullName || profileAiNameInput?.value.trim() || 'A').charAt(0).toUpperCase();
  }
  if (profileAvatarImage) {
    profileAvatarImage.hidden = !showProfileImage;
    if (showProfileImage && profileAvatarImage.src !== profileImageData) profileAvatarImage.src = profileImageData;
    if (!showProfileImage) profileAvatarImage.removeAttribute('src');
  }
  if (removeProfileImageButton) removeProfileImageButton.hidden = !hasProfilePicture;
  root.style.setProperty('--profile-color', color);
}

if (profileFullNameInput && profileDisplayNameInput && profileColorInput) {
  profileFullNameInput.value = typeof savedProfile.fullName === 'string' ? savedProfile.fullName : '';
  profileDisplayNameInput.value = typeof savedProfile.displayName === 'string'
    ? savedProfile.displayName
    : (typeof savedProfile.name === 'string' ? savedProfile.name : '');
  profileAiNameInput.value = typeof savedProfile.aiCallsYou === 'string' ? savedProfile.aiCallsYou : '';
  profilePronounsInput.value = typeof savedProfile.pronouns === 'string' ? savedProfile.pronouns : '';
  profileColorInput.value = /^#[\da-f]{6}$/i.test(savedProfile.color) ? savedProfile.color : '#d88e6e';
  if (profileNameColorInput) {
    profileNameColorInput.value = /^#[\da-f]{6}$/i.test(savedProfile.nameColor) ? savedProfile.nameColor : '#d88e6e';
  }
  useProfileColorInput.checked = profileColorChosen;
  updateProfilePreview();
  [profileFullNameInput, profileDisplayNameInput, profileAiNameInput].forEach((input) => {
    input.addEventListener('input', updateProfilePreview);
  });
  profileColorInput.addEventListener('input', () => {
    profileColorChosen = true;
    useProfileColorInput.checked = true;
    updateProfilePreview();
  });
  useProfileColorInput.addEventListener('change', () => {
    profileColorChosen = useProfileColorInput.checked;
    updateProfilePreview();
  });
  renderProfilePictureHistory();
}

if (profileImageInput) {
  profileImageInput.addEventListener('change', () => {
    const file = profileImageInput.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 700 * 1024) {
      profileStatus.textContent = 'Choose a PNG, JPEG, or WebP image under 700 KB.';
      profileImageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      profileImageData = typeof reader.result === 'string' ? reader.result : '';
      updateProfilePreview();
      profileStatus.textContent = 'Image ready. Save profile to keep it.';
    });
    reader.addEventListener('error', () => {
      profileStatus.textContent = 'Could not read this image.';
    });
    reader.readAsDataURL(file);
  });
}

if (removeProfileImageButton) {
  removeProfileImageButton.addEventListener('click', () => {
    profileImageData = '';
    profileColorChosen = false;
    useProfileColorInput.checked = false;
    profileImageInput.value = '';
    updateProfilePreview();
    profileStatus.textContent = 'Image removed from preview. Save profile to confirm.';
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const profile = {
      fullName: profileFullNameInput.value.trim().slice(0, 64),
      displayName: profileDisplayNameInput.value.trim().slice(0, 32),
      aiCallsYou: profileAiNameInput.value.trim().slice(0, 32),
      pronouns: profilePronounsInput.value.trim().slice(0, 32),
      color: profileColorInput.value,
      nameColor: profileNameColorInput?.value || '#d88e6e',
      colorChosen: profileColorChosen,
      imageData: profileImageData
    };
    try {
      localStorage.setItem(preferenceKeys.profile, JSON.stringify(profile));
      if (profile.imageData || profile.colorChosen) {
        const signature = `${profile.imageData}|${profile.colorChosen ? profile.color : ''}`;
        const history = loadProfilePictureHistory().filter((entry) => (
          `${entry.imageData}|${entry.colorChosen ? entry.color : ''}` !== signature
        ));
        history.unshift({
          imageData: profile.imageData,
          color: profile.color,
          colorChosen: profile.colorChosen,
          displayName: profile.displayName,
          savedAt: Date.now()
        });
        localStorage.setItem(profilePictureHistoryStorageKey, JSON.stringify(history.slice(0, maxProfilePictureHistory)));
      }
      savedProfile = profile;
      updateProfilePreview();
      renderProfilePictureHistory();
      profileStatus.textContent = 'Profile saved.';
    } catch {
      profileStatus.textContent = 'Profile could not be saved. Try a smaller image.';
    }
  });
}

const chatProfileName = document.getElementById('chatProfileName');
if (chatProfileName && (savedProfile.displayName || savedProfile.name || savedProfile.fullName)) {
  const displayName = savedProfile.displayName || savedProfile.name || savedProfile.fullName;
  const avatar = document.getElementById('chatProfileAvatar');
  const initial = document.getElementById('chatProfileInitial');
  const image = document.getElementById('chatProfileImage');
  const hasSavedImage = typeof savedProfile.imageData === 'string' && savedProfile.imageData.length <= 1000000 && /^data:image\/(png|jpeg|webp);base64,[\da-z+/]+=*$/i.test(savedProfile.imageData);
  const hasChosenColor = savedProfile.colorChosen === true || (
    savedProfile.colorChosen === undefined && /^#[\da-f]{6}$/i.test(savedProfile.color)
  );
  const showSavedImage = hasSavedImage && !hasChosenColor;
  document.getElementById('chatProfileNameText').textContent = displayName;
  initial.textContent = displayName.charAt(0).toUpperCase();
  avatar.style.backgroundColor = /^#[\da-f]{6}$/i.test(savedProfile.color) ? savedProfile.color : '#d88e6e';
  avatar.hidden = !(showSavedImage || hasChosenColor);
  if (showSavedImage) {
    image.src = savedProfile.imageData;
    image.hidden = false;
  } else {
    image.hidden = true;
    image.removeAttribute('src');
  }
  chatProfileName.hidden = false;
} else if (chatProfileName) {
  const accountMode = localStorage.getItem('athenaAccountMode');
  document.getElementById('chatProfileNameText').textContent = accountMode === 'login' || accountMode === 'create' ? 'User' : 'Guest';
  chatProfileName.hidden = false;
}

const settingsBackButton = document.getElementById('settingsBackButton');
if (settingsBackButton) {
  settingsBackButton.addEventListener('click', () => {
    let cameFromThisApp = false;
    try {
      cameFromThisApp = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
    } catch {
      cameFromThisApp = false;
    }
    if (cameFromThisApp && history.length > 1) history.back();
    else location.href = 'ATHENA.html';
  });
}
