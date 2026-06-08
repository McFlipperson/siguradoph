export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="h-40 rounded-xl bg-muted" />
      {/* List items */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
