import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FIB_LEVELS = [-0.618, -0.382, 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.382, 1.618];
const FIB_LABELS = ['-61.8%', '-38.2%', '0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%', '138.2%', '161.8%'];
const FIB_COLORS = [
    'rgba(239,68,68,0.7)', 'rgba(248,113,113,0.7)', 'rgba(148,163,184,0.7)',
    'rgba(52,211,153,0.7)', 'rgba(167,139,250,0.7)', 'rgba(251,191,36,0.7)', 
    'rgba(96,165,250,0.7)', 'rgba(129,140,248,0.7)', 'rgba(148,163,184,0.7)',
    'rgba(248,113,113,0.7)', 'rgba(239,68,68,0.7)'
];
const HIT_RADIUS = 8; // px tolerance for hover/click

/** Convert time value (unix seconds or date string) to a format chartRef accepts */
const normalizeTime = (t) => t;

/** 
 * Convert chart-space {price, time} to canvas pixel coordinates 
 */
function toPixel(p, chart, series) {
    if (!p || !chart || !series) return null;
    try {
        const x = chart.timeScale().timeToCoordinate(p.time);
        const y = series.priceToCoordinate(p.price);
        if (x == null || y == null || isNaN(x) || isNaN(y)) return null;
        return { x, y };
    } catch { return null; }
}

/** Distance from point (px,py) to segment (ax,ay)-(bx,by) */
function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * DrawingCanvas — transparent canvas overlay that handles:
 * - Mouse events for creating new drawings
 * - Re-rendering all drawings on every animation frame
 * - Hover detection + delete handle
 */
