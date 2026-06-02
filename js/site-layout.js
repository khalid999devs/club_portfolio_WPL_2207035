const sitePage = window.location.pathname.split('/').pop() || 'index.html';
const isHomePage = sitePage === 'index.html';
const isRegisterPage = sitePage === 'register.html';

const logoUrl =
  'https://www.kbec-official.org/assets/kbeclogoDarkBG-BXKv6nqZ.svg';
const developerLogoUrl =
  'https://www.kbec-official.org/assets/algooasis-Da9gRbl-.png';

function sectionHref(id) {
  return isHomePage ? `#${id}` : `index.html#${id}`;
}

function registerHref() {
  return isRegisterPage ? '#registration-form' : 'register.html';
}

function renderSiteHeader() {
  const host = document.querySelector('[data-site-header]');

  if (!host) {
    return;
  }

  const soundControl = isHomePage
    ? `
        <button
          class="sound-toggle"
          type="button"
          aria-label="Turn sound on"
          aria-pressed="false"
          data-state="muted"
        >
          <span class="sound-bars" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>`
    : '';

  host.outerHTML = `
    <nav class="hero-topbar" aria-label="Primary">
      <a class="club-logo-link" href="${sectionHref('top')}" aria-label="KBEC home">
        <img
          class="club-logo"
          src="${logoUrl}"
          alt="KUET Business and Entrepreneurship Club"
          width="360"
          height="80"
        />
      </a>
      <div class="hero-actions">
        ${soundControl}
        <button
          class="menu-button"
          type="button"
          aria-expanded="false"
          aria-controls="site-menu"
        >
          <span class="menu-label">Menu</span>
          <span class="menu-dots" aria-hidden="true">
            <span></span>
            <span></span>
          </span>
        </button>
        <a class="register-button" href="${registerHref()}">Register</a>
      </div>
    </nav>

    <div class="site-menu" id="site-menu" aria-hidden="true">
      <a href="${sectionHref('top')}">Home</a>
      <a href="${sectionHref('about')}">About Us</a>
      <a href="${sectionHref('events')}">Events</a>
      <a href="${sectionHref('sponsors')}">Sponsors</a>
      <a href="${sectionHref('hall-of-fame')}">Hall of Fame</a>
      <a href="${sectionHref('partners')}">Club Partners</a>
    </div>
  `;
}

function renderSiteFooter() {
  const host = document.querySelector('[data-site-footer]');

  if (!host) {
    return;
  }

  host.outerHTML = `
    <footer class="site-footer" aria-labelledby="footer-title">
      <div class="footer-watermark" aria-hidden="true">KBEC</div>

      <div class="footer-main">
        <section class="footer-brand" aria-labelledby="footer-title">
          <img
            class="footer-logo"
            src="${logoUrl}"
            alt="KUET Business and Entrepreneurship Club"
            width="360"
            height="80"
          />
          <h2 class="visually-hidden" id="footer-title">
            KUET Business and Entrepreneurship Club
          </h2>
          <p class="footer-tagline">
            The Premier Business And Entrepreneurship Club of KUET.
          </p>

          <address class="footer-contact">
            <a
              href="https://maps.google.com/?q=SWC-302%2C%20Students%20Welfare%20Center%2C%20KUET"
              target="_blank"
              rel="noreferrer"
            >
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>SWC-302, Students Welfare Center, KUET</span>
            </a>
            <a href="tel:+8801822076101">
              <i class="fa-solid fa-phone" aria-hidden="true"></i>
              <span>+880 1822 076 101</span>
            </a>
            <a href="mailto:kbec.kuet@gmail.com">
              <i class="fa-regular fa-envelope" aria-hidden="true"></i>
              <span>kbec.kuet@gmail.com</span>
            </a>
          </address>
        </section>

        <nav class="footer-column footer-explore" aria-label="Footer">
          <h3>Explore</h3>
          <ul>
            <li><a href="${sectionHref('top')}">Home</a></li>
            <li><a href="${sectionHref('about')}">About Us</a></li>
            <li><a href="${sectionHref('events')}">Events</a></li>
            <li><a href="${sectionHref('hall-of-fame')}">Hall of Fame</a></li>
            <li><a href="${sectionHref('sponsors')}">Sponsors</a></li>
            <li><a href="${sectionHref('partners')}">Club Partners</a></li>
          </ul>
        </nav>

        <section class="footer-column footer-social" aria-label="Social links">
          <h3>Follow Us</h3>
          <div class="social-links">
            <a
              href="https://www.facebook.com/KBEC.official/"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
            >
              <i class="fa-brands fa-facebook-f" aria-hidden="true"></i>
            </a>
            <a
              href="https://www.linkedin.com/company/kuet-business-and-entrepreneurship-club/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
            </a>
            <a
              href="https://www.instagram.com/kbec.kuet/"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <i class="fa-brands fa-instagram" aria-hidden="true"></i>
            </a>
          </div>

          <div class="developer-block">
            <h3>Developed By</h3>
            <a
              class="developer-card"
              href="https://algo-oasis.com/"
              aria-label="AlgoOasis"
              target="_blank"
              rel="noreferrer"
            >
              <span class="developer-mark" aria-hidden="true">
                <img
                  src="${developerLogoUrl}"
                  alt=""
                  loading="lazy"
                />
              </span>
              <span>
                <strong>AlgoOasis</strong>
                <small>IT Partner</small>
              </span>
            </a>
          </div>
        </section>
      </div>

      <p class="footer-bottom">
        &copy; 2026 KBEC Official. All Rights Reserved.
      </p>
    </footer>

    <a
      class="back-to-top"
      href="#top"
      aria-label="Back to top"
      aria-hidden="true"
      tabindex="-1"
    >
      <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
    </a>
  `;
}

renderSiteHeader();
renderSiteFooter();
