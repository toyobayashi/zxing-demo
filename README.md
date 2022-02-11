# WebAssembly & Node-API 实现二维码识别与生成

一套代码同时编译到 WebAssembly 和 Node.js 原生模块。

## 安装依赖

```bash
npm install --ignore-scripts
```

## 构建 WebAssembly

```bash
npm run clean

# Windows
npm run cmake:win

# Linux / macOS
# npm run cmake:unix

npm run cmake:build
```

VSCode Live Server 打开 `docs/index.html`。

## 构建 Node.js 原生模块

```bash
npm run gyp:rebuild

npm test
```
