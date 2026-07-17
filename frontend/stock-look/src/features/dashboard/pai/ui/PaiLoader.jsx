import React from 'react';
import { useTheme } from '@/shared/context/ThemeContext';
import './PaiLoader.css';

export default function PaiLoader() {
    const { theme } = useTheme();
    
    // Blue color when dark mode and black on light mode
    // Using blue-600 (#2563eb) for a nice matching blue in dark mode
    const uibColor = theme === 'dark' ? '#2563eb' : '#000000';

    return (
        <div className="flex items-start gap-3 w-full py-4 px-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                <div 
                    className="three-body scale-[0.4]" 
                    style={{ '--uib-color': uibColor }}
                >
                    <div className="three-body__dot"></div>
                    <div className="three-body__dot"></div>
                    <div className="three-body__dot"></div>
                </div>
            </div>
            <div className="flex flex-col gap-2 w-full mt-1.5">
                <div className="text-[13px] text-text-tertiary font-medium animate-pulse">
                    PAI is analyzing...
                </div>
            </div>
        </div>
    );
}
