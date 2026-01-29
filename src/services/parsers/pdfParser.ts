import * as pdfjsLib from 'pdfjs-dist';
import { BookContent, Chapter } from '../../types/book';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * 解析 PDF 文件
 */
export async function parsePdfFile(file: File): Promise<{
  content: BookContent;
  metadata: {
    title: string;
    author: string;
    subject?: string;
    keywords?: string;
  };
}> {
  console.log('pdfParser: 开始解析 PDF 文件', file.name);
  
  const arrayBuffer = await file.arrayBuffer();
  console.log('pdfParser: ArrayBuffer 大小', arrayBuffer.byteLength);
  
  // 加载 PDF
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  console.log('pdfParser: PDF 加载完成，总页数:', pdf.numPages);
  
  // 获取元数据
  const metadataObj = await pdf.getMetadata();
  const metadata = {
    title: metadataObj.info?.Title || file.name.replace(/\.pdf$/i, ''),
    author: metadataObj.info?.Author || '未知作者',
    subject: metadataObj.info?.Subject,
    keywords: metadataObj.info?.Keywords,
  };
  console.log('pdfParser: 元数据提取完成', metadata);
  
  // 提取所有页面的文本
  const chapters = await extractPdfPages(pdf);
  console.log('pdfParser: 章节提取完成，共', chapters.length, '章');
  
  return {
    content: {
      format: 'pdf',
      chapters,
      rawContent: '', // PDF 不需要原始内容
    },
    metadata,
  };
}

/**
 * 提取 PDF 所有页面
 */
async function extractPdfPages(pdf: pdfjsLib.PDFDocumentProxy): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const totalPages = pdf.numPages;
  
  // 每 20 页作为一章（可根据需要调整）
  const pagesPerChapter = 20;
  const totalChapters = Math.ceil(totalPages / pagesPerChapter);
  
  for (let chapterIndex = 0; chapterIndex < totalChapters; chapterIndex++) {
    const startPage = chapterIndex * pagesPerChapter + 1;
    const endPage = Math.min((chapterIndex + 1) * pagesPerChapter, totalPages);
    
    let chapterContent = '';
    
    // 提取该章节的所有页面
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // 合并文本项
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        chapterContent += `\n\n--- 第 ${pageNum} 页 ---\n\n${pageText}`;
      } catch (error) {
        console.warn(`Failed to extract page ${pageNum}:`, error);
      }
    }
    
    chapters.push({
      id: `chapter-${chapterIndex + 1}`,
      title: `第 ${chapterIndex + 1} 部分 (第 ${startPage}-${endPage} 页)`,
      content: chapterContent.trim(),
      order: chapterIndex,
    });
  }

  return chapters;
}

/**
 * 提取单个页面的文本
 */
export async function extractPageText(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  
  return textContent.items.map((item: any) => item.str).join(' ');
}
