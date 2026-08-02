// ==================== Unicode Ranges ====================
const UNICODE_RANGES = [
  { name: 'C0控制符+基本拉丁文(ANSI)', nameEn: 'C0 Controls + Basic Latin (ANSI)', start: 0x0000, end: 0x007F },
  { name: '拉丁文补充-1', nameEn: 'Latin-1 Supplement', start: 0x0080, end: 0x00FF },
  { name: '拉丁文扩展-A', nameEn: 'Latin Extended-A', start: 0x0100, end: 0x017F },
  { name: '拉丁文扩展-B', nameEn: 'Latin Extended-B', start: 0x0180, end: 0x024F },
  { name: '国际音标扩展', nameEn: 'IPA Extensions', start: 0x0250, end: 0x02AF },
  { name: '修饰用间隔符号', nameEn: 'Spacing Modifier Letters', start: 0x02B0, end: 0x02FF },
  { name: '组合附加符号', nameEn: 'Combining Diacritical Marks', start: 0x0300, end: 0x036F },
  { name: '希腊文和科普特文', nameEn: 'Greek and Coptic', start: 0x0370, end: 0x03FF },
  { name: '西里尔文', nameEn: 'Cyrillic', start: 0x0400, end: 0x04FF },
  { name: '西里尔文补充', nameEn: 'Cyrillic Supplement', start: 0x0500, end: 0x052F },
  { name: '亚美尼亚文', nameEn: 'Armenian', start: 0x0530, end: 0x058F },
  { name: '希伯来文', nameEn: 'Hebrew', start: 0x0590, end: 0x05FF },
  { name: '阿拉伯文', nameEn: 'Arabic', start: 0x0600, end: 0x06FF },
  { name: '天城文', nameEn: 'Devanagari', start: 0x0900, end: 0x097F },
  { name: '孟加拉文', nameEn: 'Bengali', start: 0x0980, end: 0x09FF },
  { name: '通用标点符号', nameEn: 'General Punctuation', start: 0x2000, end: 0x206F },
  { name: '货币符号', nameEn: 'Currency Symbols', start: 0x20A0, end: 0x20CF },
  { name: '类字母符号', nameEn: 'Letterlike Symbols', start: 0x2100, end: 0x214F },
  { name: '箭头', nameEn: 'Arrows', start: 0x2190, end: 0x21FF },
  { name: '数学运算符', nameEn: 'Mathematical Operators', start: 0x2200, end: 0x22FF },
  { name: '制表符', nameEn: 'Box Drawing', start: 0x2500, end: 0x257F },
  { name: '方块元素', nameEn: 'Block Elements', start: 0x2580, end: 0x259F },
  { name: '几何图形', nameEn: 'Geometric Shapes', start: 0x25A0, end: 0x25FF },
  { name: '杂项符号', nameEn: 'Miscellaneous Symbols', start: 0x2600, end: 0x26FF },
  { name: 'CJK符号和标点', nameEn: 'CJK Symbols and Punctuation', start: 0x3000, end: 0x303F },
  { name: '平假名', nameEn: 'Hiragana', start: 0x3040, end: 0x309F },
  { name: '片假名', nameEn: 'Katakana', start: 0x30A0, end: 0x30FF },
  { name: '谚文兼容字母', nameEn: 'Hangul Compatibility Jamo', start: 0x3130, end: 0x318F },
  { name: '带括号CJK字母月份', nameEn: 'Enclosed CJK Letters and Months', start: 0x3200, end: 0x32FF },
  { name: 'CJK统一表意文字', nameEn: 'CJK Unified Ideographs', start: 0x4E00, end: 0x9FFF },
  { name: '谚文音节', nameEn: 'Hangul Syllables', start: 0xAC00, end: 0xD7AF },
  { name: '私用区', nameEn: 'Private Use Area', start: 0xE000, end: 0xF8FF },
  { name: '半角/全角形式', nameEn: 'Halfwidth and Fullwidth Forms', start: 0xFF00, end: 0xFFEF },
  { name: '特殊字符', nameEn: 'Special Characters', start: 0xFFF0, end: 0xFFFF },
];

// 根据当前语言返回分组名
function getRangeName(range) {
  return (lang === 'en' && range.nameEn) ? range.nameEn : range.name;
}

// ==================== State ====================
let font = null;
let selectedCode = null;
let selectedCodes = new Set();
let editorZoom = 10;
let fgColorVal = '#FFAA00';
let bgColorVal = '#030303';
let isDrawing = false;
let groupCanvasCache = new Map();
let searchHighlightCode = null;
let showRuler = true;
let guides = [];
let guidePreview = null;
let rulerDragging = null;


// ==================== DOM Refs ====================
const $ = id => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('file-input');
const leftPanel = $('left-panel');
const infoContent = $('info-content');
const infoGrid = $('info-grid');
const fontWidthInput = $('font-width-input');
const fontHeightInput = $('font-height-input');
const charGroupList = $('char-group-list');
const searchInput = $('search-input');
const editorCanvas = $('editor-canvas');
const editorContainer = $('editor-container');
const editorZoomSlider = $('editor-zoom');
const previewCanvas = $('preview-canvas');
const textInput = $('text-input');
const fgColorInput = $('fg-color');
const bgColorInput = $('bg-color');
const previewScaleSlider = $('preview-scale');
const glyphInfo = $('glyph-info');
const glyphWidthInput = $('glyph-width-input');
const batchInfo = $('batch-info');
const batchWidthInput = $('batch-width-input');
const batchInfoBar = $('batch-info-bar');
const sysFontFamily = $('sys-font-family');
const navDropdown = $('nav-dropdown');

// ==================== Utilities ====================
function readU32LE(view, off) { return view.getUint32(off, true); }

function encodePixels(pixels, stride) {
  const h = pixels.length;
  if (!h) return new Uint8Array(0);
  const w = pixels[0].length;
  const data = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[y] && pixels[y][x]) {
        data[y * stride + (x >> 3)] |= (1 << (7 - (x & 7)));
      }
    }
  }
  return data;
}

function decodePixels(data, symWidth, fontDataHeight, stride) {
  const pixels = [];
  for (let y = 0; y < fontDataHeight; y++) {
    const row = [];
    for (let x = 0; x < symWidth; x++) {
      const byteIdx = y * stride + (x >> 3);
      const bit = 7 - (x & 7);
      row.push((data[byteIdx] >> bit) & 1);
    }
    pixels.push(row);
  }
  return pixels;
}

function makeGlyph(pixels, symWidth, fontDataHeight, fontHeight) {
  const displayH = Math.max(fontHeight, fontDataHeight);
  const displayPixels = [];
  for (let y = 0; y < displayH; y++) {
    displayPixels.push(y < fontDataHeight ? pixels[y] : new Array(symWidth).fill(0));
  }
  return { width: symWidth, height: displayH, pixels: displayPixels };
}

// ==================== SC→TC Conversion (来自 STConversion.js) ====================
// scToTc() 定义在 STConversion.js 中

const COMMON_FONTS = [
  'Arial','Times New Roman','Courier New','Verdana','Tahoma','Segoe UI',
  'Calibri','Cambria','Consolas','Georgia','Trebuchet MS','Palatino Linotype',
  'Lucida Console','Impact','Comic Sans MS','Microsoft Sans Serif',
  'SimSun','SimHei','Microsoft YaHei','FangSong','KaiTi','DengXian',
  'NSimSun','YouYuan','LiSu','STSong','STKaiti','STFangsong','STXihei',
  'FZShuTi','FZXiaoBiaoSongB05','Source Han Sans','Source Han Serif',
  'Noto Sans CJK SC','Noto Serif CJK SC','WenQuanYi Micro Hei',
  'DejaVu Sans','DejaVu Serif','DejaVu Sans Mono','Liberation Sans',
  'Liberation Serif','Liberation Mono','Ubuntu','Ubuntu Mono',
];

const FONT_CN_NAMES = {
  'SimSun': '宋体', 'NSimSun': '新宋体', 'SimHei': '黑体',
  'Microsoft YaHei': '微软雅黑', 'Microsoft JhengHei': '微软正黑体',
  'FangSong': '仿宋', 'KaiTi': '楷体', 'DengXian': '等线',
  'YouYuan': '幼圆', 'LiSu': '隶书',
  'STSong': '华文宋体', 'STKaiti': '华文楷体', 'STFangsong': '华文仿宋',
  'STXihei': '华文细黑', 'STXingkai': '华文行楷', 'STXinwei': '华文新魏',
  'FZShuTi': '方正舒体', 'FZXiaoBiaoSongB05': '方正小标宋',
  'Source Han Sans': '思源黑体', 'Source Han Serif': '思源宋体',
  'Noto Sans CJK SC': 'Noto 无衬线 CJK', 'Noto Serif CJK SC': 'Noto 衬线 CJK',
  'WenQuanYi Micro Hei': '文泉驿微米黑',
  'Microsoft Sans Serif': '微软无衬线',
  'Comic Sans MS': 'Comic Sans',
  'Trebuchet MS': 'Trebuchet',
  'Palatino Linotype': 'Palatino',
  'Lucida Console': 'Lucida',
  'Liberation Sans': 'Liberation 无衬线',
  'Liberation Serif': 'Liberation 衬线',
  'Liberation Mono': 'Liberation 等宽',
  'DejaVu Sans': 'DejaVu 无衬线',
  'DejaVu Serif': 'DejaVu 衬线',
  'DejaVu Sans Mono': 'DejaVu 等宽',
};

