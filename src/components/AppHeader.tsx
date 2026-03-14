export function AppHeader() {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <h1 className="text-xl tracking-tight">
        <span className="text-primary">The</span>
        <span className="text-foreground"> Path Tracker</span>
      </h1>
      <p className="text-[11px] font-light text-muted-foreground" style={{ fontFamily: "'Merriweather Sans', sans-serif" }}>
        Powered by Healthy Insight
      </p>
    </div>
  );
}
