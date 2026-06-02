// ==================== Unicode Ranges ====================
const UNICODE_RANGES = [
  { name: 'C0控制符+基本拉丁文(ANSI)', start: 0x0000, end: 0x007F },
  { name: '拉丁文补充-1', start: 0x0080, end: 0x00FF },
  { name: '拉丁文扩展-A', start: 0x0100, end: 0x017F },
  { name: '拉丁文扩展-B', start: 0x0180, end: 0x024F },
  { name: '国际音标扩展', start: 0x0250, end: 0x02AF },
  { name: '修饰用间隔符号', start: 0x02B0, end: 0x02FF },
  { name: '组合附加符号', start: 0x0300, end: 0x036F },
  { name: '希腊文和科普特文', start: 0x0370, end: 0x03FF },
  { name: '西里尔文', start: 0x0400, end: 0x04FF },
  { name: '西里尔文补充', start: 0x0500, end: 0x052F },
  { name: '亚美尼亚文', start: 0x0530, end: 0x058F },
  { name: '希伯来文', start: 0x0590, end: 0x05FF },
  { name: '阿拉伯文', start: 0x0600, end: 0x06FF },
  { name: '天城文', start: 0x0900, end: 0x097F },
  { name: '孟加拉文', start: 0x0980, end: 0x09FF },
  { name: '通用标点符号', start: 0x2000, end: 0x206F },
  { name: '货币符号', start: 0x20A0, end: 0x20CF },
  { name: '类字母符号', start: 0x2100, end: 0x214F },
  { name: '箭头', start: 0x2190, end: 0x21FF },
  { name: '数学运算符', start: 0x2200, end: 0x22FF },
  { name: '制表符', start: 0x2500, end: 0x257F },
  { name: '方块元素', start: 0x2580, end: 0x259F },
  { name: '几何图形', start: 0x25A0, end: 0x25FF },
  { name: '杂项符号', start: 0x2600, end: 0x26FF },
  { name: 'CJK符号和标点', start: 0x3000, end: 0x303F },
  { name: '平假名', start: 0x3040, end: 0x309F },
  { name: '片假名', start: 0x30A0, end: 0x30FF },
  { name: '谚文兼容字母', start: 0x3130, end: 0x318F },
  { name: '带括号CJK字母月份', start: 0x3200, end: 0x32FF },
  { name: 'CJK统一表意文字', start: 0x4E00, end: 0x9FFF },
  { name: '谚文音节', start: 0xAC00, end: 0xD7AF },
  { name: '私用区', start: 0xE000, end: 0xF8FF },
  { name: '半角/全角形式', start: 0xFF00, end: 0xFFEF },
  { name: '特殊字符', start: 0xFFF0, end: 0xFFFF },
];

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

// ==================== DOM Refs ====================
const $ = id => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('file-input');
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
const batchCount = $('batch-count');
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
  if (!file.name.match(/\.fnt$/i)) { showToast('请选择 .FNT 文件', true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      parseFont(new Uint8Array(e.target.result));
      showToast(`已加载字体 (${font.fontType})，${Object.keys(font.glyphs).length} 个字符`, false);
    } catch (ex) { showToast('解析失败: ' + ex.message, true); }
  };
  reader.readAsArrayBuffer(file);
}

