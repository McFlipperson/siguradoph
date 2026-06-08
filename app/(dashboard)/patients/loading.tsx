export default function PatientsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-24 rounded bg-muted" />
      {/* Search bar */}
      <div className="h-12 rounded-lg bg-muted" />
      {/* Tabs */}
      <div className="flex gap-2">
        <div className="flex-1 h-12 rounded-lg bg-muted" />
        <div className="flex-1 h-12 rounded-lg bg-muted" />
      </div>
      {/* Patient cards */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
