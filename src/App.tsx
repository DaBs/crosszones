import { useState } from "react";
import HotkeySettings from "./components/HotkeySettings/HotkeySettings";
import { PermissionCheck } from "./components/PermissionCheck/PermissionCheck";
import "./App.css";

function App() {
  const [hasPermissions, setHasPermissions] = useState(false);

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