function parseFont(data) {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = String.fromCharCode(data[0], data[1], data[2], data[3]);
  let fontType;
  if (magic === 'FoNt') fontType = 'RA2 非 Unicode';
  else if (magic === 'fonT') fontType = 'RA2 Unicode';
  else throw new Error('无效魔数: ' + magic);
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
      showToast(`警告: SymbolDataSize=${symDataSize}, 期望=${expectedSymSize}`, false);
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
    font = { isUnicode, fontWidth: spaceWidth, stride, lines: fontDataHeight, fontHeight, symDataSize, glyphs, fontType, _raw: data, _sharedCodes: sharedCodes };
    infoGrid.innerHTML = `
      <dt>格式</dt><dd>${fontType}</dd>
      <dt>魔数</dt><dd>${magic}</dd>
      <dt>字符宽度</dt><dd>${fontDataHeight}</dd>
      <dt>Stride</dt><dd>${stride} 字节</dd>
      <dt>FontHeight</dt><dd>${fontHeight} 像素</dd>
      <dt>唯一符号数</dt><dd>${count}</dd>
      <dt>SymbolDataSize</dt><dd>${symDataSize}</dd>
      <dt>已映射字符</dt><dd>${Object.keys(glyphs).length} / 0x10000</dd>
      <dt>文件大小</dt><dd>${data.length} 字节</dd>`;
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
      showToast(`警告: SymbolDataSize=${symDataSize}, 期望=${expectedSymSize}`, false);
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
    font = { isUnicode, fontWidth, stride, lines: fontDataHeight, fontHeight, symDataSize, glyphs, fontType, _raw: data, _startSym: startSym, _endSym: endSym };
    infoGrid.innerHTML = `
      <dt>格式</dt><dd>${fontType}</dd>
      <dt>魔数</dt><dd>${magic}</dd>
      <dt>字符宽度</dt><dd>${fontDataHeight}</dd>
      <dt>Stride</dt><dd>${stride} 字节</dd>
      <dt>FontHeight</dt><dd>${fontHeight} 像素</dd>
      <dt>bppFormat</dt><dd>${dword10}</dd>
      <dt>SymbolDataSize</dt><dd>${symDataSize}</dd>
      <dt>字符范围</dt><dd>0x${startSym.toString(16)} - 0x${endSym.toString(16)} (共 ${glyphCount} 个)</dd>
      <dt>文件大小</dt><dd>${data.length} 字节</dd>`;
  }

  selectedCode = null;
  selectedCodes.clear();
  groupCanvasCache.clear();
  searchHighlightCode = null;
  fontWidthInput.value = font.lines;
  fontHeightInput.value = font.fontHeight;
  dropzone.classList.add('dropped');
  dropzone.textContent = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '已加载字体';
  infoContent.style.display = 'block';
  document.querySelector('#info-section .toggle-icon').textContent = '▼';
  buildCharGroups();
  updateEditorAndRightPanel();
  renderPreview();
}

// ==================== Left Panel: Character Groups ====================
function buildCharGroups() {
  charGroupList.innerHTML = '';
  if (!font) return;
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
    p.textContent = '字体中没有可显示的字符';
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
  toggle.textContent = '▸';
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = range.name;
  const count = document.createElement('span');
  count.className = 'count';
  count.textContent = `${codes.length}`;
  const addBtn = document.createElement('button');
  addBtn.className = 'add-missing-btn';
  addBtn.textContent = '+';
  addBtn.title = '添加此分组缺失的字符';

  header.appendChild(check);
  header.appendChild(toggle);
  header.appendChild(label);
  header.appendChild(count);

  const sharedCount = font._sharedCodes ? codes.filter(c => font._sharedCodes.has(c)).length : 0;
  if (sharedCount > 0) {
    const sharedSpan = document.createElement('span');
    sharedSpan.style.cssText = 'color:#f9e2af;font-size:10px;margin-left:2px';
    sharedSpan.textContent = `${sharedCount} 共享`;
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
  const grpBg = bgColorVal === 'transparent' ? '#1e1e2e' : bgColorVal;
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

    // Highlight if selected
    if (code === selectedCode) {
      ctx.fillStyle = 'rgba(245,194,231,0.2)';
      ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    }
    if (code !== selectedCode && selectedCodes.has(code)) {
      ctx.fillStyle = 'rgba(166,227,161,0.15)';
      ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    }

    // Draw pixels
    ctx.fillStyle = fgColorVal;
    for (let y = 0; y < g.height && y < cellH - 2; y++) {
      for (let x = 0; x < g.width && x < cellW - 2; x++) {
        if (g.pixels[y] && g.pixels[y][x]) {
          ctx.fillRect(bx + x, by + y, 1, 1);
        }
      }
    }

    hitMap.push({ code, bx: col * cellW, by: row * cellH, w: cellW, h: cellH });
  });

  // Draw border for selected/active
  codes.forEach((code, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (code === selectedCode) {
      ctx.strokeStyle = '#f5c2e7';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);
    } else if (selectedCodes.has(code)) {
      ctx.strokeStyle = '#a6e3a1';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);
    }
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
      for (const h of hitMap) {
        if (x2 > h.bx && x1 < h.bx + h.w && y2 > h.by && y1 < h.by + h.h) {
          if (e.ctrlKey || e.metaKey) {
            if (selectedCodes.has(h.code)) selectedCodes.delete(h.code);
            else selectedCodes.add(h.code);
          } else {
            selectedCodes.add(h.code);
          }
        }
      }
      syncGroupCheckboxes();
      updateBatchInfo();
      rebuildCharGroups();
    } else {
      for (const h of hitMap) {
        if (pt.x >= h.bx && pt.x < h.bx + h.w && pt.y >= h.by && pt.y < h.by + h.h) {
          if (e.ctrlKey || e.metaKey) {
            if (selectedCodes.has(h.code)) selectedCodes.delete(h.code);
            else selectedCodes.add(h.code);
            syncGroupCheckboxes();
            updateBatchInfo();
            rebuildCharGroups();
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

  header.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.tagName === 'BUTTON') return;
    body.classList.toggle('collapsed');
    toggle.textContent = body.classList.contains('collapsed') ? '▸' : '▾';
  });

  check.addEventListener('change', function() {
    const checked = this.checked;
    for (const code of codes) {
      if (checked) selectedCodes.add(code);
      else selectedCodes.delete(code);
    }
    // Update all group checkboxes
    syncGroupCheckboxes();
    updateBatchInfo();
    rebuildCharGroups();
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
      toggle.textContent = '▸';
    } else {
      body.classList.remove('collapsed');
      toggle.textContent = '▾';
    }
  });
  charGroupList.scrollTop = scrollTop;
  syncGroupCheckboxes();
  if (selectedCode !== null) addSelectionHighlight(selectedCode);
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
    box-shadow: 0 0 6px rgba(250,227,113,0.5);
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

