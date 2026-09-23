/* SVG chart builders. Every function returns a markup string, so views stay declarative. */
window.LD = window.LD || {};

(function () {
  const PALETTE = ["var(--read)", "var(--run)", "var(--spend)", "var(--coffee)", "var(--accent)"];
  const esc = (value) =>
    String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function empty(message) {
    return `<div class="chart-empty">${esc(message || "暂无数据")}</div>`;
  }

  function sparkline(values, options) {
    const opts = options || {};
    const width = 160;
    const height = 34;
    const points = values.map((value) => Number(value) || 0);
    if (points.length < 2) return empty("数据太少");
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const stepX = width / (points.length - 1);
    const coords = points.map((value, index) => [
      index * stepX,
      height - 5 - ((value - min) / span) * (height - 12),
    ]);
    const line = coords.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const areaPath = `${line} L${width} ${height} L0 ${height} Z`;
    const color = opts.color || "var(--accent)";
    const last = coords[coords.length - 1];
    return `<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="趋势迷你图">
      <path d="${areaPath}" fill="${color}" opacity="0.12"></path>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" fill="${color}" vector-effect="non-scaling-stroke"></circle>
    </svg>`;
  }

  function area(series, options) {
    const opts = options || {};
    if (!series.length) return empty(opts.empty);
    const width = 720;
    const height = opts.height || 190;
    const padL = 46;
    const padR = 12;
    const padT = 18;
    const padB = 26;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const values = series.map((point) => Number(point.value) || 0);
    const max = Math.max(...values, 0.0001) * 1.12;
    const xOf = (index) => padL + (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
    const yOf = (value) => padT + innerH - (value / max) * innerH;
    const format = opts.format || ((value) => LD.fmt.decimal(value, 0));
    const color = opts.color || "var(--accent)";
    const unit = opts.unit || "";

    const line = series
      .map((point, index) => `${index ? "L" : "M"}${xOf(index).toFixed(1)} ${yOf(Number(point.value) || 0).toFixed(1)}`)
      .join(" ");
    const areaPath = `${line} L${xOf(series.length - 1).toFixed(1)} ${padT + innerH} L${xOf(0).toFixed(1)} ${padT + innerH} Z`;

    const gridLines = [0, 0.5, 1]
      .map((ratio) => {
        const y = padT + innerH - ratio * innerH;
        const value = max * ratio;
        return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}"></line>
          <text class="chart-label" x="${padL - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${esc(format(value))}${esc(unit)}</text>`;
      })
      .join("");

    const tickIndexes = [0, Math.floor((series.length - 1) / 2), series.length - 1].filter(
      (value, index, list) => list.indexOf(value) === index
    );
    const xLabels = tickIndexes
      .map((index) => {
        const point = series[index];
        const anchor = index === 0 ? "start" : index === series.length - 1 ? "end" : "middle";
        return `<text class="chart-label" x="${xOf(index).toFixed(1)}" y="${height - 8}" text-anchor="${anchor}">${esc(point.label || LD.fmt.dateShort(point.date))}</text>`;
      })
      .join("");

    const dots = series
      .map((point, index) => {
        const value = Number(point.value) || 0;
        return `<circle class="point" cx="${xOf(index).toFixed(1)}" cy="${yOf(value).toFixed(1)}" r="3" style="stroke:${color}">
          <title>${esc(point.date || point.label)} · ${esc(format(value))}${esc(unit)}</title>
        </circle>`;
      })
      .join("");

    return `<svg class="chart chart-area" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.title || "趋势图")}">
      <g class="chart-grid">${gridLines}</g>
      <path d="${areaPath}" fill="${color}" opacity="${opts.fill === false ? 0 : 0.1}"></path>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      ${dots}
      ${xLabels}
    </svg>`;
  }

  function bars(items, options) {
    const opts = options || {};
    if (!items.length) return empty(opts.empty);
    const width = 720;
    const height = opts.height || 170;
    const padL = 46;
    const padR = 12;
    const padT = 20;
    const padB = 26;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const values = items.map((item) => Number(item.value) || 0);
    const goal = Number(opts.goal) || 0;
    const max = Math.max(...values, goal, 0.0001) * 1.2;
    const slot = innerW / items.length;
    const barWidth = Math.min(38, slot * 0.6);
    const format = opts.format || ((value) => LD.fmt.decimal(value, 0));
    const color = opts.color || "var(--accent)";
    const unit = opts.unit || "";
    const maxValue = Math.max(...values);

    const grid = [0, 0.5, 1]
      .map((ratio) => {
        const y = padT + innerH - ratio * innerH;
        return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}"></line>
          <text class="chart-label" x="${padL - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${esc(format(max * ratio))}</text>`;
      })
      .join("");

    const barNodes = items
      .map((item, index) => {
        const value = Number(item.value) || 0;
        const barHeight = Math.max(value > 0 ? 2 : 0, (value / max) * innerH);
        const x = padL + index * slot + (slot - barWidth) / 2;
        const y = padT + innerH - barHeight;
        const isMax = value === maxValue && value > 0;
        const fill = isMax ? color : `color-mix(in srgb, ${color} 42%, var(--surface-3))`;
        return `<g>
          <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="3" fill="${fill}">
            <title>${esc(item.label)} · ${esc(format(value))}${esc(unit)}</title>
          </rect>
          <text class="chart-label" x="${(x + barWidth / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(item.label)}</text>
        </g>`;
      })
      .join("");

    const goalLine = goal
      ? (() => {
          const y = padT + innerH - (goal / max) * innerH;
          return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="4 4"></line>
            <text class="chart-label" x="${width - padR}" y="${(y - 6).toFixed(1)}" text-anchor="end">目标 ${esc(format(goal))}${esc(unit)}</text>`;
        })()
      : "";

    return `<svg class="chart chart-bars" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.title || "柱状图")}">
      <g class="chart-grid">${grid}</g>
      ${barNodes}
      ${goalLine}
    </svg>`;
  }

  function heatmap(days, options) {
    const opts = options || {};
    if (!days.length) return empty(opts.empty);
    const cell = 11;
    const gap = 3;
    const step = cell + gap;
    const offset = new Date(Date.parse(`${days[0].date}T00:00:00Z`)).getUTCDay();
    const columns = Math.ceil((days.length + offset) / 7);
    const labelSpace = 16;
    const width = columns * step;
    const height = 7 * step + labelSpace;
    const max = Math.max(...days.map((day) => Number(day.value) || 0), 1);
    const levelOf = (value) => {
      if (value <= 0) return 0;
      if (value >= max * 0.75) return 4;
      if (value >= max * 0.5) return 3;
      if (value >= max * 0.25) return 2;
      return 1;
    };

    const cells = days
      .map((day, index) => {
        const slot = offset + index;
        const column = Math.floor(slot / 7);
        const row = slot % 7;
        const x = column * step;
        const y = labelSpace + row * step;
        return `<rect class="hm-cell hm-l${levelOf(Number(day.value) || 0)}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2">
          <title>${esc(day.date)} · ${esc(day.label || day.value)}</title>
        </rect>`;
      })
      .join("");

    let currentMonth = "";
    const monthLabels = days
      .map((day, index) => {
        const month = day.date.slice(0, 7);
        if (month === currentMonth) return "";
        currentMonth = month;
        const slot = offset + index;
        const column = Math.floor(slot / 7);
        if (index > 0 && day.date.slice(8, 10) !== "01" && Number(day.date.slice(8, 10)) > 7) return "";
        return `<text class="chart-label" x="${column * step}" y="10">${Number(month.slice(5, 7))}月</text>`;
      })
      .join("");

    return `<svg class="heatmap" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.title || "全年记录热力图")}">
      ${monthLabels}
      ${cells}
    </svg>`;
  }

  function donut(items, options) {
    const opts = options || {};
    const filtered = items.filter((item) => (Number(item.value) || 0) > 0);
    if (!filtered.length) return empty(opts.empty);
    const size = opts.size || 168;
    const thickness = opts.thickness || 17;
    const radius = (size - thickness) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const total = filtered.reduce((sum, item) => sum + item.value, 0);
    let offset = 0;
    const arcs = filtered
      .map((item, index) => {
        const fraction = item.value / total;
        const dash = Math.max(0, fraction * circumference - 2);
        const arc = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none"
          stroke="${item.color || PALETTE[index % PALETTE.length]}" stroke-width="${thickness}"
          stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${center} ${center})">
          <title>${esc(item.label)} · ${esc(opts.format ? opts.format(item.value) : item.value)}</title>
        </circle>`;
        offset += dash + 2;
        return arc;
      })
      .join("");

    const centerValue = opts.centerValue || "";
    const centerLabel = opts.centerLabel || "";
    return `<svg class="chart" viewBox="0 0 ${size} ${size}" style="width:${size}px;max-width:100%;height:auto" role="img" aria-label="${esc(opts.title || "占比图")}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--surface-3)" stroke-width="${thickness}"></circle>
      ${arcs}
      ${centerValue ? `<text x="${center}" y="${center - 2}" text-anchor="middle" font-family="var(--font-mono)" font-size="20" font-weight="600" fill="var(--ink)">${esc(centerValue)}</text>` : ""}
      ${centerLabel ? `<text x="${center}" y="${center + 16}" text-anchor="middle" font-family="var(--font-mono)" font-size="10.5" fill="var(--ink-3)">${esc(centerLabel)}</text>` : ""}
    </svg>`;
  }

  LD.charts = {
    palette: PALETTE,
    color: (index) => PALETTE[index % PALETTE.length],
    sparkline,
    area,
    bars,
    heatmap,
    donut,
    empty,
    esc,
  };
})();
