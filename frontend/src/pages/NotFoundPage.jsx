import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <Link to="/" className="underline">Kembali ke Beranda</Link>
    </>
  )
}
