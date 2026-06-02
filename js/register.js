const form = document.querySelector('.registration-form');
const statusMessage = document.querySelector('.form-status');
const motivation = document.querySelector('textarea[name="motivation"]');
const charCount = document.querySelector('.char-count');
const submitButton = form?.querySelector('button[type="submit"]');

function getApiBaseUrl() {
  if (window.KBEC_API_BASE_URL) {
    return window.KBEC_API_BASE_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
}

const registrationEndpoint =
  window.KBEC_API_URL || `${getApiBaseUrl()}/api/registrations`;

function updateCharacterCount() {
  if (!motivation || !charCount) {
    return;
  }

  const max = Number(motivation.getAttribute('maxlength')) || 420;
  charCount.textContent = `${motivation.value.length} / ${max}`;
}

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
    ? 'Submitting...'
    : 'Submit Application';
}

function getPayload() {
  const formData = new FormData(form);

  return {
    fullName: String(formData.get('fullName') || '').trim(),
    roll: String(formData.get('roll') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    department: String(formData.get('department') || '').trim(),
    session: String(formData.get('session') || '').trim(),
    level: String(formData.get('level') || '').trim(),
    wing: String(formData.get('wing') || '').trim(),
    motivation: String(formData.get('motivation') || '').trim(),
    availability: String(formData.get('availability') || '').trim(),
    agreement: form.elements.agreement.checked,
  };
}

function markInvalidFields() {
  if (!form) {
    return [];
  }

  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  const invalidFields = fields.filter((field) => !field.checkValidity());
  const invalidSet = new Set(invalidFields);

  fields.forEach((field) => {
    field.closest('.field')?.classList.toggle(
      'is-invalid',
      invalidSet.has(field),
    );
  });

  const choiceBlock = form.querySelector('.choice-block');
  const agreement = form.querySelector('.agreement');

  choiceBlock?.classList.toggle(
    'is-invalid',
    invalidFields.some((field) => field.name === 'availability'),
  );
  agreement?.classList.toggle(
    'is-invalid',
    invalidFields.some((field) => field.name === 'agreement'),
  );

  return invalidFields;
}

if (motivation) {
  updateCharacterCount();
  motivation.addEventListener('input', updateCharacterCount);
}

if (form) {
  form.addEventListener('input', (event) => {
    event.target.closest('.field')?.classList.remove('is-invalid');
    event.target.closest('.choice-block')?.classList.remove('is-invalid');
    event.target.closest('.agreement')?.classList.remove('is-invalid');
    setStatus('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const invalidFields = markInvalidFields();

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      setStatus('Please complete the highlighted fields properly.', true);
      return;
    }

    setSubmitting(true);
    setStatus('Submitting your application...');

    try {
      const response = await fetch(registrationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getPayload()),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          errorBody?.detail ||
          errorBody?.title ||
          'Submission failed. Please check the form and try again.';

        setStatus(message, true);
        return;
      }

      const result = await response.json();

      form.reset();
      updateCharacterCount();
      setStatus(result.message || 'Application received. KBEC will contact you soon.');
    } catch (error) {
      setStatus(
        'Could not reach the registration server. Please start the ASP.NET API and try again.',
        true,
      );
    } finally {
      setSubmitting(false);
    }
  });
}
