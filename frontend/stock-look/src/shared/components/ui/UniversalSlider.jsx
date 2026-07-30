import React from 'react';

export const UniversalSlider = React.forwardRef(
  ({ className = '', style, value = 0, min = 0, max = 100, recommendedRange, defaultValue, ...props }, ref) => {
    
    // Calculate percentage for dynamic track progress coloring
    const numericValue = Number(value);
    const numericMin = Number(min);
    const numericMax = Number(max);
    
    // Protect against division by zero
    const percentage = numericMax === numericMin 
      ? 0 
      : ((numericValue - numericMin) / (numericMax - numericMin)) * 100;
    
    // Uses CSS variables from index.css for light/dark mode track colors
    const sliderStyle = {
      ...style,
      background: `linear-gradient(to right, var(--color-praxis-blue, #3b82f6) 0%, var(--color-praxis-blue, #3b82f6) ${percentage}%, var(--slider-track-bg, #e2e8f0) ${percentage}%, var(--slider-track-bg, #e2e8f0) 100%)`
    };

    // Helper to calculate left % for markers
    const getLeftPercent = (val) => {
        if (numericMax === numericMin) return 0;
        return ((Number(val) - numericMin) / (numericMax - numericMin)) * 100;
    };

    return (
      <div className={`praxis-slider-container relative w-full h-6 flex items-center ${className}`}>
        
        {/* Track Background (Layer 0) */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full pointer-events-none z-0"
            style={sliderStyle}
        />

        {/* Recommended Range Highlights (Layer 1) - Only lines, no green strip */}
        {recommendedRange && recommendedRange.length === 2 && (
            <>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-[1px] h-3 bg-slate-400/80 z-10 pointer-events-none"
                    style={{ left: `calc(${getLeftPercent(recommendedRange[0])}%)` }}
                    title={`Recommended min: ${recommendedRange[0]}`}
                />
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-[1px] h-3 bg-slate-400/80 z-10 pointer-events-none"
                    style={{ left: `calc(${getLeftPercent(recommendedRange[1])}%)` }}
                    title={`Recommended max: ${recommendedRange[1]}`}
                />
            </>
        )}
        
        {/* Default Value Marker (Layer 1) */}
        {defaultValue !== undefined && (
             <div 
                className="absolute top-1/2 -translate-y-1/2 w-[2px] h-2.5 bg-orange-400 rounded-full z-10 pointer-events-none"
                style={{ left: `calc(${getLeftPercent(defaultValue)}% - 1px)` }}
                title={`Default: ${defaultValue}`}
             />
        )}

        {/* The Actual Input (Layer 2) - Track is transparent via CSS, thumb is opaque */}
        <input
            type="range"
            ref={ref}
            value={value}
            min={min}
            max={max}
            className="praxis-range relative w-full m-0 z-20"
            {...props}
        />
      </div>
    );
  }
);

UniversalSlider.displayName = 'UniversalSlider';
