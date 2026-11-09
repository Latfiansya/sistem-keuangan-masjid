// Membuat error terstruktur untuk respons HTTP yang aman dikembalikan ke klien.
export function createHttpError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  error.isAppError = true
  return error
}
