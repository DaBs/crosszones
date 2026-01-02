import "@/App.css";

import { OsType, type } from "@tauri-apps/plugin-os";
import { Route, Router, Switch } from "wouter";
import { useHashLocation, navigate } from "wouter/use-hash-location";
import { Permissions } from "@/features/Permissions/Permissions";
import { Layout } from "@/components/ui/layout";
import { ThemeProvider } from "@/lib/theme-provider";
import { MainView } from "@/screens/MainView";
import { FullscreenZoneEditor } from "@/features/ZoneLayouts/ZoneEditor/FullscreenZoneEditor";
import { ZoneOverlay } from "@/features/ZoneLayouts/ZoneOverlay/ZoneOverlay";
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
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/zone-editor">
            <FullscreenZoneEditor />
          </Route>
          <Route path="/zone-overlay">
            <ZoneOverlay />
          </Route>
          <Route path="/">
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              {!hasPermissions ? (
                <Permissions onPermissionsGranted={() => setHasPermissions(true)} />
              ) : (
                <MainView />
              )}
            </Layout>
          </Route>
        </Switch>
      </Router>
      <Toaster position="bottom-center" richColors />
    </ThemeProvider>
  );
}

export default App;
