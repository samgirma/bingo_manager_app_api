import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

const POLL_INTERVAL_MS = 5000;

export function useSessionGuard() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectedRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => router.replace('/login'), 0);
  }, [router]);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      redirectToLogin();
      return;
    }

    const checkSession = async () => {
      try {
        const response = await apiService.getCurrentUser();

        if (!response.success || !response.data) {
          await apiService.logout();
          redirectToLogin();
          return;
        }

        if (response.data.isBanned) {
          await apiService.logout();
          Alert.alert(
            'Account Restricted',
            'Your access has been terminated by an administrator.',
          );
          redirectToLogin();
        }
      } catch {
        /* swallow network noise */
      }
    };

    checkSession();
    intervalRef.current = setInterval(checkSession, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, redirectToLogin]);
}
