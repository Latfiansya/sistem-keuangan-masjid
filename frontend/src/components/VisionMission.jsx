export default function VisionMission({ vision, missions }) {
  return (
    <section className="vision-section page-container" aria-labelledby="vision-heading">
      <span className="section-label">VISI &amp; MISI</span>
      <h2 id="vision-heading">"{vision}"</h2>
      <ol className="mission-list">
        {missions.map((mission) => <li key={mission}>{mission}</li>)}
      </ol>
    </section>
  )
}
