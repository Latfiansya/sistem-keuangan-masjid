import { useOutletContext } from 'react-router'
import AgendaSummary from '../components/AgendaSummary.jsx'
import AgendaGroup from '../components/AgendaGroup.jsx'

export default function AgendaPage() {
  const { content, error } = useOutletContext()
  if (error) return <p role="alert" className="agenda-status">{error}</p>
  if (!content) return <p role="status" className="agenda-status">Memuat agenda kegiatan…</p>
  const { agenda } = content

  return (
    <>
      <AgendaSummary agenda={agenda} asPageHeader />
      <div className="agenda-groups">
        {agenda.groups.some((group) => group.items.length) ? agenda.groups.map((group) => (
          <AgendaGroup key={group.id} group={group} />
        )) : <p role="status" className="agenda-empty">Belum ada agenda kegiatan.</p>}
      </div>
    </>
  )
}
