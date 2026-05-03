import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speak, stopSpeech } from '../services/speech';
import { COLORS, RADIUS } from '../config/theme';

interface Props {
  text: string; language?: 'en' | 'kb'; size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle; label?: string; showLabel?: boolean;
}

export default function SpeakButton({ text, language = 'en', size = 'md', style }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 17;
  const btnSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  const handlePlay = async () => {
    setSpeaking(true);
    await speak(text, language);
    // Rough estimate for resetting state if onDone isn't reliable in some environments
    setTimeout(() => setSpeaking(false), Math.max(text.length * 80, 2000));
  };

  const handleStop = async () => {
    await stopSpeech();
    setSpeaking(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={handlePlay} 
        activeOpacity={0.7}
        style={[
          styles.btn, 
          { width: btnSize, height: btnSize },
          speaking && styles.btnActive
        ]}
      >
        <Ionicons 
          name={speaking ? "volume-high" : "play"} 
          size={iconSize} 
          color={speaking ? COLORS.primary : COLORS.textSecondary} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStop}
        activeOpacity={0.7}
        style={[styles.btn, styles.stopBtn, { width: btnSize, height: btnSize }]}
        disabled={!speaking}
      >
        <Ionicons name="stop" size={iconSize - 2} color={speaking ? COLORS.error : COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { 
    borderRadius: RADIUS.sm, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgGreenLight,
  },
  stopBtn: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  }
});
