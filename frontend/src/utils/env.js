export const dataSource = import.meta.env?.VITE_DATA_SOURCE || 'mock'
export const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

if (!['mock', 'api'].includes(dataSource)) {
  throw new Error('VITE_DATA_SOURCE harus bernilai mock atau api.')
}
