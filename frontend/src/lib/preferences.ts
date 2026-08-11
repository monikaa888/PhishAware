export const SETTINGS_KEY = 'phishaware_settings';

export type Preferences = {
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
};

export const defaultPreferences: Preferences = {
  language: 'English',
  emailNotifications: true,
  pushNotifications: true,
  darkMode: true,
};

const languageCodes: Record<string, string> = {
  English: 'en',
  Nepali: 'ne',
  Hindi: 'hi',
  Spanish: 'es',
  French: 'fr',
};

function browserStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function loadPreferences(): Preferences {
  const rawPreferences = browserStorage()?.getItem(SETTINGS_KEY);
  if (!rawPreferences) return defaultPreferences;

  try {
    return { ...defaultPreferences, ...(JSON.parse(rawPreferences) as Partial<Preferences>) };
  } catch {
    return defaultPreferences;
  }
}

export function applyPreferences(preferences: Preferences) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.theme = preferences.darkMode ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', preferences.darkMode);
  document.documentElement.lang = languageCodes[preferences.language] ?? 'en';
}

export function savePreferences(preferences: Preferences) {
  browserStorage()?.setItem(SETTINGS_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('phishaware:preferences-changed', { detail: preferences }));
  }
}
