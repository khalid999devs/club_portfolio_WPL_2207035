function getApiBaseUrl() {
  if (window.KBEC_API_BASE_URL) {
    return window.KBEC_API_BASE_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
}

const apiBase = getApiBaseUrl();
const navButtons = document.querySelectorAll('[data-admin-view]');
const panels = document.querySelectorAll('[data-admin-panel]');
const logoutButton = document.querySelector('.logout-button');
const refreshButtons = document.querySelectorAll('.refresh-button');
const tableBody = document.querySelector('.registrations-table tbody');
const tableStatus = document.querySelector('.table-status');
const searchInput = document.querySelector('.search-input');
const wingFilter = document.querySelector('.wing-filter');
const levelFilter = document.querySelector('.level-filter');
const pageSizeSelect = document.querySelector('.page-size');
const paginationInfo = document.querySelector('.pagination-info');
const previousButton = document.querySelector('.pagination-prev');
const nextButton = document.querySelector('.pagination-next');
const recentList = document.querySelector('.recent-list');
const wingBreakdown = document.querySelector('.wing-breakdown');
const detailDrawer = document.querySelector('.detail-drawer');
const drawerContent = document.querySelector('.drawer-content');
const drawerTitle = document.querySelector('#detail-title');
const drawerClose = document.querySelector('.drawer-close');
const eventForm = document.querySelector('.event-form');
const eventStatus = document.querySelector('.event-status');
const eventList = document.querySelector('.event-list');
const eventCount = document.querySelector('[data-event-count]');
const exportCsvButton = document.querySelector('.export-csv-button');
const passwordForm = document.querySelector('.password-form');
const passwordStatus = document.querySelector('.password-status');
const adminUserForm = document.querySelector('.admin-user-form');
const adminUserStatus = document.querySelector('.admin-user-status');
const adminUsersList = document.querySelector('.admin-users-list');
const adminCount = document.querySelector('[data-admin-count]');

let registrations = [];
let events = [];
let adminUsers = [];
let currentPage = 1;
let isAuthenticated = false;
let eventsLoaded = false;
let settingsLoaded = false;

const adminViews = new Set(['dashboard', 'registrations', 'events', 'settings']);

const registrationOptions = {
  departments: [
    'Architecture',
    'Biomedical Engineering',
    'Building Engineering and Construction Management',
    'Chemical Engineering',
    'Civil Engineering',
    'Computer Science and Engineering',
    'Electrical and Electronic Engineering',
    'Electronics and Communication Engineering',
    'Energy Science and Engineering',
    'Industrial Engineering and Management',
    'Leather Engineering',
    'Materials Science and Engineering',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Textile Engineering',
    'Urban and Regional Planning',
  ],
  levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Postgraduate'],
  wings: [
    'Business Case and Competitions',
    'Event Operations',
    'Marketing and Sponsorship',
    'Content and Creative',
    'Finance and Documentation',
    'Tech and Web',
  ],
  availability: [
    { value: 'weekly', label: 'Weekly contribution' },
    { value: 'events', label: 'Event-based contribution' },
    { value: 'flexible', label: 'Flexible schedule' },
  ],
};

function setTableStatus(message, isError = false) {
  if (!tableStatus) {
    return;
  }

  tableStatus.textContent = message;
  tableStatus.classList.toggle('is-error', isError);
}

function setEventStatus(message, isError = false) {
  if (!eventStatus) {
    return;
  }

  eventStatus.textContent = message;
  eventStatus.classList.toggle('is-error', isError);
}

function setFormStatus(target, message, isError = false) {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.classList.toggle('is-error', isError);
}

function setStat(name, value) {
  const stat = document.querySelector(`[data-stat="${name}"]`);

  if (stat) {
    stat.textContent = String(value);
  }
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}

function formatShortDate(dateValue) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(dateValue));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function createMetaBlock(primaryText, secondaryLines = []) {
  const block = document.createElement('span');
  const primary = document.createElement('strong');

  block.className = 'table-meta-block';
  primary.textContent = primaryText || '-';
  block.append(primary);

  secondaryLines.filter(Boolean).forEach((line) => {
    const secondary = document.createElement('span');
    secondary.textContent = line;
    block.append(secondary);
  });

  return block;
}

