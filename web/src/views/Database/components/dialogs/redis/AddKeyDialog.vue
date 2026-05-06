<template>
  <Teleport to="body">
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>新建 Key (db{{ dbNumber }})</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>Key 名称:</label>
          <input v-model="form.keyName" type="text" placeholder="如: user:1">
        </div>
        <div class="form-item">
          <label>类型:</label>
          <select v-model="form.keyType">
            <option value="string">String</option>
            <option value="hash">Hash</option>
            <option value="list">List</option>
            <option value="set">Set</option>
            <option value="zset">Sorted Set</option>
          </select>
        </div>
        <div class="form-item">
          <label>TTL (秒):</label>
          <div class="ttl-row">
            <input v-model.number="form.ttl" type="number" placeholder="-1 = 永久">
            <span class="ttl-hint">{{ form.ttl === -1 ? '永久' : form.ttl > 0 ? form.ttl + '秒' : '' }}</span>
          </div>
        </div>

        <!-- String 值 -->
        <div class="form-item" v-if="form.keyType === 'string'">
          <label>值:</label>
          <textarea v-model="form.stringValue" placeholder="输入值" rows="3"></textarea>
        </div>

        <!-- Hash 值 -->
        <div class="form-item" v-if="form.keyType === 'hash'">
          <label>字段:</label>
          <div class="field-pairs">
            <div v-for="(item, idx) in form.hashFields" :key="idx" class="field-pair">
              <input v-model="item.field" placeholder="field" class="pair-input">
              <input v-model="item.value" placeholder="value" class="pair-input">
              <button class="btn-del-row" @click="form.hashFields.splice(idx, 1)">✕</button>
            </div>
            <button class="btn-add-field" @click="form.hashFields.push({ field: '', value: '' })">+ 添加字段</button>
          </div>
        </div>

        <!-- List 值 -->
        <div class="form-item" v-if="form.keyType === 'list'">
          <label>值列表:</label>
          <div class="value-list">
            <div v-for="(item, idx) in form.listItems" :key="idx" class="list-item">
              <input v-model="form.listItems[idx]" placeholder="value" class="list-input">
              <button class="btn-del-row" @click="form.listItems.splice(idx, 1)">✕</button>
            </div>
            <button class="btn-add-field" @click="form.listItems.push('')">+ 添加项</button>
          </div>
        </div>

        <!-- Set 值 -->
        <div class="form-item" v-if="form.keyType === 'set'">
          <label>成员:</label>
          <div class="value-list">
            <div v-for="(item, idx) in form.setMembers" :key="idx" class="list-item">
              <input v-model="form.setMembers[idx]" placeholder="member" class="list-input">
              <button class="btn-del-row" @click="form.setMembers.splice(idx, 1)">✕</button>
            </div>
            <button class="btn-add-field" @click="form.setMembers.push('')">+ 添加成员</button>
          </div>
        </div>

        <!-- Zset 值 -->
        <div class="form-item" v-if="form.keyType === 'zset'">
          <label>成员:</label>
          <div class="value-list">
            <div v-for="(item, idx) in form.zsetMembers" :key="idx" class="list-item">
              <input v-model.number="item.score" type="number" placeholder="score" class="pair-input score-input">
              <input v-model="item.member" placeholder="member" class="pair-input">
              <button class="btn-del-row" @click="form.zsetMembers.splice(idx, 1)">✕</button>
            </div>
            <button class="btn-add-field" @click="form.zsetMembers.push({ score: 0, member: '' })">+ 添加成员</button>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">创建</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dbNumber: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  keyName: '',
  keyType: 'string',
  ttl: -1,
  stringValue: '',
  hashFields: [{ field: '', value: '' }],
  listItems: [''],
  setMembers: [''],
  zsetMembers: [{ score: 0, member: '' }]
})

watch(() => props.modelValue, (visible) => {
  if (visible) resetForm()
})

function resetForm() {
  form.value = {
    keyName: '',
    keyType: 'string',
    ttl: -1,
    stringValue: '',
    hashFields: [{ field: '', value: '' }],
    listItems: [''],
    setMembers: [''],
    zsetMembers: [{ score: 0, member: '' }]
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!form.value.keyName) {
    alert('请输入 Key 名称')
    return
  }

  let value
  switch (form.value.keyType) {
    case 'string':
      value = form.value.stringValue
      break
    case 'hash': {
      const obj = {}
      for (const item of form.value.hashFields) {
        if (item.field) obj[item.field] = item.value
      }
      value = obj
      break
    }
    case 'list':
      value = form.value.listItems.filter(v => v !== '')
      break
    case 'set':
      value = form.value.setMembers.filter(v => v !== '')
      break
    case 'zset':
      value = form.value.zsetMembers.filter(v => v.member)
      break
  }

  emit('save', {
    keyName: form.value.keyName,
    keyType: form.value.keyType,
    value,
    ttl: form.value.ttl
  })
  close()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  width: 440px;
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
.form-item select,
.form-item textarea {
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
  font-family: var(--mono);
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: var(--accent);
}

.ttl-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ttl-row input {
  width: 120px;
  flex-shrink: 0;
}

.ttl-hint {
  font-size: 11px;
  color: var(--content-text-hint);
}

.field-pairs,
.value-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-pair,
.list-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pair-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--content-border);
  border-radius: 3px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--content-text);
  background: #FFFFFF;
  outline: none;
}

.pair-input:focus {
  border-color: var(--accent);
}

.score-input {
  width: 70px;
  flex: none;
}

.list-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--content-border);
  border-radius: 3px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--content-text);
  background: #FFFFFF;
  outline: none;
}

.list-input:focus {
  border-color: var(--accent);
}

.btn-del-row {
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--content-text-hint);
  border-radius: 3px;
  flex-shrink: 0;
}

.btn-del-row:hover {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
}

.btn-add-field {
  padding: 4px 10px;
  border: 1px dashed var(--content-border);
  border-radius: 3px;
  background: none;
  color: var(--accent);
  font-size: 11px;
  cursor: pointer;
}

.btn-add-field:hover {
  border-color: var(--accent);
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

.dialog-actions button:hover {
  border-color: #999;
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
</style>