function selectChar(code) {
  if (!font || !font.glyphs[code]) return;
  detachGlyph(code);
  removeSelectionHighlight();
  if (code === selectedCode) {
    selectedCode = null;
  } else {
    selectedCode = code;
    addSelectionHighlight(code);
  }
  document.querySelectorAll('.char-group-header.active').forEach(h => h.classList.remove('active'));
  if (selectedCode !== null) {
    const range = getGroupForCode(code);
    if (range) {
      const el = charGroupList.querySelector(`.char-group[data-range-start="${range.start}"] .char-group-header`);
      if (el) el.classList.add('active');
    }
  }
  updateEditorAndRightPanel();
  updateBatchInfo();
}

function addSelectionHighlight(code) {
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
  indicator.className = 'selection-highlight';
  indicator.style.cssText = `
    position: absolute; left: ${ox + col * cellW}px; top: ${oy + row * cellH}px;
    width: ${cellW}px; height: ${cellH}px;
    border: 2px solid #f5c2e7; pointer-events: none; z-index: 9;
    box-shadow: 0 0 6px rgba(245,194,231,0.5);
  `;
  body.style.position = 'relative';
  body.appendChild(indicator);
}

function removeSelectionHighlight() {
  charGroupList.querySelectorAll('.selection-highlight').forEach(el => el.remove());
}

function getGroupForCode(code) {
  for (const range of UNICODE_RANGES) {
    if (code >= range.start && code <= range.end) return range;
  }
  return null;
}

function updateEditorAndRightPanel() {
  renderEditor();
  updateGlyphInfo();
}

function updateGlyphInfo() {
  const charPreview = $('glyph-char-preview');
  const charDisplay = $('glyph-char-display');
  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    glyphInfo.textContent = '请选择一个字符';
    glyphWidthInput.value = '';
    if (charPreview) charPreview.style.display = 'none';
    return;
  }
  const g = font.glyphs[selectedCode];
  glyphInfo.textContent = `U+${selectedCode.toString(16).padStart(4, '0')} 宽度=${g.width} 高度=${g.height}`;
  glyphWidthInput.value = g.width;
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
    batchCount.textContent = count;
  } else {
    batchInfoBar.style.display = 'none';
  }
}

