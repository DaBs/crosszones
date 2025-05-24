import { useState } from "react";
import { OsType, type } from "@tauri-apps/plugin-os";
import HotkeySettings from "./components/HotkeySettings/HotkeySettings";
import { PermissionCheck } from "./components/PermissionCheck/PermissionCheck";
import "./App.css";

const HAS_PERMISSIONS_DEFAULT: Record<OsType, boolean> = {
  "windows": true,
  "macos": false,
  "linux": false,
  "ios": false,
  "android": false,
}

function App() {
  const [hasPermissions, setHasPermissions] = useState(HAS_PERMISSIONS_DEFAULT[type()]);

  return (
    <>      
      <main className="container">
        {!hasPermissions ? (
          <PermissionCheck onPermissionsGranted={() => setHasPermissions(true)} />
        ) : (
          <HotkeySettings />
        )}
      </main>
    </>
  );
}

export default App;
