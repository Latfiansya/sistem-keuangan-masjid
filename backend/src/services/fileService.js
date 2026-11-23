import { createHash } from 'node:crypto'
import { defaultFileRepository, FILE_TARGETS } from '../repositories/fileRepository.js'
import { createHttpError } from '../utils/httpError.js'
import { detectImageMime } from '../utils/imageFile.js'

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const SHA256_PATTERN = /^[0-9a-f]{64}$/

function resolveTarget(target) {
  if (!Object.hasOwn(FILE_TARGETS, target)) {
    throw createHttpError(404, 'NOT_FOUND', 'Jenis berkas unggahan tidak dikenal.')
  }
  return FILE_TARGETS[target]
}

// Business logic layer unggah dan penyajian berkas gambar website.
export function createFileService(repository = defaultFileRepository) {
  return {
    async upload(target, { content, contentType }, auditUserId = null) {
      const { maxBytes } = resolveTarget(target)
      const declared = String(contentType || '').split(';')[0].trim().toLowerCase()
      if (!ALLOWED_MIME.has(declared) || !Buffer.isBuffer(content)) {
        throw createHttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Format berkas harus PNG, JPG, atau WebP.')
      }
      if (!content.length) throw createHttpError(400, 'BAD_REQUEST', 'Berkas kosong. Pilih gambar lain.')
      if (content.length > maxBytes) {
        throw createHttpError(413, 'PAYLOAD_TOO_LARGE', `Ukuran berkas maksimal ${maxBytes / (1024 * 1024)} MB.`)
      }
      const detected = detectImageMime(content)
      if (!detected || detected !== declared) {
        throw createHttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Isi berkas tidak sesuai format PNG, JPG, atau WebP yang dinyatakan.')
      }
      const sha256 = createHash('sha256').update(content).digest('hex')
      return repository.saveForTarget(target, { mimeType: detected, content, sha256 }, auditUserId)
    },

    async remove(target, auditUserId = null) {
      resolveTarget(target)
      return repository.removeForTarget(target, auditUserId)
    },

    async getPublicFile(target, sha256) {
      if (!Object.hasOwn(FILE_TARGETS, target) || !SHA256_PATTERN.test(String(sha256))) {
        throw createHttpError(404, 'NOT_FOUND', 'Berkas tidak ditemukan.')
      }
      const file = await repository.findByTargetAndHash(target, sha256)
      if (!file) throw createHttpError(404, 'NOT_FOUND', 'Berkas tidak ditemukan.')
      return file
    },
  }
}

export const defaultFileService = createFileService()