function showToast(msg, err) {
  const toast = document.createElement('div');
  toast.className = 'toast' + (err ? ' toast-error' : '');
  toast.textContent = msg;
  $('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ==================== Font Parsing ====================
function handleFile(file) {
  if (!file) return;
  if (!file.name.match(/\.fnt$/i)) { showToast(t('toast.selectFnt'), true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      parseFont(new Uint8Array(e.target.result));
      showToast(t('toast.fontLoaded', { type: lang === 'zh' ? font.fontType : font.fontTypeEn, n: Object.keys(font.glyphs).length }), false);
    } catch (ex) { showToast(t('toast.parseFailed', { msg: ex.message }), true); }
  };
  reader.readAsArrayBuffer(file);
}

function parseFont(data) {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = String.fromCharCode(data[0], data[1], data[2], data[3]);
  let fontType, fontTypeEn;
  if (magic === 'FoNt') { fontType = 'RA2 非 Unicode'; fontTypeEn = 'RA2 Non-Unicode'; }
  else if (magic === 'fonT') { fontType = 'RA2 Unicode'; fontTypeEn = 'RA2 Unicode'; }
  else throw new Error(t('toast.invalidMagic', { magic }));
  const isUnicode = (magic === 'fonT');
  let stride, fontDataHeight, fontHeight, symDataSize, glyphs;

  if (isUnicode) {
    const spaceWidth = readU32LE(dv, 0x04);
    stride = readU32LE(dv, 0x08);
    fontDataHeight = readU32LE(dv, 0x0C);
    fontHeight = readU32LE(dv, 0x10);
    const count = readU32LE(dv, 0x14);
    symDataSize = readU32LE(dv, 0x18);
    const expectedSymSize = 1 + stride * fontDataHeight;
    if (symDataSize !== expectedSymSize)
      showToast(t('toast.warnSymSize', { a: symDataSize, b: expectedSymSize }), false);
    const indexOff = 0x1C;
    const indexSize = 0x10000 * 2;
    const dataOff = indexOff + indexSize;
    const uniqueSymbols = [];
    let readOff = dataOff;
    for (let i = 0; i < count; i++) {
      if (readOff + symDataSize > data.length) break;
      const symWidth = data[readOff];
      const imgData = data.slice(readOff + 1, readOff + symDataSize);
      const pixels = decodePixels(imgData, symWidth, fontDataHeight, stride);
      uniqueSymbols.push(makeGlyph(pixels, symWidth, fontDataHeight, fontHeight));
      readOff += symDataSize;
    }
    const indexView = new Uint16Array(data.buffer, data.byteOffset + indexOff, 0x10000);
    glyphs = {};
    for (let code = 0; code < 0x10000; code++) {
      const idx = indexView[code];
      if (idx === 0) continue;
      const symIdx = idx - 1;
      if (symIdx < uniqueSymbols.length) glyphs[code] = uniqueSymbols[symIdx];
    }
    // Build shared symbol map
    const symToCodes = {};
    for (let code = 0; code < 0x10000; code++) {
      const idx = indexView[code];
      if (idx === 0) continue;
      if (!symToCodes[idx]) symToCodes[idx] = [];
      symToCodes[idx].push(code);
    }
    const sharedCodes = new Set();
    for (const codes of Object.values(symToCodes))
      if (codes.length > 1) codes.forEach(c => sharedCodes.add(c));
    font = { isUnicode, fontWidth: spaceWidth, stride, lines: fontDataHeight, fontHeight, symDataSize, glyphs, fontType, fontTypeEn, _raw: data, _sharedCodes: sharedCodes, _magic: magic, _count: count };
  } else {
    const fontWidth = readU32LE(dv, 0x04);
    stride = readU32LE(dv, 0x08);
    fontDataHeight = readU32LE(dv, 0x0C);
    fontHeight = readU32LE(dv, 0x10);
    const dword10 = readU32LE(dv, 0x14);
    symDataSize = readU32LE(dv, 0x18);
    const dword1C = readU32LE(dv, 0x1C);
    const dword20 = readU32LE(dv, 0x20);
    const dword24 = readU32LE(dv, 0x24);
    const startSym = readU32LE(dv, 0x28);
    const endSym = readU32LE(dv, 0x2C);
    const expectedSymSize = 1 + stride * fontDataHeight;
    if (symDataSize !== expectedSymSize)
      showToast(t('toast.warnSymSize', { a: symDataSize, b: expectedSymSize }), false);
    const glyphCount = endSym - startSym + 1;
    glyphs = {};
    for (let i = 0; i < glyphCount; i++) {
      const code = startSym + i;
      const off = 0x30 + symDataSize * i;
      if (off + symDataSize > data.length) break;
      const symWidth = data[off];
      const imgData = data.slice(off + 1, off + symDataSize);
      const pixels = decodePixels(imgData, symWidth, fontDataHeight, stride);
      glyphs[code] = makeGlyph(pixels, symWidth, fontDataHeight, fontHeight);
    }
    font = { isUnicode, fontWidth, stride, lines: fontDataHeight, fontHeight, symDataSize, glyphs, fontType, fontTypeEn, _raw: data, _startSym: startSym, _endSym: endSym, _magic: magic, _glyphCount: glyphCount, _bpp: dword10 };
  }

  renderInfoGrid();

  selectedCode = null;
  selectedCodes.clear();
  groupCanvasCache.clear();
  searchHighlightCode = null;
  dirtyGlyphs.clear();
  // 保存每个字符的原始字形快照,供"还原"按钮使用
  font._originals = new Map();
  for (const c of Object.keys(glyphs)) {
    const g = glyphs[c];
    font._originals.set(Number(c), { width: g.width, height: g.height, pixels: g.pixels.map(r => [...r]) });
  }
  fontWidthInput.value = font.lines;
  fontHeightInput.value = font.fontHeight;
  dropzone.classList.add('dropped');
  dropzone.textContent = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : t('toast.loadedFont');
  leftPanel.classList.remove('no-font');
  infoContent.style.display = 'block';
  document.querySelector('#info-section .toggle-icon').textContent = '⌵';
  buildCharGroups();
  updateEditorAndRightPanel();
  renderPreview();
  updateUndoRedoButtons();
}

// 渲染字体信息网格(文本随当前语言)
function renderInfoGrid() {
  if (!font) return;
  const dt = k => `<dt>${t(k)}</dt>`;
  const typeName = lang === 'zh' ? font.fontType : font.fontTypeEn;
  if (font.isUnicode) {
    infoGrid.innerHTML =
      dt('info.format') + `<dd>${typeName}</dd>` +
      dt('info.magic') + `<dd>${font._magic}</dd>` +
      dt('info.charWidth') + `<dd>${font.lines}</dd>` +
      dt('info.stride') + `<dd>${font.stride} ${t('unit.bytes')}</dd>` +
      dt('info.fontHeight') + `<dd>${font.fontHeight} ${t('unit.pixels')}</dd>` +
      dt('info.uniqueSymbols') + `<dd>${font._count}</dd>` +
      dt('info.symDataSize') + `<dd>${font.symDataSize}</dd>` +
      dt('info.mappedChars') + `<dd>${Object.keys(font.glyphs).length} / 0x10000</dd>` +
      dt('info.fileSize') + `<dd>${font._raw.byteLength} ${t('unit.bytes')}</dd>`;
  } else {
    infoGrid.innerHTML =
      dt('info.format') + `<dd>${typeName}</dd>` +
      dt('info.magic') + `<dd>${font._magic}</dd>` +
      dt('info.charWidth') + `<dd>${font.lines}</dd>` +
      dt('info.stride') + `<dd>${font.stride} ${t('unit.bytes')}</dd>` +
      dt('info.fontHeight') + `<dd>${font.fontHeight} ${t('unit.pixels')}</dd>` +
      dt('info.bpp') + `<dd>${font._bpp}</dd>` +
      dt('info.symDataSize') + `<dd>${font.symDataSize}</dd>` +
      dt('info.charRange') + `<dd>0x${font._startSym.toString(16)} - 0x${font._endSym.toString(16)} ${t('info.totalCount', { n: font._glyphCount })}</dd>` +
      dt('info.fileSize') + `<dd>${font._raw.byteLength} ${t('unit.bytes')}</dd>`;
  }
}

// ==================== Left Panel: Character Groups ====================
function buildCharGroups() {
  charGroupList.innerHTML = '';
  const searchRow = document.querySelector('.search-row');
  if (!font) {
    charGroupList.style.display = 'none';
    if (searchRow) searchRow.style.display = 'none';
    return;
  }
  charGroupList.style.display = 'flex';
  if (searchRow) searchRow.style.display = 'flex';
  let anyVisible = false;

  for (const range of UNICODE_RANGES) {
    const codes = [];
    for (let c = range.start; c <= range.end; c++) {
      if (font.glyphs[c]) codes.push(c);
    }
    if (codes.length === 0) continue;
    anyVisible = true;
    renderGroup(range, codes);
  }

  if (!anyVisible) {
    const p = document.createElement('div');
    p.style.cssText = 'font-size:12px;color:#6c7086;padding:8px;';
    p.textContent = t('noCharsInFont');
    charGroupList.appendChild(p);
  }
  updateBatchInfo();
  populateNavDropdown();
}

function renderGroup(range, codes) {
  const section = document.createElement('div');
  section.className = 'char-group';
  section.dataset.rangeStart = range.start;
  section.dataset.rangeEnd = range.end;

  const header = document.createElement('div');
  header.className = 'char-group-header';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'group-check';
  const toggle = document.createElement('span');
  toggle.className = 'toggle';
  toggle.textContent = '❯';
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = getRangeName(range);
  const count = document.createElement('span');
  count.className = 'count';
  count.textContent = `${codes.length}`;
  const addBtn = document.createElement('button');
  addBtn.className = 'add-missing-btn';
  addBtn.textContent = '+';
  addBtn.title = t('group.addMissing.title');

  header.appendChild(check);
  header.appendChild(toggle);
  header.appendChild(label);
  header.appendChild(count);

  const sharedCount = font._sharedCodes ? codes.filter(c => font._sharedCodes.has(c)).length : 0;
  if (sharedCount > 0) {
    const sharedSpan = document.createElement('span');
    sharedSpan.style.cssText = 'color:#b7b;font-size:10px;margin-left:2px';
    sharedSpan.textContent = t('group.shared', { n: sharedCount });
    header.appendChild(sharedSpan);
  }

  header.appendChild(addBtn);

  const body = document.createElement('div');
  body.className = 'char-group-body collapsed';

  const cellW = Math.max(font.lines || 16, 8) + 2;
  const cellH = font.fontHeight + 2;
  const panelW = charGroupList.clientWidth || 240;
  const cols = Math.max(1, Math.floor((panelW - 8) / cellW));
  const rows = Math.ceil(codes.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext('2d');

  // Fill background
  const grpBg = bgColorVal === 'transparent' ? '#212121' : bgColorVal;
  ctx.fillStyle = grpBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Track hit areas
  const hitMap = [];
  codes.forEach((code, i) => {
    const g = font.glyphs[code];
    if (!g) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = col * cellW + 1;
    const by = row * cellH + 1;

    // 选中高亮由选区覆盖层绘制,不再写入字符画布,避免选择变化时重绘全部画布
    // Draw pixels(字符在格子内居中,窄字符不再靠左)
    ctx.fillStyle = fgColorVal;
    const cx = Math.max(0, Math.floor((cellW - 2 - g.width) / 2));
    const cy = Math.max(0, Math.floor((cellH - 2 - g.height) / 2));
    for (let y = 0; y < g.height && y < cellH - 2; y++) {
      for (let x = 0; x < g.width && x < cellW - 2; x++) {
        if (g.pixels[y] && g.pixels[y][x]) {
          ctx.fillRect(bx + cx + x, by + cy + y, 1, 1);
        }
      }
    }

    hitMap.push({ code, bx: col * cellW, by: row * cellH, w: cellW, h: cellH });
  });

  // Draw shared marker (选中高亮由选区覆盖层绘制)
  codes.forEach((code, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (font._sharedCodes && font._sharedCodes.has(code)) {
      ctx.fillStyle = '#f9e2af';
      ctx.fillRect(col * cellW + cellW - 4, row * cellH + 1, 3, 3);
    }
  });

  canvas._hitMap = hitMap;

  // Drag overlay for selection
  const dragOverlay = document.createElement('div');
  dragOverlay.style.cssText = 'position:absolute;pointer-events:none;display:none;border:1px solid #89b4fa;background:rgba(137,180,250,0.12);z-index:5';
  body.appendChild(dragOverlay);

  let dragActive = false, dragStartX = 0, dragStartY = 0;

  const getCanvasXY = e => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const pt = getCanvasXY(e);
    dragStartX = pt.x; dragStartY = pt.y;
    dragActive = false;
    e.preventDefault();
  });

  canvas.addEventListener('mousemove', e => {
    if (e.buttons !== 1) return;
    const pt = getCanvasXY(e);
    const dx = Math.abs(pt.x - dragStartX);
    const dy = Math.abs(pt.y - dragStartY);
    if (dx > 3 || dy > 3) {
      dragActive = true;
      const x1 = Math.min(dragStartX, pt.x), x2 = Math.max(dragStartX, pt.x);
      const y1 = Math.min(dragStartY, pt.y), y2 = Math.max(dragStartY, pt.y);
      dragOverlay.style.display = 'block';
      dragOverlay.style.left = x1 + 'px';
      dragOverlay.style.top = y1 + 'px';
      dragOverlay.style.width = (x2 - x1) + 'px';
      dragOverlay.style.height = (y2 - y1) + 'px';
    }
  });

  canvas.addEventListener('mouseup', e => {
    dragOverlay.style.display = 'none';
    const pt = getCanvasXY(e);

    if (dragActive) {
      const x1 = Math.min(dragStartX, pt.x), x2 = Math.max(dragStartX, pt.x);
      const y1 = Math.min(dragStartY, pt.y), y2 = Math.max(dragStartY, pt.y);
      const changed = [];
      for (const h of hitMap) {
        if (x2 > h.bx && x1 < h.bx + h.w && y2 > h.by && y1 < h.by + h.h) {
          if (e.ctrlKey || e.metaKey) {
            selectedCodes.delete(h.code);
          } else {
            selectedCodes.add(h.code);
          }
          changed.push(h.code);
        }
      }
      syncGroupCheckboxes();
      updateBatchInfo();
      // 只刷新受影响的选区覆盖层画布
      refreshSelectionVisuals(changed);
    } else {
      for (const h of hitMap) {
        if (pt.x >= h.bx && pt.x < h.bx + h.w && pt.y >= h.by && pt.y < h.by + h.h) {
          if (e.ctrlKey || e.metaKey) {
            if (selectedCodes.has(h.code)) selectedCodes.delete(h.code);
            else selectedCodes.add(h.code);
            syncGroupCheckboxes();
            updateBatchInfo();
            refreshSelectionVisuals([h.code]);
          } else {
            selectChar(h.code);
            syncGroupCheckboxes();
          }
          return;
        }
      }
    }
    dragActive = false;
  });

  body.appendChild(canvas);

  // 选区覆盖层:只绘制选中高亮,选中变化时无需重绘字符画布
  const selCanvas = document.createElement('canvas');
  selCanvas.width = canvas.width;
  selCanvas.height = canvas.height;
  selCanvas.style.cssText = 'position:absolute;pointer-events:none;';
  canvas._selCanvas = selCanvas;
  body.appendChild(selCanvas);
  drawGroupSelection(canvas);

  header.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.tagName === 'BUTTON') return;
    body.classList.toggle('collapsed');
    toggle.textContent = body.classList.contains('collapsed') ? '❯' : '⌵';
    // 展开时重绘选区覆盖层,确保位置与当前布局一致
    if (!body.classList.contains('collapsed')) drawGroupSelection(canvas);
  });

  check.addEventListener('change', function() {
    const checked = this.checked;
    const changed = [];
    for (const code of codes) {
      if (checked) selectedCodes.add(code);
      else selectedCodes.delete(code);
      changed.push(code);
    }
    // Update all group checkboxes
    syncGroupCheckboxes();
    updateBatchInfo();
    refreshSelectionVisuals(changed);
  });

  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    openAddMissingModal(range);
  });

  section.appendChild(header);
  section.appendChild(body);
  charGroupList.appendChild(section);
}

function syncGroupCheckboxes() {
  const headers = charGroupList.querySelectorAll('.char-group');
  for (const section of headers) {
    const start = parseInt(section.dataset.rangeStart);
    const end = parseInt(section.dataset.rangeEnd);
    const check = section.querySelector('.group-check');
    const codes = [];
    for (let c = start; c <= end; c++) {
      if (font.glyphs[c]) codes.push(c);
    }
    const sel = codes.filter(c => selectedCodes.has(c));
    check.checked = codes.length > 0 && sel.length === codes.length;
    check.indeterminate = sel.length > 0 && sel.length < codes.length;
  }
}

function rebuildCharGroups() {
  groupCanvasCache.clear();
  const scrollTop = charGroupList.scrollTop;
  const groups = charGroupList.querySelectorAll('.char-group');
  const collapseStates = {};
  groups.forEach(g => {
    const start = g.dataset.rangeStart;
    const body = g.querySelector('.char-group-body');
    collapseStates[start] = body && body.classList.contains('collapsed');
  });
  buildCharGroups();
  charGroupList.querySelectorAll('.char-group').forEach(g => {
    const start = g.dataset.rangeStart;
    const body = g.querySelector('.char-group-body');
    const toggle = g.querySelector('.toggle');
    if (collapseStates[start]) {
      body.classList.add('collapsed');
      toggle.textContent = '❯';
    } else {
      body.classList.remove('collapsed');
      toggle.textContent = '⌵';
    }
  });
  charGroupList.scrollTop = scrollTop;
  syncGroupCheckboxes();
  redrawAllGroupSelections();
}

// ==================== Search ====================
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  const convertSC = $('sc-tc-toggle').checked;
  const searchQ = convertSC ? scToTc(q) : q;
  if (!searchQ) {
    if (searchHighlightCode !== null) {
      searchHighlightCode = null;
      charGroupList.querySelectorAll('.search-highlight').forEach(el => el.remove());
    }
    charGroupList.querySelectorAll('.char-group').forEach(g => g.style.display = '');
    return;
  }

  let targetCode = null;
  if (searchQ.length === 1) targetCode = searchQ.codePointAt(0);
  else if (/^(?:U\+|0x)[0-9a-fA-F]+$/.test(searchQ)) targetCode = parseInt(searchQ, 16);
  else if (/^\d+$/.test(searchQ)) targetCode = parseInt(searchQ, 10);

  if (targetCode !== null && font && font.glyphs[targetCode]) {
    searchHighlightCode = targetCode;
    const groups = charGroupList.querySelectorAll('.char-group');
    let targetGroup = null;
    for (const g of groups) {
      const start = parseInt(g.dataset.rangeStart);
      const end = parseInt(g.dataset.rangeEnd);
      if (targetCode >= start && targetCode <= end) {
        g.style.display = '';
        const body = g.querySelector('.char-group-body');
        body.classList.remove('collapsed');
        g.querySelector('.toggle').textContent = '▾';
        targetGroup = g;
      } else {
        g.style.display = 'none';
      }
    }
    if (targetGroup) {
      const cellW = Math.max(font.lines || 16, 8) + 2;
      const cellH = font.fontHeight + 2;
      const canvas = targetGroup.querySelector('.char-group-body canvas');
      const cols = canvas ? Math.max(1, Math.floor(canvas.width / cellW)) : 1;
      let idx = 0;
      const rStart = parseInt(targetGroup.dataset.rangeStart);
      const rEnd = parseInt(targetGroup.dataset.rangeEnd);
      for (let c = rStart; c < targetCode && c <= rEnd; c++) { if (font.glyphs[c]) idx++; }
      const row = Math.floor(idx / cols);
      const header = targetGroup.querySelector('.char-group-header');
      const headerH = header.getBoundingClientRect().height;
      const listRect = charGroupList.getBoundingClientRect();
      const gRect = targetGroup.getBoundingClientRect();
      const offset = gRect.top - listRect.top;
      charGroupList.scrollTop += offset + headerH + row * cellH - listRect.height * 0.3;
    }
    selectChar(targetCode);
    addSearchHighlight(targetCode);
  } else if (searchQ.length > 1) {
    searchHighlightCode = null;
    charGroupList.querySelectorAll('.char-group').forEach(g => g.style.display = '');
  }
});

