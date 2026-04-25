import fs from 'fs'
import path from 'path'
import { ipcMain } from 'electron'
import { sendRequest, mergeConfigs } from './requestHandler.js'
import { getSwaggerPath } from '../utils/paths.js'

// API 项目管理
export function registerApiHandlers() {
  // API 项目管理
  ipcMain.handle('get-api-projects', async () => {
    const swaggerPath = getSwaggerPath()
    try {
      // 确保目录存在
      if (!fs.existsSync(swaggerPath)) {
        fs.mkdirSync(swaggerPath, { recursive: true })
      }
      
      const files = await fs.promises.readdir(swaggerPath)
      const projects = []
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(swaggerPath, file)
          const content = await fs.promises.readFile(filePath, 'utf8')
          projects.push(JSON.parse(content))
        }
      }
      // 根据 id 进行排序
      projects.sort((a, b) => {
        return a.id.localeCompare(b.id)
      })
      return projects
    } catch (error) {
      console.error('Error getting API projects:', error)
      return []
    }
  });

  ipcMain.handle('create-api-project', async (event, project) => {
    const swaggerPath = getSwaggerPath()
    
    // 确保目录存在
    if (!fs.existsSync(swaggerPath)) {
      fs.mkdirSync(swaggerPath, { recursive: true })
    }
    
    const filePath = path.join(swaggerPath, `${project.fileName}.json`)
    
    try {
      const projectData = {
        id: Date.now().toString(),
        name: project.name,
        fileName: `${project.fileName}.json`,
        description: project.description || '',
        config: {
          baseUrl: project.config?.baseUrl || '',
          proxy: project.config?.proxy || '',
          headers: project.config?.headers || {},
          timeout: project.config?.timeout || 30000
        },
        categories: []
      }
      await fs.promises.writeFile(filePath, JSON.stringify(projectData, null, 2))
      return projectData
    } catch (error) {
      console.error('Error creating API project:', error)
      throw error
    }
  });

  ipcMain.handle('update-api-project', async (event, project) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${project.fileName}`)
    
    try {
      // 确保 config 结构完整
      const projectData = {
        ...project,
        config: {
          baseUrl: project.config?.baseUrl || '',
          proxy: project.config?.proxy || '',
          headers: project.config?.headers || {},
          timeout: project.config?.timeout || 30000,
          ...project.config
        }
      }
      await fs.promises.writeFile(filePath, JSON.stringify(projectData, null, 2))
      return projectData
    } catch (error) {
      console.error('Error updating API project:', error)
      throw error
    }
  });

  ipcMain.handle('delete-api-project', async (event, projectName) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      await fs.promises.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting API project:', error)
      throw error
    }
  });

  // API 分类管理
  ipcMain.handle('get-api-categories', async (event, projectName) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      return project.categories || []
    } catch (error) {
      console.error('Error getting API categories:', error)
      return []
    }
  });

  ipcMain.handle('create-api-category', async (event, projectName, category) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const newCategory = {
        id: Date.now().toString(),
        name: category.name,
        description: category.description || '',
        endpoints: []
      }
      
      project.categories.push(newCategory)
      await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      return newCategory
    } catch (error) {
      console.error('Error creating API category:', error)
      throw error
    }
  });

  ipcMain.handle('update-api-category', async (event, projectName, category) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const categoryIndex = project.categories.findIndex(c => c.id === category.id)
      if (categoryIndex !== -1) {
        project.categories[categoryIndex] = category
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      }
      
      return category
    } catch (error) {
      console.error('Error updating API category:', error)
      throw error
    }
  });

  ipcMain.handle('delete-api-category', async (event, projectName, categoryId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      project.categories = project.categories.filter(c => c.id !== categoryId)
      await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      return true
    } catch (error) {
      console.error('Error deleting API category:', error)
      throw error
    }
  });

  // API 接口管理
  ipcMain.handle('get-api-endpoints', async (event, projectName, categoryId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      const category = project.categories.find(c => c.id === categoryId)
      return category ? category.endpoints || [] : []
    } catch (error) {
      console.error('Error getting API endpoints:', error)
      return []
    }
  });

  ipcMain.handle('create-api-endpoint', async (event, projectName, categoryId, endpoint) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const category = project.categories.find(c => c.id === categoryId)
      if (category) {
        const newEndpoint = {
          id: Date.now().toString(),
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method || 'GET',
          description: endpoint.description || '',
          config: {
            headers: endpoint.config?.headers || {},
            params: endpoint.config?.params || [],
            bodyType: endpoint.config?.bodyType || 'none',
            body: endpoint.config?.body || '',
            timeout: endpoint.config?.timeout || 30000,
            followRedirect: endpoint.config?.followRedirect !== false
          },
          tests: [],
          examples: []
        }
        
        category.endpoints.push(newEndpoint)
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
        return newEndpoint
      }
      throw new Error('Category not found')
    } catch (error) {
      console.error('Error creating API endpoint:', error)
      throw error
    }
  });

  ipcMain.handle('update-api-endpoint', async (event, projectName, categoryId, endpoint) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const category = project.categories.find(c => c.id === categoryId)
      if (category) {
        const endpointIndex = category.endpoints.findIndex(e => e.id === endpoint.id)
        if (endpointIndex !== -1) {
          category.endpoints[endpointIndex] = endpoint
          await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
        }
      }
      
      return endpoint
    } catch (error) {
      console.error('Error updating API endpoint:', error)
      throw error
    }
  });

  ipcMain.handle('delete-api-endpoint', async (event, projectName, categoryId, endpointId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const category = project.categories.find(c => c.id === categoryId)
      if (category) {
        category.endpoints = category.endpoints.filter(e => e.id !== endpointId)
        await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      }
      
      return true
    } catch (error) {
      console.error('Error deleting API endpoint:', error)
      throw error
    }
  });

  // API 请求发送
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
  });

  // 获取完整接口信息（含项目配置合并）
  ipcMain.handle('get-full-endpoint', async (event, projectName, categoryId, endpointId) => {
    const swaggerPath = getSwaggerPath()
    const filePath = path.join(swaggerPath, `${projectName}.json`)
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const project = JSON.parse(content)
      
      const category = project.categories.find(c => c.id === categoryId)
      if (!category) {
        throw new Error('Category not found')
      }
      
      const endpoint = category.endpoints.find(e => e.id === endpointId)
      if (!endpoint) {
        throw new Error('Endpoint not found')
      }
      
      // 合并配置
      const mergedConfig = mergeConfigs(project.config, endpoint.config)
      
      return {
        ...endpoint,
        mergedConfig,
        projectName: project.name,
        category: category.name
      }
    } catch (error) {
      console.error('Error getting full endpoint:', error)
      throw error
    }
  });
}