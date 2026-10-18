const colorPicker = document.getElementById('bgColor');
const starColorPicker = document.getElementById('starColor');
const saveBackgroundBtn = document.getElementById('saveBackgroundBtn');
const resetBackgroundBtn = document.getElementById('resetBackgroundBtn');
const backgroundStatus = document.getElementById('backgroundStatus');
const customPresetNameInput = document.getElementById('customPresetName');
const saveCustomPresetBtn = document.getElementById('saveCustomPresetBtn');
const customPresetsContainer = document.getElementById('customPresets');
const customPresetList = document.getElementById('customPresetList');
const backgroundColorInputs = document.querySelectorAll('.background-color');
const themeButtons = document.querySelectorAll('.theme-swatch');
const accountStatus = document.getElementById('accountStatus');
const starColorStorageKey = 'athenaStarColor';
const defaultStarColor = '#fff0a8';
const customPresetsStorageKey = 'athenaCustomPresets';
const activeCustomPresetStorageKey = 'athenaActiveCustomPreset';
const maxCustomPresets = 8;
let activeCustomPresetId = null;

const welcomeLabel = document.getElementById('welcomeLabel');
const apiBase = window.ATHENA_API_BASE_URL ?? '';
if (welcomeLabel) {
  welcomeLabel.textContent = 'Welcome, guest';
  fetch(`${apiBase}/students/session`, { credentials: 'include' })
    .then((response) => {
      if (response.ok) welcomeLabel.textContent = 'Welcome, student';
    })
    .catch(() => {});
}

const applyTheme = (theme) => {
  const themeExists = Array.from(themeButtons).some((button) => button.dataset.theme === theme);
  if (!themeExists) return;

  Object.values(backgroundProperties).forEach((property) => {
    document.documentElement.style.removeProperty(property);
  });
  document.documentElement.removeAttribute('data-custom-preset');
  activeCustomPresetId = null;
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === theme));
  });

  syncBackgroundInputs();
};

const backgroundProperties = {
  skyColor: '--sky-bg',
  bgColor: '--page-bg',
  groundColor: '--ground-bg',
  landscapeColor: '--hill-color'
};

function syncBackgroundInputs() {
  const styles = getComputedStyle(document.documentElement);
  backgroundColorInputs.forEach((input) => {
    input.value = styles.getPropertyValue(backgroundProperties[input.id]).trim();
  });
}

function getCurrentBackgroundColors() {
  const styles = getComputedStyle(document.documentElement);
  const colors = {};
  Object.entries(backgroundProperties).forEach(([inputId, property]) => {
    colors[inputId] = styles.getPropertyValue(property).trim();
  });
  colors.starColor = styles.getPropertyValue('--star-color').trim();
  return colors;
}