$('search-add-btn').addEventListener('click', () => {
  if (!font) return;
  const q = searchInput.value.trim();
  if (!q) return;
  const convertSC = $('sc-tc-toggle').checked;
  const searchQ = convertSC ? scToTc(q) : q;
  let targetCode = null;
  if (searchQ.length === 1) targetCode = searchQ.codePointAt(0);
  else if (/^(?:U\+|0x)[0-9a-fA-F]+$/.test(searchQ)) targetCode = parseInt(searchQ, 16);
  else if (/^\d+$/.test(searchQ)) targetCode = parseInt(searchQ, 10);
  if (targetCode === null || targetCode < 0 || targetCode > 0x10FFFF) {
    showToast(t('toast.invalidChar'), true);
    return;
  }
  if (font.glyphs[targetCode]) {
    showToast(t('toast.charExists'), false);
    selectChar(targetCode);
    return;
  }
  const w = Math.max(1, font.fontWidth || font.lines || 8);
  const h = font.fontHeight;
  const pixels = [];
  for (let y = 0; y < h; y++) pixels.push(new Array(w).fill(0));
  font.glyphs[targetCode] = { width: w, height: h, pixels };
  if (font._sharedCodes) font._sharedCodes.delete(targetCode);
  rebuildCharGroups();
  selectChar(targetCode);
  showToast(t('toast.charAdded', { code: targetCode.toString(16).padStart(4, '0') }), false);
});

function addSearchHighlight(code) {
  charGroupList.querySelectorAll('.search-highlight').forEach(el => el.remove());
  const range = getGroupForCode(code);
  if (!range) return;
  const g = charGroupList.querySelector(`.char-group[data-range-start="${range.start}"]`);
  if (!g) return;
  const body = g.querySelector('.char-group-body');
  if (!body) return;
  const canvas = body.querySelector('canvas');
  if (!canvas) return;
  const cellW = Math.max(font.lines || 16, 8) + 2;
  const cellH = font.fontHeight + 2;
  const cols = Math.max(1, Math.floor(canvas.width / cellW));
  let idx = 0;
  for (let c = range.start; c <= range.end; c++) {
    if (font.glyphs[c]) {
      if (c === code) break;
      idx++;
    }
  }
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const br = body.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  const ox = cr.left - br.left;
  const oy = cr.top - br.top;
  const indicator = document.createElement('div');
  indicator.className = 'search-highlight';
  indicator.style.cssText = `
    position: absolute; left: ${ox + col * cellW}px; top: ${oy + row * cellH}px;
    width: ${cellW}px; height: ${cellH}px;
    border: 2px solid #fae371; pointer-events: none; z-index: 10;
    box-shadow: 0 0 6px #7777;
  `;
  body.style.position = 'relative';
  body.appendChild(indicator);
}

// ==================== Selection ====================
function detachGlyph(code) {
  if (!font._sharedCodes || !font._sharedCodes.has(code)) return;
  const src = font.glyphs[code];
  font.glyphs[code] = { width: src.width, height: src.height, pixels: src.pixels.map(row => [...row]) };
  font._sharedCodes.delete(code);
}

function shouldSeparate() {
  const el = $('separate-shared');
  return el && el.checked;
}

function prepareGlyphEdit(code) {
  if (shouldSeparate()) detachGlyph(code);
}

function getBatchEditCodes() {
  const codes = getSelectedGlyphCodes();
  if (shouldSeparate()) return codes;
  if (!font._sharedCodes) return codes;
  return codes.filter(c => !font._sharedCodes.has(c));
}

function getBatchEditCodesFromAll(allCodes) {
  if (shouldSeparate()) return allCodes;
  if (!font._sharedCodes) return allCodes;
  return allCodes.filter(c => !font._sharedCodes.has(c));
}

function selectChar(code) {
  if (!font || !font.glyphs[code]) return;
  prepareGlyphEdit(code);
  const prevSelected = selectedCode;
  // 切换字符前同步未刷新的编辑(自动刷新开关开启时)
  if (autoRefresh) flushDirtyGlyphs();
  if (code === selectedCode) {
    selectedCode = null;
  } else {
    selectedCode = code;
  }
  document.querySelectorAll('.char-group-header.active').forEach(h => h.classList.remove('active'));
  if (selectedCode !== null) {
    const range = getGroupForCode(code);
    if (range) {
      const el = charGroupList.querySelector(`.char-group[data-range-start="${range.start}"] .char-group-header`);
      if (el) el.classList.add('active');
    }
  }
  refreshSelectionVisuals([prevSelected, selectedCode]);
  updateEditorAndRightPanel();
  updateBatchInfo();
  updateUndoRedoButtons();
}

// 重绘指定字符所属分组的选区覆盖层画布
function drawGroupSelection(canvas) {
  const selCanvas = canvas._selCanvas;
  if (!selCanvas) return;
  // 根据当前布局对齐到字符画布边框盒(分组可能初始为折叠状态,故绘制时再定位)
  const body = canvas.closest('.char-group-body');
  if (body) {
    selCanvas.style.left = canvas.offsetLeft + 'px';
    selCanvas.style.top = canvas.offsetTop + 'px';
  }
  const ctx = selCanvas.getContext('2d');
  ctx.clearRect(0, 0, selCanvas.width, selCanvas.height);
  const group = canvas.closest('.char-group');
  if (!group) return;
  const start = parseInt(group.dataset.rangeStart);
  const end = parseInt(group.dataset.rangeEnd);
  const cellW = Math.max(font.lines || 16, 8) + 2;
  const cellH = font.fontHeight + 2;
  const cols = Math.max(1, Math.floor(canvas.width / cellW));
  let idx = 0;
  for (let c = start; c <= end; c++) {
    if (!font.glyphs[c]) continue;
    if (c === selectedCode || selectedCodes.has(c)) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      ctx.fillStyle = '#7777';
      ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
      ctx.strokeStyle = c === selectedCode ? '#f5c2e7' : '#a6e3a1';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);
    }
    idx++;
  }
}

// 只刷新受影响的选区覆盖层画布(changedCodes 为发生变化的字符码点)
function refreshSelectionVisuals(changedCodes) {
  const affected = new Set();
  const addCode = c => {
    if (c === null || c === undefined) return;
    const range = getGroupForCode(c);
    if (range) affected.add(range.start);
  };
  for (const c of changedCodes) addCode(c);
  if (selectedCode !== null) addCode(selectedCode);
  for (const start of affected) {
    const g = charGroupList.querySelector(`.char-group[data-range-start="${start}"]`);
    if (!g) continue;
    const canvas = g.querySelector('.char-group-body canvas');
    if (canvas && canvas._selCanvas) drawGroupSelection(canvas);
  }
}

// 全量重绘所有分组的选区覆盖层画布(整体重建字符列表后使用)
function redrawAllGroupSelections() {
  const groups = charGroupList.querySelectorAll('.char-group');
  for (const g of groups) {
    const canvas = g.querySelector('.char-group-body canvas');
    if (canvas && canvas._selCanvas) drawGroupSelection(canvas);
  }
}

function getGroupForCode(code) {
  for (const range of UNICODE_RANGES) {
    if (code >= range.start && code <= range.end) return range;
  }
  return null;
}

// 只重绘受影响字符的格子,不重建左侧字符列表 DOM/全部画布。
// 用于字形内容发生变化但列表结构(分组、数量、布局)不变的场景(如系统字体转换)。
// skipSelection=true 时跳过选区覆盖层重绘(编辑画笔高频调用时避免整组 selection 重绘开销)。
function redrawGlyphCells(codes, skipSelection = false) {
  const changed = new Set(codes);
  const affectedStarts = new Set();
  for (const code of changed) {
    const range = getGroupForCode(code);
    if (range) affectedStarts.add(range.start);
  }
  for (const start of affectedStarts) {
    const group = charGroupList.querySelector(`.char-group[data-range-start="${start}"]`);
    if (!group) continue;
    const canvas = group.querySelector('.char-group-body canvas');
    if (!canvas || !canvas._hitMap) continue;
    const ctx = canvas.getContext('2d');
    const cellW = Math.max(font.lines || 16, 8) + 2;
    const cellH = font.fontHeight + 2;
    const grpBg = bgColorVal === 'transparent' ? '#212121' : bgColorVal;
    for (const h of canvas._hitMap) {
      if (!changed.has(h.code)) continue;
      // 清空该格背景
      ctx.fillStyle = grpBg;
      ctx.fillRect(h.bx, h.by, h.w, h.h);
      const g = font.glyphs[h.code];
      if (!g) continue;
      // 字符像素(与 renderGroup 一致:bx+1 为格子内边距,字符居中)
      ctx.fillStyle = fgColorVal;
      const cx = Math.max(0, Math.floor((cellW - 2 - g.width) / 2));
      const cy = Math.max(0, Math.floor((cellH - 2 - g.height) / 2));
      for (let y = 0; y < g.height && y < cellH - 2; y++) {
        for (let x = 0; x < g.width && x < cellW - 2; x++) {
          if (g.pixels[y] && g.pixels[y][x]) {
            ctx.fillRect(h.bx + 1 + cx + x, h.by + 1 + cy + y, 1, 1);
          }
        }
      }
      // 共享标记
      if (font._sharedCodes && font._sharedCodes.has(h.code)) {
        ctx.fillStyle = '#f9e2af';
        ctx.fillRect(h.bx + cellW - 4, h.by + 1, 3, 3);
      }
    }
    // 重绘该分组选区覆盖层(选中高亮)
    if (canvas._selCanvas && !skipSelection) drawGroupSelection(canvas);
  }
}

function updateEditorAndRightPanel() {
  renderEditor();
  updateGlyphInfo();
}

// ==================== Undo / Redo / Restore ====================
// 每个字形独立维护撤销/重做栈,快照为修改前的 width 与像素深拷贝
function glyphSnapshot(g) {
  return { width: g.width, pixels: g.pixels.map(row => [...row]) };
}

function pushGlyphUndo(code) {
  const g = font.glyphs[code];
  if (!g) return;
  if (!g._undo) g._undo = [];
  if (!g._redo) g._redo = [];
  const s = glyphSnapshot(g);
  const top = g._undo[g._undo.length - 1];
  // 与栈顶相同(内容无实际变化)时不重复入栈
  if (top && top.width === s.width) {
    let same = true;
    for (let y = 0; y < top.pixels.length && same; y++) {
      const a = top.pixels[y], b = s.pixels[y];
      for (let x = 0; x < a.length && same; x++) {
        if (a[x] !== b[x]) same = false;
      }
    }
    if (same) return;
  }
  g._undo.push(s);
  g._redo.length = 0;
  updateUndoRedoButtons();
}

// 将字形覆盖为快照内容(仅像素与宽度;高度固定不变)
function restoreGlyphFromSnapshot(code, snap) {
  const g = font.glyphs[code];
  if (!g) return;
  g.width = snap.width;
  g.pixels = snap.pixels.map(row => [...row]);
}

// 撤销/重做/还原等显式操作后的统一刷新
function afterGlyphEdit(code) {
  updateGlyphInfo();
  renderEditor();
  renderPreview();
  redrawGlyphCells([code]);
  updateUndoRedoButtons();
}

function undoEdit() {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  const g = font.glyphs[selectedCode];
  if (!g._undo || g._undo.length === 0) { showToast(t('toast.noUndo'), false); return; }
  g._redo = g._redo || [];
  g._redo.push(glyphSnapshot(g));
  restoreGlyphFromSnapshot(selectedCode, g._undo.pop());
  afterGlyphEdit(selectedCode);
  showToast(t('toast.undone'), false);
}

function redoEdit() {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  const g = font.glyphs[selectedCode];
  if (!g._redo || g._redo.length === 0) { showToast(t('toast.noRedo'), false); return; }
  g._undo = g._undo || [];
  g._undo.push(glyphSnapshot(g));
  restoreGlyphFromSnapshot(selectedCode, g._redo.pop());
  afterGlyphEdit(selectedCode);
  showToast(t('toast.redone'), false);
}

// 还原当前字符为加载字体时的原始字形
function restoreGlyph() {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  if (!font._originals || !font._originals.has(selectedCode)) { showToast(t('toast.noRestoreData'), true); return; }
  pushGlyphUndo(selectedCode);
  restoreGlyphFromSnapshot(selectedCode, font._originals.get(selectedCode));
  afterGlyphEdit(selectedCode);
  showToast(t('toast.restored'), false);
}

function updateUndoRedoButtons() {
  const g = font && selectedCode ? font.glyphs[selectedCode] : null;
  const rs = $('restore-btn');
  if (rs) rs.disabled = !g || !font._originals || !font._originals.has(selectedCode);
}

$('restore-btn').addEventListener('click', restoreGlyph);

// Ctrl+Z 撤销 / Ctrl+Y 或 Ctrl+Shift+Z 重做(输入框内不拦截)
document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoEdit(); }
  else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redoEdit(); }
});

// ==================== Auto Refresh ====================
// 自动刷新开关:开启时编辑后同步刷新左侧字符列表对应格子;关闭时只刷新编辑器本身,
// 避免 CJK 等大字符集下每次编辑都操作左侧列表导致卡顿。
let autoRefresh = true;
// 已编辑但尚未刷新的字符(编辑画笔时累积,笔画结束/切换字符时刷新一次)
const dirtyGlyphs = new Set();

// 切换字符时统一同步左侧列表;关闭自动刷新期间保留 dirty,重新开启时一并刷新
function flushDirtyGlyphs() {
  if (!autoRefresh || dirtyGlyphs.size === 0) return;
  redrawGlyphCells([...dirtyGlyphs], true);
  dirtyGlyphs.clear();
}

$('auto-refresh-toggle').addEventListener('change', function() {
  autoRefresh = this.checked;
  if (autoRefresh) flushDirtyGlyphs();
});

function updateGlyphInfo() {
  const charPreview = $('glyph-char-preview');
  const charDisplay = $('glyph-char-display');
  const charHeader = $('glyph-char-header');
  const charDetail = $('glyph-char-detail');
  const convBtns = $('sys-convert-btns');
  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    glyphInfo.textContent = t('glyph.selectChar');
    glyphWidthInput.value = '';
    if (charPreview) charPreview.style.display = 'none';
    if (convBtns) convBtns.style.display = 'none';
    return;
  }
  if (convBtns) convBtns.style.display = 'flex';
  const g = font.glyphs[selectedCode];
  glyphInfo.textContent = '';
  glyphWidthInput.value = g.width;
  if (charHeader) charHeader.textContent = `U+${selectedCode.toString(16).padStart(4, '0')}`;
  if (charDetail) {
    charDetail.innerHTML = `<div>${t('glyph.width', { n: g.width })}</div><div>${t('glyph.height', { n: g.height })}</div>`;
  }
  if (charPreview && charDisplay) {
    try {
      const ch = String.fromCodePoint(selectedCode);
      charDisplay.textContent = ch;
      charPreview.style.display = 'block';
    } catch (e) {
      charPreview.style.display = 'none';
    }
  }
}

function updateBatchInfo() {
  const count = selectedCodes.size;
  if (count > 0) {
    batchInfoBar.style.display = 'block';
    batchInfoBar.innerHTML = t('batch.selected', { n: count });
  } else {
    batchInfoBar.style.display = 'none';
  }
}

