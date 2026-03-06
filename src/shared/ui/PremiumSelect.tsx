import React from 'react';
import Select, { Props as SelectProps, StylesConfig, GroupBase } from 'react-select';

interface PremiumSelectProps extends SelectProps<any, boolean, GroupBase<any>> {
    label?: string;
    error?: string;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ label, error, ...props }) => {
    const customStyles: StylesConfig<any, boolean, GroupBase<any>> = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            borderColor: error
                ? 'rgba(239, 68, 68, 0.5)'
                : state.isFocused
                    ? 'rgba(255, 0, 60, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '2px 4px',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(255, 0, 60, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
                borderColor: error ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            marginTop: '8px',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            zIndex: 50,
        }),
        menuList: (provided) => ({
            ...provided,
            padding: '6px',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? 'rgba(255, 0, 60, 0.15)'
                : state.isFocused
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
            color: state.isSelected ? '#ff003c' : '#a1a1aa',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            fontSize: '13px',
            padding: '10px 12px',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: state.isSelected ? '600' : '400',
            '&:active': {
                backgroundColor: 'rgba(255, 0, 60, 0.1)',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#ffffff',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        }),
        input: (provided) => ({
            ...provided,
            color: '#ffffff',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'rgba(255, 255, 255, 0.2)',
            fontSize: '14px',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            color: state.isFocused ? '#ff003c' : 'rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
                color: '#ffffff',
            },
        }),
    };

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="text-[10px] font-bold text-terminal-muted uppercase tracking-widest pl-1">
                    {label}
                </label>
            )}
            <Select
                styles={customStyles}
                {...props}
            />
            {error && (
                <p className="text-[10px] text-red-400 uppercase tracking-wider pl-1 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
};

export default PremiumSelect;
