(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const maxParticles = 18;
  const activeParticles = [];
  let lastSpawnTime = 0;
  let lastPoint = null;

  function removeParticle(particle) {
    particle.remove();
    const index = activeParticles.indexOf(particle);
    if (index !== -1) activeParticles.splice(index, 1);
  }

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

    const now = performance.now();
    if (now - lastSpawnTime < 38) return;
    if (lastPoint && Math.hypot(event.clientX - lastPoint.x, event.clientY - lastPoint.y) < 7) return;

    lastSpawnTime = now;
    lastPoint = { x: event.clientX, y: event.clientY };

    const sparkle = document.createElement('span');
    sparkle.className = 'cursor-sparkle';
    sparkle.setAttribute('aria-hidden', 'true');
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.style.setProperty('--sparkle-size', `${4 + Math.random() * 7}px`);
    sparkle.style.setProperty('--sparkle-drift', `${Math.round(Math.random() * 24 - 12)}px`);
    const duration = 520 + Math.round(Math.random() * 260);
    sparkle.style.setProperty('--sparkle-duration', `${duration}ms`);

    if (activeParticles.length >= maxParticles) removeParticle(activeParticles[0]);
    activeParticles.push(sparkle);
    document.body.appendChild(sparkle);
    sparkle.addEventListener('animationend', () => removeParticle(sparkle), { once: true });
    window.setTimeout(() => removeParticle(sparkle), duration + 160);
  }, { passive: true });
})();
