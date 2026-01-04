import { useState, useEffect } from 'react';
import { checkAccessibilityPermission, requestAccessibilityPermission, checkInputMonitoringPermission, requestInputMonitoringPermission } from "tauri-plugin-macos-permissions-api";
import { showError } from '@/lib/toast';
import './Permissions.css';

interface PermissionsProps {
  onPermissionsGranted: () => void;
}

export const Permissions: React.FC<PermissionsProps> = ({ onPermissionsGranted }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkPermission = async () => {
    try {
      const isGranted = await checkAccessibilityPermission();
      const isInputMonitoringGranted = await checkInputMonitoringPermission();
      setHasPermission(isGranted && isInputMonitoringGranted);
      if (isGranted) {
        if (isInputMonitoringGranted) {
          onPermissionsGranted();
        } else {
          await requestInputMonitoringPermission();
        }
      }
    } catch (error) {
      showError('Failed to check permission', error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    try {
      await requestAccessibilityPermission();
      await requestInputMonitoringPermission();
      await checkPermission();
    } catch (error) {
      showError('Failed to request permission', error);
    }
  };

  const requestInputMonitoringPermission = async () => {
    try {
      await requestInputMonitoringPermission();
      await checkPermission();
    } catch (error) {
      showError('Failed to request permission', error);
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