function createTag(text) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = text;
  return tag;
}

function getWingCounts() {
  return registrations.reduce((counts, registration) => {
    const wing = registration.preferredWing || 'Not selected';
    counts.set(wing, (counts.get(wing) || 0) + 1);
    return counts;
  }, new Map());
}

function getTopWing() {
  return [...getWingCounts().entries()]
    .sort((first, second) => second[1] - first[1])
    .at(0)?.[0] || '-';
}

function buildFilterOptions(select, values, label) {
  if (!select) {
    return;
  }

  const selectedValue = select.value;
  select.replaceChildren();

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = label;
  select.append(defaultOption);

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });

  select.value = values.includes(selectedValue) ? selectedValue : '';
}

function syncFilters() {
  const wings = [...new Set(registrations.map((item) => item.preferredWing))]
    .filter(Boolean)
    .sort();
  const levels = [...new Set(registrations.map((item) => item.currentLevel))]
    .filter(Boolean)
    .sort();

  buildFilterOptions(wingFilter, wings, 'All wings');
  buildFilterOptions(levelFilter, levels, 'All levels');
}

function getFilteredRegistrations() {
  const query = normalize(searchInput?.value);
  const selectedWing = wingFilter?.value || '';
  const selectedLevel = levelFilter?.value || '';

  return registrations.filter((registration) => {
    const matchesSearch =
      !query ||
      [
        registration.fullName,
        registration.roll,
        registration.email,
        registration.phone,
        registration.department,
        registration.academicSession,
        registration.currentLevel,
        registration.preferredWing,
      ]
        .map(normalize)
        .some((value) => value.includes(query));

    const matchesWing =
      !selectedWing || registration.preferredWing === selectedWing;
    const matchesLevel =
      !selectedLevel || registration.currentLevel === selectedLevel;

    return matchesSearch && matchesWing && matchesLevel;
  });
}

function getPageSize() {
  return Number(pageSizeSelect?.value) || 8;
}

function updatePagination(filteredRegistrations) {
  const pageSize = getPageSize();
  const pageCount = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));

  currentPage = Math.min(currentPage, pageCount);

  if (paginationInfo) {
    paginationInfo.textContent = `Page ${currentPage} of ${pageCount}`;
  }

  if (previousButton) {
    previousButton.disabled = currentPage <= 1;
  }

  if (nextButton) {
    nextButton.disabled = currentPage >= pageCount;
  }
}

