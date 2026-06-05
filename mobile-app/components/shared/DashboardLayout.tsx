import type { BingoCenter, RechargeHistory } from '@/services/api';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface ActionButton {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
}

interface DashboardLayoutProps {
  balanceLabel: string;
  insightTitle: string;
  insightBody: (analytics: { totalBalance: number; activeCenters: number; todayGeneratedTopups: number }) => string;
  insightIcon: keyof typeof Ionicons.glyphMap;
  insightIconColor: string;
  actions: ActionButton[];
  transactionsDebitedBy?: string;
  terminalsCreatedBy?: string;
}

const REFRESH_INTERVAL_MS = 30_000;

export default function DashboardLayout({
  balanceLabel,
  insightTitle,
  insightBody,
  insightIcon,
  insightIconColor,
  actions,
  transactionsDebitedBy,
  terminalsCreatedBy,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState({
    totalBalance: 0,
    activeCenters: 0,
    todayGeneratedTopups: 0,
  });
  const [transactions, setTransactions] = useState<RechargeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalsVisible, setTerminalsVisible] = useState(false);
  const [terminals, setTerminals] = useState<BingoCenter[]>([]);
  const [terminalsLoading, setTerminalsLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);
  const [centers, setCenters] = useState<BingoCenter[]>([]);
  const currentUser = apiService.getCurrentUserSync();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        apiService.getSystemAnalytics(),
        apiService.getRechargeHistory(transactionsDebitedBy),
      ]);

      if (!mountedRef.current) return;

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data);
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.slice(0, 5));
      }

      // Load centers for admin dropdown
      if (currentUser?.role === 'ADMIN') {
        const centersResponse = await apiService.getBingoCenters();
        if (centersResponse.success && centersResponse.data) {
          setCenters(centersResponse.data);
        }
      }
    } catch (error) {
      if (!silent) Alert.alert('Error', 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [transactionsDebitedBy, currentUser?.role]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  // Auto-poll every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => loadData(true), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  // Terminals modal
  const loadTerminals = useCallback(async () => {
    setTerminalsLoading(true);
    try {
      const response = await apiService.getBingoCenters(terminalsCreatedBy);
      if (response.success && response.data) {
        setTerminals(response.data);
      }
    } catch {
      /* ignore */
    } finally {
      setTerminalsLoading(false);
    }
  }, [terminalsCreatedBy]);

  const openTerminals = useCallback(() => {
    setTerminalsVisible(true);
    loadTerminals();
  }, [loadTerminals]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      t =>
        t.bingoCenterUsername.toLowerCase().includes(q) ||
        t.debitedBy.toLowerCase().includes(q),
    );
  }, [searchQuery, transactions]);

  const displayBalance = useMemo(() => {
    if (currentUser?.role === 'ADMIN') {
      if (selectedCenter) {
        const center = centers.find(c => c.username === selectedCenter);
        return center ? (parseFloat(center.balance as unknown as string) || 0) : 0;
      }
      return analytics.totalBalance;
    }
    return transactions.reduce((sum, t) => sum + (parseFloat(t.actualAmount as unknown as string) || 0), 0);
  }, [currentUser?.role, analytics.totalBalance, transactions, selectedCenter, centers]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch {
      /* ignore */
    }
    setTimeout(() => router.replace('/login'), 0);
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
        <TouchableOpacity onPress={() => router.push(currentUser?.role === 'ADMIN' ? '/(admin)/menu' : '/(operator)/menu')}>
          <View style={styles.profileContainer}>
            {currentUser?.profile_pic_url ? (
              <Image source={{ uri: currentUser.profile_pic_url }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileFallbackText}>
                  {(currentUser?.full_name || currentUser?.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>

        {/* Center: Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#FFFFFF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search terminals, operators..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#38BDF8']}
          />
        }
      >
        {/* Main Balance Display */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>{balanceLabel}</Text>
          <Text style={styles.balanceAmount}>
            {displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <Text style={styles.balanceCurrency}> ETB</Text>
          </Text>

          {/* Admin: Center Filter Dropdown */}
          {currentUser?.role === 'ADMIN' && (
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.pillToggle}
                onPress={() => setCenterDropdownOpen(!centerDropdownOpen)}
              >
                <Text style={styles.pillText}>
                  {selectedCenter || 'All Centers'}
                </Text>
                <Ionicons name={centerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#FFFFFF" />
              </TouchableOpacity>

              {centerDropdownOpen && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, !selectedCenter && styles.dropdownItemSelected]}
                    onPress={() => { setSelectedCenter(''); setCenterDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, !selectedCenter && styles.dropdownItemTextSelected]}>
                      All Centers
                    </Text>
                  </TouchableOpacity>
                  {centers.map((c) => (
                    <TouchableOpacity
                      key={c.username}
                      style={[styles.dropdownItem, selectedCenter === c.username && styles.dropdownItemSelected]}
                      onPress={() => { setSelectedCenter(c.username); setCenterDropdownOpen(false); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedCenter === c.username && styles.dropdownItemTextSelected]}>
                        {c.full_name}
                      </Text>
                      <Text style={styles.dropdownItemBalance}>
                        {parseFloat(c.balance as unknown as string || '0').toFixed(2)} ETB
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Minimalist Action Circle Row */}
        <View style={styles.actionRow}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCircle}
              onPress={action.title === 'Terminals' ? openTerminals : action.onPress}
            >
              <View style={styles.actionCircleInner}>
                <Ionicons name={action.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contextual Promotional/Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightContent}>
            <View>
              <Text style={styles.insightTitle}>{insightTitle}</Text>
              <Text style={styles.insightDescription}>{insightBody(analytics)}</Text>
            </View>
            <View style={styles.insightIcon}>
              <Ionicons name={insightIcon} size={32} color={insightIconColor} />
            </View>
          </View>
        </View>

        {/* Live Transaction Feed List */}
        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={styles.transactionList}>
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching activity' : 'No recent activity'}
            </Text>
          ) : (
            filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                {/* Left: Badge with Initials */}
                <View style={styles.transactionBadge}>
                  <Text style={styles.badgeText}>{getInitials(transaction.bingoCenterUsername)}</Text>
                </View>

                {/* Center: Details */}
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{transaction.bingoCenterUsername}</Text>
                  <Text style={styles.transactionSubtitle}>
                    {formatTimestamp(transaction.timestamp)}
                    {transactionsDebitedBy ? '' : ` by ${transaction.debitedBy}`}
                  </Text>
                </View>

                {/* Right: Amount */}
                <Text style={[
                  styles.transactionAmount,
                  transaction.generatedAmount > 0 ? styles.amountPositive : styles.amountNegative,
                ]}>
                  +{parseFloat(transaction.generatedAmount as unknown as string).toFixed(0)} ETB
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Terminals Modal */}
      <Modal
        visible={terminalsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTerminalsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registered Terminals</Text>
            <TouchableOpacity onPress={() => setTerminalsVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {terminalsLoading ? (
            <Text style={styles.modalLoadingText}>Loading terminals...</Text>
          ) : terminals.length === 0 ? (
            <View style={styles.modalEmptyState}>
              <Ionicons name="hardware-chip-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.modalEmptyText}>No terminals registered yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {terminals.map((center) => (
                <View key={center.username} style={styles.terminalCard}>
                  <View style={styles.terminalHeader}>
                    <View style={styles.terminalAvatar}>
                      <Text style={styles.terminalAvatarText}>
                        {center.full_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.terminalNameInfo}>
                      <Text style={styles.terminalFullName}>{center.full_name}</Text>
                      <Text style={styles.terminalUsername}>@{center.username}</Text>
                    </View>
                    <View style={styles.terminalBalance}>
                      <Text style={styles.terminalBalanceText}>
                        {parseFloat(center.balance as unknown as string || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                      </Text>
                    </View>
                  </View>
                  <View style={styles.terminalDetails}>
                    <View style={styles.terminalDetailRow}>
                      <Ionicons name="key-outline" size={13} color="#94A3B8" />
                      <Text style={styles.terminalDetailLabel}>Password</Text>
                      <Text style={styles.terminalDetailValue}>{center.password || 'N/A'}</Text>
                    </View>
                    <View style={styles.terminalDetailRow}>
                      <Ionicons name="hardware-chip-outline" size={13} color="#94A3B8" />
                      <Text style={styles.terminalDetailLabel}>MAC</Text>
                      <Text style={styles.terminalDetailValue}>{center.mac_address}</Text>
                    </View>
                    {!terminalsCreatedBy && (
                      <View style={styles.terminalDetailRow}>
                        <Ionicons name="person-outline" size={13} color="#94A3B8" />
                        <Text style={styles.terminalDetailLabel}>Created by</Text>
                        <Text style={styles.terminalDetailValue}>{center.createdBy}</Text>
                      </View>
                    )}
                    <View style={styles.terminalDetailRow}>
                      <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                      <Text style={styles.terminalDetailLabel}>Registered</Text>
                      <Text style={styles.terminalDetailValue}>
                        {new Date(center.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
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
  profileFallback: {
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
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
  dropdownWrapper: {
    marginTop: 16,
    zIndex: 10,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginTop: 4,
    maxHeight: 250,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  dropdownItemBalance: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
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
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#002266',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalLoadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  terminalCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  terminalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  terminalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  terminalNameInfo: {
    flex: 1,
  },
  terminalFullName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  terminalUsername: {
    fontSize: 12,
    color: '#94A3B8',
  },
  terminalBalance: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  terminalBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  terminalDetails: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.1)',
    paddingTop: 12,
  },
  terminalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  terminalDetailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    width: 75,
  },
  terminalDetailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
});
