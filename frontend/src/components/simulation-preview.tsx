import { AtSign, CheckCircle2, FileText, Link2, Mail, ShieldAlert } from 'lucide-react';

const channels = [
  { label: 'Inbox', icon: Mail, active: true },
  { label: 'Links', icon: Link2, active: false },
  { label: 'Files', icon: FileText, active: false },
];

const preview = {
  sender: 'Student Aid Office',
  meta: 'aid-office@grant-verify.example',
  title: 'Scholarship confirmation required',
  body: 'Your award is pending. Confirm your school login before 5 PM to avoid losing eligibility.',
  clue: 'Lookalike domain and deadline pressure',
  action: 'Report email',
};

export function SimulationPreview() {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[2rem] border border-white/10 bg-black p-3 shadow-2xl shadow-secondary/40">
      <div className="rounded-[1.5rem] border border-outline-variant bg-surface-low p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Training Lab</span>
          </div>
          <ShieldAlert className="h-5 w-5 text-secondary" />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-background p-1">
          {channels.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${item.active ? 'bg-secondary text-black' : 'text-on-surface-variant'}`}>
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 text-black shadow-xl">
          <div className="mb-4 flex items-center gap-3 border-b border-black pb-3">
            <div className="rounded-full bg-white p-2 text-black">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{preview.sender}</p>
              <p className="truncate font-mono text-[11px] text-black">{preview.meta}</p>
            </div>
          </div>
          <h3 className="text-base font-bold">{preview.title}</h3>
          <p className="mt-3 text-sm leading-6 text-black">{preview.body}</p>
          <div className="mt-4 w-full rounded-lg bg-secondary px-4 py-3 text-center text-sm font-bold text-black">
            Continue
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/10 p-3">
          <div className="flex gap-2">
            <AtSign className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">Review clue</p>
              <p className="mt-1 text-sm text-on-surface-variant">{preview.clue}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-bold text-black shadow-[0_4px_0_rgba(37,99,235,0.45)]">
          <CheckCircle2 className="h-5 w-5" />
          {preview.action}
        </div>
      </div>
    </div>
  );
}
