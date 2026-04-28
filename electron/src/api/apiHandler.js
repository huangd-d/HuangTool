import fs from 'fs'
import path from 'path'
import { ipcMain } from 'electron'
import { sendRequest, mergeConfigs } from './requestHandler.js'
import { getSwaggerPath } from '../utils/paths.js'

// 迁移旧格式数据到新的统一结构
function migrateProjectData(project) {
  if (project.type && !project.categories) {
    return project
  }
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    type: 'project',
    config: {
      fileName: ensureJsonExtension(project.fileName || `${project.id}.json`),
      baseUrl: project.config?.baseUrl || '',
      proxy: project.config?.proxy || '',
      headers: project.config?.headers || {},
      timeout: project.config?.timeout || 30000
    },
    children: (project.categories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      type: 'category',
      config: {},
      children: (cat.endpoints || []).map(ep => ({
        id: ep.id,
        name: ep.name,
        description: ep.description || '',
        type: 'endpoint',
        config: {
          url: ep.url || '',
          method: ep.method || 'GET',
          headers: ep.config?.headers || {},
          params: ep.config?.params || [],
          bodyType: ep.config?.bodyType || 'none',
          body: ep.config?.body || '',
          timeout: ep.config?.timeout || 30000,
          followRedirect: ep.config?.followRedirect !== false,
          tests: ep.tests || [],
          examples: ep.examples || []
        },
        children: []
      }))
    }))
  }
}

// 确保 fileName 带 .json 后缀
function ensureJsonExtension(fileName) {
  if (!fileName) return fileName
  return fileName.endsWith('.json') ? fileName : `${fileName}.json`
}

// 根据项目数据定位 JSON 文件路径
function getProjectFilePath(swaggerPath, project) {
  const raw = project.config?.fileName || project.fileName || `${project.id}.json`
  const fileName = ensureJsonExtension(raw)
  return path.join(swaggerPath, fileName)
}

// 根据文件名定位 JSON 文件路径
function getFilePathByFileName(swaggerPath, fileName) {
  return path.join(swaggerPath, fileName)
}

// 确保 swagger 目录存在
function ensureSwaggerDir(swaggerPath) {
  if (!fs.existsSync(swaggerPath)) {
    fs.mkdirSync(swaggerPath, { recursive: true })
  }
}

