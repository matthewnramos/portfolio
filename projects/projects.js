import { fetchJSON, renderProjects } from '../global.js';

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

try {
  const projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
  renderProjects(projects, projectsContainer);
  projectsTitle.textContent = `${projects.length} Projects`;
} catch (error) {
  console.error('Unable to load projects:', error);
  projectsContainer.textContent = 'Projects could not be loaded. Please try again later.';
} finally {
  projectsContainer.setAttribute('aria-busy', 'false');
}
