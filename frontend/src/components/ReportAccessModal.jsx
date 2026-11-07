import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import ReportAccessPanel from './ReportAccessPanel.jsx'

export default function ReportAccessModal({ onClose, onAccessGranted, returnFocusTo }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const overflow = document.body.style.overflow
    const padding = document.body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`
    document.body.style.overflow = 'hidden'
    const viewport = window.visualViewport
    function updateViewport() {
      dialog.style.setProperty('--dialog-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      dialog.style.setProperty('--dialog-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    viewport?.addEventListener('scroll', updateViewport)
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    return () => {
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      dialog.close()
      document.body.style.overflow = overflow
      document.body.style.paddingRight = padding
      if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true })
    }
  }, [returnFocusTo])

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
    const target = event.shiftKey ? items.at(-1) : items[0]
    const boundary = event.shiftKey ? items[0] : items.at(-1)
    if (document.activeElement === boundary) {
      event.preventDefault()
      target?.focus()
    }
  }

  return (
    <dialog ref={dialogRef} className="report-access-dialog" aria-modal="true" aria-labelledby="report-access-heading" aria-describedby="report-access-description" onKeyDown={handleKeyDown} onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className="report-access-controls"><button className="report-access-close" type="button" aria-label="Tutup akses laporan" onClick={onClose}><X aria-hidden="true" /></button></div>
      <ReportAccessPanel onAccessGranted={onAccessGranted} />
    </dialog>
  )
}
