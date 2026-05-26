const SVG_NS = "http://www.w3.org/2000/svg";

const TOWER_PATH = `
  M 640 360
  L 685 326
  L 720 267
  L 738 203
  L 742 135
  Q 745 120 758 119
  L 770 116
  L 778 114
  L 815 113
  L 838 114
  L 850 116
  Q 858 119 860 135
  L 864 203
  L 882 267
  L 918 326
  L 960 360
  Z
`;

const COLUMN_LINES = [750, 760, 775, 790, 805, 820, 835, 848].map((x) => ({
  x,
  y1: 139,
  y2: 258,
}));

let mounted = false;

export function mountHorizon() {
  if (mounted) return;
  mounted = true;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("horizon");
  svg.setAttribute("viewBox", "0 0 1600 400");
  svg.setAttribute("preserveAspectRatio", "xMidYMax slice");

  const columnLines = COLUMN_LINES.map(
    (c) =>
      `<line x1="${c.x}" y1="${c.y1}" x2="${c.x}" y2="${c.y2}" stroke="#1d1740" stroke-width="1" opacity="0.6"/>`
  ).join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="35%" stop-color="#43308c" stop-opacity="0.55"/>
        <stop offset="75%" stop-color="#6a4cc4" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#8a6ee0" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="towerHalo" cx="50%" cy="92%" r="32%" fx="50%" fy="92%">
        <stop offset="0%" stop-color="#b69af0" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="#7a5acc" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#3a2a80" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="towerFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#070518"/>
        <stop offset="100%" stop-color="#020108"/>
      </linearGradient>
      <linearGradient id="groundFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#06040f"/>
        <stop offset="100%" stop-color="#000"/>
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="1600" height="400" fill="url(#horizonGlow)"/>
    <rect x="350" y="60" width="900" height="320" fill="url(#towerHalo)"/>

    <path d="${TOWER_PATH}" fill="url(#towerFill)"/>
    <g class="tower-columns">${columnLines}</g>

    <rect x="0" y="345" width="1600" height="55" fill="url(#groundFill)"/>
  `;

  document.body.appendChild(svg);
}
