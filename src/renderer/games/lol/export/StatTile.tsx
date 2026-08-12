export function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded border border-neutral-800 bg-neutral-900/50 py-3 text-center">
      <span className="text-xl font-semibold">{value.toLocaleString('en-US')}</span>
      <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
    </div>
  );
}
