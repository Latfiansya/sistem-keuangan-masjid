import { getInitialAdminSettingsState } from '../data/adminSettings.js'
import { findPublicAgenda } from './agendaRepository.js'

// Data access layer untuk profil masjid, agenda, donasi, dan pengaturan website pengurus.
export function createAdminSettingsRepository() {
  let state = getInitialAdminSettingsState()

  return {
    getProfile() {
      return structuredClone(state.profile)
    },

    saveProfile(nextProfile) {
      state.profile = structuredClone(nextProfile)
      return structuredClone(state.profile)
    },

    getAgenda() {
      return findPublicAgenda()
    },

    getDonationSettings() {
      return structuredClone(state.donationSettings)
    },

    saveDonationSettings(nextDonationSettings) {
      state.donationSettings = structuredClone(nextDonationSettings)
      return structuredClone(state.donationSettings)
    },

    getWebsiteSettings() {
      return structuredClone(state.websiteSettings)
    },

    saveWebsiteSettings(nextWebsiteSettings) {
      state.websiteSettings = structuredClone(nextWebsiteSettings)
      return structuredClone(state.websiteSettings)
    },

    reset() {
      state = getInitialAdminSettingsState()
    },
  }
}

export const defaultAdminSettingsRepository = createAdminSettingsRepository()
