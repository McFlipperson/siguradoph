export default function VisitsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-24 rounded bg-muted" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
