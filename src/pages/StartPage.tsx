import React, { useEffect, useState } from 'react';
import { useBookStore } from '../stores/bookStore';
import styles from './StartPage.module.css';

interface StartPageProps {
  onOpenBook: (bookId: string) => void;
}

const StartPage: React.FC<StartPageProps> = ({ onOpenBook }) => {
  const { books, loadBooks, importBook, deleteBook, isLoading, error } = useBookStore();
  const [importError, setImportError] = useState<string | null>(null);

  // 加载书籍列表
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleImportBook = async () => {
    try {
      setImportError(null);

      // 创建文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.epub,.pdf';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const book = await importBook(file);
            console.log('导入成功:', book);
            // 自动打开新导入的书籍
            onOpenBook(book.id);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '导入失败';
            setImportError(errorMsg);
            console.error('导入失败:', error);
          }
        }
      };

      input.click();
    } catch (error) {
      console.error('打开文件选择器失败:', error);
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发打开书籍

    if (!confirm(`确定要删除《${bookTitle}》吗？\n\n此操作将永久删除书籍及其所有数据，无法恢复。`)) {
      return;
    }

    try {
      await deleteBook(bookId);
      console.log('书籍删除成功:', bookTitle);
    } catch (error) {
      console.error('删除书籍失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className={styles.startPage}>
      {/* 顶部导航栏 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span className={styles.appName}>电子书阅读器</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </button>
          <button className={styles.iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m7.07-13.07l-4.24 4.24m-1.66 1.66l-4.24 4.24M23 12h-6m-6 0H1m17.07 7.07l-4.24-4.24m-1.66-1.66l-4.24-4.24"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.divider}></div>

      {/* 主内容区域 */}
      <main className={styles.mainContent}>
        {/* 欢迎区域 */}
        <section className={styles.heroSection}>
          <h1 className={styles.welcomeTitle}>欢迎使用电子书阅读器</h1>
          <p className={styles.welcomeSubtitle}>开始您的沉浸式阅读之旅</p>

          {/* 错误提示 */}
          {(importError || error) && (
            <div className={styles.errorMessage}>
              {importError || error}
            </div>
          )}

          <div className={styles.actionButtons}>
            <button
              className={styles.primaryBtn}
              onClick={handleImportBook}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{isLoading ? '导入中...' : '导入新书'}</span>
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={handleImportBook}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>打开文件</span>
            </button>
          </div>
          <p className={styles.supportedFormats}>支持格式：TXT、EPUB、PDF</p>
        </section>

        {/* 最近阅读区域 */}
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近阅读</h2>
            {books.length > 6 && (
              <button className={styles.viewAllLink}>
                <span>查看全部</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            )}
          </div>

          {books.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <p>还没有导入任何书籍</p>
              <p>点击上方按钮导入您的第一本电子书</p>
            </div>
          ) : (
            <div className={styles.bookGrid}>
              {books.slice(0, 6).map((book) => (
                <div
                  key={book.id}
                  className={styles.bookCard}
                  onClick={() => onOpenBook(book.id)}
                >
                  <div className={styles.bookCover}>
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    )}
                    
                    {/* 删除按钮 */}
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteBook(book.id, book.title, e)}
                      title="删除书籍"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.bookInfo}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>{book.author}</p>
                    <p className={styles.bookProgress}>
                      {book.progress > 0
                        ? `已阅 ${Math.round(book.progress)}%`
                        : '未开始'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StartPage;
