function getApiBaseUrl() {
  if (window.KBEC_API_BASE_URL) {
    return window.KBEC_API_BASE_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
}

const apiBase = getApiBaseUrl();
const pageTitle = document.querySelector('[data-page-title]');
const navButtons = document.querySelectorAll('[data-admin-view]');
const panels = document.querySelectorAll('[data-admin-panel]');
const adminName = document.querySelector('.admin-name');
const settingsAdminName = document.querySelector('.settings-admin-name');
const apiBaseSetting = document.querySelector('[data-setting="apiBase"]');
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

let registrations = [];
let currentPage = 1;

const viewLabels = {
  dashboard: 'Dashboard',
  registrations: 'Registrations',
  settings: 'Settings',
};

if (apiBaseSetting) {
  apiBaseSetting.textContent = apiBase;
}

function setTableStatus(message, isError = false) {
  if (!tableStatus) {
    return;
  }

  tableStatus.textContent = message;
  tableStatus.classList.toggle('is-error', isError);
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
    cell.colSpan = 7;
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
    const nameBlock = document.createElement('span');
    const name = document.createElement('strong');
    const email = document.createElement('span');

    nameBlock.className = 'member-name';
    name.textContent = registration.fullName;
    email.textContent = registration.email;
    nameBlock.append(name, email);
    nameCell.append(nameBlock);

    const wingCell = document.createElement('td');
    wingCell.append(createTag(registration.preferredWing));

    const actionCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.className = 'view-button';
    viewButton.type = 'button';
    viewButton.textContent = 'View';
    viewButton.addEventListener('click', () => openDrawer(registration));
    actionCell.append(viewButton);

    row.append(
      nameCell,
      createCell(registration.roll),
      createCell(registration.department),
      createCell(registration.currentLevel),
      wingCell,
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

function openDrawer(registration) {
  if (!detailDrawer || !drawerContent || !drawerTitle) {
    return;
  }

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

function closeDrawer() {
  if (!detailDrawer) {
    return;
  }

  detailDrawer.classList.remove('is-open');
  detailDrawer.setAttribute('aria-hidden', 'true');
}

function switchView(viewName) {
  const view = viewLabels[viewName] ? viewName : 'dashboard';

  panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.adminPanel === view);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.adminView === view);
  });

  if (pageTitle) {
    pageTitle.textContent = viewLabels[view];
  }

  window.location.hash = view;
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

    const session = await response.json();
    const label = session.displayName || session.username;

    if (adminName) {
      adminName.textContent = label;
    }

    if (settingsAdminName) {
      settingsAdminName.textContent = label;
    }

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
  button.addEventListener('click', loadDashboard);
});
logoutButton?.addEventListener('click', logout);
drawerClose?.addEventListener('click', closeDrawer);

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
    await loadDashboard();
  }
})();
