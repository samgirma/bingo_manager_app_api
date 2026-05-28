import { Button, Card, Input } from '@/components/ui';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuProps {
  defaultAvatarLetter: string;
}

export default function ProfileMenu({ defaultAvatarLetter }: ProfileMenuProps) {
  const router = useRouter();
  const currentUser = apiService.getCurrentUserSync();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: currentUser?.full_name || '',
    email: currentUser?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch {
      /* ignore */
    }
    setTimeout(() => router.replace('/login'), 0);
  };

  const handleUpdateProfile = async () => {
    if (!editForm.full_name || !editForm.email) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const response = await apiService.updateProfile(currentUser?.username || '', editForm);
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditModal(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await apiService.updateProfile(currentUser?.username || '', {
        password: passwordForm.newPassword,
      });
      if (response.success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleUploadPicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll access is required to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setLoadingMessage('Uploading...');
    try {
      const response = await apiService.uploadProfilePic(result.assets[0].uri);
      if (response.success) {
        Alert.alert('Success', 'Profile picture updated!');
      } else {
        Alert.alert('Error', response.error || 'Failed to upload');
      }
    } catch {
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setLoadingMessage('');
    }
  };

  const menuItems = [
    {
      icon: 'person',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => setShowEditModal(true),
    },
    {
      icon: 'lock-closed',
      title: 'Change Password',
      subtitle: 'Update your security credentials',
      onPress: () => setShowPasswordModal(true),
    },
    {
      icon: 'image',
      title: 'Upload Profile Picture',
      subtitle: 'Change your avatar',
      onPress: handleUploadPicture,
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and configurations',
      onPress: () => Alert.alert('Info', 'Settings coming soon'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadPicture}>
              {currentUser?.profile_pic_url ? (
                <Image source={{ uri: currentUser.profile_pic_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {currentUser?.full_name?.charAt(0).toUpperCase() || defaultAvatarLetter}
                </Text>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{currentUser?.full_name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              <Text style={styles.profileRole}>{currentUser?.role}</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} onPress={item.onPress}>
            <Card style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color="#38BDF8" />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={editForm.full_name}
              onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
            />
            <Input
              label="Email"
              placeholder="Enter email"
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleUpdateProfile}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
              secureTextEntry
            />
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowPasswordModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Change"
                onPress={handleChangePassword}
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
  profileCard: {
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 20,
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
});
