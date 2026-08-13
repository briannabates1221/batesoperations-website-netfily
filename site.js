const revealTargets = [...document.querySelectorAll('.reveal')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .12, rootMargin: '0px 0px -40px'});
  revealTargets.forEach((element) => revealObserver.observe(element));
}

const newsletterForm = document.getElementById('newsletter-form');
const newsletterStatus = document.getElementById('newsletter-status');
if (newsletterForm && newsletterStatus && new URLSearchParams(window.location.search).get('newsletter') === 'success') {
  newsletterForm.hidden = true;
  newsletterStatus.hidden = false;
  newsletterStatus.focus?.();
}

const analyticsState = window.batesAnalytics = window.batesAnalytics || {events: []};
window.trackBatesEvent = (name, properties = {}) => {
  const event = {name, properties, timestamp: new Date().toISOString()};
  analyticsState.events.push(event);
  window.dispatchEvent(new CustomEvent('bates:analytics', {detail: event}));
  if (typeof window.plausible === 'function') window.plausible(name, {props: properties});
  if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, properties);
  const debugList = document.getElementById('analytics-debug-list');
  if (debugList) {
    const item = document.createElement('li');
    item.textContent = `${name} ${JSON.stringify(properties)}`;
    debugList.appendChild(item);
  }
};

if (new URLSearchParams(window.location.search).get('analytics_debug') === '1') {
  const debugPanel = document.createElement('aside');
  debugPanel.className = 'analytics-debug';
  debugPanel.innerHTML = '<strong>Analytics debugger</strong><ol id="analytics-debug-list"></ol>';
  document.body.appendChild(debugPanel);
}

document.querySelectorAll('a[href*="calendly.com"]').forEach((link) => {
  link.addEventListener('click', () => window.trackBatesEvent('calendly_clicked', {href: link.href}));
});
