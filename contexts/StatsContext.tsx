import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EventType = 'ping' | 'answered' | 'entrance';

export interface EventRecord {
  type: EventType;
  timestamp: number;
}

interface StatsContextValue {
  events: EventRecord[];
  addEvent: (type: EventType) => Promise<void>;
  resetToday: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('events');
        if (stored) {
          setEvents(JSON.parse(stored));
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  const save = async (next: EventRecord[]) => {
    setEvents(next);
    await AsyncStorage.setItem('events', JSON.stringify(next));
  };

  const addEvent = async (type: EventType) => {
    const event: EventRecord = { type, timestamp: Date.now() };
    const next = [...events, event];
    await save(next);
  };

  const resetToday = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const next = events.filter((e) => e.timestamp < start.getTime());
    await save(next);
  };

  return (
    <StatsContext.Provider value={{ events, addEvent, resetToday }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
};
