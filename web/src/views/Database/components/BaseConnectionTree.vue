<template>
  <div class="connection-tree">
    <div class="connection-header" @click="toggleCollapse">
      <span class="collapse-icon">{{ collapsed ? '▸' : '▾' }}</span>
      <span class="type-icon">{{ typeIcon }}</span>
      <span class="connection-name" :class="{ 'is-connected': isConnected }">{{ connection.name || `${connection.host}:${connection.port}` }}</span>
      <span class="connection-actions">
        <span v-if="!isConnected" class="action-btn connect-btn" @click.stop="$emit('connect')" title="连接">▶</span>
        <span v-if="isConnected" class="action-btn disconnect-btn" @click.stop="$emit('disconnect')" title="断开">■</span>
        <el-dropdown trigger="click" @click.stop @command="onCommand">
          <span class="action-trigger">⋮</span>
          <template #dropdown>
            <el-dropdown-menu>
              <slot name="header-extra" />
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" divided class="danger-item">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </span>
    </div>

    <div class="tree-body" v-show="!collapsed">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  connection: { type: Object, required: true },
  isConnected: { type: Boolean, default: false },
  typeIcon: { type: String, default: '🔗' }
})

const emit = defineEmits(['connect', 'disconnect', 'edit', 'delete', 'header-click'])

const collapsed = ref(false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
  emit('header-click')
}

function onCommand(cmd) {
  if (cmd === 'edit') emit('edit')
  else if (cmd === 'delete') emit('delete')
}
</script>

<style scoped>
.connection-tree {
  min-width: 0;
  background: var(--content-bg-card);
}

.connection-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--content-border);
  cursor: pointer;
  user-select: none;
}

.connection-header:hover {
  background: var(--content-bg);
}

.collapse-icon {
  font-size: 10px;
  color: var(--content-text-hint);
  flex-shrink: 0;
  width: 10px;
}

.type-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.connection-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--content-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-name.is-connected {
  color: var(--accent);
}

.connection-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.action-trigger {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--content-text-hint);
  font-size: 14px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.2s;
}

.action-trigger:hover {
  color: var(--accent);
  background: rgba(255, 144, 0, 0.1);
}

.action-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--content-text-hint);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  color: var(--accent);
  background: rgba(255, 144, 0, 0.1);
}

.action-btn.disconnect-btn:hover {
  color: var(--error);
  background: rgba(217, 48, 37, 0.1);
}

.action-btn.connect-btn {
  color: var(--accent);
}

.tree-body :deep(.el-tree) {
  background: transparent;
}

.tree-body :deep(.el-tree-node__content) {
  height: 28px;
  padding-right: 8px;
}

.tree-body :deep(.el-tree-node__content:hover) {
  background-color: var(--content-bg);
}

.tree-body :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--content-bg);
}

.connection-tree :deep(.el-dropdown-menu) {
  background: var(--content-bg-card);
  border: 1px solid var(--content-border);
  padding: 4px;
}

.connection-tree :deep(.el-dropdown-menu__item) {
  color: var(--content-text);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 3px;
}

.connection-tree :deep(.el-dropdown-menu__item:hover) {
  background: rgba(255, 144, 0, 0.1);
  color: var(--accent);
}

.connection-tree :deep(.el-dropdown-menu__item.danger-item) {
  color: #ff3b30;
}

.connection-tree :deep(.el-dropdown-menu__item.danger-item:hover) {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.connection-tree :deep(.el-dropdown-menu__item--divided:before) {
  border-top-color: var(--content-border);
  margin: 4px 0;
}
</style>
