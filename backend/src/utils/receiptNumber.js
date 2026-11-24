// Format resmi nomor kwitansi Masjid Al-Hidayah Sorolaten: angka urut polos (1, 2, 3, ...),
// dimulai baru dari awal tanpa prefix tanggal dan tidak pernah dipakai ulang walau kwitansi dibatalkan.
export function getReceiptNumberPrefix() {
  return ''
}

export function buildReceiptNumber(_isoDate, sequence) {
  return String(sequence)
}

// Urutan berikutnya dari nomor-nomor kwitansi yang memakai format angka urut resmi (atau prefix tertentu).
export function nextReceiptSequence(existingNumbers, prefix = '') {
  const used = existingNumbers
    .filter((number) => typeof number === 'string' && number.startsWith(prefix))
    .map((number) => number.slice(prefix.length))
    .filter((suffix) => /^\d+$/.test(suffix))
    .map((suffix) => Number(suffix))
    .filter((value) => Number.isSafeInteger(value) && value > 0)
  return (used.length ? Math.max(...used) : 0) + 1
}
