import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface DropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = '请选择...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.value}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`${styles.option} ${
                option.value === value ? styles.optionActive : ''
              }`}
              onClick={() => handleSelect(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
