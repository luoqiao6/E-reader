import ePub, { Book as EpubBook } from 'epubjs';
import { BookContent, Chapter } from '../../types/book';

/**
 * 解析 EPUB 文件
 */
export async function parseEpubFile(file: File): Promise<{
  content: BookContent;
  metadata: {
    title: string;
    author: string;
    publisher?: string;
    description?: string;
    coverUrl?: string;
  };
}> {
  console.log('epubParser: 开始解析 EPUB 文件', file.name);
  
  try {
    // 创建 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('epubParser: ArrayBuffer 大小', arrayBuffer.byteLength);
    
    // 使用 epubjs 解析
    const book = ePub(arrayBuffer);
    console.log('epubParser: EPUB 实例创建成功');
    
    // 加载书籍
    await book.ready;
    console.log('epubParser: 书籍加载完成');
    
    // 获取元数据
    const metadata = await extractEpubMetadata(book);
    console.log('epubParser: 元数据提取完成', metadata);
    
    // 获取章节内容
    const chapters = await extractEpubChapters(book);
    console.log('epubParser: 章节提取完成，共', chapters.length, '章');
    
    if (chapters.length === 0) {
      console.warn('epubParser: 警告 - 未能提取到任何章节');
    }
    
    return {
      content: {
        format: 'epub',
        chapters,
        rawContent: '', // EPUB 不需要原始内容
      },
      metadata,
    };
  } catch (error) {
    console.error('epubParser: 解析失败', error);
    throw error;
  }
}

/**
 * 提取 EPUB 元数据
 */
async function extractEpubMetadata(book: EpubBook) {
  const metadata = await book.loaded.metadata;
  
  // 获取封面
  let coverUrl: string | undefined;
  try {
    const cover = await book.coverUrl();
    if (cover) {
      coverUrl = cover;
    }
  } catch (error) {
    console.warn('Failed to extract cover:', error);
  }

  return {
    title: metadata.title || '未知标题',
    author: metadata.creator || '未知作者',
    publisher: metadata.publisher,
    description: metadata.description,
    coverUrl,
  };
}

/**
 * 提取 EPUB 章节
 */
async function extractEpubChapters(book: EpubBook): Promise<Chapter[]> {
  console.log('epubParser: 开始提取章节');
  
  try {
    const spine = await book.loaded.spine;
    console.log('epubParser: Spine 加载完成，项目数:', spine.items.length);
    
    const navigation = await book.loaded.navigation;
    console.log('epubParser: Navigation 加载完成');
    
    const chapters: Chapter[] = [];
    
    // 尝试从目录获取章节信息
    const toc = navigation.toc || [];
    console.log('epubParser: TOC 项目数:', toc.length);
    
    if (toc.length > 0) {
      // 使用目录结构
      console.log('epubParser: 使用 TOC 提取章节');
      for (let i = 0; i < toc.length; i++) {
        const tocItem = toc[i];
        console.log(`epubParser: 处理 TOC 项 ${i + 1}:`, tocItem.label, tocItem.href);
        
        try {
          // 获取章节内容
          const section = book.spine.get(tocItem.href);
          if (section) {
            console.log(`epubParser: 找到 section，准备加载...`);
            await section.load(book.load.bind(book));
            console.log(`epubParser: section.load 完成`);
            
            // 使用改进的文本提取方法
            const textContent = await extractSectionText(section);
            console.log(`epubParser: 文本提取完成，长度:`, textContent.length);
            
            if (textContent.trim().length > 0) {
              chapters.push({
                id: `chapter-${i + 1}`,
                title: tocItem.label || `第 ${i + 1} 章`,
                content: textContent,
                order: i,
              });
              console.log(`epubParser: ✅ 章节 ${i + 1} 提取成功，标题: ${tocItem.label}, 内容长度:`, textContent.length);
            } else {
              console.warn(`epubParser: ⚠️ 章节 ${i + 1} 内容为空`);
            }
          } else {
            console.warn(`epubParser: 找不到章节 section:`, tocItem.href);
          }
        } catch (error) {
          console.error(`epubParser: ❌ 加载章节 ${i} 失败:`, error);
        }
      }
    } else {
      // 没有目录，使用 spine 顺序
      console.log('epubParser: TOC 为空，使用 Spine 提取章节');
      for (let i = 0; i < spine.items.length; i++) {
        const item = spine.items[i];
        console.log(`epubParser: 处理 Spine 项 ${i + 1}:`, item.href);
        
        try {
          const section = book.spine.get(item.href);
          if (section) {
            await section.load(book.load.bind(book));
            const textContent = await extractSectionText(section);
            
            // 跳过空章节和过短章节（可能是封面、版权页等）
            if (textContent.trim().length > 100) {
              chapters.push({
                id: `chapter-${chapters.length + 1}`,
                title: `第 ${chapters.length + 1} 部分`,
                content: textContent,
                order: chapters.length,
              });
              console.log(`epubParser: ✅ Spine 项 ${i + 1} 提取成功，内容长度:`, textContent.length);
            } else {
              console.log(`epubParser: ⏭️ Spine 项 ${i + 1} 内容太短 (${textContent.length}字符)，跳过`);
            }
          }
        } catch (error) {
          console.error(`epubParser: ❌ 加载 Spine 项 ${i} 失败:`, error);
        }
      }
    }

    console.log('epubParser: 章节提取完成，共提取', chapters.length, '章');
    return chapters;
  } catch (error) {
    console.error('epubParser: 提取章节时出错:', error);
    return [];
  }
}