// ==================== Editor ====================
function renderRulers() {
  const zoom = parseInt(editorZoomSlider.value);
  const topCanvas = $('ruler-top');
  const leftCanvas = $('ruler-left');
  const container = $('editor-container');
  const rulerSize = 18;

  if (!showRuler || !font || !selectedCode || !font.glyphs[selectedCode]) {
    topCanvas.width = 0; topCanvas.height = 0;
    leftCanvas.width = 0; leftCanvas.height = 0;
    return;
  }

  // Canvas position relative to container
  const contRect = container.getBoundingClientRect();
  const edRect = editorCanvas.getBoundingClientRect();
  const canvasLeft = edRect.left - contRect.left;
  const canvasTop = edRect.top - contRect.top;

  // Top ruler (spans container width minus corner)
  const contW = container.clientWidth;
  const contH = container.clientHeight;
  topCanvas.width = Math.max(1, contW - rulerSize);
  topCanvas.height = rulerSize;
  const tctx = topCanvas.getContext('2d');
  tctx.fillStyle = '#212121';
  tctx.fillRect(0, 0, topCanvas.width, topCanvas.height);
  tctx.strokeStyle = '#FF8800';
  tctx.fillStyle = '#FFF300';
  tctx.font = '11px monospace';
  tctx.textAlign = 'center';
  tctx.textBaseline = 'top';
  // 显示可见范围内的全部整数坐标(含 0 及超出字形宽度的部分),使范围外辅助线也能落位
  const tMinOff = Math.floor((rulerSize - canvasLeft) / zoom);
  const tMaxOff = Math.ceil((contW - canvasLeft) / zoom);
  for (let o = tMinOff; o <= tMaxOff; o++) {
    const px = canvasLeft + o * zoom - rulerSize;
    if (px < 0 || px > topCanvas.width) continue;
    if (o % 5 === 0) {
      tctx.lineWidth = 2;
      tctx.beginPath();
      tctx.moveTo(px + 0.5, rulerSize);
      tctx.lineTo(px + 0.5, rulerSize - 9);
      tctx.stroke();
      tctx.fillText(String(o), px, 1);
    } else {
      tctx.lineWidth = 1;
      tctx.beginPath();
      tctx.moveTo(px + 0.5, rulerSize);
      tctx.lineTo(px + 0.5, rulerSize - 5);
      tctx.stroke();
    }
  }

  // Left ruler (spans container height minus corner)
  leftCanvas.width = rulerSize;
  leftCanvas.height = Math.max(1, contH - rulerSize);
  const lctx = leftCanvas.getContext('2d');
  lctx.fillStyle = '#212121';
  lctx.fillRect(0, 0, leftCanvas.width, leftCanvas.height);
  lctx.strokeStyle = '#FF8800';
  lctx.fillStyle = '#FFF300';
  lctx.font = '11px monospace';
  lctx.textAlign = 'right';
  lctx.textBaseline = 'middle';
  const lMinOff = Math.floor((rulerSize - canvasTop) / zoom);
  const lMaxOff = Math.ceil((contH - canvasTop) / zoom);
  for (let o = lMinOff; o <= lMaxOff; o++) {
    const py = canvasTop + o * zoom - rulerSize;
    if (py < 0 || py > leftCanvas.height) continue;
    if (o % 5 === 0) {
      lctx.lineWidth = 2;
      lctx.beginPath();
      lctx.moveTo(rulerSize, py + 0.5);
      lctx.lineTo(rulerSize - 9, py + 0.5);
      lctx.stroke();
      lctx.fillText(String(o), rulerSize - 4, py);
    } else {
      lctx.lineWidth = 1;
      lctx.beginPath();
      lctx.moveTo(rulerSize, py + 0.5);
      lctx.lineTo(rulerSize - 5, py + 0.5);
      lctx.stroke();
    }
  }
}

function renderGuides() {
  const overlay = $('guide-overlay');
  const container = $('editor-container');
  if (!overlay || !container) return;
  const ctx = overlay.getContext('2d');

  overlay.width = container.clientWidth;
  overlay.height = container.clientHeight;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (!font || !selectedCode || !font.glyphs[selectedCode] || (guides.length === 0 && !guidePreview)) return;

  const zoom = editorZoom;
  const g = font.glyphs[selectedCode];
  const edRect = editorCanvas.getBoundingClientRect();
  const contRect = container.getBoundingClientRect();
  const canvasLeft = edRect.left - contRect.left;
  const canvasTop = edRect.top - contRect.top;

  ctx.lineCap = 'round';
  for (const guide of guides) {
    ctx.strokeStyle = 'rgba(137,180,250,0.8)';
    ctx.lineWidth = 2;
    if (guide.orientation === 'v') {
      const x = canvasLeft + guide.offset * zoom;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, overlay.height);
      ctx.stroke();
    } else if (guide.orientation === 'h') {
      const y = canvasTop + guide.offset * zoom;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(overlay.width, y + 0.5);
      ctx.stroke();
    }
  }

  if (guidePreview) {
    ctx.strokeStyle = 'rgba(137,180,250,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    if (guidePreview.orientation === 'v') {
      const x = canvasLeft + guidePreview.offset * zoom;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, overlay.height);
      ctx.stroke();
    } else {
      const y = canvasTop + guidePreview.offset * zoom;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(overlay.width, y + 0.5);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.lineCap = 'butt';
}

function renderEditor() {
  const zoom = parseInt(editorZoomSlider.value);
  editorZoom = zoom;
  const ctx = editorCanvas.getContext('2d');

  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    editorCanvas.width = 0;
    editorCanvas.height = 0;
    $('ruler-top').width = 0; $('ruler-top').height = 0;
    $('ruler-left').width = 0; $('ruler-left').height = 0;
    return;
  }

  const g = font.glyphs[selectedCode];
  const w = g.width;
  const h = g.height;
  editorCanvas.width = w * zoom;
  editorCanvas.height = h * zoom;

  // Background
  ctx.fillStyle = bgColorVal === 'transparent' ? '#212121' : bgColorVal;
  ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

  // Pixels
  ctx.fillStyle = fgColorVal;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g.pixels[y] && g.pixels[y][x]) {
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(205,214,244,0.2)';
  ctx.lineWidth = 0.5;
  for (let x = 1; x < w; x++) {
    ctx.beginPath();
    ctx.moveTo(x * zoom, 0);
    ctx.lineTo(x * zoom, editorCanvas.height);
    ctx.stroke();
  }
  for (let y = 1; y < h; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * zoom);
    ctx.lineTo(editorCanvas.width, y * zoom);
    ctx.stroke();
  }

  // 画笔悬停预览:高亮受影响的格子并画出边界
  drawBrushPreview(ctx, zoom);

  // Rulers
  renderRulers();
  renderGuides();
}

// 绘制画笔悬停时影响的格子(裁剪到画布内)
function drawBrushPreview(ctx, zoom) {
  if (!brushHover || !font || !selectedCode || !font.glyphs[selectedCode]) return;
  const g = font.glyphs[selectedCode];
  const { x0, y0, x1, y1 } = getBrushRange(brushHover.cx, brushHover.cy);
  const w = g.width, h = g.height;
  ctx.fillStyle = 'rgba(137,180,250,0.30)';
  for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    }
  }
  ctx.strokeStyle = 'rgba(137,180,250,0.9)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 * zoom + 0.5, y0 * zoom + 0.5, (x1 - x0 + 1) * zoom - 1, (y1 - y0 + 1) * zoom - 1);
}

// Re-render rulers on window resize
window.addEventListener('resize', () => { renderRulers(); renderGuides(); });

// Editor mouse interaction
let editorDrawing = false;
let editorErasing = false;
// 一次鼠标按下到抬起(一笔)只记录一次撤销快照
let strokeUndoPushed = false;

// 画笔状态:大小为覆盖的正方形边长,brushHover 记录当前悬停格点用于预览
let brushSize = 1;
let brushHover = null;
const MAX_BRUSH = 32;

// 计算以 (cx, cy) 为中心的画笔覆盖的格子范围(可能越界,由调用方裁剪)
function getBrushRange(cx, cy) {
  const half = Math.floor(brushSize / 2);
  return { x0: cx - half, y0: cy - half, x1: cx + brushSize - 1 - half, y1: cy + brushSize - 1 - half };
}

// 设置画笔大小并刷新预览与工具栏显示
function updateBrushSizeLabel() {
  const label = $('brush-size-label');
  if (label) label.textContent = t('brushLabel', { n: brushSize });
}
function setBrushSize(n) {
  brushSize = Math.max(1, Math.min(MAX_BRUSH, n));
  updateBrushSizeLabel();
  renderEditor();
}

// 在编辑画布上按 +/- 或 [] 调整画笔大小
document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
  if (e.repeat) return;
  let next = null;
  if (e.key === '+' || e.key === '=') next = brushSize + 1;
  else if (e.key === '-' || e.key === '_') next = brushSize - 1;
  else if (e.key === '[') next = brushSize - 1;
  else if (e.key === ']') next = brushSize + 1;
  if (next === null) return;
  e.preventDefault();
  setBrushSize(next);
});

editorCanvas.addEventListener('contextmenu', e => e.preventDefault());

function getCanvasMouse(e) {
  const rect = editorCanvas.getBoundingClientRect();
  return {
    mx: (e.clientX - rect.left) * (editorCanvas.width / rect.width),
    my: (e.clientY - rect.top) * (editorCanvas.height / rect.height)
  };
}

editorCanvas.addEventListener('mousedown', e => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  updateBrushHover(e);
  if (e.button === 0) { editorDrawing = true; editorErasing = false; }
  else if (e.button === 2) { editorDrawing = true; editorErasing = true; }
  editorSetPixel(e);
});

// 更新当前悬停格点,跨格点时刷新预览
function updateBrushHover(e) {
  const g = font.glyphs[selectedCode];
  if (!g) { if (brushHover) { brushHover = null; renderEditor(); } return; }
  const pt = getCanvasMouse(e);
  const px = Math.floor(pt.mx / editorZoom);
  const py = Math.floor(pt.my / editorZoom);
  if (px < 0 || px >= g.width || py < 0 || py >= g.height) {
    if (brushHover) { brushHover = null; renderEditor(); }
    return;
  }
  if (!brushHover || brushHover.cx !== px || brushHover.cy !== py) {
    brushHover = { cx: px, cy: py };
    renderEditor();
  }
}

editorCanvas.addEventListener('mousemove', e => {
  if (rulerDragging) return; // handled at document level
  updateBrushHover(e);
  if (!editorDrawing) {
    if (e.buttons === 1) { editorDrawing = true; editorErasing = false; }
    else if (e.buttons === 2) { editorDrawing = true; editorErasing = true; }
    else return;
  }
  editorSetPixel(e);
});

const editorMouseUpHandler = () => {
  editorDrawing = false;
  strokeUndoPushed = false;
};
document.addEventListener('mouseup', editorMouseUpHandler);

editorCanvas.addEventListener('mouseleave', () => {
  editorDrawing = false;
  strokeUndoPushed = false;
  brushHover = null;
  renderEditor();
});

function editorSetPixel(e) {
  const g = font.glyphs[selectedCode];
  if (!g) return;
  const zoom = editorZoom;
  const pt = getCanvasMouse(e);
  const px = Math.floor(pt.mx / zoom);
  const py = Math.floor(pt.my / zoom);
  if (px < 0 || px >= g.width || py < 0 || py >= g.height) return;

  prepareGlyphEdit(selectedCode);
  const gg = font.glyphs[selectedCode];
  const { x0, y0, x1, y1 } = getBrushRange(px, py);
  // 记录本笔画开始前的状态(一次按下到抬起只入栈一次;内容无变化时自动去重)
  if (!strokeUndoPushed) {
    pushGlyphUndo(selectedCode);
    strokeUndoPushed = true;
  }
  let changed = false;
  // 画笔覆盖的所有格子(裁剪到字形范围内)
  for (let y = Math.max(0, y0); y <= Math.min(gg.height - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(gg.width - 1, x1); x++) {
      if (gg.pixels[y][x] !== (editorErasing ? 0 : 1)) changed = true;
      gg.pixels[y][x] = editorErasing ? 0 : 1;
    }
  }
  renderEditor();
  // 记录该字符已编辑;仅在切换字符时(自动刷新开启)统一同步左侧列表格子
  if (changed) dirtyGlyphs.add(selectedCode);
}

// ==================== Ruler Guides (Create/Move/Remove) ====================
// 计算标尺点击位置对应的格点偏移(浮点)
function getRulerOffset(e, orientation) {
  const zoom = editorZoom;
  const editorRect = editorCanvas.getBoundingClientRect();
  if (orientation === 'v') {
    const mx = (e.clientX - editorRect.left) * (editorCanvas.width / editorRect.width);
    return mx / zoom;
  }
  const my = (e.clientY - editorRect.top) * (editorCanvas.height / editorRect.height);
  return my / zoom;
}

// 查找指定方向、靠近 offsetFloat 的已有辅助线(容差不超过半格)
function findGuideAt(orientation, offsetFloat) {
  const tol = Math.min(0.5, 4 / editorZoom);
  let best = null, bestDist = Infinity;
  for (const guide of guides) {
    if (guide.orientation !== orientation) continue;
    const dist = Math.abs(guide.offset - offsetFloat);
    if (dist < bestDist) { bestDist = dist; best = guide; }
  }
  return (best && bestDist <= tol) ? best : null;
}

// 是否已存在同方向同位置的辅助线
function hasGuide(orientation, offset) {
  return guides.some(g => g.orientation === orientation && g.offset === offset);
}

