const starfields = document.querySelectorAll('.starfield, .chat-starfield');

function seededValue(seed) {
  const fraction = Math.sin(seed * 12.9898) * 43758.5453;
  return fraction - Math.floor(fraction);
}

starfields.forEach((starfield) => {
  const starSelector = starfield.classList.contains('chat-starfield') ? '.chat-star' : '.background-star';
  const existingStars = starfield.querySelectorAll(starSelector).length;
  const targetCount = Number(starfield.dataset.starCount);

  for (let index = existingStars; index < targetCount; index += 1) {
    const star = document.createElement('span');
    star.className = 'generated-star';
    star.setAttribute('aria-hidden', 'true');

    const horizontalPosition = 4 + seededValue(index * 4 + 1) * 92;
    const verticalPosition = 4 + seededValue(index * 4 + 2) * 92;
    const size = 3 + seededValue(index * 4 + 3) * 6;
    const duration = 2.8 + seededValue(index * 4 + 4) * 4.6;
    const delay = seededValue(index * 4 + 5) * -6;
    const brightness = 0.3 + seededValue(index * 4 + 6) * 0.42;

    star.style.left = `${horizontalPosition}%`;
    star.style.top = `${verticalPosition}%`;
    star.style.setProperty('--generated-star-size', `${size.toFixed(1)}px`);
    star.style.setProperty('--generated-star-duration', `${duration.toFixed(2)}s`);
    star.style.setProperty('--generated-star-delay', `${delay.toFixed(2)}s`);
    star.style.setProperty('--generated-star-brightness', brightness.toFixed(2));
    starfield.appendChild(star);
  }
});