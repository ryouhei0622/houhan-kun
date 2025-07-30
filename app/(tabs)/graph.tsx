import { useStats } from '@/contexts/StatsContext';
import React, { useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { CartesianChart, StackedBar } from 'victory-native';

type Scope = 'day' | 'week' | 'month';

interface Row {
  hour: number;
  ping: number;
  answered: number;
  entrance: number;
}

const COLORS = ['#4e79a7', '#59a14f', '#e15759'] as const;

export default function GraphScreen() {
  const { events } = useStats();
  const [scope, setScope] = useState<Scope>('day');

  /** ★ 正しく Row[] を返す */
  const rows = useMemo<Row[]>(() => {
    const now = new Date();
    const start = new Date(now);
    if (scope === 'day') start.setHours(0, 0, 0, 0);
    if (scope === 'week') { start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); }
    if (scope === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }

    const buckets: Record<number, Omit<Row, 'hour'>> = {};
    events
      .filter(e => e.timestamp >= start.getTime())
      .forEach(e => {
        const d = new Date(e.timestamp);
        const key = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
        if (!buckets[key]) buckets[key] = { ping: 0, answered: 0, entrance: 0 };
        buckets[key][e.type as keyof typeof buckets[key]] += 1;
      });

    return Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map(k => ({ hour: new Date(k).getHours(), ...buckets[k] }));
  }, [events, scope]);

  return (
    <View style={styles.root}>
      <View style={styles.btnRow}>
        <Button title="日" onPress={() => setScope('day')} />
        <Button title="週" onPress={() => setScope('week')} />
        <Button title="月" onPress={() => setScope('month')} />
      </View>

      {/* ★ ジェネリックを明示 */}
      <CartesianChart<Row, 'hour', ['ping', 'answered', 'entrance']>
        style={styles.chart}
        data={rows}
        xKey="hour"
        yKeys={['ping', 'answered', 'entrance'] as const}
        domainPadding={{ left: 16, right: 16 }}
        axisOptions={{
          formatXLabel: v => `${v}h`,
          tickCount: { x: 24, y: 4 },
        }}
      >
        {({ points, chartBounds }) => (
          <StackedBar
            points={points}
            chartBounds={chartBounds}
            barWidth={12}
            colors={COLORS}
          />
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  chart: { flex: 1 },
});
