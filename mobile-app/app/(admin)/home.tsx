import type { RechargeHistory } from '@/services/api';
import { apiService } from '@/services/api';
import { getCurrentUser } from '@/services/api/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminHome() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState({
    totalBalance: 0,
    activeCenters: 0,
    todayGeneratedTopups: 0,
  });
  const [transactions, setTransactions] = useState<RechargeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        apiService.getSystemAnalytics(),
        apiService.getRechargeHistory(),
      ]);
      
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }
      
      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.slice(0, 5));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
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
      {/* Minimalist FinTech Top Header Bar */}
      <View style={styles.header}>
        {/* Left: Profile Image with Notification Dot */}
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: currentUser?.profile_pic_url || 'https://via.placeholder.com/40' }}
              style={styles.profileImage}
            />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>

        {/* Center: Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#FFFFFF" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search terminals, operators...</Text>
        </View>

        {/* Right: Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="bar-chart" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="card" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Balance Display */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total System Balance (ETB)</Text>
          <Text style={styles.balanceAmount}>
            {analytics.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <Text style={styles.balanceCurrency}> ETB</Text>
          </Text>
          
          {/* Pill Toggle */}
          <TouchableOpacity style={styles.pillToggle}>
            <Text style={styles.pillText}>All Centers</Text>
            <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Carousel Indicator */}
          <View style={styles.carouselIndicator}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Minimalist Action Circle Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCircle}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Add Balance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircle}>
            <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCircle}
            onPress={() => router.push('/(admin)/operators')}
          >
            <Ionicons name="business" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Terminals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircle}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Contextual Promotional/Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightContent}>
            <View>
              <Text style={styles.insightTitle}>Operator Activity Audit</Text>
              <Text style={styles.insightDescription}>
                All {analytics.activeCenters} active operators are online. No pending balance anomalies detected today.
              </Text>
            </View>
            <View style={styles.insightIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Live Transaction Feed List */}
        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={styles.transactionList}>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              {/* Left: Badge with Initials */}
              <View style={styles.transactionBadge}>
                <Text style={styles.badgeText}>{getInitials(transaction.bingoCenterUsername)}</Text>
              </View>

              {/* Center: Details */}
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.bingoCenterUsername}</Text>
                <Text style={styles.transactionSubtitle}>
                  {formatTimestamp(transaction.timestamp)} • by {transaction.debitedBy}
                </Text>
              </View>

              {/* Right: Amount */}
              <Text style={[
                styles.transactionAmount,
                transaction.generatedAmount > 0 ? styles.amountPositive : styles.amountNegative
              ]}>
                {transaction.generatedAmount > 0 ? '+' : ''}{transaction.generatedAmount.toFixed(0)} ETB
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002266',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    gap: 12,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F43F5E',
    borderWidth: 2,
    borderColor: '#002266',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  pillToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  carouselIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
  },
  actionCircle: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  insightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    maxWidth: 240,
  },
  insightIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 12,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amountPositive: {
    color: '#FFFFFF',
  },
  amountNegative: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
