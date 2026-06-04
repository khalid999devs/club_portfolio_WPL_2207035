const directoryRoot = document.querySelector('[data-directory-page]');

const API_BASE = 'https://admin.kbec-official.org';
const OFFICIAL_SITE = 'https://www.kbec-official.org';
const EVENT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80';

function getLocalApiBaseUrl() {
  if (window.KBEC_API_BASE_URL) {
    return window.KBEC_API_BASE_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
}

const fallbackEvents = [
  {
    name: 'TEDXKUET 2026',
    tagline: 'Beyond the self you see',
    date: '2026',
    venue: 'KUET Auditorium',
    attendees: 700,
    speakers: 9,
    image: `${API_BASE}/uploads/events/img-20260417-191136-aac911.webp`,
    slugId: 'tedxkuet-2026',
    about:
      'TEDxKUET 2026 is a flagship idea-sharing experience designed around stories, leadership, innovation, and the courage to look beyond what is visible.',
    order: 0,
  },
  {
    name: 'KBEC NEXUS Season 2',
    tagline: 'National business case competition',
    date: 'December 12, 2025',
    venue: 'KUET Auditorium',
    attendees: 300,
    image: `${API_BASE}/uploads/events/copy-of-103-bc63b7-857d98.webp`,
    externalLink: 'https://kbec-nexus-season2.com/',
    about:
      'KBEC_NEXUS Season 2 is a national case competition focused on real business challenges, analytical thinking, and actionable solutions.',
    order: 1,
  },
  {
    name: 'Prime Bank Presents: Empowering Youth',
    tagline: 'Engaging and inspiring youth in banking',
    date: 'January 26, 2026',
    venue: 'KUET Auditorium',
    attendees: 385,
    speakers: 2,
    image: `${API_BASE}/uploads/events/114-fa0bc9-273ed2.webp`,
    about:
      'A practical session with industry professionals to help students understand banking careers, financial awareness, and youth leadership.',
    order: 2,
  },
  {
    name: 'TEDxKUET',
    tagline: 'Break The Barrier',
    date: 'November 4, 2022',
    venue: 'Khulna University of Engineering & Technology',
    attendees: 100,
    speakers: 3,
    image: `${API_BASE}/uploads/events/img-2655-1-1f5983.webp`,
    externalLink: 'https://www.ted.com/tedx/events/63921',
    about:
      'An independently organized TED event at KUET, bringing together speakers and students around ideas worth spreading.',
    order: 3,
  },
  {
    name: 'Case Crack 2.0',
    tagline: 'Case-solving and business learning platform',
    date: '2025',
    venue: 'KUET Auditorium',
    image: `${API_BASE}/uploads/events/cover-edfa24.webp`,
    about:
      'Case Crack prepares students for real-world business and technology cases through structured problem analysis and presentation practice.',
    order: 4,
  },
  {
    name: 'HSBC-IBA Business Case Competition 2023',
    tagline: 'KUET Campus Round',
    date: 'April 1, 2023',
    venue: 'KUET',
    image: `${API_BASE}/uploads/events/hhh1-930c09.jpg`,
    about:
      'A campus round designed to give KUET students exposure to competitive case solving and business strategy.',
    order: 5,
  },
  {
    name: 'Case Crack',
    tagline: 'Flagship case-solving event',
    date: 'May 22, 2022',
    venue: 'KUET',
    image: `${API_BASE}/uploads/events/l1-a06b71.jpg`,
    about:
      'A focused learning event for developing business analysis, structured thinking, and decision-making skills.',
    order: 6,
  },
  {
    name: 'Theory U Webinar',
    tagline: 'Leadership and systems thinking',
    date: 'May 28, 2021',
    venue: 'Online',
    image: `${API_BASE}/uploads/events/y6-918fa9.jpg`,
    about:
      'An online learning session introducing Theory U concepts for leadership, innovation, and organizational change.',
    order: 7,
  },
  {
    name: 'Future of Supply Chain Management',
    tagline: 'Industry learning session',
    date: 'June 4, 2021',
    venue: 'Online',
    image: `${API_BASE}/uploads/events/hfhf-8bab3f.jpg`,
    about:
      'A session on supply chain trends, operational thinking, and future career paths for engineering students.',
    order: 8,
  },
];

const fallbackExecutives = [
  {
    name: 'Foysal Iqbal Fouad',
    position: 'President',
    image: `${API_BASE}/uploads/executives/foysal-iqbal-fouad-president-4037b6.webp`,
    order: 1,
  },
  {
    name: 'Syed Rafidul Islam Rafid',
    position: 'General Secretary',
    image: `${API_BASE}/uploads/executives/syed-rafidul-islam-rafid-general-secretary-e48063.webp`,
    order: 2,
  },
  {
    name: 'Jubaer Hossain Sazin',
    position: 'Senior Executive Vice-President',
    image: `${API_BASE}/uploads/executives/jubaer-hossain-sazin-senior-executive-vice-president-772198.webp`,
    order: 3,
  },
  {
    name: 'Farhan Ishraq Ariyan',
    position: 'Vice President (Internal & External)',
    image: `${API_BASE}/uploads/executives/farhan-ishraq-ariyan-vice-president-internal-external-50ad1b.webp`,
    order: 4,
  },
  {
    name: 'Swapnil Kundu',
    position: 'Organizing Secretary',
    image: `${API_BASE}/uploads/executives/swapnil-kundu-organizing-secretary-ef75db.webp`,
    order: 5,
  },
  {
    name: 'Kamrul Hossain Rafi',
    position: 'Organizing Secretary',
    image: `${API_BASE}/uploads/executives/kamrul-hossain-rafi-organizing-secretary-098368.webp`,
    order: 6,
  },
  {
    name: 'Nawshin Sharmili Urbi',
    position: 'Joint Secretary',
    image: `${API_BASE}/uploads/executives/nawshin-sharmili-urbi-joint-secretary-deaba8.webp`,
    order: 7,
  },
  {
    name: 'Minhajur Rahman Munna',
    position: 'Joint Secretary',
    image: `${API_BASE}/uploads/executives/minhajur-rahman-munna-joint-secretary-4a7e97.webp`,
    order: 8,
  },
  {
    name: 'Farzana Mitu',
    position: 'Secretary of Human Resources',
    image: `${API_BASE}/uploads/executives/farzana-mitu-secretary-of-human-resources-a869ba.webp`,
    order: 9,
  },
  {
    name: 'Asif Saiman',
    position: 'Secretary of Operations',
    image: `${API_BASE}/uploads/executives/asif-saiman-secretary-of-operations-964466.webp`,
    order: 10,
  },
  {
    name: 'Sudipto Prottoy',
    position: 'Secretary of Logistics',
    image: `${API_BASE}/uploads/executives/sudipto-prottoy-secretary-of-logistics-9bd39d.webp`,
    order: 11,
  },
  {
    name: 'Abdullah Al Saikat',
    position: 'Secretary of Public Relations',
    image: `${API_BASE}/uploads/executives/abdullah-al-saikat-secretary-of-public-relations-a997d2.webp`,
    order: 12,
  },
  {
    name: 'Arian Rahman Aditta',
    position: 'Secretary of Finance',
    image: `${API_BASE}/uploads/executives/arian-rahman-aditta-secretary-of-finance-35f401.webp`,
    order: 13,
  },
];

const fallbackAlumni = [
  {
    name: 'Sadman Mohammad Nasif',
    position: 'President',
    fiscalYear: '2024-25',
    image: `${API_BASE}/uploads/general/sadman-mohammad-nasif-ca33fb.png`,
    order: 1,
  },
  {
    name: 'MD. Toslim',
    position: 'Vice President (Executive)',
    fiscalYear: '2024-25',
    image: `${API_BASE}/uploads/general/md-toslim-4d3827.png`,
    order: 2,
  },
  {
    name: 'Zulfia Shukannya Uddin',
    position: 'Vice President (Internal)',
    fiscalYear: '2024-25',
    image: `${API_BASE}/uploads/general/zulfia-shukannya-uddin-2afb7d.png`,
    order: 3,
  },
  {
    name: 'Hossain Adnan',
    position: 'Vice President (External)',
    fiscalYear: '2024-25',
    image: `${API_BASE}/uploads/general/hossain-adnan-2a4274.png`,
    order: 4,
  },
  {
    name: 'Arpa Saha',
    position: 'Joint Secretary',
    fiscalYear: '2024-25',
    image: `${API_BASE}/uploads/general/arpa-saha-ff8c0e.png`,
    order: 5,
  },
  {
    name: 'Faiaz Abdullah',
    position: 'President',
    fiscalYear: '2023-24',
    image: `${API_BASE}/uploads/general/faiaz-abdullah-b6b9de.png`,
    order: 1,
  },
  {
    name: 'Mashaba Nadia',
    position: 'General Secretary',
    fiscalYear: '2023-24',
    image: `${API_BASE}/uploads/general/mashaba-nadia-bcab02.png`,
    order: 2,
  },
  {
    name: 'Fatima Tasnim Easha',
    position: 'Vice President',
    fiscalYear: '2023-24',
    image: `${API_BASE}/uploads/general/fatima-tasnim-easha-98bdcc.png`,
    order: 3,
  },
  {
    name: 'Abdullah Al Saad',
    position: 'President',
    fiscalYear: '2021-23',
    image: `${API_BASE}/uploads/general/abdullah-al-saad-e9b2e6.png`,
    order: 1,
  },
  {
    name: 'Mobin Mithun',
    position: 'General Secretary',
    fiscalYear: '2021-23',
    image: `${API_BASE}/uploads/general/mobin-mithun-00d369.png`,
    order: 2,
  },
  {
    name: 'Rajin Redowan',
    position: 'President',
    fiscalYear: '2020-21',
    image: `${API_BASE}/uploads/general/rajin-redowan-f17aec.png`,
    order: 1,
  },
  {
    name: 'Neil Avishek',
    position: 'General Secretary',
    fiscalYear: '2020-21',
    image: `${API_BASE}/uploads/general/neil-avishek-ddf322.png`,
    order: 2,
  },
];

const pageConfigs = {
  events: {
    endpoints: [`${getLocalApiBaseUrl()}/api/events`, `${API_BASE}/api/events`],
    mergeSources: true,
    fallback: fallbackEvents,
    render: renderEvents,
  },
  alumni: {
    endpoint: `${API_BASE}/api/alumni`,
    fallback: fallbackAlumni,
    render: renderPeople,
  },
  executives: {
    endpoint: `${API_BASE}/api/executives`,
    fallback: fallbackExecutives,
    render: renderPeople,
  },
};

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function getCountLabel(value, singular, plural) {
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} ${value.length === 1 ? singular : plural}` : '';
  }

  if (typeof value === 'number') {
    return value > 0 ? `${value} ${value === 1 ? singular : plural}` : '';
  }

  const text = cleanText(value);

  if (!text) {
    return '';
  }

  if (/^\d+$/.test(text)) {
    return `${text} ${text === '1' ? singular : plural}`;
  }

  return text.toLowerCase().includes(singular) || text.toLowerCase().includes(plural)
    ? text
    : `${text} ${plural}`;
}

function getTimelinePreview(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      label: cleanText(item.label || item.title || item.name),
      detail: cleanText(item.detail || item.description),
      date: cleanText(item.timelineDate || item.date),
    }))
    .filter((item) => item.label)
    .slice(0, 3);
}

function escapeHtml(value) {
  return cleanText(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function toArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function mergeDirectoryItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = cleanText(
      item.slug ||
        item.slugId ||
        `${item.name || item.title}-${item.date || item.eventDate || item.year}`,
    ).toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function assetUrl(value, fallback = EVENT_PLACEHOLDER) {
  const url = cleanText(value);

  if (!url) {
    return fallback;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function sortByOrder(items) {
  return [...items].sort((first, second) => {
    const firstOrder = Number(first.order ?? 9999);
    const secondOrder = Number(second.order ?? 9999);

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return cleanText(first.name).localeCompare(cleanText(second.name));
  });
}

function getEventYear(event) {
  const source = `${event.date ?? ''} ${event.name ?? ''} ${event.tagline ?? ''}`;
  const match = source.match(/20\d{2}/);

  return match ? match[0] : 'Upcoming';
}

function getEventLink(event) {
  const externalLink = cleanText(event.externalLink || event.link || event.url);

  if (externalLink) {
    return externalLink;
  }

  const slug = cleanText(event.slugId || event.slug || event.id);
  return slug ? `${OFFICIAL_SITE}/events/${slug}` : `${OFFICIAL_SITE}/events`;
}

function getExecutiveCategory(person) {
  const position = getPersonPosition(person).toLowerCase();

  if (position.includes('junior')) {
    return 'Junior Executives';
  }

  if (position.includes('senior executive')) {
    return 'Senior Executives';
  }

  if (position.includes('assistant')) {
    return 'Assistant Secretaries';
  }

  if (position.includes('secretary')) {
    return 'Secretaries';
  }

  return 'Core Panel';
}

function getPersonPosition(person) {
  return cleanText(
    person.position ||
      person.designation ||
      person.role ||
      person.title ||
      person.post,
  );
}

function getUsefulSocials(person) {
  const links = [
    ['LinkedIn', 'fa-brands fa-linkedin-in', person.linkedin],
    ['Facebook', 'fa-brands fa-facebook-f', person.facebook],
  ];

  return links.filter(([, , url]) => {
    const normalized = cleanText(url).replace(/\/+$/, '').toLowerCase();
    return (
      normalized &&
      normalized !== 'https://linkedin.com/in' &&
      normalized !== 'https://www.linkedin.com/in' &&
      normalized !== 'https://facebook.com' &&
      normalized !== 'https://www.facebook.com'
    );
  });
}

function initialsFor(name) {
  return cleanText(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function setStatus(message) {
  const status = directoryRoot.querySelector('[data-directory-status]');

  if (status) {
    status.textContent = message;
  }
}

function renderSummary(cards) {
  const summary = directoryRoot.querySelector('[data-directory-summary]');

  if (!summary) {
    return;
  }

  summary.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <strong>${escapeHtml(card.value)}</strong>
          <span>${escapeHtml(card.label)}</span>
        </article>
      `,
    )
    .join('');
}

