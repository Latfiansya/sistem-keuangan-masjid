import bcrypt from 'bcryptjs'
import { buildReceiptNumber, getReceiptNumberPrefix, nextReceiptSequence } from '../../src/utils/receiptNumber.js'
import { createHttpError } from '../../src/utils/httpError.js'

const TEST_PASSWORD_HASH = bcrypt.hashSync('password123', 4)

// Repository tiruan (hanya untuk pengujian otomatis di backend/test, bukan bagian runtime src/).
export function createTestRepositories() {
  let publicContent = {
    name: 'Masjid Al-Hidayah',
    address: 'Sorolaten, Sidokarto, Godean, Sleman',
    copyrightYear: 2026,
    heroDescription: 'Masjid Al-Hidayah Sorolaten sebagai pusat ibadah dan kebersamaan jamaah.',
    photoPath: null,
    publicReportEnabled: true,
    statistics: [
      { id: 'founded', label: 'Tahun Berdiri', value: '1980', icon: 'calendar' },
      { id: 'area', label: 'Luas Bangunan', value: '265 m²', amount: 265, unit: 'm²', profileLabel: 'Luas Bangunan', description: 'Luas keseluruhan area masjid', icon: 'expand' },
      { id: 'capacity', label: 'Kapasitas', value: '290 Jamaah', amount: 290, unit: 'Jamaah', profileLabel: 'Kapasitas Jamaah', description: 'Daya tampung jamaah utama', icon: 'users' },
    ],
    vision: 'Menjadikan Masjid Al-Hidayah sebagai pusat ibadah yang makmur dan transparan.',
    missions: ['Menyelenggarakan ibadah rutin', 'Mengelola kajian keislaman', 'Menjaga transparansi dana umat', 'Memakmurkan kegiatan sosial'],
    programs: [
      { title: 'Kajian Rutin', description: 'Kajian pekanan bersama warga.', icon: 'heart' },
      { title: 'Layanan Kesehatan', description: 'Kegiatan sosial jamaah.', icon: 'health' },
      { title: 'Pemberdayaan Ekonomi', description: 'Dukungan UMKM sekitar.', icon: 'economy' },
    ],
    profile: {
      foundedYear: 1980,
      location: 'Sorolaten, Sidokarto, Godean, Sleman',
      introduction: 'Sejarah dan struktur kepengurusan masjid.',
      timeline: [
        { year: 1980, era: 'Pendirian', mosqueName: 'Mushola Al-Hidayah', title: 'Awal Pendirian', description: 'Didirikan oleh warga.' },
        { year: 2000, era: 'Pengembangan', mosqueName: 'Masjid Al-Hidayah', title: 'Pembangunan Masjid', description: 'Diperluas menjadi masjid.' },
      ],
      managementPeriod: '2023–2025',
      members: Array.from({ length: 7 }, (_, idx) => ({
        initials: `P${idx + 1}`,
        role: idx === 0 ? 'Ketua Takmir' : 'Pengurus',
        name: `Pengurus ${idx + 1}`,
      })),
      contactTitle: 'Hubungi Takmir',
      contactDescription: 'Informasi kontak resmi masjid.',
    },
    contact: {
      introduction: 'Informasi kontak resmi takmir masjid.',
      information: [
        { id: 'address', label: 'Alamat', verified: false, value: null },
        { id: 'phone', label: 'Telepon', verified: false, value: null, note: null },
        { id: 'hours', label: 'Jam Layanan', verified: false, value: null },
      ],
      location: { verified: false, url: null },
      donation: {
        qris: { verified: false, imageSrc: null },
        banks: [],
        bank: { verified: false, name: null, number: null, recipient: null },
        bank2: { verified: false, name: null, number: null, recipient: null },
      },
    },
  }

  let nextAgendaSeq = 100
  const agenda = {
    description: 'Jadwal kegiatan Masjid Al-Hidayah Sorolaten.',
    groups: [
      {
        id: 'weekly',
        title: 'Mingguan',
        subtitle: 'Setiap Pekan',
        items: Array.from({ length: 5 }, (_, i) => ({ id: `w-${i + 1}`, name: `Kajian Pekanan ${i + 1}`, frequency: 'weekly', schedule: 'Setiap pekan', description: '', order: i + 1, active: true })),
      },
      {
        id: 'monthly',
        title: 'Bulanan',
        subtitle: 'Setiap Bulan',
        items: Array.from({ length: 2 }, (_, i) => ({ id: `m-${i + 1}`, name: `Pengajian Bulanan ${i + 1}`, frequency: 'monthly', schedule: 'Setiap bulan', description: '', order: i + 1, active: true })),
      },
      {
        id: 'yearly',
        title: 'Tahunan / PHBI',
        subtitle: 'Tahunan',
        items: Array.from({ length: 5 }, (_, i) => ({ id: `y-${i + 1}`, name: `PHBI ${i + 1}`, frequency: 'yearly', schedule: 'Bulan Ramadhan', description: '', order: i + 1, active: true })),
      },
    ],
  }

  const reportCategories = [
    { dbId: 1, id: 'mosque', label: 'Kas Masjid', color: 'green', openingBalance: 15256700 },
    { dbId: 2, id: 'maintenance', label: 'Kotak Pembangunan & Pemeliharaan', color: 'orange', openingBalance: 1335000 },
    { dbId: 3, id: 'friday', label: "Kotak Jum'at Berkah", color: 'blue', openingBalance: 1999000 },
  ]

  const reportTransactions = [
    ...Array.from({ length: 17 }, (_, i) => ({
      id: `pub-inc-${i + 1}`,
      date: i === 0 ? '2026-04-03' : i === 16 ? '2026-04-30' : '2026-04-17',
      type: 'income',
      description: `Pemasukan uji ${i + 1}`,
      categoryId: i < 14 ? 'mosque' : i === 14 ? 'maintenance' : 'friday',
      amount:
        i < 13
          ? 600000
          : i === 13
            ? 857500
            : i === 14
              ? 685000
              : i === 15
                ? 1000000
                : 323000,
    })),
    ...Array.from({ length: 33 }, (_, i) => ({
      id: `pub-exp-${i + 1}`,
      date: i === 0 ? '2026-04-03' : '2026-04-16',
      type: 'expense',
      description: `Pengeluaran uji ${i + 1}`,
      categoryId: i < 30 ? 'mosque' : i === 30 ? 'maintenance' : 'friday',
      amount:
        i < 29
          ? 190000
          : i === 29
            ? 281500
            : i === 30
              ? 300000
              : i === 31
                ? 2000000
                : 680000,
    })),
  ]

  let adminCategories = [
    { dbId: 1, id: 'mosque', label: 'Kas Masjid', color: 'green', openingBalance: 13463200, income: 682500, expense: 1427500, closingBalance: 12718200 },
    { dbId: 2, id: 'friday', label: "Kotak Jum'at Berkah", color: 'blue', openingBalance: 3251000, income: 403000, expense: 0, closingBalance: 3654000 },
    { dbId: 3, id: 'maintenance', label: 'Kotak Pembangunan & Pemeliharaan', color: 'orange', openingBalance: 150000, income: 706000, expense: 0, closingBalance: 856000 },
  ]

  let nextTrxSeq = 1000
  let adminTransactions = [
    { id: '1', date: '2026-10-15', categoryId: 'mosque', type: 'income', description: 'Infaq Pengajian Malam Kamis', amount: 117000 },
    { id: '2', date: '2026-10-15', categoryId: 'mosque', type: 'expense', description: 'Snack Pengajian Malam Kamis', amount: 110000 },
    { id: '3', date: '2026-10-15', categoryId: 'mosque', type: 'expense', description: 'Donasi Paud', amount: 100000 },
    { id: '4', date: '2026-10-14', categoryId: 'mosque', type: 'expense', description: 'Pembelian Pewangi Karpet & Pembersih Lantai', amount: 118500 },
    { id: '5', date: '2026-10-09', categoryId: 'maintenance', type: 'income', description: 'Kotak Pembangunan & Pemeliharaan', amount: 403000 },
  ]

  let adminProfile = {
    name: 'Masjid Al-Hidayah',
    tagline: 'Pusat ibadah dan kegiatan umat.',
    description: 'Sejarah dan struktur kepengurusan masjid.',
    location: 'Sorolaten',
    foundedYear: 1980,
    buildingArea: 265,
    buildingAreaNote: '',
    capacity: 290,
    capacityNote: '',
    vision: 'Menjadi pusat ibadah dan pembinaan masyarakat.',
    managementPeriod: '2023–2026',
    address: 'Sorolaten, Sidokarto, Godean, Sleman',
    contact: '',
    photoPath: null,
  }

  let websiteSettings = {
    whatsapp: '',
    email: '',
    address: 'Sorolaten, Sidokarto, Godean, Sleman',
    mapsUrl: '',
    phone: '',
    phoneNote: '',
    hours: '',
    mapLabel: '',
    publicReportEnabled: true,
  }

  const storedFiles = new Map()
  const receipts = []

  let nextProfileContentSeq = 100
  const profileContent = {
    missions: [
      { id: '1', text: 'Menyelenggarakan ibadah rutin', order: 1 },
      { id: '2', text: 'Menjaga transparansi dana umat', order: 2 },
    ],
    programs: [{ id: '1', title: 'Kajian Rutin', description: 'Kajian pekanan bersama warga.', order: 1, active: true }],
    history: [{ id: '1', year: 1980, era: 'Era Perintisan', placeName: 'Mushola Al Qodar', title: 'Awal Mula', description: 'Didirikan warga.', order: 1 }],
    officers: [{ id: '1', name: 'Pengurus Satu', role: 'KETUA', note: '', order: 1, active: true }],
  }

  let donationSettings = {
    qrisFile: null,
    qrisEnabled: false,
    bankAccounts: [],
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankName2: '',
    accountNumber2: '',
    accountName2: '',
    bankEnabled: false,
    whatsappNumber: '',
    whatsappEnabled: false,
    messageTemplate: 'Template konfirmasi donasi uji',
    donationNote: '',
  }

  let nextTransferSeq = 2
  let transfers = [
    { id: '1', date: '2026-02-01', fromCategoryId: 'mosque', fromCategoryLabel: 'Kas Masjid', toCategoryId: 'maintenance', toCategoryLabel: 'Kotak Pembangunan & Pemeliharaan', amount: 753000, note: 'Dana tambahan internal', createdBy: 'Migrasi Excel' },
  ]
  const transferBalances = { mosque: 12868200, maintenance: 3654000, friday: 856000 }

  let nextAccountSeq = 10
  let accounts = [
    { id: '1', initials: 'SA', name: 'Super Admin', email: 'superadmin@masjid.id', role: 'Super Admin', createdDate: '2026-04-16', active: true },
    { id: '2', initials: 'AF', name: 'Ahmad Fauzi', email: 'ahmad@masjid.id', role: 'Admin', createdDate: '2026-01-01', active: true },
    { id: '3', initials: 'SR', name: 'Siti Rahmawati', email: 'siti@masjid.id', role: 'Admin', createdDate: '2026-05-15', active: true },
    { id: '4', initials: 'BS', name: 'Budi Santoso', email: 'budi@masjid.id', role: 'Admin', createdDate: '2026-04-20', active: false },
  ]
  const accountPasswordHashes = new Map(accounts.map((acc) => [acc.id, TEST_PASSWORD_HASH]))
  const reportAccessState = {
    codeHash: '',
    active: true,
    publicReportEnabled: true,
    changedDate: '2026-06-10',
    changedTime: '09:00',
    changedBy: 'Super Admin',
  }

  const activityLogs = [
    { id: '1', date: '2026-06-14', time: '09:35', admin: 'Ahmad', type: 'edit', typeLabel: 'Edit data', module: 'Keuangan', title: 'mengubah transaksi', details: [] },
    { id: '2', date: '2026-06-13', time: '11:00', admin: 'Siti', type: 'add', typeLabel: 'Tambah data', module: 'Keuangan', title: 'menambah transaksi', details: [] },
  ]

  return {
    publicContentRepository: {
      async findPublicContent() {
        return structuredClone(publicContent)
      },
    },
    agendaRepository: {
      async findPublicAgenda() {
        return structuredClone(agenda)
      },
    },
    financeReportRepository: {
      async findFinanceReportMetadata() {
        return {
          name: 'Masjid Al-Hidayah',
          coverage: { startDate: '2026-04-01', endDate: '2026-04-30' },
          defaultRange: { startDate: '2026-04-01', endDate: '2026-04-30' },
          months: [
            { id: '2026-01', label: 'Januari 2026' },
            { id: '2026-02', label: 'Februari 2026' },
            { id: '2026-03', label: 'Maret 2026' },
            { id: '2026-04', label: 'April 2026' },
            { id: '2026-05', label: 'Mei 2026' },
          ],
          categories: structuredClone(reportCategories),
        }
      },
      async findFinanceReportForRange({ startDate, endDate }) {
        const meta = await this.findFinanceReportMetadata()
        const priorMutationsByCategory = new Map()
        for (const cat of reportCategories) {
          let net = 0
          for (const trx of reportTransactions) {
            if (trx.categoryId === cat.id && trx.date < startDate) {
              net += trx.type === 'income' ? trx.amount : -trx.amount
            }
          }
          priorMutationsByCategory.set(cat.dbId, { net })
        }
        return {
          ...meta,
          priorMutationsByCategory,
          transactions: structuredClone(
            reportTransactions.filter((item) => item.date >= startDate && item.date <= endDate)
          ),
        }
      },
      async findPublicReportEnabled() {
        return websiteSettings.publicReportEnabled !== false
      },
      async findReportAccessPasswordHash() {
        return reportAccessState.codeHash
      },
    },
    adminFinanceRepository: {
      getAllowedColors() {
        return ['red', 'orange', 'gold', 'yellow', 'lime', 'green', 'blue', 'teal', 'purple']
      },
      async getDashboardData() {
        const totals = adminCategories.reduce(
          (sum, cat) => ({
            openingBalance: sum.openingBalance + cat.openingBalance,
            income: sum.income + cat.income,
            expense: sum.expense + cat.expense,
            closingBalance: sum.closingBalance + cat.closingBalance,
          }),
          { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }
        )
        return {
          updatedDate: '2026-10-20',
          account: { name: 'Super Admin', email: 'superadmin@masjid.id', initials: 'SA' },
          categories: adminCategories.map(({ dbId: _dbId, ...rest }) => structuredClone(rest)),
          totals,
          recentTransactions: structuredClone(adminTransactions.slice(0, 5)),
        }
      },
      async findCategories() {
        return structuredClone(adminCategories)
      },
      async findCategoryById(id) {
        const found = adminCategories.find((item) => item.id === id)
        return found ? structuredClone(found) : null
      },
      async insertCategory({ label, color = 'teal' }) {
        const created = {
          dbId: adminCategories.length + 10,
          id: `cat-${adminCategories.length + 1}`,
          label,
          color,
          openingBalance: 0,
          income: 0,
          expense: 0,
          closingBalance: 0,
        }
        adminCategories = [...adminCategories, created]
        return structuredClone(created)
      },
      async updateCategoryById(id, { label, color }) {
        let updated = null
        adminCategories = adminCategories.map((item) => {
          if (item.id !== id) return item
          updated = { ...item, label, ...(color ? { color } : {}) }
          return updated
        })
        return updated ? structuredClone(updated) : null
      },
      async hasCategoryUsage(id) {
        return adminTransactions.some((trx) => trx.categoryId === id)
      },
      async deleteCategoryById(id) {
        const exists = adminCategories.some((item) => item.id === id)
        if (!exists) return false
        adminCategories = adminCategories.filter((item) => item.id !== id)
        return true
      },
      async getReportMetadata() {
        return {
          updatedDate: '2026-10-20',
          account: { name: 'Super Admin', email: 'superadmin@masjid.id', initials: 'SA' },
          categories: structuredClone(adminCategories),
          coverage: { startDate: '2026-01-01', endDate: '2026-10-20' },
          historicalTransactionCount: adminTransactions.length,
        }
      },
      async queryFinanceReport({ startDate, endDate, categoryApiId, type, query, page, pageSize }) {
        const meta = await this.getReportMetadata()
        const term = (query || '').toLowerCase()
        const filtered = adminTransactions.filter(
          (item) =>
            item.date >= startDate &&
            item.date <= endDate &&
            (!categoryApiId || item.categoryId === categoryApiId) &&
            (!type || item.type === type) &&
            (!term || item.description.toLowerCase().includes(term))
        )
        const summary = filtered.reduce(
          (sum, item) => ({
            count: sum.count + 1,
            income: sum.income + (item.type === 'income' ? item.amount : 0),
            expense: sum.expense + (item.type === 'expense' ? item.amount : 0),
          }),
          { count: 0, income: 0, expense: 0 }
        )
        let rows = filtered
        let pagination = null
        if (page !== undefined || pageSize !== undefined) {
          const isAll = String(pageSize).toLowerCase() === 'all'
          const size = isAll ? Math.max(filtered.length, 1) : Number(pageSize)
          const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / size))
          const currentPage = Math.min(page, totalPages)
          rows = isAll ? filtered : filtered.slice((currentPage - 1) * size, currentPage * size)
          pagination = {
            page: currentPage,
            pageSize: isAll ? 'all' : size,
            totalItems: filtered.length,
            totalPages,
          }
        }
        return {
          ...meta,
          transactions: structuredClone(rows),
          summary,
          monthlyRecap: [{ month: '2026-10', categories: [], totals: { openingBalance: 16864200, income: 1791500, expense: 1427500, closingBalance: 17228200 } }],
          pagination,
        }
      },
      async findTransactionById(id) {
        const found = adminTransactions.find((item) => item.id === String(id))
        return found ? structuredClone(found) : null
      },
      async insertTransaction(payload) {
        const created = {
          id: String(++nextTrxSeq),
          date: payload.date,
          categoryId: payload.categoryId,
          type: payload.type,
          description: payload.description,
          amount: payload.amount,
          personName: payload.personName ?? '',
          notes: payload.notes ?? '',
          showDonorNamePublic: payload.showDonorNamePublic === true,
        }
        adminTransactions = [created, ...adminTransactions]
        return structuredClone(created)
      },
      async updateTransactionById(id, changes) {
        let updated = null
        adminTransactions = adminTransactions.map((item) => {
          if (item.id !== String(id)) return item
          updated = { ...item, ...changes }
          return updated
        })
        return updated ? structuredClone(updated) : null
      },
      async deleteTransactionById(id) {
        const exists = adminTransactions.some((item) => item.id === String(id))
        if (!exists) return false
        adminTransactions = adminTransactions.filter((item) => item.id !== String(id))
        return true
      },
    },
    adminSettingsRepository: {
      async getProfile() {
        return structuredClone(adminProfile)
      },
      async saveProfile(nextProfile) {
        adminProfile = structuredClone(nextProfile)
        return structuredClone(adminProfile)
      },
      async getAgenda() {
        return structuredClone(agenda)
      },
      async findAgendaById(id) {
        for (const group of agenda.groups) {
          const item = group.items.find((entry) => entry.id === String(id))
          if (item) return structuredClone(item)
        }
        return null
      },
      async insertAgenda(input) {
        const nextItem = {
          id: String(nextAgendaSeq++),
          name: input.name,
          frequency: input.groupId,
          schedule: input.schedule,
          description: input.description || '',
          order: input.order,
          active: input.active,
        }
        const targetGroup = agenda.groups.find((group) => group.id === input.groupId)
        targetGroup.items.push(nextItem)
        return structuredClone(nextItem)
      },
      async updateAgendaById(id, input) {
        let removed = false
        for (const group of agenda.groups) {
          const index = group.items.findIndex((entry) => entry.id === String(id))
          if (index !== -1) {
            group.items.splice(index, 1)
            removed = true
            break
          }
        }
        if (!removed) return null
        const updatedItem = {
          id: String(id),
          name: input.name,
          frequency: input.groupId,
          schedule: input.schedule,
          description: input.description || '',
          order: input.order,
          active: input.active,
        }
        const targetGroup = agenda.groups.find((group) => group.id === input.groupId)
        targetGroup.items.push(updatedItem)
        return structuredClone(updatedItem)
      },
      async deleteAgendaById(id) {
        for (const group of agenda.groups) {
          const before = group.items.length
          group.items = group.items.filter((entry) => entry.id !== String(id))
          if (group.items.length !== before) return true
        }
        return false
      },
      async getDonationSettings() {
        return structuredClone(donationSettings)
      },
      async saveDonationSettings(next) {
        donationSettings = structuredClone(next)
        return structuredClone(donationSettings)
      },
      async getWebsiteSettings() {
        return structuredClone(websiteSettings)
      },
      async saveWebsiteSettings(next) {
        websiteSettings = structuredClone(next)
        return structuredClone(websiteSettings)
      },
    },
    // Meniru pencatatan pemasukan + kwitansi dalam satu transaksi, dengan penomoran urut resmi (1, 2, 3, ...).
    receiptRepository: {
      async findAll() {
        return structuredClone([...receipts].reverse())
      },
      async createWithIncome({ categoryId, payer, purpose, method, amount, date }) {
        const labels = { mosque: 'Kas Masjid', maintenance: 'Kotak Pembangunan & Pemeliharaan', friday: "Kotak Jum'at Berkah" }
        if (!labels[categoryId]) throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana tidak ditemukan atau tidak aktif.')
        const prefix = getReceiptNumberPrefix(date)
        const number = buildReceiptNumber(date, nextReceiptSequence(receipts.map((item) => item.number), prefix))
        const id = String(receipts.length + 1)
        const created = { id, number, payer, purpose, method, amount, date, status: 'Aktif', cancelledAt: null, transactionId: String(900 + receipts.length), categoryId, categoryLabel: labels[categoryId], createdBy: 'Super Admin', createdAt: `${date}T09:00:00` }
        receipts.push(created)
        return structuredClone(created)
      },
      async updateWithIncome(id, { categoryId, payer, purpose, method, amount, date }) {
        const labels = { mosque: 'Kas Masjid', maintenance: 'Kotak Pembangunan & Pemeliharaan', friday: "Kotak Jum'at Berkah" }
        const target = receipts.find((item) => item.id === String(id))
        if (!target) return null
        if (target.status !== 'Aktif') throw createHttpError(409, 'CONFLICT', 'Kwitansi sudah dibatalkan sehingga tidak dapat diubah.')
        if (!labels[categoryId]) throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana tidak ditemukan atau tidak aktif.')
        Object.assign(target, { payer, purpose, method, amount, date, categoryId, categoryLabel: labels[categoryId] })
        return structuredClone(target)
      },
      // Kwitansi tetap tersimpan (berstatus Dibatalkan) sehingga nomornya tidak dipakai ulang.
      async cancelById(id, { withTransaction = false } = {}) {
        const target = receipts.find((item) => item.id === String(id))
        if (!target) return null
        if (target.status !== 'Aktif') throw createHttpError(409, 'CONFLICT', 'Kwitansi sudah dibatalkan sehingga tidak dapat diubah.')
        // Meniru trigger saldo: pemasukan bertanda "saldo-terpakai" tidak boleh dihapus.
        if (withTransaction && target.purpose === 'saldo-terpakai') {
          throw createHttpError(400, 'BAD_REQUEST', 'Saldo kategori dana "Kas Masjid" tidak mencukupi.')
        }
        const deletedTransactionId = withTransaction ? target.transactionId : null
        Object.assign(target, { status: 'Dibatalkan', cancelledAt: `${target.date}T10:00:00` }, withTransaction ? { transactionId: null, categoryId: null, categoryLabel: '' } : {})
        return { receipt: structuredClone(target), deletedTransactionId }
      },
    },
    // Meniru kolom *_path/*_isi/*_mime: satu gambar terkini per target.
    fileRepository: {
      async findByTargetAndHash(target, sha256) {
        const file = storedFiles.get(target)
        return file && file.sha256 === sha256 ? { ...file, content: Buffer.from(file.content) } : null
      },
      async saveForTarget(target, { mimeType, content, sha256 }) {
        storedFiles.set(target, { mimeType, size: content.length, sha256, content: Buffer.from(content) })
        return { path: `/api/public/files/${target}/${sha256}`, mimeType, size: content.length }
      },
      async removeForTarget(target) {
        storedFiles.delete(target)
        return { path: null }
      },
    },
    profileContentRepository: {
      async findAll() {
        return structuredClone(profileContent)
      },
      async insert(section, values) {
        const created = {
          id: String(nextProfileContentSeq++),
          ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ?? ''])),
        }
        profileContent[section].push(created)
        return structuredClone(created)
      },
      async updateById(section, id, values) {
        const target = profileContent[section].find((item) => item.id === String(id))
        if (!target) return null
        Object.assign(target, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ?? ''])))
        return structuredClone(target)
      },
      async deleteById(section, id) {
        const before = profileContent[section].length
        profileContent[section] = profileContent[section].filter((item) => item.id !== String(id))
        return profileContent[section].length < before
      },
    },
    transferRepository: {
      async findAll() {
        return structuredClone([...transfers].sort((x, y) => y.date.localeCompare(x.date) || Number(y.id) - Number(x.id)))
      },
      async insert({ fromCategoryId, toCategoryId, amount, date, note }) {
        const labels = { mosque: 'Kas Masjid', maintenance: 'Kotak Pembangunan & Pemeliharaan', friday: "Kotak Jum'at Berkah" }
        if (!labels[fromCategoryId] || !labels[toCategoryId]) {
          throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana asal atau tujuan tidak ditemukan atau tidak aktif.')
        }
        // Meniru trigger fn_cek_saldo_tidak_negatif di database.
        if (amount > transferBalances[fromCategoryId]) {
          throw createHttpError(400, 'BAD_REQUEST', `Saldo kategori dana "${labels[fromCategoryId]}" tidak mencukupi.`)
        }
        transferBalances[fromCategoryId] -= amount
        transferBalances[toCategoryId] += amount
        const created = {
          id: String(nextTransferSeq++), date, fromCategoryId, fromCategoryLabel: labels[fromCategoryId],
          toCategoryId, toCategoryLabel: labels[toCategoryId], amount, note, createdBy: 'Super Admin',
        }
        transfers.push(created)
        return structuredClone(created)
      },
      async deleteById(id) {
        const target = transfers.find((item) => item.id === String(id))
        if (!target) return false
        transferBalances[target.fromCategoryId] += target.amount
        transferBalances[target.toCategoryId] -= target.amount
        transfers = transfers.filter((item) => item.id !== String(id))
        return true
      },
    },
    adminManagementRepository: {
      async findUserForLoginByEmail(email) {
        const found = accounts.find((item) => item.email.toLowerCase() === String(email).toLowerCase())
        if (!found) return null
        return {
          id: Number(found.id),
          nama: found.name,
          email: found.email,
          password: accountPasswordHashes.get(found.id) ?? TEST_PASSWORD_HASH,
          role: found.role,
          status: found.active ? 'Aktif' : 'Nonaktif',
        }
      },
      async findAccounts() {
        return structuredClone(accounts)
      },
      async findAccountById(id) {
        const found = accounts.find((item) => item.id === String(id))
        return found ? structuredClone(found) : null
      },
      async insertAccount({ name, email, passwordHash, role, active }) {
        const id = String(nextAccountSeq++)
        const parts = name.trim().split(/\s+/).filter(Boolean)
        const initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        const created = {
          id,
          initials,
          name,
          email,
          role,
          createdDate: '2026-11-19',
          active,
        }
        accounts.push(created)
        accountPasswordHashes.set(id, passwordHash)
        return structuredClone(created)
      },
      async updateAccountById(id, { name, email, passwordHash, role, active }) {
        const target = accounts.find((item) => item.id === String(id))
        if (!target) return null
        const parts = name.trim().split(/\s+/).filter(Boolean)
        target.initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        target.name = name
        target.email = email
        target.role = role
        target.active = active
        if (passwordHash) accountPasswordHashes.set(target.id, passwordHash)
        return structuredClone(target)
      },
      async updateAccountStatusById(id, active) {
        const target = accounts.find((item) => item.id === String(id))
        if (!target) return null
        target.active = active
        return structuredClone(target)
      },
      async deleteAccountById(id) {
        const exists = accounts.some((item) => item.id === String(id))
        if (!exists) return false
        accounts = accounts.filter((item) => item.id !== String(id))
        accountPasswordHashes.delete(String(id))
        return true
      },
      async findReportAccessStatus() {
        return {
          active: reportAccessState.active,
          publicReportEnabled: reportAccessState.publicReportEnabled,
          changedDate: reportAccessState.changedDate,
          changedTime: reportAccessState.changedTime,
          changedBy: reportAccessState.changedBy,
        }
      },
      async saveReportAccessCode({ codeHash, publicReportEnabled }, auditUserId = null) {
        reportAccessState.codeHash = codeHash
        reportAccessState.active = true
        if (typeof publicReportEnabled === 'boolean') {
          reportAccessState.publicReportEnabled = publicReportEnabled
        }
        const actor = accounts.find((item) => item.id === String(auditUserId))
        if (actor) reportAccessState.changedBy = actor.name
        return {
          active: reportAccessState.active,
          publicReportEnabled: reportAccessState.publicReportEnabled,
          changedDate: reportAccessState.changedDate,
          changedTime: reportAccessState.changedTime,
          changedBy: reportAccessState.changedBy,
        }
      },
      async findActivityLogs({ admin, type, date, moduleName, query } = {}) {
        const term = (query || '').toLowerCase()
        const filtered = activityLogs.filter(
          (item) =>
            (!admin || item.admin === admin) &&
            (!type || item.type === type) &&
            (!date || item.date === date) &&
            (!moduleName || item.module === moduleName) &&
            (!term || item.admin.toLowerCase().includes(term) || item.title.toLowerCase().includes(term))
        )
        return {
          activities: structuredClone(filtered),
          totalCount: activityLogs.length,
        }
      },
    },
  }
}
