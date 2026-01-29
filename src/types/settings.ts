// 阅读设置类型定义
export interface ReaderSettings {
  fontFamily: string;
  fontSize: number;
  letterSpacing: 'tight' | 'normal' | 'wide';
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'Playfair Display',
  fontSize: 20,
  letterSpacing: 'normal',
  lineHeight: 1.8,
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
};
