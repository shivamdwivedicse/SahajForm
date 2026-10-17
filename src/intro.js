// Opening screen: hover the orb (or tap / press Enter) to open the app.
const intro = document.getElementById('intro');
const orb = document.getElementById('intro-enter');
const ringFill = orb ? orb.querySelector('.ring-fill') : null;

function openApp() {
  if (!intro || intro.classList.contains('leaving')) return;
  intro.classList.remove('charging');
  intro.classList.add('leaving');
  document.body.classList.remove('intro-open');
  document.body.classList.add('entered');
  window.scrollTo(0, 0);
  setTimeout(() => intro.classList.add('gone'), 1000);
}

if (intro && orb) {
  // Mouse hover charges the ring; leaving cancels. Touch/keyboard use click.
  orb.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    orb.classList.add('charging');
    intro.classList.add('charging');
  });
  orb.addEventListener('pointerleave', () => {
    orb.classList.remove('charging');
    intro.classList.remove('charging');
  });
  if (ringFill) ringFill.addEventListener('animationend', openApp);
  orb.addEventListener('click', openApp);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !intro.classList.contains('gone')) openApp();
  });
  orb.focus({ preventScroll: true });
}