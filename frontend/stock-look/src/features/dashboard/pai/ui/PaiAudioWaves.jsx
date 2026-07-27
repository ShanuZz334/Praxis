import React, { useEffect, useRef } from 'react';

export default function PaiAudioWaves({ isListening, isSpeaking, isActive }) {
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
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
        }
        
        return () => {
            if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
            if (audioCtxRef.current) audioCtxRef.current.close();
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

            ctx.globalCompositeOperation = 'screen';
            
            ctx.beginPath();
            ctx.lineWidth = 2.5; // Slightly thinner, elegant line
            // Listening = Purple, Speaking = Blue
            const color = isListening ? '#A855F7' : (isSpeaking ? '#3B82F6' : '#60A5FA');
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = isTalking ? 8 : 2;

            // 1. Calculate the target amplitude
            if (isListening && analyserRef.current && dataArrayRef.current) {
                // Get volume (frequency data) rather than raw time-domain which vibrates too much
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let sum = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    sum += dataArrayRef.current[i];
                }
                const micVolume = (sum / dataArrayRef.current.length) / 255.0; // 0.0 to 1.0
                
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

            // 3. Draw the smooth mathematical wave
            const numPoints = 60;
            const sliceWidth = width / numPoints;
            let x = 0;
            
            for (let i = 0; i <= numPoints; i++) {
                let y = height / 2; // Flat center line by default
                
                if (currentAmp > 0.1) {
                    // Generate an organic, fluid waveform
                    // Combine two sine waves for a natural look
                    const wave = (Math.sin(time + i * 0.2) * 0.6) + (Math.cos(time * 1.5 - i * 0.3) * 0.4);
                    
                    // Multiply by a bell curve so the edges taper off to zero smoothly
                    const normalizedX = (i / numPoints) * 2 - 1; // -1 to 1
                    const taper = Math.max(0, 1 - (normalizedX * normalizedX)); 
                    
                    y += wave * currentAmp * taper;
                }
                
                // Use quadratic curves for an absolutely buttery smooth line
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            
            ctx.stroke();

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, isListening, isSpeaking]);

    if (!isActive) return null;

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute z-10 pointer-events-none" 
            style={{
                // Position completely underneath the mascot, centered horizontally
                bottom: '-20px',
                left: '-10%',
                width: '120%', // Shorter line length
                height: '30px'
            }}
        />
    );
}
