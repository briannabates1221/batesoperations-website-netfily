const fs = require('fs');
const path = require('path');

const root = __dirname;
const contentDir = path.join(root, 'content', 'field-notes');
const outputDir = path.join(root, 'field-notes');
const siteUrl = 'https://batesoperations.com';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderInline = (value) => escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const renderMarkdown = (body) => body.trim().split(/\n\s*\n/).map((block) => {
  const text = block.trim();
  if (!text) return '';
  if (text.startsWith('### ')) return `<h3>${renderInline(text.slice(4))}</h3>`;
  if (text.startsWith('## ')) return `<h2>${renderInline(text.slice(3))}</h2>`;
  return `<p${text.startsWith('**Short answer:**') ? ' class="article-answer"' : ''}>${renderInline(text)}</p>`;
}).join('');

const parseFrontmatter = (source, fileName) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: missing frontmatter`);
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  for (const field of ['title', 'slug', 'author', 'datePublished', 'dateModified', 'summary']) {
    if (!data[field]) throw new Error(`${fileName}: missing ${field}`);
  }
  return {...data, body: match[2]};
};

const readArticles = () => fs.readdirSync(contentDir)
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => parseFrontmatter(fs.readFileSync(path.join(contentDir, fileName), 'utf8'), fileName))
  .sort((a, b) => b.datePublished.localeCompare(a.datePublished) || a.title.localeCompare(b.title));

const formatDate = (isoDate) => new Intl.DateTimeFormat('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'})
  .format(new Date(`${isoDate}T00:00:00Z`));

const pageHead = (article) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(article.title)} | Bates Operations</title>
<meta name="description" content="${escapeHtml(article.summary)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${siteUrl}/field-notes/${article.slug}"><link rel="icon" type="image/png" sizes="512x512" href="/bates-operations-favicon.png">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${siteUrl}/field-notes/${article.slug}#article`,
  mainEntityOfPage: {'@type': 'WebPage', '@id': `${siteUrl}/field-notes/${article.slug}`},
  headline: article.title,
  description: article.summary,
  author: {'@type': 'Person', name: article.author, url: `${siteUrl}/about`},
  datePublished: article.datePublished,
  dateModified: article.dateModified,
  publisher: {'@type': 'Organization', name: 'Bates Operations', url: `${siteUrl}/`}
})}</script>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/`},
    {'@type': 'ListItem', position: 2, name: 'Field notes', item: `${siteUrl}/field-notes`},
    {'@type': 'ListItem', position: 3, name: article.title, item: `${siteUrl}/field-notes/${article.slug}`}
  ]
})}</script>
<link rel="stylesheet" href="/styles.css"></head>`;

const header = `<header class="site-header"><div class="container nav"><a class="brand-link" href="/" aria-label="Bates Operations home"><img class="brand-logo" src="/bates-operations-logo.png" alt="Bates Operations"></a><nav class="nav-links" aria-label="Primary navigation"><a href="/about">About</a><a href="/diagnosis">Diagnosis</a><a href="/field-notes" aria-current="page">Field notes</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a><a class="button primary" href="/diagnosis">Start the diagnosis</a></nav></div></header>`;
const footer = `<footer class="site-footer"><div class="container footer-inner"><span>Bates Operations</span><span class="footer-links"><a href="/">Home</a><a href="/field-notes">All field notes</a><a href="/contact">Contact</a></span></div></footer>`;

const relatedMarkup = (article, articles) => {
  const related = articles.filter((candidate) => candidate.slug !== article.slug).slice(0, 2);
  return `<section class="section related-section" aria-labelledby="related-title"><div class="container"><div class="section-heading"><div><p class="label">Keep reading</p><h2 id="related-title">Related field notes</h2></div><p>Continue with another practical look at operational handoffs, exceptions, or automation.</p></div><div class="article-grid">${related.map((item) => `<article class="article-card"><h3><a href="/field-notes/${item.slug}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.summary)}</p><p class="article-card-meta">${formatDate(item.datePublished)}</p></article>`).join('')}</div></div></section>`;
};

