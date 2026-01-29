import { BookContent, Chapter } from '../../types/book';

/**
 * 解析 TXT 文件
 */
export async function parseTxtFile(file: File): Promise<BookContent> {
  console.log('txtParser: 开始解析 TXT 文件', file.name);
  
  const text = await file.text();
  console.log('txtParser: 文件内容长度', text.length);
  
  // 按章节分割（简单实现：按"第X章"或"Chapter X"分割）
  const chapters = splitIntoChapters(text);
  console.log('txtParser: 识别到', chapters.length, '个章节');
  
  // 如果没有找到章节标记，将整个文本作为一章
  if (chapters.length === 0) {
    console.log('txtParser: 未找到章节标记，将整个文本作为一章');
    chapters.push({
      id: 'chapter-1',
      title: '正文',
      content: text,
      order: 0,
    });
  }

  console.log('txtParser: 解析完成');
  return {
    format: 'txt',
    chapters,
    rawContent: text,
  };
}

/**
 * 将文本分割成章节
 */
function splitIntoChapters(text: string): Chapter[] {
  const chapters: Chapter[] = [];
  
  // 匹配章节标题的正则表达式
  // 支持：第一章、第1章、Chapter 1、CHAPTER 1 等格式
  const chapterRegex = /^(第[零一二三四五六七八九十百千\d]+章|Chapter\s+\d+|CHAPTER\s+\d+)(.*)$/gim;
  
  const matches = [...text.matchAll(chapterRegex)];
  
  if (matches.length === 0) {
    return [];
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const chapterTitle = match[1].trim();
    const chapterSubtitle = match[2].trim();
    const fullTitle = chapterSubtitle ? `${chapterTitle} ${chapterSubtitle}` : chapterTitle;
    
    const startIndex = match.index!;
    const endIndex = nextMatch ? nextMatch.index! : text.length;
    
    const content = text.substring(startIndex, endIndex).trim();
    
    chapters.push({
      id: `chapter-${i + 1}`,
      title: fullTitle,
      content,
      order: i,
    });
  }

  return chapters;
}

/**
 * 从 TXT 内容中提取元数据（简单实现）
 */
export function extractTxtMetadata(filename: string, text: string) {
  // 从文件名提取标题
  const title = filename.replace(/\.txt$/i, '');
  
  // 尝试从前几行提取作者信息
  const lines = text.split('\n').slice(0, 10);
  let author = '未知作者';
  
  for (const line of lines) {
    const authorMatch = line.match(/作者[：:]\s*(.+)/i) || line.match(/Author[：:]\s*(.+)/i);
    if (authorMatch) {
      author = authorMatch[1].trim();
      break;
    }
  }

  return {
    title,
    author,
  };
}
