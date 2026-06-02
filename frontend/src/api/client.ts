import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// レスポンスインターセプタでサーバー側の詳細エラーメッセージを取り出し、
// 呼び出し元で `error.message` として扱えるように正規化する。
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.response && error.response.data) {
      const resp = error.response
      const data = resp.data
      let message = `${resp.status} ${resp.statusText}`

      try {
        if (typeof data === 'string') {
          message = data
        } else if (data.message) {
          message = data.message
        } else if (data.error) {
          message = data.error
        } else if (Array.isArray(data.errors)) {
          message = data.errors
            .map((e: any) => e.msg || e.message || JSON.stringify(e))
            .join(', ')
        } else {
          // Fallback: stringify the body to give some context
          message = JSON.stringify(data)
        }
      } catch (e) {
        // ignore parsing errors and keep default message
      }

      return Promise.reject(new Error(message))
    }

    return Promise.reject(error)
  },
)
