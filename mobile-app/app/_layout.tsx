import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionGuard } from '@/hooks/use-session-guard';
import { apiService } from '@/services/api';

export const unstable_settings = {
  anchor: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Runtime ban-enforcement kill switch – polls every 5 s
  useSessionGuard();

  useEffect(() => {
    const restore = async () => {
      try {
        const restored = await apiService.restoreRememberedSession();
        if (restored) {
          const user = apiService.getCurrentUserSync();
          if (user?.role === 'ADMIN') {
            router.replace('/(admin)/home');
          } else if (user?.role === 'OPERATOR') {
            router.replace('/(operator)/home');
          }
        }
      } catch {
        // Ignore errors, user will see login screen
      } finally {
        setIsRestoringSession(false);
      }
    };
    restore();
  }, []);

  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(operator)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
