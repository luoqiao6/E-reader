import React, { useRef } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSwatchClick = () => {
    inputRef.current?.click();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.colorPicker}>
      <div className={styles.display} onClick={handleSwatchClick}>
        <div className={styles.swatch} style={{ backgroundColor: value }} />
        <span className={styles.value}>{value.toUpperCase()}</span>
      </div>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={handleColorChange}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default ColorPicker;
