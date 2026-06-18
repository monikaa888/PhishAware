type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-3xl font-bold text-on-surface">{value}</p>
      {detail ? <p className="mt-1 text-sm text-on-surface-variant">{detail}</p> : null}
    </div>
  );
}
