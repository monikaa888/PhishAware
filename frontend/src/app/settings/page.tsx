'use client';

import { Bell, BriefcaseBusiness, CheckCircle2, Globe2, Lock, LogOut, Mail, Moon, Save, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import type { AuthUser, BusinessDashboard } from '@/lib/api';
import { getBusinessDashboard, getCurrentUser, updateCurrentUser } from '@/lib/api';
import { clearAuthSession, getAuthToken, getStoredUser, saveStoredUser } from '@/lib/auth';
import { applyPreferences, defaultPreferences, loadPreferences, savePreferences, type Preferences } from '@/lib/preferences';

const languages = ['English', 'Nepali', 'Hindi', 'Spanish', 'French'];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? 'bg-primary' : 'bg-white/15'}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function fieldClass() {
  return 'mt-2 w-full rounded-xl bg-black px-3 py-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-primary';
}

function isSessionError(error: unknown) {
  return error instanceof Error && /invalid or expired session|missing bearer token/i.test(error.message);
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [businessDashboard, setBusinessDashboard] = useState<BusinessDashboard | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  useEffect(() => {
    async function loadUser() {
      const storedUser = getStoredUser();
      const token = getAuthToken();
      setUser(storedUser);
      setDisplayName(storedUser?.displayName ?? '');
      setOrganization(storedUser?.organization ?? '');

      if (!token) {
        router.replace('/signin');
        return;
      }

      try {
        const freshUser = await getCurrentUser(token);
        saveStoredUser(freshUser);
        setUser(freshUser);
        setDisplayName(freshUser.displayName);
        setOrganization(freshUser.organization ?? '');
        if (freshUser.role === 'BUSINESS_ADMIN') {
          const business = await getBusinessDashboard(token);
          setBusinessDashboard(business);
          setOrganization(business.business.name);
        }
      } catch (err) {
        if (isSessionError(err)) {
          clearAuthSession();
          router.replace('/signin');
          return;
        }
        setError(err instanceof Error ? err.message : 'Could not load account details.');
      }
    }

    void loadUser();

    const loadedPreferences = loadPreferences();
    setPreferences(loadedPreferences);
    applyPreferences(loadedPreferences);
    setPreferencesLoaded(true);
    setNotificationPermission('Notification' in window ? window.Notification.permission : 'unsupported');
  }, [router]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    savePreferences(preferences);
  }, [preferences, preferencesLoaded]);

  function updatePreference<Key extends keyof Preferences>(key: Key, value: Preferences[Key]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setStatus(`${preferenceLabel(key)} updated.`);
    setError('');
  }

  function preferenceLabel(key: keyof Preferences) {
    if (key === 'emailNotifications') return 'Email notifications';
    if (key === 'pushNotifications') return 'Push notifications';
    if (key === 'darkMode') return 'Interface theme';
    return 'Language';
  }

  async function updatePushNotifications(enabled: boolean) {
    setError('');

    if (!enabled) {
      updatePreference('pushNotifications', false);
      return;
    }

    if (!('Notification' in window)) {
      setPreferences((current) => ({ ...current, pushNotifications: false }));
      setError('This browser does not support push notifications.');
      return;
    }

    const permission = window.Notification.permission === 'default' ? await window.Notification.requestPermission() : window.Notification.permission;
    setNotificationPermission(permission);

    if (permission !== 'granted') {
      setPreferences((current) => ({ ...current, pushNotifications: false }));
      setError('Push notifications were not enabled because browser permission was not granted.');
      return;
    }

    updatePreference('pushNotifications', true);
  }

  async function saveProfile() {
    const token = getAuthToken();
    if (!token) {
      router.replace('/signin');
      return;
    }

    setSavingProfile(true);
    setStatus('');
    setError('');

    try {
      const updatedUser = await updateCurrentUser(token, {
        displayName,
        organization,
      });
      saveStoredUser(updatedUser);
      setUser(updatedUser);
      setStatus('Account details updated.');
    } catch (err) {
      if (isSessionError(err)) {
        clearAuthSession();
        router.replace('/signin');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not update account details.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    const token = getAuthToken();
    if (!token) {
      router.replace('/signin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      setStatus('');
      return;
    }

    setSavingPassword(true);
    setStatus('');
    setError('');

    try {
      const updatedUser = await updateCurrentUser(token, {
        currentPassword,
        newPassword,
      });
      saveStoredUser(updatedUser);
      setUser(updatedUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Password changed successfully.');
    } catch (err) {
      if (isSessionError(err)) {
        clearAuthSession();
        router.replace('/signin');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function signOut() {
    clearAuthSession();
    router.replace('/signin');
  }

  const email = user?.email ?? 'No email available';
  const isBusinessAdmin = user?.role === 'BUSINESS_ADMIN';
  const business = businessDashboard?.business;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <section>
          <h1 className="text-2xl font-bold md:text-3xl">{isBusinessAdmin ? 'Business settings' : 'Settings'}</h1>
          <p className="mt-1 text-sm text-white/65">
            {isBusinessAdmin ? 'Manage company identity, private admin login, password, notifications, and interface preferences.' : 'Manage your account, password, notifications, and interface preferences.'}
          </p>
        </section>

        {status ? (
          <div className="flex items-center gap-2 rounded-xl bg-primary/15 p-3 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {status}
          </div>
        ) : null}

        {error ? <div className="rounded-xl bg-white/10 p-3 text-sm text-white">{error}</div> : null}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-white/5 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                {isBusinessAdmin ? <BriefcaseBusiness className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="font-bold">{isBusinessAdmin ? 'Business details' : 'Account details'}</h2>
                <p className="text-xs text-white/55">{isBusinessAdmin ? 'Business identity shown in the company dashboard.' : 'Edit your visible username and organization.'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55">{isBusinessAdmin ? 'Business admin name' : 'Username'}</span>
                <input className={fieldClass()} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={isBusinessAdmin ? 'Admin name' : 'Your name'} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55">{isBusinessAdmin ? 'Business name' : 'Organization'}</span>
                <input className={fieldClass()} value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={isBusinessAdmin ? 'Business name' : 'Optional'} />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {isBusinessAdmin ? (
                <div className="rounded-xl bg-black p-3">
                  <div className="flex items-center gap-3">
                    <Globe2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/45">Company domain</p>
                      <p className="mt-1 break-words text-sm font-semibold">{business?.domain ?? user?.businessDomain ?? '-'}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl bg-black p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/45">{isBusinessAdmin ? 'Private admin email' : 'Email address'}</p>
                  <p className="mt-1 text-sm font-semibold">{email}</p>
                </div>
              </div>
              </div>
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-black disabled:opacity-50" type="button" disabled={savingProfile || !displayName.trim()} onClick={saveProfile}>
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving...' : isBusinessAdmin ? 'Save business details' : 'Save account details'}
            </button>
          </div>

          <div className="rounded-xl bg-white/5 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Password</h2>
                <p className="text-xs text-white/55">Change your login password securely.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55">Current password</span>
                <input className={fieldClass()} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55">New password</span>
                <input className={fieldClass()} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/55">Confirm password</span>
                <input className={fieldClass()} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            </div>

            <button
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
              type="button"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              onClick={savePassword}
            >
              <Save className="h-4 w-4" />
              {savingPassword ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-5">
            <div className="mb-5 flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-bold">Notifications</h2>
                <p className="text-xs text-white/55">Control training updates and challenge reminders.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-black p-4">
                <div>
                  <p className="font-semibold">Email notifications</p>
                  <p className="text-xs text-white/55">{preferences.emailNotifications ? 'Enabled' : 'Disabled'} for challenge reminders and weekly reports</p>
                </div>
                <Toggle checked={preferences.emailNotifications} label="Email notifications" onChange={(checked) => updatePreference('emailNotifications', checked)} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black p-4">
                <div>
                  <p className="font-semibold">Push notifications</p>
                  <p className="text-xs text-white/55">
                    {preferences.pushNotifications ? 'Enabled' : 'Disabled'} for simulated alerts
                    {notificationPermission !== 'unsupported' ? ` - browser permission: ${notificationPermission}` : ' - unsupported in this browser'}
                  </p>
                </div>
                <Toggle checked={preferences.pushNotifications} label="Push notifications" onChange={(checked) => void updatePushNotifications(checked)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-5">
            <div className="mb-5 flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-bold">App preferences</h2>
                <p className="text-xs text-white/55">Edit language and interface behavior.</p>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/55">Language</span>
              <select className={fieldClass()} value={preferences.language} onChange={(event) => updatePreference('language', event.target.value)}>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-white/55">Active interface language: {preferences.language}</span>
            </label>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-black p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{preferences.darkMode ? 'Dark interface' : 'Light interface'}</p>
                  <p className="text-xs text-white/55">{preferences.darkMode ? 'Dashboard is using dark mode' : 'Dashboard is using light mode'}</p>
                </div>
              </div>
              <Toggle checked={preferences.darkMode} label="Dark interface" onChange={(checked) => updatePreference('darkMode', checked)} />
            </div>
          </div>
        </section>

        <button className="mx-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary" type="button" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
