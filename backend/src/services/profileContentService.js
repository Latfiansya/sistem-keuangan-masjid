import { defaultProfileContentRepository, PROFILE_CONTENT_SECTIONS } from '../repositories/profileContentRepository.js'
import { createHttpError } from '../utils/httpError.js'
import { hasControlChars } from '../utils/textValidation.js'

const ORDER_RULE = { key: 'order', label: 'Urutan tampil', type: 'integer', min: 0, max: 32767, defaultValue: 0 }
const ACTIVE_RULE = { key: 'active', label: 'Status tampil', type: 'boolean', defaultValue: true }

// Aturan validasi tiap bagian mengikuti panjang kolom dan check constraint tabel keu_masjid.
const SECTION_RULES = {
  missions: {
    label: 'Misi',
    fields: [{ key: 'text', label: 'Isi misi', type: 'text', required: true, max: 255, multiline: true }, ORDER_RULE],
  },
  programs: {
    label: 'Program',
    fields: [
      { key: 'title', label: 'Judul program', type: 'text', required: true, max: 100 },
      { key: 'description', label: 'Deskripsi program', type: 'text', required: true, max: 500, multiline: true },
      ORDER_RULE,
      ACTIVE_RULE,
    ],
  },
  history: {
    label: 'Sejarah',
    fields: [
      { key: 'year', label: 'Tahun', type: 'integer', required: true, min: 1800, max: 2100 },
      { key: 'era', label: 'Label era', type: 'text', max: 50 },
      { key: 'placeName', label: 'Nama tempat', type: 'text', max: 150 },
      { key: 'title', label: 'Judul sejarah', type: 'text', required: true, max: 150 },
      { key: 'description', label: 'Deskripsi sejarah', type: 'text', max: 2000, multiline: true },
      ORDER_RULE,
    ],
  },
  officers: {
    label: 'Pengurus',
    fields: [
      { key: 'name', label: 'Nama pengurus', type: 'text', required: true, max: 150 },
      { key: 'role', label: 'Jabatan', type: 'text', required: true, max: 50 },
      { key: 'note', label: 'Keterangan', type: 'text', max: 150 },
      ORDER_RULE,
      ACTIVE_RULE,
    ],
  },
}

function resolveSection(section) {
  if (!Object.hasOwn(SECTION_RULES, section) || !Object.hasOwn(PROFILE_CONTENT_SECTIONS, section)) {
    throw createHttpError(404, 'NOT_FOUND', 'Bagian konten profil tidak dikenal.')
  }
  return SECTION_RULES[section]
}

function badRequest(message) {
  return createHttpError(400, 'BAD_REQUEST', message)
}

function validateField(rule, rawValue) {
  if (rule.type === 'text') {
    const value = rawValue ?? ''
    if (typeof value !== 'string') throw badRequest(`${rule.label} harus berupa teks.`)
    const trimmed = value.trim()
    if (rule.required && !trimmed) throw badRequest(`${rule.label} wajib diisi.`)
    if (trimmed.length > rule.max || hasControlChars(value, rule.multiline === true)) {
      throw badRequest(`${rule.label} tidak boleh mengandung karakter kontrol atau melebihi ${rule.max} karakter.`)
    }
    return trimmed || null
  }

  if (rule.type === 'integer') {
    const value = rawValue ?? rule.defaultValue
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
      throw badRequest(`${rule.label} harus berupa bilangan bulat ${rule.min}–${rule.max}.`)
    }
    return value
  }

  const value = rawValue ?? rule.defaultValue
  if (typeof value !== 'boolean') throw badRequest(`${rule.label} harus berupa boolean.`)
  return value
}

function validatePayload(rules, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw badRequest(`Payload ${rules.label.toLowerCase()} tidak valid.`)
  }
  return Object.fromEntries(rules.fields.map((rule) => [rule.key, validateField(rule, payload[rule.key])]))
}

// Business logic layer pengelolaan misi, program, sejarah, dan pengurus oleh pengurus masjid.
export function createProfileContentService(repository = defaultProfileContentRepository) {
  return {
    async getAll() {
      return repository.findAll()
    },

    async create(section, payload, auditUserId = null) {
      const rules = resolveSection(section)
      return repository.insert(section, validatePayload(rules, payload), auditUserId)
    },

    async update(section, id, payload, auditUserId = null) {
      const rules = resolveSection(section)
      const values = validatePayload(rules, payload)
      const updated = await repository.updateById(section, id, values, auditUserId)
      if (!updated) throw createHttpError(404, 'NOT_FOUND', `Data ${rules.label.toLowerCase()} tidak ditemukan.`)
      return updated
    },

    async remove(section, id, auditUserId = null) {
      const rules = resolveSection(section)
      const deleted = await repository.deleteById(section, id, auditUserId)
      if (!deleted) throw createHttpError(404, 'NOT_FOUND', `Data ${rules.label.toLowerCase()} tidak ditemukan.`)
      return { deletedId: String(id) }
    },
  }
}

export const defaultProfileContentService = createProfileContentService()
