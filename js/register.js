const form = document.querySelector('.registration-form');
const statusMessage = document.querySelector('.form-status');
const motivation = document.querySelector('textarea[name="motivation"]');
const charCount = document.querySelector('.char-count');

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

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalidFields = markInvalidFields();

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      setStatus('Please complete the highlighted fields properly.', true);
      return;
    }

    form.reset();
    updateCharacterCount();
    setStatus('Application received. KBEC will contact you soon.');
  });
}
