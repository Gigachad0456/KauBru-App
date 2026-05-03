import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../config/theme';

interface Props {
  label?: string; placeholder?: string; value: string;
  onChangeText: (text: string) => void; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean; numberOfLines?: number; style?: ViewStyle;
}

export default function InputField({ label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'sentences', multiline = false, numberOfLines = 1, style }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused]}>
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 44, textAlignVertical: 'top' }]}
          placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
          value={value} onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType} autoCapitalize={autoCapitalize}
          multiline={multiline} numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: SPACING.xs }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginBottom: SPACING.xs, letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  focused: { borderColor: COLORS.primary, backgroundColor: COLORS.bgCard },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: SPACING.md },
});
