<template>
  <Teleport to="body">
    <div class="dialog-overlay" v-if="modelValue">
      <div class="dialog">
        <h3>{{ isEdit ? '编辑连接' : '新建连接' }}</h3>
        <div class="dialog-content">
          <div class="form-item">
            <label>连接名称:</label>
            <input v-model="form.name" type="text" :placeholder="dbType === 'redis' ? '如: 本地Redis' : '如: 本地开发库'">
          </div>
          <!-- MySQL / SQL type selector -->
          <div class="form-item" v-if="dbType === 'mysql'">
            <label>数据库类型:</label>
            <select v-model="form.type">
              <option value="mysql">MySQL</option>
              <option value="postgres">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          <!-- MySQL/PostgreSQL fields -->
          <template v-if="isSqlType">
            <div class="form-item">
              <label>主机地址:</label>
              <input v-model="form.host" type="text" placeholder="127.0.0.1">
            </div>
            <div class="form-item">
              <label>端口:</label>
              <input v-model.number="form.port" type="number" :placeholder="form.type === 'postgres' ? '5432' : '3306'">
            </div>
            <div class="form-item">
              <label>用户名:</label>
              <input v-model="form.user" type="text" placeholder="root">
            </div>
            <div class="form-item">
              <label>密码:</label>
              <input v-model="form.password" type="password" placeholder="密码">
            </div>
          </template>
          <!-- SQLite fields -->
          <template v-if="form.type === 'sqlite'">
            <div class="form-item">
              <label>数据库文件路径:</label>
              <input v-model="form.filePath" type="text" placeholder="/path/to/database.db">
            </div>
          </template>
          <!-- Redis fields -->
          <template v-if="dbType === 'redis'">
            <div class="form-item">
              <label>主机地址:</label>
              <input v-model="form.host" type="text" placeholder="127.0.0.1">
            </div>
            <div class="form-item">
              <label>端口:</label>
              <input v-model.number="form.port" type="number" placeholder="6379">
            </div>
            <div class="form-item">
              <label>用户名:</label>
              <input v-model="form.username" type="text" placeholder="default">
            </div>
            <div class="form-item">
              <label>密码:</label>
              <input v-model="form.password" type="password" placeholder="密码（可空）">
            </div>
            <div class="form-item">
              <label>默认DB:</label>
              <select v-model.number="form.db">
                <option v-for="n in 16" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
          </template>
        </div>
        <div v-if="testResult" class="test-feedback" :class="testResult">
          {{ testMessage }}
        </div>
        <div class="dialog-actions">
          <button @click="close">取消</button>
          <button @click="handleTest" :disabled="testing" class="test-btn">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button @click="handleSave" class="primary">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dbType: { type: String, default: 'mysql' },
  connection: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const isSqlType = computed(() => props.dbType === 'mysql' && form.value.type !== 'sqlite')

const defaultForm = () => {
  if (props.dbType === 'redis') {
    return {
      name: '',
      type: 'redis',
      host: '127.0.0.1',
      port: 6379,
      username: 'default',
      password: '',
      db: 0
    }
  }
  return {
    name: '',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    filePath: ''
  }
}

const form = ref(defaultForm())

const testing = ref(false)
const testResult = ref(null)
const testMessage = ref('')

const isEdit = computed(() => !!props.connection)

watch([() => props.modelValue, () => props.connection], ([visible, connection]) => {
  if (visible) {
    testResult.value = null
    testMessage.value = ''
    if (connection) {
      if (props.dbType === 'redis') {
        form.value = {
          name: connection.name || '',
          type: 'redis',
          host: connection.host || '127.0.0.1',
          port: connection.port || 6379,
          username: connection.username || 'default',
          password: connection.password || '',
          db: connection.db || 0
        }
      } else {
        form.value = {
          name: connection.name || '',
          type: connection.type || 'mysql',
          host: connection.host || '127.0.0.1',
          port: connection.port || 3306,
          user: connection.user || 'root',
          password: connection.password || '',
          filePath: connection.filePath || ''
        }
      }
    } else {
      form.value = defaultForm()
    }
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
  form.value = defaultForm()
  testResult.value = null
  testMessage.value = ''
}

function buildConfig() {
  if (props.dbType === 'redis') {
    return {
      name: form.value.name || `${form.value.host}:${form.value.port}`,
      type: 'redis',
      host: form.value.host,
      port: parseInt(form.value.port, 10) || 6379,
      username: form.value.username,
      password: form.value.password,
      db: form.value.db
    }
  }
  const base = {
    name: form.value.name || `${form.value.host}:${form.value.port}`,
    type: form.value.type
  }
  if (form.value.type === 'sqlite') {
    return { ...base, filePath: form.value.filePath }
  }
  return {
    ...base,
    host: form.value.host,
    port: parseInt(form.value.port, 10) || (form.value.type === 'postgres' ? 5432 : 3306),
    user: form.value.user,
    password: form.value.password
  }
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  testMessage.value = ''
  try {
    const config = buildConfig()
    if (!window.electronAPI?.dbTest) throw new Error('electronAPI 不可用')
    await window.electronAPI.dbTest(config)
    testResult.value = 'success'
    testMessage.value = '连接成功'
  } catch (err) {
    testResult.value = 'error'
    testMessage.value = err.message || '连接失败'
  } finally {
    testing.value = false
  }
}

function handleSave() {
  if (props.dbType === 'redis') {
    if (!form.value.host) {
      alert('请输入主机地址')
      return
    }
  } else {
    if (form.value.type !== 'sqlite' && !form.value.host) {
      alert('请输入主机地址')
      return
    }
    if (form.value.type === 'sqlite' && !form.value.filePath) {
      alert('请输入数据库文件路径')
      return
    }
  }
  emit('save', buildConfig())
  close()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0;
  width: 400px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.dialog h3 {
  margin: 0;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  background: #1B1B1B;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.dialog-content {
  padding: 20px 24px;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--content-text-secondary);
}

.form-item input,
.form-item select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
  background: #FFFFFF;
  color: var(--content-text);
  outline: none;
  transition: border-color 0.2s;
}

.form-item input:focus,
.form-item select:focus {
  border-color: var(--accent);
}

.test-feedback {
  padding: 8px 24px;
  font-size: 12px;
  font-weight: 600;
}

.test-feedback.success {
  color: #188038;
  background: rgba(24, 128, 56, 0.08);
}

.test-feedback.error {
  color: var(--error);
  background: rgba(217, 48, 37, 0.08);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--content-border);
  flex-shrink: 0;
}

.dialog-actions button {
  padding: 8px 20px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--content-text-secondary);
  background: #FFFFFF;
  transition: all 0.2s;
}

.dialog-actions button:hover:not(:disabled) {
  border-color: #999;
}

.dialog-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-actions button.primary {
  background: var(--accent);
  color: #FFFFFF;
  border-color: var(--accent);
  font-weight: 700;
}

.dialog-actions button.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.dialog-actions button.test-btn {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
