export default function SchedulingLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-28 rounded bg-muted" />
      <div className="h-10 rounded-lg bg-muted" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