function renderTable() {
  if (!tableBody) {
    return;
  }

  const filteredRegistrations = getFilteredRegistrations();
  const pageSize = getPageSize();
  const pageCount = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));

  currentPage = Math.min(currentPage, pageCount);

  const startIndex = (currentPage - 1) * pageSize;
  const pageRegistrations = filteredRegistrations.slice(
    startIndex,
    startIndex + pageSize,
  );

  tableBody.replaceChildren();

  if (pageRegistrations.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.className = 'empty-state';
    cell.colSpan = 5;
    cell.textContent = registrations.length === 0
      ? 'No registration submissions yet.'
      : 'No registrations matched the current filters.';
    row.append(cell);
    tableBody.append(row);
    setTableStatus('No matching registrations.');
    updatePagination(filteredRegistrations);
    return;
  }

  pageRegistrations.forEach((registration) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.append(createMetaBlock(registration.fullName, [`Roll ${registration.roll}`]));

    const academicCell = document.createElement('td');
    academicCell.append(
      createMetaBlock(registration.department, [
        `${registration.currentLevel} · ${registration.academicSession}`,
      ]),
      createTag(registration.preferredWing),
    );

    const contactCell = document.createElement('td');
    contactCell.append(createMetaBlock(registration.email, [registration.phone]));

    const actionCell = document.createElement('td');
    const actionGroup = document.createElement('div');
    const viewButton = document.createElement('button');
    const editButton = document.createElement('button');

    actionGroup.className = 'icon-actions';
    viewButton.className = 'icon-button';
    viewButton.type = 'button';
    viewButton.setAttribute('aria-label', `View ${registration.fullName}`);
    viewButton.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    viewButton.addEventListener('click', () => openDrawer(registration));

    editButton.className = 'icon-button';
    editButton.type = 'button';
    editButton.setAttribute('aria-label', `Edit ${registration.fullName}`);
    editButton.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>';
    editButton.addEventListener('click', () => openEditDrawer(registration));

    actionGroup.append(viewButton, editButton);
    actionCell.append(actionGroup);

    row.append(
      nameCell,
      academicCell,
      contactCell,
      createCell(formatDate(registration.submittedAtUtc)),
      actionCell,
    );
    tableBody.append(row);
  });

  const endIndex = Math.min(startIndex + pageRegistrations.length, filteredRegistrations.length);
  setTableStatus(
    `Showing ${startIndex + 1}-${endIndex} of ${filteredRegistrations.length} registration${filteredRegistrations.length === 1 ? '' : 's'}.`,
  );
  updatePagination(filteredRegistrations);
}

function renderRecentList() {
  if (!recentList) {
    return;
  }

  recentList.replaceChildren();

  if (registrations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = 'No applications yet.';
    recentList.append(empty);
    return;
  }

  registrations.slice(0, 5).forEach((registration) => {
    const item = document.createElement('button');
    const avatar = document.createElement('span');
    const text = document.createElement('span');
    const name = document.createElement('strong');
    const meta = document.createElement('small');
    const date = document.createElement('time');

    item.className = 'recent-item';
    item.type = 'button';
    avatar.className = 'recent-avatar';
    avatar.textContent = registration.fullName?.charAt(0) || 'K';
    name.textContent = registration.fullName;
    meta.textContent = `${registration.roll} · ${registration.currentLevel}`;
    date.textContent = formatShortDate(registration.submittedAtUtc);

    text.append(name, meta);
    item.append(avatar, text, date);
    item.addEventListener('click', () => openDrawer(registration));
    recentList.append(item);
  });
}

function renderWingBreakdown() {
  if (!wingBreakdown) {
    return;
  }

  wingBreakdown.replaceChildren();

  const counts = [...getWingCounts().entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5);
  const maxCount = counts.at(0)?.[1] || 0;

  if (counts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = 'Wing data will appear after submissions.';
    wingBreakdown.append(empty);
    return;
  }

  counts.forEach(([wing, count]) => {
    const row = document.createElement('div');
    const top = document.createElement('div');
    const label = document.createElement('span');
    const value = document.createElement('strong');
    const track = document.createElement('span');
    const bar = document.createElement('span');

    row.className = 'wing-row';
    top.className = 'wing-row-top';
    label.textContent = wing;
    value.textContent = String(count);
    track.className = 'wing-track';
    bar.className = 'wing-bar';
    bar.style.width = `${Math.max(8, (count / maxCount) * 100)}%`;

    top.append(label, value);
    track.append(bar);
    row.append(top, track);
    wingBreakdown.append(row);
  });
}

function renderDashboardCards() {
  setStat('topWing', getTopWing());
  renderRecentList();
  renderWingBreakdown();
}

function getEventDateLabel(event) {
  return event.date || event.eventDate || 'Date not set';
}

function getEventSpeakerCount(event) {
  return Array.isArray(event.speakers) ? event.speakers.length : 0;
}

function getEventTimelineCount(event) {
  return Array.isArray(event.timeline) ? event.timeline.length : 0;
}

