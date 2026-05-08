import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { NoteCardData } from './NoteCard';

export const CardText = ({ note, onPress }: { note: NoteCardData, onPress: () => void }) => {
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: note.color === 'yellow' ? '#FFF9C4' : colors.white }]} 
      onPress={onPress}
    >
      {note.title ? <Text style={styles.title}>{note.title}</Text> : null}
      <Text style={styles.content} numberOfLines={10}>
        {note.content_text}
      </Text>
      
      <View style={styles.tagRow}>
        {note.tags?.map(tag => (
          <Text key={tag} style={styles.tagText}>#{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.grayBorder },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#111' },
  content: { fontSize: 14, color: '#444', lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' }
});