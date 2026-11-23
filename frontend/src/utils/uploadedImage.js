export const UPLOADED_FILE_PREFIX = '/api/public/files/'

const UPLOADED_FILE_PATTERN = /^\/api\/public\/files\/(masjid-photo|logo|qris)\/([0-9a-f]{64})$/

// Hanya URL hasil unggah (target + hash isi) yang dianggap gambar valid; path lama seperti /images/... diabaikan.
export function resolveUploadedImage(path) {
  return typeof path === 'string' && UPLOADED_FILE_PATTERN.test(path) ? path : null
}

// SHA-256 foto masjid bawaan: aset WebP di public/assets (dijaga oleh test terhadap berkasnya) dan foto asli PNG
// 1928 × 1089 px yang menjadi sumbernya. Perbarui daftar ini bila foto bawaan diganti.
export const DEFAULT_MASJID_PHOTO_SHA256S = Object.freeze([
  'a6989dd486df779242c6e3935d5ba3151e88ad447a0dffcb008db7e67b24a3cf',
  '295905cd9d2b31b7a53e10365d5086d3c73fd90ba8eb849b29d0dcc369cd4b3c',
])

// Overlay gedung hero hanya cocok untuk foto bawaan, baik dari aset maupun salinannya di database.
export function isDefaultMasjidPhoto(content) {
  return !resolveUploadedImage(content?.photoPath) || DEFAULT_MASJID_PHOTO_SHA256S.includes(content?.photoSha256)
}
