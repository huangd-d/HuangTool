# Layout 菜单点击创建/切换 WebContentsView - 验证检查点

- [x] tabManager.js 中 findTabByPath 方法可以正确根据 path 查找页签
- [x] findTabByPath 查找失败时返回 null
- [x] createTab 方法在创建前调用 findTabByPath 检查
- [x] 点击已存在的页签时直接切换，不创建新页签
- [x] 点击不存在的页签时创建新页签
- [x] switchTab 方法支持传入 tabId 正常工作
- [x] switchTab 方法支持传入 path 时能正确查找并切换
- [x] 多次点击同一菜单不会重复创建页签
