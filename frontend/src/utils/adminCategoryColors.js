// Sembilan swatch mengikuti referensi; varian teks dibuat lebih gelap agar terbaca.
export const adminCategoryColors = [
  { id: 'red', label: 'Merah', swatch: '#d95d5d', text: '#b83345', soft: '#fff1f2', border: '#e89ba4' },
  { id: 'orange', label: 'Oranye', swatch: '#ec6e00', text: '#ce5700', soft: '#fff7ed', dot: '#e78200', badgeText: '#f16b00', badgeSoft: '#fff6e9', border: '#ff8b35' },
  { id: 'gold', label: 'Emas', swatch: '#d4af37', text: '#88670b', soft: '#fff8df', border: '#ddc56d' },
  { id: 'yellow', label: 'Kuning', swatch: '#e8c43c', text: '#856b00', soft: '#fffce0', border: '#e4d578' },
  { id: 'lime', label: 'Hijau limau', swatch: '#bed649', text: '#527414', soft: '#f7fce9', border: '#cfde8e' },
  { id: 'green', label: 'Hijau', swatch: '#016b00', text: '#008b43', soft: '#ecfdf5', dot: '#148447', badgeText: '#087c11', badgeSoft: '#fbfff0', border: '#59a946' },
  { id: 'blue', label: 'Biru', swatch: '#9ecbdb', text: '#2460de', soft: '#eff6ff', dot: '#0ea5e9', badgeText: '#0e749d', badgeSoft: '#f0fbff', border: '#54b8e6' },
  { id: 'teal', label: 'Toska', swatch: '#6399a5', text: '#336673', soft: '#eef8fa', border: '#9ec9d4' },
  { id: 'purple', label: 'Ungu', swatch: '#c771a1', text: '#974b7b', soft: '#fff0f8', border: '#d7a4c5' },
]

export function adminCategoryColorStyle(id) {
  const color = adminCategoryColors.find((item) => item.id === id) || adminCategoryColors.find((item) => item.id === 'green')
  return {
    '--category-color': color.text,
    '--category-soft': color.soft,
    '--category-dot': color.dot || color.swatch,
    '--category-badge-color': color.badgeText || color.text,
    '--category-badge-soft': color.badgeSoft || color.soft,
    '--category-badge-border': color.border,
  }
}
