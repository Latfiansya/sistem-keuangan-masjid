import { findPublicAgenda } from '../repositories/agendaRepository.js'

// untuk agenda publik.
export function getPublicAgenda() {
  const agenda = findPublicAgenda()
  return {
    description: agenda.description,
    groups: agenda.groups,
  }
}

