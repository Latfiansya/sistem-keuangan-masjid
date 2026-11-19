import { defaultAdminSettingsService } from '../services/adminSettingsService.js'

// Presentation layer untuk profil masjid, agenda, pengaturan donasi, dan pengaturan website pengurus.
export function createAdminSettingsController(service = defaultAdminSettingsService) {
  return {
    async getProfile(_req, res, next) {
      try {
        const data = await service.getProfile()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateProfile(req, res, next) {
      try {
        const data = await service.updateProfile(req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getAgenda(_req, res, next) {
      try {
        const data = await service.getAgenda()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async createAgenda(req, res, next) {
      try {
        const data = await service.createAgenda(req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateAgenda(req, res, next) {
      try {
        const data = await service.updateAgenda(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteAgenda(req, res, next) {
      try {
        const data = await service.deleteAgenda(req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getDonationSettings(_req, res, next) {
      try {
        const data = await service.getDonationSettings()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateDonationSettings(req, res, next) {
      try {
        const data = await service.updateDonationSettings(req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getWebsiteSettings(_req, res, next) {
      try {
        const data = await service.getWebsiteSettings()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateWebsiteSettings(req, res, next) {
      try {
        const data = await service.updateWebsiteSettings(req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
