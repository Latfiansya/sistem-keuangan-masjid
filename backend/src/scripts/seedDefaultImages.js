import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDefaultDatabasePool, getDefaultDatabasePool } from '../config/database.js'
import { createFileRepository, FILE_TARGETS, PUBLIC_FILE_PREFIX } from '../repositories/fileRepository.js'
import { createFileService } from '../services/fileService.js'
import { detectImageMime } from '../utils/imageFile.js'

// Menyimpan foto, logo, dan (opsional) QRIS ke kolom *_isi agar seluruh gambar website berada di database.
// Tanpa opsi jalur, foto dan logo diambil dari aset bawaan frontend (WebP); QRIS hanya disimpan bila --qris diberikan.
// Format dikenali dari isi berkas (PNG/JPG/WebP). Jalur relatif dihitung dari folder tempat perintah dijalankan.
//
// Pemakaian (dari root repo):
//   npm run db:seed-images --workspace backend -- --dry-run
//   npm run db:seed-images --workspace backend
//   npm run db:seed-images --workspace backend -- --photo="D:\gambar\foto.png" --logo="D:\gambar\logo.png" --qris="D:\gambar\qris.png"
//   (tambahkan --force untuk menimpa gambar unggahan yang sudah ada)
const assetsDir = new URL('../../../frontend/public/assets/', import.meta.url)
const IMAGES = [
  { target: 'masjid-photo', option: 'photo', defaultFile: fileURLToPath(new URL('masjid-background.webp', assetsDir)) },
  { target: 'logo', option: 'logo', defaultFile: fileURLToPath(new URL('masjid-logo.webp', assetsDir)) },
  { target: 'qris', option: 'qris', defaultFile: null },
]

const flags = new Set()
const options = {}
for (const arg of process.argv.slice(2)) {
  const [key, ...rest] = arg.replace(/^--/, '').split('=')
  if (rest.length) options[key] = rest.join('=')
  else flags.add(key)
}
const dryRun = flags.has('dry-run')
const force = flags.has('force')

// Membaca dan memeriksa berkas lebih dulu (tanpa database) agar kesalahan berkas langsung terlihat.
async function loadImages() {
  const unknown = Object.keys(options).filter((key) => !IMAGES.some((image) => image.option === key))
  if (unknown.length) throw new Error(`Opsi tidak dikenal: --${unknown.join(', --')}. Gunakan --photo, --logo, --qris, --dry-run, atau --force.`)
  const selected = IMAGES.filter((image) => options[image.option] || image.defaultFile)
  return Promise.all(selected.map(async (image) => {
    const filePath = options[image.option] ? resolve(process.cwd(), options[image.option]) : image.defaultFile
    let content
    try {
      content = await readFile(filePath)
    } catch {
      throw new Error(`Berkas ${image.option} tidak dapat dibaca: ${filePath}`)
    }
    const mimeType = detectImageMime(content)
    if (!mimeType) throw new Error(`Berkas ${image.option} bukan PNG, JPG, atau WebP yang valid: ${filePath}`)
    const target = FILE_TARGETS[image.target]
    if (content.length > target.maxBytes) {
      throw new Error(`Berkas ${image.option} berukuran ${content.length} byte, melebihi batas ${target.maxBytes / (1024 * 1024)} MB: ${filePath}`)
    }
    return { ...image, ...target, filePath, content, mimeType, fileName: basename(filePath) }
  }))
}

async function main() {
  const images = await loadImages()
  console.log(dryRun ? 'Mode periksa (--dry-run): tidak ada data yang ditulis.\n' : '')
  for (const image of images) {
    console.log(`Berkas ${image.option.padEnd(5)} valid: ${image.fileName} (${image.mimeType}, ${image.content.length} byte)`)
  }
  console.log('')

  const db = getDefaultDatabasePool()
  const service = createFileService(createFileRepository(db))
  for (const image of images) {
    // Nama tabel/kolom berasal dari konstanta FILE_TARGETS, bukan input pengguna.
    const columnRes = await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'keu_masjid' AND table_name = $1 AND column_name = $2`,
      [image.table, image.contentColumn]
    )
    if (!columnRes.rowCount) {
      throw new Error(`Kolom ${image.table}.${image.contentColumn} belum ada. Jalankan docs/sql/2026-11-23-gambar-di-kolom.sql terlebih dahulu.`)
    }
    const { rows } = await db.query(`SELECT ${image.pathColumn} AS path FROM keu_masjid.${image.table} WHERE id = 1`)
    if (!rows[0]) throw new Error(`Baris ${image.table} id=1 belum ada.`)

    const current = rows[0].path || '(kosong)'
    const label = `${image.target.padEnd(12)} ${image.fileName}, ${image.pathColumn} saat ini: ${current}`
    if (String(current).startsWith(PUBLIC_FILE_PREFIX) && !force) {
      console.log(`[LEWATI] ${label} — sudah memakai berkas unggahan; gunakan --force untuk menimpa.`)
      continue
    }
    if (dryRun) {
      console.log(`[SIAP]   ${label}`)
      continue
    }
    const saved = await service.upload(image.target, { content: image.content, contentType: image.mimeType })
    console.log(`[OK]     ${label} → ${saved.path}`)
  }
}

try {
  await main()
} catch (error) {
  console.error(`\n[GAGAL] ${error.message}`)
  process.exitCode = 1
} finally {
  await closeDefaultDatabasePool()
}
