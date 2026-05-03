import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoNotifications from 'expo-notifications';
import { notificationsAPI } from './api';

const PUSH_TOKEN_FLAG = 'push_token_registered';

/**
 * Request push notification permission and register the Expo push token with the API.
 *
 * - Checks if already registered (flag in AsyncStorage) — skips if so.
 * - Requests permission via Expo Notifications.
 * - On grant: gets token, calls POST /notifications/register, sets flag.
 * - On deny: returns silently, does NOT set flag (so it won't re-request).
 * - On network failure: does NOT set flag (retries next launch).
 */
export async function requestAndRegisterPushToken(): Promise<void> {
  try {
    // Check if already registered
    const alreadyRegistered = await AsyncStorage.getItem(PUSH_TOKEN_FLAG);
    if (alreadyRegistered === 'true') return;

    // Request permission
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    if (status !== 'granted') {
      // User denied — do not set flag so we don't re-request
      return;
    }

    // Get the Expo push token
    const tokenData = await ExpoNotifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with backend
    await notificationsAPI.register(token);

    // Mark as registered so we don't repeat
    await AsyncStorage.setItem(PUSH_TOKEN_FLAG, 'true');
  } catch {
    // Network failure or any other error — do NOT set flag so we retry next launch
  }
}
