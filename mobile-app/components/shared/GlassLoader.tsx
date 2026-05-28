import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

interface GlassLoaderProps {
  visible: boolean;
  message?: string;
}

export default function GlassLoader({ visible, message }: GlassLoaderProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.glassPane}>
          <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
            <Ionicons name="sync" size={40} color="#38BDF8" />
          </Animated.View>
          {message && <Text style={styles.label}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassPane: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  label: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
