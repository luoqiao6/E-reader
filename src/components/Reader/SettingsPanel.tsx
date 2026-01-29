import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeStore } from '../../stores/themeStore';
import Dropdown, { DropdownOption } from '../UI/Dropdown';
import ColorPicker from '../UI/ColorPicker';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  onClose: () => void;
}

// 字体选项
const FONT_OPTIONS: DropdownOption[] = [
  { label: 'Playfair Display（衬线）', value: 'Playfair Display' },
  { label: 'Inter（无衬线）', value: 'Inter' },
];

// 字间距选项
const LETTER_SPACING_OPTIONS: DropdownOption[] = [
  { label: '紧凑', value: 'tight' },
  { label: '标准', value: 'normal' },
  { label: '宽松', value: 'wide' },
];

// 行距选项
const LINE_HEIGHT_OPTIONS: DropdownOption[] = [
  { label: '1.5', value: 1.5 },
  { label: '1.8', value: 1.8 },
  { label: '2.0', value: 2.0 },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const {
    themes,
    activeThemeId,
    isCustomMode,
    applyTheme,
    saveTheme,
    deleteTheme,
    setCustomMode,
  } = useThemeStore();

  const [themeName, setThemeName] = useState('');

  // 预设主题
  const presetThemes = themes.filter((t) => t.type === 'preset');
  // 自定义主题
  const customThemes = themes.filter((t) => t.type === 'custom');

  const handleThemeSelect = (themeId: string) => {
    applyTheme(themeId);
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setCustomMode(true); // 手动修改设置后切换到自定义模式
  };

  const handleSaveTheme = () => {
    if (themeName.trim()) {
      saveTheme(themeName, settings);
      setThemeName('');
    }
  };

  return (
    <div className={styles.panel}>
      {/* 头部 */}
      <div className={styles.header}>
        <h3 className={styles.title}>阅读设置</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={styles.divider}></div>

      {/* 设置内容 */}
      <div className={styles.content}>
        {/* 字体选择 */}
        <div className={styles.section}>
          <label className={styles.label}>字体</label>
          <Dropdown
            value={settings.fontFamily}
            options={FONT_OPTIONS}
            onChange={(value) => handleSettingChange('fontFamily', value)}
          />
        </div>

        {/* 字号调节 */}
        <div className={styles.section}>
          <label className={styles.label}>字号</label>
          <div className={styles.sizeControl}>
            <button
              className={styles.sizeBtn}
              onClick={() => handleSettingChange('fontSize', Math.max(14, settings.fontSize - 1))}
              disabled={settings.fontSize <= 14}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span className={styles.sizeValue}>{settings.fontSize}</span>
            <button
              className={styles.sizeBtn}
              onClick={() => handleSettingChange('fontSize', Math.min(32, settings.fontSize + 1))}
              disabled={settings.fontSize >= 32}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 字间距选择 */}
        <div className={styles.section}>
          <label className={styles.label}>字间距</label>
          <Dropdown
            value={settings.letterSpacing}
            options={LETTER_SPACING_OPTIONS}
            onChange={(value) => handleSettingChange('letterSpacing', value)}
          />
        </div>

        {/* 行距选择 */}
        <div className={styles.section}>
          <label className={styles.label}>行距</label>
          <Dropdown
            value={settings.lineHeight}
            options={LINE_HEIGHT_OPTIONS}
            onChange={(value) => handleSettingChange('lineHeight', value)}
          />
        </div>

        {/* 主题选择 */}
        <div className={styles.section}>
          <label className={styles.label}>主题</label>
          <div className={styles.themeGrid}>
            {presetThemes.map((theme) => (
              <button
                key={theme.id}
                className={`${styles.themeCard} ${
                  activeThemeId === theme.id && !isCustomMode ? styles.themeCardActive : ''
                }`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {theme.id === 'light' && <circle cx="12" cy="12" r="5"></circle>}
                  {theme.id === 'dark' && (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  )}
                  {theme.id === 'warm' && (
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  )}
                </svg>
                <span>{theme.name.replace('主题', '')}</span>
              </button>
            ))}
            {/* 自定义主题按钮 */}
            <button
              className={`${styles.themeCard} ${isCustomMode ? styles.themeCardActive : ''}`}
              onClick={() => {}}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
              <span>自定义</span>
            </button>
          </div>
          <p className={styles.hint}>
            选择主题将自动应用所有设置，修改设置后将切换为自定义模式
          </p>
        </div>

        {/* 背景颜色 */}
        <div className={styles.section}>
          <label className={styles.label}>背景颜色</label>
          <ColorPicker
            value={settings.backgroundColor}
            onChange={(color) => handleSettingChange('backgroundColor', color)}
          />
        </div>

        {/* 字体颜色 */}
        <div className={styles.section}>
          <label className={styles.label}>字体颜色</label>
          <ColorPicker
            value={settings.textColor}
            onChange={(color) => handleSettingChange('textColor', color)}
          />
        </div>

        <div className={styles.divider}></div>

        {/* 保存当前设置 */}
        <div className={styles.section}>
          <label className={styles.label}>保存当前设置</label>
          <input
            type="text"
            placeholder="输入主题名称..."
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.saveBtn}
            onClick={handleSaveTheme}
            disabled={!themeName.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>保存为新主题</span>
          </button>
        </div>

        {/* 我的主题 */}
        {customThemes.length > 0 && (
          <div className={styles.section}>
            <label className={styles.label}>我的主题</label>
            <div className={styles.customThemeGrid}>
              {customThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`${styles.customThemeCard} ${
                    activeThemeId === theme.id ? styles.customThemeCardActive : ''
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className={styles.customThemeHeader}>
                    <span className={styles.customThemeName}>{theme.name}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTheme(theme.id);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <span className={styles.customThemePreview}>Aa 预览</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 滚动提示 */}
        <div className={styles.scrollHint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="7 13 12 18 17 13"></polyline>
            <polyline points="7 6 12 11 17 6"></polyline>
          </svg>
          <span>滚动查看更多</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
