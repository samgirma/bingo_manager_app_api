import { Button, Card, Input } from '@/components/ui';
import GlassLoader from '@/components/shared/GlassLoader';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreateUser() {
  const currentUser = apiService.getCurrentUserSync();
  const [form, setForm] = useState({
    username: '',
    password: '',
    mac_address: '',
    balance: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const formatMacAddress = (text: string) => {
    const cleaned = text.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    return formatted.substring(0, 17);
  };

  const handleCreateBingoCenter = async () => {
    if (!form.username || !form.password || !form.mac_address || !form.balance) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    if (form.mac_address.length !== 17) {
      Alert.alert('Validation Error', 'Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)');
      return;
    }

    if (parseFloat(form.balance) < 0) {
      Alert.alert('Validation Error', 'Transaction Failed: Starting balance cannot be negative');
      return;
    }

    setLoading(true);
    setLoadingMessage('Registering new Bingo Center...');
    try {
      const response = await apiService.createBingoCenter({
        username: form.username,
        password: form.password,
        mac_address: form.mac_address,
        balance: parseFloat(form.balance),
        createdBy: currentUser?.username || '',
      });

      if (!response.success) {
        Alert.alert('Operation Failed', response.error || 'Failed to create Bingo Center');
        return;
      }

      const file = response.encryptedFile;

      if (file) {
        Alert.alert(
          'Center Registered',
          `Bingo Center "${form.username}" created successfully.\n\nEncrypted terminal file generated:\n${file.fileName}\nKey FP: ${file.keyFingerprint}`,
        );
      } else {
        Alert.alert('Success', 'Bingo Center created successfully');
      }

      setForm({ username: '', password: '', mac_address: '', balance: '' });
    } catch (error) {
      Alert.alert('System Error', 'An unexpected error occurred during registration');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <GlassLoader visible={loading} message={loadingMessage} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Bingo Center</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="business" size={32} color="#38BDF8" />
            <View style={styles.formHeaderText}>
              <Text style={styles.formTitle}>Register New Center</Text>
              <Text style={styles.formSubtitle}>Add a new physical Bingo terminal</Text>
            </View>
          </View>

          <Input
            label="Bingo Center Username"
            placeholder="Enter unique username"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Passphrase"
              placeholder="Enter passphrase"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <Input
            label="MAC Address"
            placeholder="XX:XX:XX:XX:XX:XX"
            value={form.mac_address}
            onChangeText={(text) => setForm({ ...form, mac_address: formatMacAddress(text) })}
            autoCapitalize="characters"
            maxLength={17}
          />

          <Input
            label="Starting Balance"
            placeholder="Enter initial balance"
            value={form.balance}
            onChangeText={(text) => setForm({ ...form, balance: text })}
            keyboardType="decimal-pad"
          />

          <Button
            title="Create Bingo Center"
            onPress={handleCreateBingoCenter}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color="#FBBF24" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Important Information</Text>
              <Text style={styles.infoDescription}>
                Bingo Centers are physical game terminals. The MAC address must match the hardware
                device. An AES-256-CBC encrypted terminal file will be generated upon successful
                registration for PHP backend import.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002266',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  formCard: {
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 40,
  },
  submitButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
