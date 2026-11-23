// FORMAT SEMENTARA nomor kwitansi sampai format resmi diterima dari klien: KW/<tahun>/<bulan>/<urut 4 digit>,
// urutan diulang setiap bulan berdasarkan tanggal kwitansi. Ganti kedua fungsi ini bila format resmi sudah ada;
// kolom t_kwitansi.no_kwitansi maksimal 50 karakter dan wajib unik.
export function getReceiptNumberPrefix(isoDate) {
  const [year, month] = String(isoDate).split('-')
  return `KW/${year}/${month}/`
}

export function buildReceiptNumber(isoDate, sequence) {
  return `${getReceiptNumberPrefix(isoDate)}${String(sequence).padStart(4, '0')}`
}

// Urutan berikutnya dari nomor-nomor yang sudah memakai prefix yang sama.
export function nextReceiptSequence(existingNumbers, prefix) {
  const used = existingNumbers
    .filter((number) => typeof number === 'string' && number.startsWith(prefix))
    .map((number) => Number(number.slice(prefix.length)))
    .filter((value) => Number.isSafeInteger(value) && value > 0)
  return (used.length ? Math.max(...used) : 0) + 1
}
