import { LazyStore } from '@tauri-apps/plugin-store';
import { Settings } from '../../../src-tauri/bindings/Settings';

export type SettingsKey = keyof Settings;

export const store = new LazyStore('settings.json');

export const setSettings = async (settings: Settings) => {
  return Promise.all(Object.entries(settings).map(([key, value]) => {
    return store.set(key, value);
  }));
};

export const resetSettings = async () => {
  return await store.reset();
};

export const setSetting = async (key: SettingsKey, value: any) => {
  return await store.set(key, value);
};

export const getSetting = async (key: SettingsKey) => {
  return await store.get(key as string);
};

export const getSettings = async () => {
  return await store.entries();
};