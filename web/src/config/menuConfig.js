import { HomeFilled, Document, Memo, Files } from '@element-plus/icons-vue'

export const menuItems = [
    { id: 'home', title: '首页', icon: HomeFilled, hIcon: '🏠', path: '/home', desc: '首页' },
    { id: 'api', title: 'API管理', icon: Document, hIcon: '🔧', path: '/api', desc: 'API管理' },
    { id: 'docs', title: '技术文档访问', icon: Memo, hIcon: '📄', path: '/docs', desc: '技术文档访问' },
    { id: 'office', title: '办公文件预览', icon: Files, hIcon: '📁', path: '/office', desc: '办公文件预览' }
]

export function createTab(menu) {
    if (menu && window.electronAPI) {
        const mainEl = document.getElementById('main');
        if (!mainEl) return;
        
        const rect = mainEl.getBoundingClientRect();
        const bounds = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
        window.electronAPI.createTab(menu.title, menu.path, bounds);
    }
}
