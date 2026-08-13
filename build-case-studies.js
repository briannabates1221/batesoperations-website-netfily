const fs = require('fs');
const path = require('path');

const root = __dirname;
const contentDir = path.join(root, 'content', 'case-studies');
const outputDir = path.join(root, 'case-studies');
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
  return `<p>${renderInline(text)}</p>`;
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
  for (const field of ['title', 'slug', 'summary']) {
    if (!data[field]) throw new Error(`${fileName}: missing ${field}`);
  }
  return {...data, body: match[2]};
};

const readCases = () => fs.readdirSync(contentDir)
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => parseFrontmatter(fs.readFileSync(path.join(contentDir, fileName), 'utf8'), fileName))
  .sort((a, b) => a.title.localeCompare(b.title));

const diagrams = {
  'dispatch-handoff-gaps': {
    heading: 'The handoff Bates Operations would examine',
    stages: [
      ['Service request', 'Capture the essential details'],
      ['Schedule', 'Connect the request to the correct time window'],
      ['Accountable owner', 'Make the next responsible person visible'],
      ['Completion or exception', 'Close the loop or escalate the blocked work']
    ]
  },
  'vendor-exception-visibility': {
    heading: 'From isolated exception to visible pattern',
    stages: [
      ['Capture', 'Record the exception while details are fresh'],
      ['Categorize', 'Group by property, vendor, issue type, and urgency'],
      ['Look for repeat patterns', 'Identify issues that are no longer isolated'],
      ['Assign the next move', 'Vendor follow-up, process change, or quality check'],
      ['Escalate when necessary', 'Protect the next turnover or guest experience']
    ]
  },
  'scaling-coordination-drag': {
    heading: 'How growth creates coordination drag',
    stages: [
      ['Portfolio growth', 'More properties and more operating variables'],
      ['More requests', 'More owner, vendor, maintenance, and turnover activity'],
      ['More exceptions', 'More situations requiring judgment or follow-up'],
      ['Coordination drag', 'Routine questions and decisions return to the same person'],
      ['Operating clarity', 'Separate routine work, visible ownership, and clear escalation']
    ]
  }
};

