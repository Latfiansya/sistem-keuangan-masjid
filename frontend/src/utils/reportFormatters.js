const numberFormat = new Intl.NumberFormat('id-ID')
const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatReportNumber = (amount) => numberFormat.format(amount)
export const formatRupiah = (amount) => `Rp ${formatReportNumber(amount)}`
export const formatReportDate = (date) => dateFormat.format(new Date(`${date}T00:00:00Z`))
export const formatReportMonth = (month) => monthFormat.format(new Date(`${month}-01T00:00:00Z`))
export const formatReportYear = ({ startDate, endDate }) => startDate.slice(0, 4) === endDate.slice(0, 4) ? startDate.slice(0, 4) : `${startDate.slice(0, 4)}–${endDate.slice(0, 4)}`

export function formatReportRange({ startDate, endDate }) {
  if (startDate === endDate) return formatReportDate(startDate)
  if (startDate.slice(0, 7) === endDate.slice(0, 7)) return `${Number(startDate.slice(8))}–${formatReportDate(endDate)}`
  return `${formatReportDate(startDate)} – ${formatReportDate(endDate)}`
}

export function formatReportPeriod({ startDate, endDate }) {
  const end = new Date(`${endDate}T00:00:00Z`)
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
  if (startDate === `${endDate.slice(0, 7)}-01` && end.getUTCDate() === lastDay) return formatReportMonth(endDate.slice(0, 7))
  return `${formatReportDate(startDate)} – ${formatReportDate(endDate)}`
}
