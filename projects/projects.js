import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js?v=lab4-latest';

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const clearButton = document.querySelector('.clear-filters');
const status = document.querySelector('.filter-status');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

let projects = [];
let query = '';
let selectedYear = null;
const colors = d3.scaleOrdinal().range(['#2563eb', '#b45309', '#0f766e']);
const arc = d3.arc().innerRadius(0).outerRadius(50);

function selectYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updateProjects();
}

function renderPieChart(searchResults) {
  const data = d3.rollups(searchResults, group => group.length, project => String(project.year))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => d3.descending(a.label, b.label));
  const slices = d3.pie().value(d => d.value).sort(null)(data);

  svg.selectAll('path').data(slices, d => d.data.label).join('path')
    .attr('d', arc)
    .attr('fill', d => colors(d.data.label))
    .attr('class', d => d.data.label === selectedYear ? 'selected' : null)
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', d => `${d.data.label}: ${d.data.value} ${d.data.value === 1 ? 'project' : 'projects'}`)
    .attr('aria-pressed', d => String(d.data.label === selectedYear))
    .on('click', (_, d) => selectYear(d.data.label))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectYear(d.data.label);
      }
    })
    .selectAll('title').data(d => [d]).join('title')
    .text(d => `${d.data.label}: ${d.data.value} projects`);

  const items = legend.selectAll('li').data(data, d => d.label).join('li')
    .attr('class', d => d.label === selectedYear ? 'selected' : null)
    .style('--color', d => colors(d.label));

  items.selectAll('button').data(d => [d]).join('button')
    .attr('type', 'button')
    .attr('aria-pressed', d => String(d.label === selectedYear))
    .attr('aria-label', d => `${d.label}: ${d.value} ${d.value === 1 ? 'project' : 'projects'}`)
    .on('click', (_, d) => selectYear(d.label))
    .each(function (d) {
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.setAttribute('aria-hidden', 'true');
      const count = document.createElement('em');
      count.textContent = `(${d.value})`;
      this.replaceChildren(swatch, `${d.label} `, count);
    });

  document.querySelector('.chart-empty').hidden = data.length > 0;
  svg.attr('hidden', data.length === 0 ? '' : null);
}

function updateProjects() {
  const searchResults = projects.filter(project =>
    Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase().trim())
  );
  // Keep the year as a value: slice indices can change after a search.
  const visibleProjects = searchResults.filter(project =>
    selectedYear === null || String(project.year) === selectedYear
  );
  renderProjects(visibleProjects, projectsContainer, 'h2');
  if (visibleProjects.length === 0) {
    projectsContainer.querySelector('.status-message').textContent =
      'No projects match these filters. Try another search or clear the filters.';
  }
  // Chart the search results so other years remain available to select.
  renderPieChart(searchResults);
  projectsTitle.textContent = `${projects.length} Projects`;
  status.textContent = `Showing ${visibleProjects.length} of ${projects.length} projects` +
    (selectedYear === null ? '' : ` · Year: ${selectedYear}`) +
    (query.trim() ? ` · Search: “${query.trim()}”` : '');
  clearButton.hidden = query === '' && selectedYear === null;
}

searchInput.addEventListener('input', event => {
  query = event.target.value;
  updateProjects();
});

clearButton.addEventListener('click', () => {
  query = '';
  selectedYear = null;
  searchInput.value = '';
  updateProjects();
  searchInput.focus();
});

try {
  projects = await fetchJSON(new URL('../lib/projects.json?v=lab4-latest', import.meta.url));
  colors.domain([...new Set(projects.map(project => String(project.year)))].sort(d3.descending));
  updateProjects();
  searchInput.disabled = false;
} catch (error) {
  console.error('Unable to load projects:', error);
  projectsContainer.textContent = 'Projects could not be loaded. Please try again later.';
  status.textContent = 'Project data is unavailable.';
} finally {
  projectsContainer.setAttribute('aria-busy', 'false');
}
