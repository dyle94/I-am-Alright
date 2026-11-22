'use strict';
const INTERVAL_MS = 1000;
const sources = [1, 2, 3].map(n => `url("./assets/${n}.png")`);
const wall = document.querySelector('#wall');
const pauseButton = document.querySelector('#pause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let cells = [];
let selectedCell = null;
const clickSource = 'url("./assets/Click.png")';

function selectCell(cell) {
  if (selectedCell === cell) return;
  if (selectedCell) {
    selectedCell.node.style.backgroundImage = sources[selectedCell.frame];
    selectedCell.node.setAttribute('aria-pressed', 'false');
  }
  selectedCell = cell;
  cell.node.style.backgroundImage = clickSource;
  cell.node.setAttribute('aria-pressed', 'true');
}
let timer;
let layoutKey = '';

function layout() {
  const style = getComputedStyle(wall);
  const columns = Number(style.getPropertyValue('--columns'));
  const gap = parseFloat(style.columnGap) || 0;
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const tileWidth = Math.max(1, (wall.clientWidth - horizontalPadding - gap * (columns - 1)) / columns);
  const rows = Math.max(1, Math.ceil((wall.clientHeight - verticalPadding + gap) / (tileWidth * 1.25 + gap)));
  const key = `${columns}:${rows}`;
  if (key === layoutKey) return;
  layoutKey = key;
  const selectedIndex = selectedCell ? cells.indexOf(selectedCell) : -1;
  const selectedFrame = selectedCell?.frame;
  selectedCell = null;
  const fragment = document.createDocumentFragment();
  cells = Array.from({ length: columns * rows }, (_, index) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.setAttribute('aria-label', `사진 ${index + 1} — 특별 이미지 보기`);
    node.setAttribute('aria-pressed', 'false');
    const frame = Math.floor(Math.random() * 3);
    node.className = 'tile';
    node.style.backgroundImage = sources[frame];
    fragment.append(node);
    const cell = { node, frame };
    node.addEventListener('click', () => selectCell(cell));
    return cell;
  });
  wall.replaceChildren(fragment);
  if (selectedIndex >= 0) {
    const cell = cells[Math.min(selectedIndex, cells.length - 1)];
    cell.frame = selectedFrame;
    selectCell(cell);
  }
}

function advance() {
  for (const cell of cells) {
    if (cell === selectedCell) continue;
    // Choose either of the other two frames: never repeat the current image.
    cell.frame = (cell.frame + 1 + Math.floor(Math.random() * 2)) % 3;
    cell.node.style.backgroundImage = sources[cell.frame];
  }
}

function schedule() {
  clearInterval(timer);
  if (!paused && !document.hidden) timer = setInterval(advance, INTERVAL_MS);
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? '이미지 전환 재생' : '이미지 전환 일시정지');
  pauseButton.setAttribute('aria-pressed', String(paused));
}

pauseButton.addEventListener('click', () => { paused = !paused; schedule(); });
document.addEventListener('visibilitychange', schedule);
reducedMotion.addEventListener('change', event => { paused = event.matches; schedule(); });

Promise.all([1, 2, 3, 'Click'].map(n => new Promise(resolve => {
  const image = new Image();
  image.onload = resolve;
  image.onerror = resolve;
  image.src = `./assets/${n}.png`;
}))).then(() => {
  layout();
  new ResizeObserver(layout).observe(wall);
  schedule();
});
