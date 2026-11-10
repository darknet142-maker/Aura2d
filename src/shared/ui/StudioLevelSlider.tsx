import React from 'react';

export interface StudioLevelSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  variant?: 'master' | 'cyan' | 'emerald' | 'gold';
  showValue?: boolean;
  unit?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  icon?: React.ReactNode;
}

export const StudioLevelSlider: React.FC<StudioLevelSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  variant = 'master',
  showValue = true,
  unit = '%',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  icon,
}) => {
  const gradientClass = `studio-slider-gradient-${variant}`;

  return (
    <div className={`studio-slider-container ${className}`}>
      {(label || showValue || icon) && (
        <div className="w-full flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#F8FAFC]">
            {icon}
            {label && <span>{label}</span>}
          </div>
          {showValue && (
            <span className="font-mono font-bold text-amber-400 text-xs tabular-nums">
              {Math.round(value)}{unit}
            </span>
          )}
        </div>
      )}

      <div className="studio-slider-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`studio-slider ${gradientClass}`}
          aria-label={ariaLabel || label || 'Niveau Audio'}
        />
      </div>
    </div>
  );
};