const renderArticle = (article, articles) => `${pageHead(article)}
<body><div class="site-shell">${header}<main>
<section class="page-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/field-notes">Field notes</a></li><li aria-current="page">${escapeHtml(article.title)}</li></ol></nav><p class="label">Field note</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary)}</p><div class="article-meta"><span>By <a href="/about">${escapeHtml(article.author)}</a></span><span>Published <time datetime="${article.datePublished}">${formatDate(article.datePublished)}</time></span><span>Updated <time datetime="${article.dateModified}">${formatDate(article.dateModified)}</time></span></div></div></section>
<article class="section"><div class="container content-copy article-body">${renderMarkdown(article.body)}<p><a class="button primary" href="/diagnosis">Run the Operational Leak Diagnosis</a></p><p class="content-note"><strong>Content note:</strong> This field note is currently a short answer and one supporting paragraph. It should be expanded by the human author to approximately 400-800 words of real operational detail before being positioned as defensible expertise content.</p></div></article>
${relatedMarkup(article, articles)}</main>${footer}</div><script src="/site.js" defer></script></body></html>`;

const renderIndex = (articles) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Field Notes | Bates Operations</title><meta name="description" content="Practical operations field notes for boutique STR/MTR property managers, rental operators, and operations leads."><meta name="robots" content="index,follow"><link rel="canonical" href="${siteUrl}/field-notes"><link rel="icon" type="image/png" sizes="512x512" href="/bates-operations-favicon.png"><link rel="stylesheet" href="/styles.css"></head><body><div class="site-shell">${header}
<main><section class="page-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Field notes</li></ol></nav><p class="label">Free Newsletter + Field Notes</p><h1>The Bates Operations Brief</h1><p>A free, occasional newsletter for boutique STR/MTR property managers, rental operators, owners, office managers, and operations leads managing approximately 20-100 units, recurring turnovers, vendors, and follow-up. Each issue answers one practical operations question in plain language, with a small next step you can test before adding more tools or staff.</p></div></section><section class="section"><div class="container brief-content"><div class="article-block"><p class="label">Recent field notes</p><div class="article-grid">${articles.map((article) => `<article class="article-card"><h2><a href="/field-notes/${article.slug}">${escapeHtml(article.title)}</a></h2><p class="article-answer">${escapeHtml(article.summary)}</p><p class="article-card-meta">By ${escapeHtml(article.author)} · ${formatDate(article.datePublished)}</p><p><a class="button secondary" href="/field-notes/${article.slug}">Read field note</a></p></article>`).join('')}</div></div><div class="newsletter-card"><p class="newsletter-card-title">Get the next brief</p><form id="newsletter-form" name="operations-brief" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/?newsletter=success"><input type="hidden" name="form-name" value="operations-brief"><div hidden><label>Do not fill this out if you are human: <input name="bot-field"></label></div><label for="newsletter-email">Work email</label><input id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required><button class="button primary" type="submit">Join the free brief</button></form><p class="newsletter-note">You can unsubscribe at any time. Your email is used for the Operations Brief only.</p><p class="newsletter-status" id="newsletter-status" role="status" tabindex="-1" hidden>You are on the list. The next Operations Brief will land in your inbox.</p></div></div></section></main><footer class="site-footer"><div class="container footer-inner"><span>Bates Operations</span><span class="footer-links"><a href="/">Home</a><a href="/about">About</a><a href="/diagnosis">Diagnosis</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a></span></div></footer></div><script src="/site.js" defer></script></body></html>`;

const articles = readArticles();
for (const article of articles) {
  const directory = path.join(outputDir, article.slug);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'index.html'), renderArticle(article, articles));
}
fs.writeFileSync(path.join(outputDir, 'index.html'), renderIndex(articles));
const sitemapRoutes = ['', 'about', 'diagnosis', 'field-notes', 'pricing', 'contact', ...articles.map((article) => `field-notes/${article.slug}`)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${siteUrl}/${route}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${articles.length} field notes from ${path.relative(root, contentDir)}.`);