function renderEventList() {
  if (!eventList) {
    return;
  }

  eventList.replaceChildren();

  if (eventCount) {
    eventCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
  }

  if (events.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = 'No events have been posted yet.';
    eventList.append(empty);
    return;
  }

  events.forEach((event) => {
    const item = document.createElement('article');
    const top = document.createElement('div');
    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    const meta = document.createElement('p');
    const status = document.createElement('span');
    const details = document.createElement('div');

    item.className = 'admin-event-card';
    top.className = 'admin-event-top';
    status.className = event.isPublished ? 'status-pill is-live' : 'status-pill';
    details.className = 'admin-event-details';

    title.textContent = event.name;
    meta.textContent = [getEventDateLabel(event), event.venue]
      .filter(Boolean)
      .join(' · ');
    status.textContent = event.isPublished ? 'Published' : 'Draft';

    titleWrap.append(title, meta);
    top.append(titleWrap, status);

    [
      ['Speakers', getEventSpeakerCount(event)],
      ['Timeline', getEventTimelineCount(event)],
      ['Order', event.order ?? event.displayOrder ?? 0],
    ].forEach(([label, value]) => {
      const detail = document.createElement('span');
      detail.innerHTML = `<strong>${value}</strong>${label}`;
      details.append(detail);
    });

    item.append(top, details);
    eventList.append(item);
  });
}

function formatOptionalDate(dateValue) {
  return dateValue ? formatDate(dateValue) : 'Never';
}

function renderAdminUsers() {
  if (!adminUsersList) {
    return;
  }

  adminUsersList.replaceChildren();

  if (adminCount) {
    adminCount.textContent = `${adminUsers.length} admin${adminUsers.length === 1 ? '' : 's'}`;
  }

  if (adminUsers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = 'No admin users found.';
    adminUsersList.append(empty);
    return;
  }

  adminUsers.forEach((admin) => {
    const item = document.createElement('article');
    const avatar = document.createElement('span');
    const body = document.createElement('div');
    const name = document.createElement('strong');
    const username = document.createElement('span');
    const meta = document.createElement('small');
    const status = document.createElement('span');

    item.className = 'admin-user-item';
    avatar.className = 'admin-user-avatar';
    body.className = 'admin-user-body';
    status.className = admin.isActive ? 'status-pill is-live' : 'status-pill';

    avatar.textContent = admin.displayName?.charAt(0) || 'A';
    name.textContent = admin.displayName || admin.username;
    username.textContent = `@${admin.username}`;
    meta.textContent = `Created ${formatShortDate(admin.createdAtUtc)} · Last login ${formatOptionalDate(admin.lastLoginAtUtc)}`;
    status.textContent = admin.isActive ? 'Active' : 'Disabled';

    body.append(name, username, meta);
    item.append(avatar, body, status);
    adminUsersList.append(item);
  });
}

async function loadAdminUsers() {
  if (!adminUsersList) {
    return;
  }

  adminUsersList.replaceChildren();

  const loading = document.createElement('p');
  loading.className = 'panel-empty';
  loading.textContent = 'Loading admin users...';
  adminUsersList.append(loading);

  try {
    const response = await fetch(`${apiBase}/api/admin/users`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      adminUsersList.replaceChildren();
      const error = document.createElement('p');
      error.className = 'panel-empty is-error';
      error.textContent = response.status === 404
        ? 'Admin users endpoint was not found. Restart the ASP.NET backend.'
        : errorBody?.detail || errorBody?.title || 'Could not load admin users right now.';
      adminUsersList.append(error);
      return;
    }

    const payload = await response.json();
    adminUsers = payload.admins || [];
    settingsLoaded = true;
    renderAdminUsers();
  } catch {
    adminUsersList.replaceChildren();
    const error = document.createElement('p');
    error.className = 'panel-empty is-error';
    error.textContent = 'Could not reach the ASP.NET API. Start the backend first.';
    adminUsersList.append(error);
  }
}

