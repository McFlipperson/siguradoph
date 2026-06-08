export default function LoyaltyLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-32 rounded bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted" />
      ))}
    </div>
  )
}
