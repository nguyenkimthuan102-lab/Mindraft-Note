import { ScrollView, StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import { NoteCard, NoteCardData } from '../../src/components/notes/NoteCard';
import { QuickCapture } from '../../src/components/notes/QuickCapture';
import { SectionLabel } from '../../src/components/ui/SectionLabel';
import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore'; // Import store

const MOCK_NOTES: NoteCardData[] = [
  {
    id: '1',
    type: 'text',
    color: 'yellow',
    title: 'Ghi chú...',
    content_text: 'CA Grow\n\nThứ hai, 18:00\n\nLocation: Offline. Similar team leads for each initiative before end of month.',
    is_pinned: true,
    tags: ['work', 'planning'],
    collaborators: [{ name: 'Alice' }, { name: 'Bob' }],
  },
  {
    id: '2',
    type: 'todo',
    color: 'default',
    title: 'Shopping List',
    is_pinned: true,
    tags: ['personal'],
    date: '25/4/2026',
    todo_items: [
      { id: 't1', title: 'Milk & eggs', is_completed: false },
      { id: 't2', title: 'Bread', is_completed: false },
      { id: 't3', title: 'Coffee beans', is_completed: false },
      { id: 't4', title: 'Butter', is_completed: false },
      { id: 't5', title: 'Orange juice', is_completed: true },
      { id: 't6', title: 'Yogurt', is_completed: true },
    ],
    todo_total: 6,
    todo_completed: 2,
  },
  {
    id: '3',
    type: 'text',
    color: 'blue',
    title: 'Project Ideas',
    content_text: 'Some thoughts on the upcoming Q3 product roadmap and feature prioritization.',
    tags: ['work', 'ideas'],
  },
  {
    id: '4',
    type: 'todo',
    color: 'green',
    title: 'Weekly Tasks',
    tags: ['personal'],
    date: '28/4/2026',
    todo_items: [
      { id: 'w1', title: 'Review PR #42', is_completed: true },
      { id: 'w2', title: 'Update documentation', is_completed: false },
      { id: 'w3', title: 'Team sync meeting', is_completed: false },
    ],
    todo_total: 3,
    todo_completed: 1,
  },
];

export default function HomeScreen() {
  const { setSyncing, setDone, setError } = useSyncStore();
  const [notes, setNotes] = useState<NoteCardData[]>([]);

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  useEffect(() => {
    clearSelection();
    setSyncing();
    const load = async () => {
      try {
        await new Promise(res => setTimeout(res, 1000));
        setNotes(MOCK_NOTES);
        setDone();
      } catch {
        setError();
      }
    };
    load();
  }, []);

  const handleUpdate = (id: string, changes: Partial<NoteCardData>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
  };

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleArchive = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    // TODO: apiRequest(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ is_archived: true }) })
  };

  const pinned = notes.filter(n => n.is_pinned);
  const others = notes.filter(n => !n.is_pinned);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <QuickCapture />

          {pinned.length > 0 && (
            <>
              <SectionLabel label="Đã ghim" />
              {pinned.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  // Truyền trạng thái chọn từ Store/State cha xuống
                  isSelected={selectedIds.includes(note.id)}
                  onSelect={() => toggleSelect(note.id)}
                />
              ))}
            </>
          )}

          {others.length > 0 && (
            <>
              <SectionLabel label="Khác" />
              {others.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedIds.includes(note.id)}
                  onSelect={() => toggleSelect(note.id)}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  inner: {
    width: '100%',
    maxWidth: 720,
  },
});