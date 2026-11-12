import { defaultAdminSettingsService } from '../services/adminSettingsService.js'

// Presentation layer untuk profil masjid, agenda, pengaturan donasi, dan pengaturan website pengurus.
export function createAdminSettingsController(service = defaultAdminSettingsService) {
  return {
    getProfile(_req, res, next) {
      try {
        const data = service.getProfile()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    updateProfile(req, res, next) {
      try {
        const data = service.updateProfile(req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    getAgenda(_req, res, next) {
      try {
        const data = service.getAgenda()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    getDonationSettings(_req, res, next) {
      try {
        const data = service.getDonationSettings()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    updateDonationSettings(req, res, next) {
      try {
        const data = service.updateDonationSettings(req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    getWebsiteSettings(_req, res, next) {
      try {
        const data = service.getWebsiteSettings()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    updateWebsiteSettings(req, res, next) {
      try {
        const data = service.updateWebsiteSettings(req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}

