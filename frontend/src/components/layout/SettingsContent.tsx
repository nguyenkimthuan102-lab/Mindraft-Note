import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useNoteStore } from '../../store/useNoteStore';

const THEME_OPTIONS: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Sáng', icon: 'sunny-outline' },
  { id: 'Tối', icon: 'moon-outline' },
  { id: 'Hệ thống', icon: 'desktop-outline' },
];

const VIEW_MODE_OPTIONS: { id: 'grid' | 'list'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'grid', label: 'Lưới', icon: 'grid-outline' },
  { id: 'list', label: 'Danh sách', icon: 'list-outline' },
];

export const SettingsContent = () => {
  const [activeTab] = useState('Giao diện');
  const [theme, setTheme] = useState('Tối');
  
  // Kết nối với Zustand Store
  const { viewMode, setViewMode } = useNoteStore();

  return (
    <View style={styles.contentRight}>
      <Text style={styles.paneTitle}>{activeTab}</Text>
      <Text style={styles.paneSub}>Tùy chỉnh Mindraft Note của bạn</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 30 }}>
        
        <Text style={styles.sectionHeading}>Chế độ giao diện</Text>
        <View style={styles.segmentRow}>
          {THEME_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setTheme(item.id)}
              style={[styles.segBtn, theme === item.id && styles.segBtnActive]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={theme === item.id ? colors.white : colors.black}
              />
              <Text style={[styles.segLabel, theme === item.id && { color: colors.white }]}>
                {item.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { marginTop: 30 }]}>Chế độ xem mặc định</Text>
        <View style={styles.segmentRow}>
          {VIEW_MODE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setViewMode(item.id)}
              style={[styles.segBtn, viewMode === item.id && styles.segBtnActive]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={viewMode === item.id ? colors.white : colors.black}
              />
              <Text style={[styles.segLabel, viewMode === item.id && { color: colors.white }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentRight: { flex: 1, padding: 32, backgroundColor: colors.white },
  paneTitle: { fontSize: 26, fontWeight: '800', color: colors.black },
  paneSub: { fontSize: 13, color: colors.grayText, marginTop: 4 },
  sectionHeading: { fontSize: 17, fontWeight: '700', marginBottom: 15, color: colors.black },
  segmentRow: { flexDirection: 'row' },
  segBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: colors.grayBorder, 
    marginRight: 12 
  },
  segBtnActive: { backgroundColor: colors.black, borderColor: colors.black },
  segLabel: { fontWeight: '600', fontSize: 14, marginLeft: 10, color: colors.black },
});