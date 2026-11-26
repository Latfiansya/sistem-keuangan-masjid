const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'google.co.id',
  'www.google.co.id',
])

const MAPS_SUBDOMAINS = new Set(['maps.google.com', 'maps.google.co.id'])

export function isValidGoogleMapsUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) {
      return false
    }
    const googleMaps =
      GOOGLE_MAPS_HOSTS.has(url.hostname) &&
      (url.pathname === '/maps' || url.pathname.startsWith('/maps/'))
    const mapsDomain = MAPS_SUBDOMAINS.has(url.hostname)
    const shortLink =
      (url.hostname === 'maps.app.goo.gl' && url.pathname.length > 1) ||
      (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/') && url.pathname.length > 6)
    return googleMaps || mapsDomain || shortLink
  } catch {
    return false
  }
}

export function isValidGoogleMapsEmbedUrl(rawUrl) {
  if (!isValidGoogleMapsUrl(rawUrl)) return false
  try {
    const url = new URL(rawUrl.trim())
    if (!GOOGLE_MAPS_HOSTS.has(url.hostname) && !MAPS_SUBDOMAINS.has(url.hostname)) {
      return false
    }
    return url.pathname.startsWith('/maps/embed') || url.searchParams.get('output') === 'embed'
  } catch {
    return false
  }
}

function parseCoordinatePair(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    latitude === '' ||
    longitude === null ||
    longitude === undefined ||
    longitude === ''
  ) {
    return null
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return `${lat},${lng}`
}

export function buildMapsUrlFromCoordinates(latitude, longitude) {
  const coords = parseCoordinatePair(latitude, longitude)
  if (!coords) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`
}

function extractQueryFromGoogleMapsUrl(rawUrl) {
  if (!isValidGoogleMapsUrl(rawUrl)) return ''
  try {
    const url = new URL(rawUrl.trim())
    const paramQuery =
      url.searchParams.get('q') ||
      url.searchParams.get('query') ||
      url.searchParams.get('destination') ||
      url.searchParams.get('ll')
    if (paramQuery?.trim()) return paramQuery.trim()

    const coordMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(url.pathname)
    if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`

    const placeMatch = /\/maps\/place\/([^/]+)/.exec(url.pathname)
    if (placeMatch?.[1]) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
    }
    return ''
  } catch {
    return ''
  }
}

// Menghasilkan URL embed Google Maps resmi untuk <iframe> halaman Kontak publik
// tanpa membocorkan data jika lokasi belum terverifikasi.
export function resolveGoogleMapsEmbedUrl({ url = '', latitude = null, longitude = null, address = '', label = '' } = {}) {
  const trimmedUrl = typeof url === 'string' ? url.trim() : ''
  if (trimmedUrl && isValidGoogleMapsEmbedUrl(trimmedUrl)) {
    return trimmedUrl
  }

  const queryFromUrl = extractQueryFromGoogleMapsUrl(trimmedUrl)
  const coordPair = parseCoordinatePair(latitude, longitude)
  const fallbackPlace = [label, address].map((item) => String(item ?? '').trim()).filter(Boolean).join(', ')
  const embedQuery = queryFromUrl || coordPair || (isValidGoogleMapsUrl(trimmedUrl) ? fallbackPlace : '')

  if (!embedQuery) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
}
