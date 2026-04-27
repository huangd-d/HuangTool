import fetch from 'node-fetch'
import { ProxyAgent } from 'proxy-agent'
import { URLSearchParams } from 'url'

/**
 * 发送 HTTP 请求
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应结果
 */
export async function sendRequest(options) {
  console.log('options', options);

  const {
    baseUrl = '',
    url,
    method = 'GET',
    headers = {},
    params = [],
    body,
    bodyType = 'none',
    responseType = 'json',
    proxy = '',
    timeout = 30000
  } = options

  const startTime = Date.now()

  try {
    // 1. 构建完整 URL
    let fullUrl = baseUrl ? `${baseUrl}${url}` : url

    // 添加查询参数
    if (params && params.length > 0) {
      const searchParams = new URLSearchParams()
      params.forEach(param => {
        if (param.name && param.enabled !== false) {
          searchParams.append(param.name, param.value || '')
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += fullUrl.includes('?') ? `&${queryString}` : `?${queryString}`
      }
    }

    // 2. 准备请求头
    const requestHeaders = { ...headers }

    // 3. 处理请求体
    let requestBody = undefined
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (bodyType === 'json') {
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json'
        }
        // 如果 body 是对象，转换为 JSON 字符串
        requestBody = typeof body === 'string' ? body : JSON.stringify(body)
      } else if (bodyType === 'form') {
        // form-data 类型
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
        }
        if (typeof body === 'object') {
          const formParams = new URLSearchParams()
          Object.entries(body).forEach(([key, value]) => {
            formParams.append(key, value)
          })
          requestBody = formParams.toString()
        } else {
          requestBody = body
        }
      } else if (bodyType === 'raw') {
        requestBody = body
      }
      // binary 类型需要特殊处理文件，这里暂不支持
    }

    // 4. 配置代理
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: requestHeaders,
      redirect: 'follow'
    }

    if (requestBody !== undefined) {
      fetchOptions.body = requestBody
    }

    // 如果设置了代理
    if (proxy) {
      fetchOptions.agent = new ProxyAgent(proxy)
    }

    // 5. 设置超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    fetchOptions.signal = controller.signal

    // 6. 发送请求
    const response = await fetch(fullUrl, fetchOptions)
    clearTimeout(timeoutId)

    const duration = Date.now() - startTime

    // 7. 解析响应
    const responseHeaders = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // 根据 Content-Type 解析响应体
    const contentType = response.headers.get('content-type') || ''
    let responseData
    let responseSize = 0

    if (contentType.includes('application/json')) {
      const text = await response.text()
      responseSize = text.length
      try {
        responseData = JSON.parse(text)
      } catch (e) {
        responseData = text
      }
    } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
      responseData = await response.text()
      responseSize = responseData.length
    } else {
      // 其他类型返回 base64
      const buffer = await response.buffer()
      responseData = buffer.toString('base64')
      responseSize = buffer.length
    }

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      time: duration,
      size: responseSize,
      contentType: contentType
    }
  } // 在 requestHandler.js 中修改错误处理
  catch (error) {
    console.log('error', error);
    
    const duration = Date.now() - startTime

    // 错误处理
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        statusText: '请求超时',
        data: { error: '请求超时' },
        time: duration,
        size: 0,
        headers: {},
        timeout: timeout
      }
    }

    return {
      success: false,
      status: 0,
      statusText: 'Error',
      data: { error: error.message || '请求失败' },
      time: duration,
      size: 0,
      headers: {},
      code: error.code
    }
  }
}

/**
 * 合并项目配置和接口配置
 * @param {Object} projectConfig - 项目配置
 * @param {Object} endpointConfig - 接口配置
 * @returns {Object} 合并后的配置
 */
export function mergeConfigs(projectConfig, endpointConfig) {
  const merged = {
    baseUrl: projectConfig?.baseUrl || '',
    url: endpointConfig?.url || '',
    method: endpointConfig?.method || 'GET',
    proxy: endpointConfig?.proxy || projectConfig?.proxy || '',
    timeout: endpointConfig?.timeout || projectConfig?.timeout || 30000,
    headers: {
      ...(projectConfig?.headers || {}),
      ...(endpointConfig?.headers || {})
    },
    params: endpointConfig?.params || [],
    bodyType: endpointConfig?.bodyType || 'none',
    body: endpointConfig?.body || '',
    followRedirect: endpointConfig?.followRedirect !== false
  }

  return merged
}
