# JIT Viewer 从 CDN 改为 npm 包引入 - 验证清单

- [ ] 检查 @jitoffice/jit-viewer-sdk 包是否已成功安装
- [ ] 检查 package.json 文件中是否添加了 @jitoffice/jit-viewer-sdk 依赖
- [ ] 检查 OfficeView.vue 文件是否使用 import 方式引入 JIT Viewer
- [ ] 检查 OfficeView.vue 文件是否移除了动态加载 SDK 的逻辑
- [ ] 检查 OfficeView.vue 文件是否移除了对 window.JitViewer 的引用
- [ ] 检查代码是否符合 Vue 3 标准风格
- [ ] 测试文档预览功能是否正常工作
- [ ] 测试不同类型的 Office 文档（docx、xlsx、pptx）是否都能正常预览
- [ ] 执行构建命令验证构建过程是否成功
- [ ] 确认构建产物是否生成成功
