import axiosClient from './axiosClient';

export interface MediaData {
  id: string;
  note: string;
  uploaded_by: string;
  file_url: string;
  file_type: string;
  file_size: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

// Upload ảnh lên note
export const uploadNoteImage = async (
  noteId: string,
  file: File | { uri: string; name: string; type: string }
): Promise<MediaData> => {
  const formData = new FormData();

  if (file instanceof File) {
    // Web
    formData.append('file', file);
  } else {
    // Mobile (React Native)
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  }

  return axiosClient.post(`/notes/${noteId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};

// Lấy danh sách ảnh của note
export const getNoteMedia = (noteId: string): Promise<MediaData[]> =>
  axiosClient.get(`/notes/${noteId}/media/list/`).then(res => res.data);

// Xóa ảnh
export const deleteMedia = (mediaId: string): Promise<void> =>
  axiosClient.delete(`/notes/media/${mediaId}/delete/`);