function loadCustomPresets() {
  try {
    const presets = JSON.parse(localStorage.getItem(customPresetsStorageKey) || '[]');
    if (!Array.isArray(presets)) return [];
    return presets.filter((preset) => (
      preset &&
      typeof preset.id === 'string' &&
      typeof preset.name === 'string' &&
      preset.name.trim() &&
      preset.colors &&
      [...Object.keys(backgroundProperties), 'starColor'].every((key) => /^#[\da-f]{6}$/i.test(preset.colors[key]))
    ));
  } catch {
    return [];
  }
}

function renderCustomPresets() {
  const presets = loadCustomPresets();
  customPresetsContainer.hidden = presets.length === 0;
  customPresetList.innerHTML = '';

  presets.forEach((preset) => {
    const entry = document.createElement('div');
    entry.className = 'custom-preset-entry';

    const selectButton = document.createElement('button');
    selectButton.className = 'custom-preset-btn';
    selectButton.type = 'button';
    selectButton.title = `Use ${preset.name} background`;
    selectButton.setAttribute('aria-label', `Use ${preset.name} background preset`);
    selectButton.setAttribute('aria-pressed', String(preset.id === activeCustomPresetId));

    const swatch = document.createElement('span');
    swatch.className = 'custom-preset-swatch';
    swatch.style.background = `linear-gradient(135deg, ${preset.colors.skyColor} 50%, ${preset.colors.groundColor} 50%)`;
    const name = document.createElement('span');
    name.className = 'custom-preset-name';
    name.textContent = preset.name;
    selectButton.append(swatch, name);
    selectButton.addEventListener('click', () => applyCustomPreset(preset));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-preset-btn';
    deleteButton.type = 'button';
    deleteButton.textContent = 'x';
    deleteButton.title = `Delete ${preset.name} preset`;
    deleteButton.setAttribute('aria-label', `Delete ${preset.name} background preset`);
    deleteButton.addEventListener('click', () => deleteCustomPreset(preset.id));

    entry.append(selectButton, deleteButton);
    customPresetList.appendChild(entry);
  });
}

function applyCustomPreset(preset) {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  Object.entries(backgroundProperties).forEach(([inputId, property]) => {
    root.style.setProperty(property, preset.colors[inputId]);
  });
  root.style.setProperty('--star-color', preset.colors.starColor);
  root.dataset.customPreset = preset.id;
  activeCustomPresetId = preset.id;
  starColorPicker.value = preset.colors.starColor;
  themeButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
  syncBackgroundInputs();
  renderCustomPresets();
  backgroundStatus.textContent = 'Unsaved background changes.';
}

const savedTheme = localStorage.getItem('athenaBackgroundTheme');
const savedCustomBackground = localStorage.getItem('athenaCustomBackground');
const savedCustomPresetId = localStorage.getItem(activeCustomPresetStorageKey);

if (savedTheme && Array.from(themeButtons).some((button) => button.dataset.theme === savedTheme)) {
  applyTheme(savedTheme);
} else if (savedCustomBackground) {
  try {
    const customColors = JSON.parse(savedCustomBackground);
    Object.entries(backgroundProperties).forEach(([inputId, property]) => {
      const color = customColors[inputId];
      if (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)) {
        document.documentElement.style.setProperty(property, color);
      }
    });
  } catch {
    if (/^#[\da-f]{6}$/i.test(savedCustomBackground)) {
      document.documentElement.style.setProperty('--page-bg', savedCustomBackground);
    }
  }
  themeButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
  if (loadCustomPresets().some((preset) => preset.id === savedCustomPresetId)) {
    activeCustomPresetId = savedCustomPresetId;
    document.documentElement.dataset.customPreset = savedCustomPresetId;
  }
  syncBackgroundInputs();
} else {
  applyTheme('warm');
}

const savedStarColor = localStorage.getItem(starColorStorageKey);
if (starColorPicker) {
  if (savedStarColor && /^#[\da-f]{6}$/i.test(savedStarColor)) {
    starColorPicker.value = savedStarColor;
  }
  document.documentElement.style.setProperty('--star-color', starColorPicker.value);
  starColorPicker.addEventListener('input', (event) => {
    document.documentElement.style.setProperty('--star-color', event.target.value);
    document.documentElement.removeAttribute('data-custom-preset');
    activeCustomPresetId = null;
    renderCustomPresets();
    if (backgroundStatus) backgroundStatus.textContent = 'Unsaved background changes.';
  });
}

renderCustomPresets();

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.theme);
    renderCustomPresets();
    if (backgroundStatus) backgroundStatus.textContent = 'Unsaved background changes.';
  });
});

backgroundColorInputs.forEach((input) => {
  input.addEventListener('input', (event) => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-custom-preset');
    activeCustomPresetId = null;
    themeButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));

    backgroundColorInputs.forEach((colorInput) => {
      const color = colorInput === event.target
        ? event.target.value
        : getComputedStyle(document.documentElement).getPropertyValue(backgroundProperties[colorInput.id]).trim();
      document.documentElement.style.setProperty(backgroundProperties[colorInput.id], color);
      colorInput.value = color;
    });

    renderCustomPresets();
    if (backgroundStatus) backgroundStatus.textContent = 'Unsaved background changes.';
  });
});

