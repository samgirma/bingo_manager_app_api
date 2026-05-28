import { Button, Card, Input } from '@/components/ui';
import type { MockUser } from '@/services/api';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminOperators() {
  const [operators, setOperators] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [newOperator, setNewOperator] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const response = await apiService.getOperators();
      if (response.success && response.data) {
        setOperators(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (username: string) => {
    try {
      const response = await apiService.toggleOperatorBan(username);
      if (response.success) {
        loadOperators();
        Alert.alert('Success', 'Operator status updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update operator status');
    }
  };

  const handleResetPassword = (username: string) => {
    setResetUsername(username);
    setResetPassword('');
    setShowResetModal(true);
  };

  const confirmResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      const response = await apiService.resetOperatorPassword(resetUsername, resetPassword);
      if (response.success) {
        Alert.alert('Success', 'Password reset successfully');
        setShowResetModal(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const handleCreateOperator = async () => {
    if (!newOperator.full_name || !newOperator.username || !newOperator.email || !newOperator.password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const response = await apiService.createOperator(newOperator);
      if (response.success) {
        Alert.alert('Success', 'Operator created successfully');
        setShowCreateModal(false);
        setNewOperator({ full_name: '', username: '', email: '', password: '' });
        loadOperators();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create operator');
    }
  };

  const filteredOperators = operators.filter(op =>
    op.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>Operators</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search operators..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Operators List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredOperators.map((operator) => (
          <Card key={operator.username} style={styles.operatorCard}>
            <View style={styles.operatorHeader}>
              <View style={styles.operatorInfo}>
                <Text style={styles.operatorName}>{operator.full_name}</Text>
                <Text style={styles.operatorUsername}>@{operator.username}</Text>
                <Text style={styles.operatorEmail}>{operator.email}</Text>
              </View>
              {operator.isBanned && (
                <View style={styles.bannedBadge}>
                  <Text style={styles.bannedText}>BANNED</Text>
                </View>
              )}
            </View>
            <View style={styles.operatorActions}>
              <TouchableOpacity
                style={[styles.actionButton, operator.isBanned && styles.actionButtonDanger]}
                onPress={() => handleToggleBan(operator.username)}
              >
                <Ionicons
                  name={operator.isBanned ? 'lock-open' : 'lock-closed'}
                  size={18}
                  color={operator.isBanned ? '#F43F5E' : '#38BDF8'}
                />
                <Text style={[styles.actionButtonText, operator.isBanned && styles.actionButtonTextDanger]}>
                  {operator.isBanned ? 'Unban' : 'Ban'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleResetPassword(operator.username)}
              >
                <Ionicons name="key" size={18} color="#38BDF8" />
                <Text style={styles.actionButtonText}>Reset Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="create" size={18} color="#38BDF8" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Create Operator Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Operator</Text>
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={newOperator.full_name}
              onChangeText={(text) => setNewOperator({ ...newOperator, full_name: text })}
            />
            <Input
              label="Username"
              placeholder="Enter username"
              value={newOperator.username}
              onChangeText={(text) => setNewOperator({ ...newOperator, username: text })}
            />
            <Input
              label="Email"
              placeholder="Enter email"
              value={newOperator.email}
              onChangeText={(text) => setNewOperator({ ...newOperator, email: text })}
              keyboardType="email-address"
            />
            <Input
              label="Password"
              placeholder="Enter password"
              value={newOperator.password}
              onChangeText={(text) => setNewOperator({ ...newOperator, password: text })}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreateOperator}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>for {resetUsername}</Text>
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={resetPassword}
              onChangeText={setResetPassword}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowResetModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Reset"
                onPress={confirmResetPassword}
                style={styles.modalButton}
              />
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  operatorCard: {
    marginBottom: 12,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  operatorUsername: {
    fontSize: 14,
    color: '#38BDF8',
    marginBottom: 2,
  },
  operatorEmail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bannedBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F43F5E',
  },
  bannedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F43F5E',
  },
  operatorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#38BDF8',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtonTextDanger: {
    color: '#F43F5E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
