function getApiBaseUrl() {
  if (window.KBEC_API_BASE_URL) {
    return window.KBEC_API_BASE_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
}

const apiBase = getApiBaseUrl();
const loginForm = document.querySelector('.admin-login-form');
const statusMessage = document.querySelector('.form-status');
const submitButton = loginForm?.querySelector('button[type="submit"]');

function setStatus(message, isError = false) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', isError);
}

function setSubmitting(isSubmitting) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.querySelector('span').textContent = isSubmitting
    ? 'Checking...'
    : 'Login';
}

function markInvalidFields() {
  if (!loginForm) {
    return [];
  }

  const fields = Array.from(loginForm.querySelectorAll('input'));
  const invalidFields = fields.filter((field) => !field.checkValidity());
  const invalidSet = new Set(invalidFields);

  fields.forEach((field) => {
    field.closest('.field')?.classList.toggle(
      'is-invalid',
      invalidSet.has(field),
    );
  });

  return invalidFields;
}

async function redirectIfLoggedIn() {
  try {
    const response = await fetch(`${apiBase}/api/admin/me`, {
      credentials: 'include',
    });

    if (response.ok) {
      window.location.href = 'admin-dashboard.html';
    }
  } catch {
    // The status message on submit gives a clearer error when the API is down.
  }
}

redirectIfLoggedIn();

if (loginForm) {
  loginForm.addEventListener('input', (event) => {
    event.target.closest('.field')?.classList.remove('is-invalid');
    setStatus('');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const invalidFields = markInvalidFields();

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      setStatus('Please enter both username and password.', true);
      return;
    }

    const formData = new FormData(loginForm);
    const payload = {
      username: String(formData.get('username') || '').trim(),
      password: String(formData.get('password') || ''),
    };

    setSubmitting(true);
    setStatus('Signing in...');

    try {
      const response = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setStatus('Invalid admin username or password.', true);
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        setStatus(
          errorBody?.detail || errorBody?.title || 'Login failed. Please try again.',
          true,
        );
        return;
      }

      window.location.href = 'admin-dashboard.html';
    } catch {
      setStatus('Could not reach the ASP.NET API. Start the backend first.', true);
    } finally {
      setSubmitting(false);
    }
  });
}
