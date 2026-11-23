import { defaultReceiptService } from '../services/receiptService.js'

// Presentation layer kwitansi jamaah untuk pengurus.
export function createReceiptController(service = defaultReceiptService) {
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

    async update(req, res, next) {
      try {
        const data = await service.update(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    // Body { withTransaction: true } ikut menghapus transaksi pemasukannya; bawaan hanya membatalkan kwitansi.
    async cancel(req, res, next) {
      try {
        const data = await service.cancel(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
