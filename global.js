console.log('IT’S ALIVE!');

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
