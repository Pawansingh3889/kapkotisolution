import { readFile } from 'node:fs/promises';
import { businessServices, services, stages, layers, projects, industries } from '../content.mjs';

export const pages = [
  { path: '/', source: 'index.html', title: 'Practical AI for Your Business | Kapkoti Solution', description: 'Less busywork. More time for business. We build AI tools to help with paperwork, finding answers and the software you already use.' },
  { path: '/services/', source: 'pages/services.html', title: 'How We Help | Kapkoti Solution', description: 'See how we can help with paperwork, finding information, connecting software and understanding business figures. Start with one everyday problem.' },
  { path: '/solutions/', source: 'pages/solutions.html', title: 'Our Work | Kapkoti Solution', description: 'See examples of our work: help with business records in Rigel, factory information in FloorMind and guided surveys in Elenchus.' },
  { path: '/industries/', source: 'pages/industries.html', title: 'AI for Your Industry | Kapkoti Solution', description: 'Explore practical AI use cases for manufacturing, supply chain, retail, professional services and ERP or SaaS platforms.' },
  { path: '/technology/', source: 'pages/technology.html', title: 'Services | Kapkoti Solution', description: 'Architecture, full engineering capabilities, model methods, hosting, governance, project evidence and the delivery process. All technical information in one place.' },
  { path: '/how-we-work/', source: 'pages/how-we-work.html', title: 'How It Works | Kapkoti Solution', description: 'Tell us what slows you down, try a small solution and decide what to build next. A clear way to get started with AI for your business.' },
  { path: '/about/', source: 'pages/about.html', title: 'About Our Engineering Approach | Kapkoti Solution', description: 'An independent AI engineering practice based in Kapkot, India. Learn how we build around existing business systems, practical constraints and accountable delivery.' },
  { path: '/contact/', source: 'pages/contact.html', title: 'Let’s Talk | Kapkoti Solution', description: 'Tell Pawan what you would like to make easier. A few lines about your business problem is enough to start, with optional help putting it into words.' },
  { path: '/privacy/', source: 'pages/privacy.html', title: 'Privacy & Enquiry Information | Kapkoti Solution', description: 'How Kapkoti Solution processes enquiries, optional AI conversations, contact details, submission emails and abuse-prevention records.' },
  ...projects.map((project) => ({ path: `/solutions/${project.id}/`, source: 'templates/solution.html', title: `${project.name}: Engineering Example | Kapkoti Solution`, description: project.description, project })),
  { path: '/404.html', source: 'pages/404.html', title: 'Page Not Found | Kapkoti Solution', description: 'Find your way to Kapkoti Solution services, engineering work or contact.', noindex: true },
];

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const e = escapeHtml;
const number = (index) => String(index + 1).padStart(2, '0');
const list = (items) => items.map((item) => `<li>${e(item)}</li>`).join('');

const cta = `<section class="wrap closing" id="conversation"><div><p class="eyebrow">LET’S MAKE WORK EASIER</p><h2>What’s taking up<br><em>too much of your day?</em></h2><p>A few lines about the problem is enough to start.</p></div><div><a class="button primary" href="/contact/">Tell Us What You Need <span aria-hidden="true">↗</span></a><a class="text-link" href="mailto:pawan@kapkotisolution.com">Or email Pawan <span aria-hidden="true">↗</span></a></div></section>`;

const businessIcons = {
  paperwork: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 12h6M10 16h6"/>',
  answers: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
  connections: '<rect x="2" y="6" width="7" height="12" rx="2"/><rect x="15" y="6" width="7" height="12" rx="2"/><path d="M9 12h6m-3-3 3 3-3 3"/>',
  decisions: '<path d="M3 3v18h18M7 16v-4M12 16V8M17 16V5"/>',
};

function businessCards() {
  return `<div class="outcome-grid">${businessServices.map((service) => `<a href="/services/#${service.id}"><span class="outcome-icon" aria-hidden="true"><svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">${businessIcons[service.id]}</svg></span><h3>${e(service.title)}</h3><p>${e(service.description)}</p><span class="text-link">See how we can help <span aria-hidden="true">↗</span></span></a>`).join('')}</div>`;
}

