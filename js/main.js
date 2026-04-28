const heroVideo = document.querySelector('.hero-video');
const soundToggle = document.querySelector('.sound-toggle');
const menuButton = document.querySelector('.menu-button');
const menuLabel = document.querySelector('.menu-label');
const siteMenu = document.querySelector('.site-menu');
const backToTop = document.querySelector('.back-to-top');

function updateSoundButton() {
  if (!heroVideo || !soundToggle) {
    return;
  }

  const isMuted = heroVideo.muted || heroVideo.volume === 0;
  soundToggle.dataset.state = isMuted ? 'muted' : 'sound';
  soundToggle.setAttribute('aria-pressed', String(!isMuted));
  soundToggle.setAttribute(
    'aria-label',
    isMuted ? 'Turn sound on' : 'Turn sound off',
  );
}

if (heroVideo && soundToggle) {
  updateSoundButton();

  soundToggle.addEventListener('click', () => {
    heroVideo.muted = !heroVideo.muted;

    if (!heroVideo.muted) {
      heroVideo.volume = 1;
      heroVideo.play().catch(() => {
        heroVideo.muted = true;
        updateSoundButton();
      });
    }

    updateSoundButton();
  });
}

function setMenuOpen(isOpen) {
  if (!menuButton || !siteMenu || !menuLabel) {
    return;
  }

  siteMenu.classList.toggle('is-open', isOpen);
  siteMenu.setAttribute('aria-hidden', String(!isOpen));
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuLabel.textContent = isOpen ? 'Close' : 'Menu';
}

if (menuButton && siteMenu) {
  menuButton.addEventListener('click', () => {
    setMenuOpen(!siteMenu.classList.contains('is-open'));
  });

  siteMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    const clickedMenuControl = menuButton.contains(event.target);
    const clickedMenuPanel = siteMenu.contains(event.target);

    if (
      siteMenu.classList.contains('is-open') &&
      !clickedMenuControl &&
      !clickedMenuPanel
    ) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
    }
  });
}

function updateBackToTop() {
  if (!backToTop) {
    return;
  }

  const threshold = Math.max(360, window.innerHeight * 0.58);
  const isVisible = window.scrollY > threshold;

  backToTop.classList.toggle('is-visible', isVisible);
  backToTop.setAttribute('aria-hidden', String(!isVisible));
  backToTop.tabIndex = isVisible ? 0 : -1;
}

if (backToTop) {
  updateBackToTop();
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  window.addEventListener('resize', updateBackToTop);
}
