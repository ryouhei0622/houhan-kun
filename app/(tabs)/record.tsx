import React, { useEffect, useState } from 'react';
import { View, Button, FlatList, Text, Modal, TextInput, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ListItem {
  uri: string;
  name: string;
}

export default function RecordScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<ListItem[]>([]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('recordings');
      if (stored) setRecordings(JSON.parse(stored));
    })();
  }, []);

  const saveRecordings = async (list: ListItem[]) => {
    setRecordings(list);
    await AsyncStorage.setItem('recordings', JSON.stringify(list));
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.log('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setTempUri(uri ?? null);
    setNameInput('');
    setPromptVisible(true);
  };

  const confirmName = async () => {
    if (!tempUri) return;
    const baseDir = FileSystem.documentDirectory + 'recordings/';
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
    const name = nameInput.trim() || new Date().toISOString().replace(/[:.]/g, '-');
    const dest = baseDir + name + '.m4a';
    await FileSystem.moveAsync({ from: tempUri, to: dest });
    const list = [...recordings, { uri: dest, name }];
    await saveRecordings(list);
    setPromptVisible(false);
    setTempUri(null);
  };

  const playSound = async (uri: string) => {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title={recording ? '停止' : '録音開始'} onPress={recording ? stopRecording : startRecording} />
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            <Button title="再生" onPress={() => playSound(item.uri)} />
          </View>
        )}
      />
      <Modal transparent visible={promptVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>ファイル名</Text>
            <TextInput value={nameInput} onChangeText={setNameInput} style={styles.input} />
            <Button title="保存" onPress={confirmName} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: '#fff', padding: 16, width: 250 },
  input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 8, padding: 4 },
});