const pageHead = (entry, isIndex = false) => {
  const pageUrl = isIndex ? `${siteUrl}/case-studies` : `${siteUrl}/case-studies/${entry.slug}`;
  const title = isIndex ? 'Illustrative Case Studies | Bates Operations' : `${entry.title} | Bates Operations`;
  const description = isIndex
    ? 'Illustrative, hypothetical STR/MTR operations scenarios covering dispatch handoffs, vendor exceptions, and scaling coordination.'
    : entry.summary;
  const ogType = 'article';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${pageUrl}"><link rel="icon" type="image/png" sizes="512x512" href="/bates-operations-favicon.png">
<meta property="og:type" content="${ogType}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${pageUrl}"><meta property="og:image" content="${siteUrl}/bates-operations-logo.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${siteUrl}/bates-operations-logo.png">
${isIndex ? `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage','@id':`${pageUrl}#webpage`,url:pageUrl,name:title,description,isPartOf:{'@type':'WebSite',name:'Bates Operations',url:`${siteUrl}/`}})}</script>` : `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article','@id':`${pageUrl}#article`,mainEntityOfPage:{'@type':'WebPage','@id':pageUrl},headline:entry.title,description:entry.summary,author:{'@type':'Person',name:'Brianna Bates',url:`${siteUrl}/about`},publisher:{'@type':'Organization',name:'Bates Operations',url:`${siteUrl}/`},isPartOf:{'@type':'WebSite',name:'Bates Operations',url:`${siteUrl}/`}})}</script>`}
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:isIndex ? [{ '@type':'ListItem',position:1,name:'Home',item:`${siteUrl}/`},{ '@type':'ListItem',position:2,name:'Case studies',item:pageUrl}] : [{ '@type':'ListItem',position:1,name:'Home',item:`${siteUrl}/`},{ '@type':'ListItem',position:2,name:'Case studies',item:`${siteUrl}/case-studies`},{ '@type':'ListItem',position:3,name:entry.title,item:pageUrl}]})}</script>
<link rel="stylesheet" href="/styles.css"></head>`;
};

const header = `<header class="site-header"><div class="container nav"><a class="brand-link" href="/" aria-label="Bates Operations home"><img class="brand-logo" src="/bates-operations-logo.png" alt="Bates Operations"></a><nav class="nav-links" aria-label="Primary navigation"><a href="/about">About</a><a href="/diagnosis">Diagnosis</a><a href="/field-notes">Field notes</a><a href="/case-studies" aria-current="page">Case studies</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a><a class="button primary" href="/diagnosis">Start the diagnosis</a></nav></div></header>`;
const footer = `<footer class="site-footer"><div class="container footer-inner"><span>Bates Operations</span><span class="footer-links"><a href="/">Home</a><a href="/about">About</a><a href="/diagnosis">Diagnosis</a><a href="/field-notes">Field notes</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a></span></div></footer>`;

const card = (entry) => `<article class="article-card"><p class="scenario-label">Illustrative scenario — not a specific client</p><h2><a href="/case-studies/${entry.slug}">${escapeHtml(entry.title)}</a></h2><p>${escapeHtml(entry.summary)}</p><p><a class="button secondary" href="/case-studies/${entry.slug}">Read the scenario</a></p></article>`;

const renderDiagram = (entry) => {
  const diagram = diagrams[entry.slug];
  if (!diagram) throw new Error(`${entry.slug}: missing operating-pattern diagram`);
  return `<figure class="case-study-visual" aria-labelledby="pattern-title-${entry.slug}"><figcaption class="label">Operating pattern</figcaption><h2 id="pattern-title-${entry.slug}">${escapeHtml(diagram.heading)}</h2><ol class="pattern-flow">${diagram.stages.map(([label, detail]) => `<li><span class="pattern-number" aria-hidden="true"></span><div><h3>${escapeHtml(label)}</h3><p>${escapeHtml(detail)}</p></div></li>`).join('')}</ol></figure>`;
};

const renderArticle = (entry) => `${pageHead(entry)}
<body><div class="site-shell">${header}<main>
<section class="page-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/case-studies">Case studies</a></li><li aria-current="page">${escapeHtml(entry.title)}</li></ol></nav><p class="label">Illustrative scenario — not a specific client</p><h1>${escapeHtml(entry.title)}</h1><p>${escapeHtml(entry.summary)}</p></div></section>
<article class="section"><div class="container"><p class="content-note"><strong>Illustrative scenario — not a specific client.</strong> This hypothetical example uses broad, non-identifying context. It is not a testimonial, verified case study, or report of completed client work.</p><div class="case-study-layout"><div class="content-copy article-body">${renderMarkdown(entry.body)}</div>${renderDiagram(entry)}</div><p class="case-study-actions"><a class="button primary" href="/diagnosis">Start the Operational Leak Diagnosis</a> <a class="button secondary" href="/contact">Ask a question</a></p></div></article>
<section class="section related-section" aria-labelledby="case-study-next"><div class="container"><div class="section-heading"><div><p class="label">Continue exploring</p><h2 id="case-study-next">Other illustrative scenarios</h2></div><p>These examples are designed to make the operating patterns easier to recognize before a real review.</p></div><div class="article-grid">${readCases().filter((candidate) => candidate.slug !== entry.slug).map(card).join('')}</div></div></section>
</main>${footer}</div><script src="/site.js" defer></script></body></html>`;

const renderIndex = (entries) => `${pageHead({}, true)}
<body><div class="site-shell">${header}<main>
<section class="page-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Case studies</li></ol></nav><p class="label">Illustrative case studies</p><h1>Operational patterns worth seeing before they become expensive.</h1><p>These hypothetical scenarios show how an Operations Leak Diagnosis might examine dispatch handoffs, vendor exceptions, and scaling coordination. None describes a specific client or completed engagement.</p></div></section>
<section class="section"><div class="container"><div class="article-grid">${entries.map(card).join('')}</div><p class="content-note"><strong>Important context:</strong> The scenarios on this page are illustrative only. Real client evidence will be added only after completed work, permission, and supporting documentation exist.</p><p><a class="button primary" href="/diagnosis">Start the Operational Leak Diagnosis</a></p></div></section>
</main>${footer}</div><script src="/site.js" defer></script></body></html>`;

const entries = readCases();
if (entries.length < 3) throw new Error('Add at least 3 case-study entries before generating the index.');
for (const entry of entries) {
  const directory = path.join(outputDir, entry.slug);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'index.html'), renderArticle(entry));
}
fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(path.join(outputDir, 'index.html'), renderIndex(entries));

const fieldNoteSlugs = fs.readdirSync(path.join(root, 'content', 'field-notes')).filter((fileName) => fileName.endsWith('.mdx')).map((fileName) => fileName.replace(/\.mdx$/, ''));
const sitemapRoutes = ['', 'about', 'diagnosis', 'field-notes', 'case-studies', 'pricing', 'contact', ...fieldNoteSlugs.map((slug) => `field-notes/${slug}`), ...entries.map((entry) => `case-studies/${entry.slug}`)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${siteUrl}/${route}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${entries.length} illustrative case studies and updated sitemap.xml.`);
