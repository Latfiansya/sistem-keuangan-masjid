import { defaultTransferService } from '../services/transferService.js'

// Presentation layer transfer dana antar kategori untuk pengurus.
export function createTransferController(service = defaultTransferService) {
  return {
    async list(_req, res, next) {
      try {
        const data = await service.list()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async create(req, res, next) {
      try {
        const data = await service.create(req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async remove(req, res, next) {
      try {
        const data = await service.remove(req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