function businessDetails() {
  return businessServices.map((service, index) => `<article class="business-service" id="${service.id}"><div><span class="index">${number(index)}</span><h2>${e(service.question)}</h2><p>${e(service.description)}</p></div><div class="business-service-examples"><p class="eyebrow">WHAT THAT COULD LOOK LIKE</p><ul class="check-list">${list(service.examples)}</ul><p>${e(service.outcome)}</p><a class="text-link" href="/contact/">Tell us about this problem <span aria-hidden="true">↗</span></a></div></article>`).join('');
}

const simpleProcess = `<ol class="simple-process"><li><span class="step-dot">1</span><h3>Tell us what slows you down.</h3><p>Show us the task, the tools you use and what you wish was easier. Plain language is welcome.</p></li><li><span class="step-dot">2</span><h3>Try a small solution.</h3><p>We agree what to test and what a useful result looks like before a bigger commitment.</p></li><li><span class="step-dot">3</span><h3>Build what proves useful.</h3><p>If the test supports it, we connect the solution to your work and agree how to keep it running.</p></li></ol>`;

function serviceDetails() {
  return services.map((service, index) => `<details class="service-detail" id="${service.id}"${index === 0 ? ' open' : ''}><summary><span class="index">${number(index)}</span><div><h2>${e(service.title)}</h2><p>${e(service.short)}</p></div><span class="detail-indicator" aria-hidden="true">+</span></summary><div class="service-body"><div><p class="service-description">${e(service.description)}</p><ul class="capability-list">${list(service.capabilities)}</ul></div><aside><span class="availability">${e(service.status)}</span><h3>What you receive</h3><p>${e(service.output)}</p><h3>How we measure it</h3><p>${e(service.measure)}</p><a class="text-link" href="/contact/">Discuss this capability <span aria-hidden="true">↗</span></a></aside></div></details>`).join('');
}

function projectCards() {
  return `<div class="project-grid">${projects.map((project) => {
    const art = project.id === 'rigel'
      ? '<img class="work-screen" src="/media/rigel-assistant.jpg" width="780" height="1520" loading="lazy" alt=""><span class="work-art-note">Actual product screen / sample data</span>'
      : project.id === 'floormind'
        ? '<div class="factory-example"><span>PRODUCTION</span><div class="factory-bars"><i></i><i></i><i></i><i></i><i></i></div><span>Records → A clearer view</span></div><span class="work-art-note">Illustration / demonstration</span>'
        : '<div class="survey-example"><span>YOUR FEEDBACK</span><div><i></i><b></b></div><div><i></i><b></b></div><div><i></i><b></b></div><span>Questions → Useful responses</span></div><span class="work-art-note">Illustration / pilot</span>';
    return `<article class="project-card"><a href="/solutions/${project.id}/"><div class="project-art art-${project.id}" aria-hidden="true">${art}</div><div class="project-card-copy"><p class="project-name">${e(project.name)}</p><div class="project-title"><h3>${e(project.title)}</h3><span aria-hidden="true">↗</span></div><p>${e(project.description)}</p><div class="project-card-end"><span class="maturity">${e(project.status)}</span><span class="text-link">See the example <span aria-hidden="true">↗</span></span></div></div></a></article>`;
  }).join('')}</div>`;
}

function processExplorer() {
  return `<div class="process-explorer" data-explorer><div class="explorer-controls process-controls" role="group" aria-label="Choose a delivery stage" hidden>${stages.map((stage, index) => `<button type="button" data-select="${stage.id}" aria-controls="${stage.id}" aria-pressed="${index === 0}"><span>${number(index)}</span>${e(stage.name)}</button>`).join('')}</div><div class="process-panels">${stages.map((stage, index) => `<article id="${stage.id}" data-panel="${stage.id}" class="process-panel"><div class="stage-copy"><span class="stage-number" aria-hidden="true">${number(index)}</span><p class="eyebrow">${e(stage.name)}</p><h2>${e(stage.title)}</h2><p>${e(stage.description)}</p></div><dl class="delivery-contract"><div><dt>You provide</dt><dd>${e(stage.input)}</dd></div><div><dt>We deliver</dt><dd>${e(stage.output)}</dd></div><div><dt>Success looks like</dt><dd>${e(stage.success)}</dd></div></dl></article>`).join('')}</div></div>`;
}

