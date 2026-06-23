import { Button, Card, Input } from '@/components/ui';
import GlassLoader from '@/components/shared/GlassLoader';
import type { BingoCenter } from '@/services/api';
import { apiService } from '@/services/api';
import { downloadEncryptedFile } from '@/utils/fileDownloader';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateUser() {
  const currentUser = apiService.getCurrentUserSync();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'regenerate'>('create');

  // Create tab
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    mac_address: '',
    balance: '0',
    actualAmount: '0',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Regenerate tab
  const [bingoCenters, setBingoCenters] = useState<BingoCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(true);

  // Shared
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadBingoCenters = useCallback(async () => {
    try {
      setLoadingCenters(true);
      const response = await apiService.getBingoCenters(currentUser?.username);
      if (response.success && response.data) {
        setBingoCenters(response.data);
      }
    } catch {
      Alert.alert('Error', 'Failed to load Bingo Centers');
    } finally {
      setLoadingCenters(false);
    }
  }, [currentUser?.username]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'regenerate') {
        loadBingoCenters();
      }
    }, [activeTab, loadBingoCenters])
  );

  const formatMacAddress = (text: string) => {
    const cleaned = text.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    return formatted.substring(0, 17);
  };

  const handleCreateBingoCenter = async () => {
    if (!form.full_name || !form.username || !form.password || !form.mac_address) {
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
        downloadEncryptedFile(file);
      }
      Alert.alert('Success', `Bingo Center "${form.full_name}" created successfully`, [
        { text: 'OK', onPress: () => router.replace('/(operator)/home') },
      ]);
      setForm({ full_name: '', username: '', password: '', mac_address: '', balance: '0', actualAmount: '0' });
    } catch {
      Alert.alert('System Error', 'An unexpected error occurred during registration');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRegenerateFile = async () => {
    if (!selectedCenter) {
      Alert.alert('Validation Error', 'Please select a bingo center');
      return;
    }

    setLoading(true);
    setLoadingMessage('Regenerating user file...');
    try {
      const response = await apiService.regenerateUserFile(selectedCenter);

      if (!response.success || !response.encryptedFile) {
        Alert.alert('Operation Failed', response.error || 'Failed to regenerate user file');
        return;
      }

      downloadEncryptedFile(response.encryptedFile);
      Alert.alert('Success', 'User file regenerated and saved', [
        { text: 'OK', onPress: () => router.replace('/(operator)/home') },
      ]);
    } catch {
      Alert.alert('System Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const getSelectedCenter = () => bingoCenters.find(c => c.username === selectedCenter);

  return (
    <View style={styles.container}>
      <GlassLoader visible={loading} message={loadingMessage} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bingo Center</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
            onPress={() => setActiveTab('create')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'create' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'regenerate' && styles.tabActive]}
            onPress={() => {
              setActiveTab('regenerate');
              loadBingoCenters();
            }}
          >
            <Ionicons name="refresh" size={16} color={activeTab === 'regenerate' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'regenerate' && styles.tabTextActive]}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'create' ? (
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
              placeholder="e.g. Unique Bingo"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordField}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
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
              label="Starting Balance (ETB)"
              value={form.balance}
              editable={false}
            />

            <Input
              label="Actual Paid Amount (ETB)"
              value={form.actualAmount}
              editable={false}
            />

            <Button
              title="Create Bingo Center"
              onPress={handleCreateBingoCenter}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>
        ) : (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="refresh" size={32} color="#38BDF8" />
              <View style={styles.formHeaderText}>
                <Text style={styles.formTitle}>Regenerate User File</Text>
                <Text style={styles.formSubtitle}>Re-generate encrypted file for existing terminal</Text>
              </View>
            </View>

            {loadingCenters ? (
              <Text style={styles.loadingText}>Loading Bingo Centers...</Text>
            ) : (
              <>
                <Text style={styles.label}>Select Bingo Center *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text style={[styles.dropdownText, !selectedCenter && styles.dropdownPlaceholder]}>
                    {selectedCenter || 'Choose a bingo center'}
                  </Text>
                  <Ionicons
                    name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownList}>
                    {bingoCenters.map((center) => (
                      <TouchableOpacity
                        key={center.username}
                        style={[
                          styles.dropdownItem,
                          selectedCenter === center.username && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedCenter(center.username);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedCenter === center.username && styles.dropdownItemTextSelected,
                        ]}>
                          {center.full_name} ({center.username})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedCenter && (
                  <Card style={styles.infoCard}>
                    <View style={styles.infoContent}>
                      <Ionicons name="information-circle" size={20} color="#38BDF8" />
                      <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>
                          {getSelectedCenter()?.full_name}
                        </Text>
                        <Text style={styles.infoDescription}>
                          MAC: {getSelectedCenter()?.mac_address}{'\n'}
                          Balance: {parseFloat(getSelectedCenter()?.balance as unknown as string || '0').toFixed(2)} ETB
                        </Text>
                      </View>
                    </View>
                  </Card>
                )}

                <Button
                  title="Regenerate File"
                  onPress={handleRegenerateFile}
                  loading={loading}
                  disabled={!selectedCenter}
                  style={styles.submitButton}
                />
              </>
            )}
          </Card>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color="#FBBF24" />
            <View style={styles.infoText}>
              {activeTab === 'create' ? (
                <>
                  <Text style={styles.infoTitle}>Important Information</Text>
                  <Text style={styles.infoDescription}>
                    Bingo Centers are physical game terminals. The MAC address must match the hardware
                    device. An AES-256-CBC encrypted terminal file will be generated upon successful
                    registration for PHP backend import.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoTitle}>Regenerate Information</Text>
                  <Text style={styles.infoDescription}>
                    Regenerating the user file creates a new encrypted terminal file with the current
                    balance and MAC address. Use this if the original file was lost or corrupted.
                  </Text>
                </>
              )}
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002266' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: 'rgba(30, 41, 59, 0.5)' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  tabBar: {
    flexDirection: 'row', marginBottom: 16, backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  tabActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#94A3B8' },
  tabTextActive: { color: '#38BDF8', fontWeight: '600' },
  formCard: { marginBottom: 16 },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  formHeaderText: { marginLeft: 16, flex: 1 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: '#94A3B8' },
  label: { fontSize: 14, color: '#94A3B8', marginBottom: 8, fontWeight: '500' },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)', padding: 16, marginBottom: 8,
  },
  dropdownText: { fontSize: 16, color: '#FFFFFF', flex: 1 },
  dropdownPlaceholder: { color: '#64748B' },
  dropdownList: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)', marginBottom: 16, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  dropdownItemSelected: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  dropdownItemText: { fontSize: 14, color: '#FFFFFF', flex: 1 },
  dropdownItemTextSelected: { color: '#38BDF8', fontWeight: '600' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 8, fontWeight: '500' },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  passwordField: { flex: 1, padding: 16, fontSize: 16, color: '#FFFFFF' },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  submitButton: { marginTop: 8 },
  infoCard: { marginBottom: 20 },
  infoContent: { flexDirection: 'row', alignItems: 'flex-start' },
  infoText: { marginLeft: 12, flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#FBBF24', marginBottom: 4 },
  infoDescription: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },
  loadingText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', paddingVertical: 20 },
});
