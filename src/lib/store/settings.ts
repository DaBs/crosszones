import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { Settings } from '../../../src-tauri/bindings/Settings';

export type SettingsKey = keyof Settings;

export const store = new LazyStore('settings.json');

export const setSettings = async (settings: Settings) => {
  await invoke('set_settings', { settings });
};

export const getSetting = async (key: SettingsKey) => {
  return await store.get(key as string);
};

export const getSettings = async () => {
  return await store.entries();
};