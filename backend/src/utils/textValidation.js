// Mendeteksi karakter kontrol; tab dan baris baru hanya diizinkan untuk field multi-baris.
export function hasControlChars(value, allowMultiline = false) {
  return [...String(value)].some((character) => {
    const code = character.codePointAt(0)
    if (code === 127) return true
    if (code < 32) {
      return !(allowMultiline && (code === 9 || code === 10 || code === 13))
    }
    return false
  })
}
