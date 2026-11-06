const statsContainer = document.querySelector('#stats');
const chartContainer = document.querySelector('#chart');
const tooltip = document.querySelector('#commit-tooltip');
const clearButton = document.querySelector('#clear-selection');
const languageNames = { js: 'JavaScript', css: 'CSS', html: 'HTML', json: 'JSON' };
const selectedIds = new Set();
let d3;
let commits = [];
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
  const fileLengths = d3.rollups(data, lines => d3.max(lines, row => row.line), row => row.file);
  const stats = [
    ['Lines of code', d3.format(',')(data.length)],
    ['Commits', d3.format(',')(commits.length)],
    ['Files', fileLengths.length],
    ['Average file length', `${d3.format(',.0f')(d3.mean(fileLengths, file => file[1]))} lines`],
    ['Longest line', `${d3.max(data, row => row.length)} characters`],
    ['Maximum depth', d3.max(data, row => row.depth)],
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
  document.querySelector('#commit-time').textContent = commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' });
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
  document.querySelector('#selection-help').hidden = selectedCommits.length > 0;
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
  const selectedCommits = commits.filter(commit => selectedIds.has(commit.id));
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
  const height = width < 540 ? 360 : 440;
  const margin = { top: 24, right: 32, bottom: 58, left: 60 };
  const area = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
  const extent = d3.extent(commits, commit => commit.datetime);
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
  chartContainer.replaceChildren();
  const svg = d3.select(chartContainer).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width).attr('height', height)
    .attr('role', 'group').attr('aria-labelledby', 'commits-heading')
    .attr('aria-describedby', 'chart-help');
  svg.append('g').attr('class', 'gridlines')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(d3.range(0, 25, 4)).tickFormat('').tickSize(-(area.right - area.left)))
    .call(group => group.select('.domain').remove());
  svg.append('g').attr('class', 'chart-axis')
    .attr('transform', `translate(0,${area.bottom})`)
    .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(width < 540 ? 14 : 7)).tickFormat(d3.timeFormat('%b %d')));
  svg.append('g').attr('class', 'chart-axis')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(d3.range(0, 25, 4))
      .tickFormat(hour => `${String(hour).padStart(2, '0')}:00`));
  svg.append('text').attr('class', 'axis-label')
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
      for (const commit of commits) {
        if (isCommitSelected(selection, commit)) selectedIds.add(commit.id);
      }
      tooltip.hidden = true;
      renderSelection();
    });
  const brushGroup = svg.append('g').attr('class', 'commit-brush').call(brush);
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
  svg.append('g').attr('class', 'dots').selectAll('circle')
    .data(d3.sort(commits, commit => -commit.totalLines), commit => commit.id)
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
  d3 = await import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm');
  const data = await loadData();
  if (data.some(row => !Number.isFinite(row.line) || !Number.isFinite(row.depth)
    || !Number.isFinite(row.length) || Number.isNaN(+row.datetime))) {
    throw new Error('Invalid code statistics');
  }
  if (data.length === 0) {
    statsContainer.textContent = 'No code statistics are available yet.';
    chartContainer.textContent = 'There are no commits to chart yet.';
  } else {
    commits = processCommits(data);
    renderCommitInfo(data);
    renderScatterPlot();
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
  console.error('Unable to load meta analysis:', error);
} finally {
  statsContainer.setAttribute('aria-busy', 'false');
  chartContainer.setAttribute('aria-busy', 'false');
}
