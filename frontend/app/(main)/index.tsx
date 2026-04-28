import { ScrollView, StyleSheet, View } from 'react-native';
import { NoteCard, NoteCardData } from '../../src/components/notes/NoteCard';
import { QuickCapture } from '../../src/components/notes/QuickCapture';
import { SectionLabel } from '../../src/components/ui/SectionLabel';
import { colors } from '../../src/constants/colors';

// Mock data khớp với mockup
const PINNED_NOTES: NoteCardData[] = [
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
];

const OTHER_NOTES: NoteCardData[] = [
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
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <QuickCapture />

        <SectionLabel label="Đã ghim" />
        {PINNED_NOTES.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}

        <SectionLabel label="Khác" />
        {OTHER_NOTES.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </View>
    </ScrollView>
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