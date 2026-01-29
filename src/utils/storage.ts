import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book } from '../types/book';

// 数据库模式定义
interface EBookReaderDB extends DBSchema {
  books: {
    key: string; // bookId
    value: Book;
    indexes: {
      'by-lastOpened': number;
      'by-title': string;
    };
  };
  bookContent: {
    key: string; // bookId
    value: {
      id: string;
      content: string; // 书籍完整内容（JSON 字符串）
      updatedAt: number;
    };
  };
  readingProgress: {
    key: string; // bookId
    value: {
      bookId: string;
      currentPage: number;
      totalPages: number;
      scrollPosition: number;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'ebook-reader-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EBookReaderDB> | null = null;

/**
 * 初始化并打开数据库
 */
export async function initDB(): Promise<IDBPDatabase<EBookReaderDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<EBookReaderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建 books 表
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('by-lastOpened', 'lastOpened');
        bookStore.createIndex('by-title', 'title');
      }

      // 创建 bookContent 表
      if (!db.objectStoreNames.contains('bookContent')) {
        db.createObjectStore('bookContent', { keyPath: 'id' });
      }

      // 创建 readingProgress 表
      if (!db.objectStoreNames.contains('readingProgress')) {
        db.createObjectStore('readingProgress', { keyPath: 'bookId' });
      }
    },
  });

  return dbInstance;
}

/**
 * 获取数据库实例
 */
async function getDB(): Promise<IDBPDatabase<EBookReaderDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// ==================== 书籍 CRUD ====================

/**
 * 添加或更新书籍
 */
export async function saveBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

/**
 * 批量保存书籍
 */
export async function saveBooksInBatch(books: Book[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('books', 'readwrite');
  await Promise.all([...books.map((book) => tx.store.put(book)), tx.done]);
}

/**
 * 根据 ID 获取书籍
 */
export async function getBook(bookId: string): Promise<Book | undefined> {
  const db = await getDB();
  return await db.get('books', bookId);
}

/**
 * 获取所有书籍
 */
export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return await db.getAll('books');
}

/**
 * 获取最近打开的书籍
 */
export async function getRecentBooks(limit: number = 10): Promise<Book[]> {
  const db = await getDB();
  const index = db.transaction('books').store.index('by-lastOpened');
  const books = await index.getAll();
  // 按最近打开时间倒序排列
  return books.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, limit);
}

/**
 * 删除书籍
 */
export async function deleteBook(bookId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'bookContent', 'readingProgress'], 'readwrite');
  await Promise.all([
    tx.objectStore('books').delete(bookId),
    tx.objectStore('bookContent').delete(bookId),
    tx.objectStore('readingProgress').delete(bookId),
    tx.done,
  ]);
}

/**
 * 更新书籍的最后打开时间
 */
export async function updateBookLastOpened(bookId: string): Promise<void> {
  const db = await getDB();
  const book = await db.get('books', bookId);
  if (book) {
    book.lastOpened = Date.now();
    await db.put('books', book);
  }
}

// ==================== 书籍内容 ====================

/**
 * 保存书籍内容
 */
export async function saveBookContent(bookId: string, content: string): Promise<void> {
  const db = await getDB();
  await db.put('bookContent', {
    id: bookId,
    content,
    updatedAt: Date.now(),
  });
}

/**
 * 获取书籍内容
 */
export async function getBookContent(bookId: string): Promise<string | undefined> {
  const db = await getDB();
  const data = await db.get('bookContent', bookId);
  return data?.content;
}

// ==================== 阅读进度 ====================

/**
 * 保存阅读进度
 */
export async function saveReadingProgress(
  bookId: string,
  progress: {
    currentPage: number;
    totalPages: number;
    scrollPosition: number;
  }
): Promise<void> {
  const db = await getDB();
  await db.put('readingProgress', {
    bookId,
    ...progress,
    updatedAt: Date.now(),
  });
}

/**
 * 获取阅读进度
 */
export async function getReadingProgress(bookId: string) {
  const db = await getDB();
  return await db.get('readingProgress', bookId);
}

/**
 * 删除阅读进度
 */
export async function deleteReadingProgress(bookId: string): Promise<void> {
  const db = await getDB();
  await db.delete('readingProgress', bookId);
}

// ==================== 数据库维护 ====================

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'bookContent', 'readingProgress'], 'readwrite');
  await Promise.all([
    tx.objectStore('books').clear(),
    tx.objectStore('bookContent').clear(),
    tx.objectStore('readingProgress').clear(),
    tx.done,
  ]);
}

/**
 * 获取数据库统计信息
 */
export async function getDBStats() {
  const db = await getDB();
  const bookCount = await db.count('books');
  const contentCount = await db.count('bookContent');
  const progressCount = await db.count('readingProgress');

  return {
    bookCount,
    contentCount,
    progressCount,
  };
}
