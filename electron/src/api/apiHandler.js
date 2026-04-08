import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

// API 项目管理
export function registerApiHandlers() {
  // API 项目管理
  ipcMain.handle('get-api-projects', async () => {
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
    try {
      const files = await fs.promises.readdir(swaggerPath)
      const projects = []
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(swaggerPath, file)
          const content = await fs.promises.readFile(filePath, 'utf8')
          projects.push(JSON.parse(content))
        }
      }
      return projects
    } catch (error) {
      console.error('Error getting API projects:', error)
      return []
    }
  });

  ipcMain.handle('create-api-project', async (event, project) => {
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
    const filePath = path.join(swaggerPath, `${project.name}.json`)
    
    try {
      const projectData = {
        id: Date.now().toString(),
        name: project.name,
        description: project.description || '',
        config: project.config || {
          proxy: '',
          headers: {}
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
    const filePath = path.join(swaggerPath, `${project.name}.json`)
    
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(project, null, 2))
      return project
    } catch (error) {
      console.error('Error updating API project:', error)
      throw error
    }
  });

  ipcMain.handle('delete-api-project', async (event, projectName) => {
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
          headers: endpoint.headers || {},
          params: endpoint.params || [],
          body: endpoint.body || '',
          bodyType: endpoint.bodyType || 'json'
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const swaggerPath = path.join(app.getAppPath(), '../swagger')
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
    const { method, url, body, token, proxy, headers } = options
    
    try {
      // 构建请求选项
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
      
      // 添加 token
      if (token) {
        requestOptions.headers['Authorization'] = `Bearer ${token}`
      }
      
      // 添加请求体
      if (body) {
        requestOptions.body = body
      }
      
      // 发送请求
      const response = await fetch(url, requestOptions)
      
      // 解析响应
      const data = await response.json()
      
      return {
        status: response.status,
        statusText: response.statusText,
        data
      }
    } catch (error) {
      console.error('API request error:', error)
      return {
        error: error.message
      }
    }
  });
}