function parseStructuredLines(value, mapper) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => mapper(line.split('|').map((part) => part.trim()), index))
    .filter(Boolean);
}

function parseSpeakers(value) {
  return parseStructuredLines(value, ([name, title, organization], index) => {
    if (!name) {
      return null;
    }

    return {
      name,
      title: title || null,
      organization: organization || null,
      imageUrl: null,
      displayOrder: index,
    };
  });
}

function parseTimeline(value) {
  return parseStructuredLines(value, ([label, detail, timelineDate], index) => {
    if (!label) {
      return null;
    }

    return {
      label,
      detail: detail || null,
      timelineDate: timelineDate || null,
      displayOrder: index,
    };
  });
}

function getEventPayload(form) {
  const formData = new FormData(form);

  return {
    name: String(formData.get('name') || '').trim(),
    tagline: String(formData.get('tagline') || '').trim() || null,
    eventDate: String(formData.get('eventDate') || '').trim() || null,
    venue: String(formData.get('venue') || '').trim() || null,
    registrationDeadline:
      String(formData.get('registrationDeadline') || '').trim() || null,
    imageUrl: String(formData.get('imageUrl') || '').trim() || null,
    externalLink: String(formData.get('externalLink') || '').trim() || null,
    description: String(formData.get('description') || '').trim(),
    displayOrder: Number(formData.get('displayOrder')) || 0,
    isUpcoming: formData.has('isUpcoming'),
    isPublished: formData.has('isPublished'),
    speakers: parseSpeakers(formData.get('speakers')),
    timeline: parseTimeline(formData.get('timeline')),
  };
}

async function loadEvents() {
  if (!eventList) {
    return;
  }

  setEventStatus('Loading events...');

  try {
    const response = await fetch(`${apiBase}/api/admin/events`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setEventStatus(
        errorBody?.detail || errorBody?.title || 'Could not load events right now.',
        true,
      );
      return;
    }

    const payload = await response.json();
    events = payload.events || [];
    eventsLoaded = true;
    renderEventList();
    setEventStatus('Events are up to date.');
  } catch {
    setEventStatus('Could not reach the ASP.NET API. Start the backend first.', true);
  }
}

