const statsContainer = document.querySelector('#stats');
const chartContainer = document.querySelector('#chart');
const tooltip = document.querySelector('#commit-tooltip');
const clearButton = document.querySelector('#clear-selection');
const languageNames = { js: 'JavaScript', css: 'CSS', html: 'HTML', json: 'JSON' };
const selectedIds = new Set();
let d3;
let commits = [];
let filteredCommits = [];
let commitProgress = 100;
let commitMaxTime;
let timeScale;
let colors;
let scroller;
let activeStep = -1;
let hideTimer;
let brushBounds = null;
let clearBrush = () => {};

async function loadData() {
  return d3.csv(new URL('loc.csv', import.meta.url), row => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(`${row.date}T00:00${row.timezone}`),
    datetime: new Date(row.datetime),
  }));
}

function processCommits(data) {
  return d3.groups(data, row => row.commit).map(([id, lines]) => {
    const { author, date, time, timezone, datetime } = lines[0];
    const commit = {
      id,
      url: `https://github.com/matthewnramos/portfolio/commit/${id}`,
      author, date, time, timezone, datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60 + datetime.getSeconds() / 3600,
      totalLines: lines.length,
    };
    Object.defineProperty(commit, 'lines', {
      value: lines, enumerable: false, writable: false, configurable: false,
    });
    return commit;
  }).sort((a, b) => a.datetime - b.datetime);
}

function renderCommitInfo(data) {
  const fileLengths = d3.rollups(data, lines => lines.length, row => row.file);
  const stats = [
    ['Lines of code', d3.format(',')(data.length)],
    ['Commits', d3.format(',')(filteredCommits.length)],
    ['Files', fileLengths.length],
    ['Average file length', `${d3.format(',.0f')(d3.mean(fileLengths, file => file[1]) ?? 0)} lines`],
    ['Longest line', `${d3.max(data, row => row.length) ?? 0} characters`],
    ['Maximum depth', d3.max(data, row => row.depth) ?? 0],
  ];
  statsContainer.replaceChildren();
  const dl = d3.select(statsContainer).append('dl').attr('class', 'stats');
  for (const [label, value] of stats) {
    const item = dl.append('div');
    item.append('dt').text(label);
    item.append('dd').text(value);
  }
}

function renderTooltipContent(commit) {
  const link = document.querySelector('#commit-link');
  link.href = commit.url;
  link.textContent = commit.id.slice(0, 8);
  document.querySelector('#commit-date').textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'long' });
  document.querySelector('#tooltip-commit-time').textContent = commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' });
  document.querySelector('#commit-author').textContent = commit.author;
  document.querySelector('#commit-lines').textContent = d3.format(',')(commit.totalLines);
}

function updateTooltipVisibility(visible) {
  clearTimeout(hideTimer);
  if (visible) {
    tooltip.hidden = false;
  } else {
    // Allow the pointer to cross the gap from a dot to the commit link.
    hideTimer = setTimeout(() => {
      if (!tooltip.matches(':hover, :focus-within')) tooltip.hidden = true;
    }, 180);
  }
}

