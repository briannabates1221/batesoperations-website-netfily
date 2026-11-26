# Bates Operations website

Plain HTML site for the $149 HazCom Update Pack, with a buyer chat bot. Netlify publishes this folder as is (no build step). Settings are in `netlify.toml`.

## Buyer chat bot
- Floating "Questions? Ask here" button on every page (`assets/chat.js`, `assets/chat.css`).
- **Works with no setup and no cost.** It answers from a built-in answer bank copied from the FAQ and pack page: price, what's included, turnaround, ordering, payment, states, ISNetworld/Avetta, OSHA HazCom basics.
- Questions it can't answer get a hand-off: call or text 469-891-6699, or "Ask Brianna", which opens the request form with the question filled in.
- It never says a roofer is in violation, and never promises compliance, approvals or legal outcomes.
- Edit answers in the `KB` list at the top of `assets/chat.js`. Keep them in sync with `faq.html` and `hazcom-update-pack.html`.
- Test link: add `?chat=1` to any page URL to open the chat on load.

### Optional: real AI answers (off until you turn it on)
`netlify/functions/chat.mjs` lets Claude answer questions the answer bank doesn't cover, using only the site's facts. It stays off until you add a key:
1. Get an API key at console.anthropic.com (pay-as-you-go; you're billed per message).
2. Netlify > your site > Site configuration > Environment variables > Add `ANTHROPIC_API_KEY`.
3. Optional: add `CHAT_MODEL` to choose a model (default `claude-opus-5-5`; `claude-haiku-5-5` costs far less per message).
4. Redeploy. Never put the key in this repo.

## Before taking orders
1. Create the mailbox hello@batesoperations.com (it's on every page, in llms.txt and the schema).
2. Payment: there's no checkout. Orders go through `contact.html`; terms and payment details go out with the order confirmation.
3. Request form: it opens the visitor's email app. Netlify Forms can collect submissions instead.
4. Terms of service: the site says they're being finalized with an attorney. Keep that true.

## Files
- `index.html`, `hazcom-update-pack.html`, `faq.html`, `about.html`, `contact.html`, `404.html`
- `assets/` styles, chat bot, images; `downloads/` free sample PDF
- `robots.txt`, `sitemap.xml`, `llms.txt`
- `netlify.toml`, `netlify/functions/chat.mjs`, `package.json` (only for the optional AI function)
