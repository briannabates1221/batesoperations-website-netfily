/* Bates Operations buyer chat bot.
   1) Answers from the built-in answer bank below (free, works on any host).
   2) If a question doesn't match, it asks /api/chat (a Netlify Function that calls Claude)
      ONLY when ANTHROPIC_API_KEY is set in Netlify. Without the key it hands off to Brianna.
   Answers here are copied from the site's FAQ and pack page. Keep them in sync when the site changes. */
(function () {
  'use strict';
  if (window.__boChat) return; window.__boChat = 1;

  var PHONE = '469-891-6699', TEL = 'tel:+14698916699';
  var ORDER = { t: 'Request your pack', h: 'contact.html?type=pack', main: 1 };
  var SAMPLE = { t: 'See the free sample', h: 'downloads/sample-hazcom-program-example-roofing-co.pdf' };
  var PACK = { t: 'What\'s in the pack', h: 'hazcom-update-pack.html' };
  var FAQ = { t: 'Read the FAQ', h: 'faq.html' };
  var CALL = { t: 'Call or text ' + PHONE, h: TEL };

  // s = strong terms (2 points), w = weak terms (1 point). Phrases match as text, words match as whole words.
  var KB = [
    { s: 'price|cost|costs|how much|149|fee|charge|expensive|subscription|monthly|per month|pricing|quote', w: 'pay|money|cheap',
      a: '<p>The HazCom Update Pack is <b>$149, one time</b>. No subscription.</p><p>It includes your written program, a chemical list from your SDSs, a container label guide, a crew training sign-off sheet and a HazCom 2024 update check.</p>', acts: [ORDER, PACK] },
    { s: 'turnaround|48|how fast|how long|how quick|how soon|rush|deadline|by friday|this week|deliver|delivered|delivery', w: 'fast|quick|soon|when|days|time',
      a: '<p>Within <b>48 hours</b> after we get your completed intake form and safety data sheets. You get an editable Word file and a print-ready PDF.</p><p>Most owners finish the intake in 10 to 15 minutes.</p>', acts: [ORDER] },
    { s: 'what do i get|whats included|what is included|included|include|includes|contents|deliverables|what comes|appendix|appendices|label guide|sign-off|sign off|chemical list', w: 'get|pack|program|word|pdf',
      a: '<p>You get a finished written HazCom program in your company\'s name, built from your own SDSs, plus:</p><ul><li>Hazardous chemical list</li><li>Container label guide for cans and buckets your crew fills</li><li>Training sign-off sheet</li><li>New product approval form</li><li>Multi-employer info exchange for shared jobsites</li><li>Program review log and a HazCom 2024 update check</li></ul><p>Delivered as Word and PDF.</p>', acts: [PACK, SAMPLE] },
    { s: 'do i need|need a written|required|require|requirement|have to have|mandatory|covered|apply to me|applies to|does osha require', w: 'need|must|written program|roofer|roofing|employees',
      a: '<p>If your employees may be exposed to hazardous chemicals at work, OSHA\'s construction standard (29 CFR 1926.59, which applies 1910.1200) requires a written hazard communication program.</p><p>Roofers commonly use primers, adhesives, sealants, coatings, roof cement, solvents, fuels, propane and aerosols, so most roofing companies with employees are covered.</p>', acts: [ORDER, FAQ] },
    { s: 'november 20|nov 20|2024 update|2024|update|ghs|revision 7|rev 7|what changed|changes|new rule|2028|mixtures', w: 'deadline|due|change|new',
      a: '<p>OSHA revised the Hazard Communication Standard on May 20, 2024. By <b>November 20, 2026</b>, employers had to update labels, the written program and training <b>as necessary</b> for substances whose hazard information changed. For mixtures the employer date is May 19, 2028.</p><p>Our pack includes a HazCom 2024 update check against your products.</p>', acts: [ORDER, FAQ] },
    { s: 'retrain|re-train|train my crew|training|train the crew|whole crew', w: 'train|crew|guys',
      a: '<p>Not automatically. Training is required when an employee is first assigned and when a new chemical hazard comes into their work area. If an updated SDS shows a new hazard for a product your crew uses, train them on that hazard.</p><p>The pack includes a training sign-off sheet. We write the documents; we don\'t run the training.</p>', acts: [ORDER] },
    { s: 'template|free template|download a template|diy|do it myself|myself|generic|chatgpt', w: 'free|download',
      a: '<p>You can start from a template, but it only becomes your program once it describes what your company actually does: your products, where SDSs are kept, how you label containers and how you work with other trades. A generic document that doesn\'t match your practice isn\'t a complete program.</p><p>That fill-in work is what the pack does for you.</p>', acts: [ORDER, SAMPLE] },
    { s: 'where do i keep|keep the program|binder|truck|jobsite|job site|travel|between jobs|shop', w: 'keep|store|site',
      a: '<p>If crews move between jobsites, OSHA allows the written program to be kept at your primary location, like the office or shop. SDSs can be kept there too, as long as employees can get the information immediately in an emergency. Many roofers also keep a binder or phone access on each truck.</p>', acts: [FAQ] },
    { s: 'phone|tablet|electronic|digital|app|online sds|on my phone', w: 'sds|safety data sheet',
      a: '<p>Yes, SDSs can be electronic as long as there\'s no barrier to immediate access on every shift. A dead phone or no signal on a roof is a barrier, so keep a backup.</p>', acts: [FAQ] },
    { s: 'hardware store|home depot|lowes|lowe\'s|consumer product|consumer|retail|store bought|off the shelf', w: 'store|buy',
      a: '<p>Usually they count. The consumer product exemption only applies when the product is used as intended and exposure is no longer or more frequent than a typical consumer\'s. A crew using caulk or spray adhesive all day generally doesn\'t meet that test.</p>', acts: [FAQ] },
    { s: 'isnetworld|isn|avetta|prequal|prequalification|highwire|veriforce|general contractor|gc|approved|approval|score|insurer|insurance', w: 'client|paperwork|platform',
      a: '<p>GCs and prequalification platforms like ISNetworld and Avetta often ask for a written HazCom program, and this pack gives you one written around your company.</p><p>Each platform and client sets its own review rules, so we can\'t promise an approval or a score.</p>', acts: [ORDER] },
    { s: 'state|states|california|washington|oregon|michigan|arizona|nevada|utah|virginia|kentucky|state plan|nationwide|texas|florida|where do you|service area|serve|work in|do you cover|oklahoma|georgia|louisiana|colorado', w: 'where|location|located',
      a: '<p>We serve roofing contractors in states where private employers fall under <b>federal OSHA</b> (for example Texas and Florida). States with their own approved plan, such as California, can have different rules and dates, so we don\'t write programs for them yet.</p><p>Not sure about your state? Ask Brianna below.</p>', acts: [ORDER] },
    { s: 'are you osha|osha affiliated|affiliated|legal advice|lawyer|attorney|government|official', w: 'osha|legal',
      a: '<p>No. Bates Operations is a private business, not affiliated with OSHA. We prepare documents from the information you give us. They aren\'t legal advice or a workplace inspection, and you stay responsible for putting the program into practice, training employees and keeping it current.</p>', acts: [PACK] },
    { s: 'violation|violate|in violation|fine|fined|cited|citation|penalty|penalties|inspection|inspector|audit|compliant|compliance|am i ok|am i covered|get in trouble', w: 'trouble|risk',
      a: '<p>I can\'t tell you whether your company is compliant or in violation. That depends on your products and how you actually work, and only OSHA decides citations.</p><p>What I can tell you: a written HazCom program is required when employees may be exposed to hazardous chemicals, and the 2024 update applies "as necessary" to products whose hazard info changed. Our pack gives you a written program built around your products. It isn\'t legal advice.</p>', acts: [ORDER, FAQ] },
    { s: 'what do you need|what do i send|what do i provide|intake|information do you need|from me|send you|sds sheets|safety data sheets', w: 'need|provide|send|sds',
      a: '<p>We\'ll need:</p><ul><li>Company name, address and your HazCom contact</li><li>About how many employees and the languages your crew speaks</li><li>The products you use (primers, adhesives, sealants, coatings, fuels, aerosols, cleaners)</li><li>Their safety data sheets: phone photos, PDFs or links all work</li><li>Where crews keep SDSs and how you label containers</li><li>Whether you work alongside GCs or other trades</li></ul>', acts: [ORDER] },
    { s: 'order|buy|purchase|sign up|get started|start|how do i get|request|ready', w: 'want|interested',
      a: '<p>Tap <b>Request your pack</b> and fill in the short form. We send a short intake form, then your order confirmation with our terms and payment details before you pay anything. Delivery is within 48 hours of a complete intake.</p>', acts: [ORDER, CALL] },
    { s: 'how do i pay|payment|card|credit card|invoice|venmo|paypal|stripe|zelle|cash app', w: 'pay',
      a: '<p>You don\'t pay on the website. After you request your pack, you get an order confirmation with our terms and how to pay, before you pay anything.</p>', acts: [ORDER] },
    { s: 'refund|money back|guarantee|guaranteed|terms|terms of service|contract|warranty', w: '',
      a: '<p>Our full terms of service are being finalized with an attorney and are sent with your order confirmation, before you pay. For anything specific, ask Brianna directly.</p>', acts: [CALL] },
    { s: 'sample|example|see one|preview|look at', w: 'free',
      a: '<p>Yes, you can download a finished sample program we wrote for a made-up roofing company.</p>', acts: [SAMPLE, ORDER] },
    { s: 'fall protection|silica|respirator|respiratory|asbestos|heat|ladder|safety manual|other programs|full safety program|eap|emergency action', w: 'manual',
      a: '<p>The pack covers hazard communication (HazCom) only. Fall protection, silica, respirator and asbestos plans are separate programs. Ask Brianna if you need one of those.</p>', acts: [CALL] },
    { s: 'spanish|espanol|español|bilingual|language|languages', w: '',
      a: '<p>The intake asks which languages your crew speaks. If you need a Spanish version of the program or sign-off sheet, ask Brianna before you order.</p>', acts: [CALL, ORDER] },
    { s: 'who are you|who is brianna|brianna|owner|about you|about the company|killeen', w: 'who',
      a: '<p>Bates Operations is owned by Brianna Bates in Killeen, Texas. We write done-for-you written HazCom programs for small roofing contractors.</p>', acts: [{ t: 'About us', h: 'about.html' }] },
    { s: 'talk to|human|real person|call you|phone number|email|contact|reach you|speak', w: 'call|text',
      a: '<p>Call or text Brianna at <b>' + PHONE + '</b>, or use the request form.</p>', acts: [CALL, { t: 'Request form', h: 'contact.html?type=question' }] },
    { s: 'hello|hi|hey|good morning|good afternoon|howdy|yo', w: '',
      a: '<p>Hi! Ask me about the $149 HazCom Update Pack, what\'s included, turnaround, or OSHA HazCom basics.</p>', acts: [], greet: 1 },
    { s: 'thanks|thank you|thx|appreciate', w: '',
      a: '<p>You\'re welcome. When you\'re ready, the request form takes about two minutes.</p>', acts: [ORDER], greet: 1 }
  ];

  var CHIPS = ['How much is it?', 'What\'s included?', 'How fast is delivery?', 'Do I need a written program?', 'What changed Nov 20?', 'Will this pass ISNetworld or Avetta?'];

  function norm(t) { return ' ' + t.toLowerCase().replace(/[’']/g, '\'').replace(/[^a-z0-9$' -]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  function hit(text, term) {
    if (!term) return false;
    if (term.indexOf(' ') > -1) return text.indexOf(term) > -1;
    var re = new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
    return re.test(text);
  }
  function match(q) {
    var t = norm(q), best = null, bestScore = 0;
    KB.forEach(function (e) {
      var sc = 0;
      e.s.split('|').forEach(function (k) { if (hit(t, k)) sc += 2; });
      e.w.split('|').forEach(function (k) { if (hit(t, k)) sc += 1; });
      if (e.greet && t.trim().split(' ').length > 4) sc = Math.min(sc, 1); // "hi, how much is it" -> real answer wins
      if (sc > bestScore) { best = e; bestScore = sc; }
    });
    return { e: best, score: bestScore };
  }

  // ---------- UI ----------
  var d = document, ai = null, busy = false; // null = unknown, true = AI answers available, false = not set up
  var history = [];
  var btn = d.createElement('button');
  btn.type = 'button'; btn.className = 'bo-chat-btn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'bo-chat');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z"/></svg>Questions? Ask here';

  var box = d.createElement('section');
  box.id = 'bo-chat'; box.className = 'bo-chat'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Ask Bates Operations');
  box.innerHTML =
    '<div class="bo-chat-head"><div style="flex:1"><h2>Ask Bates Operations</h2><p>HazCom Update Pack questions, answered fast</p></div>' +
    '<button type="button" class="bo-chat-x" aria-label="Close chat">&times;</button></div>' +
    '<div class="bo-chat-log" role="log" aria-live="polite"></div>' +
    '<div class="bo-chips"></div>' +
    '<form class="bo-chat-form"><label for="bo-q" class="sr-only" style="position:absolute;left:-9999px">Your question</label>' +
    '<input id="bo-q" name="q" autocomplete="off" maxlength="500" placeholder="Type your question"><button type="submit">Send</button></form>' +
    '<p class="bo-chat-note">Automated answers from our FAQ. Not legal advice.</p>';

  var log = box.querySelector('.bo-chat-log'), chips = box.querySelector('.bo-chips'),
      form = box.querySelector('form'), input = box.querySelector('input'), x = box.querySelector('.bo-chat-x');

  function acts(list, q) {
    var wrap = d.createElement('div'); wrap.className = 'bo-acts';
    (list || []).forEach(function (a) {
      var l = d.createElement('a'); l.href = a.h; l.textContent = a.t; if (a.main) l.className = 'bo-main';
      if (/\.pdf$/.test(a.h)) l.target = '_blank';
      wrap.appendChild(l);
    });
    return wrap;
  }
  function say(html, list) {
    var m = d.createElement('div'); m.className = 'bo-msg bo-bot'; m.innerHTML = html;
    if (list && list.length) m.appendChild(acts(list));
    log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  function sayText(text, list) { // for AI replies: plain text only, never HTML
    var m = d.createElement('div'); m.className = 'bo-msg bo-bot';
    text.split(/\n{2,}/).forEach(function (para) { var p = d.createElement('p'); p.textContent = para.replace(/\*\*/g, ''); m.appendChild(p); });
    if (list && list.length) m.appendChild(acts(list));
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function you(text) {
    var m = d.createElement('div'); m.className = 'bo-msg bo-you'; m.textContent = text;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function askLink(q) { return { t: 'Ask Brianna', h: 'contact.html?type=question&msg=' + encodeURIComponent(q.slice(0, 400)), main: 1 }; }
  function handoff(q) {
    say('<p>I don\'t have a solid answer for that one, and I\'d rather not guess. Brianna can answer it directly.</p><p>Call or text <b>' + PHONE + '</b>, or send your question with the form.</p>', [askLink(q), CALL]);
  }
  function drawChips() {
    chips.innerHTML = '';
    CHIPS.forEach(function (c) {
      var b = d.createElement('button'); b.type = 'button'; b.textContent = c;
      b.addEventListener('click', function () { send(c); });
      chips.appendChild(b);
    });
  }

  function send(q) {
    q = (q || '').trim(); if (!q || busy) return;
    chips.innerHTML = '';
    you(q); history.push({ role: 'user', content: q });
    var r = match(q);
    if (r.e && r.score >= 3 || (r.e && r.score >= 2 && ai !== true)) {
      say(r.e.a, r.e.acts); history.push({ role: 'assistant', content: r.e.a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
      return;
    }
    if (ai === false) { if (r.e && r.score >= 2) { say(r.e.a, r.e.acts); } else handoff(q); return; }
    busy = true; var wait = say('<p class="bo-typing">Checking…</p>');
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-8) }) })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function (j) {
        wait.remove(); ai = true; busy = false;
        if (j && j.reply) { sayText(j.reply, [ORDER, askLink(q)]); history.push({ role: 'assistant', content: j.reply }); }
        else handoff(q);
      })
      .catch(function () {
        wait.remove(); ai = false; busy = false;
        if (r.e && r.score >= 2) say(r.e.a, r.e.acts); else handoff(q);
      });
  }

  function open() {
    box.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (!log.children.length) {
      say('<p>Hi, I answer questions about the <b>$149 HazCom Update Pack</b> for roofing contractors: what\'s included, turnaround, ordering and OSHA HazCom basics.</p><p>Pick one below or type your own.</p>');
      drawChips();
    }
    input.focus();
  }
  function close() { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }

  btn.addEventListener('click', open);
  x.addEventListener('click', close);
  box.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); if (busy) return; var q = input.value; input.value = ''; send(q); });

  function mount() { d.body.appendChild(btn); d.body.appendChild(box); if (/[?&]chat=1/.test(location.search)) open(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
  window.BOChat = { match: match, open: open, send: send };
})();
