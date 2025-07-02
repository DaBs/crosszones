import "@/App.css";

import { useState } from "react";
import { OsType, type } from "@tauri-apps/plugin-os";
import HotkeySettings from "@/components/HotkeySettings/HotkeySettings";
import { PermissionCheck } from "@/components/PermissionCheck/PermissionCheck";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsOverlay } from "@/components/Settings/Settings";

const HAS_PERMISSIONS_DEFAULT: Record<OsType, boolean> = {
  "windows": true,
  "macos": false,
  "linux": false,
  "ios": false,
  "android": false,
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(HAS_PERMISSIONS_DEFAULT[type()]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="crosszones-theme">
      <Layout isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}>
        {!hasPermissions ? (
          <PermissionCheck onPermissionsGranted={() => setHasPermissions(true)} />
        ) : (
          <HotkeySettings />
        )}
        <SettingsOverlay open={isSettingsOpen} />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
