export default function EmployeesLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-28 rounded bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
