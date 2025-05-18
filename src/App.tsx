import { useState } from "react";
import HotkeySettings from "./components/HotkeySettings";
import { PermissionCheck } from "./components/PermissionCheck";
import "./App.css";

function App() {
  const [hasPermissions, setHasPermissions] = useState(false);

  return (
    <>
      <header>
        <h1>CrossZones</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
          Window Management with Global Hotkeys
        </p>
      </header>
      
      <main className="container">
        {!hasPermissions ? (
          <PermissionCheck onPermissionsGranted={() => setHasPermissions(true)} />
        ) : (
          <HotkeySettings />
        )}
      </main>
      
      <footer>
        <p>CrossZones &copy; {new Date().getFullYear()} | A powerful window management tool</p>
      </footer>
    </>
  );
}

export default App;
