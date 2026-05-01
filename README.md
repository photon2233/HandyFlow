# HandyFlow

零接触手势控制 Chrome 浏览器扩展。普通摄像头 + MediaPipe HandLandmarker，所有图像处理在本地完成（无视频流外传）。

## Phase 1 MVP 已实现

- 食指指点 → 页面滚动（指尖在画面上半部向上滚，下半部向下滚，速度随距离）
- 拇指 + 食指捏合 → 当前可视区域内主视频的 播放 / 暂停
- 右下角微缩骨骼预览 + 当前手势文字（IDLE / POINT / PINCH）
- popup 启动 / 停止开关，状态持久化
- 摄像头与 ML 推理跑在 **当前活动标签页的 content script**：每个网站第一次需要单独授权摄像头；当用户切换标签页时，识别会自动跟随

未实现（路线图后续）：横向挥动切标签 (Phase 3)、手掌开合缩放 (Phase 3)、唤醒手势 (Phase 2)、Ghost Overlay 动效 (Phase 2)、自定义快捷键 (Phase 3)。

## 快速开始

```bash
npm install
npm run dev          # 监听构建到 dist/
```

加载到 Chrome：

1. 打开 `chrome://extensions`
2. 开启右上角 "开发者模式"
3. "加载已解压的扩展程序" → 选择 `dist/` 目录
4. 点击工具栏 HandyFlow 图标 → "Start tracking" → 浏览器请求摄像头权限 → 允许

## 端到端测试

| 场景 | 操作 | 预期 |
| --- | --- | --- |
| 滚动 | 打开任意长页面，伸食指其余握紧；手在画面下半部 | 页面向下滚动 |
| 视频 | 打开 YouTube 视频，做捏合手势 | 视频暂停；再次捏合恢复播放 |
| 反馈 | 任何场景 | 右下角预览显示骨骼线 + 手势标签 |
| 性能 | 任务管理器查看扩展进程 | CPU 预期 < 15% |

## 项目结构

```
src/
├── background/service-worker.ts   # 路由 START/STOP，跟随活动标签页切换
├── content/
│   ├── index.ts                   # 入口：相机 + 推理主循环 + UI
│   ├── camera.ts                  # getUserMedia 封装
│   ├── detector.ts                # HandLandmarker 加载与单帧推理
│   ├── gestures/                  # 手势分类（point / pinch / 占位）
│   ├── preview.ts                 # 右下角骨骼预览（shadow DOM）
│   └── actions.ts                 # 滚动 / 视频 toggle
├── popup/                         # 启停 UI
└── shared/                        # 消息类型 + storage 包装
```

## 故障排查

- **摄像头未启动**：检查 `chrome://settings/content/camera`，确认 HandyFlow 被允许。
- **预览不出现**：在 `chrome://`、Chrome Web Store、`file://` 等页面 content script 不会注入，属正常。
- **YouTube 暂停无效**：部分嵌入式播放器使用自定义控件覆盖 `<video>`，会被识别但 toggle 失败。后续可加站点适配。
- **CPU 偏高**：默认捕获 480×360 @ 30fps，可在 `src/offscreen/camera.ts` 调低分辨率。
- **每个网站都要单独授权摄像头**：这是 content-script 架构的固有限制——`getUserMedia` 用的是页面所在 origin 的权限。授权一次后会持久化，但换站点要重新授权。

## 隐私

- 视频帧从未离开本地：仅在 content script 内传给 MediaPipe WASM 推理；不通过 `chrome.runtime.sendMessage` 跨进程传输任何图像数据。
- 扩展不发起任何网络请求（构建期 `npm run fetch-model` 一次性下载模型文件除外）。

## 构建产物

```bash
npm run build        # tsc 类型检查 + vite 生产构建到 dist/
```

`dist/` 即可用于 Chrome 加载或打包成 .crx / .zip。
