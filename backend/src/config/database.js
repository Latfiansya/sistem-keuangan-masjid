import pg from 'pg'
import { loadEnv } from './env.js'

const { Pool } = pg

function buildSearchPath(schema) {
  if (!schema || schema === 'keu_masjid' || schema === 'public') {
    return 'keu_masjid,public'
  }
  return `${schema},keu_masjid,public`
}

function resolveSslConfig(sslmode) {
  if (sslmode === 'disable') return false
  if (sslmode === 'verify-full') return { rejectUnauthorized: true }
  if (sslmode === 'require' || sslmode === 'no-verify') return { rejectUnauthorized: false }
  return false
}

// Membuat pool koneksi PostgreSQL dengan konfigurasi terpusat dari environment.
export function createDatabasePool(dbConfig = loadEnv().db) {
  const searchPath = buildSearchPath(dbConfig.schema)
  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
    ssl: resolveSslConfig(dbConfig.sslmode),
    options: `-c search_path=${searchPath}`,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  pool.on('error', (error) => {
    console.error('Kesalahan koneksi pool PostgreSQL:', error.message)
  })

  return pool
}

let sharedPool = null

export function getDefaultDatabasePool() {
  if (!sharedPool) {
    sharedPool = createDatabasePool()
  }
  return sharedPool
}

export async function checkDatabaseConnection(pool = getDefaultDatabasePool()) {
  const result = await pool.query('SELECT current_database() AS database_name, current_schema() AS schema_name')
  return result.rows[0]
}

// Menjalankan beberapa query tulis dalam satu transaksi PostgreSQL (opsional set app.user_id untuk trigger audit).
export async function withDatabaseTransaction(pool, work, auditUserId = null) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (auditUserId !== null && auditUserId !== undefined) {
      await client.query("SELECT set_config('app.user_id', $1, true)", [String(auditUserId)])
    }
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Abaikan kegagalan rollback agar error utama tetap diteruskan.
    }
    throw error
  } finally {
    client.release()
  }
}

export async function closeDefaultDatabasePool() {
  if (!sharedPool) return
  const poolToClose = sharedPool
  sharedPool = null
  await poolToClose.end()
}
