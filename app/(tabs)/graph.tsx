import React, { useMemo, useState } from 'react';
import { View, Button } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryStack } from 'victory-native';
import { useStats } from '@/contexts/StatsContext';

type Scope = 'day' | 'week' | 'month';

export default function GraphScreen() {
  const { events } = useStats();
  const [scope, setScope] = useState<Scope>('day');

  const data = useMemo(() => {
    const now = new Date();
    let start = new Date(now);
    if (scope === 'day') start.setHours(0, 0, 0, 0);
    if (scope === 'week') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }
    if (scope === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    const filtered = events.filter((e) => e.timestamp >= start.getTime());
    const buckets: Record<number, { ping: number; answered: number; entrance: number }> = {};
    filtered.forEach((e) => {
      const d = new Date(e.timestamp);
      const hour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
      if (!buckets[hour]) buckets[hour] = { ping: 0, answered: 0, entrance: 0 };
      buckets[hour][e.type]++;
    });
    const hours = Object.keys(buckets)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    return hours.map((h) => ({
      hour: new Date(h).getHours(),
      ...buckets[h],
    }));
  }, [events, scope]);

  const pingData = data.map((d) => ({ x: d.hour, y: d.ping }));
  const answeredData = data.map((d) => ({ x: d.hour, y: d.answered }));
  const entranceData = data.map((d) => ({ x: d.hour, y: d.entrance }));

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button title="日" onPress={() => setScope('day')} />
        <Button title="週" onPress={() => setScope('week')} />
        <Button title="月" onPress={() => setScope('month')} />
      </View>
      <VictoryChart domainPadding={{ x: 10 }}>
        <VictoryAxis dependentAxis />
        <VictoryAxis tickFormat={(t) => `${t}h`} />
        <VictoryStack>
          <VictoryBar data={pingData} style={{ data: { fill: '#4e79a7' } }} />
          <VictoryBar data={answeredData} style={{ data: { fill: '#59a14f' } }} />
          <VictoryBar data={entranceData} style={{ data: { fill: '#e15759' } }} />
        </VictoryStack>
      </VictoryChart>
    </View>
  );
}
