const apiBase = window.KBEC_API_BASE_URL || 'http://localhost:5000';
const adminName = document.querySelector('.admin-name');
const logoutButton = document.querySelector('.logout-button');
const refreshButton = document.querySelector('.refresh-button');
const tableBody = document.querySelector('.registrations-table tbody');
const tableStatus = document.querySelector('.table-status');
const searchInput = document.querySelector('.search-input');
const wingFilter = document.querySelector('.wing-filter');
const levelFilter = document.querySelector('.level-filter');
const detailDrawer = document.querySelector('.detail-drawer');
const drawerContent = document.querySelector('.drawer-content');
const drawerTitle = document.querySelector('#detail-title');
const drawerClose = document.querySelector('.drawer-close');

let registrations = [];

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

function renderTable() {
  if (!tableBody) {
    return;
  }

  const visibleRegistrations = getFilteredRegistrations();
  tableBody.replaceChildren();

  if (visibleRegistrations.length === 0) {
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
    return;
  }

  visibleRegistrations.forEach((registration) => {
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

  setTableStatus(
    `Showing ${visibleRegistrations.length} of ${registrations.length} registration${registrations.length === 1 ? '' : 's'}.`,
  );
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

    if (adminName) {
      adminName.textContent = session.displayName || session.username;
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

    setStat('total', dashboard.totalRegistrations || 0);
    setStat('today', dashboard.todayRegistrations || 0);
    setStat('week', dashboard.weekRegistrations || 0);
    syncFilters();
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

searchInput?.addEventListener('input', renderTable);
wingFilter?.addEventListener('change', renderTable);
levelFilter?.addEventListener('change', renderTable);
refreshButton?.addEventListener('click', loadDashboard);
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
  if (await requireSession()) {
    await loadDashboard();
  }
})();
