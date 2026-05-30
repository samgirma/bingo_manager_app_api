import { Button, Card, Input } from '@/components/ui';
import GlassLoader from '@/components/shared/GlassLoader';
import type { BingoCenter } from '@/services/api';
import { apiService } from '@/services/api';
import { downloadEncryptedFile } from '@/utils/fileDownloader';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RechargeBalance() {
  const currentUser = apiService.getCurrentUserSync();
  const [bingoCenters, setBingoCenters] = useState<BingoCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [form, setForm] = useState({
    generatedAmount: '',
    actualAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingCenters, setLoadingCenters] = useState(true);

  useEffect(() => {
    loadBingoCenters();
  }, []);

  const loadBingoCenters = async () => {
    try {
      const response = await apiService.getBingoCenters(currentUser?.username);
      if (response.success && response.data) {
        setBingoCenters(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load Bingo Centers');
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleRecharge = async () => {
    if (!selectedCenter || !form.generatedAmount || !form.actualAmount) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    const genVal = parseFloat(form.generatedAmount);
    const actVal = parseFloat(form.actualAmount);

    if (genVal <= 0) {
      Alert.alert('Validation Error', 'Transaction Failed: Generated amount must be greater than zero');
      return;
    }
    if (actVal < 0) {
      Alert.alert('Validation Error', 'Transaction Failed: Actual amount cannot be negative');
      return;
    }

    setLoading(true);
    setLoadingMessage('Processing top-up...');
    try {
      const response = await apiService.rechargeBalance({
        bingoCenterUsername: selectedCenter,
        generatedAmount: genVal,
        actualAmount: actVal,
        debitedBy: currentUser?.username || '',
      });

      if (!response.success) {
        Alert.alert('Operation Failed', response.error || 'Failed to recharge balance');
        return;
      }

      setForm({ generatedAmount: '', actualAmount: '' });
      setSelectedCenter('');
      await loadBingoCenters();

      const file = response.encryptedFile;

      if (file) {
        Alert.alert(
          'Top-up Complete',
          `Balance recharged successfully.\n\nRef: ${file.transactionRef || 'N/A'}`,
          [
            { text: 'OK' },
            {
              text: 'Save File',
              onPress: () => downloadEncryptedFile(file),
            },
          ],
        );
      } else {
        Alert.alert('Success', 'Balance recharged successfully');
      }
    } catch (error) {
      Alert.alert('System Error', 'An unexpected error occurred during the top-up process');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const getSelectedCenterBalance = () => {
    const center = bingoCenters.find(c => c.username === selectedCenter);
    return parseFloat(center?.balance as unknown as string) || 0;
  };

  return (
    <View style={styles.container}>
      <GlassLoader visible={loading} message={loadingMessage} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recharge Balance</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="wallet" size={32} color="#38BDF8" />
            <View style={styles.formHeaderText}>
              <Text style={styles.formTitle}>Recharge Terminal</Text>
              <Text style={styles.formSubtitle}>Add balance to Bingo Center</Text>
            </View>
          </View>

          {loadingCenters ? (
            <Text style={styles.loadingText}>Loading Bingo Centers...</Text>
          ) : (
            <>
              <Text style={styles.label}>Select Bingo Center</Text>
              <View style={styles.pickerContainer}>
                {bingoCenters.map((center) => (
                  <TouchableOpacity
                    key={center.username}
                    style={[
                      styles.pickerItem,
                      selectedCenter === center.username && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedCenter(center.username)}
                  >
                    <View style={styles.pickerItemContent}>
                      <Ionicons
                        name="business"
                        size={20}
                        color={selectedCenter === center.username ? '#38BDF8' : '#94A3B8'}
                      />
                      <View style={styles.pickerItemText}>
                        <Text
                          style={[
                            styles.pickerItemName,
                            selectedCenter === center.username && styles.pickerItemNameSelected,
                          ]}
                        >
                          {center.username}
                        </Text>
                        <Text style={styles.pickerItemBalance}>
                          Current: {parseFloat(center.balance as unknown as string).toFixed(2)} ETB
                        </Text>
                      </View>
                      {selectedCenter === center.username && (
                        <Ionicons name="checkmark-circle" size={20} color="#38BDF8" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedCenter && (
                <Card style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Current Balance</Text>
                  <Text style={styles.balanceValue}>{getSelectedCenterBalance().toFixed(2)} ETB</Text>
                </Card>
              )}

              <Input
                label="Generated Amount"
                placeholder="Enter amount to generate"
                value={form.generatedAmount}
                onChangeText={(text) => setForm({ ...form, generatedAmount: text })}
                keyboardType="decimal-pad"
              />

              <Input
                label="Actual Amount Paid"
                placeholder="Enter actual payment"
                value={form.actualAmount}
                onChangeText={(text) => setForm({ ...form, actualAmount: text })}
                keyboardType="decimal-pad"
              />

              {form.generatedAmount && form.actualAmount && (
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Generated:</Text>
                    <Text style={styles.summaryValue}>{parseFloat(form.generatedAmount).toFixed(2)} ETB</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Actual Paid:</Text>
                    <Text style={styles.summaryValue}>{parseFloat(form.actualAmount).toFixed(2)} ETB</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryLabelTotal}>Difference:</Text>
                    <Text style={[
                      styles.summaryValueTotal,
                      (parseFloat(form.generatedAmount) - parseFloat(form.actualAmount)) >= 0
                        ? styles.positive
                        : styles.negative,
                    ]}>
                      {(parseFloat(form.generatedAmount) - parseFloat(form.actualAmount)).toFixed(2)} ETB
                    </Text>
                  </View>
                </Card>
              )}

              <Button
                title="Recharge Balance"
                onPress={handleRecharge}
                loading={loading}
                disabled={!selectedCenter}
                style={styles.submitButton}
              />
            </>
          )}
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color="#FBBF24" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Recharge Information</Text>
              <Text style={styles.infoDescription}>
                Generated amount is applied to the terminal. Actual amount is the physical payment
                received. An AES-256-CBC encrypted top-up file will be generated for PHP backend
                import after each successful transaction.
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
  label: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38BDF8',
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemText: {
    marginLeft: 12,
    flex: 1,
  },
  pickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pickerItemNameSelected: {
    color: '#38BDF8',
  },
  pickerItemBalance: {
    fontSize: 12,
    color: '#94A3B8',
  },
  balanceCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38BDF8',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#F43F5E',
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
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