export default function DrawingCanvas({
    chartRef,
    candleSeriesRef,
    containerRef,
    activeTool,
    setActiveTool,
    activeColor,
    drawings,
    addDrawing,
    deleteDrawing,
}) {
    const canvasRef = useRef(null);
    const draftRef = useRef(null);    // In-progress drawing { type, p1, p2?, p3?, step }
    const hoveredIdRef = useRef(null);
    const animFrameRef = useRef(null);
    const [, forceRender] = useState(0);
    const [textPrompt, setTextPrompt] = useState(null);
    const [editPrompt, setEditPrompt] = useState(null); // { drawing, x, y }

    // ── Coordinate helpers ──────────────────────────────────────────────────

    const pixelToChartPoint = useCallback((clientX, clientY) => {
        const chart = chartRef.current;
        const series = candleSeriesRef.current;
        const canvas = canvasRef.current;
        if (!chart || !series || !canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        try {
            const time = chart.timeScale().coordinateToTime(x);
            const price = series.coordinateToPrice(y);
            if (time == null || price == null) return null;
            return { time, price, x, y };
        } catch { return null; }
    }, [chartRef, candleSeriesRef]);

    // ── Drawing renderer ────────────────────────────────────────────────────

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const chart = chartRef.current;
        const series = candleSeriesRef.current;
        if (!canvas || !chart || !series) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        const rightEdge = chart ? (W - chart.priceScale('right').width()) : W - 60;

        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width = W * dpr;
            canvas.height = H * dpr;
        }

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        // Helper: draw a styled line without neon glow
        const drawLine = (ax, ay, bx, by, color, dash = [], lineWidth = 2) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(dash);
            ctx.stroke();
            ctx.restore();
        };

        // Helper: price label pill on right edge
        const drawPriceLabel = (y, price, color) => {
            const text = price.toFixed(2);
            ctx.save();
            ctx.font = '10px Inter, monospace';
            const tw = ctx.measureText(text).width;
            const px = rightEdge - tw - 14;
            const py = y;
            ctx.fillStyle = color + 'cc';
            ctx.beginPath();
            ctx.roundRect(px - 4, py - 8, tw + 8, 16, 3);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(text, px, py + 4);
            ctx.restore();
        };

        const allDrawings = [...drawings, ...(draftRef.current ? [draftRef.current] : [])];

        allDrawings.forEach(d => {
            const isHovered = hoveredIdRef.current === d.id;
            const color = d.color || '#60a5fa';
            const p1 = toPixel(d.p1, chart, series);
            if (!p1) return;

            const highlight = isHovered ? 'rgba(255,255,255,0.9)' : color;

            if (d.type === 'hline') {
                drawLine(0, p1.y, rightEdge, p1.y, highlight, [], 1.5);
                drawPriceLabel(p1.y, d.p1.price, color);
                if (isHovered) {
                    // Left anchor dot
                    ctx.beginPath();
                    ctx.arc(12, p1.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                }
            }

            if (d.type === 'hray') {
                drawLine(p1.x, p1.y, rightEdge, p1.y, highlight, [], 1.5);
                drawPriceLabel(p1.y, d.p1.price, color);
                if (isHovered) {
                    ctx.beginPath();
                    ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                }
            }

            if (d.type === 'vline') {
                drawLine(p1.x, 0, p1.x, H, highlight, [4, 4], 1.5);
            }

            if (d.type === 'trend' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                // Extend to right edge
                const slope = (p2.y - p1.y) / (p2.x - p1.x || 0.001);
                const extY = p2.y + slope * (rightEdge - p2.x);
                drawLine(p1.x, p1.y, rightEdge, extY, highlight, [], 1.5);
                // Anchor dots
                if (isHovered) {
                    [p1, p2].forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                    });
                }
                drawPriceLabel(p1.y, d.p1.price, color);
                drawPriceLabel(p2.y, d.p2.price, color);
            }

            if (d.type === 'rect' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
                const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
                ctx.save();
                ctx.fillStyle = color + '18';
                ctx.strokeStyle = highlight;
                ctx.lineWidth = 1.5;
                ctx.fillRect(rx, ry, rw, rh);
                ctx.strokeRect(rx, ry, rw, rh);
                ctx.restore();
                // Labels on both horizontal edges
                drawPriceLabel(p1.y, d.p1.price, color);
                drawPriceLabel(p2.y, d.p2.price, color);
            }

            if (d.type === 'fib' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                
                // Draw diagonal trendline
                drawLine(p1.x, p1.y, p2.x, p2.y, highlight, [4, 4], 1.5);
                
                const getFibPoint = (lvl) => {
                    const y = p2.y + lvl * (p1.y - p2.y);
                    const price = d.p2.price + lvl * (d.p1.price - d.p2.price);
                    const x = p2.x + lvl * (p1.x - p2.x);
                    return { x, y, price };
                };

                FIB_LEVELS.forEach((lvl, i) => {
                    const pt = getFibPoint(lvl);
                    const c = FIB_COLORS[i % FIB_COLORS.length];
                    
                    drawLine(pt.x, pt.y, rightEdge, pt.y, c, [], 1, false);
                    
                    // Zone fill
                    if (i < FIB_LEVELS.length - 1) {
                        const nextPt = getFibPoint(FIB_LEVELS[i + 1]);
                        ctx.save();
                        ctx.fillStyle = c.replace('0.7)', '0.04)');
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(rightEdge, pt.y);
                        ctx.lineTo(rightEdge, nextPt.y);
                        ctx.lineTo(nextPt.x, nextPt.y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                    
                    // Label right aligned
                    ctx.save();
                    ctx.font = '10px Inter, monospace';
                    ctx.fillStyle = c;
                    const text = `${FIB_LABELS[i]}  ${pt.price.toFixed(2)}`;
                    const tw = ctx.measureText(text).width;
                    ctx.fillText(text, rightEdge - tw - 8, pt.y - 4);
                    ctx.restore();
                });
                
                // Anchor dots
                if (isHovered) {
                    [p1, p2].forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                    });
                }
            }

            if (d.type === 'arrow' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                drawLine(p1.x, p1.y, p2.x, p2.y, highlight, [], 1.5);
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const headlen = 10;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(p2.x, p2.y);
                ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fillStyle = highlight;
                ctx.fill();
                ctx.restore();
                if (isHovered) {
                    [p1, p2].forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                    });
                }
            }

            if (d.type === 'circle' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                const rx = Math.abs(p2.x - p1.x);
                const ry = Math.abs(p2.y - p1.y);
                if (rx > 0 && ry > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.ellipse(p1.x, p1.y, rx, ry, 0, 0, 2 * Math.PI);
                    ctx.fillStyle = color + '18';
                    ctx.fill();
                    ctx.strokeStyle = highlight;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            if (d.type === 'channel' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                drawLine(p1.x, p1.y, p2.x, p2.y, highlight, [], 1.5);
                if (d.p3) {
                    const p3 = toPixel(d.p3, chart, series);
                    if (p3) {
                        const slope = (p2.y - p1.y) / (p2.x - p1.x || 0.001);
                        const p1b = { x: p1.x, y: p3.y + slope * (p1.x - p3.x) };
                        const p2b = { x: p2.x, y: p3.y + slope * (p2.x - p3.x) };
                        
                        drawLine(p1b.x, p1b.y, p2b.x, p2b.y, highlight, [], 1.5);
                        
                        ctx.save();
                        ctx.fillStyle = color + '18';
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.lineTo(p2b.x, p2b.y);
                        ctx.lineTo(p1b.x, p1b.y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();

                        if (isHovered) {
                            [p1, p2, p3].forEach((p, index) => {
                                // Only draw handles on hover, except when drafting
                                ctx.beginPath();
                                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                                ctx.fillStyle = color;
                                ctx.fill();
                            });
                        }
                    }
                }
            }

            if (d.type === 'measure' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
                const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
                ctx.save();
                ctx.fillStyle = color + '1a';
                ctx.fillRect(rx, ry, rw, rh);
                ctx.restore();
                
                drawLine(p1.x, p1.y, p2.x, p2.y, highlight, [4, 4], 1.5);
                
                const priceChange = d.p2.price - d.p1.price;
                const pctChange = (priceChange / d.p1.price) * 100;
                const sign = priceChange >= 0 ? '+' : '';

                // Calculate bar count from time difference
                let barCount = '—';
                try {
                    const t1 = typeof d.p1.time === 'number' ? d.p1.time : 0;
                    const t2 = typeof d.p2.time === 'number' ? d.p2.time : 0;
                    const diff = Math.abs(t2 - t1);
                    // Detect timeframe from visible bar spacing
                    const vbr = chart.timeScale().getVisibleLogicalRange();
                    if (vbr) {
                        const totalBars = Math.round(vbr.to - vbr.from);
                        const vr = chart.timeScale().getVisibleRange();
                        if (vr && totalBars > 0) {
                            const secPerBar = (vr.to - vr.from) / totalBars;
                            if (secPerBar > 0) barCount = Math.max(1, Math.round(diff / secPerBar));
                        }
                    }
                } catch(e) { /* fallback */ }

                const line1 = `${sign}${priceChange.toFixed(2)} (${sign}${pctChange.toFixed(2)}%)`;
                const line2 = `${barCount} bars`;
                
                const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
                ctx.save();
                ctx.font = '11px Inter, sans-serif';
                const tw1 = ctx.measureText(line1).width;
                ctx.font = '10px Inter, sans-serif';
                const tw2 = ctx.measureText(line2).width;
                const maxTw = Math.max(tw1, tw2);
                
                ctx.fillStyle = '#1e222d';
                ctx.beginPath();
                ctx.roundRect(cx - maxTw/2 - 8, cy - 16, maxTw + 16, 32, 4);
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.font = '11px Inter, sans-serif';
                ctx.fillText(line1, cx, cy - 5);
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillText(line2, cx, cy + 10);
                ctx.restore();
            }

            if ((d.type === 'longpos' || d.type === 'shortpos') && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                
                const isLong = d.type === 'longpos';
                const entryPrice = d.p1.price;
                const stopPrice = d.p2.price;
                const risk = Math.abs(entryPrice - stopPrice);
                if (risk === 0) return;
                
                // Dynamic multi-target levels
                const tp1Price = isLong ? entryPrice + risk * 2 : entryPrice - risk * 2;
                const tp2Price = isLong ? entryPrice + risk * 3 : entryPrice - risk * 3;
                const rr1 = 2.0;
                const rr2 = 3.0;
                
                // Position sizing: default ₹5000 risk
                const RISK_AMOUNT = 5000;
                const qty = Math.floor(RISK_AMOUNT / risk);
                const profitTP1 = qty * risk * rr1;
                const profitTP2 = qty * risk * rr2;
                const lossAmt = qty * risk;
                
                // Percentages
                const pctStop = ((risk / entryPrice) * 100).toFixed(2);
                const pctTP1 = ((Math.abs(tp1Price - entryPrice) / entryPrice) * 100).toFixed(2);
                const pctTP2 = ((Math.abs(tp2Price - entryPrice) / entryPrice) * 100).toFixed(2);
                
                // Convert all prices to pixel Y
                const entryY = p1.y;
                const stopY = p2.y;
                const tp1Pt = toPixel({ price: tp1Price, time: d.p2.time }, chart, series);
                const tp2Pt = toPixel({ price: tp2Price, time: d.p2.time }, chart, series);
                if (!tp1Pt || !tp2Pt) return;
                const tp1Y = tp1Pt.y;
                const tp2Y = tp2Pt.y;
                
                // Box dimensions
                const boxLeft = Math.min(p1.x, p2.x);
                const boxRight = Math.max(p1.x, p2.x) < boxLeft + 120 ? boxLeft + 180 : Math.max(p1.x, p2.x);
                const w = boxRight - boxLeft;
                
                // Colors
                const greenFill = 'rgba(52, 211, 153, 0.18)';
                const greenFillLight = 'rgba(52, 211, 153, 0.10)';
                const redFill = 'rgba(248, 113, 113, 0.22)';
                const greenBorder = 'rgba(52, 211, 153, 0.5)';
                const redBorder = 'rgba(248, 113, 113, 0.5)';
                const greenText = '#34d399';
                const redText = '#f87171';
                
                ctx.save();
                
                // TP2 zone (lighter green/red)
                ctx.fillStyle = isLong ? greenFillLight : redFill;
                ctx.fillRect(boxLeft, Math.min(tp1Y, tp2Y), w, Math.abs(tp2Y - tp1Y));
                ctx.strokeStyle = isLong ? greenBorder : redBorder;
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.strokeRect(boxLeft, Math.min(tp1Y, tp2Y), w, Math.abs(tp2Y - tp1Y));
                ctx.setLineDash([]);
                
                // TP1 zone (solid green/red)
                ctx.fillStyle = isLong ? greenFill : redFill;
                ctx.fillRect(boxLeft, Math.min(entryY, tp1Y), w, Math.abs(entryY - tp1Y));
                ctx.strokeStyle = isLong ? greenBorder : redBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(boxLeft, Math.min(entryY, tp1Y), w, Math.abs(entryY - tp1Y));
                
                // Stop loss zone (red/green)
                ctx.fillStyle = isLong ? redFill : greenFill;
                ctx.fillRect(boxLeft, Math.min(entryY, stopY), w, Math.abs(entryY - stopY));
                ctx.strokeStyle = isLong ? redBorder : greenBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(boxLeft, Math.min(entryY, stopY), w, Math.abs(entryY - stopY));
                
                // Horizontal level lines
                drawLine(boxLeft, entryY, boxRight, entryY, '#ffffffcc', [], 1.5);
                drawLine(boxLeft, stopY, boxRight, stopY, isLong ? redBorder : greenBorder, [4, 3], 1);
                drawLine(boxLeft, tp1Y, boxRight, tp1Y, isLong ? greenBorder : redBorder, [], 1);
                drawLine(boxLeft, tp2Y, boxRight, tp2Y, isLong ? greenBorder : redBorder, [4, 3], 1);
                
                // --- Labels ---
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'left';
                
                // TP2 label
                ctx.fillStyle = isLong ? greenText : redText;
                ctx.fillText(`TP2: ₹${tp2Price.toFixed(2)}  (${pctTP2}%)  ${rr2}R`, boxLeft + 5, tp2Y + (isLong ? 13 : -5));
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(`P&L: +₹${profitTP2.toLocaleString('en-IN')}`, boxLeft + 5, tp2Y + (isLong ? 24 : -15));
                
                // TP1 label
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = isLong ? greenText : redText;
                ctx.fillText(`TP1: ₹${tp1Price.toFixed(2)}  (${pctTP1}%)  ${rr1}R`, boxLeft + 5, tp1Y + (isLong ? 13 : -5));
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(`P&L: +₹${profitTP1.toLocaleString('en-IN')}`, boxLeft + 5, tp1Y + (isLong ? 24 : -15));
                
                // Entry label (center of entry line)
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(`ENTRY: ₹${entryPrice.toFixed(2)}`, boxLeft + 5, entryY - 6);
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                const rrActual = (Math.abs(tp1Price - entryPrice) / risk).toFixed(1);
                ctx.fillText(`R/R: ${rrActual}  |  Qty: ${qty}  |  Risk: ₹${lossAmt.toLocaleString('en-IN')}`, boxLeft + 5, entryY + 12);
                
                // Stop label
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = isLong ? redText : greenText;
                ctx.fillText(`SL: ₹${stopPrice.toFixed(2)}  (-${pctStop}%)  -1R`, boxLeft + 5, stopY + (isLong ? -5 : 13));
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(`Loss: -₹${lossAmt.toLocaleString('en-IN')}`, boxLeft + 5, stopY + (isLong ? -16 : 24));
                
                // Position type badge (top-right corner)
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillStyle = isLong ? greenText : redText;
                const badge = isLong ? '▲ LONG' : '▼ SHORT';
                ctx.fillText(badge, boxRight - 5, Math.min(entryY, tp2Y, tp1Y, stopY) + 12);
                
                ctx.restore();
            }

            // === SCALP POSITION TOOL ===
            if (d.type === 'scalp' && d.p2) {
                const p2 = toPixel(d.p2, chart, series);
                if (!p2) return;
                
                const entryPrice = d.p1.price;
                const stopPrice = d.p2.price;
                const isLong = entryPrice > stopPrice; // auto-detect direction
                const risk = Math.abs(entryPrice - stopPrice);
                if (risk === 0) return;
                
                // Scalp: 1R partial, 1.5R full target
                const partialPrice = isLong ? entryPrice + risk : entryPrice - risk;      // 1R
                const targetPrice = isLong ? entryPrice + risk * 1.5 : entryPrice - risk * 1.5; // 1.5R
                
                // Position sizing
                const RISK_AMOUNT = 5000;
                const qty = Math.floor(RISK_AMOUNT / risk);
                const halfQty = Math.floor(qty / 2);
                const partialProfit = halfQty * risk;          // 50% at 1R
                const remainProfit = (qty - halfQty) * risk * 1.5; // rest at 1.5R
                const totalProfit = partialProfit + remainProfit;
                const lossAmt = qty * risk;
                
                const pctStop = ((risk / entryPrice) * 100).toFixed(2);
                const pctTarget = ((risk * 1.5 / entryPrice) * 100).toFixed(2);
                
                const entryY = p1.y;
                const stopY = p2.y;
                const partialPt = toPixel({ price: partialPrice, time: d.p2.time }, chart, series);
                const targetPt = toPixel({ price: targetPrice, time: d.p2.time }, chart, series);
                if (!partialPt || !targetPt) return;
                const partialY = partialPt.y;
                const targetY = targetPt.y;
                
                const boxLeft = Math.min(p1.x, p2.x);
                const boxRight = Math.max(p1.x, p2.x) < boxLeft + 120 ? boxLeft + 170 : Math.max(p1.x, p2.x);
                const w = boxRight - boxLeft;
                
                // Scalp amber/orange theme
                const amberFill = 'rgba(251, 191, 36, 0.15)';
                const amberFillLight = 'rgba(251, 191, 36, 0.08)';
                const redFill = 'rgba(248, 113, 113, 0.22)';
                const amberBorder = 'rgba(251, 191, 36, 0.5)';
                const redBorder = 'rgba(248, 113, 113, 0.5)';
                const amberText = '#fbbf24';
                const redText = '#f87171';
                
                ctx.save();
                
                // Target zone (entry → 1.5R) — lighter amber
                ctx.fillStyle = amberFillLight;
                ctx.fillRect(boxLeft, Math.min(partialY, targetY), w, Math.abs(targetY - partialY));
                ctx.strokeStyle = amberBorder;
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
                ctx.strokeRect(boxLeft, Math.min(partialY, targetY), w, Math.abs(targetY - partialY));
                ctx.setLineDash([]);
                
                // Partial zone (entry → 1R) — solid amber
                ctx.fillStyle = amberFill;
                ctx.fillRect(boxLeft, Math.min(entryY, partialY), w, Math.abs(entryY - partialY));
                ctx.strokeStyle = amberBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(boxLeft, Math.min(entryY, partialY), w, Math.abs(entryY - partialY));
                
                // Stop zone
                ctx.fillStyle = redFill;
                ctx.fillRect(boxLeft, Math.min(entryY, stopY), w, Math.abs(entryY - stopY));
                ctx.strokeStyle = redBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(boxLeft, Math.min(entryY, stopY), w, Math.abs(entryY - stopY));
                
                // Lines
                drawLine(boxLeft, entryY, boxRight, entryY, '#ffffffcc', [], 1.5);
                drawLine(boxLeft, stopY, boxRight, stopY, redBorder, [4, 3], 1);
                drawLine(boxLeft, partialY, boxRight, partialY, amberBorder, [], 1);
                drawLine(boxLeft, targetY, boxRight, targetY, amberBorder, [4, 3], 1);
                
                // Break-even dashed line at entry
                drawLine(boxRight, entryY, boxRight + 30, entryY, 'rgba(255,255,255,0.3)', [2, 2], 0.5);
                
                // Labels
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'left';
                
                // Target label (1.5R)
                ctx.fillStyle = amberText;
                const tDir = isLong ? 13 : -5;
                const tDirAlt = isLong ? -5 : 13;
                ctx.fillText(`EXIT: ₹${targetPrice.toFixed(2)}  (${pctTarget}%)  1.5R`, boxLeft + 5, targetY + tDir);
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(`Total P&L: +₹${Math.round(totalProfit).toLocaleString('en-IN')}`, boxLeft + 5, targetY + (isLong ? 24 : -15));
                
                // Partial exit label (1R)
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = amberText;
                ctx.fillText(`PARTIAL: ₹${partialPrice.toFixed(2)}  1R  (50% exit)`, boxLeft + 5, partialY + tDir);
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillText(`Book: ${halfQty} of ${qty} qty → +₹${Math.round(partialProfit).toLocaleString('en-IN')}`, boxLeft + 5, partialY + (isLong ? 24 : -15));
                
                // Entry label
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(`ENTRY: ₹${entryPrice.toFixed(2)}`, boxLeft + 5, entryY - 6);
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(`Qty: ${qty}  |  Risk: ₹${lossAmt.toLocaleString('en-IN')}  |  R/R: 1.5`, boxLeft + 5, entryY + 12);
                
                // Stop label
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = redText;
                ctx.fillText(`SL: ₹${stopPrice.toFixed(2)}  (-${pctStop}%)`, boxLeft + 5, stopY + tDirAlt);
                ctx.font = '9px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillText(`Loss: -₹${lossAmt.toLocaleString('en-IN')}`, boxLeft + 5, stopY + (isLong ? -16 : 24));
                
                // Badge
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillStyle = amberText;
                ctx.fillText(`⚡ SCALP ${isLong ? '▲' : '▼'}`, boxRight - 5, Math.min(entryY, targetY, stopY) + 12);
                
                ctx.restore();
            }

            if (d.type === 'brush' && d.points) {
                ctx.save();
                ctx.beginPath();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                for (let i = 0; i < d.points.length; i++) {
                    const pt = toPixel(d.points[i], chart, series);
                    if (!pt) continue;
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                }
                ctx.strokeStyle = highlight;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            if (d.type === 'text' && d.text) {
                ctx.save();
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillStyle = highlight;
                ctx.fillText(d.text, p1.x, p1.y);
                ctx.restore();
            }

            // Delete handle when hovered -> replaced with right-click logic
            // We just show a subtle hover effect instead of the delete 'X'
            if (isHovered && d.id && !d.id.startsWith('draft')) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(p1.x, p1.y - 14, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#60a5fa';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }
        });
    }, [drawings, activeTool, activeColor, chartRef, candleSeriesRef]);

    // Animate render on scroll/zoom via RAF
    useEffect(() => {
        const loop = () => { render(); animFrameRef.current = requestAnimationFrame(loop); };
        animFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [render]);

    // Hover detection
    const getHoveredId = useCallback((cx, cy) => {
        const chart = chartRef.current;
        const series = candleSeriesRef.current;
        for (const d of [...drawings].reverse()) {
            const p1 = toPixel(d.p1, chart, series);
            if (!p1) continue;
            const p2 = d.p2 ? toPixel(d.p2, chart, series) : null;

            if (d.type === 'hline' || d.type === 'hray') {
                if (Math.abs(cy - p1.y) < HIT_RADIUS) return d.id;
            }
            if (d.type === 'vline') {
                if (Math.abs(cx - p1.x) < HIT_RADIUS) return d.id;
            }
            if (d.type === 'trend' && p2) {
                if (distToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) < HIT_RADIUS) return d.id;
            }
            if (d.type === 'rect' && p2) {
                const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
                const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
                if (cx >= rx - HIT_RADIUS && cx <= rx + rw + HIT_RADIUS &&
                    cy >= ry - HIT_RADIUS && cy <= ry + rh + HIT_RADIUS) return d.id;
            }
            if (d.type === 'arrow' && p2) {
                if (distToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) < HIT_RADIUS) return d.id;
            }
            if (d.type === 'circle' && p2) {
                const rx = Math.abs(p2.x - p1.x);
                const ry = Math.abs(p2.y - p1.y);
                if (rx > 0 && ry > 0) {
                    const dx = cx - p1.x;
                    const dy = cy - p1.y;
                    if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) return d.id;
                }
            }
            if (d.type === 'channel' && p2) {
                if (distToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) < HIT_RADIUS) return d.id;
                if (d.p3) {
                    const p3 = toPixel(d.p3, chart, series);
                    if (p3) {
                        const slope = (p2.y - p1.y) / (p2.x - p1.x || 0.001);
                        const p1b = { x: p1.x, y: p3.y + slope * (p1.x - p3.x) };
                        const p2b = { x: p2.x, y: p3.y + slope * (p2.x - p3.x) };
                        if (distToSegment(cx, cy, p1b.x, p1b.y, p2b.x, p2b.y) < HIT_RADIUS) return d.id;
                        
                        const minX = Math.min(p1.x, p2.x);
                        const maxX = Math.max(p1.x, p2.x);
                        if (cx >= minX && cx <= maxX) {
                            const yOnBase = p1.y + slope * (cx - p1.x);
                            const yOnPar = p1b.y + slope * (cx - p1b.x);
                            const minY = Math.min(yOnBase, yOnPar);
                            const maxY = Math.max(yOnBase, yOnPar);
                            if (cy >= minY && cy <= maxY) return d.id;
                        }
                    }
                }
            }
            if ((d.type === 'measure' || d.type === 'longpos' || d.type === 'shortpos' || d.type === 'scalp') && p2) {
                const rx = Math.min(p1.x, p2.x);
                const ry = Math.min(p1.y, p2.y);
                const rw = Math.max(180, Math.abs(p2.x - p1.x));
                const rh = Math.max(40, Math.abs(p2.y - p1.y)) * 3;
                if (cx >= rx - 20 && cx <= rx + rw + 20 && cy >= ry - 60 && cy <= ry + rh + 60) return d.id;
            }
            if (d.type === 'brush' && d.points) {
                for (let i = 0; i < d.points.length - 1; i++) {
                    const pt1 = toPixel(d.points[i], chart, series);
                    const pt2 = toPixel(d.points[i+1], chart, series);
                    if (pt1 && pt2 && distToSegment(cx, cy, pt1.x, pt1.y, pt2.x, pt2.y) < HIT_RADIUS) return d.id;
                }
            }
            if (d.type === 'fib' && p2) {
                if (distToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) < HIT_RADIUS * 4) return d.id;
            }
            if (d.type === 'text') {
                if (Math.hypot(cx - p1.x, cy - p1.y) < 20) return d.id;
            }
        }
        return null;
    }, [drawings, chartRef, candleSeriesRef]);

    // Lightweight Charts subscriptions for hover/delete in cursor mode
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        const onCrosshair = (param) => {
            if (activeTool !== 'cursor') return;
            if (!param.point) {
                if (hoveredIdRef.current) {
                    hoveredIdRef.current = null;
                    forceRender(n => n + 1);
                }
                return;
            }
            const hid = getHoveredId(param.point.x, param.point.y);
            if (hid !== hoveredIdRef.current) {
                hoveredIdRef.current = hid;
                forceRender(n => n + 1);
            }
        };

        const onClick = (param) => {
            if (activeTool !== 'cursor') return;
            if (!param.point) return;
            const hid = getHoveredId(param.point.x, param.point.y);
            if (hid) {
                const d = drawings.find(x => x.id === hid);
                if (d) setEditPrompt({ drawing: d, x: param.point.x, y: param.point.y });
            } else {
                setEditPrompt(null);
            }
        };

        chart.subscribeCrosshairMove(onCrosshair);
        chart.subscribeClick(onClick);

        return () => {
            chart.unsubscribeCrosshairMove(onCrosshair);
            chart.unsubscribeClick(onClick);
        };
    }, [chartRef, activeTool, getHoveredId, drawings]);

    // Native context menu for Right-Click Delete
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onContextMenu = (e) => {
            if (activeTool !== 'cursor') return;
            const rect = container.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const hid = getHoveredId(cx, cy);
            
            if (hid) {
                e.preventDefault(); // Suppress browser menu
                deleteDrawing(hid);
                hoveredIdRef.current = null;
                setEditPrompt(null);
                forceRender(n => n + 1);
            }
        };

        container.addEventListener('contextmenu', onContextMenu);
        return () => container.removeEventListener('contextmenu', onContextMenu);
    }, [containerRef, activeTool, getHoveredId, deleteDrawing]);

    // ── Mouse Events ────────────────────────────────────────────────────────

    const onMouseMove = useCallback((e) => {
        if (activeTool === 'cursor') return;
        const pt = pixelToChartPoint(e.clientX, e.clientY);
        if (!pt) return;

        canvasRef.current.style.cursor = 'crosshair';

        // Update in-progress draft p2
        const draft = draftRef.current;
        if (draft && draft.type === 'brush') {
            draftRef.current = { ...draft, points: [...draft.points, { price: pt.price, time: pt.time }] };
        } else if (draft && draft.type !== 'text') {
            if (draft.step === 1) draftRef.current = { ...draft, p2: { price: pt.price, time: pt.time } };
            if (draft.step === 2) draftRef.current = { ...draft, p3: { price: pt.price, time: pt.time } };
        }
    }, [activeTool, pixelToChartPoint, getHoveredId]);

    const onMouseDown = useCallback((e) => {
        if (e.button !== 0 || activeTool === 'cursor') return;
        const pt = pixelToChartPoint(e.clientX, e.clientY);
        if (!pt) return;

        const id = `draft_${Date.now()}`;

        // Single-click tools: hline, hray, vline
        if (activeTool === 'hline' || activeTool === 'hray' || activeTool === 'vline') {
            addDrawing({ id, type: activeTool, p1: { price: pt.price, time: pt.time }, color: activeColor });
            setActiveTool('cursor');
            return;
        }

        // Text tool
        if (activeTool === 'text') {
            setTextPrompt({
                id,
                p1: { price: pt.price, time: pt.time },
                color: activeColor,
                x: e.clientX,
                y: e.clientY
            });
            setActiveTool('cursor');
            return;
        }

        // Brush tool
        if (activeTool === 'brush') {
            draftRef.current = {
                id,
                type: 'brush',
                p1: { price: pt.price, time: pt.time },
                points: [{ price: pt.price, time: pt.time }],
                color: activeColor,
                step: 1
            };
            return;
        }

        // Two-point tools: trend, arrow, rect, circle, fib, channel, measure, longpos, shortpos
        if (['trend', 'arrow', 'rect', 'circle', 'fib', 'channel', 'measure', 'longpos', 'shortpos', 'scalp'].includes(activeTool)) {
            if (draftRef.current && draftRef.current.type === activeTool) {
                const draft = draftRef.current;
                
                // 3-point tools (channel)
                if (activeTool === 'channel') {
                    if (draft.step === 1) {
                        draftRef.current = { ...draft, p2: { price: pt.price, time: pt.time }, step: 2 };
                        return;
                    }
                    if (draft.step === 2) {
                        addDrawing({ id: draft.id, type: draft.type, p1: draft.p1, p2: draft.p2, p3: { price: pt.price, time: pt.time }, color: draft.color });
                        draftRef.current = null;
                        setActiveTool('cursor');
                        return;
                    }
                }

                // Normal 2-point drag click
                addDrawing({ id: draft.id, type: draft.type, p1: draft.p1, p2: { price: pt.price, time: pt.time }, color: draft.color });
                draftRef.current = null;
                setActiveTool('cursor');
                return;
            } else {
                // First click / start drag
                draftRef.current = {
                    id,
                    type: activeTool,
                    p1: { price: pt.price, time: pt.time },
                    p2: { price: pt.price, time: pt.time },
                    color: activeColor,
                    step: 1,
                };
                return;
            }
        }
    }, [activeTool, activeColor, pixelToChartPoint, getHoveredId, addDrawing, deleteDrawing, setActiveTool]);

    const onMouseUp = useCallback((e) => {
        const draft = draftRef.current;
        if (!draft) return;
        
        if (draft.type === 'brush') {
            if (draft.points && draft.points.length > 2) {
                addDrawing(draft);
            }
            draftRef.current = null;
            setActiveTool('cursor');
            return;
        }

        const p1Pixel = toPixel(draft.p1, chartRef.current, candleSeriesRef.current);
        const p2Pixel = toPixel(draft.p2, chartRef.current, candleSeriesRef.current);
        let dist = 0;
        if (p1Pixel && p2Pixel) {
            dist = Math.hypot(p2Pixel.x - p1Pixel.x, p2Pixel.y - p1Pixel.y);
        }

        if (dist > 5) {
            if (draft.type === 'channel') {
                draftRef.current = { ...draft, step: 2 };
                return;
            }
            // It was a drag. Finish drawing.
            addDrawing({ id: draft.id, type: draft.type, p1: draft.p1, p2: draft.p2, color: draft.color });
            draftRef.current = null;
            setActiveTool('cursor');
        }
        // If dist <= 5, we assume it's a click to start the drawing, so we do nothing here and wait for the second click.
    }, [addDrawing, setActiveTool, chartRef, candleSeriesRef]);

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                // Undo handled by parent via prop
            }
            if (e.key === 'Escape') { draftRef.current = null; setActiveTool('cursor'); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setActiveTool]);

    const isDrawingMode = activeTool !== 'cursor';

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    zIndex: 10,
                    pointerEvents: isDrawingMode ? 'auto' : 'none',
                    cursor: isDrawingMode ? 'crosshair' : 'default',
                }}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
            />

            <AnimatePresence>
                {textPrompt && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-50 bg-white dark:bg-[#1e222d] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-4 w-72"
                        style={{
                            left: Math.min(textPrompt.x + 15, window.innerWidth - 300),
                            top: Math.min(textPrompt.y + 15, window.innerHeight - 150)
                        }}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-white/90 text-sm font-medium mb-3">Add Text Label</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Enter label text..."
                            className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 mb-4 transition-all"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = e.target.value.trim();
                                    if (val) {
                                        addDrawing({ id: textPrompt.id, type: 'text', p1: textPrompt.p1, text: val, color: textPrompt.color });
                                    }
                                    setTextPrompt(null);
                                }
                                if (e.key === 'Escape') {
                                    setTextPrompt(null);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setTextPrompt(null)}
                                className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    const input = e.target.parentElement.previousSibling;
                                    const val = input.value.trim();
                                    if (val) {
                                        addDrawing({ id: textPrompt.id, type: 'text', p1: textPrompt.p1, text: val, color: textPrompt.color });
                                    }
                                    setTextPrompt(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium transition-colors"
                            >
                                Add Label
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Edit Modal */}
                {editPrompt && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-50 bg-white dark:bg-[#1e222d] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-4 w-64"
                        style={{
                            left: Math.min(editPrompt.x + 15, window.innerWidth - 300),
                            top: Math.min(editPrompt.y + 15, window.innerHeight - 150)
                        }}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white/90 text-sm font-medium">Edit Drawing</h3>
                            <button onClick={() => setEditPrompt(null)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="text-xs text-white/50 mb-2 block">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#ffffff'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            deleteDrawing(editPrompt.drawing.id);
                                            addDrawing({ ...editPrompt.drawing, color });
                                            setEditPrompt(null);
                                        }}
                                        className={`w-5 h-5 rounded-full ring-1 ring-offset-1 ring-offset-[#1e222d] ${editPrompt.drawing.color === color ? 'ring-white/80' : 'ring-transparent hover:ring-white/30'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => { deleteDrawing(editPrompt.drawing.id); setEditPrompt(null); }}
                                className="px-3 py-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 text-sm transition-colors flex items-center gap-1"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setEditPrompt(null)}
                                className="px-3 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-slate-800 dark:text-white text-sm transition-colors"
                            >
                                Done
                            </button>
                        </div>
                        <div className="mt-3 text-[10px] text-white/30 text-center border-t border-white/5 pt-2">
                            Tip: Right-click drawing to delete instantly
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}