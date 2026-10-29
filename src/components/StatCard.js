import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';

export default function StatCard({ label, value, tone }) {
  return (
    <View style={[styles.card, { backgroundColor: tone || palette.branco }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginRight: 12,
    minHeight: 96,
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.bordoEscuro,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.cinzaMedio,
  },
});