// ==================== Editor ====================
function renderEditor() {
  const zoom = parseInt(editorZoomSlider.value);
  editorZoom = zoom;
  const ctx = editorCanvas.getContext('2d');

  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    editorCanvas.width = 0;
    editorCanvas.height = 0;
    return;
  }

  const g = font.glyphs[selectedCode];
  const w = g.width;
  const h = g.height;
  editorCanvas.width = w * zoom;
  editorCanvas.height = h * zoom;

  // Background
  ctx.fillStyle = bgColorVal === 'transparent' ? '#1e1e2e' : bgColorVal;
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
  ctx.strokeStyle = 'rgba(205,214,244,0.1)';
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
}

// Editor mouse interaction
let editorDrawing = false;
let editorErasing = false;

editorCanvas.addEventListener('contextmenu', e => e.preventDefault());

editorCanvas.addEventListener('mousedown', e => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  if (e.button === 0) { editorDrawing = true; editorErasing = false; }
  else if (e.button === 2) { editorDrawing = true; editorErasing = true; }
  editorSetPixel(e);
});

editorCanvas.addEventListener('mousemove', e => {
  if (!editorDrawing) {
    if (e.buttons === 1) { editorDrawing = true; editorErasing = false; }
    else if (e.buttons === 2) { editorDrawing = true; editorErasing = true; }
    else return;
  }
  editorSetPixel(e);
});

const editorMouseUpHandler = () => { editorDrawing = false; };
document.addEventListener('mouseup', editorMouseUpHandler);

editorCanvas.addEventListener('mouseleave', () => { editorDrawing = false; });

function editorSetPixel(e) {
  const g = font.glyphs[selectedCode];
  if (!g) return;
  const zoom = editorZoom;
  const rect = editorCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
  const px = Math.floor(mx / zoom);
  const py = Math.floor(my / zoom);
  if (px < 0 || px >= g.width || py < 0 || py >= g.height) return;

  g.pixels[py][px] = editorErasing ? 0 : 1;
  renderEditor();
}

// Move controls
function moveGlyphContent(dx, dy) {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  detachGlyph(selectedCode);
  const g = font.glyphs[selectedCode];
  const newPixels = [];
  for (let y = 0; y < g.height; y++) {
    const newRow = new Array(g.width).fill(0);
    for (let x = 0; x < g.width; x++) {
      if (g.pixels[y] && g.pixels[y][x]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < g.width && ny >= 0 && ny < g.height) newRow[nx] = 1;
      }
    }
    newPixels.push(newRow);
  }
  g.pixels = newPixels;
  renderEditor();
}

function centerGlyphContent() {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) return;
  detachGlyph(selectedCode);
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
  renderEditor();
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
  detachGlyph(selectedCode);
  const newW = parseInt(glyphWidthInput.value);
  if (isNaN(newW) || newW < 1 || newW > 255) return;
  const g = font.glyphs[selectedCode];
  if (newW === g.width) return;
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
  updateGlyphInfo();
  renderEditor();
  renderPreview();
  rebuildCharGroups();
});

// Move buttons
$('move-up').addEventListener('click', () => moveGlyphContent(0, -1));
$('move-down').addEventListener('click', () => moveGlyphContent(0, 1));
$('move-left').addEventListener('click', () => moveGlyphContent(-1, 0));
$('move-right').addEventListener('click', () => moveGlyphContent(1, 0));
$('move-center').addEventListener('click', centerGlyphContent);

// ==================== Batch Operations ====================
function getSelectedGlyphCodes() {
  return [...selectedCodes].filter(code => font.glyphs[code]);
}