function updateTooltipPosition(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX ?? rect.right;
  const y = event.clientY ?? rect.top;
  const { width, height } = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(8, Math.min(x + 12, innerWidth - width - 8))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(y + 12, innerHeight - height - 8))}px`;
}

function showTooltip(event, commit) {
  renderTooltipContent(commit);
  updateTooltipVisibility(true);
  updateTooltipPosition(event);
}

function renderLanguageBreakdown(selectedCommits) {
  const container = d3.select('#language-breakdown');
  container.selectAll('*').remove();
  const lines = selectedCommits.flatMap(commit => commit.lines);
  const breakdown = d3.rollups(lines, rows => rows.length, row => row.type)
    .sort((a, b) => d3.descending(a[1], b[1]));
  for (const [language, count] of breakdown) {
    const item = container.append('div');
    item.append('dt').text(languageNames[language] || language);
    item.append('dd').text(`${d3.format(',')(count)} ${count === 1 ? 'line' : 'lines'} (${d3.format('.1~%')(count / lines.length)})`);
  }
}

function renderSelection() {
  const selectedCommits = filteredCommits.filter(commit => selectedIds.has(commit.id));
  d3.select(chartContainer).selectAll('.dots circle')
    .classed('selected', commit => selectedIds.has(commit.id))
    .attr('aria-pressed', commit => String(selectedIds.has(commit.id)));
  const count = selectedCommits.length;
  document.querySelector('#selection-count').textContent = count
    ? `${count} ${count === 1 ? 'commit' : 'commits'} selected`
    : 'No commits selected';
  clearButton.disabled = count === 0 && brushBounds === null;
  renderLanguageBreakdown(selectedCommits);
}

function renderScatterPlot() {
  const width = chartContainer.clientWidth;
  if (width < 200) return;
  const height = Math.max(200, Math.min(width < 540 ? 320 : 380, innerHeight * 0.4));
  const margin = { top: 24, right: 32, bottom: 58, left: 60 };
  const area = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
  const extent = d3.extent(filteredCommits, commit => commit.datetime);
  // A one-commit snapshot still needs a nonzero date range.
  if (+extent[0] === +extent[1]) {
    extent[0] = d3.timeDay.offset(extent[0], -1);
    extent[1] = d3.timeDay.offset(extent[1], 1);
  }
  const xScale = d3.scaleTime().domain(extent).range([area.left, area.right]).nice();
  const yScale = d3.scaleLinear().domain([0, 24]).range([area.bottom, area.top]);
  const maxLines = d3.max(commits, commit => commit.totalLines);
  // Starting at zero makes circle area proportional to its line count.
  const rScale = d3.scaleSqrt().domain([0, maxLines]).range([0, width < 540 ? 18 : 28]);
  const svg = d3.select(chartContainer).selectAll('svg').data([null]).join('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width).attr('height', height)
    .attr('role', 'group').attr('aria-labelledby', 'commits-heading')
    .attr('aria-description', 'Each dot is a commit; larger dots represent more surviving lines. Dates use your local time zone. Drag to select commits, or press Enter or Space on a focused dot. Press Escape to clear selection.');
  svg.selectAll('g.gridlines').data([null]).join('g').attr('class', 'gridlines')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(d3.range(0, 25, 4)).tickFormat('').tickSize(-(area.right - area.left)))
    .call(group => group.select('.domain').remove());
  svg.selectAll('g.x-axis').data([null]).join('g').attr('class', 'chart-axis x-axis')
    .attr('transform', `translate(0,${area.bottom})`)
    .call(d3.axisBottom(xScale).ticks(Math.max(2, Math.floor(width / 110))).tickFormat(d3.timeFormat('%b %d')));
  svg.selectAll('g.y-axis').data([null]).join('g').attr('class', 'chart-axis y-axis')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(d3.range(0, 25, 4))
      .tickFormat(hour => `${String(hour).padStart(2, '0')}:00`));
  svg.selectAll('text.axis-label').data([null]).join('text').attr('class', 'axis-label')
    .attr('x', (area.left + area.right) / 2).attr('y', height - 8)
    .attr('text-anchor', 'middle').text('Commit date');

  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  const brush = d3.brush().extent([[area.left, area.top], [area.right, area.bottom]])
    .on('start brush end', event => {
      const selection = event.selection;
      brushBounds = selection ? {
        start: xScale.invert(selection[0][0]), end: xScale.invert(selection[1][0]),
        low: yScale.invert(selection[1][1]), high: yScale.invert(selection[0][1]),
      } : null;
      selectedIds.clear();
      for (const commit of filteredCommits) {
        if (isCommitSelected(selection, commit)) selectedIds.add(commit.id);
      }
      tooltip.hidden = true;
      renderSelection();
    });
  const brushGroup = svg.selectAll('g.commit-brush').data([null]).join('g').attr('class', 'commit-brush').call(brush);
  clearBrush = () => brushGroup.call(brush.move, null);
  if (brushBounds) {
    brushGroup.call(brush.move, [
      [xScale(brushBounds.start), yScale(brushBounds.high)],
      [xScale(brushBounds.end), yScale(brushBounds.low)],
    ]);
  }

  function toggleCommit(commit) {
    const nextIds = new Set(selectedIds);
    if (nextIds.has(commit.id)) nextIds.delete(commit.id);
    else nextIds.add(commit.id);
    clearBrush();
    for (const id of nextIds) selectedIds.add(id);
    renderSelection();
  }

  // Draw dots after the brush so its overlay cannot swallow tooltip events.
  svg.selectAll('g.dots').data([null]).join('g').attr('class', 'dots').raise().selectAll('circle')
    .data(d3.sort(filteredCommits, commit => -commit.totalLines), commit => commit.id)
    .join('circle')
    .attr('cx', commit => xScale(commit.datetime)).attr('cy', commit => yScale(commit.hourFrac))
    .attr('r', commit => rScale(commit.totalLines))
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', commit => `${commit.id.slice(0, 8)}, ${commit.datetime.toLocaleString('en')}, ${commit.totalLines} ${commit.totalLines === 1 ? 'line' : 'lines'}. Toggle selection.`)
    .on('mouseenter focus', showTooltip)
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave blur', () => updateTooltipVisibility(false))
    .on('click', (event, commit) => {
      toggleCommit(commit);
      showTooltip(event, commit);
    })
    .on('keydown', (event, commit) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCommit(commit);
        showTooltip(event, commit);
      }
    });
  renderSelection();
}

function updateScatterPlot() {
  renderScatterPlot();
}

function updateFileDisplay() {
  const files = d3.groups(filteredCommits.flatMap(commit => commit.lines), line => line.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length || a.name.localeCompare(b.name));
  const rows = d3.select('#files').selectAll('div.file-row').data(files, file => file.name)
    .join(enter => enter.append('div').attr('class', 'file-row').call(row => {
      const label = row.append('dt');
      label.append('code');
      label.append('small');
      row.append('dd');
    })).order();
  rows.select('code').text(file => file.name);
  rows.select('small').text(file => `${d3.format(',')(file.lines.length)} lines`);
  rows.select('dd').attr('aria-label', file => `${file.lines.length} lines in ${file.name}`)
    .selectAll('.loc').data(file => file.lines, line => line.line)
    .join('div').attr('class', 'loc').attr('aria-hidden', 'true')
    .style('--color', line => colors(line.type))
    .attr('title', line => `${languageNames[line.type] || line.type}, line ${line.line}, ${line.datetime.toLocaleDateString()}`);
}

function setCommitTime(datetime) {
  commitMaxTime = datetime;
  commitProgress = +timeScale.domain()[0] === +timeScale.domain()[1] ? 100 : timeScale(datetime);
  filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
  clearBrush();
  tooltip.hidden = true;
  for (const id of ['commit-progress', 'file-progress']) {
    const slider = document.getElementById(id);
    slider.value = commitProgress;
    slider.setAttribute('aria-valuetext', commitMaxTime.toLocaleString());
  }
  for (const id of ['commit-time', 'file-time']) {
    const time = document.getElementById(id);
    time.dateTime = commitMaxTime.toISOString();
    time.textContent = commitMaxTime.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
  }
  document.querySelector('#timeline-status').textContent = `${filteredCommits.length} of ${commits.length} commits shown`;
  activeStep = filteredCommits.length - 1;
  d3.selectAll('#scatter-story .step').classed('is-active', (_, index) => index === activeStep)
    .attr('aria-current', (_, index) => index === activeStep ? 'step' : null);
  renderCommitInfo(filteredCommits.flatMap(commit => commit.lines));
  updateScatterPlot();
  updateFileDisplay();
}

function onTimeSliderChange(event) {
  commitProgress = Number(event.target.value);
  setCommitTime(timeScale.invert(commitProgress));
}

function renderStory(scrollama) {
  const story = d3.select('#scatter-story');
  story.selectAll('*').remove();
  const steps = story.selectAll('.step').data(commits, commit => commit.id).join('div').attr('class', 'step');
  steps.append('h3').text((_, index) => index === 0 ? 'The first surviving lines' : `Commit ${index + 1}`);
  steps.append('time').attr('datetime', commit => commit.datetime.toISOString())
    .text(commit => commit.datetime.toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' }));
  steps.append('p').each(function(commit) {
    const files = d3.rollups(commit.lines, lines => lines.length, line => line.file).sort((a, b) => b[1] - a[1]);
    d3.select(this).text(`${d3.format(',')(commit.totalLines)} lines in this snapshot come from this commit, across ${files.length} ${files.length === 1 ? 'file' : 'files'}. The largest contribution is in ${files[0][0]}.`);
  });
  steps.append('a').attr('href', commit => commit.url).attr('target', '_blank').attr('rel', 'noopener noreferrer')
    .text(commit => `View commit ${commit.id.slice(0, 8)}`);
  scroller = scrollama();
  scroller.setup({ step: '#scrolly-1 .step', offset: 0.65 })
    .onStepEnter(({ element }) => setCommitTime(element.__data__.datetime));
  window.addEventListener('resize', () => scroller.resize());
}

clearButton.addEventListener('click', () => clearBrush());
tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
tooltip.addEventListener('mouseleave', () => updateTooltipVisibility(false));
tooltip.addEventListener('focusout', () => updateTooltipVisibility(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    clearBrush();
    tooltip.hidden = true;
  }
});

try {
  const libraries = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm'),
    import('https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm'),
  ]);
  d3 = libraries[0];
  const data = await loadData();
  if (data.some(row => !Number.isFinite(row.line) || !Number.isFinite(row.depth)
    || !Number.isFinite(row.length) || Number.isNaN(+row.datetime))) {
    throw new Error('Invalid code statistics');
  }
  if (data.length === 0) {
    statsContainer.textContent = 'No code statistics are available yet.';
    chartContainer.textContent = 'There are no commits to chart yet.';
    document.querySelector('#scatter-story').textContent = 'Run npm run analyze after your first commit to create the history.';
    document.querySelector('#files').replaceChildren();
    document.querySelector('#file-status').textContent = 'No lines to display yet. Run npm run analyze after your first commit.';
  } else {
    commits = processCommits(data);
    document.querySelector('#file-status').hidden = true;
    timeScale = d3.scaleTime().domain(d3.extent(commits, commit => commit.datetime)).range([0, 100]);
    colors = d3.scaleOrdinal(d3.schemeTableau10).domain([...new Set(data.map(line => line.type))].sort());
    d3.select('#file-legend').selectAll('li').data(colors.domain()).join('li').each(function(type) {
      d3.select(this).append('span').attr('class', 'swatch').style('--color', colors(type)).attr('aria-hidden', 'true');
      d3.select(this).append('span').text(languageNames[type] || type);
    });
    renderStory(libraries[1].default);
    setCommitTime(d3.max(commits, commit => commit.datetime));
    for (const id of ['commit-progress', 'file-progress']) {
      const slider = document.getElementById(id);
      slider.disabled = false;
      slider.addEventListener('input', onTimeSliderChange);
    }
    let previousWidth = chartContainer.clientWidth;
    new ResizeObserver(() => {
      if (chartContainer.clientWidth === previousWidth) return;
      previousWidth = chartContainer.clientWidth;
      tooltip.hidden = true;
      renderScatterPlot();
    }).observe(chartContainer);
  }
} catch (error) {
  statsContainer.textContent = 'Code statistics could not be loaded. Please refresh to try again.';
  chartContainer.textContent = 'The commit chart is unavailable.';
  document.querySelector('#scatter-story').textContent = 'Commit history could not be loaded. Refresh to try again.';
  document.querySelector('#files').replaceChildren();
  document.querySelector('#file-status').hidden = false;
  document.querySelector('#file-status').textContent = 'File sizes could not be loaded. Refresh to try again.';
  console.error('Unable to load meta analysis:', error);
} finally {
  statsContainer.setAttribute('aria-busy', 'false');
  chartContainer.setAttribute('aria-busy', 'false');
}
