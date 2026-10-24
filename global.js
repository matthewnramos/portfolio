function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Resolve internal links from this file, including the GitHub Pages repo path.
const BASE_URL = new URL('./', import.meta.url);
const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/matthewnramos', title: 'GitHub' },
];

// Treat a directory URL and its explicit index.html as the same page.
function normalizePath(pathname) {
  return pathname.replace(/index\.html$/, '').replace(/\/$/, '');
}

const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Main navigation');
document.body.prepend(nav);

for (const page of pages) {
  const link = document.createElement('a');
  link.href = new URL(page.url, BASE_URL).href;
  link.textContent = page.title;

  if (link.host === location.host && normalizePath(link.pathname) === normalizePath(location.pathname)) {
    link.classList.add('current');
    link.setAttribute('aria-current', 'page');
  }

  if (link.host !== location.host) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  nav.append(link);
}

document.body.insertAdjacentHTML('afterbegin', `
  <label class="color-scheme">
    Theme:
    <select name="color-scheme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`);

const select = document.querySelector('.color-scheme select');
const colorSchemes = $$('option', select).map(option => option.value);

function setColorScheme(colorScheme) {
  const scheme = colorSchemes.includes(colorScheme) ? colorScheme : 'light dark';
  document.documentElement.style.setProperty('color-scheme', scheme);
  select.value = scheme;
}

let savedColorScheme;
try {
  savedColorScheme = localStorage.getItem('colorScheme');
} catch {
  // Theme switching still works when the browser disallows storage.
}
setColorScheme(savedColorScheme);

select.addEventListener('input', event => {
  setColorScheme(event.target.value);
  try {
    localStorage.setItem('colorScheme', event.target.value);
  } catch {
    // Keep the chosen theme for this page even if it cannot be saved.
  }
});

// Percent-encode mail fields so spaces, punctuation, and line breaks survive.
const form = document.querySelector('.contact-form');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const parameters = [];

  for (const [name, value] of data) {
    parameters.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }

  location.href = `${form.action}?${parameters.join('&')}`;
});

// Shared by the homepage and Projects page. Let each caller show its own error.
export async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return;

  containerElement.replaceChildren();
  const headingTag = /^h[1-6]$/.test(headingLevel) ? headingLevel : 'h2';

  if (!Array.isArray(projects) || projects.length === 0) {
    const message = document.createElement('p');
    message.className = 'status-message';
    message.textContent = 'No projects to display yet.';
    containerElement.append(message);
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    const heading = document.createElement(headingTag);
    heading.textContent = project.title || 'Untitled project';

    const image = document.createElement('img');
    // Image paths in the data are relative to the site root, on either page.
    image.src = new URL(project.image || 'images/project-placeholder.svg', BASE_URL).href;
    image.alt = project.imageAlt || `Preview of ${heading.textContent}`;
    image.width = 640;
    image.height = 360;
    image.loading = 'lazy';

    const description = document.createElement('div');
    description.className = 'project-description';

    if (project.tools) {
      const tools = document.createElement('p');
      tools.className = 'project-tools';
      tools.textContent = project.tools;
      description.append(tools);
    }

    const summary = document.createElement('p');
    summary.textContent = project.description || 'Description coming soon.';
    description.append(summary);

    if (Array.isArray(project.highlights) && project.highlights.length > 0) {
      const highlights = document.createElement('ul');
      for (const highlight of project.highlights) {
        const item = document.createElement('li');
        item.textContent = highlight;
        highlights.append(item);
      }
      description.append(highlights);
    }

    if (Number.isInteger(project.year)) {
      const year = document.createElement('p');
      year.className = 'project-year';
      year.textContent = project.placeholder ? `Sample year: ${project.year}` : `${project.year}`;
      description.append(year);
    }

    article.append(heading, image, description);
    containerElement.append(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
