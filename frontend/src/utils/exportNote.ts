import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Platform } from 'react-native';
import { NoteCardData } from '../components/notes/NoteCard';

const isWeb = Platform.OS === 'web';

const sanitizeFileName = (name: string) => {
  if (!name) return 'note';
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>?/gm, '') // Xóa các thẻ HTML còn lại
    .replace(/\n\s*\n/g, '\n\n') // Xóa dòng trống thừa
    .trim();
};

const formatTodoTxt = (item: any, depth = 0): string => {
  const indent = '  '.repeat(depth);
  const mark = item.is_completed ? '[X]' : '[ ]';
  let text = `${indent}${mark} ${item.title}\n`;
  if (item.subtasks) {
    item.subtasks.forEach((sub: any) => {
      text += formatTodoTxt(sub, depth + 1);
    });
  }
  return text;
};

const getNoteTextContent = (note: NoteCardData) => {
  let content = '';
  if (note.title) content += `${note.title}\n\n`;
  if (note.type === 'text' && note.content_text) {
    content += stripHtml(note.content_text);
  } else if (note.type === 'todo' && note.todo_items) {
    note.todo_items.forEach(item => {
      content += formatTodoTxt(item);
    });
  }
  return content.trim();
};

// --- HÀM LƯU & CHIA SẺ FILE (Dùng chung) ---
const saveAndShareFile = async (uri: string, filename: string, mimeType: string, base64Data?: string) => {
  if (isWeb) {
    // Trên Web: Tạo thẻ <a> để tải xuống
    const a = document.createElement('a');
    a.href = base64Data ? `data:${mimeType};base64,${base64Data}` : uri;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // Trên Mobile: Chia sẻ/Lưu qua expo-sharing
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: 'Lưu hoặc chia sẻ ghi chú',
        UTI: mimeType // cho iOS
      });
    } else {
      alert('Không thể chia sẻ file trên thiết bị này.');
    }
  }
};


// 1. XUẤT TXT
export const exportToTxt = async (note: NoteCardData) => {
  try {
    const textContent = getNoteTextContent(note);
    const fileName = `${sanitizeFileName(note.title || 'note')}.txt`;
    
    if (isWeb) {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      await saveAndShareFile(url, fileName, 'text/plain');
      URL.revokeObjectURL(url);
    } else {
      const fileUri = `${documentDirectory}${fileName}`;
      await writeAsStringAsync(fileUri, textContent, { encoding: EncodingType.UTF8 });
      await saveAndShareFile(fileUri, fileName, 'text/plain');
    }
  } catch (error) {
    console.error('Lỗi khi xuất TXT:', error);
    alert('Có lỗi xảy ra khi xuất file .txt');
  }
};

// 2. XUẤT PDF
export const exportToPdf = async (note: NoteCardData) => {
  try {
    const fileName = `${sanitizeFileName(note.title || 'note')}.pdf`;
    
    // Xây dựng nội dung HTML
    let bodyHtml = '';
    if (note.type === 'text' && note.content_text) {
      // Nếu là text từ web đã có sẵn HTML, ta bọc lại. Nếu là text thuần, ta thay \n bằng <br>
      bodyHtml = note.content_text.includes('<') ? note.content_text : note.content_text.replace(/\n/g, '<br>');
    } else if (note.type === 'todo' && note.todo_items) {
      const renderTodoHtml = (item: any) => {
        const mark = item.is_completed ? '&#9746;' : '&#9744;'; // Checkbox checked / unchecked unicode
        let html = `<li style="list-style-type: none; margin-bottom: 4px;">
          <span style="font-size: 1.2em; margin-right: 8px;">${mark}</span>
          <span style="text-decoration: ${item.is_completed ? 'line-through' : 'none'}; color: ${item.is_completed ? '#666' : '#000'};">
            ${item.title}
          </span>
        `;
        if (item.subtasks && item.subtasks.length > 0) {
          html += `<ul style="padding-left: 20px; margin-top: 4px;">`;
          item.subtasks.forEach((sub: any) => {
            html += renderTodoHtml(sub);
          });
          html += `</ul>`;
        }
        html += `</li>`;
        return html;
      };

      bodyHtml = `<ul style="padding-left: 0;">`;
      note.todo_items.forEach(item => {
        bodyHtml += renderTodoHtml(item);
      });
      bodyHtml += `</ul>`;
    }

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            h1 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          ${note.title ? `<h1>${note.title}</h1>` : ''}
          <div style="font-size: 16px;">
            ${bodyHtml}
          </div>
        </body>
      </html>
    `;

    if (isWeb) {
      // Tải script từ CDN để tránh lỗi Metro bundler resolving packages
      if (!(window as any).html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const html2pdf = (window as any).html2pdf;
      
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as any;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // html2pdf.js tự động tải file xuống trình duyệt
      html2pdf().set(opt).from(tempDiv).save();
    } else {
      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent
      });

      await saveAndShareFile(uri, fileName, 'application/pdf');
    }
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
    alert('Có lỗi xảy ra khi xuất file .pdf');
  }
};

// 3. XUẤT DOCX
export const exportToDocx = async (note: NoteCardData) => {
  try {
    const fileName = `${sanitizeFileName(note.title || 'note')}.docx`;
    
    const children: any[] = [];

    // Thêm Title
    if (note.title) {
      children.push(
        new Paragraph({
          text: note.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );
    }

    // Thêm Content
    if (note.type === 'text' && note.content_text) {
      const textOnly = stripHtml(note.content_text);
      const lines = textOnly.split('\n');
      lines.forEach(line => {
        children.push(
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 100 }
          })
        );
      });
    } else if (note.type === 'todo' && note.todo_items) {
      const addDocxTodo = (item: any, depth = 0) => {
        const mark = item.is_completed ? '[X]' : '[ ]';
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${mark} ${item.title}` })],
            indent: { left: depth * 720 }, // 720 twips = 0.5 inch
            spacing: { after: 100 }
          })
        );
        if (item.subtasks) {
          item.subtasks.forEach((sub: any) => {
            addDocxTodo(sub, depth + 1);
          });
        }
      };
      
      note.todo_items.forEach(item => {
        addDocxTodo(item, 0);
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    const base64Data = await Packer.toBase64String(doc);

    if (isWeb) {
      await saveAndShareFile('', fileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', base64Data);
    } else {
      const fileUri = `${documentDirectory}${fileName}`;
      await writeAsStringAsync(fileUri, base64Data, { encoding: EncodingType.Base64 });
      await saveAndShareFile(fileUri, fileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
  } catch (error) {
    console.error('Lỗi khi xuất DOCX:', error);
    alert('Có lỗi xảy ra khi xuất file .docx');
  }
};
