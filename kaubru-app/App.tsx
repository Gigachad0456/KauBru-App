import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { requestAndRegisterPushToken } from './src/services/notifications';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalAlert, { CustomAlertService } from './src/components/GlobalAlert';

// Override default React Native alert with our beautiful custom alert
Alert.alert = CustomAlertService.alert as any;

/**
 * Inner component that has access to AuthContext.
 * Triggers push token registration once the user is authenticated.
 */
function AppWithAuth() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Register push token once after user is authenticated
      /* 
      requestAndRegisterPushToken().catch(() => {
        // Non-fatal — will retry on next launch
      });
      */
    }
  }, [user?.id]);

  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    // Check for OTA updates on launch and apply immediately if available
    async function checkForUpdate() {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync(); // applies update immediately
          }
        }
      } catch {
        // Non-fatal — app continues with current bundle
      }
    }
    checkForUpdate();

    // Keep Render backend alive by pinging every 10 minutes
    // Render free tier sleeps after 15 min of inactivity
    const keepAlive = setInterval(async () => {
      try {
        await fetch('https://kaubru-app.onrender.com/', { method: 'GET' });
      } catch {}
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(keepAlive);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Light status bar — dark icons on cream background */}
        <StatusBar style="dark" backgroundColor="#F5F2EC" />
        <AppWithAuth />
        <GlobalAlert />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
