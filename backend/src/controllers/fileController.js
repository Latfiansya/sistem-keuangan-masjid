import { defaultFileService } from '../services/fileService.js'

// Presentation layer unggah berkas pengurus dan penyajian berkas publik.
export function createFileController(service = defaultFileService) {
  return {
    async upload(req, res, next) {
      try {
        const data = await service.upload(
          req.params.target,
          { content: req.body, contentType: req.get('content-type') },
          req.adminUser?.id ?? null
        )
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async remove(req, res, next) {
      try {
        const data = await service.remove(req.params.target, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async show(req, res, next) {
      try {
        const file = await service.getPublicFile(req.params.target, req.params.hash)
        const etag = `"${file.sha256}"`
        res.setHeader('ETag', etag)
        // URL memuat hash isi sehingga tidak pernah dipakai ulang untuk isi berbeda; aman di-cache lama.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        if (req.get('if-none-match') === etag) {
          res.status(304).end()
          return
        }
        res.setHeader('Content-Type', file.mimeType)
        res.setHeader('Content-Length', String(file.size))
        res.setHeader('Content-Disposition', 'inline')
        res.status(200).end(file.content)
      } catch (error) {
        next(error)
      }
    },
  }
}
