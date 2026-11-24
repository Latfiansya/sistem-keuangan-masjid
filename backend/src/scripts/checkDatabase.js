import {
  checkDatabaseConnection,
  closeDefaultDatabasePool,
} from '../config/database.js'
import { loadEnv } from '../config/env.js'
import { defaultAdminFinanceRepository } from '../repositories/adminFinanceRepository.js'
import { defaultAdminManagementRepository } from '../repositories/adminManagementRepository.js'
import { defaultAdminSettingsRepository } from '../repositories/adminSettingsRepository.js'
import { defaultAgendaRepository } from '../repositories/agendaRepository.js'
import { defaultFinanceReportRepository } from '../repositories/financeReportRepository.js'
import { defaultPublicContentRepository } from '../repositories/publicContentRepository.js'

// Skrip baca-saja (read-only) untuk memastikan backend terhubung ke PostgreSQL dan dapat membaca seluruh tabel/view.
async function main() {
  const { db } = loadEnv()
  console.log(`Menguji koneksi PostgreSQL ke ${db.host}:${db.port}/${db.database} (schema target: ${db.schema})...`)

  try {
    const info = await checkDatabaseConnection()
    console.log(`[OK] Terhubung ke database "${info.database_name}" (current_schema: ${info.schema_name}).`)

    const [
      publicContent,
      agenda,
      reportMeta,
      aprilReport,
      dashboard,
      adminReport,
      adminProfile,
      donationSettings,
      websiteSettings,
      accounts,
      logs,
    ] = await Promise.all([
      defaultPublicContentRepository.findPublicContent(),
      defaultAgendaRepository.findPublicAgenda(),
      defaultFinanceReportRepository.findFinanceReportMetadata(),
      defaultFinanceReportRepository.findFinanceReportForRange({
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      }),
      defaultAdminFinanceRepository.getDashboardData(),
      defaultAdminFinanceRepository.queryFinanceReport({
        startDate: '2026-01-01',
        endDate: '2026-10-31',
      }),
      defaultAdminSettingsRepository.getProfile(),
      defaultAdminSettingsRepository.getDonationSettings(),
      defaultAdminSettingsRepository.getWebsiteSettings(),
      defaultAdminManagementRepository.findAccounts(),
      defaultAdminManagementRepository.findActivityLogs(),
    ])

    const totalAgendaItems = agenda.groups.reduce((sum, g) => sum + g.items.length, 0)

    console.log('\nRingkasan pembacaan data dari PostgreSQL (mode baca-saja):')
    console.log(`- Konten publik          : nama="${publicContent.name}"`)
    console.log(`- Agenda                 : ${totalAgendaItems} kegiatan aktif`)
    console.log(`- Cakupan laporan publik : ${reportMeta.coverage?.startDate ?? '-'} s/d ${reportMeta.coverage?.endDate ?? '-'} (${reportMeta.months.length} bulan)`)
    console.log(`- Transaksi April publik : ${aprilReport.transactions.length} baris`)
    console.log(`- Dashboard admin        : ${dashboard.categories.length} kategori, total saldo akhir Rp${dashboard.totals.closingBalance.toLocaleString('id-ID')}`)
    console.log(`- Laporan admin Jan-Okt  : ${adminReport.transactions.length} transaksi, ${adminReport.monthlyRecap.length} bulan rekap`)
    console.log(`- Profil admin           : ${adminProfile.name ? `"${adminProfile.name}"` : '(tabel m_profil_masjid masih kosong)'}`)
    console.log(`- Rekening donasi        : ${donationSettings.bankAccounts.length} rekening aktif`)
    console.log(`- Pengaturan website     : ${websiteSettings.email || websiteSettings.address ? 'terisi' : '(tabel m_pengaturan_website masih kosong)'}`)
    console.log(`- Akun pengurus          : ${accounts.length} akun`)
    console.log(`- Activity log           : ${logs.totalCount} baris`)
    console.log('\n[SUKSES] Seluruh pengujian koneksi & query baca PostgreSQL berhasil tanpa error!')
  } catch (error) {
    console.error(`\n[GAGAL] Tidak dapat terhubung atau membaca database: ${error.message}`)
    process.exitCode = 1
  } finally {
    await closeDefaultDatabasePool()
  }
}

await main()

