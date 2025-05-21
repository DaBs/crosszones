import { useState, useEffect } from 'react';
import { checkAccessibilityPermission, requestAccessibilityPermission } from "tauri-plugin-macos-permissions-api";
import './PermissionCheck.css';

interface PermissionCheckProps {
  onPermissionsGranted: () => void;
}

export const PermissionCheck: React.FC<PermissionCheckProps> = ({ onPermissionsGranted }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkPermission = async () => {
    try {
      const isGranted = await checkAccessibilityPermission();
      setHasPermission(isGranted);
      if (isGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Failed to check permission:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    try {
      await requestAccessibilityPermission();
      await checkPermission();
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  if (isChecking) {
    return (
      <div className="permission-check">
        <div className="permission-status">
          <h2>Checking Permissions...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="permission-check">
      <div className="permission-status">
        <h2>Required Permissions</h2>
        
        <div className="permission-item">
          <div className="permission-header">
            <h3>Accessibility</h3>
            <span className={`status-badge ${hasPermission ? 'granted' : 'required'}`}>
              {hasPermission ? 'Granted' : 'Required'}
            </span>
          </div>
          <p>CrossZones needs accessibility permissions to control window positions and sizes.</p>
          {!hasPermission && (
            <button 
              className="permission-button"
              onClick={requestPermission}
            >
              Grant Permission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 