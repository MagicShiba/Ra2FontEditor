# Westwood BitFont Format

用于 Red Alert 2  
1 bit per pixel 位图字体格式。

格式和编辑器参考:  
[Westwood BitFont Format](https://moddingwiki.shikadi.net/wiki/Westwood_BitFont_Format)  
[Nyerguds/WWFontEditor](https://github.com/Nyerguds/WWFontEditor)

---

## 一、非 Unicode 变体 (FoNt)

用于 ANSI/非 Unicode 字体文件。此即原始文档记载的格式。

### 文件结构

```
[Header (0x30 bytes)] [SymbolData blocks (连续排列)]
```

### Header (0x30)

| 偏移 | 类型 | 名称 | 说明 |
|------|------|------|------|
| 0x00 | Char[4] | Format | 魔数 `"FoNt"` |
| 0x04 | UINT32LE | FontWidth | 可能是 ideograph 宽度或默认空格宽度 |
| 0x08 | UINT32LE | Stride | 所有符号图像数据的步长（每行字节数） |
| 0x0C | UINT32LE | Lines / FontDataHeight | 每个符号存储的像素行数 |
| 0x10 | UINT32LE | FontHeight | 实际字体高度（像素）；可大于 FontDataHeight |
| 0x14 | UINT32LE | bppFormat | 固定为 `0x01`（1 bit per pixel） |
| 0x18 | UINT32LE | SymbolDataSize | 单个符号数据块大小，应等于 `1 + Stride × FontDataHeight` |
| 0x1C | UINT32LE | Dword1C | 固定为 `0x24` |
| 0x20 | UINT32LE | Dword20 | 固定为 `0x30` |
| 0x24 | UINT32LE | Dword24 | 固定为 `0x00` |
| 0x28 | UINT32LE | StartSymbol | 第一个存储字符的编码 |
| 0x2C | UINT32LE | EndSymbol | 最后一个存储字符的编码 |

> 游戏将 header 视为 0x24 字节，后续 0x0C 字节视为附加部分（包含字符范围）。

### 图像数据

每个符号的块大小相同，通过公式定位：

```
offset = 0x30 + SymbolDataSize × (index - StartSymbol)
```

| 偏移 | 类型 | 名称 | 说明 |
|------|------|------|------|
| 0x00 | UINT8 | SymbolWidth | 字符宽度（不改变 stride，仅限制最终显示宽度） |
| 0x01 | BYTE[Stride × FontDataHeight] | SymbolData | 1-bpp 图像数据，按 stride × FontDataHeight 存放 |

- **位深**：1 bit per pixel
- **步长**（Stride）：每行实际字节数，由 header 指定
- **字符宽度**（SymbolWidth）：每字符单独指定，实际显示宽度 ≤ Stride × 8
- **字符间内边距**：格式本身不存储，由程序自动应用（通常为 1 像素）
- **高度填充**：若 FontHeight > FontDataHeight，底部填充空白行
- **符号之间无 padding，连续存放**

---

## 二、Unicode 变体 (fonT)

用于 Unicode 字体文件（RA2 中的 unicode 字体）。

### 文件结构

```
[Header (0x1C bytes)] [IndexTable (0x20000 bytes)] [SymbolData blocks (去重)]
```

### Header (0x1C)

| 偏移 | 类型 | 名称 | 说明 |
|------|------|------|------|
| 0x00 | Char[4] | Format | 魔数 `"fonT"` |
| 0x04 | UINT32LE | SpaceWidth | 空格 / ideograph 宽度 |
| 0x08 | UINT32LE | Stride | 图像数据步长（每行字节数） |
| 0x0C | UINT32LE | FontDataHeight | 每个符号存储的像素行数 |
| 0x10 | UINT32LE | FontHeight | 实际字体高度（像素）；可大于 FontDataHeight |
| 0x14 | UINT32LE | SymbolCount | 唯一符号个数（去重后） |
| 0x18 | UINT32LE | SymbolDataSize | 单个符号数据块大小，应等于 `1 + Stride × FontDataHeight` |

### 索引表 (Index Table)

紧接 header，从 `0x1C` 开始，大小为 `0x10000 × 2 = 0x20000` 字节。

共 65536 个 UINT16LE 条目，对应 Unicode 码点 `U+0000` ~ `U+FFFF`：

- `0x0000`：该码点无字形映射
- `N + 1`：映射到第 N 个符号（1-based）

```
index[codePoint] = symbolIndex + 1   // 0 = 无字形
```

### 图像数据

紧接索引表（偏移 `0x1C + 0x20000`），共 `SymbolCount` 个符号块，已去重。

每个符号块结构：

| 偏移 | 类型 | 名称 | 说明 |
|------|------|------|------|
| 0x00 | UINT8 | SymbolWidth | 字符宽度 |
| 0x01 | BYTE[Stride × FontDataHeight] | SymbolData | 1-bpp 图像数据 |

多个码点可共享同一个符号块（去重优化）。

---

## 三、关键限制

- Stride 和 FontDataHeight 受 32-bit 整数上限约束
- SymbolDataSize = `1 + Stride × FontDataHeight` 也须能被 32-bit 容纳
- 单个符号宽度以 UINT8 存储，最大 255 像素
- Unicode 变体最大 65536 个码点（U+0000 ~ U+FFFF）

---

## 四、注意事项

### FontDataHeight 即实际字体宽度

根据实际 RA2 字体文件的解析经验，Header 中的 `FontDataHeight`（偏移 `0x0C`）字段实际表示**字体的标准字符宽度**（即每个字符占据的横向像素宽度），而非文档字面上的"像素行数"。

- `FontDataHeight` = 字符宽度（用于字符网格布局、字形显示宽度等）
- `FontHeight` = 字符高度
- `FontWidth` / `SpaceWidth`（偏移 `0x04`）在实际使用中可忽略，其值通常与 FontDataHeight 相同或为固定值（如 20），但不应作为宽度参考

### 位深

该格式为 1 bit per pixel（1-bpp），每像素用 1 位表示开/关。

### 像素排列

每行像素按 stride 字节对齐，从每行的最高位（bit 7）开始排列。多余的高位位填充 0。

---

## 五、魔数

| 魔数 | 格式 | 头部大小 | 字符表方式 |
|------|------|----------|-----------|
| `FoNt` | 非 Unicode | 0x30 | 从 StartSymbol 到 EndSymbol 连续排列 |
| `fonT` | Unicode | 0x1C | 索引表映射 + 符号去重 |
