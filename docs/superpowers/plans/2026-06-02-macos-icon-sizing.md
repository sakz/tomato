# macOS 图标视觉占比调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `Tomato` 新增一份 `macOS` 专用图标源图，缩小前景主体的视觉占比，并只重生成 `src-tauri/icons/icon.icns`，让 Dock 和启动台里的图标感知大小更接近常见 macOS 应用。

**Architecture:** 保留现有 `app-icon.svg` 作为跨平台通用源图，不直接覆盖。新增 `app-icon-macos.svg` 作为 macOS 专用源图，通过 `Tauri CLI` 的 `icon` 子命令在临时目录生成新图标资源，再只把生成出来的 `icon.icns` 覆盖到 `src-tauri/icons/icon.icns`，最后用 `file` 和 `iconutil` 校验 `.icns` 文件有效性。

**Tech Stack:** SVG, Tauri CLI, macOS `file`, macOS `iconutil`, Git

---

## 文件结构

- Create: `app-icon-macos.svg`
- Modify: `src-tauri/icons/icon.icns`
- Reference only: `app-icon.svg`
- Reference only: `src-tauri/tauri.conf.json`

## 实施约束

- 不修改 `app-icon.svg`
- 不修改 `src-tauri/tauri.conf.json`
- 不覆盖 `src-tauri/icons` 下的 `Windows`、`Android`、`iOS` 图标资源
- 所有生成动作都先写入临时目录，再单独复制 `icon.icns`

### Task 1: 新增 macOS 专用 SVG 源图

**Files:**
- Create: `app-icon-macos.svg`
- Reference: `app-icon.svg`

- [ ] **Step 1: 创建 `app-icon-macos.svg`**

将下面的完整内容写入 `app-icon-macos.svg`。这份文件保留现有背景、渐变和风格，只通过两个前景分组缩小番茄主体与叶片，让留白更接近 macOS 常见图标比例。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
    <radialGradient id="tomatoGrad" cx="35%" cy="30%" r="65%" fx="35%" fy="30%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="50%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#991b1b" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1024" height="1024" rx="220" ry="220" fill="url(#bgGrad)"/>

  <g transform="translate(61.44 55.44) scale(0.88)">
    <circle cx="512" cy="542" r="340" fill="url(#tomatoGrad)" filter="url(#shadow)"/>
    <ellipse cx="432" cy="432" rx="200" ry="160" fill="url(#highlight)" transform="rotate(-20 432 432)"/>
  </g>

  <g transform="translate(81.92 45.92) scale(0.84)">
    <path d="M512 202 C512 202, 472 162, 432 182 C392 202, 412 242, 412 242 C412 242, 352 222, 332 262 C312 302, 352 332, 352 332 C352 332, 312 362, 332 402 C352 442, 412 422, 412 422 L512 382 L612 422 C612 422, 672 442, 692 402 C712 362, 672 332, 672 332 C672 332, 712 302, 692 262 C672 222, 612 242, 612 242 C612 242, 632 202, 592 182 C552 162, 512 202, 512 202Z" fill="#0f172a"/>
    <circle cx="512" cy="312" r="28" fill="#1e293b"/>
  </g>
</svg>
```

- [ ] **Step 2: 对比新旧源图，确认只改变了前景占比**

Run:

```bash
git diff --no-index -- app-icon.svg app-icon-macos.svg
```

Expected:

```text
只看到新增的前景分组 transform 和对应的前景缩放差异；背景矩形、颜色定义和滤镜定义保持一致。
```

- [ ] **Step 3: 提交专用源图**

Run:

```bash
git add app-icon-macos.svg
git commit -m "design: add macOS-specific icon source"
```

Expected:

```text
[main ...] design: add macOS-specific icon source
 1 file changed, ...
 create mode 100644 app-icon-macos.svg
