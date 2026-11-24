import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { createDatabasePool, withDatabaseClient } from '../src/config/database.js'
import { loadEnv } from '../src/config/env.js'
import {
  mapCategoryApiId,
  mapPgErrorToHttpError,
  resolveCategoryColor,
  resolveCategoryDbId,
  toRupiahInteger,
} from '../src/utils/financeMapping.js'
import { createTestRepositories } from './helpers/testRepositories.js'

test('loadEnv memparsing DATABASE_URL dengan aman dan default schema keu_masjid', () => {
  const config = loadEnv({
    DATABASE_URL:
      'postgresql://user_db:pass_rahasia@10.0.0.5:54329/db_keuangan_masjid_dev?schema=public',
  })

  assert.equal(config.db.host, '10.0.0.5')
  assert.equal(config.db.port, 54329)
  assert.equal(config.db.database, 'db_keuangan_masjid_dev')
  assert.equal(config.db.username, 'user_db')
  assert.equal(config.db.password, 'pass_rahasia')
  assert.equal(config.db.schema, 'keu_masjid')
})

test('financeMapping memetakan ID kategori, warna, nominal Rupiah, dan error PostgreSQL dengan konsisten', () => {
  assert.equal(mapCategoryApiId(1), 'mosque')
  assert.equal(mapCategoryApiId(2), 'maintenance')
  assert.equal(mapCategoryApiId(3), 'friday')
  assert.equal(mapCategoryApiId(4), '4')

  assert.equal(resolveCategoryDbId('mosque'), 1)
  assert.equal(resolveCategoryDbId('maintenance'), 2)
  assert.equal(resolveCategoryDbId('friday'), 3)
  assert.equal(resolveCategoryDbId('12'), 12)
  assert.equal(resolveCategoryDbId('bukan-id'), null)

  assert.equal(resolveCategoryColor(1, 'Kas Masjid'), 'green')
  assert.equal(resolveCategoryColor(2, 'Kotak Pembangunan & Pemeliharaan'), 'orange')
  assert.equal(resolveCategoryColor(3, "Kotak Jum'at Berkah"), 'blue')

  assert.equal(toRupiahInteger('12868200.00'), 12868200)

  const checkErr = mapPgErrorToHttpError({ code: '23514', message: 'Saldo kategori dana "Kas Masjid" tidak mencukupi' })
  assert.equal(checkErr.status, 400)
  assert.match(checkErr.message, /Saldo kategori dana/)
})

test('GET /api/health/db melaporkan status koneksi pool PostgreSQL secara aman', async () => {
  const healthyPool = {
    async query() {
      return { rows: [{ database_name: 'db_keuangan_masjid_dev', schema_name: 'keu_masjid' }] }
    },
  }
  const okApp = createApp({ dbPool: healthyPool, repositories: createTestRepositories() })
  const okServer = await new Promise((resolve) => {
    const s = okApp.listen(0, '127.0.0.1', () => resolve(s))
  })

  try {
    const res = await fetch(`http://127.0.0.1:${okServer.address().port}/api/health/db`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body, {
      success: true,
      data: {
        status: 'ok',
        database: 'db_keuangan_masjid_dev',
        schema: 'keu_masjid',
      },
    })
  } finally {
    await new Promise((resolve) => okServer.close(resolve))
  }

  const brokenPool = {
    async query() {
      throw new Error('ECONNREFUSED secret password')
    },
  }
  const failApp = createApp({ dbPool: brokenPool, repositories: createTestRepositories() })
  const failServer = await new Promise((resolve) => {
    const s = failApp.listen(0, '127.0.0.1', () => resolve(s))
  })

  try {
    const res = await fetch(`http://127.0.0.1:${failServer.address().port}/api/health/db`)
    assert.equal(res.status, 503)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'SERVICE_UNAVAILABLE')
    assert.doesNotMatch(body.error.message, /secret|password/i)
  } finally {
    await new Promise((resolve) => failServer.close(resolve))
  }
})

test('createDatabasePool memakai timeout 15s + keepAlive dan withDatabaseClient selalu release koneksi', async () => {
  const pool = createDatabasePool(
    loadEnv({
      DATABASE_URL: 'postgresql://user_db:pass_rahasia@10.0.0.5:54329/db_keuangan_masjid_dev',
    }).db
  )
  try {
    assert.match(pool.options.options, /-c search_path=keu_masjid,public/)
    assert.equal(pool.options.connectionTimeoutMillis, 15_000)
    assert.equal(pool.options.statement_timeout, 15_000)
    assert.equal(pool.options.keepAlive, true)
  } finally {
    await pool.end()
  }

  let connectCalls = 0
  let releaseCalls = 0
  const fakePool = {
    async connect() {
      connectCalls += 1
      return {
        async query(sql) {
          return { rows: [{ sql }] }
        },
        release() {
          releaseCalls += 1
        },
      }
    },
  }

  await assert.rejects(
    withDatabaseClient(fakePool, async (client) => {
      await client.query('SELECT 1')
      throw new Error('simulasi gagal')
    }),
    /simulasi gagal/
  )
  assert.equal(connectCalls, 1)
  assert.equal(releaseCalls, 1)
})

