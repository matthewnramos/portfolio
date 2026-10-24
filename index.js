import { fetchJSON, renderProjects, fetchGitHubData } from './global.js?v=lab4-projects';

const projectsContainer = document.querySelector('.projects');
const profileStats = document.querySelector('#profile-stats');

async function loadLatestProjects() {
  try {
    const projects = await fetchJSON(new URL('./lib/projects.json?v=lab4-projects', import.meta.url));
    renderProjects(projects.slice(0, 3), projectsContainer, 'h3');
  } catch (error) {
    console.error('Unable to load latest projects:', error);
    projectsContainer.textContent = 'Projects could not be loaded. Please try again later.';
  } finally {
    projectsContainer.setAttribute('aria-busy', 'false');
  }
}

async function loadGitHubStats() {
  try {
    const githubData = await fetchGitHubData('matthewnramos');
    const stats = [
      ['Public Repos', githubData.public_repos],
      ['Public Gists', githubData.public_gists],
      ['Followers', githubData.followers],
      ['Following', githubData.following],
    ];
    // Labels are fixed above; only numeric API fields enter this HTML template.
    profileStats.innerHTML = `
      <dl>
        ${stats.map(([label, value]) => `
          <div>
            <dt>${label}</dt>
            <dd>${Number.isInteger(value) ? value : '—'}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  } catch (error) {
    console.error('Unable to load GitHub statistics:', error);
    profileStats.textContent = 'GitHub statistics are unavailable right now. Please try again later.';
  } finally {
    profileStats.setAttribute('aria-busy', 'false');
  }
}

// Start both requests independently so a slow API cannot delay the projects.
await Promise.all([loadLatestProjects(), loadGitHubStats()]);
