import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import {
  uploadNoteImage,
  getNoteMedia,
  deleteMedia,
  MediaData,
} from '../../api/mediaApi';

interface Props {
  noteId: string;
  isDark?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

export const NoteImageUploader = ({ noteId, isDark = false, triggerRef }: Props) => {
  const [images, setImages] = useState<MediaData[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const c = {
    bg:     isDark ? '#1f2937' : '#f9fafb',
    border: isDark ? '#374151' : '#e5e7eb',
    text:   isDark ? '#f9fafb' : '#111827',
    sub:    isDark ? '#9ca3af' : '#6b7280',
  };

  // Load ảnh hiện có khi mở note
  useEffect(() => {
    if (!noteId || noteId.startsWith('temp-')) return;
    getNoteMedia(noteId)
      .then(data => setImages(data))
      .catch(() => {});
  }, [noteId]);

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleUpload = async (file: File | { uri: string; name: string; type: string }) => {
    if (!noteId || noteId.startsWith('temp-')) {
      Alert.alert('', 'Hãy lưu ghi chú trước khi thêm ảnh.');
      return;
    }
    setUploading(true);
    try {
      const media = await uploadNoteImage(noteId, file);
      setImages(prev => [...prev, media]);
    } catch {
      Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  // Web: dùng input file ẩn
  const handleWebPick = () => {
    fileInputRef.current?.click();
  };

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    e.target.value = ''; // reset để chọn lại cùng file được
  };

  // Mobile: dùng expo-image-picker
  const handleMobilePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('', 'Cần quyền truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() ?? 'image.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      handleUpload({ uri: asset.uri, name, type });
    }
  };

  const onPickPress = () => {
    if (Platform.OS === 'web') handleWebPick();
    else handleMobilePick();
  };

  // Gán onPickPress vào triggerRef để parent có thể gọi từ toolbar
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = onPickPress;
    }
    return () => {
      if (triggerRef) triggerRef.current = null;
    };
  }, [triggerRef, noteId]);

  // ── Xóa ảnh ────────────────────────────────────────────────────────────
  const handleDelete = (mediaId: string) => {
    const doDelete = async () => {
      try {
        await deleteMedia(mediaId);
        setImages(prev => prev.filter(m => m.id !== mediaId));
      } catch {
        Alert.alert('Lỗi', 'Không thể xóa ảnh.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Xóa ảnh này?')) doDelete();
    } else {
      Alert.alert('Xóa ảnh', 'Bạn muốn xóa ảnh này?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Không hiển thị gì nếu note chưa lưu và không có ảnh
  if (noteId.startsWith('temp-') && images.length === 0) return null;

  return (
    <View style={styles.container}>

      {/* Danh sách ảnh đã upload */}
      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map(media => (
            <View key={media.id} style={[styles.imageWrap, { borderColor: c.border }]}>
              <Image
                source={{ uri: media.file_url }}
                style={styles.image}
                resizeMode="cover"
              />
              {/* Nút xóa ảnh */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(media.id)}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Nút upload */}
      <TouchableOpacity
        onPress={onPickPress}
        style={[styles.uploadBtn, { borderColor: c.border, backgroundColor: c.bg }]}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="image-plus" size={18} color={c.sub} />
        )}
        <Text style={[styles.uploadText, { color: c.sub }]}>
          {uploading ? 'Đang tải...' : 'Thêm hình ảnh'}
        </Text>
      </TouchableOpacity>

      {/* Input file ẩn cho Web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange as any}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#fff',
    borderRadius: 9,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  uploadText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
});