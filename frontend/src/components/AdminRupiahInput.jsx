import { useLayoutEffect, useRef } from 'react'
import './AdminRupiahInput.css'

export default function AdminRupiahInput({ value, onChange, ...attributes }) {
  const input = useRef(null)
  const caret = useRef(null)
  const formatted = /^\d*$/.test(value) ? value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value

  useLayoutEffect(() => {
    if (caret.current === null) return
    const position = caret.current
    caret.current = null
    input.current.setSelectionRange(position, position)
  })

  function change(event) {
    const text = event.target.value.replace(/^Rp\s*/i, '')
    const inserted = event.nativeEvent.data || ''
    const invalidSeparator = inserted.includes('.') && !/^\d{1,3}(\.\d{3})+$/.test(text)
    const next = invalidSeparator ? text : text.replaceAll('.', '')
    const digitsBefore = event.target.value.slice(0, event.target.selectionStart).replace(/\D/g, '').length
    const display = /^\d*$/.test(next) ? next.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : next
    let position = 0
    let digits = 0
    while (position < display.length && digits < digitsBefore) {
      if (/\d/.test(display[position])) digits++
      position++
    }
    caret.current = /^\d*$/.test(next) ? position : event.target.selectionStart
    onChange({ target: { name: attributes.name, value: next } })
  }

  function paste(event) {
    const text = event.clipboardData.getData('text').trim().replace(/^Rp\s*/i, '')
    if (/^\d+$/.test(text) || /^\d{1,3}(\.\d{3})+$/.test(text)) return
    event.preventDefault()
    caret.current = text.length
    onChange({ target: { name: attributes.name, value: text } })
  }

  function handleKeyDown(event) {
    const element = event.currentTarget
    const position = element.selectionStart
    if (position !== element.selectionEnd) return
    // Hapus digit di sebelah pemisah agar Backspace/Delete tetap terasa alami.
    if (event.key === 'Backspace' && element.value[position - 1] === '.') element.setSelectionRange(position - 2, position)
    if (event.key === 'Delete' && element.value[position] === '.') element.setSelectionRange(position, position + 2)
  }

  return <div className="admin-rupiah-input"><span aria-hidden="true">Rp</span><input {...attributes} ref={input} type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={formatted} onChange={change} onPaste={paste} onKeyDown={handleKeyDown} /></div>
}
