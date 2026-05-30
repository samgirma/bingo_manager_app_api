import { Button, Card, Input } from '@/components/ui';
import GlassLoader from '@/components/shared/GlassLoader';
import { apiService } from '@/services/api';
import { downloadEncryptedFile } from '@/utils/fileDownloader';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CreateUser() {
  const currentUser = apiService.getCurrentUserSync();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    mac_address: '',
    balance: '',
    actualAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const formatMacAddress = (text: string) => {
    const cleaned = text.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    return formatted.substring(0, 17);
  };

  const handleCreateBingoCenter = async () => {
    if (!form.full_name || !form.username || !form.password || !form.mac_address || !form.balance || !form.actualAmount) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    if (form.mac_address.length !== 17) {
      Alert.alert('Validation Error', 'Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)');
      return;
    }

    if (parseFloat(form.balance) < 0) {
      Alert.alert('Validation Error', 'Starting balance cannot be negative');
      return;
    }

    if (parseFloat(form.actualAmount) < 0) {
      Alert.alert('Validation Error', 'Actual paid amount cannot be negative');
      return;
    }

    setLoading(true);
    setLoadingMessage('Registering new Bingo Center...');
    try {
      const response = await apiService.createBingoCenter({
        full_name: form.full_name,
        username: form.username,
        password: form.password,
        mac_address: form.mac_address,
        balance: parseFloat(form.balance),
        actualAmount: parseFloat(form.actualAmount),
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
          `Bingo Center "${form.full_name}" created successfully.\n\nRef: ${file.transactionRef || 'N/A'}`,
          [
            { text: 'OK' },
            {
              text: 'Save File',
              onPress: () => downloadEncryptedFile(file),
            },
          ],
        );
      } else {
        Alert.alert('Success', `Bingo Center "${form.full_name}" created successfully`);
      }
      setForm({ full_name: '', username: '', password: '', mac_address: '', balance: '', actualAmount: '' });
    } catch {
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
            label="Full Name"
            placeholder="e.g. Sami Bingo"
            value={form.full_name}
            onChangeText={(text) => setForm({ ...form, full_name: text })}
          />

          <Input
            label="Username"
            placeholder="Enter unique username"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />

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
            placeholder="Enter initial balance (ETB)"
            value={form.balance}
            onChangeText={(text) => setForm({ ...form, balance: text })}
            keyboardType="decimal-pad"
          />

          <Input
            label="Actual Paid Amount"
            placeholder="Enter amount paid (ETB)"
            value={form.actualAmount}
            onChangeText={(text) => setForm({ ...form, actualAmount: text })}
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
