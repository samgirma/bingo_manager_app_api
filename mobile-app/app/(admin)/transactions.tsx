import { Card } from '@/components/ui';
import type { RechargeHistory } from '@/services/api';
import { apiService } from '@/services/api';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<RechargeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await apiService.getRechargeHistory();
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionId}>#{transaction.id}</Text>
                <Text style={styles.transactionTimestamp}>
                  {formatTimestamp(transaction.timestamp)}
                </Text>
              </View>
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Operator:</Text>
                  <Text style={styles.detailValue}>{transaction.debitedBy}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bingo Center:</Text>
                  <Text style={styles.detailValue}>{transaction.bingoCenterUsername}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actual Paid:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    ${transaction.actualAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Generated:</Text>
                  <Text style={[styles.detailValue, styles.generatedValue]}>
                    ${transaction.generatedAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
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
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
  transactionTimestamp: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  amountValue: {
    color: '#FBBF24',
  },
  generatedValue: {
    color: '#38BDF8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
