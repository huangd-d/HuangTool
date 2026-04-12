<template>
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>{{ isEdit ? '编辑分类' : '创建分类' }}</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>分类名称:</label>
          <input v-model="form.name" type="text" placeholder="输入分类名称">
        </div>
        <div class="form-item">
          <label>分类描述:</label>
          <textarea v-model="form.description" placeholder="输入分类描述"></textarea>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  name: '',
  description: ''
})

const isEdit = computed(() => !!props.category)

// 监听 category 变化，更新表单
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    form.value = {
      name: newCategory.name || '',
      description: newCategory.description || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: ''
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!form.value.name) {
    alert('请输入分类名称')
    return
  }
  
  emit('save', { ...form.value, id: props.category?.id })
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
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
}

.dialog h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.dialog-content {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
}

.form-item textarea {
  height: 80px;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.dialog-actions button.primary {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.dialog-actions button.primary:hover {
  background: #35495e;
  border-color: #35495e;
}
</style>