/**
 * 从 Section 中提取文本内容
 */
async function extractSectionText(section: any): Promise<string> {
  try {
    // 方法1: 使用 section.output 获取内容
    if (section.output) {
      console.log('epubParser: 使用 section.output 提取文本');
      const text = extractTextFromHtml(section.output);
      if (text.trim().length > 0) {
        return text;
      }
    }

    // 方法2: 使用 section.document 获取内容
    if (section.document) {
      console.log('epubParser: 使用 section.document 提取文本');
      const text = extractTextFromHtml(section.document);
      if (text.trim().length > 0) {
        return text;
      }
    }

    // 方法3: 使用 section.contents 获取内容
    if (section.contents) {
      console.log('epubParser: 使用 section.contents 提取文本');
      const text = extractTextFromHtml(section.contents);
      if (text.trim().length > 0) {
        return text;
      }
    }

    // 方法4: 尝试直接获取文本内容
    if (typeof section.find === 'function') {
      console.log('epubParser: 使用 section.find 提取文本');
      const results = section.find('body');
      if (results && results.length > 0) {
        const text = results[0].textContent || results[0].innerText || '';
        if (text.trim().length > 0) {
          return text.trim();
        }
      }
    }

    console.warn('epubParser: ⚠️ 所有方法都无法提取文本，尝试其他方式');
    console.log('epubParser: section 对象属性:', Object.keys(section));
    
    return '';
  } catch (error) {
    console.error('epubParser: extractSectionText 失败:', error);
    return '';
  }
}

/**
 * 从 HTML 中提取纯文本（改进版）
 */
function extractTextFromHtml(html: string | Document | any): string {
  try {
    console.log('epubParser: extractTextFromHtml - 输入类型:', typeof html, html?.constructor?.name);

    // 处理 null 或 undefined
    if (html == null) {
      console.warn('epubParser: HTML 内容为 null 或 undefined');
      return '';
    }

    // 处理字符串
    if (typeof html === 'string') {
      console.log('epubParser: 处理 HTML 字符串，长度:', html.length);
      if (html.trim().length === 0) {
        return '';
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const text = doc.body?.textContent || doc.documentElement?.textContent || '';
      console.log('epubParser: 从字符串提取文本长度:', text.length);
      return text.trim();
    }

    // 处理 Document 对象
    if (html instanceof Document || html.nodeType === 9) {
      console.log('epubParser: 处理 Document 对象');
      const text = html.body?.textContent || html.documentElement?.textContent || '';
      console.log('epubParser: 从 Document 提取文本长度:', text.length);
      return text.trim();
    }

    // 处理 Element 对象
    if (html instanceof Element || html.nodeType === 1) {
      console.log('epubParser: 处理 Element 对象');
      const text = html.textContent || html.innerText || '';
      console.log('epubParser: 从 Element 提取文本长度:', text.length);
      return text.trim();
    }

    // 处理包含 outerHTML 的对象
    if (html.outerHTML) {
      console.log('epubParser: 处理包含 outerHTML 的对象');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html.outerHTML, 'text/html');
      const text = doc.body?.textContent || '';
      console.log('epubParser: 从 outerHTML 提取文本长度:', text.length);
      return text.trim();
    }

    // 处理包含 innerHTML 的对象
    if (html.innerHTML) {
      console.log('epubParser: 处理包含 innerHTML 的对象');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html.innerHTML, 'text/html');
      const text = doc.body?.textContent || '';
      console.log('epubParser: 从 innerHTML 提取文本长度:', text.length);
      return text.trim();
    }

    // 处理包含 textContent 的对象
    if (html.textContent) {
      console.log('epubParser: 处理包含 textContent 的对象');
      const text = html.textContent.trim();
      console.log('epubParser: 从 textContent 提取文本长度:', text.length);
      return text;
    }

    // 处理包含 innerText 的对象
    if (html.innerText) {
      console.log('epubParser: 处理包含 innerText 的对象');
      const text = html.innerText.trim();
      console.log('epubParser: 从 innerText 提取文本长度:', text.length);
      return text;
    }

    // 最后尝试转换为字符串
    console.warn('epubParser: ⚠️ 无法识别的 HTML 类型，尝试转换为字符串');
    console.log('epubParser: 对象属性:', Object.keys(html));
    const str = String(html || '');
    if (str && str !== '[object Object]') {
      return str.trim();
    }

    return '';
  } catch (error) {
    console.error('epubParser: ❌ 提取文本失败:', error);
    console.error('epubParser: 输入对象:', html);
    return '';
  }
}
