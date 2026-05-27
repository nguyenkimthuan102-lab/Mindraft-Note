import axiosClient from './axiosClient';

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

// ─── 4. TAGS ──────────────────────────────────────────────────

// 4.1 Lấy danh sách tag
export const getTags = (): Promise<Tag[]> =>
  axiosClient.get('/tags/').then(res => res.data.data);

// 4.2 Tạo tag mới
export const createTag = (name: string): Promise<Tag> =>
  axiosClient.post('/tags/', { name }).then(res => res.data.data);

// 4.3 Đổi tên tag
export const renameTag = (id: string, name: string): Promise<Tag> =>
  axiosClient.patch(`/tags/${id}/`, { name }).then(res => res.data.data);

// 4.4 Xóa tag (soft delete)
export const deleteTag = (id: string): Promise<void> =>
  axiosClient.delete(`/tags/${id}/`);

// ─── 5. NOTE TAGS ─────────────────────────────────────────────

// 5.1 Gắn tag vào note
export const addTagToNote = (
  noteId: string,
  tagId: string
): Promise<{ note_id: string; tag_id: string }> =>
  axiosClient
    .post(`/notes/${noteId}/tags/`, { tag_id: tagId })
    .then(res => res.data.data);

// 5.2 Gỡ tag khỏi note
export const removeTagFromNote = (
  noteId: string,
  tagId: string
): Promise<void> =>
  axiosClient.delete(`/notes/${noteId}/tags/${tagId}/`);