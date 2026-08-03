// ==================== 国际化 (i18n) ====================
// 语言文件放在 src 内;默认跟随系统语言,非中文环境一律使用英文。

const I18N = {
  zh: {
    'app.title': 'RA2 字体编辑器',
    'langToggle.title': '切换语言',
    'scTc.label': '简繁转换',
    'scTc.title': '将简体中文转为繁体，用于输简体显示繁体。',
    'fontInfo.title': '字体信息',
    'dropzone.dropHere': '拖放 .FNT 文件到此处',
    'dropzone.orClick': '或点击选择文件',
    'field.width': '宽度',
    'field.height': '高度',
    'field.width.title': 'Ideograph Width（来自字体文件头）',
    'applyFontSize.title': '全局字体画布大小，具体宽度由每个字单独指定，谨慎修改。',
    'apply': '应用',
    'saveFont': '保存字体',
    'charList.title': '字符列表',
    'batch.selected': '已选 {n} 个字符',
    'refreshList': '刷新列表',
    'refreshList.title': '刷新字符列表',
    'nav.quickJump': '— 快速定位 —',
    'search.placeholder': '搜索字符/U+编码...',
    'search.add': '添加',
    'noCharsInFont': '字体中没有可显示的字符',
    'group.addMissing.title': '添加此分组缺失的字符',
    'group.shared': '{n} 共享',
    'editor.title': '编辑器',
    'zoom': '缩放',
    'brushLabel': '画笔: {n}',
    'brushLabel.title': '画笔大小,在编辑画布上按 + / - 或 [ / ] 调整',
    'ruler': '标尺',
    'ruler.title': '显示/隐藏标尺。左键点击标尺创建辅助线,拖动可移动,右键点击辅助线移除',
    'autoRefresh': '自动刷新',
    'autoRefresh.title': '切换字符时自动同步刷新字符列表;CJK 等大字符集下可关闭以提升性能',
    'clearGuides': '清辅助线',
    'clearGuides.title': '清除所有辅助线',
    'restore': '还原',
    'restore.title': '将该字符恢复为加载字体时的原始字形 (Ctrl+Z 撤销 / Ctrl+Y 重做)',
    'clearCanvas': '清空画布',
    'clearCanvas.title': '清空画布',
    'copyImage': '复制图像',
    'copyImage.title': '复制原始分辨率图像到剪切板',
    'userGuide': '使用说明',
    'userGuide.title': '查看使用说明',
    'preview.title': '预览',
    'preview.scale': '缩放倍数',
    'preview.fg': '前景色',
    'preview.bg': '背景色',
    'preview.preset': '预设',
    'preview.preset.title': '预设颜色',
    'color.yellow': '黄色', 'color.orange': '橙色', 'color.red': '红色',
    'color.cyan': '青色', 'color.green': '绿色', 'color.blue': '蓝色',
    'color.purple': '紫色', 'color.magenta': '品红', 'color.pink': '粉红',
    'color.white': '白色',
    'preview.popup': '查看',
    'preview.popup.title': '放大高分辨率查看',
    'glyphProps.title': '符号参数',
    'glyph.selectChar': '请选择一个字符',
    'glyph.width': '宽度: {n}',
    'glyph.height': '高度: {n}',
    'section.adjustWidth': '调整宽度',
    'section.move': '移动位置',
    'section.batch': '批量操作',
    'batch.hint': '在左侧勾选范围进行批量操作',
    'batch.set': '设置',
    'batch.center': '居中',
    'batch.clearAll': '清除全部',
    'batch.moveUp.title': '向上移动1像素',
    'batch.moveDown.title': '向下移动1像素',
    'sysConvert.title': '系统字体转为RA2字体',
    'sysConvert.dropHint': '拖放字体文件到此处',
    'sysConvert.dropSub': '.fnt / 系统字体文件',
    'sysConvert.fontPlaceholder': '选择字体或输入筛选...',
    'fontStyle.lighter': '细体', 'fontStyle.normal': '常规', 'fontStyle.bold': '粗体',
    'fontStyle.bolder': '粗体+', 'fontStyle.italic': '斜体', 'fontStyle.boldItalic': '粗斜体',
    'conv.original': '原始',
    'conv.hi': '高分',
    'conv.lo': '低分',
    'conv.converted': '转换',
    'conv.hi.title': '高分辨率下字体的样子',
    'conv.lo.title': '低分辨率下字体的样子',
    'conv.threshold': '阈值',
    'conv.fontSize': '字号',
    'conv.vertOffset': '垂直偏移',
    'conv.fineX': '微调X',
    'conv.fineY': '微调Y',
    'conv.fineX.title': '微调x轴像素坐标;由于字形宽度按内容自动裁剪,水平偏移通常会被裁剪抵消',
    'conv.fineY.title': '微调y轴像素坐标;整数部分为输出格位移,小数部分以位图像素插值实现亚像素偏移(浏览器对绘制坐标取整,亚像素需靠插值完成)',
    'conv.separate': '分离共享字符',
    'conv.separate.title.on': '开启：分离数据，单个/批量操作均先分配新数据空间再修改',
    'conv.separate.title.off': '关闭：跳过共享字符，批量操作不修改共用数据的字符',
    'conv.shadow': '3D阴影',
    'conv.shadow.title': '图一乐，没啥用。\n仅保留右下+右侧1px阴影,剔除原文字,营造3D镂空效果',
    'conv.convertSel': '转换选中',
    'conv.convertAll': '转换全部',
    'conv.originalLabel': '原始-{n}',
    'conv.convertedLabel': '转换-{n}',
    'info.format': '格式', 'info.magic': '魔数', 'info.charWidth': '字符宽度',
    'info.stride': 'Stride', 'info.fontHeight': 'FontHeight', 'info.uniqueSymbols': '唯一符号数',
    'info.symDataSize': 'SymbolDataSize', 'info.mappedChars': '已映射字符',
    'info.fileSize': '文件大小', 'info.charRange': '字符范围', 'info.bpp': 'bppFormat',
    'info.totalCount': '(共 {n} 个)', 'unit.bytes': '字节', 'unit.pixels': '像素',
    'toast.selectFnt': '请选择 .FNT 文件',
    'toast.fontLoaded': '已加载字体 ({type})，{n} 个字符',
    'toast.parseFailed': '解析失败: {msg}',
    'toast.invalidMagic': '无效魔数: {magic}',
    'toast.warnSymSize': '警告: SymbolDataSize={a}, 期望={b}',
    'toast.invalidChar': '无效的字符或编码',
    'toast.charExists': '该字符已存在',
    'toast.charAdded': '已添加 U+{code}',
    'toast.loadedFont': '已加载字体',
    'toast.noUndo': '没有可撤销的操作',
    'toast.undone': '已撤销',
    'toast.noRedo': '没有可重做的操作',
    'toast.redone': '已重做',
    'toast.noRestoreData': '没有可还原的原始数据',
    'toast.restored': '已还原为原始字形',
    'toast.noGuides': '没有辅助线',
    'toast.guidesCleared': '已清除所有辅助线',
    'toast.guideRemoved': '已移除辅助线',
    'toast.noChars': '没有可操作的字符',
    'toast.moved': '已移动 {n} 个字符',
    'toast.batchWidth': '已批量设置 {n} 个字符宽度为 {w}',
    'toast.centered': '已居中 {n} 个字符',
    'toast.cleared': '已清除 {n} 个字符',
    'toast.enterFont': '请输入系统字体名称',
    'toast.selectCharsFirst': '请先选择字符',
    'toast.sharedSkipped': '没有可操作的字符（共享字符已跳过）',
    'toast.converted': '已转换 {n} 个字符为系统字体 "{family}"',
    'toast.convertedAll': '已转换全部 {n} 个字符为系统字体 "{family}"',
    'toast.selectSysFont': '请先选择系统字体',
    'toast.noMissing': '此分组没有缺失字符',
    'toast.added': '已添加 {n} 个字符',
    'toast.savedAs': '已保存为 {name}',
    'toast.fontSizeUpdated': '字体尺寸已更新: {w}×{h}',
    'toast.customFontLoaded': '已加载自定义字体: {name}',
    'toast.fontLoadFailed': '字体加载失败',
    'toast.unsupportedFont': '不支持的字体格式',
    'toast.copied': '已复制到剪切板',
    'toast.copyFailed': '复制失败',
    'toast.canvasCleared': '已清空画布',
    'toast.listRefreshed': '列表已刷新',
    'modal.addMissingTitle': '添加缺失字符 — {name} (共 {n} 个)',
    'modal.moreChars': '... 还有 {n} 个字符未显示',
    'modal.addSelected': '添加选中',
    'modal.selectAll': '全选',
    'modal.deselectAll': '取消全选',
    'modal.cancel': '取消',
    'convert.inProgress': '正在转换 {done}/{total} ...',
    'convert.cancelled': '已取消转换,完成 {n} 个字符',
    'fonts.loading': '正在加载字体列表...',
    'nav.jumpGroup': '— 快速定位到分组 —',
    'popup.zoom': '缩放 ',
    'popup.close': '关闭',
    'guide.body': `详细功能查看readme文件
操作提示：
- 拖放 .FNT 文件到左侧区域加载字体
- 左侧修改字体全局宽高
- "保存字体" 下载修改后的字体
- 点击字符列表中的字符进行编辑
- 勾选或shift+鼠标框选可批量处理字符,ctrl+框选是反选
- 角标表示当前字符是占位符或者与其它字符使用相同数据

- 使用右侧移动按钮调整字符位置
- 在右侧选择字体后才能替换字符
- 占位符会自动重新分配空间,你不用关心
- 你可以为不同选选区用不同的字体
- 3D阴影纯图一乐
- 虽然字体文档说数据有限制,为256像素,即16x16或15x17，实际上你可以超过,过大会有一些显示问题
- - 由于不同字体显示不一样，因此你能遇到15字体生成13宽度，所以字体大小可以超过15

编辑区：
- 鼠标滚轮：缩放编辑区
- 鼠标左键：绘制像素
- 鼠标右键：擦除像素
- 按 + / - 或 [ / ]：调整画笔大小,悬停时高亮显示画笔影响的格子

辅助线：
- 左键点击顶部/左侧标尺：创建辅助线
- 左键按住标尺上的辅助线拖动：移动辅助线
- 右键点击标尺上的辅助线：移除辅助线

工具github地址：
<a href="https://github.com/MagicShiba/Ra2FontEditor" style="color: #ed0;"> https://github.com/MagicShiba/Ra2FontEditor </a>
B站:
<a href="https://space.bilibili.com/335956233/dynamic" style="color: #ed0;"> 时间纪元 (时之纪元) </a>`
  },

  en: {
    'app.title': 'RA2 Font Editor',
    'langToggle.title': 'Switch language',
    'scTc.label': 'SC↔TC',
    'scTc.title': 'Convert Simplified Chinese to Traditional for display (type simplified, show traditional).',
    'fontInfo.title': 'Font Info',
    'dropzone.dropHere': 'Drop .FNT file here',
    'dropzone.orClick': 'or click to choose file',
    'field.width': 'Width',
    'field.height': 'Height',
    'field.width.title': 'Ideograph Width (from font file header)',
    'applyFontSize.title': 'Global canvas size; each glyph width is individual. Be careful.',
    'apply': 'Apply',
    'saveFont': 'Save Font',
    'charList.title': 'Characters',
    'batch.selected': '{n} selected',
    'refreshList': 'Refresh',
    'refreshList.title': 'Refresh character list',
    'nav.quickJump': '— Quick jump —',
    'search.placeholder': 'Search character/U+ code...',
    'search.add': 'Add',
    'noCharsInFont': 'No displayable characters in font',
    'group.addMissing.title': 'Add missing characters in this group',
    'group.shared': '{n} shared',
    'editor.title': 'Editor',
    'zoom': 'Zoom',
    'brushLabel': 'Brush: {n}',
    'brushLabel.title': 'Brush size; press + / - or [ / ] on canvas to adjust',
    'ruler': 'Ruler',
    'ruler.title': 'Show/hide rulers. Left-click a ruler to create a guide; drag to move; right-click to remove.',
    'autoRefresh': 'Auto-refresh',
    'autoRefresh.title': 'Auto-sync character list on character switch; disable for large CJK sets',
    'clearGuides': 'Clear Guides',
    'clearGuides.title': 'Clear all guides',
    'restore': 'Restore',
    'restore.title': 'Restore this glyph to its original shape (Ctrl+Z undo / Ctrl+Y redo)',
    'clearCanvas': 'Clear Canvas',
    'clearCanvas.title': 'Clear canvas',
    'copyImage': 'Copy Image',
    'copyImage.title': 'Copy image at original resolution to clipboard',
    'userGuide': 'Help',
    'userGuide.title': 'View help',
    'preview.title': 'Preview',
    'preview.scale': 'Scale',
    'preview.fg': 'FG Color',
    'preview.bg': 'BG Color',
    'preview.preset': 'Preset',
    'preview.preset.title': 'Preset colors',
    'color.yellow': 'Yellow', 'color.orange': 'Orange', 'color.red': 'Red',
    'color.cyan': 'Cyan', 'color.green': 'Green', 'color.blue': 'Blue',
    'color.purple': 'Purple', 'color.magenta': 'Magenta', 'color.pink': 'Pink',
    'color.white': 'White',
    'preview.popup': 'View',
    'preview.popup.title': 'View enlarged at high resolution',
    'glyphProps.title': 'Glyph Properties',
    'glyph.selectChar': 'Select a character',
    'glyph.width': 'Width: {n}',
    'glyph.height': 'Height: {n}',
    'section.adjustWidth': 'Adjust Width',
    'section.move': 'Move',
    'section.batch': 'Batch',
    'batch.hint': 'Check a range on the left to batch-operate',
    'batch.set': 'Set',
    'batch.center': 'Center',
    'batch.clearAll': 'Clear All',
    'batch.moveUp.title': 'Move up 1px',
    'batch.moveDown.title': 'Move down 1px',
    'sysConvert.title': 'System Font → RA2',
    'sysConvert.dropHint': 'Drop font file here',
    'sysConvert.dropSub': '.fnt / system font file',
    'sysConvert.fontPlaceholder': 'Select font or type to filter...',
    'fontStyle.lighter': 'Thin', 'fontStyle.normal': 'Regular', 'fontStyle.bold': 'Bold',
    'fontStyle.bolder': 'Bold+', 'fontStyle.italic': 'Italic', 'fontStyle.boldItalic': 'Bold Italic',
    'conv.original': 'Original',
    'conv.hi': 'Hi-Res',
    'conv.lo': 'Lo-Res',
    'conv.converted': 'Converted',
    'conv.hi.title': 'How the font looks at high resolution',
    'conv.lo.title': 'How the font looks at low resolution',
    'conv.threshold': 'Threshold',
    'conv.fontSize': 'Size',
    'conv.vertOffset': 'V-Offset',
    'conv.fineX': 'Fine X',
    'conv.fineY': 'Fine Y',
    'conv.fineX.title': 'Fine-tune X pixel coordinate; usually cropped away since width auto-trims',
    'conv.fineY.title': 'Fine-tune Y pixel coordinate; integer part offsets output grid, fractional part interpolates bitmap for sub-pixel (browser rounds draw coords)',
    'conv.separate': 'Separate Shared',
    'conv.separate.title.on': 'On: separate data; single/batch edits allocate new data first',
    'conv.separate.title.off': 'Off: skip shared chars; batch ops skip glyphs sharing data',
    'conv.shadow': '3D Shadow',
    'conv.shadow.title': 'Just for fun. Keeps right+bottom 1px shadow, removes original text for a 3D cutout look.',
    'conv.convertSel': 'Convert Selected',
    'conv.convertAll': 'Convert All',
    'conv.originalLabel': 'Orig-{n}',
    'conv.convertedLabel': 'Conv-{n}',
    'info.format': 'Format', 'info.magic': 'Magic', 'info.charWidth': 'Char Width',
    'info.stride': 'Stride', 'info.fontHeight': 'FontHeight', 'info.uniqueSymbols': 'Unique Symbols',
    'info.symDataSize': 'SymbolDataSize', 'info.mappedChars': 'Mapped Chars',
    'info.fileSize': 'File Size', 'info.charRange': 'Char Range', 'info.bpp': 'bppFormat',
    'info.totalCount': '({n} total)', 'unit.bytes': 'bytes', 'unit.pixels': 'px',
    'toast.selectFnt': 'Please select a .FNT file',
    'toast.fontLoaded': 'Loaded font ({type}), {n} characters',
    'toast.parseFailed': 'Parse failed: {msg}',
    'toast.invalidMagic': 'Invalid magic: {magic}',
    'toast.warnSymSize': 'Warning: SymbolDataSize={a}, expected={b}',
    'toast.invalidChar': 'Invalid character or code',
    'toast.charExists': 'Character already exists',
    'toast.charAdded': 'Added U+{code}',
    'toast.loadedFont': 'Font loaded',
    'toast.noUndo': 'Nothing to undo',
    'toast.undone': 'Undone',
    'toast.noRedo': 'Nothing to redo',
    'toast.redone': 'Redone',
    'toast.noRestoreData': 'No original data to restore',
    'toast.restored': 'Restored to original',
    'toast.noGuides': 'No guides',
    'toast.guidesCleared': 'All guides cleared',
    'toast.guideRemoved': 'Guide removed',
    'toast.noChars': 'No operable characters',
    'toast.moved': 'Moved {n} characters',
    'toast.batchWidth': 'Set {n} characters to width {w}',
    'toast.centered': 'Centered {n} characters',
    'toast.cleared': 'Cleared {n} characters',
    'toast.enterFont': 'Please enter a system font name',
    'toast.selectCharsFirst': 'Select characters first',
    'toast.sharedSkipped': 'No operable characters (shared chars skipped)',
    'toast.converted': 'Converted {n} characters to "{family}"',
    'toast.convertedAll': 'Converted all {n} characters to "{family}"',
    'toast.selectSysFont': 'Please select a system font first',
    'toast.noMissing': 'No missing characters in this group',
    'toast.added': 'Added {n} characters',
    'toast.savedAs': 'Saved as {name}',
    'toast.fontSizeUpdated': 'Font size updated: {w}×{h}',
    'toast.customFontLoaded': 'Custom font loaded: {name}',
    'toast.fontLoadFailed': 'Failed to load font',
    'toast.unsupportedFont': 'Unsupported font format',
    'toast.copied': 'Copied to clipboard',
    'toast.copyFailed': 'Copy failed',
    'toast.canvasCleared': 'Canvas cleared',
    'toast.listRefreshed': 'List refreshed',
    'modal.addMissingTitle': 'Add missing chars — {name} ({n} total)',
    'modal.moreChars': '... {n} more not shown',
    'modal.addSelected': 'Add Selected',
    'modal.selectAll': 'Select All',
    'modal.deselectAll': 'Deselect All',
    'modal.cancel': 'Cancel',
    'convert.inProgress': 'Converting {done}/{total} ...',
    'convert.cancelled': 'Conversion cancelled, {n} characters done',
    'fonts.loading': 'Loading font list...',
    'nav.jumpGroup': '— Jump to group —',
    'popup.zoom': 'Zoom ',
    'popup.close': 'Close',
    'guide.body': `See the readme file for details.

Tips:
- Drag a .FNT file onto the left panel to load a font
- Edit the global font width/height on the left
- "Save Font" downloads the modified font
- Click a character in the list to edit it
- Check boxes or shift+drag to select multiple; ctrl+drag to invert
- Corner marks mean a placeholder or a character sharing data with others

- Use the right panel move buttons to reposition a glyph
- Pick a font on the right before replacing characters
- Placeholders get new data space automatically
- Different selections can use different fonts
- 3D Shadow is just for fun
- The spec caps data at 256px (16x16 or 15x17), but you can exceed it; oversized glyphs may render oddly
- Different fonts differ, so a 15px font may produce 13px glyphs; font size can exceed 15

Editor:
- Mouse wheel: zoom
- Left button: draw pixels
- Right button: erase pixels
- Press + / - or [ / ]: change brush size; hover highlights affected cells

Guides:
- Left-click the top/left ruler: create a guide
- Left-drag a guide on the ruler: move it
- Right-click a guide on the ruler: remove it

GitHub:
<a href="https://github.com/MagicShiba/Ra2FontEditor" style="color: #ed0;"> https://github.com/MagicShiba/Ra2FontEditor </a>
Bilibili:
<a href="https://space.bilibili.com/335956233/dynamic" style="color: #ed0;"> 时间纪元 (时之纪元) </a>`
  }
};

let lang = 'zh';

// 取当前语言文案,支持 {var} 占位符替换
function t(key, vars) {
  let s = (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// 应用指定语言并刷新所有界面文本
function applyLanguage(l) {
  if (l === 'zh' || l === 'en') lang = l;
  else lang = (navigator.language && navigator.language.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
  try { localStorage.setItem('ra2-lang', lang); } catch (e) {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('app.title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  const lt = document.getElementById('lang-toggle');
  if (lt) lt.textContent = lang === 'zh' ? 'EN' : '中文';
  if (window.onLanguageChange) window.onLanguageChange();
}

// 初始化:优先本地保存的选择,否则跟随系统语言
let initLang = 'zh';
try { initLang = localStorage.getItem('ra2-lang') || ''; } catch (e) {}
if (!initLang) initLang = (navigator.language && navigator.language.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
lang = initLang;

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(initLang);
  const lt = document.getElementById('lang-toggle');
  if (lt) lt.addEventListener('click', () => applyLanguage(lang === 'zh' ? 'en' : 'zh'));
});
