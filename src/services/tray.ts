import { TrayIcon } from '@tauri-apps/api/tray';

const tray = await TrayIcon.new({ tooltip: 'CrossZones' });

export default tray;