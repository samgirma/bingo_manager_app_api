import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, icon, color = '#38BDF8' }: StatCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    flex: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38BDF8',
    textAlign: 'center',
  },
});
