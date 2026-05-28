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
import { apiService } from '@/services/api';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.forgotPassword(email.trim());
      if (response.success) {
        setSuccess('OTP sent to your email');
        setStep('otp');
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.verifyOtp(email.trim(), otp.trim());
      if (response.success) {
        setSuccess('OTP verified');
        setStep('password');
      } else {
        setError(response.error || 'Invalid OTP');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.resetPassword(email.trim(), otp.trim(), newPassword);
      if (response.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setError(response.error || 'Failed to reset password');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Forgot Password';
      case 'otp': return 'Verify OTP';
      case 'password': return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return 'Enter your email address and we\'ll send you an OTP to reset your password.';
      case 'otp': return `We sent a 6-digit code to ${email}`;
      case 'password': return 'Enter your new password below.';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.backgroundShapes}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>

        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'otp') setStep('email');
              else if (step === 'password') setStep('otp');
              else router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#3498db" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={step === 'email' ? 'mail' : step === 'otp' ? 'key' : 'lock-closed'}
              size={50}
              color="#FFFFFF"
            />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.description}>{getStepDescription()}</Text>

          {/* Step Indicators */}
          <View style={styles.steps}>
            <View style={[styles.stepDot, step === 'email' && styles.stepDotActive, (step === 'otp' || step === 'password') && styles.stepDotCompleted]} />
            <View style={[styles.stepLine, (step === 'otp' || step === 'password') && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'otp' && styles.stepDotActive, step === 'password' && styles.stepDotCompleted]} />
            <View style={[styles.stepLine, step === 'password' && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'password' && styles.stepDotActive]} />
          </View>

          {/* Email Step */}
          {step === 'email' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#FFFFFF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#FFFFFF"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <View style={styles.inputContainer}>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="New password"
                  placeholderTextColor="#FFFFFF"
                  value={newPassword}
                  onChangeText={setNewPassword}
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
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#FFFFFF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error / Success Messages */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#F43F5E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Back to Login */}
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Back to Login</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#3498db',
    fontSize: 16,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  stepDotActive: {
    backgroundColor: '#3498db',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#DDD',
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  inputContainer: {
    width: '100%',
    gap: 12,
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
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
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
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#3498db',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    flex: 1,
  },
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    color: '#5DADE2',
    fontSize: 14,
  },
});
