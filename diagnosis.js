const form = document.getElementById('quiz');
const error = document.getElementById('error');
const assessment = document.getElementById('assessment');
const result = document.getElementById('result');
const fallback = document.getElementById('scoring-fallback');
const get = (name) => document.querySelector(`input[name="${name}"]:checked`);
const requiredFields = ['units', 'manual', 'vendors', 'handoffs', 'scale'];
const questionCards = [...document.querySelectorAll('.quiz-card[data-question]')];
const answeredQuestions = new Set();
const viewedQuestions = new Set();

const track = (name, properties = {}) => {
  if (typeof window.trackBatesEvent === 'function') window.trackBatesEvent(name, properties);
};

const markQuestionViewed = (number) => {
  if (number && !viewedQuestions.has(number)) {
    viewedQuestions.add(number);
    track(`question_${number}_viewed`, {question_number: number});
  }
};

questionCards.forEach((card) => {
  const number = Number(card.dataset.question);
  card.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      card.classList.remove('has-error');
      const fieldError = card.querySelector('.field-error');
      if (fieldError) fieldError.hidden = true;
      if (!answeredQuestions.has(number)) {
        answeredQuestions.add(number);
        track(`question_${number}_answered`, {question_number: number, answer: input.value});
      }
    });
  });
});

if ('IntersectionObserver' in window) {
  const questionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) markQuestionViewed(Number(entry.target.dataset.question));
    });
  }, {threshold: .45});
  questionCards.forEach((card) => questionObserver.observe(card));
} else {
  markQuestionViewed(1);
}

const fmt = (number) => {
  const rounded = number < 10000 ? Math.round(number / 1000) * 1000
    : number < 100000 ? Math.round(number / 10000) * 10000
    : number < 1000000 ? Math.round(number / 50000) * 50000
    : Math.round(number / 100000) * 100000;
  return rounded >= 1000000
    ? '$' + (Math.round((rounded / 1000000) * 10) / 10).toString().replace('.0', '') + 'M'
    : '$' + Math.round(rounded / 1000) + 'K';
};

const calculateDiagnosis = () => {
  const units = Number(get('units')?.value);
  const revenueAnswer = get('revenue')?.value;
  if (!Number.isFinite(units)) return null;
  const scores = {
    'Vendor Coordination & Admin': Number(get('manual')?.value),
    'Team Handoffs & Accountability': Number(get('handoffs')?.value),
    'Quality Assurance & Exception Detection': Number(get('vendors')?.value),
    'Growth Strain & Scaling Capacity': Number(get('scale')?.value)
  };
  if (Object.values(scores).some((score) => !Number.isFinite(score))) return null;
  const health = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 20) * 100);
  let tier, lo, hi, healthLabel, summary;
  if (health >= 85) {
    tier = 'LOW LEAKAGE'; healthLabel = 'Strong'; lo = .005; hi = .015;
    summary = 'Your operation appears strong, but smaller inefficiencies can still compound at portfolio scale. The fastest opportunity is usually removing the remaining manual exceptions and duplicate coordination.';
  } else if (health >= 70) {
    tier = 'MODERATE LEAKAGE'; healthLabel = 'Stable with friction'; lo = .015; hi = .03;
    summary = 'Your core operation is working, but some human coordination may still be absorbing time, response speed, and growth capacity.';
  } else if (health >= 50) {
    tier = 'HIGH LEAKAGE'; healthLabel = 'Needs attention'; lo = .03; hi = .06;
    summary = 'Your operation is functioning, but manual follow-up, handoffs, or exception management may be creating a meaningful operational tax.';
  } else {
    tier = 'SIGNIFICANT LEAKAGE'; healthLabel = 'High operational strain'; lo = .06; hi = .10;
    summary = 'Your answers suggest that everyday execution may rely heavily on manual intervention, which can consume team capacity and make growth more expensive.';
  }
  const biggest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (!biggest) return null;
  return {healthLabel, tier, primaryFit: units >= 20 && units <= 100, biggest, summary, revenue: revenueAnswer && revenueAnswer !== 'skip' ? Number(revenueAnswer) : null, lo, hi};
};

const showFallback = () => {
  assessment.style.display = 'none';
  result.style.display = 'none';
  fallback.style.display = 'block';
  track('diagnosis_scoring_failed');
  fallback.scrollIntoView({behavior: 'smooth', block: 'start'});
};

const clearValidation = () => {
  error.style.display = 'none';
  questionCards.forEach((card) => {
    card.classList.remove('has-error');
    const fieldError = card.querySelector('.field-error');
    if (fieldError) fieldError.hidden = true;
  });
};

