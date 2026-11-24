export const MAX_DONATION_BANKS = 4
export const DONATION_BANK_TABLE_CANDIDATES = [
  'm_rekening_donasi',
  'rekening_donasi',
  'm_rek',
  'm_rekening',
]

function mapBankRow(row) {
  return {
    id: row.id !== undefined && row.id !== null ? String(row.id) : null,
    bankName: String(row.nama_bank ?? '').trim(),
    accountNumber: String(row.no_rekening ?? '').trim(),
    accountName: String(row.atas_nama ?? '').trim(),
    order: Number(row.urutan ?? 0),
  }
}

// Membaca daftar rekening donasi aktif (maks 4) dari tabel rekening donasi baru,
// dengan fallback aman ke kolom bank_* pada m_pengaturan_website bila tabel baru belum tersedia.
export async function readDonationBankAccounts(client, legacyWebsiteRow = null) {
  for (const tableName of DONATION_BANK_TABLE_CANDIDATES) {
    try {
      const { rows } = await client.query(
        `SELECT id, nama_bank, no_rekening, atas_nama, urutan
         FROM keu_masjid.${tableName}
         WHERE aktif = true
         ORDER BY urutan ASC, id ASC
         LIMIT $1`,
        [MAX_DONATION_BANKS]
      )
      return {
        tableName,
        accounts: rows
          .map(mapBankRow)
          .filter((item) => item.bankName && item.accountNumber && item.accountName),
      }
    } catch (error) {
      if (error?.code === '42P01') continue
      throw error
    }
  }

  let row = legacyWebsiteRow
  if (!row || !Object.hasOwn(row, 'bank_nama')) {
    try {
      const res = await client.query(
        `SELECT bank_nama, bank_no_rekening, bank_atas_nama
         FROM keu_masjid.m_pengaturan_website
         WHERE id = 1
         LIMIT 1`
      )
      row = res.rows[0] ?? null
    } catch (error) {
      if (error?.code !== '42703') throw error
      row = null
    }
  }

  const bankName = String(row?.bank_nama ?? '').trim()
  const accountNumber = String(row?.bank_no_rekening ?? '').trim()
  const accountName = String(row?.bank_atas_nama ?? '').trim()
  return {
    tableName: null,
    accounts: bankName && accountNumber && accountName
      ? [{ id: '1', bankName, accountNumber, accountName, order: 1 }]
      : [],
  }
}

export async function inspectDonationSchema(client) {
  const { rows } = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'keu_masjid'
       AND table_name = ANY($1::text[])`,
    [['m_pengaturan_website', ...DONATION_BANK_TABLE_CANDIDATES]]
  )

  const columnsByTable = new Map()
  for (const row of rows) {
    if (!columnsByTable.has(row.table_name)) {
      columnsByTable.set(row.table_name, new Set())
    }
    columnsByTable.get(row.table_name).add(row.column_name)
  }

  const bankTable = DONATION_BANK_TABLE_CANDIDATES.find((name) => columnsByTable.has(name)) || null
  const settingsCols = columnsByTable.get('m_pengaturan_website') || new Set()
  const hasLegacyBankColumns =
    settingsCols.has('bank_nama') &&
    settingsCols.has('bank_no_rekening') &&
    settingsCols.has('bank_atas_nama')

  return { bankTable, hasLegacyBankColumns }
}

// Menyinkronkan 0..4 rekening donasi aktif ke tabel rekening baru (update in-place, insert tambah, delete sisa).
export async function syncDonationBankTable(client, bankTable, bankAccounts, userId) {
  const { rows: existingRows } = await client.query(
    `SELECT id
     FROM keu_masjid.${bankTable}
     ORDER BY urutan ASC, id ASC`
  )

  const normalized = bankAccounts.slice(0, MAX_DONATION_BANKS)
  for (let index = 0; index < normalized.length; index += 1) {
    const account = normalized[index]
    const order = index + 1
    const existing = existingRows[index]
    if (existing) {
      await client.query(
        `UPDATE keu_masjid.${bankTable}
         SET nama_bank = $2,
             no_rekening = $3,
             atas_nama = $4,
             urutan = $5,
             aktif = true,
             updated_at = CURRENT_TIMESTAMP,
             updated_by = $6
         WHERE id = $1`,
        [existing.id, account.bankName, account.accountNumber, account.accountName, order, userId]
      )
    } else {
      await client.query(
        `INSERT INTO keu_masjid.${bankTable} (
           nama_bank, no_rekening, atas_nama, urutan, aktif, created_by
         )
         VALUES ($1, $2, $3, $4, true, $5)`,
        [account.bankName, account.accountNumber, account.accountName, order, userId]
      )
    }
  }

  if (existingRows.length > normalized.length) {
    const idsToDelete = existingRows.slice(normalized.length).map((row) => row.id)
    await client.query(
      `DELETE FROM keu_masjid.${bankTable}
       WHERE id = ANY($1::bigint[])`,
      [idsToDelete]
    )
  }

  const { rows: savedRows } = await client.query(
    `SELECT id, nama_bank, no_rekening, atas_nama, urutan
     FROM keu_masjid.${bankTable}
     WHERE aktif = true
     ORDER BY urutan ASC, id ASC
     LIMIT $1`,
    [MAX_DONATION_BANKS]
  )
  return savedRows.map(mapBankRow)
}
