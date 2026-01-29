import { Book, BookContent } from '../types/book';
import {
  saveBook,
  saveBookContent,
  getBook,
  getAllBooks,
  getRecentBooks,
  getBookContent,
  deleteBook as deleteBookFromDB,
  updateBookLastOpened,
  initDB,
} from '../utils/storage';
import { parseTxtFile, extractTxtMetadata } from './parsers/txtParser';
import { parseEpubFile } from './parsers/epubParser';
import { parsePdfFile } from './parsers/pdfParser';

// 支持的文件格式
export type SupportedFormat = 'txt' | 'epub' | 'pdf';

/**
 * 书籍服务类
 */
class BookService {
  private initialized = false;

  /**
   * 初始化服务
   */
  async init() {
    if (!this.initialized) {
      await initDB();
      this.initialized = true;
    }
  }

  /**
   * 导入书籍文件
   */
  async importBook(file: File): Promise<Book> {
    await this.init();

    console.log('bookService: 开始导入书籍', file.name);
    const format = this.getFileFormat(file.name);
    if (!format) {
      throw new Error(`不支持的文件格式: ${file.name}`);
    }

    let book: Book;
    let content: BookContent;

    try {
      switch (format) {
        case 'txt':
          console.log('bookService: 解析 TXT 文件');
          book = await this.importTxtBook(file);
          content = await parseTxtFile(file);
          break;
        case 'epub':
          console.log('bookService: 解析 EPUB 文件');
          const epubResult = await parseEpubFile(file);
          book = this.createBookFromEpub(file, epubResult.metadata);
          content = epubResult.content;
          break;
        case 'pdf':
          console.log('bookService: 解析 PDF 文件');
          const pdfResult = await parsePdfFile(file);
          book = this.createBookFromPdf(file, pdfResult.metadata);
          content = pdfResult.content;
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }

      console.log('bookService: 解析完成，书籍信息 =', book);
      console.log('bookService: 内容章节数 =', content.chapters.length);

      // 保存书籍信息和内容
      await saveBook(book);
      await saveBookContent(book.id, JSON.stringify(content));

      console.log('bookService: 保存成功');

      return book;
    } catch (error) {
      console.error('bookService: 导入书籍失败:', error);
      throw error;
    }
  }

  /**
   * 导入 TXT 书籍
   */
  private async importTxtBook(file: File): Promise<Book> {
    const text = await file.text();
    const metadata = extractTxtMetadata(file.name, text);

    return {
      id: this.generateBookId(),
      title: metadata.title,
      author: metadata.author,
      format: 'txt',
      cover: this.generateDefaultCover(metadata.title),
      addedAt: Date.now(),
      lastOpened: Date.now(),
      progress: 0,
      totalPages: this.estimatePages(text),
      currentPage: 1,
    };
  }

  /**
   * 从 EPUB 元数据创建书籍
   */
  private createBookFromEpub(
    file: File,
    metadata: {
      title: string;
      author: string;
      coverUrl?: string;
    }
  ): Book {
    return {
      id: this.generateBookId(),
      title: metadata.title,
      author: metadata.author,
      format: 'epub',
      cover: metadata.coverUrl || this.generateDefaultCover(metadata.title),
      addedAt: Date.now(),
      lastOpened: Date.now(),
      progress: 0,
      totalPages: 100, // EPUB 暂时估算
      currentPage: 1,
    };
  }

  /**
   * 从 PDF 元数据创建书籍
   */
  private createBookFromPdf(
    file: File,
    metadata: {
      title: string;
      author: string;
    }
  ): Book {
    return {
      id: this.generateBookId(),
      title: metadata.title,
      author: metadata.author,
      format: 'pdf',
      cover: this.generateDefaultCover(metadata.title),
      addedAt: Date.now(),
      lastOpened: Date.now(),
      progress: 0,
      totalPages: 100, // PDF 页数在解析时获取
      currentPage: 1,
    };
  }

  /**
   * 获取书籍
   */
  async getBook(bookId: string): Promise<Book | undefined> {
    await this.init();
    return await getBook(bookId);
  }

  /**
   * 获取书籍内容
   */
  async getBookContent(bookId: string): Promise<BookContent | undefined> {
    await this.init();
    const contentStr = await getBookContent(bookId);
    if (contentStr) {
      try {
        return JSON.parse(contentStr);
      } catch (error) {
        console.error('解析书籍内容失败:', error);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * 获取所有书籍
   */
  async getAllBooks(): Promise<Book[]> {
    await this.init();
    return await getAllBooks();
  }

  /**
   * 获取最近打开的书籍
   */
  async getRecentBooks(limit: number = 10): Promise<Book[]> {
    await this.init();
    return await getRecentBooks(limit);
  }

  /**
   * 删除书籍
   */
  async deleteBook(bookId: string): Promise<void> {
    await this.init();
    await deleteBookFromDB(bookId);
  }

  /**
   * 打开书籍（更新最后打开时间）
   */
  async openBook(bookId: string): Promise<void> {
    await this.init();
    await updateBookLastOpened(bookId);
  }

  /**
   * 更新阅读进度
   */
  async updateProgress(
    bookId: string,
    currentPage: number,
    totalPages: number,
    progress: number
  ): Promise<void> {
    await this.init();
    const book = await getBook(bookId);
    if (book) {
      book.currentPage = currentPage;
      book.totalPages = totalPages;
      book.progress = progress;
      await saveBook(book);
    }
  }

  /**
   * 获取文件格式
   */
  private getFileFormat(filename: string): SupportedFormat | null {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'txt':
        return 'txt';
      case 'epub':
        return 'epub';
      case 'pdf':
        return 'pdf';
      default:
        return null;
    }
  }

  /**
   * 生成书籍 ID
   */
  private generateBookId(): string {
    return `book-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 生成默认封面（使用首字母）
   */
  private generateDefaultCover(title: string): string {
    const firstChar = title.charAt(0).toUpperCase();
    const colors = [
      '#2563eb', // 蓝色
      '#dc2626', // 红色
      '#16a34a', // 绿色
      '#9333ea', // 紫色
      '#ea580c', // 橙色
      '#0891b2', // 青色
    ];
    const color = colors[title.length % colors.length];

    // 创建 SVG 数据 URL
    const svg = `
      <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" fill="${color}"/>
        <text x="50%" y="50%" 
              font-family="Arial, sans-serif" 
              font-size="120" 
              font-weight="bold" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">
          ${firstChar}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 估算页数（基于文本长度）
   */
  private estimatePages(text: string): number {
    const CHARS_PER_PAGE = 1500; // 假设每页 1500 字符
    return Math.ceil(text.length / CHARS_PER_PAGE);
  }
}

// 导出单例
export const bookService = new BookService();
