import { Bell, ChevronRight, Globe2, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

function Toggle({ checked = true }: { checked?: boolean }) {
  return (
    <span className={`flex h-6 w-11 items-center rounded-full p-1 ${checked ? 'bg-primary' : 'bg-white/15'}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
    </span>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <section>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-white/65">Manage your account and preferences.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Account</h2>
          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-white/65">Email Address</p>
                <p className="mt-1 font-semibold">alex.morgan@cyber.io</p>
              </div>
              <button className="text-xs font-bold uppercase tracking-wider text-primary" type="button">Edit</button>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 pt-5">
              <div>
                <p className="text-xs uppercase text-white/65">Password</p>
                <p className="mt-1 font-semibold">••••••••••••</p>
              </div>
              <button className="text-xs font-bold uppercase tracking-wider text-primary" type="button">Change</button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Notifications</h2>
          <div className="rounded-xl bg-white/5 p-5">
            {[
              { title: 'Email Notifications', detail: 'Challenges and weekly reports', icon: Bell, checked: true },
              { title: 'Push Notifications', detail: 'Real-time threat alerts', icon: Bell, checked: true },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-white/65">{item.detail}</p>
                    </div>
                  </div>
                  <Toggle checked={item.checked} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Security</h2>
          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Two-factor Authentication</p>
                  <p className="text-xs text-white/65">Highly recommended</p>
                </div>
              </div>
              <button className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase text-black" type="button">Enable</button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">App Preferences</h2>
          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Language</p>
                  <p className="text-xs text-white/65">Interface display language</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-white/65">
                <span className="text-sm">English</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Dark Mode</p>
                  <p className="text-xs text-white/65">OLED-optimized interface</p>
                </div>
              </div>
              <Toggle checked />
            </div>
          </div>
        </section>

        <button className="mx-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary" type="button">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