// API 项目管理
export function registerApiHandlers() {
  // 获取所有项目
  ipcMain.handle('get-api-projects', async () => {
    const swaggerPath = getSwaggerPath()
    try {
      ensureSwaggerDir(swaggerPath)
      const files = await fs.promises.readdir(swaggerPath)
      const projects = []
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(swaggerPath, file)
          const content = await fs.promises.readFile(filePath, 'utf8')
          let project = JSON.parse(content)
          const needsMigration = !project.type || project.categories !== undefined
          if (needsMigration) {
            project = migrateProjectData(project)
            await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
          }
          projects.push(project)
        }
      }
      projects.sort((a, b) => a.id.localeCompare(b.id))
      return projects
    } catch (error) {
      console.error('Error getting API projects:', error)
      return []
    }
  })

  // 创建项目
  ipcMain.handle('create-api-project', async (event, project) => {
    const swaggerPath = getSwaggerPath()
    ensureSwaggerDir(swaggerPath)

    const fileName = ensureJsonExtension(project.config?.fileName || `${Date.now().toString()}.json`)
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const projectData = {
        id: Date.now().toString(),
        name: project.name,
        description: project.description || '',
        type: 'project',
        config: {
          fileName,
          baseUrl: project.config?.baseUrl || 'https://jsonplaceholder.typicode.com',
          proxy: project.config?.proxy || '',
          headers: project.config?.headers || { 'Content-Type': 'application/json' },
          timeout: project.config?.timeout || 30000
        },
        children: []
      }
      await fs.promises.writeFile(filePath, JSON.stringify(projectData, null, 2))
      return projectData
    } catch (error) {
      console.error('Error creating API project:', error)
      throw error
    }
  })

  // 更新项目
  ipcMain.handle('update-api-project', async (event, project) => {
    const swaggerPath = getSwaggerPath()

    // 统一 fileName 格式
    if (project.config?.fileName) {
      project.config.fileName = ensureJsonExtension(project.config.fileName)
    }

    const filePath = getProjectFilePath(swaggerPath, project)

    try {
      // 如果 fileName 变更，需要重命名文件
      if (project._oldFileName && project._oldFileName !== project.config?.fileName) {
        const oldPath = getFilePathByFileName(swaggerPath, project._oldFileName)
        if (fs.existsSync(oldPath)) {
          await fs.promises.rename(oldPath, filePath)
        }
      }

      // 先读取已有数据，保留 children 等非 config 字段
      let existingData = {}
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf8')
        existingData = JSON.parse(content)
      }

      const projectData = {
        ...existingData,
        ...project,
        type: project.type || 'project',
        config: {
          ...existingData.config,
          ...project.config,
          fileName: project.config?.fileName || existingData.config?.fileName || `${project.id}.json`
        }
      }
      // 保留原有 children（web 端可能不携带完整的 children）
      if (!project.children || project.children.length === 0) {
        projectData.children = existingData.children || []
      }
      // 清理临时字段
      delete projectData._oldFileName

      await fs.promises.writeFile(filePath, JSON.stringify(projectData, null, 2))
      return projectData
    } catch (error) {
      console.error('Error updating API project:', error)
      throw error
    }
  })

  // 删除项目
  ipcMain.handle('delete-api-project', async (event, fileName) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      await fs.promises.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting API project:', error)
      throw error
    }
  })

  // 获取分类列表
  ipcMain.handle('get-api-categories', async (event, fileName) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      return (project.children || []).filter(c => c.type === 'category')
    } catch (error) {
      console.error('Error getting API categories:', error)
      return []
    }
  })

  // 创建分类
  ipcMain.handle('create-api-category', async (event, fileName, category) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const newCategory = {
        id: Date.now().toString(),
        name: category.name,
        description: category.description || '',
        type: 'category',
        config: {},
        children: []
      }

      project.children = project.children || []
      project.children.push(newCategory)
      await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      return newCategory
    } catch (error) {
      console.error('Error creating API category:', error)
      throw error
    }
  })

  // 更新分类
  ipcMain.handle('update-api-category', async (event, fileName, category) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const categoryIndex = (project.children || []).findIndex(c => c.id === category.id)
      if (categoryIndex !== -1) {
        const existingCategory = project.children[categoryIndex]
        project.children[categoryIndex] = {
          ...existingCategory,
          ...category,
          type: category.type || 'category',
          // 保留原有接口列表，web 端可能不携带完整的 children
          children: category.children && category.children.length > 0
            ? category.children
            : existingCategory.children || []
        }
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      }

      return category
    } catch (error) {
      console.error('Error updating API category:', error)
      throw error
    }
  })

  // 删除分类
  ipcMain.handle('delete-api-category', async (event, fileName, categoryId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      project.children = (project.children || []).filter(c => c.id !== categoryId)
      await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      return true
    } catch (error) {
      console.error('Error deleting API category:', error)
      throw error
    }
  })

  // 获取接口列表
  ipcMain.handle('get-api-endpoints', async (event, fileName, categoryId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      const category = (project.children || []).find(c => c.id === categoryId)
      return category ? (category.children || []).filter(c => c.type === 'endpoint') : []
    } catch (error) {
      console.error('Error getting API endpoints:', error)
      return []
    }
  })

  // 创建接口
  ipcMain.handle('create-api-endpoint', async (event, fileName, categoryId, endpoint) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const category = (project.children || []).find(c => c.id === categoryId)
      if (category) {
        const newEndpoint = {
          id: Date.now().toString(),
          name: endpoint.name,
          description: endpoint.description || '',
          type: 'endpoint',
          config: {
            url: endpoint.config?.url || '',
            method: endpoint.config?.method || 'GET',
            headers: endpoint.config?.headers || {},
            params: endpoint.config?.params || [],
            bodyType: endpoint.config?.bodyType || 'none',
            body: endpoint.config?.body || '',
            timeout: endpoint.config?.timeout || 30000,
            followRedirect: endpoint.config?.followRedirect !== false,
            tests: [],
            examples: []
          },
          children: []
        }

        category.children = category.children || []
        category.children.push(newEndpoint)
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
        return newEndpoint
      }
      throw new Error('Category not found')
    } catch (error) {
      console.error('Error creating API endpoint:', error)
      throw error
    }
  })

  // 更新接口
  ipcMain.handle('update-api-endpoint', async (event, fileName, categoryId, endpoint) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const category = (project.children || []).find(c => c.id === categoryId)
      if (category) {
        const endpointIndex = (category.children || []).findIndex(e => e.id === endpoint.id)
        if (endpointIndex !== -1) {
          const existingEndpoint = category.children[endpointIndex]
          category.children[endpointIndex] = {
            ...existingEndpoint,
            ...endpoint,
            type: endpoint.type || 'endpoint',
            config: {
              ...existingEndpoint.config,
              ...endpoint.config
            }
          }
          await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
        }
      }

      return endpoint
    } catch (error) {
      console.error('Error updating API endpoint:', error)
      throw error
    }
  })

  // 删除接口
  ipcMain.handle('delete-api-endpoint', async (event, fileName, categoryId, endpointId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const category = (project.children || []).find(c => c.id === categoryId)
      if (category) {
        category.children = (category.children || []).filter(e => e.id !== endpointId)
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      }

      return true
    } catch (error) {
      console.error('Error deleting API endpoint:', error)
      throw error
    }
  })

  // 发送 API 请求
  ipcMain.handle('send-api-request', async (event, options) => {
    try {
      const result = await sendRequest(options)
      return result
    } catch (error) {
      console.error('API request error:', error)
      return {
        success: false,
        error: error.message || '请求失败',
        time: 0
      }
    }
  })

  // 获取完整接口信息（含项目配置合并）
  ipcMain.handle('get-full-endpoint', async (event, fileName, categoryId, endpointId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = getFilePathByFileName(swaggerPath, fileName)

    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)

      const category = (project.children || []).find(c => c.id === categoryId)
      if (!category) {
        throw new Error('Category not found')
      }

      const endpoint = (category.children || []).find(e => e.id === endpointId)
      if (!endpoint) {
        throw new Error('Endpoint not found')
      }

      const mergedConfig = mergeConfigs(project.config, endpoint.config)

      return {
        ...endpoint,
        mergedConfig,
        projectName: project.name,
        categoryName: category.name
      }
    } catch (error) {
      console.error('Error getting full endpoint:', error)
      throw error
    }
  })
}
