import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { getHealth } from '../services/healthService.js'

export default function HomePage() {
  const [status, setStatus] = useState('Memeriksa koneksi data…')

  useEffect(() => {
    const controller = new AbortController()

    getHealth({ signal: controller.signal })
      .then((health) => {
        if (!controller.signal.aborted) {
          setStatus(`Sumber data: ${health.source}. Status: ${health.status}.`)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setStatus(error.message)
      })

    return () => controller.abort()
  }, [])

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Beranda</h1>
      <p>Fondasi aplikasi siap dikembangkan. Tampilan menunggu frame Figma resmi.</p>
      <p role="status" className="mt-4 flex items-center gap-2 text-sm">
        <Info size={16} aria-hidden="true" />
        {status}
      </p>
    </>
  )
}
