import React, { useMemo } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { useStats } from '@/contexts/StatsContext';

export default function HomeScreen() {
  const { events, addEvent, resetToday } = useStats();

  const counts = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return events
      .filter((e) => e.timestamp >= start.getTime())
      .reduce(
        (acc, e) => {
          acc[e.type]++;
          return acc;
        },
        { ping: 0, answered: 0, entrance: 0 } as Record<string, number>
      );
  }, [events]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button title={`ピンポン (${counts.ping})`} onPress={() => addEvent('ping')} />
        <Button title={`応答あり (${counts.answered})`} onPress={() => addEvent('answered')} />
        <Button title={`玄関対応 (${counts.entrance})`} onPress={() => addEvent('entrance')} />
      </View>
      <Text style={styles.total}>合計: {counts.ping + counts.answered + counts.entrance}</Text>
      <Button title="カウントリセット" onPress={resetToday} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  total: {
    fontSize: 20,
  },
});
