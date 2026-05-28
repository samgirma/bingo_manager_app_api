import type { LoginRequest } from '@/services/api';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const credentials: LoginRequest = { username, password };
      const response = await apiService.login(credentials);

      if (response.success) {
        const user = response.user;
        if (user?.isBanned) {
          setError('Your account has been suspended by an administrator. Please contact your system administrator to regain access.');
          await apiService.logout();
          return;
        }

        // Role-based routing
        if (user?.role === 'ADMIN') {
          router.replace('/(admin)/home');
        } else if (user?.role === 'OPERATOR') {
          router.replace('/(operator)/home');
        } else {
          setError('Invalid user role');
        }
      } else {
        setError(response.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Abstract Background Shapes */}
        <View style={styles.backgroundShapes}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* User Icon Placeholder */}
          <View style={styles.userIconContainer}>
            <Ionicons name="person" size={60} color="#FFFFFF" />
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#FFFFFF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#FFFFFF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>Remember me</Text>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.signInButtonText}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#F43F5E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#3498db',
    top: -50,
    right: -50,
    opacity: 0.3,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#9B59B6',
    top: 50,
    left: -30,
    opacity: 0.25,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#3498db',
    top: 150,
    right: 30,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  userIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7d8aff',
    borderRadius: 25,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#7d8aff',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
  },
  checkboxText: {
    fontSize: 14,
    color: '#3498db',
  },
  signInButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#3498db',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonDisabled: {
    backgroundColor: '#7d8aff',
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#5DADE2',
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
