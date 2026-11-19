import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'
import { getAgenda } from './agendaService.js'

function normalizePublicContent(content, agenda) {
  if (!content || typeof content !== 'object') {
    throw new Error('Format konten publik API tidak sesuai kontrak.')
  }

  const timeline = Array.isArray(content.profile?.timeline)
    ? content.profile.timeline.map((event) => ({
        ...event,
        name: event.name ?? event.mosqueName ?? '',
      }))
    : []

  return {
    ...content,
    profile: content.profile
      ? {
          ...content.profile,
          timeline,
        }
      : null,
    agenda,
  }
}

export async function getPublicContent({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const [content, agenda] = await Promise.all([
      apiRequest('/public/content', { signal }),
      getAgenda({ signal }),
    ])
    return normalizePublicContent(content, agenda)
  }
  return { ...structuredClone(mockPublicContent), agenda: await getAgenda({ signal }) }
}
