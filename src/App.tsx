import "@/App.css";

import { OsType, type } from "@tauri-apps/plugin-os";
import { PermissionCheck } from "@/components/PermissionCheck/PermissionCheck";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { MainView } from "@/screens/MainView";
import { useState } from "react";
import { Toaster } from "sonner";

const HAS_PERMISSIONS_DEFAULT: Record<OsType, boolean> = {
  "windows": true,
  "macos": false,
  "linux": false,
  "ios": false,
  "android": false,
}

function App() {
  const [hasPermissions, setHasPermissions] = useState(HAS_PERMISSIONS_DEFAULT[type()]);
  const [activeTab, setActiveTab] = useState('hotkeys');

  return (
    <ThemeProvider defaultTheme="system" storageKey="crosszones-theme">
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {!hasPermissions ? (
          <PermissionCheck onPermissionsGranted={() => setHasPermissions(true)} />
        ) : (
          <MainView />
        )}
      </Layout>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}

export default App;