```

### Task 2: 只重生成 macOS 的 `icon.icns`

**Files:**
- Modify: `src-tauri/icons/icon.icns`
- Reference: `app-icon-macos.svg`

- [ ] **Step 1: 清理并准备临时输出目录**

Run:

```bash
rm -rf /tmp/tomato-macos-icon-build
mkdir -p /tmp/tomato-macos-icon-build
```

Expected:

```text
命令退出码为 0，且 `/tmp/tomato-macos-icon-build` 目录存在。
```

- [ ] **Step 2: 用 `Tauri CLI` 从 `app-icon-macos.svg` 生成临时图标资源**

Run:

```bash
npx tauri icon ./app-icon-macos.svg --output /tmp/tomato-macos-icon-build
```

Expected:

```text
命令退出码为 0，且 `/tmp/tomato-macos-icon-build/icon.icns` 已生成。
```

- [ ] **Step 3: 只复制新的 `icon.icns` 到项目资源目录**

Run:

```bash
cp /tmp/tomato-macos-icon-build/icon.icns ./src-tauri/icons/icon.icns
```

Expected:

```text
命令退出码为 0，项目中的 `src-tauri/icons/icon.icns` 被新文件覆盖。
```

- [ ] **Step 4: 用 `file` 校验新 `.icns` 文件类型**

Run:

```bash
file ./src-tauri/icons/icon.icns
```

Expected:

```text
输出包含 `Mac OS icon file`。
```

- [ ] **Step 5: 提交重新生成的 macOS 图标**

Run:

```bash
git add src-tauri/icons/icon.icns
git commit -m "build: regenerate macOS app icon"
```

Expected:

```text
[main ...] build: regenerate macOS app icon
 1 file changed, ...
```

### Task 3: 验证修改范围和 `.icns` 可读性

**Files:**
- Reference: `app-icon-macos.svg`
- Reference: `src-tauri/icons/icon.icns`
- Reference: `src-tauri/tauri.conf.json`

- [ ] **Step 1: 确认打包配置没有被意外修改**

Run:

```bash
git diff -- ./src-tauri/tauri.conf.json
```

Expected:

```text
没有输出，说明 `src-tauri/tauri.conf.json` 未被修改。
```

- [ ] **Step 2: 用 `iconutil` 展开 `.icns`，验证文件结构完整**

Run:

```bash
rm -rf /tmp/tomato-macos-icon-verify.iconset
iconutil --convert iconset --output /tmp/tomato-macos-icon-verify.iconset ./src-tauri/icons/icon.icns
```

Expected:

```text
命令退出码为 0，且 `/tmp/tomato-macos-icon-verify.iconset` 目录被创建。
```

- [ ] **Step 3: 检查 `.iconset` 中已经解包出标准 PNG 尺寸**

Run:

```bash
ls /tmp/tomato-macos-icon-verify.iconset
```

Expected:

```text
输出至少包含 `icon_16x16.png`、`icon_16x16@2x.png`、`icon_32x32.png`、`icon_32x32@2x.png`、`icon_128x128.png`、`icon_128x128@2x.png`、`icon_256x256.png`、`icon_256x256@2x.png`、`icon_512x512.png` 和 `icon_512x512@2x.png`。
```

- [ ] **Step 4: 审查工作区变更范围**

Run:

```bash
git status --short
```

Expected:

```text
只看到本次计划引入的 `app-icon-macos.svg` 和 `src-tauri/icons/icon.icns` 已提交后的干净工作区，或仅有本次尚未处理的相关文件。
```

- [ ] **Step 5: 手动验收清单**

按下面的顺序检查：

```text
1. 打开 `app-icon-macos.svg`，确认背景不变、番茄主体更收敛。
2. 对比 `app-icon.svg` 与 `app-icon-macos.svg`，确认新文件只用于 macOS。
3. 若本机要继续验证安装效果，再执行一次打包或本地运行，最终以 Dock / 启动台中的主观观感为准。
```

- [ ] **Step 6: 提交验证结果说明**

Run:

```bash
git status --short
```

Expected:

```text
工作区保持干净；如果仍有额外文件，先确认不是临时产物泄漏，再决定是否继续。
```
