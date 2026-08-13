const contactForm = document.getElementById('contact-form');
const contactError = document.getElementById('contact-error');
const contactSuccess = document.getElementById('contact-success');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    contactError.hidden = true;
    contactSuccess.hidden = true;
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    try {
      const body = new URLSearchParams(new FormData(contactForm)).toString();
      const response = await fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body
      });
      if (!response.ok) throw new Error(`Contact form failed: ${response.status}`);
      contactForm.reset();
      contactSuccess.hidden = false;
      contactSuccess.focus();
      if (typeof window.trackBatesEvent === 'function') window.trackBatesEvent('contact_form_submitted');
    } catch (error) {
      console.error(error);
      contactError.hidden = false;
      contactError.focus?.();
      if (typeof window.trackBatesEvent === 'function') window.trackBatesEvent('contact_form_failed');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send message';
    }
  });
}