function stackExplorer() {
  return `<div class="stack-explorer" data-explorer><div class="stack-map"><div class="stack-label"><span>APPLICATION</span><span>FOUNDATION</span></div><div class="explorer-controls stack-controls" role="group" aria-label="Choose a technology layer" hidden>${layers.map((layer, index) => `<button type="button" data-select="${layer.id}" aria-controls="layer-${layer.id}" aria-pressed="${index === 0}"><span class="index">${String(layers.length - index).padStart(2, '0')}</span><span>${e(layer.name)}</span><span aria-hidden="true">↗</span></button>`).join('')}</div></div><div class="layer-panels">${layers.map((layer) => `<article class="layer-panel" id="layer-${layer.id}" data-panel="${layer.id}"><p class="eyebrow">${e(layer.owner)}</p><h3>${e(layer.name)}</h3><p>${e(layer.description)}</p><div class="layer-example"><span class="eyebrow">IN PRACTICE</span><p>${e(layer.example)}</p></div></article>`).join('')}</div></div>`;
}

const screenshots = `<section class="wrap section-tight"><div class="product-showcase"><div><p class="eyebrow">SEE A REAL PRODUCT SCREEN</p><h2>Your own figures.<br>A simpler way to ask.</h2><p>Ask a question inside the business software. Your team can review the answer and check a draft before saving changes.</p><div class="product-controls" role="group" aria-label="Choose a Rigel screen" hidden><button type="button" data-product="dashboard" aria-pressed="true">Overview</button><button type="button" data-product="stock" aria-pressed="false">Inventory</button><button type="button" data-product="assistant" aria-pressed="false">Assistant</button></div><p id="product-description">A daily view of orders, stock and recent activity.</p><p class="caption">Actual screens from Rigel’s public site, using sample business information. Screens do not verify the current live version.</p></div><figure class="product-screen"><img id="product-screen" src="/media/rigel-dashboard.jpg" width="780" height="1520" loading="lazy" alt="Rigel dashboard showing illustrative orders, stock and recent activity"></figure></div></section>`;

const technicalProjects = projects.map((project) => `<article class="technical-project" id="project-${project.id}"><p class="eyebrow">${e(project.status)}</p><h2>${e(project.name)}</h2><ol class="architecture-flow">${project.flow.map((step, index) => `<li><span class="index">${number(index)}</span><h3>${e(step)}</h3></li>`).join('')}</ol><p class="caption">Simplified architecture from inspected code. This does not verify the current deployed version.</p><div class="two-column technical-project-notes"><div><h3>Implemented in the project</h3><ul class="check-list">${list(project.implemented)}</ul></div><div><h3>Boundaries and current maturity</h3><p>${e(project.boundary)}</p><p>${e(project.maturity)}</p><h3 class="feature-heading">Future work</h3><p>${e(project.next)}</p></div></div><p class="caption">These examples do not establish a customer deployment or production readiness.</p><a class="text-link" href="/solutions/${project.id}/">See the business example <span aria-hidden="true">↗</span></a></article>`).join('');

const components = {
  cta, simpleProcess, technicalProjects,
  businessCards: businessCards(), businessDetails: businessDetails(), servicesDetailed: serviceDetails(), projectCards: projectCards(),
  processExplorer: processExplorer(), stackExplorer: stackExplorer(),
  industrySections: industries.map((industry, index) => `<article class="industry-section" id="${industry.id}"><div class="industry-heading"><span class="index">${number(index)}</span><p class="eyebrow">${e(industry.name)}</p><h2>${e(industry.title)}</h2><p>${e(industry.text)}</p><a class="text-link" href="/solutions/${industry.project}/">See a related example <span aria-hidden="true">↗</span></a></div><dl class="industry-context"><div><dt>Information you already have</dt><dd>${e(industry.data)}</dd></div><div><dt>How we could check the result</dt><dd>${e(industry.measure)}</dd></div><div><dt>Where we begin</dt><dd>One problem, a sample of your records and a clear idea of what better would look like.</dd></div></dl></article>`).join(''),
};

