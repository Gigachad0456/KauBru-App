import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Header from '../components/Header';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { API_BASE_URL } from '../config/api';

/** Build a full URL for a server-relative path like /uploads/avatars/... */
function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export function validatePasswordLength(s: string): boolean {
  return s.trim().length >= 8;
}

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(fullUrl(user?.avatar_url));
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleSaveProfile = async () => {
    setProfileError(null);
    setProfileSuccess(false);

    if (newPassword && !validatePasswordLength(newPassword)) {
      setProfileError('New password must be at least 8 characters.');
      return;
    }

    const payload: { name?: string; current_password?: string; new_password?: string } = {};
    if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('No changes', 'Nothing to update.');
      return;
    }

    setSaving(true);
    try {
      await authAPI.updateProfile(payload);
      await refreshUser();
      setProfileSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) {
      const detail = e?.response?.data?.detail || 'Failed to update profile.';
      setProfileError(detail.toLowerCase().includes('current password') ? 'Current password is incorrect.' : detail);
    } finally {
      setSaving(false); }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        name: `avatar_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const res = await authAPI.uploadAvatar(formData);
      // Build full URL from the relative path returned by the server
      setAvatarUri(fullUrl(res.data.avatar_url));
      await refreshUser();
      Alert.alert('Success', 'Avatar updated successfully.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.detail || 'Could not upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <Header title="Edit Profile" showBack={true} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            style={{ position: 'relative', marginBottom: SPACING.sm }}
            accessibilityRole="button"
            accessibilityLabel="Change avatar photo"
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.bgCard, ...SHADOW.md }}
              />
            ) : (
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.bgGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bgCard, ...SHADOW.md }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: COLORS.white }}>{initials}</Text>
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bgCard }}>
              <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Tap to change photo</Text>
        </View>

        {/* Name */}
        <View style={{ backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md }}>Personal Information</Text>
          <InputField
            label="Display Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Password */}
        <View style={{ backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md }}>Change Password</Text>
          <InputField
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <InputField
            label="New Password (min. 8 characters)"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Error */}
        {profileError && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#FEF2F2', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error + '40', padding: SPACING.md, marginBottom: SPACING.md }}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={{ flex: 1, fontSize: 13, color: COLORS.error }}>{profileError}</Text>
          </View>
        )}

        {/* Success */}
        {profileSuccess && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#F0FDF4', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.success + '40', padding: SPACING.md, marginBottom: SPACING.md }}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={{ flex: 1, fontSize: 13, color: COLORS.success }}>Profile updated successfully!</Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={saving}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: SPACING.md + 2, alignItems: 'center', opacity: saving ? 0.6 : 1, ...SHADOW.md }}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


