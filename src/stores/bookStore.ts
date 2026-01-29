import { create } from 'zustand';
import { Book, BookContent } from '../types/book';
import { bookService } from '../services/bookService';

interface BookStore {
  books: Book[];
  currentBook: Book | null;
  currentBookContent: BookContent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBooks: () => Promise<void>;
  importBook: (file: File) => Promise<Book>;
  openBook: (bookId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  updateProgress: (bookId: string, page: number, progress: number) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  currentBook: null,
  currentBookContent: null,
  isLoading: false,
  error: null,

  // 加载所有书籍
  loadBooks: async () => {
    try {
      set({ isLoading: true, error: null });
      const books = await bookService.getRecentBooks(20);
      set({ books, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载书籍失败',
        isLoading: false,
      });
    }
  },

  // 导入新书籍
  importBook: async (file: File) => {
    try {
      set({ isLoading: true, error: null });
      const book = await bookService.importBook(file);
      set((state) => ({
        books: [book, ...state.books],
        isLoading: false,
      }));
      return book;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '导入书籍失败';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  // 打开书籍
  openBook: async (bookId: string) => {
    try {
      console.log('bookStore: 开始打开书籍，bookId =', bookId);
      set({ isLoading: true, error: null });

      const book = await bookService.getBook(bookId);
      console.log('bookStore: 获取到书籍信息 =', book);
      
      const content = await bookService.getBookContent(bookId);
      console.log('bookStore: 获取到书籍内容 =', content);

      if (!book) {
        throw new Error('书籍不存在');
      }

      if (!content) {
        console.warn('bookStore: 书籍内容为空');
      }

      // 更新最后打开时间
      await bookService.openBook(bookId);

      set({
        currentBook: book,
        currentBookContent: content || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('bookStore: 打开书籍失败', error);
      set({
        error: error instanceof Error ? error.message : '打开书籍失败',
        isLoading: false,
      });
    }
  },

  // 删除书籍
  deleteBook: async (bookId: string) => {
    try {
      set({ isLoading: true, error: null });
      await bookService.deleteBook(bookId);
      set((state) => ({
        books: state.books.filter((b) => b.id !== bookId),
        currentBook: state.currentBook?.id === bookId ? null : state.currentBook,
        currentBookContent: state.currentBook?.id === bookId ? null : state.currentBookContent,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除书籍失败',
        isLoading: false,
      });
    }
  },

  // 更新阅读进度
  updateProgress: async (bookId: string, page: number, progress: number) => {
    try {
      const book = get().books.find((b) => b.id === bookId);
      if (book) {
        await bookService.updateProgress(bookId, page, book.totalPages, progress);
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId
              ? { ...b, currentPage: page, progress, lastOpened: Date.now() }
              : b
          ),
        }));
      }
    } catch (error) {
      console.error('更新进度失败:', error);
    }
  },

  setError: (error: string | null) => set({ error }),
}));
