import "@/App.css";

import { OsType, type } from "@tauri-apps/plugin-os";
import { Route, Router, Switch } from "wouter";
import { Permissions } from "@/features/Permissions/Permissions";
import { Layout } from "@/components/ui/layout";
import { ThemeProvider } from "@/lib/theme-provider";
import { MainView } from "@/screens/MainView";
import { FullscreenZoneEditor } from "@/features/ZoneLayouts/ZoneEditor/FullscreenZoneEditor";
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
      <Router>
        <Switch>
          <Route path="/zone-editor">
            <FullscreenZoneEditor />
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
