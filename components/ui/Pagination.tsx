import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PaginationProps {
  activeIndex?: number;
  total?: number;
}

export default function Pagination({ activeIndex = 0, total = 3 }: PaginationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.dotsContainer}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    width: 100,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666',
  },
  dotActive: {
    backgroundColor: '#FFD700',
  },
});
