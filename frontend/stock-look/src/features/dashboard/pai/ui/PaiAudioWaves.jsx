import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../../../shared/context/ThemeContext';
import { motion } from 'framer-motion';

export default function PaiAudioWaves({ isListening, isSpeaking, isProcessing, isActive, isHearingSpeech }) {
    const { theme, paiMascotColor, paiAudioStyle } = useTheme();
    const canvasRef = useRef(null);
    
    // Web Audio API refs for highly precise real microphone data
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const dataArrayRef = useRef(null);

    // Handle Mic connection for real audio waves
    useEffect(() => {
        if (isListening) {
            const initMic = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaStreamRef.current = stream;
                    
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    audioCtxRef.current = audioCtx;
                    
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 256; // 128 data points for a highly precise, crisp line
                    analyser.smoothingTimeConstant = 0.5; 
                    
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    
                    analyserRef.current = analyser;
                    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
                } catch (err) {
                    console.error("Mic access denied for wave visualizer", err);
                }
            };
            initMic();
        } else {
            // Cleanup mic when not listening
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (audioCtxRef.current) {
                if (audioCtxRef.current.state !== 'closed') {
                    audioCtxRef.current.close().catch(e => console.warn("AudioCtx close error:", e));
                }
                audioCtxRef.current = null;
            }
        }
        
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(e => console.warn("AudioCtx close error:", e));
            }
        };
    }, [isListening]);

    useEffect(() => {
        if (!isActive) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        let animationFrameId;
        let time = 0;
        let currentAmp = 0;
        let targetAmp = 0;

        const render = () => {
            time += 0.08; // Speed of the wave traveling horizontally
            const width = rect.width;
            const height = rect.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const isTalking = isListening || isSpeaking;

            // Use standard rendering for a flat, solid 8-bit aesthetic
            ctx.globalCompositeOperation = 'source-over';
            


            let currentMicVol = 0;
            // 1. Calculate the target amplitude
            if (isListening && analyserRef.current && dataArrayRef.current) {
                // Get volume (frequency data) rather than raw time-domain which vibrates too much
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let sum = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    sum += dataArrayRef.current[i];
                }
                const micVolume = (sum / dataArrayRef.current.length) / 255.0; // 0.0 to 1.0
                currentMicVol = micVolume;
                
                if (micVolume > 0.02) {
                    targetAmp = micVolume * (height * 0.8); // Scale to canvas height
                } else {
                    targetAmp = 0;
                }
            } else if (isSpeaking) {
                if (Math.random() < 0.1) {
                    targetAmp = Math.random() * (height * 0.6) + (height * 0.2);
                }
                targetAmp *= 0.90; // Decay
            } else {
                targetAmp = 0;
            }

            // 2. Smoothly interpolate amplitude to prevent sudden jerks
            if (isListening) {
                targetAmp *= 0.85; // fast decay for crisp voice reactivity
                currentAmp += (targetAmp - currentAmp) * 0.25; 
            } else {
                currentAmp += (targetAmp - currentAmp) * 0.15;
            }

            // 3. Draw the pixelated 8-bit wave
            
            // Determine colors based on actual volume (currentAmp) instead of just state
            let color = 'transparent';
            const hearingColor = paiMascotColor || '#FF0000';
            
            if (currentAmp > 0.02) {
                // Hybrid Noise Gate: Turn red if AI recognizes words, OR if the raw audio volume spikes past typical background noise (> 0.08)
                if (isListening && (isHearingSpeech || currentMicVol > 0.08)) {
                    color = hearingColor;
                } else if (isSpeaking) {
                    color = theme === 'dark' ? '#3B82F6' : '#2563EB'; // Blue
                }
            } else if (isSpeaking) {
                // When speaking, we might have low amplitude moments between words, keep it blue
                color = theme === 'dark' ? '#3B82F6' : '#2563EB';
            }

            if (paiAudioStyle === 'bar') {
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    
                    const numBars = 9;
                    const barWidth = 4;
                    const barGap = 6;
                    const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
                    const startX = (width - totalWidth) / 2;
                    
                    for (let i = 0; i < numBars; i++) {
                        const distance = Math.abs(i - 4) / 4;
                        const taper = 1 - Math.pow(distance, 1.5);
                        
                        // Use a bit of a wave phase offset so it ripples slightly
                        const wavePhase = Math.sin(time * 2 - i * 0.5) * 0.3 + 0.7; // 0.4 to 1.0
                        
                        let h = 4 + (currentAmp * 1.5 * taper * wavePhase);
                        h = Math.min(h, height); // clamp to max height
                        
                        let x = startX + i * (barWidth + barGap);
                        let y = (height - h) / 2;
                        
                        if (ctx.roundRect) {
                            ctx.roundRect(x, y, barWidth, h, 4);
                        } else {
                            ctx.rect(x, y, barWidth, h);
                        }
                    }
                    ctx.fill();
                }
            } else {
                // Pixel wave style
                if (color !== 'transparent') {
                    ctx.strokeStyle = color;
                    ctx.shadowBlur = 0;
                }

                const numPoints = 40; 
                const sliceWidth = width / numPoints;
                const pixelSize = 4; 
                
                ctx.beginPath();
                ctx.lineWidth = pixelSize;
                ctx.imageSmoothingEnabled = false;

                let prevY = height / 2;

                for (let i = 0; i <= numPoints; i++) {
                    let y = height / 2;
                    
                    if (currentAmp > 0.1) {
                        const wave = (Math.sin(time + i * 0.25) * 0.6) + (Math.cos(time * 1.5 - i * 0.3) * 0.4);
                        const normalizedX = (i / numPoints) * 2 - 1; 
                        const taper = Math.max(0, 1 - (normalizedX * normalizedX)); 
                        
                        y += wave * currentAmp * taper;
                    }
                    
                    let px = Math.floor((i * sliceWidth) / pixelSize) * pixelSize;
                    let py = Math.floor(y / pixelSize) * pixelSize;
                    
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, prevY);
                        ctx.lineTo(px, py);
                    }
                    
                    prevY = py;
                }
                
                if (color !== 'transparent') {
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, isListening, isSpeaking]);

    if (!isActive) return null;

    return (
        <>
            <div 
                className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
                style={{ 
                    opacity: isProcessing ? 1 : 0, 
                    transition: isProcessing ? 'opacity 0.3s ease-in-out 0.6s' : 'opacity 0.2s ease-in-out 0s'
                }}
            >
                <div className="spinner scale-[1.2]">
                    <div className="spinnerin"></div>
                </div>
            </div>
            <canvas 
                ref={canvasRef} 
                className="absolute z-10 pointer-events-none" 
                style={{
                    // Position completely underneath the mascot, centered horizontally
                    bottom: '-20px',
                    left: '-10%',
                    width: '120%', // Shorter line length
                    height: '30px',
                    opacity: isProcessing ? 0 : 1,
                    transition: isProcessing ? 'opacity 0.3s ease-in-out 0.6s' : 'opacity 0.2s ease-in-out 0s'
                }}
            />
        </>
    );
}