// 清除重复的辅助线
function dedupeGuides() {
  const seen = new Set();
  guides = guides.filter(g => {
    const key = g.orientation + ':' + g.offset;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 标尺左键:点到已有辅助线则拖动移动,空白处则新建
function startRulerDrag(e, orientation) {
  if (!font || !selectedCode || !font.glyphs[selectedCode] || e.button !== 0) return;
  if (!showRuler) return;
  const offsetFloat = getRulerOffset(e, orientation);
  const existing = findGuideAt(orientation, offsetFloat);
  if (existing) {
    rulerDragging = { orientation, mode: 'move', guide: existing };
    guidePreview = null;
  } else {
    // 不限制范围,允许在字符宽高范围外放置辅助线
    const offset = Math.round(offsetFloat);
    rulerDragging = { orientation, mode: 'create', offset };
    guidePreview = { orientation, offset };
  }
  renderEditor();
  e.preventDefault();
}

$('ruler-top').addEventListener('mousedown', e => startRulerDrag(e, 'v'));
$('ruler-left').addEventListener('mousedown', e => startRulerDrag(e, 'h'));

// 标尺悬停反馈:在辅助线上时显示 resize 光标
$('ruler-top').addEventListener('mousemove', e => {
  if (!font || !selectedCode || !font.glyphs[selectedCode] || !showRuler) return;
  $('ruler-top').style.cursor = findGuideAt('v', getRulerOffset(e, 'v')) ? 'ew-resize' : '';
});
$('ruler-top').addEventListener('mouseleave', () => { $('ruler-top').style.cursor = ''; });
$('ruler-left').addEventListener('mousemove', e => {
  if (!font || !selectedCode || !font.glyphs[selectedCode] || !showRuler) return;
  $('ruler-left').style.cursor = findGuideAt('h', getRulerOffset(e, 'h')) ? 'ns-resize' : '';
});
$('ruler-left').addEventListener('mouseleave', () => { $('ruler-left').style.cursor = ''; });

// 标尺右键:移除辅助线
function removeGuideAt(e, orientation) {
  e.preventDefault();
  if (!font || !selectedCode || !font.glyphs[selectedCode] || !showRuler) return;
  const existing = findGuideAt(orientation, getRulerOffset(e, orientation));
  if (existing) {
    guides = guides.filter(g => g !== existing);
    renderEditor();
    showToast(t('toast.guideRemoved'), false);
  }
}

$('ruler-top').addEventListener('contextmenu', e => removeGuideAt(e, 'v'));
$('ruler-left').addEventListener('contextmenu', e => removeGuideAt(e, 'h'));

document.addEventListener('mousemove', e => {
  if (!rulerDragging || !font || !selectedCode || !font.glyphs[selectedCode]) return;
  const orientation = rulerDragging.orientation;
  const offset = Math.round(getRulerOffset(e, orientation));
  if (rulerDragging.mode === 'move') {
    rulerDragging.guide.offset = offset;
  } else {
    rulerDragging.offset = offset;
    guidePreview.offset = offset;
  }
  renderEditor();
});

document.addEventListener('mouseup', e => {
  if (rulerDragging) {
    if (rulerDragging.mode === 'create') {
      const offset = rulerDragging.offset;
      if (!hasGuide(rulerDragging.orientation, offset)) {
        guides.push({ orientation: rulerDragging.orientation, offset });
      }
    }
    dedupeGuides();
    renderEditor();
  }
  rulerDragging = null;
  guidePreview = null;
});

// Move controls
function moveGlyphContent(dx, dy) {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  prepareGlyphEdit(selectedCode);
  pushGlyphUndo(selectedCode);
  const g = font.glyphs[selectedCode];
  const newPixels = [];
  for (let y = 0; y < g.height; y++) {
    newPixels.push(new Array(g.width).fill(0));
  }
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.pixels[y] && g.pixels[y][x]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < g.width && ny >= 0 && ny < g.height) {
          newPixels[ny][nx] = 1;
        }
      }
    }
  }
  g.pixels = newPixels;
  afterGlyphEdit(selectedCode);
}

function centerGlyphContent() {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  prepareGlyphEdit(selectedCode);
  const g = font.glyphs[selectedCode];
  let left = g.width, right = 0;
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.pixels[y][x]) { left = Math.min(left, x); right = Math.max(right, x); }
    }
  }
  if (left > right) return;
  const shift = Math.floor((g.width - (right - left + 1)) / 2) - left;
  if (shift === 0) return;
  pushGlyphUndo(selectedCode);
  const newPixels = [];
  for (let y = 0; y < g.height; y++) {
    const row = new Array(g.width).fill(0);
    for (let x = 0; x < g.width; x++) {
      if (g.pixels[y][x]) {
        const nx = x + shift;
        if (nx >= 0 && nx < g.width) row[nx] = 1;
      }
    }
    newPixels.push(row);
  }
  g.pixels = newPixels;
  afterGlyphEdit(selectedCode);
}

// ==================== Preview ====================
function renderPreview() {
  if (!font) { previewCanvas.width = 0; previewCanvas.height = 0; return; }
  const scale = parseInt(previewScaleSlider.value) || 2;
  const rawText = textInput.value;
  if (!rawText.length) { previewCanvas.width = 0; previewCanvas.height = 0; return; }
  const convertSC = $('sc-tc-toggle').checked;
  const text = convertSC ? scToTc(rawText) : rawText;

  const lines = text.split('\n');
  const fh = font.fontHeight;
  const lineH = fh + 1;

  let maxW = 0;
  const lineGlyphs = [];
  for (const line of lines) {
    const glyphs = [];
    let totalW = 0;
    for (const ch of line) {
      const code = ch.codePointAt(0);
      const g = font.glyphs[code];
      if (!g) continue;
      glyphs.push(g);
      totalW += g.width;
    }
    totalW += Math.max(0, glyphs.length - 1);
    lineGlyphs.push(glyphs);
    maxW = Math.max(maxW, totalW);
  }

  if (maxW === 0) { previewCanvas.width = 0; previewCanvas.height = 0; return; }

  const totalH = Math.max(0, lines.length * lineH - 1);
  previewCanvas.width = maxW * scale;
  previewCanvas.height = totalH * scale;

  const ctx = previewCanvas.getContext('2d');
  if (bgColorVal !== 'transparent') {
    ctx.fillStyle = bgColorVal;
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
  ctx.fillStyle = fgColorVal;

  for (let li = 0; li < lines.length; li++) {
    let cx = 0;
    for (const g of lineGlyphs[li]) {
      for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
          if (g.pixels[y][x]) ctx.fillRect((cx + x) * scale, (li * lineH + y) * scale, scale, scale);
        }
      }
      cx += g.width + 1;
    }
  }
}

// ==================== Right Panel Controls ====================
// Apply glyph width
$('apply-width').addEventListener('click', () => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  prepareGlyphEdit(selectedCode);
  const newW = parseInt(glyphWidthInput.value);
  if (isNaN(newW) || newW < 1 || newW > 255) return;
  const g = font.glyphs[selectedCode];
  if (newW === g.width) return;
  pushGlyphUndo(selectedCode);
  const newPixels = [];
  for (let y = 0; y < g.height; y++) {
    const row = new Array(newW).fill(0);
    for (let x = 0; x < Math.min(g.width, newW); x++) {
      if (g.pixels[y] && g.pixels[y][x]) row[x] = 1;
    }
    newPixels.push(row);
  }
  g.pixels = newPixels;
  g.width = newW;
  afterGlyphEdit(selectedCode);
});

// Move buttons
$('move-up').addEventListener('click', () => moveGlyphContent(0, -1));
$('move-down').addEventListener('click', () => moveGlyphContent(0, 1));
$('move-left').addEventListener('click', () => moveGlyphContent(-1, 0));
$('move-right').addEventListener('click', () => moveGlyphContent(1, 0));
$('move-center').addEventListener('click', centerGlyphContent);

// ==================== Ruler & Guide Controls ====================
function updateRulerUI() {
  const container = $('editor-container');
  if (container) container.classList.toggle('show-ruler', showRuler);
}

$('ruler-toggle').addEventListener('change', function() {
  showRuler = this.checked;
  updateRulerUI();
  renderEditor();
});

// Init ruler visibility from checkbox state
updateRulerUI();

$('clear-guides').addEventListener('click', () => {
  if (guides.length === 0) { showToast(t('toast.noGuides'), false); return; }
  guides = [];
  renderEditor();
  showToast(t('toast.guidesCleared'), false);
});

