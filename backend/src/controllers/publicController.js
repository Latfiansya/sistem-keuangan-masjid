import { defaultAgendaService } from '../services/agendaService.js'
import { defaultPublicContentService } from '../services/publicContentService.js'

// Presentation layer untuk endpoint konten publik dan agenda.
export function createPublicController({
  publicContentService = defaultPublicContentService,
  agendaService = defaultAgendaService,
} = {}) {
  return {
    async getContent(_req, res, next) {
      try {
        const data = await publicContentService.getPublicContent()
        res.json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getAgenda(_req, res, next) {
      try {
        const data = await agendaService.getPublicAgenda()
        res.json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}

const defaultController = createPublicController()

export const getContent = defaultController.getContent
export const getAgenda = defaultController.getAgenda
