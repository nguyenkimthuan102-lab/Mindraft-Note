import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useAppStore } from '@/src/store/useAppStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const { theme } = useAppStore();
  const router = useRouter();
  const isDark = theme === 'dark';
  
  const { 
    notifications, loading, loadNotifications, 
    readNotificationAction, readAllNotificationsAction, deleteNotificationAction 
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const c = {
    bg: isDark ? '#111827' : '#f9fafb',
    card: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    sub: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    unread: isDark ? '#1e3a8a' : '#eff6ff',
  };

  const handleNotificationPress = async (item: any) => {
    if (item.is_read === 0) {
      await readNotificationAction(item.id);
    }
    // Kiểm tra và điều hướng nhanh đến note tương ứng
    if (item.note) {
      router.push(`/note/${item.note}`); 
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Trung tâm thông báo</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={readAllNotificationsAction}>
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.center} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color={c.sub} />
              <Text style={[styles.emptyText, { color: c.sub }]}>Không có thông báo nào</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = item.is_read === 0;
            return (
              <View style={[styles.cardWrapper, { borderBottomColor: c.border }]}>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: isUnread ? c.unread : c.card }]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={item.type === 'reminder' ? 'bell' : 'file-document-edit'}
                      size={22}
                      color={isUnread ? '#3b82f6' : c.sub}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bodyText, { color: c.text, fontWeight: isUnread ? '600' : '400' }]}>
                      {item.payload?.message || item.payload?.note_title || 'Bạn có thông báo mới'}
                    </Text>
                    <Text style={[styles.timeText, { color: c.sub }]}>
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => deleteNotificationAction(item.id)}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: 'Inter-Bold' },
  readAllText: { color: '#3b82f6', fontFamily: 'Inter-Medium', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 8, fontSize: 14, fontFamily: 'Inter-Regular' },
  cardWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  card: { flex: 1, flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' },
  bodyText: { fontSize: 14, fontFamily: 'Inter-Regular', lineHeight: 20 },
  timeText: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 4 },
  deleteBtn: { padding: 14, justifyContent: 'center', alignItems: 'center' }
});