import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router'; // ✅ Dùng useRouter để chuyển trang mạnh mẽ hơn
import { Ionicons } from '@expo/vector-icons';

import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';
import { NoteList } from '../../src/components/notes/NoteList';
import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { fetchNotes as getNotes, updateNote as updateNoteApi, deleteNote as deleteNoteApi } from '../../src/api/noteApi';

export default function HomeScreen() {
  const router = useRouter(); // ✅ Khởi tạo router
  const { setSyncing, setDone, setError } = useSyncStore();
  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notes, setNotes, activeFilter, viewMode,
    openEditNote: openEditNoteStore,
    updateNote: updateNoteStore,
    deleteNote: deleteNoteStore,
  } = useNoteStore();

  useEffect(() => {
    clearSelection();
    setSyncing();
    const fetchRealData = async () => {
      try {
        const response = await getNotes(); 
        if (response) { setNotes(response as any); }
        setDone();
      } catch { 
        setError(); 
      }
    };
    fetchRealData();
  }, [clearSelection, setSyncing, setDone, setError, setNotes]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let result = notes;
    switch (activeFilter) {
      case 'all': result = notes.filter((n) => !n.is_archived && !n.is_trashed); break;
      case 'reminders': result = notes.filter((n) => n.reminder); break;
      case 'archive': result = notes.filter((n) => n.is_archived); break;
      case 'trash': result = notes.filter((n) => n.is_trashed); break;
      default: result = notes.filter((n) => n.tags?.includes(activeFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.content_text?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, activeFilter, searchQuery]);

  const handleUpdate = useCallback(async (id: string, changes: any) => {
    updateNoteStore(id, changes);
    try { await updateNoteApi(id, changes as any); } catch { /* ignore */ }
  }, [updateNoteStore]);

  const handleDelete = useCallback(async (id: string) => {
    deleteNoteStore(id);
    try { await deleteNoteApi(id); } catch { /* ignore */ }
  }, [deleteNoteStore]);

  const handleArchive = useCallback((id: string) => {
    handleUpdate(id, { is_archived: true });
  }, [handleUpdate]);

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.grayText} />
              <TextInput 
                placeholder="Tìm ghi chú..." 
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.grayText} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* ✅ Nút Settings dùng router.push để chuyển trang tuyệt đối */}
            <TouchableOpacity 
              style={styles.settingsBtn} 
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <QuickCapture />

          {pinnedNotes.length > 0 ? (
            <NoteList
              key={`pinned-${viewMode}`}
              title="Đã ghim"
              notes={pinnedNotes}
              viewMode={viewMode}
              onPressNote={openEditNoteStore}
              onUpdateNote={handleUpdate}
              onDeleteNote={handleDelete}
              onArchiveNote={handleArchive}
              selectedIds={selectedIds}
              onSelectNote={toggleSelect}
            />
          ) : null}

          {otherNotes.length > 0 ? (
            <NoteList
              key={`main-${viewMode}`}
              title={activeFilter === 'all' ? (pinnedNotes.length > 0 ? 'Khác' : 'Tất cả') : `#${activeFilter}`}
              notes={otherNotes}
              viewMode={viewMode}
              onPressNote={openEditNoteStore}
              onUpdateNote={handleUpdate}
              onDeleteNote={handleDelete}
              onArchiveNote={handleArchive}
              selectedIds={selectedIds}
              onSelectNote={toggleSelect}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Không tìm thấy ghi chú nào.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <NoteEditor />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPage },
  scroll: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  inner: { width: '100%', maxWidth: 600 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.grayBorder },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
  settingsBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: colors.grayBorder },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, color: '#999', fontSize: 15 },
});