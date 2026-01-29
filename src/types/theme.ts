// 主题类型定义
export interface Theme {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  settings: ThemeSettings;
  createdAt?: Date;
}

export interface ThemeSettings {
  fontFamily: string;
  fontSize: number;
  letterSpacing: 'tight' | 'normal' | 'wide';
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
}

// 预设主题
export const PRESET_THEMES: Theme[] = [
  {
    id: 'light',
    name: '浅色主题',
    type: 'preset',
    settings: {
      fontFamily: 'Playfair Display',
      fontSize: 20,
      letterSpacing: 'normal',
      lineHeight: 1.8,
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
    },
  },
  {
    id: 'dark',
    name: '深色主题',
    type: 'preset',
    settings: {
      fontFamily: 'Playfair Display',
      fontSize: 20,
      letterSpacing: 'normal',
      lineHeight: 1.8,
      backgroundColor: '#1A1A1A',
      textColor: '#E0E0E0',
    },
  },
  {
    id: 'warm',
    name: '暖色主题',
    type: 'preset',
    settings: {
      fontFamily: 'Playfair Display',
      fontSize: 20,
      letterSpacing: 'normal',
      lineHeight: 1.8,
      backgroundColor: '#F5F1E8',
      textColor: '#3A3A3A',
    },
  },
];