// ==================== Batch Move ====================
function batchMoveContent(dx, dy) {
  const codes = getBatchEditCodes();
  if (codes.length === 0) { showToast(t('toast.noChars'), true); return; }
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
    if (!shouldSeparate() && font._sharedCodes && font._sharedCodes.has(code)) continue;
    const g = font.glyphs[code];
    const newPixels = [];
    for (let y = 0; y < g.height; y++) {
      newPixels.push(new Array(g.width).fill(0));
    }
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (g.pixels[y] && g.pixels[y][x]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < g.width && ny >= 0 && ny < g.height) {
            newPixels[ny][nx] = 1;
          }
        }
      }
    }
    g.pixels = newPixels;
  }
  showToast(t('toast.moved', { n: codes.length }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

$('batch-move-up').addEventListener('click', () => batchMoveContent(0, -1));
$('batch-move-down').addEventListener('click', () => batchMoveContent(0, 1));

// ==================== Separate Shared Toggle ====================
function updateSeparateSharedTitle() {
  const el = $('separate-shared');
  const label = el && el.closest('label');
  if (label) label.title = el.checked ? t('conv.separate.title.on') : t('conv.separate.title.off');
}
$('separate-shared').addEventListener('change', updateSeparateSharedTitle);

// ==================== Batch Operations ====================
function getSelectedGlyphCodes() {
  return [...selectedCodes].filter(code => font.glyphs[code]);
}

function batchSetWidth(newWidth) {
  const codes = getBatchEditCodes();
  if (codes.length === 0) { showToast(t('toast.noChars'), true); return; }
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
    if (!shouldSeparate() && font._sharedCodes && font._sharedCodes.has(code)) continue;
    const g = font.glyphs[code];
    let contentW = 0;
    for (let y = 0; y < g.height; y++) {
      for (let x = g.width - 1; x >= 0; x--) {
        if (g.pixels[y][x]) { contentW = Math.max(contentW, x + 1); break; }
      }
    }
    if (newWidth < contentW) continue;
    if (newWidth === g.width) continue;
    const newPixels = [];
    for (let y = 0; y < g.height; y++) {
      const row = new Array(newWidth).fill(0);
      for (let x = 0; x < Math.min(g.width, newWidth); x++) {
        if (g.pixels[y][x]) row[x] = 1;
      }
      newPixels.push(row);
    }
    g.pixels = newPixels;
    g.width = newWidth;
  }
  showToast(t('toast.batchWidth', { n: codes.filter(c => font.glyphs[c].width === newWidth).length, w: newWidth }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

function batchCenter() {
  const codes = getBatchEditCodes();
  if (codes.length === 0) { showToast(t('toast.noChars'), true); return; }
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
    if (!shouldSeparate() && font._sharedCodes && font._sharedCodes.has(code)) continue;
    const g = font.glyphs[code];
    let left = g.width, right = 0;
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (g.pixels[y][x]) { left = Math.min(left, x); right = Math.max(right, x); }
      }
    }
    if (left > right) continue;
    const shift = Math.floor((g.width - (right - left + 1)) / 2) - left;
    if (shift === 0) continue;
    const newPixels = [];
    for (let y = 0; y < g.height; y++) {
      const row = new Array(g.width).fill(0);
      for (let x = 0; x < g.width; x++) {
        if (g.pixels[y][x]) {
          const nx = x + shift;
          if (nx >= 0 && nx < g.width) row[nx] = 1;
        }
      }
      newPixels.push(row);
    }
    g.pixels = newPixels;
  }
  showToast(t('toast.centered', { n: codes.length }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

function batchClearAll() {
  const codes = getBatchEditCodes();
  if (codes.length === 0) { showToast(t('toast.noChars'), true); return; }
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
    if (!shouldSeparate() && font._sharedCodes && font._sharedCodes.has(code)) continue;
    const g = font.glyphs[code];
    for (let y = 0; y < g.height; y++)
      for (let x = 0; x < g.width; x++)
        g.pixels[y][x] = 0;
  }
  showToast(t('toast.cleared', { n: codes.length }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

$('batch-set-width').addEventListener('click', () => {
  const w = parseInt(batchWidthInput.value);
  if (!isNaN(w) && w >= 1 && w <= 255) batchSetWidth(w);
});
$('batch-center').addEventListener('click', batchCenter);
$('batch-clear-all').addEventListener('click', batchClearAll);

// ==================== Font Replacement (System Font) ====================
function applyShadowToPixels(pixels, w, h) {
  const ww = w + 1; // 扩展一列容纳右侧溢出阴影

  // 1. 阈值渲染的文字 (入参 pixels, 补齐到 ww 列)
  const text = [];
  for (let y = 0; y < h; y++) {
    const row = new Array(ww).fill(0);
    for (let x = 0; x < w; x++) row[x] = pixels[y] ? (pixels[y][x] || 0) : 0;
    text.push(row);
  }

  // 2. 复制一份
  const copy = text.map(row => [...row]);

  // 3. 渲染右侧阴影 (从文字)
  const shadowR = [];
  for (let y = 0; y < h; y++) shadowR.push(new Array(ww).fill(0));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < ww; x++)
      if (text[y][x] && x + 1 < ww) shadowR[y][x + 1] = 1;

  // 4. 渲染右下阴影 (从副本)
  const shadowBR = [];
  for (let y = 0; y < h; y++) shadowBR.push(new Array(ww).fill(0));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < ww; x++)
      if (copy[y][x] && x + 1 < ww && y + 1 < h) shadowBR[y + 1][x + 1] = 1;

  // 5. 两个阴影相加
  const combined = [];
  for (let y = 0; y < h; y++) {
    const row = new Array(ww).fill(0);
    for (let x = 0; x < ww; x++)
      if (shadowR[y][x] || shadowBR[y][x]) row[x] = 1;
    combined.push(row);
  }

  // 6. 有阴影的减去无阴影的 (combined - text)
  const minusText = [];
  for (let y = 0; y < h; y++) {
    const row = new Array(ww).fill(0);
    for (let x = 0; x < ww; x++)
      if (combined[y][x] && !text[y][x]) row[x] = 1;
    minusText.push(row);
  }

  // 7. 向左挪动一格, 输出 w 列
  const out = [];
  for (let y = 0; y < h; y++) {
    const row = new Array(w).fill(0);
    for (let x = 0; x < w; x++)
      if (x + 1 < ww && minusText[y][x + 1]) row[x] = 1;
    out.push(row);
  }
  return out;
}

// 参考字形顶部到基线的距离,作为系统字体转换时的统一基线高度。
// 优先用中文字形(汉字通常占满字面高度,顶部贴网格),纯英文/符号字体回退到大写字母,再回退到 0.8 倍字号。
function getFontBaselineAscent(ctx, fontStyle, fontFamily, fontSize) {
  ctx.font = `${fontStyle} ${fontSize}px "${fontFamily}"`;
  const cjk = ctx.measureText('中');
  if (cjk.actualBoundingBoxAscent && cjk.actualBoundingBoxAscent > 0) return cjk.actualBoundingBoxAscent;
  const lat = ctx.measureText('A');
  if (lat.actualBoundingBoxAscent && lat.actualBoundingBoxAscent > 0) return lat.actualBoundingBoxAscent;
  return Math.round(fontSize * 0.8);
}

// 对 alpha 位图做垂直亚像素位移(像素插值法,线性插值):frac>0 内容下移,frac<0 内容上移。
// 浏览器对 fillText 的分数 y 坐标强制取整,亚像素偏移无法靠绘制位置实现,
// 因此改为在读取到的位图上插值完成,再按阈值二值化。
function shiftAlphaVertical(alpha, w, h, frac) {
  const nb = frac > 0 ? -1 : 1;
  const f = Math.abs(frac);
  const inv = 1 - f;
  const out = new Float32Array(alpha.length);
  for (let y = 0; y < h; y++) {
    const y1 = y + nb;
    const hasN1 = y1 >= 0 && y1 < h;
    const b0 = y * w, b1 = y1 * w;
    for (let x = 0; x < w; x++) {
      const a1 = hasN1 ? alpha[b1 + x] : 0;
      out[b0 + x] = alpha[b0 + x] * inv + a1 * f;
    }
  }
  return out;
}

// 以原生分辨率(1:1)渲染系统字体文本,每个输出格取覆盖 alpha 并与阈值比较得到像素。
// 按目标字号直接渲染,可保留点阵字体(如 SimSun 低位图 strike、Unifont 网格设计)的像素特征;
// 不进行超采样,否则放大字号会使点阵字体失去位图特性(变模糊/丢像素)。
function renderSystemFontChar(char, fontFamily, maxW, maxH, threshold = 128, vertOffset = 0, fontStyle = 'normal', fineX = 0, fineY = 0) {
  const margin = 8;
  const cH = maxH + margin * 2;
  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = cH;
  const ctx = canvas.getContext('2d');

  let fontSize = maxH;
  ctx.font = `${fontStyle} ${fontSize}px "${fontFamily}"`;
  let metrics = ctx.measureText(char);
  // 仅在字宽超过槽位时收缩;不加 -1 裕量,否则全角汉字(advance≈15.x<16)会被误降到 15px,
  // 破坏 16px 网格设计(Unifont)或选中错误的内嵌位图 strike(SimSun)。
  while ((metrics.width > maxW || fontSize > maxH) && fontSize > 4) {
    fontSize--;
    ctx.font = `${fontStyle} ${fontSize}px "${fontFamily}"`;
    metrics = ctx.measureText(char);
  }

  ctx.clearRect(0, 0, maxW, cH);
  ctx.fillStyle = '#fff';
  // 用基线(alphabet)绘制,输出时统一按基线对齐,避免内容垂直居中导致 '_' 等基线下方字符错位成 '-'
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const tw = Math.ceil(metrics.width);
  // 微调偏移:fineX 作用于绘制位置(水平方向随后被裁剪,用于贴边时的亚像素细节);
  // fineY 拆为整数部分(输出格定位)与小数部分(对位图做像素插值)实现亚像素位移。
  const tx = Math.floor((maxW - tw) / 2) + fineX;
  // 基线画在画布中偏上位置,给字母下伸/下降部分(如 g、_、, )留足空间;输出时按参考基线映射到网格
  const baseY = Math.floor(cH * 0.75);
  ctx.fillText(char, tx, baseY);

  const imageData = ctx.getImageData(0, 0, maxW, cH);
  const rawAlpha = new Float32Array(maxW * cH);
  for (let i = 0; i < maxW * cH; i++) rawAlpha[i] = imageData.data[i * 4 + 3];

  // 亚像素 Y 偏移:浏览器栅格化会把 fillText 的分数 y 取整,绘制位置无法生效;
  // fineY 小数部分改为对位图做垂直线性插值(shiftAlphaVertical),整数部分走 startY。
  const fyInt = Math.round(fineY);
  const fyFrac = fineY - fyInt;
  const alpha = Math.abs(fyFrac) > 0.001 ? shiftAlphaVertical(rawAlpha, maxW, cH, fyFrac) : rawAlpha;

  const pixels = [];
  for (let y = 0; y < cH; y++) {
    const row = [];
    for (let x = 0; x < maxW; x++) {
      row.push(alpha[y * maxW + x] > threshold ? 1 : 0);
    }
    pixels.push(row);
  }

  // Find content bounds
  let left = maxW, right = 0, top = cH, bottom = 0;
  for (let y = 0; y < cH; y++)
    for (let x = 0; x < maxW; x++)
      if (pixels[y][x]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }

  if (left > right) return null;

  const outH = Math.min(font.fontHeight, maxH);
  const charH = bottom - top + 1;
  const charW = right - left + 1;

  // 输出定位:基线对齐而非内容居中。参考字形(汉字/大写)顶部贴网格顶,
  // 其余字符按各自基线同列放置,避免 '_' 这类基线下方字符被居中变成 '-';
  // vertOffset 与 fineY 整数部分仍作为整体微调生效。
  const targetBaseRow = getFontBaselineAscent(ctx, fontStyle, fontFamily, fontSize) + vertOffset + fyInt;
  let startY = targetBaseRow - (baseY - top);
  // 溢出保护:内容不得整体超出格子范围,避免格子过矮(字号>字体可容纳高度)时下伸字符消失
  const minStart = 0, maxStart = Math.max(0, outH - charH);
  if (startY > maxStart) startY = maxStart;
  if (startY < minStart) startY = minStart;
  const startX = Math.floor((maxW - charW) / 2);

  const result = [];
  for (let y = 0; y < outH; y++) {
    const row = [];
    for (let x = 0; x < maxW; x++) {
      const charY = y - startY;
      const charX = x - startX;
      if (charY >= 0 && charY < charH && charX >= 0 && charX < charW) {
        row.push(pixels[top + charY][left + charX] ? 1 : 0);
      } else {
        row.push(0);
      }
    }
    result.push(row);
  }

  // Trim empty columns
  let resultLeft = maxW, resultRight = 0;
  for (let y = 0; y < outH; y++)
    for (let x = 0; x < maxW; x++)
      if (result[y][x]) { resultLeft = Math.min(resultLeft, x); resultRight = Math.max(resultRight, x); }
  if (resultLeft > resultRight) return null;

  const trimmed = result.map(row => row.slice(resultLeft, resultRight + 1));
  return { width: trimmed[0].length, pixels: trimmed };
}

function convertGlyphFromSystemFont(code, fontFamily, threshold = 128) {
  if (!font || !font.glyphs[code]) return false;
  prepareGlyphEdit(code);
  pushGlyphUndo(code);
  const fs = getRenderFontSize();
  const maxW = fs;
  const maxH = fs;
  const ch = String.fromCodePoint(code);
  const vertOffset = getVertOffset();
  const fontStyle = getFontStyle();
  const fineX = getFineX();
  const fineY = getFineY();
  const result = renderSystemFontChar(ch, fontFamily, maxW, maxH, threshold, vertOffset, fontStyle, fineX, fineY);
  if (!result) return false;
  const g = font.glyphs[code];
  g.width = result.width;
  let pixels = result.pixels;
  if ($('shadow-toggle').checked) {
    pixels = applyShadowToPixels(pixels, result.width, Math.min(pixels.length, font.fontHeight));
  }
  if (pixels.length !== g.height) {
    const newPixels = [];
    for (let y = 0; y < g.height; y++) {
      if (y < pixels.length) newPixels.push([...pixels[y]]);
      else newPixels.push(new Array(g.width).fill(0));
    }
    g.pixels = newPixels;
  } else {
    g.pixels = pixels;
  }
  return true;
}

$('sys-font-convert').addEventListener('click', () => {
  const family = sysFontFamily.value.trim();
  if (!family) { showToast(t('toast.enterFont'), true); return; }
  let codes = getSelectedGlyphCodes();
  if (codes.length === 0 && selectedCode) codes = [selectedCode];
  if (codes.length === 0) { showToast(t('toast.selectCharsFirst'), true); return; }
  if (!shouldSeparate() && font._sharedCodes && codes.length > 1) codes = codes.filter(c => !font._sharedCodes.has(c));
  if (codes.length === 0) { showToast(t('toast.sharedSkipped'), true); return; }
  const threshold = parseInt($('conv-threshold').value) || 128;
  const converted = [];
  for (const code of codes) {
    if (convertGlyphFromSystemFont(code, family, threshold)) converted.push(code);
  }
  showToast(t('toast.converted', { n: converted.length, family }), false);
  updateEditorAndRightPanel();
  renderPreview();
  // 只重绘受影响字符的格子,避免整棵字符列表重建(转换不会改变列表结构)
  if (converted.length > 0) redrawGlyphCells(converted);
});

$('sys-font-convert-all').addEventListener('click', () => {
  const family = sysFontFamily.value.trim();
  if (!family) { showToast(t('toast.enterFont'), true); return; }
  const threshold = parseInt($('conv-threshold').value) || 128;
  const allCodes = Object.keys(font.glyphs).map(Number);
  const codes = getBatchEditCodesFromAll(allCodes);
  if (codes.length === 0) { showToast(t('toast.noChars'), true); return; }
  let count = 0;
  for (const code of codes) {
    if (convertGlyphFromSystemFont(code, family, threshold)) count++;
  }
  showToast(t('toast.convertedAll', { n: count, family }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
});

// ==================== Add Missing Characters Modal ====================
function openAddMissingModal(range) {
  if (!font) return;
  const family = sysFontFamily.value.trim();
  if (!family) { showToast(t('toast.selectSysFont'), true); return; }

  const missing = [];
  for (let code = range.start; code <= range.end; code++) {
    if (!font.glyphs[code]) missing.push(code);
  }
  if (missing.length === 0) { showToast(t('toast.noMissing'), false); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('span');
  title.className = 'modal-title';
  title.textContent = t('modal.addMissingTitle', { name: getRangeName(range), n: missing.length });
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';

  const selectedSet = new Set();
  const allItems = [];
  const maxShow = Math.min(missing.length, 1000);
  for (let i = 0; i < maxShow; i++) {
    const code = missing[i];
    const item = document.createElement('div');
    item.className = 'modal-char-item';
    item.addEventListener('click', () => {
      const checked = item.classList.toggle('checked');
      if (checked) selectedSet.add(code);
      else selectedSet.delete(code);
    });
    const preview = document.createElement('div');
    preview.className = 'char-preview';
    try { preview.textContent = String.fromCodePoint(code); } catch(e) { preview.textContent = '?'; }
    const codeSpan = document.createElement('div');
    codeSpan.className = 'char-code';
    codeSpan.textContent = `U+${code.toString(16).padStart(4, '0')}`;
    item.appendChild(preview);
    item.appendChild(codeSpan);
    body.appendChild(item);
    allItems.push({ el: item, code });
  }
  if (missing.length > 1000) {
    const note = document.createElement('div');
    note.style.cssText = 'width:100%;font-size:11px;color:#6c7086;text-align:center;padding:4px;';
    note.textContent = t('modal.moreChars', { n: missing.length - 1000 });
    body.appendChild(note);
  }

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const addBtn = document.createElement('button');
  addBtn.className = 'primary';
  addBtn.textContent = t('modal.addSelected');
  const toggleAllBtn = document.createElement('button');
  toggleAllBtn.textContent = t('modal.selectAll');
  let allSelected = false;
  toggleAllBtn.addEventListener('click', () => {
    allSelected = !allSelected;
    toggleAllBtn.textContent = allSelected ? t('modal.deselectAll') : t('modal.selectAll');
    for (const { el, code } of allItems) {
      el.classList.toggle('checked', allSelected);
      if (allSelected) selectedSet.add(code);
      else selectedSet.delete(code);
    }
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = t('modal.cancel');
  footer.appendChild(cancelBtn);
  footer.appendChild(toggleAllBtn);
  footer.appendChild(addBtn);

  box.appendChild(header);
  box.appendChild(body);
  box.appendChild(footer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function close() { document.body.removeChild(overlay); }
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  addBtn.addEventListener('click', () => {
    const fs = getRenderFontSize();
    const maxW = fs;
    const maxH = fs;
    const threshold = parseInt($('conv-threshold').value) || 128;
    let added = 0;
    for (const code of selectedSet) {
      if (font.glyphs[code]) continue;
      const ch = String.fromCodePoint(code);
      const result = renderSystemFontChar(ch, family, maxW, maxH, threshold, getVertOffset(), getFontStyle());
      if (!result) continue;
      let pixels = result.pixels;
      if ($('shadow-toggle').checked) {
        pixels = applyShadowToPixels(pixels, result.width, Math.min(pixels.length, font.fontHeight));
      }
      const pix = [];
      for (let y = 0; y < font.fontHeight; y++) {
        if (y < pixels.length) pix.push([...pixels[y]]);
        else pix.push(new Array(result.width).fill(0));
      }
      font.glyphs[code] = { width: result.width, height: font.fontHeight, pixels: pix };
      added++;
    }
    showToast(t('toast.added', { n: added }), false);
    close();
    rebuildCharGroups();
    renderPreview();
  });
}

// ==================== Font Save ====================
function saveFont() {
  if (!font) return;
  if (font.isUnicode) saveUnicodeFont();
  else saveNonUnicodeFont();
}

function saveUnicodeFont() {
  const stride = font.stride;
  const fdh = font.lines;
  const fh = font.fontHeight;
  const fw = font.fontWidth;
  const symSize = 1 + stride * fdh;

  // Build unique symbol list with dedup
  const symbolMap = new Map(); // dataKey -> symbolIndex
  const symbolList = []; // Uint8Array[]
  const indexTable = new Uint16Array(0x10000);

  for (let code = 0; code < 0x10000; code++) {
    const g = font.glyphs[code];
    if (!g) { indexTable[code] = 0; continue; }

    const block = new Uint8Array(symSize);
    block[0] = Math.min(g.width, 255);
    const pixelData = encodePixels(g.pixels.slice(0, fdh), stride);
    block.set(pixelData, 1);

    const key = Array.from(block).join(',');
    if (symbolMap.has(key)) {
      indexTable[code] = symbolMap.get(key) + 1;
    } else {
      const idx = symbolList.length;
      symbolList.push(block);
      symbolMap.set(key, idx);
      indexTable[code] = idx + 1;
    }
  }

  const count = symbolList.length;
  const headerSize = 0x1C;
  const indexSize = 0x20000;
  const dataSize = count * symSize;
  const totalSize = headerSize + indexSize + dataSize;

  const buf = new ArrayBuffer(totalSize);
  const dv = new DataView(buf);
  const data = new Uint8Array(buf);

  // Header
  data[0] = 0x66; data[1] = 0x6F; data[2] = 0x6E; data[3] = 0x54; // 'fonT'
  dv.setUint32(0x04, fw, true);
  dv.setUint32(0x08, stride, true);
  dv.setUint32(0x0C, fdh, true);
  dv.setUint32(0x10, fh, true);
  dv.setUint32(0x14, count, true);
  dv.setUint32(0x18, symSize, true);

  // Index table
  data.set(new Uint8Array(indexTable.buffer), headerSize);

  // Symbol data
  let off = headerSize + indexSize;
  for (const block of symbolList) {
    data.set(block, off);
    off += symSize;
  }

  downloadBuffer(buf, 'game.fnt');
}

function saveNonUnicodeFont() {
  const stride = font.stride;
  const fdh = font.lines;
  const fh = font.fontHeight;
  const fw = font.fontWidth;
  const symSize = 1 + stride * fdh;
  const startSym = font._startSym || 0;
  const endSym = font._endSym || 255;
  const glyphCount = endSym - startSym + 1;

  const buf = new ArrayBuffer(0x30 + symSize * glyphCount);
  const dv = new DataView(buf);
  const data = new Uint8Array(buf);

  // Header
  data[0] = 0x46; data[1] = 0x6F; data[2] = 0x4E; data[3] = 0x74; // 'FoNt'
  dv.setUint32(0x04, fw, true);
  dv.setUint32(0x08, stride, true);
  dv.setUint32(0x0C, fdh, true);
  dv.setUint32(0x10, fh, true);
  dv.setUint32(0x14, 0x01, true); // bppFormat
  dv.setUint32(0x18, symSize, true);
  dv.setUint32(0x1C, 0x24, true);
  dv.setUint32(0x20, 0x30, true);
  dv.setUint32(0x24, 0x00, true);
  dv.setUint32(0x28, startSym, true);
  dv.setUint32(0x2C, endSym, true);

  // Symbol data
  for (let i = 0; i < glyphCount; i++) {
    const code = startSym + i;
    const g = font.glyphs[code];
    const off = 0x30 + symSize * i;
    data[off] = g ? Math.min(g.width, 255) : 1;
    if (g) {
      const pixelData = encodePixels(g.pixels.slice(0, fdh), stride);
      data.set(pixelData, off + 1);
    }
  }

  downloadBuffer(buf, 'modified.fnt');
}

function downloadBuffer(buf, filename) {
  const blob = new Blob([buf]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('toast.savedAs', { name: filename }), false);
}

$('save-btn').addEventListener('click', saveFont);

// Preview divider (horizontal split)
const previewDivider = $('preview-divider');
let previewDividing = false;
if (previewDivider) {
  previewDivider.addEventListener('mousedown', e => {
    previewDividing = true;
    previewDivider.classList.add('active');
    e.preventDefault();
  });
}

document.addEventListener('mousemove', e => {
  if (previewDividing) {
    const body = document.querySelector('.preview-body');
    const rect = body.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    textInput.style.flex = `0 0 ${Math.max(20, Math.min(80, pct))}%`;
    return;
  }
  if (!previewResizing) return;
  const panelRect = $('center-panel').getBoundingClientRect();
  const newHeight = panelRect.bottom - e.clientY;
  previewSection.style.height = Math.max(80, newHeight) + 'px';
  renderRulers();
  renderGuides();
});

document.addEventListener('mouseup', () => {
  if (previewResizing) {
    previewResizing = false;
    if (previewResizeHandle) previewResizeHandle.classList.remove('active');
    renderEditor();
  }
  if (previewDividing) {
    previewDividing = false;
    if (previewDivider) previewDivider.classList.remove('active');
  }
});

// ==================== Font Size Apply ====================
$('apply-font-size').addEventListener('click', () => {
  if (!font) return;
  const newW = parseInt(fontWidthInput.value);
  const newH = parseInt(fontHeightInput.value);
  if (isNaN(newW) || newW < 1 || newW > 255) return;
  if (isNaN(newH) || newH < 1 || newH > 255) return;

  font.lines = newW;
  if (newH !== font.fontHeight) {
    // Resize all glyphs
    const oldH = font.fontHeight;
    for (const code in font.glyphs) {
      prepareGlyphEdit(code);
      const g = font.glyphs[code];
      if (newH > oldH) {
        // Add rows at bottom
        for (let y = oldH; y < newH; y++)
          g.pixels.push(new Array(g.width).fill(0));
      } else if (newH < oldH) {
        g.pixels = g.pixels.slice(0, newH);
      }
      g.height = newH;
    }
    font.fontHeight = newH;
  }

  showToast(t('toast.fontSizeUpdated', { w: newW, h: newH }), false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
});

// ==================== Navigation Dropdown ====================
function populateNavDropdown() {
  navDropdown.style.display = font ? 'block' : 'none';
  if (!font) return;
  const val = navDropdown.value;
  navDropdown.innerHTML = `<option value="">${t('nav.jumpGroup')}</option>`;
  charGroupList.querySelectorAll('.char-group').forEach(g => {
    const label = g.querySelector('.label');
    if (!label) return;
    const opt = document.createElement('option');
    opt.textContent = label.textContent;
    navDropdown.appendChild(opt);
  });
  navDropdown.value = val || '';
}

navDropdown.addEventListener('change', () => {
  const idx = navDropdown.selectedIndex;
  if (idx <= 0) return;
  const groups = charGroupList.querySelectorAll('.char-group');
  const target = groups[idx - 1];
  if (target) {
    const body = target.querySelector('.char-group-body');
    body.classList.remove('collapsed');
    target.querySelector('.toggle').textContent = '⌵';
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  navDropdown.selectedIndex = 0;
});

// ==================== Info Section Toggle ====================
document.querySelector('#info-section .section-toggle')?.addEventListener('click', function() {
  const content = document.getElementById(this.dataset.target);
  if (!content) return;
  const isVisible = content.style.display !== 'none';
  content.style.display = isVisible ? 'none' : 'block';
  this.querySelector('.toggle-icon').textContent = isVisible ? '❯' : '⌵';
});

// ==================== System Font List ====================
let systemFonts = [...COMMON_FONTS];
let fontPickerOpen = false;

let localFontsTried = false;

async function tryQueryLocalFonts() {
  if (localFontsTried) return;
  localFontsTried = true;
  let ok = false;
  try {
    if (typeof window.queryLocalFonts !== 'function') throw new Error('not supported');
    const fonts = await window.queryLocalFonts();
    const names = new Set();
    for (const f of fonts) {
      if (f.family) names.add(f.family);
    }
    if (names.size > 0) {
      systemFonts = [...names];
      ok = true;
    }
  } catch (e) {
    // Permission denied
  }
  if (!ok) systemFonts = [...COMMON_FONTS];
  populateFontPicker();
}

async function enumerateSystemFonts() {
  // Fallback: measure with canvas
  const testStr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const testFamilies = [
    ...COMMON_FONTS,
    'system-ui', 'sans-serif', 'serif', 'monospace',
    'Microsoft YaHei', 'SimSun', 'SimHei', 'NSimSun',
    'FangSong', 'KaiTi', 'DengXian', 'Microsoft JhengHei',
    'Segoe UI', 'Arial', 'Times New Roman', 'Courier New',
    'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia',
    'Impact', 'Comic Sans MS', 'Lucida Console',
  ];
  const found = new Set();
  const baseW = ctx.measureText(testStr).width;
  for (const name of testFamilies) {
    ctx.font = `16px "${name}", sans-serif`;
    const w = ctx.measureText(testStr).width;
    if (Math.abs(w - baseW) > 1) found.add(name);
  }
  systemFonts = [...found, ...COMMON_FONTS.filter(n => !found.has(n))];
}

// ==================== Font Picker (Custom Dropdown) ====================
function populateFontPicker() {
  const list = $('font-picker-list');
  const input = sysFontFamily;
  list.innerHTML = '';
  if (systemFonts.length === 0) {
    const item = document.createElement('div');
    item.className = 'font-picker-status';
    item.textContent = t('fonts.loading');
    list.appendChild(item);
    return;
  }
  for (const name of systemFonts) {
    const item = document.createElement('div');
    item.className = 'font-picker-item';
    const cn = lang === 'zh' ? FONT_CN_NAMES[name] : null;
    const label = cn ? `${cn} — ${name}` : name;
    item.innerHTML = cn
      ? `<span class="cn-name">${cn}</span><br><span class="english-name">${name}</span>`
      : `<span class="english-name">${name}</span>`;
    item.dataset.font = name;
    item.dataset.search = label.toLowerCase();
    item.addEventListener('click', () => {
      input.value = name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      closeFontPicker();
    });
    list.appendChild(item);
  }
  // Highlight selected
  if (input.value) {
    list.querySelectorAll('.font-picker-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.font === input.value);
    });
  }
}

function openFontPicker() {
  const list = $('font-picker-list');
  list.classList.add('open');
  fontPickerOpen = true;
  populateFontPicker();
  tryQueryLocalFonts();
}

function closeFontPicker() {
  const list = $('font-picker-list');
  list.classList.remove('open');
  fontPickerOpen = false;
}

// Font picker events
const fontPicker = $('font-picker');
if (fontPicker) {
  fontPicker.addEventListener('click', e => {
    if (e.target.closest('.font-picker-list')) return;
    if (fontPickerOpen) closeFontPicker();
    else openFontPicker();
  });

  // Close on click outside
  document.addEventListener('click', e => {
    if (!fontPicker.contains(e.target)) closeFontPicker();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFontPicker();
  });
}

// Font picker input — typing filters, programmatic set shows all
if (sysFontFamily) {
  sysFontFamily.addEventListener('input', e => {
    const list = $('font-picker-list');
    const items = list.querySelectorAll('.font-picker-item');
    if (e.isTrusted) {
      // Real user typing — apply filter
      const q = sysFontFamily.value.toLowerCase();
      items.forEach(el => {
        el.style.display = el.dataset.search.includes(q) ? '' : 'none';
      });
    } else {
      // Programmatic set (dropdown / wheel) — show all
      items.forEach(el => el.style.display = '');
    }
    if (e.isTrusted && !fontPickerOpen) {
      list.classList.add('open');
      fontPickerOpen = true;
    }
  });

  // Scroll wheel — filtered results or all fonts
  sysFontFamily.addEventListener('wheel', e => {
    e.preventDefault();
    const list = $('font-picker-list');
    const hasFilter = sysFontFamily.value.trim().length > 0;
    let items;
    if (hasFilter) {
      items = [...list.querySelectorAll('.font-picker-item')]
        .filter(el => el.style.display !== 'none');
      if (items.length === 0) { // no match → fall back to all
        populateFontPicker();
        items = [...list.querySelectorAll('.font-picker-item')];
      }
    } else {
      populateFontPicker();
      items = [...list.querySelectorAll('.font-picker-item')];
    }
    if (items.length === 0) return;
    const cur = sysFontFamily.value;
    let idx = items.findIndex(el => el.dataset.font === cur);
    if (e.deltaY < 0) {
      idx = idx <= 0 ? items.length - 1 : idx - 1;
    } else {
      idx = idx < 0 ? 0 : (idx >= items.length - 1 ? 0 : idx + 1);
    }
    sysFontFamily.value = items[idx].dataset.font;
    sysFontFamily.dispatchEvent(new Event('input', { bubbles: true }));
  }, { passive: false });
}

// Kick off font enumeration, default to 微软雅黑
enumerateSystemFonts().then(() => {
  if (systemFonts.includes('Microsoft YaHei')) {
    sysFontFamily.value = 'Microsoft YaHei';
  }
});

// ==================== Event Handlers ====================
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

editorZoomSlider.addEventListener('input', () => {
  renderEditor();
});

// Mouse wheel zoom on editor container (document-level for reliability)
document.addEventListener('wheel', e => {
  if (!e.target.closest('#editor-container')) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -1 : 1;
  const newVal = parseInt(editorZoomSlider.value) + delta;
  editorZoomSlider.value = Math.max(2, Math.min(32, newVal));
  renderEditor();
}, { passive: false });

// Preview resize handle drag
const previewResizeHandle = $('preview-resize-handle');
const previewSection = $('preview-section');
let previewResizing = false;

if (previewResizeHandle && previewSection) {
  previewResizeHandle.addEventListener('mousedown', e => {
    previewResizing = true;
    previewResizeHandle.classList.add('active');
    e.preventDefault();
  });
}

fgColorInput.addEventListener('input', () => {
  fgColorVal = fgColorInput.value;
  renderEditor();
  renderPreview();
});

$('fg-preset').addEventListener('change', function() {
  if (!this.value) { this.selectedIndex = 0; return; }
  fgColorVal = this.value;
  fgColorInput.value = this.value;
  renderEditor();
  renderPreview();
  this.selectedIndex = 0;
});

bgColorInput.addEventListener('input', () => {
  bgColorVal = bgColorInput.value;
  renderEditor();
  renderPreview();
});

textInput.addEventListener('input', renderPreview);

previewScaleSlider.addEventListener('input', renderPreview);

$('sc-tc-toggle').addEventListener('change', renderPreview);

// Copy editor canvas to clipboard at original resolution
$('copy-to-clipboard').addEventListener('click', () => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    showToast(t('toast.selectCharsFirst'), true);
    return;
  }
  const g = font.glyphs[selectedCode];
  const off = document.createElement('canvas');
  off.width = g.width; off.height = g.height;
  const ctx = off.getContext('2d');
  ctx.fillStyle = bgColorVal === 'transparent' ? '#212121' : bgColorVal;
  ctx.fillRect(0, 0, g.width, g.height);
  ctx.fillStyle = fgColorVal;
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      if (g.pixels[y] && g.pixels[y][x]) ctx.fillRect(x, y, 1, 1);
  off.toBlob(blob => {
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      .then(() => showToast(t('toast.copied')))
      .catch(() => showToast(t('toast.copyFailed'), true));
  });
});

// Clear editor canvas
$('clear-editor').addEventListener('click', () => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    showToast(t('toast.selectCharsFirst'), true);
    return;
  }
  prepareGlyphEdit(selectedCode);
  pushGlyphUndo(selectedCode);
  const g = font.glyphs[selectedCode];
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      g.pixels[y][x] = 0;
  afterGlyphEdit(selectedCode);
  showToast(t('toast.canvasCleared'));
});

// Refresh character list
$('refresh-char-list').addEventListener('click', () => {
  if (!font) return;
  rebuildCharGroups();
  showToast(t('toast.listRefreshed'));
});

// User guide
$('user-guide-btn').addEventListener('click', () => {
  $('user-guide-overlay').classList.add('open');
});
$('user-guide-close').addEventListener('click', () => {
  $('user-guide-overlay').classList.remove('open');
});
$('user-guide-overlay').addEventListener('click', (e) => {
  if (e.target === $('user-guide-overlay')) $('user-guide-overlay').classList.remove('open');
});

// Right panel drag-drop for custom fonts
const rightPanel = $('right-panel');
const rightDropHint = $('right-drop-hint');
const fontConvertSection = document.querySelector('#right-panel .section:last-child');

function handleFontFileDrop(file) {
  if (!file) return;
  const name = file.name.toLowerCase();
  if (name.endsWith('.fnt')) {
    handleFile(file);
    return;
  }
  if (name.endsWith('.ttf') || name.endsWith('.otf') || name.endsWith('.woff') || name.endsWith('.woff2')) {
    const reader = new FileReader();
    reader.onload = e => {
      const fontName = 'custom_' + Date.now();
      const fontFace = new FontFace(fontName, e.target.result);
      fontFace.load().then(f => {
        document.fonts.add(f);
        if (!systemFonts.includes(fontName)) {
          systemFonts.unshift(fontName);
          sysFontFamily.value = fontName;
          sysFontFamily.dispatchEvent(new Event('input', { bubbles: true }));
          showToast(t('toast.customFontLoaded', { name: file.name }), false);
        }
      }).catch(() => showToast(t('toast.fontLoadFailed'), true));
    };
    reader.readAsArrayBuffer(file);
    return;
  }
  showToast(t('toast.unsupportedFont'), true);
}

if (rightPanel && rightDropHint) {
  rightPanel.addEventListener('dragover', e => {
    e.preventDefault();
    rightDropHint.style.display = 'block';
    rightDropHint.classList.add('dragover');
  });
  rightPanel.addEventListener('dragleave', e => {
    if (!rightPanel.contains(e.relatedTarget)) {
      rightDropHint.classList.remove('dragover');
      rightDropHint.style.display = 'none';
    }
  });
  rightPanel.addEventListener('drop', e => {
    e.preventDefault();
    rightDropHint.classList.remove('dragover');
    rightDropHint.style.display = 'none';
    if (e.dataTransfer.files.length > 0) {
      handleFontFileDrop(e.dataTransfer.files[0]);
    }
  });
}

// ==================== Conversion Preview ====================
function renderConvPreview() {
  const section = $('conv-preview-section');
  const family = sysFontFamily.value.trim();
  if (!font || !family || !selectedCode || !font.glyphs[selectedCode]) {
    section.style.display = 'none'; return;
  }
  section.style.display = 'block';

  const g = font.glyphs[selectedCode];
  const fs = getRenderFontSize();
  const maxW = fs;
  const maxH = fs;
  const ch = String.fromCodePoint(selectedCode);
  const threshold = parseInt($('conv-threshold').value) || 128;
  const vertOffset = getVertOffset();
  const fontStyle = getFontStyle();
  const fineX = getFineX();
  const fineY = getFineY();
  const converted = renderSystemFontChar(ch, family, maxW, maxH, threshold, vertOffset, fontStyle, fineX, fineY);

  $('conv-label-before').textContent = t('conv.originalLabel', { n: g.width });

  const scale = 4;
  const pvW = 65;
  const pvH = 65;
  const ds = converted ? Math.max(1, Math.min(scale, Math.floor(pvW / Math.max(1, converted.width)), Math.floor(pvH / Math.max(1, font.fontHeight)))) : scale;
  const aoffX = converted ? Math.floor((pvW - converted.width * ds) / 2) : 0;
  const aoffY = converted ? Math.floor((pvH - font.fontHeight * ds) / 2) : 0;
  // Before canvas (original glyph)
  const cb = $('conv-preview-before');
  cb.width = pvW; cb.height = pvH;
  const bctx = cb.getContext('2d');
  bctx.fillStyle = '#212121'; bctx.fillRect(0, 0, cb.width, cb.height);
  bctx.fillStyle = '#eee';
  const bscale = Math.max(1, Math.min(scale, Math.floor(pvW / Math.max(1, g.width)), Math.floor(pvH / Math.max(1, g.height))));
  const boffX = Math.floor((pvW - g.width * bscale) / 2);
  const boffY = Math.floor((pvH - g.height * bscale) / 2);
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      if (g.pixels[y] && g.pixels[y][x]) bctx.fillRect(boffX + x * bscale, boffY + y * bscale, bscale, bscale);

  // Determine font size same as renderSystemFontChar
  let baseFontSize = maxH;
  {
    const mCtx = document.createElement('canvas').getContext('2d');
    mCtx.font = `${fontStyle} ${baseFontSize}px "${family}"`;
    let m = mCtx.measureText(ch);
    // 与 renderSystemFontChar 一致:不加 -1 裕量,避免全角汉字被误降到 15px
    while ((m.width > maxW || baseFontSize > maxH) && baseFontSize > 4) {
      baseFontSize--;
      mCtx.font = `${fontStyle} ${baseFontSize}px "${family}"`;
      m = mCtx.measureText(ch);
    }
  }

  // Determine font size for sysfont preview (fixed to default, not affected by slider)
  let sysBaseFontSize = 15;
  {
    const mCtx = document.createElement('canvas').getContext('2d');
    mCtx.font = `${fontStyle} ${sysBaseFontSize}px "${family}"`;
    let m = mCtx.measureText(ch);
    // 与主转换逻辑一致:不加 -1 裕量,避免全角汉字被误降到 14px
    while ((m.width > 15 || sysBaseFontSize > 15) && sysBaseFontSize > 4) {
      sysBaseFontSize--;
      mCtx.font = `${fontStyle} ${sysBaseFontSize}px "${family}"`;
      m = mCtx.measureText(ch);
    }
  }

  // Middle canvas (system font raw appearance, large rendering)
  const cs = $('conv-preview-sysfont');
  cs.width = pvW; cs.height = pvH;
  const sctx = cs.getContext('2d');
  sctx.fillStyle = '#212121'; sctx.fillRect(0, 0, cs.width, cs.height);
  sctx.font = `${fontStyle} ${sysBaseFontSize * scale}px "${family}"`;
  sctx.fillStyle = '#eee';
  sctx.textBaseline = 'top';
  sctx.textAlign = 'left';
  const sm = sctx.measureText(ch);
  const sw = Math.ceil(sm.width);
  const sx = Math.floor((cs.width - sw) / 2);
  const sy = Math.floor((cs.height - sysBaseFontSize * scale) / 2);
  sctx.fillText(ch, sx, sy);

  // Actual-size raw system font preview (same font size as conversion, no binarization)
  {
    const cr = $('conv-preview-sysfont-raw');
    const cH = maxH + 16;
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = maxW;
    rawCanvas.height = cH;
    const rawCtx = rawCanvas.getContext('2d');
    rawCtx.clearRect(0, 0, maxW, cH);
    rawCtx.font = `${fontStyle} ${baseFontSize}px "${family}"`;
    rawCtx.fillStyle = '#fff';
    // 与 renderSystemFontChar 一致:基线绘制,输出按统一基线对齐
    rawCtx.textBaseline = 'alphabetic';
    rawCtx.textAlign = 'left';
    const rawM = rawCtx.measureText(ch);
    const rw = Math.ceil(rawM.width);
    // 原生分辨率绘制,与 renderSystemFontChar 一致(fineY 小数部分通过位图插值实现)
    const rx = Math.floor((maxW - rw) / 2) + fineX;
    const rBaseY = Math.floor(cH * 0.75);
    rawCtx.fillText(ch, rx, rBaseY);

    // 每个输出格的 alpha 覆盖值
    const rId = rawCtx.getImageData(0, 0, maxW, cH);
    const rAlphaRaw = new Float32Array(maxW * cH);
    for (let y = 0; y < cH; y++)
      for (let x = 0; x < maxW; x++)
        rAlphaRaw[y * maxW + x] = rId.data[(y * maxW + x) * 4 + 3];

    // 与转换一致的亚像素 Y 插值(预览需与最终像素结果吻合)
    const fyFrac = fineY - Math.round(fineY);
    const rAlpha = Math.abs(fyFrac) > 0.001 ? shiftAlphaVertical(rAlphaRaw, maxW, cH, fyFrac) : rAlphaRaw;

    // Find content bounds from raw rendering (no threshold)
    let rl = maxW, rr = 0, rt = cH, rb = 0;
    for (let y = 0; y < cH; y++)
      for (let x = 0; x < maxW; x++)
        if (rAlpha[y * maxW + x] > 0) {
          if (x < rl) rl = x; if (x > rr) rr = x;
          if (y < rt) rt = y; if (y > rb) rb = y;
        }

    cr.width = pvW;
    cr.height = pvH;
    const rctx = cr.getContext('2d');
    rctx.fillStyle = '#212121';
    rctx.fillRect(0, 0, cr.width, cr.height);

    if (rl <= rr) {
      const roh = Math.min(font.fontHeight, maxH);
      const rch = rb - rt + 1;
      const rcw = rr - rl + 1;
      const rTargetBase = getFontBaselineAscent(rawCtx, fontStyle, family, baseFontSize) + vertOffset + Math.round(fineY);
      let rsy = rTargetBase - (rBaseY - rt);
      const rMinStart = 0, rMaxStart = Math.max(0, roh - rch);
      if (rsy > rMaxStart) rsy = rMaxStart;
      if (rsy < rMinStart) rsy = rMinStart;
      const rsx = Math.floor((maxW - rcw) / 2);
      // Build maxW-wide result (same centering as renderSystemFontChar), then trim empty columns
      const rResult = [];
      for (let y = 0; y < roh; y++) {
        const row = [];
        for (let x = 0; x < maxW; x++) {
          const srcY = rt + y - rsy;
          const srcX = rl + x - rsx;
          if (srcY >= 0 && srcY < cH && srcX >= 0 && srcX < maxW) {
            row.push(rAlpha[srcY * maxW + srcX]);
          } else {
            row.push(0);
          }
        }
        rResult.push(row);
      }
      let rLeft = maxW, rRight = 0;
      for (let y = 0; y < roh; y++)
        for (let x = 0; x < maxW; x++)
          if (rResult[y][x] > 0) { if (x < rLeft) rLeft = x; if (x > rRight) rRight = x; }
      if (rLeft <= rRight) {
        const rtW = rRight - rLeft + 1;
        for (let y = 0; y < roh; y++)
          for (let x = 0; x < rtW; x++) {
            const a = rResult[y][rLeft + x];
            if (a > 0) {
              rctx.globalAlpha = a / 255;
              rctx.fillStyle = '#f5c2e7';
              rctx.fillRect(aoffX + x * ds, aoffY + y * ds, ds, ds);
            }
          }
        rctx.globalAlpha = 1;
      }
    }
  }

  // After canvas (thresholded conversion)
  const ca = $('conv-preview-after');
  if (converted) {
    $('conv-label-after').textContent = t('conv.convertedLabel', { n: converted.width });
    ca.width = pvW; ca.height = pvH;
    const actx = ca.getContext('2d');
    actx.fillStyle = '#212121'; actx.fillRect(0, 0, ca.width, ca.height);
    let displayPixels = converted.pixels;
    if ($('shadow-toggle').checked) {
      displayPixels = applyShadowToPixels(converted.pixels, converted.width, Math.min(converted.pixels.length, font.fontHeight));
      actx.fillStyle = '#fab387';
    } else {
      actx.fillStyle = '#a6e3a1';
    }
    for (let y = 0; y < font.fontHeight && y < displayPixels.length; y++)
      for (let x = 0; x < converted.width; x++)
        if (displayPixels[y][x]) actx.fillRect(aoffX + x * ds, aoffY + y * ds, ds, ds);
  } else {
    ca.width = 0; ca.height = 0;
  }
}

$('conv-threshold').addEventListener('input', () => {
  $('conv-threshold-val').textContent = $('conv-threshold').value;
  renderConvPreview();
});

function getRenderFontSize() {
  return parseInt($('conv-font-size').value) || 15;
}
function getVertOffset() {
  return parseInt($('conv-vert-offset').value) || 0;
}
function getFontStyle() {
  return $('font-style').value || 'normal';
}
function getFineX() {
  return parseFloat($('conv-fine-x').value) || 0;
}
function getFineY() {
  return parseFloat($('conv-fine-y').value) || 0;
}
$('conv-font-size').addEventListener('input', () => {
  $('conv-font-size-val').textContent = $('conv-font-size').value;
  renderConvPreview();
});
$('conv-vert-offset').addEventListener('input', () => {
  $('conv-vert-offset-val').textContent = $('conv-vert-offset').value;
  renderConvPreview();
});
$('conv-fine-x').addEventListener('input', () => {
  $('conv-fine-x-val').textContent = getFineX().toFixed(1);
  renderConvPreview();
});
$('conv-fine-y').addEventListener('input', () => {
  $('conv-fine-y-val').textContent = getFineY().toFixed(1);
  renderConvPreview();
});

$('shadow-toggle').addEventListener('change', renderConvPreview);

// Trigger conv preview on selection/font change
const origUpdateEditor = updateEditorAndRightPanel;
updateEditorAndRightPanel = function() {
  origUpdateEditor();
  renderConvPreview();
};

sysFontFamily.addEventListener('input', renderConvPreview);
sysFontFamily.addEventListener('change', renderConvPreview);
$('font-style').addEventListener('change', renderConvPreview);
$('font-style').addEventListener('wheel', e => {
  e.preventDefault();
  const sel = $('font-style');
  const idx = sel.selectedIndex;
  const dir = e.deltaY > 0 ? 1 : -1;
  let next = idx + dir;
  if (next < 0) next = sel.options.length - 1;
  if (next >= sel.options.length) next = 0;
  sel.selectedIndex = next;
  sel.dispatchEvent(new Event('change'));
});

// ==================== Preview Popup ====================
$('preview-popup-btn').addEventListener('click', () => {
  if (!font) return;

  const overlay = document.createElement('div');
  overlay.className = 'preview-popup-overlay';

  const canvas = document.createElement('canvas');
  const scale = parseInt(previewScaleSlider.value) || 2;

  const rawText = textInput.value;
  if (!rawText.length) return;
  const convertSC = $('sc-tc-toggle').checked;
  const text = convertSC ? scToTc(rawText) : rawText;

  const lines = text.split('\n');
  const fh = font.fontHeight; const lineH = fh + 1;
  let maxW = 0;
  const lineGlyphs = [];
  for (const line of lines) {
    const glyphs = [];
    let totalW = 0;
    for (const ch of line) {
      const code = ch.codePointAt(0);
      const g = font.glyphs[code];
      if (!g) continue;
      glyphs.push(g); totalW += g.width;
    }
    totalW += Math.max(0, glyphs.length - 1);
    lineGlyphs.push(glyphs);
    maxW = Math.max(maxW, totalW);
  }
  if (maxW === 0) return;

  const totalH = Math.max(0, lines.length * lineH - 1);
  canvas.width = maxW; canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColorVal === 'transparent' ? '#212121' : bgColorVal;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fgColorVal;

  for (let li = 0; li < lines.length; li++) {
    let cx = 0;
    for (const g of lineGlyphs[li]) {
      for (let y = 0; y < g.height; y++)
        for (let x = 0; x < g.width; x++)
          if (g.pixels[y][x]) ctx.fillRect(cx + x, li * lineH + y, 1, 1);
      cx += g.width + 1;
    }
  }

  const bar = document.createElement('div');
  bar.className = 'preview-popup-bar';
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = 1; slider.max = 10; slider.value = scale;
  const label = document.createElement('span');
  label.style.cssText = 'font-size:12px;color:#cdd6f4';
  label.textContent = `${scale}×`;
  const close = document.createElement('button');
  close.textContent = t('popup.close');
  bar.appendChild(document.createTextNode(t('popup.zoom')));
  bar.appendChild(slider);
  bar.appendChild(label);
  bar.appendChild(close);

  const updatePopup = () => {
    const s = parseInt(slider.value) || scale;
    label.textContent = `${s}×`;
    canvas.style.width = (canvas.width * s) + 'px';
    canvas.style.height = (canvas.height * s) + 'px';
  };
  updatePopup();
  slider.addEventListener('input', updatePopup);

  close.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  });

  overlay.appendChild(canvas);
  overlay.appendChild(bar);
  document.body.appendChild(overlay);
});

// ==================== Language Change Hook ====================
// 语言切换时重新渲染所有动态生成的内容
window.onLanguageChange = () => {
  updateBrushSizeLabel();
  updateSeparateSharedTitle();
  if (font) {
    renderInfoGrid();
    rebuildCharGroups();
    populateNavDropdown();
    updateGlyphInfo();
    updateBatchInfo();
    renderConvPreview();
    if (selectedCode !== null) {
      const range = getGroupForCode(selectedCode);
      if (range) {
        const el = charGroupList.querySelector(`.char-group[data-range-start="${range.start}"] .char-group-header`);
        if (el) el.classList.add('active');
      }
    }
  }
  if (systemFonts.length > 0) populateFontPicker();
};