async function submitEvent(event) {
  event.preventDefault();

  if (!eventForm) {
    return;
  }

  const submitButton = eventForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }
  setEventStatus('Saving event...');

  try {
    const response = await fetch(`${apiBase}/api/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(getEventPayload(eventForm)),
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setEventStatus(
        errorBody?.detail ||
          errorBody?.title ||
          'Check the event form and try again.',
        true,
      );
      return;
    }

    eventForm.reset();
    eventForm.elements.isUpcoming.checked = true;
    eventForm.elements.isPublished.checked = true;
    await loadEvents();
    setEventStatus('Event posted successfully.');
  } catch {
    setEventStatus('Could not reach the ASP.NET API. Start the backend first.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function createDetail(label, value, isParagraph = false) {
  const detail = document.createElement('div');
  const detailLabel = document.createElement('span');
  const detailValue = document.createElement(isParagraph ? 'p' : 'strong');

  detail.className = 'detail-row';
  detailLabel.textContent = label;
  detailValue.textContent = value || 'Not provided';
  detail.append(detailLabel, detailValue);

  return detail;
}

function createEditField(label, name, value, options = {}) {
  const field = document.createElement('label');
  const labelText = document.createElement('span');
  const control = options.choices
    ? document.createElement('select')
    : options.multiline
      ? document.createElement('textarea')
      : document.createElement('input');

  field.className = 'field';
  labelText.textContent = label;
  control.name = name;
  control.required = true;

  if (options.choices) {
    const values = options.choices.map((choice) =>
      typeof choice === 'string' ? choice : choice.value,
    );

    options.choices.forEach((choice) => {
      const option = document.createElement('option');

      option.value = typeof choice === 'string' ? choice : choice.value;
      option.textContent = typeof choice === 'string' ? choice : choice.label;
      control.append(option);
    });

    if (value && !values.includes(value)) {
      const currentOption = document.createElement('option');

      currentOption.value = value;
      currentOption.textContent = value;
      control.append(currentOption);
    }
  } else if (options.multiline) {
    control.rows = options.rows || 4;
  } else {
    control.type = options.type || 'text';
  }

  control.value = value || '';
  field.append(labelText, control);
  return field;
}

function getRegistrationPayload(form) {
  const formData = new FormData(form);

  return {
    fullName: String(formData.get('fullName') || '').trim(),
    roll: String(formData.get('roll') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    department: String(formData.get('department') || '').trim(),
    academicSession: String(formData.get('academicSession') || '').trim(),
    currentLevel: String(formData.get('currentLevel') || '').trim(),
    preferredWing: String(formData.get('preferredWing') || '').trim(),
    motivation: String(formData.get('motivation') || '').trim(),
    availability: String(formData.get('availability') || '').trim(),
  };
}

async function saveRegistration(registration, form, status) {
  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  setFormStatus(status, 'Saving changes...');

  try {
    const response = await fetch(`${apiBase}/api/admin/registrations/${registration.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(getRegistrationPayload(form)),
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setFormStatus(
        status,
        errorBody?.detail || errorBody?.title || 'Could not update this registration.',
        true,
      );
      return;
    }

    const updated = await response.json();
    registrations = registrations.map((item) =>
      item.id === updated.id ? updated : item,
    );
    syncFilters();
    renderDashboardCards();
    renderTable();
    setFormStatus(status, 'Registration updated.');
    openDrawer(updated);
  } catch {
    setFormStatus(status, 'Could not reach the ASP.NET API. Start the backend first.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function openDrawer(registration) {
  if (!detailDrawer || !drawerContent || !drawerTitle) {
    return;
  }

  detailDrawer.classList.remove('is-editing');
  drawerTitle.textContent = registration.fullName;
  drawerContent.replaceChildren(
    createDetail('Roll', registration.roll),
    createDetail('Email', registration.email),
    createDetail('Phone', registration.phone),
    createDetail('Department', registration.department),
    createDetail('Academic Session', registration.academicSession),
    createDetail('Current Level', registration.currentLevel),
    createDetail('Preferred Wing', registration.preferredWing),
    createDetail('Availability', registration.availability),
    createDetail('Submitted', formatDate(registration.submittedAtUtc)),
    createDetail('Motivation', registration.motivation, true),
  );

  detailDrawer.classList.add('is-open');
  detailDrawer.setAttribute('aria-hidden', 'false');
  drawerClose?.focus();
}

function openEditDrawer(registration) {
  if (!detailDrawer || !drawerContent || !drawerTitle) {
    return;
  }

  const form = document.createElement('form');
  const intro = document.createElement('div');
  const introName = document.createElement('strong');
  const introMeta = document.createElement('span');
  const grid = document.createElement('div');
  const footer = document.createElement('div');
  const status = document.createElement('p');
  const cancelButton = document.createElement('button');
  const saveButton = document.createElement('button');

  detailDrawer.classList.add('is-editing');
  drawerTitle.textContent = 'Edit Application';
  form.className = 'drawer-form';
  intro.className = 'edit-applicant-summary';
  grid.className = 'drawer-form-grid';
  footer.className = 'drawer-actions';
  status.className = 'form-status drawer-status';
  status.setAttribute('aria-live', 'polite');
  introName.textContent = registration.fullName;
  introMeta.textContent = `${registration.roll} · ${registration.department}`;
  intro.append(introName, introMeta);

  grid.append(
    createEditField('Full Name', 'fullName', registration.fullName),
    createEditField('Roll', 'roll', registration.roll),
    createEditField('Email', 'email', registration.email, { type: 'email' }),
    createEditField('Phone', 'phone', registration.phone),
    createEditField('Department', 'department', registration.department, {
      choices: registrationOptions.departments,
    }),
    createEditField('Academic Session', 'academicSession', registration.academicSession),
    createEditField('Current Level', 'currentLevel', registration.currentLevel, {
      choices: registrationOptions.levels,
    }),
    createEditField('Preferred Wing', 'preferredWing', registration.preferredWing, {
      choices: registrationOptions.wings,
    }),
    createEditField('Availability', 'availability', registration.availability, {
      choices: registrationOptions.availability,
    }),
    createEditField('Motivation', 'motivation', registration.motivation, {
      multiline: true,
      rows: 5,
    }),
  );

  cancelButton.className = 'secondary-button';
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => openDrawer(registration));

  saveButton.className = 'primary-button';
  saveButton.type = 'submit';
  saveButton.innerHTML = '<span>Save Changes</span><i class="fa-solid fa-check" aria-hidden="true"></i>';

  footer.append(status, cancelButton, saveButton);
  form.append(intro, grid, footer);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveRegistration(registration, form, status);
  });

  drawerContent.replaceChildren(form);
  detailDrawer.classList.add('is-open');
  detailDrawer.setAttribute('aria-hidden', 'false');
  drawerClose?.focus();
}