function saveBackground() {
  const root = document.documentElement;
  const selectedTheme = root.dataset.theme;

  if (selectedTheme) {
    localStorage.setItem('athenaBackgroundTheme', selectedTheme);
    localStorage.removeItem('athenaCustomBackground');
  } else {
    const customColors = {};
    Object.entries(backgroundProperties).forEach(([inputId, property]) => {
      customColors[inputId] = getComputedStyle(root).getPropertyValue(property).trim();
    });
    localStorage.removeItem('athenaBackgroundTheme');
    localStorage.setItem('athenaCustomBackground', JSON.stringify(customColors));
  }

  if (activeCustomPresetId && loadCustomPresets().some((preset) => preset.id === activeCustomPresetId)) {
    localStorage.setItem(activeCustomPresetStorageKey, activeCustomPresetId);
  } else {
    localStorage.removeItem(activeCustomPresetStorageKey);
  }
  localStorage.setItem(starColorStorageKey, getComputedStyle(root).getPropertyValue('--star-color').trim());
}

saveBackgroundBtn.addEventListener('click', () => {
  saveBackground();
  backgroundStatus.textContent = 'Background saved.';
});

function saveCustomPreset() {
  const name = customPresetNameInput.value.trim();
  if (!name) {
    backgroundStatus.textContent = 'Enter a name for this preset.';
    customPresetNameInput.focus();
    return;
  }

  const presets = loadCustomPresets();
  const existingPreset = presets.find((preset) => preset.name.toLowerCase() === name.toLowerCase());
  if (!existingPreset && presets.length >= maxCustomPresets) {
    backgroundStatus.textContent = `You can save up to ${maxCustomPresets} custom presets.`;
    return;
  }

  const preset = {
    id: existingPreset?.id || `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    colors: getCurrentBackgroundColors()
  };
  const updatedPresets = existingPreset
    ? presets.map((item) => item.id === existingPreset.id ? preset : item)
    : [...presets, preset];

  localStorage.setItem(customPresetsStorageKey, JSON.stringify(updatedPresets));
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  Object.entries(backgroundProperties).forEach(([inputId, property]) => {
    root.style.setProperty(property, preset.colors[inputId]);
  });
  root.style.setProperty('--star-color', preset.colors.starColor);
  themeButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
  starColorPicker.value = preset.colors.starColor;
  syncBackgroundInputs();
  activeCustomPresetId = preset.id;
  root.dataset.customPreset = preset.id;
  customPresetNameInput.value = '';
  saveBackground();
  renderCustomPresets();
  backgroundStatus.textContent = `Saved preset: ${name}.`;
}

function deleteCustomPreset(presetId) {
  const presets = loadCustomPresets();
  const deletedPreset = presets.find((preset) => preset.id === presetId);
  const remainingPresets = presets.filter((preset) => preset.id !== presetId);
  localStorage.setItem(customPresetsStorageKey, JSON.stringify(remainingPresets));

  if (activeCustomPresetId === presetId) {
    activeCustomPresetId = null;
    document.documentElement.removeAttribute('data-custom-preset');
    saveBackground();
  }
  renderCustomPresets();
  backgroundStatus.textContent = deletedPreset ? `Deleted preset: ${deletedPreset.name}.` : 'Preset deleted.';
}

saveCustomPresetBtn.addEventListener('click', saveCustomPreset);
customPresetNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') saveCustomPreset();
});

resetBackgroundBtn.addEventListener('click', () => {
  applyTheme('warm');
  starColorPicker.value = defaultStarColor;
  document.documentElement.style.setProperty('--star-color', defaultStarColor);
  localStorage.setItem('athenaBackgroundTheme', 'warm');
  localStorage.removeItem('athenaCustomBackground');
  localStorage.removeItem(activeCustomPresetStorageKey);
  localStorage.setItem(starColorStorageKey, defaultStarColor);
  renderCustomPresets();
  backgroundStatus.textContent = 'Background reset to default.';
});

