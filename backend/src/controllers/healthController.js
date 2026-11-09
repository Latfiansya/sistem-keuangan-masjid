// untuk pemeriksaan kesehatan layanan API.
export function getHealth(_req, res) {
  res.json({ success: true, data: { status: 'ok' } })
}

