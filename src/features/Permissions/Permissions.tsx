import { useState, useEffect } from 'react';
import { checkAccessibilityPermission, requestAccessibilityPermission, checkInputMonitoringPermission, requestInputMonitoringPermission } from "tauri-plugin-macos-permissions-api";
import { showError } from '@/lib/toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PermissionsProps {
  onPermissionsGranted: () => void;
}

export const Permissions: React.FC<PermissionsProps> = ({ onPermissionsGranted }) => {
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState(false);
  const [hasInputMonitoringPermission, setHasInputMonitoringPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = async () => {
    try {
      const isAccessibilityGranted = await checkAccessibilityPermission();
      const isInputMonitoringGranted = await checkInputMonitoringPermission();
      setHasAccessibilityPermission(isAccessibilityGranted);
      setHasInputMonitoringPermission(isInputMonitoringGranted);
      if (isAccessibilityGranted && isInputMonitoringGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      showError('Failed to check permission', error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestAccessibility = async () => {
    try {
      await requestAccessibilityPermission();
      await checkPermissions();
    } catch (error) {
      showError('Failed to request accessibility permission', error);
    }
  };

  const requestInputMonitoring = async () => {
    try {
      await requestInputMonitoringPermission();
      await checkPermissions();
    } catch (error) {
      showError('Failed to request input monitoring permission', error);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  if (isChecking) {
    return (
      <div className="flex justify-center w-full h-full bg-background p-6">
        <div className="max-w-[600px] w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Checking Permissions...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full h-full bg-background p-6">
      <div className="max-w-[600px] w-full space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Required Permissions</CardTitle>
            <CardDescription>
              CrossZones needs both permissions to function properly. Please grant both permissions to continue.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Accessibility</CardTitle>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  hasAccessibilityPermission
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-white"
                )}
              >
                {hasAccessibilityPermission ? 'Granted' : 'Required'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Allows CrossZones to control window positions and sizes for zone snapping functionality.
            </CardDescription>
            {!hasAccessibilityPermission && (
              <Button onClick={requestAccessibility} className="mt-4">
                Grant Accessibility Permission
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Input Monitoring</CardTitle>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  hasInputMonitoringPermission
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-white"
                )}
              >
                {hasInputMonitoringPermission ? 'Granted' : 'Required'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Allows CrossZones to monitor keyboard input for hotkey detection and window management.
            </CardDescription>
            {!hasInputMonitoringPermission && (
              <Button onClick={requestInputMonitoring} className="mt-4">
                Grant Input Monitoring Permission
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 