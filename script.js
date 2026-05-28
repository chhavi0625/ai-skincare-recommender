// script.js — Frontend logic for Lumière Skincare Recommender

// ── Element References ──────────────────────────────────────────────────────
const form          = document.getElementById('skincareForm');
const submitBtn     = document.getElementById('submitBtn');
const formSection   = document.getElementById('formSection');
const resultsSection = document.getElementById('resultsSection');
const restartBtn    = document.getElementById('restartBtn');

// Result display elements
const resultName    = document.getElementById('resultName');
const resultMeta    = document.getElementById('resultMeta');
const chatText      = document.getElementById('chatText');
const morningList   = document.getElementById('morningList');
const nightList     = document.getElementById('nightList');
const productsList  = document.getElementById('productsList');
const tipsList      = document.getElementById('tipsList');

// Error spans
const nameError      = document.getElementById('nameError');
const ageError       = document.getElementById('ageError');
const skinTypeError  = document.getElementById('skinTypeError');
const concernsError  = document.getElementById('concernsError');
const lifestyleError = document.getElementById('lifestyleError');
const formError      = document.getElementById('formError');

// ── Helpers ─────────────────────────────────────────────────────────────────

function clearErrors() {
  [nameError, ageError, skinTypeError, concernsError, lifestyleError, formError].forEach(el => {
    el.textContent = '';
  });
  document.querySelectorAll('.input.error').forEach(el => el.classList.remove('error'));
}

function showError(el, msg) {
  el.textContent = msg;
}

function setLoading(state) {
  submitBtn.classList.toggle('loading', state);
  submitBtn.disabled = state;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateForm(data) {
  let valid = true;

  if (!data.name.trim()) {
    showError(nameError, 'Please enter your name.');
    document.getElementById('name').classList.add('error');
    valid = false;
  }

  const age = parseInt(data.age, 10);
  if (!data.age) {
    showError(ageError, 'Please enter your age.');
    document.getElementById('age').classList.add('error');
    valid = false;
  } else if (isNaN(age) || age < 40) {
    showError(ageError, 'This recommender is for women aged 40 and above.');
    document.getElementById('age').classList.add('error');
    valid = false;
  } else if (age > 100) {
    showError(ageError, 'Please enter a valid age.');
    document.getElementById('age').classList.add('error');
    valid = false;
  }

  if (!data.skinType) {
    showError(skinTypeError, 'Please select your skin type.');
    valid = false;
  }

  if (!data.concerns || data.concerns.length === 0) {
    showError(concernsError, 'Please select at least one skin concern.');
    valid = false;
  }

  if (!data.lifestyle.stress || !data.lifestyle.sleep || !data.lifestyle.diet) {
    showError(lifestyleError, 'Please complete all lifestyle fields.');
    valid = false;
  }

  return valid;
}

// ── Collect Form Data ────────────────────────────────────────────────────────

function collectFormData() {
  const name    = document.getElementById('name').value;
  const age     = document.getElementById('age').value;
  const skinType = document.querySelector('input[name="skinType"]:checked')?.value || '';
  const stress  = document.getElementById('stress').value;
  const sleep   = document.getElementById('sleep').value;
  const diet    = document.getElementById('diet').value;

  const concerns = Array.from(
    document.querySelectorAll('input[name="concerns"]:checked')
  ).map(cb => cb.value);

  return {
    name,
    age,
    skinType,
    concerns,
    lifestyle: { stress, sleep, diet },
  };
}

// ── Render Results ───────────────────────────────────────────────────────────

function renderList(ulEl, items) {
  ulEl.innerHTML = '';
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = item;
    li.style.animationDelay = `${i * 60}ms`;
    ulEl.appendChild(li);
  });
}

function renderProducts(containerEl, products) {
  containerEl.innerHTML = '';
  products.forEach((p, i) => {
    const tag = document.createElement('div');
    tag.className = 'product-tag';
    tag.textContent = p;
    tag.style.animationDelay = `${i * 60}ms`;
    containerEl.appendChild(tag);
  });
}

function renderTips(containerEl, tips) {
  containerEl.innerHTML = '';
  tips.forEach((tip, i) => {
    const div = document.createElement('div');
    div.className = 'tip-item';
    div.textContent = tip;
    div.style.animationDelay = `${i * 80}ms`;
    containerEl.appendChild(div);
  });
}

function displayResults(data, formData) {
  const { recommendation, name, skinType, concerns } = data;

  // Header
  resultName.textContent = `Hello, ${name}`;
  resultMeta.textContent = `${skinType} Skin · ${concerns.join(', ')}`;

  // Chat intro
  chatText.textContent =
    `Based on your ${skinType.toLowerCase()} skin profile and concerns around ${concerns.join(', ').toLowerCase()}, ` +
    `here is your fully personalised morning and night skincare routine, plus expert tips tailored for women 40+.`;

  // Lists
  renderList(morningList, recommendation.morning);
  renderList(nightList, recommendation.night);
  renderProducts(productsList, recommendation.products);
  renderTips(tipsList, recommendation.tips);

  // Switch views
  formSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Form Submit Handler ──────────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const formData = collectFormData();

  if (!validateForm(formData)) return;

  setLoading(true);

  try {
    const response = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showError(formError, result.error || 'Something went wrong. Please try again.');
      return;
    }

    displayResults(result, formData);

  } catch (err) {
    showError(formError, 'Could not connect to the server. Please check your connection.');
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
});

// ── Restart ──────────────────────────────────────────────────────────────────

restartBtn.addEventListener('click', () => {
  // Reset form
  form.reset();
  clearErrors();

  // Un-select all radio/checkbox cards visually
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el => {
    el.checked = false;
  });

  // Switch views
  resultsSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Interactive card deselect-all on re-check ─────────────────────────────────
// Ensure clicking an already-selected radio card triggers proper visual update
document.querySelectorAll('.radio-card input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    // Force style refresh on sibling labels
    document.querySelectorAll('.radio-card input[type="radio"]').forEach(r => {
      r.parentElement.querySelector('.radio-card__inner').style.cssText = '';
    });
  });
});