function renderFilters(filters, onChange) {
  const filterHost = directoryRoot.querySelector('[data-directory-filters]');

  if (!filterHost) {
    return;
  }

  filterHost.innerHTML = filters
    .map(
      (filter, index) => `
        <button
          class="filter-chip${index === 0 ? ' is-active' : ''}"
          type="button"
          data-filter="${escapeHtml(filter.value)}"
        >
          ${escapeHtml(filter.label)}
        </button>
      `,
    )
    .join('');

  filterHost.querySelectorAll('.filter-chip').forEach((button) => {
    button.addEventListener('click', () => {
      filterHost
        .querySelectorAll('.filter-chip')
        .forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      onChange(button.dataset.filter);
    });
  });
}

function filterCards(value) {
  const cards = directoryRoot.querySelectorAll('[data-card-filter]');

  cards.forEach((card) => {
    const shouldHide = value !== 'all' && card.dataset.cardFilter !== value;
    card.classList.toggle('is-filtered-out', shouldHide);
  });
}

function uniqueValues(items, getter) {
  return [...new Set(items.map(getter).filter(Boolean))];
}

function buildYearFilters(items, getter) {
  const values = uniqueValues(items, getter).sort((first, second) => {
    if (first === 'Upcoming') return -1;
    if (second === 'Upcoming') return 1;
    return Number(second.replace(/\D/g, '')) - Number(first.replace(/\D/g, ''));
  });

  return [{ label: 'All', value: 'all' }, ...values.map((value) => ({ label: value, value }))];
}

