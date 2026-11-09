import { getPublicAgenda } from '../services/agendaService.js'
import { getPublicContent } from '../services/publicContentService.js'

// untuk endpoint konten publik dan agenda.
export function getContent(_req, res) {
  res.json({ success: true, data: getPublicContent() })
}

export function getAgenda(_req, res) {
  res.json({ success: true, data: getPublicAgenda() })
}

