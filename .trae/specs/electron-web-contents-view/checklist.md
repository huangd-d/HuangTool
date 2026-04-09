# Electron BrowserView 替换为 WebContentsView - 验证清单

- [x] 检查 Electron 官方文档，确认 WebContentsView 的使用方法
- [x] 确认 windowManager.js 文件已将 BrowserView 替换为 WebContentsView
- [x] 确认添加视图的方法已从 addBrowserView 更新为 contentView.addChildView
- [x] 确认移除视图的方法已从 removeBrowserView 更新为 contentView.removeChildView
- [x] 确认销毁视图的方法已从 view.destroy() 更新为 view.webContents.destroy()
- [x] 确认前端开发服务器的 URL 端口已正确更新
- [x] 确认 registerWindowEvents 函数中已添加对 mainWindow 的存在性检查
- [x] 启动 Electron 应用，确认应用能够正常启动
- [x] 测试页签的创建功能
- [x] 测试页签的切换功能
- [x] 测试页签的关闭功能
- [x] 测试从前端应用创建新页签的功能
- [x] 确认多页签功能正常工作
- [x] 确认与前端应用的通信正常
