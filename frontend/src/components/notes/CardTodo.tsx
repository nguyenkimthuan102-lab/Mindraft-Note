import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { NoteCardData } from './NoteCard';

export const CardTodo = ({ note, onPress }: { note: NoteCardData, onPress: () => void }) => {
  const displayItems = note.todo_items?.slice(0, 3);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{note.title || 'To-do List'}</Text>
      
      {displayItems?.map(item => (
        <View key={item.id} style={styles.todoItem}>
          <Ionicons 
            name={item.is_completed ? "checkbox" : "square-outline"} 
            size={16} 
            color={item.is_completed ? colors.primary : colors.grayText} 
          />
          <Text style={[styles.todoText, item.is_completed && styles.completedText]}>
            {item.title}
          </Text>
        </View>
      ))}

      {note.todo_total && note.todo_total > 3 && (
        <Text style={styles.moreText}>+ {note.todo_total - 3} tasks khác...</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.grayBorder },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 12 },
  todoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  todoText: { fontSize: 14, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: colors.grayText },
  moreText: { fontSize: 12, color: colors.grayText, marginTop: 4, fontStyle: 'italic' }
});