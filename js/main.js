const heroVideo = document.querySelector('.hero-video');
const heroSection = document.querySelector('.hero');
const heroTopbar = document.querySelector('.hero-topbar');
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

if (!heroVideo && soundToggle) {
  soundToggle.hidden = true;
  soundToggle.setAttribute('aria-hidden', 'true');
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

  if (isOpen) {
    heroTopbar?.classList.remove('is-hidden');
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

let previousTopbarScrollY = window.scrollY;
let topbarTicking = false;
const scrollDirectionTolerance = 2;

function updateTopbarState() {
  if (!heroTopbar) {
    return;
  }

  const currentScrollY = Math.max(window.scrollY, 0);
  const backgroundThreshold = Math.max(170, window.innerHeight * 0.18);
  const scrollDelta = currentScrollY - previousTopbarScrollY;
  const menuIsOpen = siteMenu?.classList.contains('is-open');
  const topbarHasFocus = heroTopbar.contains(document.activeElement);
  const heroBottom = heroSection?.getBoundingClientRect().bottom ?? 0;
  const heroHasPassedTopbar = heroBottom <= heroTopbar.offsetHeight + 18;

  heroTopbar.classList.toggle(
    'is-scrolled',
    currentScrollY > backgroundThreshold || heroHasPassedTopbar,
  );

  if (currentScrollY <= 0 || menuIsOpen || topbarHasFocus) {
    heroTopbar.classList.remove('is-hidden');
  } else if (scrollDelta > scrollDirectionTolerance) {
    heroTopbar.classList.add('is-hidden');
  } else if (scrollDelta < -scrollDirectionTolerance) {
    heroTopbar.classList.remove('is-hidden');
  }

  previousTopbarScrollY = currentScrollY;
  topbarTicking = false;
}

function requestTopbarUpdate() {
  if (topbarTicking) {
    return;
  }

  topbarTicking = true;
  window.requestAnimationFrame(updateTopbarState);
}

if (heroTopbar) {
  updateTopbarState();
  window.addEventListener('scroll', requestTopbarUpdate, { passive: true });
  window.addEventListener('resize', updateTopbarState);
  window.addEventListener('hashchange', () => {
    window.requestAnimationFrame(updateTopbarState);
  });
  window.addEventListener('load', () => {
    updateTopbarState();
    window.setTimeout(updateTopbarState, 120);
  });
  window.addEventListener('pageshow', updateTopbarState);
}
