import axios from 'axios'

// Add a request interceptor
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['x-auth-token'] = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add a response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location = '/login'
    }
    return Promise.reject(error)
  }
)

export default axios