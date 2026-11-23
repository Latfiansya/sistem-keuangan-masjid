import { defaultProfileContentService } from '../services/profileContentService.js'

// Presentation layer konten profil masjid (misi, program, sejarah, pengurus) untuk pengurus.
export function createProfileContentController(service = defaultProfileContentService) {
  return {
    async list(_req, res, next) {
      try {
        const data = await service.getAll()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async create(req, res, next) {
      try {
        const data = await service.create(req.params.section, req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async update(req, res, next) {
      try {
        const data = await service.update(req.params.section, req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async remove(req, res, next) {
      try {
        const data = await service.remove(req.params.section, req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