function renderEvents(items) {
  const grid = directoryRoot.querySelector('[data-directory-grid]');
  const events = sortByOrder(items);
  const years = uniqueValues(events, getEventYear);
  const upcoming = events.filter((event) => getEventYear(event) === '2026').length;

  renderSummary([
    { value: events.length, label: 'Events Listed' },
    { value: years.length, label: 'Active Years' },
    { value: upcoming, label: 'Upcoming / 2026' },
    { value: 'Live', label: 'Official Source' },
  ]);

  renderFilters(buildYearFilters(events, getEventYear), filterCards);

  grid.innerHTML =
    events
      .map((event) => {
        const name = cleanText(event.name);
        const year = getEventYear(event);
        const date = cleanText(event.date || event.eventDate) || year;
        const venue = cleanText(event.venue);
        const attendees = getCountLabel(event.attendees, 'attendee', 'attendees');
        const speakers = getCountLabel(event.speakers, 'speaker', 'speakers');
        const tagline = cleanText(event.tagline || event.title);
        const about = cleanText(event.about || event.description);
        const aboutPreview =
          about.length > 360 ? `${about.slice(0, 360)}...` : about;
        const image = assetUrl(event.image || event.imageUrl || event.thumbnail || event.cover);
        const link = getEventLink(event);
        const timeline = getTimelinePreview(event.timeline);

        return `
          <article class="event-card" data-card-filter="${escapeHtml(year)}">
            <figure class="event-media">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
            </figure>
            <div class="event-body">
              <span class="event-date">${escapeHtml(date)}</span>
              <h3>${escapeHtml(name)}</h3>
              ${tagline ? `<p class="event-tagline">${escapeHtml(tagline)}</p>` : ''}
              ${
                about
                  ? `<p class="event-description">${escapeHtml(aboutPreview)}</p>`
                  : ''
              }
              <div class="event-meta" aria-label="Event details">
                ${venue ? `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(venue)}</span>` : ''}
                ${attendees ? `<span><i class="fa-solid fa-users" aria-hidden="true"></i>${escapeHtml(attendees)}</span>` : ''}
                ${speakers ? `<span><i class="fa-solid fa-microphone-lines" aria-hidden="true"></i>${escapeHtml(speakers)}</span>` : ''}
              </div>
              ${
                timeline.length
                  ? `
                    <ol class="event-timeline-preview" aria-label="${escapeHtml(name)} timeline">
                      ${timeline
                        .map(
                          (item) => `
                            <li>
                              <strong>${escapeHtml(item.label)}</strong>
                              ${item.detail || item.date ? `<span>${escapeHtml([item.detail, item.date].filter(Boolean).join(' · '))}</span>` : ''}
                            </li>
                          `,
                        )
                        .join('')}
                    </ol>
                  `
                  : ''
              }
              <div class="event-actions">
                <a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">
                  View Details
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('') ||
    `
      <div class="empty-state">
        <strong>No events found</strong>
        <p>Event information will appear here once data is available.</p>
      </div>
    `;
}

function renderPeople(items) {
  const grid = directoryRoot.querySelector('[data-directory-grid]');
  const page = directoryRoot.dataset.directoryPage;
  const people = sortByOrder(items);
  const isAlumniPage = page === 'alumni';
  const filterGetter = isAlumniPage
    ? (person) => cleanText(person.fiscalYear || person.year || 'Archive')
    : getExecutiveCategory;
  const groups = uniqueValues(people, filterGetter);
  const presidents = people.filter((person) =>
    getPersonPosition(person).toLowerCase().includes('president'),
  ).length;

  renderSummary([
    { value: people.length, label: isAlumniPage ? 'Alumni Listed' : 'Panel Members' },
    { value: groups.length, label: isAlumniPage ? 'Year Panels' : 'Role Groups' },
    { value: presidents, label: 'Leadership Roles' },
    { value: isAlumniPage ? groups[0] || 'Archive' : '2026', label: isAlumniPage ? 'Latest Panel' : 'Panel Year' },
  ]);

  renderFilters(
    isAlumniPage
      ? buildYearFilters(people, filterGetter)
      : [
          { label: 'All', value: 'all' },
          ...[
            'Core Panel',
            'Secretaries',
            'Assistant Secretaries',
            'Senior Executives',
            'Junior Executives',
          ]
            .filter((group) => groups.includes(group))
            .map((group) => ({ label: group, value: group })),
        ],
    filterCards,
  );

  grid.innerHTML =
    people
      .map((person) => {
        const name = cleanText(person.name);
        const position = getPersonPosition(person);
        const year = isAlumniPage
          ? cleanText(person.fiscalYear || person.year || 'Archive')
          : getExecutiveCategory(person);
        const image = cleanText(person.image);
        const socials = getUsefulSocials(person);

        return `
          <article class="person-card" data-card-filter="${escapeHtml(year)}">
            <figure class="person-photo">
              ${
                image
                  ? `<img src="${escapeHtml(assetUrl(image, ''))}" alt="${escapeHtml(name)}" loading="lazy" />`
                  : `<span class="person-placeholder">${escapeHtml(initialsFor(name))}</span>`
              }
            </figure>
            <div class="person-content">
              <h3>${escapeHtml(name)}</h3>
              ${position ? `<p class="person-role">${escapeHtml(position)}</p>` : ''}
              <p class="person-year">${escapeHtml(isAlumniPage ? year : 'KBEC 2026')}</p>
              ${
                socials.length
                  ? `
                    <div class="person-links" aria-label="${escapeHtml(name)} social links">
                      ${socials
                        .map(
                          ([label, icon, url]) => `
                            <a href="${escapeHtml(url)}" aria-label="${escapeHtml(label)}" target="_blank" rel="noreferrer">
                              <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
                            </a>
                          `,
                        )
                        .join('')}
                    </div>
                  `
                  : ''
              }
            </div>
          </article>
        `;
      })
      .join('') ||
    `
      <div class="empty-state">
        <strong>No members found</strong>
        <p>Member information will appear here once data is available.</p>
      </div>
    `;
}

async function loadOfficialData(config) {
  const endpoints = config.endpoints || [config.endpoint];
  const mergedData = [];
  let lastError;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = toArray(await response.json());

      if (config.mergeSources) {
        mergedData.push(...data);
        continue;
      }

      if (data.length > 0 || endpoint === endpoints.at(-1)) {
        return data;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (config.mergeSources && mergedData.length > 0) {
    return mergeDirectoryItems(mergedData);
  }

  throw lastError || new Error('No data source available.');
}

async function initDirectoryPage() {
  if (!directoryRoot) {
    return;
  }

  const config = pageConfigs[directoryRoot.dataset.directoryPage];

  if (!config) {
    return;
  }

  config.render(config.fallback);
  setStatus('Showing official KBEC content with local fallback support.');

  try {
    const officialData = await loadOfficialData(config);

    if (officialData.length > 0) {
      config.render(officialData);
      setStatus('Updated from official KBEC data source.');
    }
  } catch {
    setStatus('Showing saved local data because the official source is currently unreachable.');
  }
}

initDirectoryPage();