function closeDrawer() {
  if (!detailDrawer) {
    return;
  }

  detailDrawer.classList.remove('is-open');
  detailDrawer.classList.remove('is-editing');
  detailDrawer.setAttribute('aria-hidden', 'true');
}

function switchView(viewName) {
  const view = adminViews.has(viewName) ? viewName : 'dashboard';

  panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.adminPanel === view);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.adminView === view);
  });

  window.location.hash = view;

  if (isAuthenticated && view === 'events' && !eventsLoaded) {
    loadEvents();
  }

  if (isAuthenticated && view === 'settings' && !settingsLoaded) {
    loadAdminUsers();
  }
}

async function requireSession() {
  try {
    const response = await fetch(`${apiBase}/api/admin/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      window.location.href = 'admin-login.html';
      return false;
    }

    await response.json();

    return true;
  } catch {
    setTableStatus('Could not reach the ASP.NET API. Start the backend first.', true);
    return false;
  }
}

async function loadDashboard() {
  setTableStatus('Loading registrations...');

  try {
    const response = await fetch(`${apiBase}/api/admin/registrations`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setTableStatus(
        errorBody?.detail ||
          errorBody?.title ||
          'Could not load registrations right now.',
        true,
      );
      return;
    }

    const dashboard = await response.json();
    registrations = dashboard.registrations || [];
    currentPage = 1;

    setStat('total', dashboard.totalRegistrations || 0);
    setStat('today', dashboard.todayRegistrations || 0);
    setStat('week', dashboard.weekRegistrations || 0);
    syncFilters();
    renderDashboardCards();
    renderTable();
  } catch {
    setTableStatus('Could not reach the ASP.NET API. Start the backend first.', true);
  }
}

async function logout() {
  try {
    await fetch(`${apiBase}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    window.location.href = 'admin-login.html';
  }
}

function escapeCsv(value) {
  const text = String(value ?? '');

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function exportRegistrationsCsv() {
  const rows = getFilteredRegistrations();
  const headers = [
    'Full Name',
    'Roll',
    'Email',
    'Phone',
    'Department',
    'Academic Session',
    'Current Level',
    'Preferred Wing',
    'Availability',
    'Submitted At',
  ];

  const csvRows = [
    headers,
    ...rows.map((registration) => [
      registration.fullName,
      registration.roll,
      registration.email,
      registration.phone,
      registration.department,
      registration.academicSession,
      registration.currentLevel,
      registration.preferredWing,
      registration.availability,
      formatDate(registration.submittedAtUtc),
    ]),
  ];

  const blob = new Blob(
    [csvRows.map((row) => row.map(escapeCsv).join(',')).join('\n')],
    { type: 'text/csv;charset=utf-8' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `kbec-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function submitPasswordChange(event) {
  event.preventDefault();

  if (!passwordForm) {
    return;
  }

  const formData = new FormData(passwordForm);
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (newPassword !== confirmPassword) {
    setFormStatus(passwordStatus, 'New password and confirmation do not match.', true);
    return;
  }

  const submitButton = passwordForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  setFormStatus(passwordStatus, 'Updating password...');

  try {
    const response = await fetch(`${apiBase}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        currentPassword: String(formData.get('currentPassword') || ''),
        newPassword,
      }),
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setFormStatus(
        passwordStatus,
        errorBody?.detail || errorBody?.title || 'Could not update password.',
        true,
      );
      return;
    }

    passwordForm.reset();
    setFormStatus(passwordStatus, 'Password updated.');
  } catch {
    setFormStatus(passwordStatus, 'Could not reach the ASP.NET API. Start the backend first.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

async function submitAdminUser(event) {
  event.preventDefault();

  if (!adminUserForm) {
    return;
  }

  const formData = new FormData(adminUserForm);
  const submitButton = adminUserForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  setFormStatus(adminUserStatus, 'Creating admin user...');

  try {
    const response = await fetch(`${apiBase}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        displayName: String(formData.get('displayName') || '').trim(),
        username: String(formData.get('username') || '').trim(),
        password: String(formData.get('password') || ''),
      }),
    });

    if (response.status === 401) {
      window.location.href = 'admin-login.html';
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      setFormStatus(
        adminUserStatus,
        errorBody?.message ||
          errorBody?.detail ||
          errorBody?.title ||
          'Could not create admin user.',
        true,
      );
      return;
    }

    adminUserForm.reset();
    await loadAdminUsers();
    setFormStatus(adminUserStatus, 'Admin user created.');
  } catch {
    setFormStatus(adminUserStatus, 'Could not reach the ASP.NET API. Start the backend first.', true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switchView(button.dataset.adminView);
  });
});

searchInput?.addEventListener('input', () => {
  currentPage = 1;
  renderTable();
});
wingFilter?.addEventListener('change', () => {
  currentPage = 1;
  renderTable();
});
levelFilter?.addEventListener('change', () => {
  currentPage = 1;
  renderTable();
});
pageSizeSelect?.addEventListener('change', () => {
  currentPage = 1;
  renderTable();
});
previousButton?.addEventListener('click', () => {
  currentPage = Math.max(1, currentPage - 1);
  renderTable();
});
nextButton?.addEventListener('click', () => {
  currentPage += 1;
  renderTable();
});
refreshButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.refreshTarget || window.location.hash.replace('#', '');

    if (target === 'events') {
      loadEvents();
      return;
    }

    loadDashboard();
  });
});
logoutButton?.addEventListener('click', logout);
drawerClose?.addEventListener('click', closeDrawer);
eventForm?.addEventListener('submit', submitEvent);
exportCsvButton?.addEventListener('click', exportRegistrationsCsv);
passwordForm?.addEventListener('submit', submitPasswordChange);
adminUserForm?.addEventListener('submit', submitAdminUser);

detailDrawer?.addEventListener('click', (event) => {
  if (event.target === detailDrawer) {
    closeDrawer();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDrawer();
  }
});

(async () => {
  const initialView = window.location.hash.replace('#', '') || 'dashboard';

  switchView(initialView);

  if (await requireSession()) {
    isAuthenticated = true;
    await loadDashboard();

    if (initialView === 'events') {
      await loadEvents();
    }

    if (initialView === 'settings') {
      await loadAdminUsers();
    }
  }
})();