function replaceTokens(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown template token: ${key}`);
    return values[key];
  });
}

export async function renderPages(bundles) {
  for (const name of ['app', 'ui', 'theme', 'studio']) {
    if (!bundles[name]) throw new Error(`Missing browser entry: ${name}`);
  }
  const layout = await readFile('templates/layout.html', 'utf8');
  return Promise.all(pages.map(async (page) => {
    const canonical = `https://kapkotisolution.com${page.path}`;
    const project = page.project;
    const body = replaceTokens(await readFile(page.source, 'utf8'), {
      ...components,
      ...(project ? {
        projectId: e(project.id), category: e(project.category), name: e(project.name), headline: e(project.title), projectDescription: e(project.description),
        tags: project.tags.map((tag) => `<span>${e(tag)}</span>`).join(''), status: e(project.status),
        screenshots: project.id === 'rigel' ? screenshots : '',
        businessProblem: e(project.businessProblem), businessFeatures: list(project.businessFeatures),
        businessLimit: e(project.businessLimit), businessStatus: e(project.businessStatus),
        externalUrl: e(project.href), externalLink: e(project.link),
        linkAttributes: project.href.startsWith('https://') ? 'target="_blank" rel="noopener"' : '',
      } : {}),
    });
    const graph = [
      { '@type': 'Organization', '@id': 'https://kapkotisolution.com/#organization', name: 'Kapkoti Solution', url: 'https://kapkotisolution.com/', email: 'pawan@kapkotisolution.com', logo: 'https://kapkotisolution.com/media/favicon.svg' },
      { '@type': 'WebPage', '@id': canonical, url: canonical, name: page.title, description: page.description, isPartOf: { '@id': 'https://kapkotisolution.com/#website' } },
      { '@type': 'WebSite', '@id': 'https://kapkotisolution.com/#website', url: 'https://kapkotisolution.com/', name: 'Kapkoti Solution', publisher: { '@id': 'https://kapkotisolution.com/#organization' } },
    ];
    if (page.path !== '/' && !page.noindex) graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kapkotisolution.com/' },
      ...(project ? [{ '@type': 'ListItem', position: 2, name: 'Solutions', item: 'https://kapkotisolution.com/solutions/' }] : []),
      { '@type': 'ListItem', position: project ? 3 : 2, name: project ? project.name : page.title.split(' | ')[0], item: canonical },
    ] });
    return {
      path: page.path === '/' ? 'index.html' : page.path.endsWith('/') ? `${page.path.slice(1)}index.html` : page.path.slice(1),
      html: replaceTokens(layout, {
        title: e(page.title), description: e(page.description), canonical, body,
        theme: bundles.theme, ui: bundles.ui,
        pageScripts: `${page.path === '/contact/' ? `<script type="module" src="${bundles.app}"></script>` : ''}${page.path === '/technology/' ? `<script type="module" src="${bundles.studio}"></script>` : ''}`,
        robots: page.noindex ? '<meta name="robots" content="noindex, follow">' : '',
        schema: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'),
        navigation: [['How We Help', '/services/'], ['Our Work', '/solutions/'], ['How It Works', '/how-we-work/'], ['About', '/about/'], ['Services', '/technology/']].map(([name, path]) => `<a href="${path}"${page.path === path ? ' aria-current="page"' : ''}>${name}</a>`).join(''),
      }),
    };
  }));
}

export function renderSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((page) => !page.noindex).map((page) => `  <url><loc>https://kapkotisolution.com${page.path}</loc></url>`).join('\n')}\n</urlset>\n`;
}
