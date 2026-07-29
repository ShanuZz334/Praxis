import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CalculatorWidget.css';
import { FiX } from 'react-icons/fi';

export default function CalculatorWidget({ isOpen, onClose }) {
  const [input, setInput] = useState('0');
  const dragConstraintsRef = useRef(null);

  // Set constraint ref to body to allow full screen dragging
  useEffect(() => {
    dragConstraintsRef.current = document.body;
  }, []);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      
      // Load current bindings
      const defaultCalcBindings = {
          sin: 's',
          cos: 'c',
          tan: 't',
          log: 'l',
          sqrt: 'r',
          pi: 'p',
          fraction: 'f'
      };
      let bindings;
      try {
          bindings = JSON.parse(localStorage.getItem('calcKeybindings')) || defaultCalcBindings;
      } catch {
          bindings = defaultCalcBindings;
      }

      if (/[0-9.]/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (['+', '-', '*', '/', '^', '%', '(', ')'].includes(key)) {
        e.preventDefault();
        handleOp(key);
      } else if (key === 'enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'backspace') {
        e.preventDefault();
        del();
      } else if (key === 'escape') {
        e.preventDefault();
        onClose();
      } else if (key === 'delete') {
        e.preventDefault();
        clear();
      } else if (key === 'e') {
        // e is hardcoded because it's standard
        e.preventDefault();
        handleInput('e');
      } else {
        // Check dynamic bindings
        if (key === bindings.sin) { e.preventDefault(); handleOp('sin('); }
        else if (key === bindings.cos) { e.preventDefault(); handleOp('cos('); }
        else if (key === bindings.tan) { e.preventDefault(); handleOp('tan('); }
        else if (key === bindings.log) { e.preventDefault(); handleOp('log('); }
        else if (key === bindings.sqrt) { e.preventDefault(); handleOp('√('); }
        else if (key === bindings.pi) { e.preventDefault(); handleInput('π'); }
        else if (key === bindings.fraction) { e.preventDefault(); toggleFractionDecimal(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, input]); // Include 'input' in dependencies so state references are fresh

  if (!isOpen) return null;

  const handleInput = (val) => {
    if (input === '0' || input === 'Error') {
      if (val === '.') setInput('0.');
      else setInput(val);
    } else {
      setInput(input + val);
    }
  };

  const handleOp = (op) => {
    if (input === 'Error') return;
    
    // Prevent multiple operators in a row (for basic ops, don't prevent for parens)
    const lastChar = input.slice(-1);
    if (['+', '-', '*', '/', '^', '%'].includes(op)) {
      if (['+', '-', '*', '/', '^', '%'].includes(lastChar)) {
        setInput(input.slice(0, -1) + op);
        return;
      }
    } else if (input === '0' && ['sin(', 'cos(', 'tan(', 'log(', '√(', '('].includes(op)) {
        setInput(op);
        return;
    }
    
    setInput(input + op);
  };

  const calculate = () => {
    try {
      let safeExpr = input;
      // Handle implicit multiplication (run twice to catch overlapping matches)
      safeExpr = safeExpr.replace(/(\d|\)|π|e)(sin|cos|tan|log|ln|√|\(|π|e)/g, '$1*$2');
      safeExpr = safeExpr.replace(/(\d|\)|π|e)(sin|cos|tan|log|ln|√|\(|π|e)/g, '$1*$2');

      safeExpr = safeExpr
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

      // Restrict characters allowed to basic math and Math properties we injected
      if (/[^0-9+\-*/.%()Math.a-z]/g.test(safeExpr)) {
        throw new Error('Invalid tokens');
      }

      const result = new Function('return ' + safeExpr)();
      
      if (isNaN(result) || !isFinite(result)) throw new Error('Math Error');
      
      // Format cleanly, remove trailing floating point noise
      let strRes = String(Number(result.toFixed(8)));
      setInput(strRes);
    } catch (e) {
      setInput('Error');
    }
  };

  const clear = () => {
    setInput('0');
  };

  const del = () => {
    if (input === 'Error') {
      setInput('0');
    } else if (input.length > 1) {
      setInput(input.slice(0, -1));
    } else {
      setInput('0');
    }
  };

  const toggleFractionDecimal = () => {
    if (input === 'Error') return;

    // Check if it's already a simple fraction (e.g., "1/2")
    const fracMatch = input.match(/^(-?\d+)\/(\d+)$/);
    if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den !== 0) {
        setInput(String(Number((num / den).toFixed(8))));
      }
      return;
    }

    // Check if it's a single calculated decimal number
    const isNumber = /^-?\d+(\.\d+)?$/.test(input);
    if (isNumber) {
      const value = parseFloat(input);
      if (!Number.isInteger(value)) {
        const decimals = (input.split('.')[1] || '').length;
        const denominator = Math.pow(10, Math.min(decimals, 8));
        const numerator = Math.round(value * denominator);
        
        const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
        const divisor = gcd(numerator, denominator);
        
        const finalNum = numerator / divisor;
        const finalDen = denominator / divisor;
        
        if (finalDen > 1 && finalDen <= 100000000) {
          setInput(`${finalNum}/${finalDen}`);
        }
      }
    }
  };

  const isCurrentlyFraction = /^(-?\d+)\/(\d+)$/.test(input);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          drag
          dragMomentum={false}
          dragConstraints={dragConstraintsRef}
          initial={{ opacity: 0, scale: 0.9, y: -20, x: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-[85px] right-[70px] z-[100]"
          style={{ position: 'fixed' }} // Ensure it stays over everything while dragging
        >
          <div className="calculator-widget-container">
            <button 
              onClick={onClose}
              className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors z-10"
              style={{ cursor: 'pointer' }}
            >
              <FiX size={12} />
            </button>

            <div className="calculator-display">
              <div className="calculator-input" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {input}
              </div>
            </div>

            <div className="calculator-buttons">
              {/* Row 1 - Scientific */}
              <button className="te-btn te-btn-sci" onClick={() => handleOp('sin(')}>sin</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('cos(')}>cos</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('tan(')}>tan</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('(')}>(</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp(')')}>)</button>

              {/* Row 2 - Scientific */}
              <button className="te-btn te-btn-sci" onClick={() => handleOp('log(')}>log</button>
              <button className="te-btn te-btn-sci" onClick={toggleFractionDecimal}>
                {isCurrentlyFraction ? '0.5' : 'a/b'}
              </button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('√(')}>√</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('^')}>^</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('%')}>%</button>

              {/* Row 3 - Numpad */}
              <button className="te-btn te-btn-num" onClick={() => handleInput('7')}>7</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('8')}>8</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('9')}>9</button>
              <button className="te-btn te-btn-red" onClick={del}>DEL</button>
              <button className="te-btn te-btn-red" onClick={clear}>AC</button>

              {/* Row 4 - Numpad */}
              <button className="te-btn te-btn-num" onClick={() => handleInput('4')}>4</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('5')}>5</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('6')}>6</button>
              <button className="te-btn te-btn-op" onClick={() => handleOp('*')}>*</button>
              <button className="te-btn te-btn-op" onClick={() => handleOp('/')}>/</button>

              {/* Row 5 - Numpad */}
              <button className="te-btn te-btn-num" onClick={() => handleInput('1')}>1</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('2')}>2</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('3')}>3</button>
              <button className="te-btn te-btn-op" onClick={() => handleOp('+')}>+</button>
              <button className="te-btn te-btn-op" onClick={() => handleOp('-')}>-</button>

              {/* Row 6 - Numpad & Equals */}
              <button className="te-btn te-btn-num" onClick={() => handleInput('0')}>0</button>
              <button className="te-btn te-btn-num" onClick={() => handleInput('.')}>.</button>
              <button className="te-btn te-btn-sci" onClick={() => handleOp('/')}>/</button>
              <button className="te-btn te-btn-sci" onClick={() => handleInput('e')}>e</button>
              <button className="te-btn te-btn-red" onClick={calculate}>=</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
