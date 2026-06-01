// ─────────────────────────────────────────────────────────────────────────────
// TagMenu.tsx
//
// Export 2 component:
//   1. TagMenu      — string-based, dùng trong NoteEditor (giữ nguyên gốc)
//   2. NoteTagMenu  — Tag-object-based, dùng trong NoteCard (mới, full API)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import {
  getTags,
  createTag,
  addTagToNote,
  removeTagFromNote,
  Tag,
} from '../../api/tagApi';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TagMenu — string-based (GIỮ NGUYÊN cho NoteEditor)
// ═══════════════════════════════════════════════════════════════════════════════

interface TagMenuProps {
  noteTags: string[];
  allTags: string[];
  onToggleTag: (tag: string) => void;
  onCreateTag: (tag: string) => void;
}

export function TagMenu({ noteTags, allTags, onToggleTag, onCreateTag }: TagMenuProps) {
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() =>
    allTags.filter(t => t.toLowerCase().includes(search.toLowerCase())),
    [search, allTags]
  );

  const showCreateOption = search.trim().length > 0 && !allTags.includes(search.trim());

  return (
    <View style={legacyStyles.container}>
      <Text style={legacyStyles.title}>Ghi chú nhãn</Text>
      <View style={legacyStyles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Nhập tên nhãn"
          style={legacyStyles.input}
          autoFocus
          onSubmitEditing={() => {
            if (showCreateOption) {
              onCreateTag(search.trim());
              setSearch('');
            }
          }}
        />
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
      </View>

      <ScrollView style={legacyStyles.list} keyboardShouldPersistTaps="handled">
        {filteredTags.map((tag) => (
          <TouchableOpacity key={tag} style={legacyStyles.tagItem} onPress={() => onToggleTag(tag)}>
            <MaterialCommunityIcons
              name={noteTags.includes(tag) ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20} color={colors.textSecondary}
            />
            <Text style={legacyStyles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCreateOption && (
        <TouchableOpacity
          style={legacyStyles.createBtn}
          onPress={() => { onCreateTag(search.trim()); setSearch(''); }}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textSecondary} />
          <Text style={legacyStyles.createText}>{`Tạo "${search.trim()}"`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const legacyStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', borderRadius: 8, width: 220, paddingVertical: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  title: { fontSize: 14, paddingHorizontal: 16, paddingVertical: 8, color: colors.textPrimary, fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 13, height: 35, outlineStyle: 'none' } as any,
  list: { maxHeight: 180 },
  tagItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tagText: { fontSize: 13, color: colors.textSecondary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  createText: { fontSize: 13, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. NoteTagMenu — Tag-object-based (MỚI cho NoteCard, full API)
// ═══════════════════════════════════════════════════════════════════════════════

interface NoteTagMenuProps {
  noteId: string;
  noteTags: Tag[];
  onTagsChange: (updatedTags: Tag[]) => void;
  onClose?: () => void;
}

export function NoteTagMenu({ noteId, noteTags, onTagsChange, onClose }: NoteTagMenuProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [localNoteTags, setLocalNoteTags] = useState<Tag[]>(noteTags);

  const inputRef = useRef<TextInput>(null);

  const SAVING_NEW = 'new';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTags();
        setAllTags(data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const filteredTags = useMemo(() =>
    allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase().trim())),
    [allTags, search]
  );

  const trimmed = search.trim();
  const exactMatch = allTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
  const showCreateOption = trimmed.length > 0 && !exactMatch;

  const isTagActive = (tagId: string) => localNoteTags.some(t => t.id === tagId);

  const handleToggle = async (tag: Tag) => {
    if (saving) return;
    const active = isTagActive(tag.id);

    const updated = active
      ? localNoteTags.filter(t => t.id !== tag.id)
      : [...localNoteTags, tag];

    setLocalNoteTags(updated);
    onTagsChange(updated);
    setSaving(tag.id);

    try {
      if (active) {
        await removeTagFromNote(noteId, tag.id);
      } else {
        await addTagToNote(noteId, tag.id);
      }
    } catch {
      setLocalNoteTags(localNoteTags);
      onTagsChange(localNoteTags);
      Alert.alert('Lỗi', 'Không thể cập nhật nhãn. Vui lòng thử lại.');
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!trimmed || saving) return;
    setSaving(SAVING_NEW);
    try {
      const newTag = await createTag(trimmed);
      await addTagToNote(noteId, newTag.id);
      const updatedAll = [...allTags, newTag];
      const updatedNote = [...localNoteTags, newTag];
      setAllTags(updatedAll);
      setLocalNoteTags(updatedNote);
      onTagsChange(updatedNote);
      setSearch('');
      // ✅ Sync sang AppStore để Sidebar cập nhật ngay
      useAppStore.getState().setTags(updatedAll);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'TAG_ALREADY_EXISTS') {
        Alert.alert('Lỗi', 'Nhãn này đã tồn tại.');
      } else {
        Alert.alert('Lỗi', 'Không thể tạo nhãn. Vui lòng thử lại.');
      }
    } finally {
      setSaving(null);
    }
  };

  const dc = {
    bg: isDark ? '#1F2937' : '#fff',
    border: isDark ? '#374151' : colors.borderDefault,
    title: isDark ? '#F9FAFB' : colors.textPrimary,
    text: isDark ? '#D1D5DB' : colors.textSecondary,
    muted: isDark ? '#6B7280' : colors.textTertiary,
    inputBg: isDark ? '#111827' : colors.gray100,
    inputBorder: isDark ? '#374151' : colors.borderDefault,
    checkActive: colors.primary,
    checkInactive: isDark ? '#4B5563' : colors.gray300,
    createBg: isDark ? '#064E3B' : colors.primarySubtle,
    createText: isDark ? '#34d399' : colors.primary,
    separator: isDark ? '#374151' : '#F3F4F6',
  };

  return (
    <View style={[newStyles.container, { backgroundColor: dc.bg, borderColor: dc.border }]}>

      <View style={[newStyles.header, { borderBottomColor: dc.separator }]}>
        <Text style={[newStyles.title, { color: dc.title }]}>Ghi chú nhãn</Text>
      </View>

      <View style={[newStyles.searchRow, { backgroundColor: dc.inputBg, borderColor: dc.inputBorder }]}>
        <MaterialCommunityIcons name="magnify" size={16} color={dc.muted} style={{ marginRight: 6 }} />
        <TextInput
          ref={inputRef}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm hoặc tạo nhãn..."
          placeholderTextColor={dc.muted}
          style={[newStyles.input, { color: dc.title }]}
          returnKeyType="done"
          onSubmitEditing={showCreateOption ? handleCreate : undefined}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color={dc.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={newStyles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={newStyles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredTags.length === 0 && !showCreateOption ? (
          <View style={newStyles.emptyRow}>
            <Text style={[newStyles.emptyText, { color: dc.muted }]}>
              {search ? 'Không tìm thấy nhãn' : 'Chưa có nhãn nào'}
            </Text>
          </View>
        ) : (
          filteredTags.map((tag) => {
            const active = isTagActive(tag.id);
            const isSavingThis = saving === tag.id;
            return (
              <TouchableOpacity
                key={tag.id}
                style={newStyles.tagItem}
                onPress={() => handleToggle(tag)}
                activeOpacity={0.7}
                disabled={!!saving}
              >
                {isSavingThis ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ width: 18, height: 18 }} />
                ) : (
                  <View style={[
                    newStyles.checkbox,
                    {
                      borderColor: active ? dc.checkActive : dc.checkInactive,
                      backgroundColor: active ? dc.checkActive : 'transparent',
                    },
                  ]}>
                    {active && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
                  </View>
                )}
                <MaterialCommunityIcons
                  name="label-outline"
                  size={16}
                  color={active ? dc.checkActive : dc.muted}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    newStyles.tagText,
                    { color: active ? dc.checkActive : dc.text },
                    active && { fontFamily: 'Inter-Medium' },
                  ]}
                  numberOfLines={1}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {showCreateOption && (
        <TouchableOpacity
          style={[newStyles.createRow, { borderTopColor: dc.separator, backgroundColor: dc.createBg }]}
          onPress={handleCreate}
          activeOpacity={0.75}
          disabled={saving === SAVING_NEW}
        >
          {saving === SAVING_NEW ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={dc.createText} />
          )}
          <Text style={[newStyles.createText, { color: dc.createText }]} numberOfLines={1}>
            {`Tạo nhãn "${trimmed}"`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const newStyles = StyleSheet.create({
  container: {
    borderRadius: 10,
    width: 248,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.13)' } as any,
      default: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.13, shadowRadius: 12, elevation: 8,
      },
    }),
  },
  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 13, letterSpacing: 0.3 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 10, marginVertical: 8,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, height: 36,
  },
  input: {
    flex: 1, fontSize: 13, fontFamily: 'Inter-Regular', height: 36,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  list: { maxHeight: 220 },
  loadingRow: { paddingVertical: 20, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 13 },
  tagItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tagText: { fontFamily: 'Inter-Regular', fontSize: 13, flex: 1 },
  createRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  createText: { fontFamily: 'Inter-SemiBold', fontSize: 13, flex: 1 },
});