import { defaultAgendaRepository } from '../repositories/agendaRepository.js'

// Business logic layer untuk agenda publik.
export function createAgendaService(repository = defaultAgendaRepository) {
  return {
    async getPublicAgenda() {
      const agenda = await repository.findPublicAgenda()
      return {
        description: agenda.description,
        groups: agenda.groups,
      }
    },
  }
}

export const defaultAgendaService = createAgendaService()

export function getPublicAgenda() {
  return defaultAgendaService.getPublicAgenda()
}
