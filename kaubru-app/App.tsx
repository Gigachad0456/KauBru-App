import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
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
