import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * LiquidityGauge
 * Semi-circular gauge for system liquidity (surplus/deficit)
 */
export default function LiquidityGauge({
    value = 0, // in ₹ Cr
    max = 200000, // max expected surplus/deficit
    height = 200,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size
        canvas.width = height * dpr;
        canvas.height = (height * 0.6) * dpr;
        canvas.style.width = `${height}px`;
        canvas.style.height = `${height * 0.6}px`;

        ctx.scale(dpr, dpr);

        const centerX = height / 2;
        const centerY = height * 0.55;
        const radius = height * 0.35;
        const startAngle = Math.PI;
        const endAngle = 2 * Math.PI;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineWidth = 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Calculate value angle
        const normalizedValue = Math.max(-1, Math.min(1, value / max));
        const valueAngle = startAngle + (normalizedValue + 1) / 2 * (endAngle - startAngle);

        // Determine color based on value
        const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#fbbf24';

        // Draw value arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
        ctx.lineWidth = 20;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();

        // Draw value text
        ctx.fillStyle = color;
        ctx.font = `bold ${height * 0.12}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayValue = Math.abs(value / 10000).toFixed(1);
        ctx.fillText(`${value > 0 ? '+' : value < 0 ? '-' : ''}${displayValue}L Cr`, centerX, centerY - height * 0.05);

        // Draw label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `${height * 0.06}px Inter, sans-serif`;
        ctx.fillText(value > 0 ? 'Surplus' : value < 0 ? 'Deficit' : 'Neutral', centerX, centerY + height * 0.08);

        // Draw tick marks
        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
            const tickAngle = startAngle + (i / tickCount) * (endAngle - startAngle);
            const tickStartRadius = radius + 5;
            const tickEndRadius = radius + 15;

            const x1 = centerX + tickStartRadius * Math.cos(tickAngle);
            const y1 = centerY + tickStartRadius * Math.sin(tickAngle);
            const x2 = centerX + tickEndRadius * Math.cos(tickAngle);
            const y2 = centerY + tickEndRadius * Math.sin(tickAngle);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

    }, [value, max, height]);

    const status = value > 50000 ? 'Ample Liquidity' : value < -50000 ? 'Tight Liquidity' : 'Balanced';
    const statusColor = value > 50000 ? '#22c55e' : value < -50000 ? '#ef4444' : '#fbbf24';

    return (
        <motion.div
            className="liquidity-gauge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col items-center">
                <canvas ref={canvasRef} className="mx-auto" />

                <div className="mt-4 text-center">
                    <div
                        className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                        }}
                    >
                        {status}
                    </div>
                </div>

                <div className="mt-3 p-3 bg-white/5 rounded-lg w-full">
                    <div className="text-xs text-white/70 text-center">
                        <span className="font-medium">💡 Impact:</span>{' '}
                        {value > 50000
                            ? 'Surplus liquidity supports market rally'
                            : value < -50000
                                ? 'Tight liquidity may pressure valuations'
                                : 'Neutral liquidity - limited impact'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