function batchSetWidth(newWidth) {
  const codes = getSelectedGlyphCodes();
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
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
  showToast(`已批量设置 ${codes.filter(c => font.glyphs[c].width === newWidth).length} 个字符宽度为 ${newWidth}`, false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

function batchCenter() {
  const codes = getSelectedGlyphCodes();
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
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
  showToast(`已居中 ${codes.length} 个字符`, false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
}

function batchClearAll() {
  const codes = getSelectedGlyphCodes();
  for (const code of codes) detachGlyph(code);
  for (const code of codes) {
    const g = font.glyphs[code];
    for (let y = 0; y < g.height; y++)
      for (let x = 0; x < g.width; x++)
        g.pixels[y][x] = 0;
  }
  showToast(`已清除 ${codes.length} 个字符`, false);
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

function renderSystemFontChar(char, fontFamily, maxW, maxH, threshold = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = maxH;
  const ctx = canvas.getContext('2d');

  let fontSize = maxH;
  ctx.font = `${fontSize}px "${fontFamily}"`;
  let metrics = ctx.measureText(char);
  while ((metrics.width > maxW - 1 || fontSize > maxH) && fontSize > 4) {
    fontSize--;
    ctx.font = `${fontSize}px "${fontFamily}"`;
    metrics = ctx.measureText(char);
  }

  ctx.clearRect(0, 0, maxW, maxH);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(char, maxW / 2, maxH / 2);

  const imageData = ctx.getImageData(0, 0, maxW, maxH);
  const pixels = [];
  for (let y = 0; y < maxH; y++) {
    const row = [];
    for (let x = 0; x < maxW; x++) {
      row.push(imageData.data[(y * maxW + x) * 4 + 3] > threshold ? 1 : 0);
    }
    pixels.push(row);
  }

  // Find content bounds
  let left = maxW, right = 0, top = maxH, bottom = 0;
  for (let y = 0; y < maxH; y++)
    for (let x = 0; x < maxW; x++)
      if (pixels[y][x]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }

  if (left > right) return null; // empty

  // For height, use font.fontHeight but ensure it fits
  const outH = Math.min(font.fontHeight, maxH);
  const outW = Math.min(right - left + 1, maxW);
  const trimmed = [];
  // Center vertically within fontHeight
  const vy = Math.max(0, Math.floor((outH - (bottom - top + 1)) / 2) - top);
  for (let y = 0; y < outH; y++) {
    const row = [];
    for (let x = 0; x < outW; x++) {
      const sx = left + x;
      const sy = y - vy;
      row.push(sy >= 0 && sy < maxH && sx < maxW && pixels[sy][sx] ? 1 : 0);
    }
    trimmed.push(row);
  }

  return { width: outW, pixels: trimmed };
}

function convertGlyphFromSystemFont(code, fontFamily, threshold = 128) {
  if (!font || !font.glyphs[code]) return false;
  detachGlyph(code);
  const maxW = Math.min(15, font.lines || 15);
  const maxH = Math.min(17, font.fontHeight || 17);
  const ch = String.fromCodePoint(code);
  const result = renderSystemFontChar(ch, fontFamily, maxW, maxH, threshold);
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
  if (!family) { showToast('请输入系统字体名称', true); return; }
  const codes = getSelectedGlyphCodes();
  if (codes.length === 0 && selectedCode) codes.push(selectedCode);
  if (codes.length === 0) { showToast('请先选择字符', true); return; }
  const threshold = parseInt($('conv-threshold').value) || 128;
  let count = 0;
  for (const code of codes) {
    if (convertGlyphFromSystemFont(code, family, threshold)) count++;
  }
  showToast(`已转换 ${count} 个字符为系统字体 "${family}"`, false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
});

$('sys-font-convert-all').addEventListener('click', () => {
  const family = sysFontFamily.value.trim();
  if (!family) { showToast('请输入系统字体名称', true); return; }
  const threshold = parseInt($('conv-threshold').value) || 128;
  const codes = Object.keys(font.glyphs).map(Number);
  let count = 0;
  for (const code of codes) {
    if (convertGlyphFromSystemFont(code, family, threshold)) count++;
  }
  showToast(`已转换全部 ${count} 个字符为系统字体 "${family}"`, false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
});

// ==================== Add Missing Characters Modal ====================
function openAddMissingModal(range) {
  if (!font) return;
  const family = sysFontFamily.value.trim();
  if (!family) { showToast('请先选择系统字体', true); return; }

  const missing = [];
  for (let code = range.start; code <= range.end; code++) {
    if (!font.glyphs[code]) missing.push(code);
  }
  if (missing.length === 0) { showToast('此分组没有缺失字符', false); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('span');
  title.className = 'modal-title';
  title.textContent = `添加缺失字符 — ${range.name} (共 ${missing.length} 个)`;
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
    note.textContent = `... 还有 ${missing.length - 1000} 个字符未显示`;
    body.appendChild(note);
  }

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const addBtn = document.createElement('button');
  addBtn.className = 'primary';
  addBtn.textContent = '添加选中';
  const toggleAllBtn = document.createElement('button');
  toggleAllBtn.textContent = '全选';
  let allSelected = false;
  toggleAllBtn.addEventListener('click', () => {
    allSelected = !allSelected;
    toggleAllBtn.textContent = allSelected ? '取消全选' : '全选';
    for (const { el, code } of allItems) {
      el.classList.toggle('checked', allSelected);
      if (allSelected) selectedSet.add(code);
      else selectedSet.delete(code);
    }
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
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
    const maxW = Math.min(15, font.lines || 15);
    const maxH = Math.min(17, font.fontHeight || 17);
    const threshold = parseInt($('conv-threshold').value) || 128;
    let added = 0;
    for (const code of selectedSet) {
      if (font.glyphs[code]) continue;
      const ch = String.fromCodePoint(code);
      const result = renderSystemFontChar(ch, family, maxW, maxH, threshold);
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
    showToast(`已添加 ${added} 个字符`, false);
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
  showToast(`已保存为 ${filename}`, false);
}

$('save-btn').addEventListener('click', saveFont);

// Preview resize document-level handlers
document.addEventListener('mousemove', e => {
  if (!previewResizing) return;
  const panelRect = $('center-panel').getBoundingClientRect();
  const newHeight = panelRect.bottom - e.clientY;
  previewSection.style.height = Math.max(80, newHeight) + 'px';
});

document.addEventListener('mouseup', () => {
  if (previewResizing) {
    previewResizing = false;
    if (previewResizeHandle) previewResizeHandle.classList.remove('active');
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
      detachGlyph(code);
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

  showToast(`字体尺寸已更新: ${newW}×${newH}`, false);
  updateEditorAndRightPanel();
  renderPreview();
  rebuildCharGroups();
});

// ==================== Navigation Dropdown ====================
function populateNavDropdown() {
  navDropdown.style.display = font ? 'block' : 'none';
  if (!font) return;
  const val = navDropdown.value;
  navDropdown.innerHTML = '<option value="">— 快速定位到分组 —</option>';
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
    target.querySelector('.toggle').textContent = '▾';
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
  this.querySelector('.toggle-icon').textContent = isVisible ? '▶' : '▼';
});

// ==================== System Font List ====================
let systemFonts = [...COMMON_FONTS];
let fontPickerOpen = false;

async function enumerateSystemFonts() {
  // Try Local Font Access API first
  try {
    if (typeof window.queryLocalFonts === 'function') {
      const fonts = await window.queryLocalFonts();
      const names = new Set();
      for (const f of fonts) {
        if (f.family) names.add(f.family);
      }
      systemFonts = [...names, ...COMMON_FONTS.filter(n => !names.has(n))];
      return;
    }
  } catch (e) {
    // Permission denied or not supported
  }

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

  if (systemFonts.length <= COMMON_FONTS.length) {
    showToast('无法自动检测系统字体。Local Font Access API 不可用，请使用较新 Chrome/Edge (103+) 或手动输入字体名称', false);
  }
}

// ==================== Font Picker (Custom Dropdown) ====================
function populateFontPicker() {
  const list = $('font-picker-list');
  const input = sysFontFamily;
  list.innerHTML = '';
  if (systemFonts.length === 0) {
    const item = document.createElement('div');
    item.className = 'font-picker-status';
    item.textContent = '正在加载字体列表...';
    list.appendChild(item);
    return;
  }
  for (const name of systemFonts) {
    const item = document.createElement('div');
    item.className = 'font-picker-item';
    const cn = FONT_CN_NAMES[name];
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

// Filter font list on input
if (sysFontFamily) {
  sysFontFamily.addEventListener('input', () => {
    const q = sysFontFamily.value.toLowerCase();
    const list = $('font-picker-list');
    list.querySelectorAll('.font-picker-item').forEach(el => {
      el.style.display = el.dataset.search.includes(q) ? '' : 'none';
    });
    if (!fontPickerOpen) {
      list.classList.add('open');
      fontPickerOpen = true;
    }
  });
}

// Kick off font enumeration
enumerateSystemFonts();

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
    showToast('请先选择字符', true);
    return;
  }
  const g = font.glyphs[selectedCode];
  const off = document.createElement('canvas');
  off.width = g.width; off.height = g.height;
  const ctx = off.getContext('2d');
  ctx.fillStyle = bgColorVal === 'transparent' ? '#1e1e2e' : bgColorVal;
  ctx.fillRect(0, 0, g.width, g.height);
  ctx.fillStyle = fgColorVal;
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      if (g.pixels[y] && g.pixels[y][x]) ctx.fillRect(x, y, 1, 1);
  off.toBlob(blob => {
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      .then(() => showToast('已复制到剪切板'))
      .catch(() => showToast('复制失败', true));
  });
});

// Clear editor canvas
$('clear-editor').addEventListener('click', () => {
  if (!font || !selectedCode || !font.glyphs[selectedCode]) {
    showToast('请先选择字符', true);
    return;
  }
  detachGlyph(selectedCode);
  const g = font.glyphs[selectedCode];
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      g.pixels[y][x] = 0;
  renderEditor();
  renderPreview();
  rebuildCharGroups();
  showToast('已清空画布');
});

// Refresh character list
$('refresh-char-list').addEventListener('click', () => {
  if (!font) return;
  rebuildCharGroups();
  showToast('列表已刷新');
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
          showToast(`已加载自定义字体: ${file.name}`, false);
        }
      }).catch(() => showToast('字体加载失败', true));
    };
    reader.readAsArrayBuffer(file);
    return;
  }
  showToast('不支持的字体格式', true);
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
  const maxW = Math.min(15, font.lines || 15);
  const maxH = Math.min(17, font.fontHeight || 17);
  const ch = String.fromCodePoint(selectedCode);
  const threshold = parseInt($('conv-threshold').value) || 128;
  const converted = renderSystemFontChar(ch, family, maxW, maxH, threshold);

  const scale = 4;
  // Before canvas (original glyph)
  const cb = $('conv-preview-before');
  cb.width = g.width * scale; cb.height = g.height * scale;
  const bctx = cb.getContext('2d');
  bctx.fillStyle = '#1e1e2e'; bctx.fillRect(0, 0, cb.width, cb.height);
  bctx.fillStyle = '#cdd6f4';
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++)
      if (g.pixels[y] && g.pixels[y][x]) bctx.fillRect(x * scale, y * scale, scale, scale);

  // Middle canvas (system font raw appearance)
  const cs = $('conv-preview-sysfont');
  cs.width = maxW * scale; cs.height = maxH * scale;
  const sctx = cs.getContext('2d');
  sctx.fillStyle = '#1e1e2e'; sctx.fillRect(0, 0, cs.width, cs.height);
  let displaySz = maxH * scale;
  sctx.font = `${displaySz}px "${family}"`;
  while (sctx.measureText(ch).width > cs.width * 0.95 && displaySz > 4) {
    displaySz--;
    sctx.font = `${displaySz}px "${family}"`;
  }
  sctx.fillStyle = '#f5c2e7';
  sctx.textBaseline = 'middle';
  sctx.textAlign = 'center';
  sctx.fillText(ch, cs.width / 2, cs.height / 2);

  // After canvas (thresholded conversion)
  const ca = $('conv-preview-after');
  if (converted) {
    const ah = font.fontHeight;
    ca.width = converted.width * scale; ca.height = ah * scale;
    const actx = ca.getContext('2d');
    actx.fillStyle = '#1e1e2e'; actx.fillRect(0, 0, ca.width, ca.height);
    let displayPixels = converted.pixels;
    if ($('shadow-toggle').checked) {
      displayPixels = applyShadowToPixels(converted.pixels, converted.width, Math.min(converted.pixels.length, ah));
      actx.fillStyle = '#fab387';
    } else {
      actx.fillStyle = '#a6e3a1';
    }
    for (let y = 0; y < ah && y < displayPixels.length; y++)
      for (let x = 0; x < converted.width; x++)
        if (displayPixels[y][x]) actx.fillRect(x * scale, y * scale, scale, scale);
  } else {
    ca.width = 0; ca.height = 0;
  }
}

$('conv-threshold').addEventListener('input', () => {
  $('conv-threshold-val').textContent = $('conv-threshold').value;
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
  ctx.fillStyle = bgColorVal === 'transparent' ? '#1e1e2e' : bgColorVal;
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
  close.textContent = '关闭';
  bar.appendChild(document.createTextNode('缩放 '));
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
