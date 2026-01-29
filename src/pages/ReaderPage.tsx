import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useBookStore } from '../stores/bookStore';
import SettingsPanel from '../components/Reader/SettingsPanel';
import styles from './ReaderPage.module.css';

interface ReaderPageProps {
  bookId: string;
  onClose: () => void;
}

const ReaderPage: React.FC<ReaderPageProps> = ({ bookId, onClose }) => {
  const { settings } = useSettingsStore();
  const { currentBook, currentBookContent, openBook } = useBookStore();
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [loadedChaptersCount, setLoadedChaptersCount] = useState(3); // 初始加载3章
  const [currentVisibleChapter, setCurrentVisibleChapter] = useState(0); // 当前可见章节
  const readerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 加载书籍
  useEffect(() => {
    console.log('ReaderPage: 开始加载书籍，bookId =', bookId);
    openBook(bookId);
  }, [bookId, openBook]);

  // 调试：查看加载的数据
  useEffect(() => {
    console.log('ReaderPage: currentBook =', currentBook);
    console.log('ReaderPage: currentBookContent =', currentBookContent);
    if (currentBookContent) {
      console.log('ReaderPage: 章节数量 =', currentBookContent.chapters.length);
      console.log('ReaderPage: 初始加载章节数 =', loadedChaptersCount);
    }
  }, [currentBook, currentBookContent]);

  // 重置加载的章节数
  useEffect(() => {
    if (currentBookContent) {
      setLoadedChaptersCount(Math.min(3, currentBookContent.chapters.length));
      chapterRefs.current = [];
    }
  }, [currentBookContent]);

  // 应用阅读设置
  useEffect(() => {
    if (readerRef.current) {
      const element = readerRef.current;
      element.style.setProperty('--reader-font-family', settings.fontFamily);
      element.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
      element.style.setProperty('--reader-line-height', `${settings.lineHeight}`);
      element.style.setProperty('--reader-letter-spacing', getLetterSpacing(settings.letterSpacing));
      element.style.setProperty('--reader-bg-color', settings.backgroundColor);
      element.style.setProperty('--reader-text-color', settings.textColor);
    }
  }, [settings]);

  const getLetterSpacing = (value: string): string => {
    const map: Record<string, string> = {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
    };
    return map[value] || '0';
  };

  // 监听滚动，动态加载更多章节
  useEffect(() => {
    const readerElement = readerRef.current;
    if (!readerElement || !currentBookContent) return;

    let isLoading = false;

    const handleScroll = () => {
      if (isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = readerElement;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      // 当滚动到距离底部 800px 时，加载下一章
      if (scrollBottom < 800 && loadedChaptersCount < currentBookContent.chapters.length) {
        console.log('ReaderPage: 接近底部，加载下一章');
        isLoading = true;
        
        // 延迟一点，避免过于频繁
        setTimeout(() => {
          setLoadedChaptersCount(prev => {
            const newCount = Math.min(prev + 1, currentBookContent.chapters.length);
            console.log('ReaderPage: 已加载章节数:', newCount);
            return newCount;
          });
          isLoading = false;
        }, 300);
      }
    };

    readerElement.addEventListener('scroll', handleScroll);
    
    return () => {
      readerElement.removeEventListener('scroll', handleScroll);
    };
  }, [loadedChaptersCount, currentBookContent]);

  // 使用 IntersectionObserver 检测当前可见章节
  useEffect(() => {
    if (!currentBookContent || chapterRefs.current.length === 0) return;

    const observerOptions = {
      root: readerRef.current,
      rootMargin: '-20% 0px -20% 0px', // 中间60%区域
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chapterIndex = Number(entry.target.getAttribute('data-chapter-index'));
          if (!isNaN(chapterIndex)) {
            setCurrentVisibleChapter(chapterIndex);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [loadedChaptersCount, currentBookContent]);

  // 快速跳转到指定章节
  const handleJumpToChapter = (chapterIndex: number) => {
    if (chapterIndex < 0 || !currentBookContent) return;
    
    // 如果目标章节还未加载，先加载到该章节
    if (chapterIndex >= loadedChaptersCount) {
      setLoadedChaptersCount(chapterIndex + 1);
    }
    
    // 滚动到目标章节
    setTimeout(() => {
      const targetRef = chapterRefs.current[chapterIndex];
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (!currentBook) {
    return (
      <div className={styles.readerPage}>
        <div className={styles.loading}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!currentBookContent || !currentBookContent.chapters || currentBookContent.chapters.length === 0) {
    return (
      <div className={styles.readerPage}>
        <header className={styles.topBar}>
          <div className={styles.leftNav}>
            <button className={styles.backBtn} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <span className={styles.bookTitle}>{currentBook.title}</span>
          </div>
        </header>
        <div className={styles.divider}></div>
        <div className={styles.errorContainer}>
          <p className={styles.errorTitle}>无法加载书籍内容</p>
          <p className={styles.errorMessage}>
            {!currentBookContent ? '书籍内容数据为空' : '书籍没有章节'}
          </p>
          <p className={styles.errorHint}>
            请尝试重新导入此书籍，或联系技术支持。
          </p>
          <button className={styles.errorBtn} onClick={onClose}>
            返回书库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.readerPage}>
      {/* 顶部工具栏 */}
      <header className={styles.topBar}>
        <div className={styles.leftNav}>
          <button className={styles.backBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span className={styles.bookTitle}>{currentBook.title}</span>
        </div>
        <div className={styles.rightNav}>
          <button className={styles.iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </button>
          <button className={styles.iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button className={styles.iconBtn} onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m7.07-13.07l-4.24 4.24m-1.66 1.66l-4.24 4.24M23 12h-6m-6 0H1m17.07 7.07l-4.24-4.24m-1.66-1.66l-4.24-4.24"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.divider}></div>

      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        {/* 阅读区域 - 连续显示多个章节 */}
        <div ref={readerRef} className={styles.readerView}>
          <div className={styles.readerContent}>
            {currentBookContent && currentBookContent.chapters.length > 0 ? (
              <>
                {/* 渲染已加载的章节 */}
                {currentBookContent.chapters.slice(0, loadedChaptersCount).map((chapter, index) => (
                  <div
                    key={chapter.id}
                    ref={(el) => (chapterRefs.current[index] = el)}
                    data-chapter-index={index}
                    className={styles.chapterSection}
                  >
                    {/* 章节标题 */}
                    <h2 className={styles.chapterTitle}>{chapter.title}</h2>
                    
                    {/* 章节内容 */}
                    <div className={styles.chapterContent}>
                      {chapter.content.split('\n').map((paragraph, pIndex) => {
                        const trimmed = paragraph.trim();
                        return trimmed ? (
                          <p key={`${index}-${pIndex}`} className={styles.paragraph}>
                            {trimmed}
                          </p>
                        ) : (
                          <div key={`${index}-${pIndex}`} className={styles.spacer} />
                        );
                      })}
                    </div>

                    {/* 章节分隔线（最后一章不显示） */}
                    {index < loadedChaptersCount - 1 && (
                      <div className={styles.chapterDivider}>
                        <span className={styles.dividerText}>· · ·</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* 加载提示 */}
                {loadedChaptersCount < currentBookContent.chapters.length && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingSpinner}></div>
                    <p>继续向下滚动加载更多章节...</p>
                  </div>
                )}

                {/* 阅读完成提示 */}
                {loadedChaptersCount >= currentBookContent.chapters.length && (
                  <div className={styles.endOfBook}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <p>已完成全书阅读</p>
                    <p className={styles.endHint}>共 {currentBookContent.chapters.length} 章</p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noContent}>
                <p>暂无内容</p>
              </div>
            )}
          </div>
        </div>

        {/* 设置面板 */}
        {isSettingsPanelOpen && (
          <SettingsPanel onClose={() => setIsSettingsPanelOpen(false)} />
        )}
      </div>

      {/* 浮动章节指示器 */}
      {currentBookContent && (
        <div className={styles.chapterIndicator}>
          <span className={styles.indicatorText}>
            第 {currentVisibleChapter + 1} / {currentBookContent.chapters.length} 章
          </span>
          {loadedChaptersCount < currentBookContent.chapters.length && (
            <span className={styles.indicatorSubtext}>
              已加载 {loadedChaptersCount} 章
            </span>
          )}
        </div>
      )}

      {/* 底部进度条 */}
      <div className={styles.bottomBar}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${((currentVisibleChapter + 1) / (currentBookContent?.chapters.length || 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
