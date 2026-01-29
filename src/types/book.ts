// 书籍类型定义
export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string; // Base64 或 URL
  format: 'epub' | 'pdf' | 'txt';
  filePath: string;
  fileSize: number;
  totalPages: number;
  currentPage: number;
  progress: number; // 0-100
  lastReadAt: Date;
  createdAt: Date;
}

export interface BookContent {
  bookId: string;
  chapters: Chapter[];
  content: string;
}

export interface Chapter {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
}
