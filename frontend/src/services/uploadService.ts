import { Attachment } from '../components/notes/NoteCard';

export async function uploadFileMock(
  fileUri: string,
  fileName: string,
  mimeType?: string,
  size?: number
): Promise<Attachment> {
  // Giả lập thời gian chờ upload (1.5 giây)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Phân loại định dạng
  let type: 'image' | 'document' | 'video' | 'other' = 'other';
  if (mimeType?.startsWith('image/')) {
    type = 'image';
  } else if (mimeType?.startsWith('video/')) {
    type = 'video';
  } else if (
    mimeType?.startsWith('application/pdf') ||
    mimeType?.includes('word') ||
    mimeType?.includes('excel') ||
    mimeType?.includes('text') ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.docx')
  ) {
    type = 'document';
  }

  // Trả về file đã "upload" (Tạm thời dùng chính fileUri cục bộ để hiển thị)
  return {
    id: `mock-file-${Date.now()}`,
    url: fileUri,
    name: fileName,
    type,
    size,
    mimeType,
  };
}