const validateRequired = () => {
  let valid = true;
  requiredFields.forEach((field, index) => {
    const card = questionCards[index];
    const fieldError = card.querySelector('.field-error');
    if (!get(field)) {
      valid = false;
      card.classList.add('has-error');
      fieldError.hidden = false;
    }
  });
  if (!valid) {
    error.style.display = 'block';
    questionCards.find((card) => card.classList.contains('has-error'))?.scrollIntoView({behavior: 'smooth', block: 'center'});
  }
  return valid;
};

form.addEventListener('invalid', (event) => {
  const card = event.target.closest('.quiz-card');
  if (!card) return;
  const fieldError = card.querySelector('.field-error');
  card.classList.add('has-error');
  if (fieldError) fieldError.hidden = false;
  error.style.display = 'block';
}, true);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearValidation();
  if (!validateRequired()) return;
  try {
    const diagnosis = calculateDiagnosis();
    if (!diagnosis) return showFallback();
    const {healthLabel, tier, primaryFit, biggest, summary, revenue, lo, hi} = diagnosis;
    document.getElementById('healthScore').textContent = healthLabel;
    document.getElementById('tier').textContent = tier;
    document.getElementById('clientFit').textContent = primaryFit ? 'PRIMARY FIT' : 'OUTSIDE PRIMARY FIT';
    document.getElementById('fitNote').textContent = primaryFit
      ? 'Portfolio size matches the primary Bates Operations client profile of approximately 20-100 units.'
      : 'This portfolio is outside the primary 20-100 unit client profile; treat the result as general operational guidance.';
    document.getElementById('riskRange').textContent = revenue === null
      ? 'Not estimated — add a revenue band if you want the directional exposure range.'
      : 'Approximately ' + fmt(revenue * lo) + '–' + fmt(revenue * hi) + ' / year';
    document.getElementById('biggestLeak').textContent = biggest;
    document.getElementById('summary').textContent = summary;
    document.getElementById('nextStepTitle').textContent = primaryFit ? 'Review your biggest operational leak' : 'Use this as a directional self-assessment';
    document.getElementById('nextStepCopy').textContent = primaryFit
      ? 'The review itself is a focused 15-minute diagnostic conversation.'
      : 'The Operations Leak Review is designed primarily for boutique operators managing approximately 20-100 units.';
    document.getElementById('bookReview').style.display = primaryFit ? 'inline-flex' : 'none';
    document.getElementById('diagnosis-copy-summary').value = `${healthLabel}; ${tier}; ${biggest}; ${revenue === null ? 'revenue skipped' : 'exposure estimated'}`;
    assessment.style.display = 'none';
    fallback.style.display = 'none';
    result.style.display = 'block';
    track('diagnosis_completed', {health: healthLabel, tier, client_fit: primaryFit ? 'primary' : 'outside_primary', biggest_leak: biggest, revenue_provided: revenue !== null});
    result.scrollIntoView({behavior: 'smooth', block: 'start'});
  } catch (errorObject) {
    console.error('Diagnosis scoring failed', errorObject);
    showFallback();
  }
});

document.getElementById('retake').addEventListener('click', () => {
  form.reset(); clearValidation(); result.style.display = 'none'; fallback.style.display = 'none'; assessment.style.display = 'block';
  track('diagnosis_restarted');
  assessment.scrollIntoView({behavior: 'smooth', block: 'start'});
});

document.getElementById('fallback-retry').addEventListener('click', () => {
  form.reset(); clearValidation(); fallback.style.display = 'none'; result.style.display = 'none'; assessment.style.display = 'block';
  track('diagnosis_restarted');
  assessment.scrollIntoView({behavior: 'smooth', block: 'start'});
});

document.getElementById('copy-form').addEventListener('submit', async (event) => {
  const email = document.getElementById('copy-email');
  if (!email.value.trim()) {
    event.preventDefault();
    email.focus();
    email.setCustomValidity('Enter an email address or leave this optional form unused.');
  } else {
    email.setCustomValidity('');
    track('diagnosis_copy_requested');
    event.preventDefault();
    const copyForm = event.currentTarget;
    const copyStatus = document.getElementById('copy-status');
    try {
      const body = new URLSearchParams(new FormData(copyForm)).toString();
      const response = await fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body});
      if (!response.ok) throw new Error(`Copy request failed: ${response.status}`);
      copyStatus.textContent = 'Copy request received. Your results remain visible above.';
      copyStatus.hidden = false;
      copyStatus.focus();
    } catch (errorObject) {
      console.error('Copy request failed', errorObject);
      copyStatus.textContent = 'We could not record the copy request. Your results remain visible above.';
      copyStatus.hidden = false;
      copyStatus.focus();
    }
  }
});

document.getElementById('copy-email').addEventListener('input', (event) => event.target.setCustomValidity(''));
