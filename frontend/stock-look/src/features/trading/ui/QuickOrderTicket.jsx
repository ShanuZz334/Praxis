import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Plus, Minus, ArrowRightLeft, Maximize2, GripVertical } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { toast } from 'sonner';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import InstrumentSelectorModal from './InstrumentSelectorModal';



const resolveActiveInstrument = (data, fallbackKey) => {
  const key = data?.instrument_token || data?.value || fallbackKey || 'NSE_INDEX|Nifty 50';
  const all = [...FO_INDICES, ...FO_EQUITIES];
  const match = all.find(i => i.value === key || (data?.tradingsymbol && i.label.toUpperCase() === data.tradingsymbol.toUpperCase()));
  
  if (match) {
    return {
      ...match,
      ...(data || {}),
      instrument_token: match.value,
      value: match.value,
      tradingsymbol: match.label,
      name: match.label,
      exchange: match.exchange || data?.exchange || 'NSE',
      lot_size: data?.lot_size || match.lot_size || 1
    };
  }
  if (data && (data.tradingsymbol || data.name)) {
    return { ...data, instrument_token: data.instrument_token || key, value: data.value || key, lot_size: data.lot_size || 1 };
  }
  return {
    instrument_token: key,
    value: key,
    tradingsymbol: key.split('|').pop().toUpperCase(),
    name: key.split('|').pop().toUpperCase(),
    exchange: 'NSE',
    lot_size: 1
  };
};

export default function QuickOrderTicket({ instrumentData, onClose }) {
  const { livePrices, subscribeInstrumentKey, setGlobalOrderTicket, selectedInstrument } = useDashboardContext();
  
  // Draggable position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, a, select, [role="button"], .non-draggable')) {
      return;
    }
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // State variables
  const [activeInstrument, setActiveInstrument] = useState(() => resolveActiveInstrument(instrumentData, selectedInstrument));
  
  // Fetch actual lot size dynamically from instrument master db
  useEffect(() => {
    const fetchLotSize = async () => {
      const token = activeInstrument?.instrument_token || activeInstrument?.value;
      if (!token || activeInstrument?.lot_size > 1) return; // Skip if we already have a valid lot size > 1
      
      try {
        const response = await axiosInstance.get(`/api/v1/upstox/instrument/${encodeURIComponent(token)}`);
        if (response.data?.data?.lot_size) {
           setActiveInstrument(prev => ({ ...prev, lot_size: Number(response.data.data.lot_size) }));
        }
      } catch (err) {
        console.warn("Failed to fetch true lot size, fallback to 1", err?.message);
      }
    };
    fetchLotSize();
  }, [activeInstrument?.instrument_token, activeInstrument?.value]);
  useEffect(() => {
    setActiveInstrument(resolveActiveInstrument(instrumentData, selectedInstrument));
  }, [instrumentData, selectedInstrument]);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [transactionType, setTransactionType] = useState(instrumentData?.side || 'BUY'); // BUY, SELL
  const defaultQty = instrumentData?.quantity || (activeInstrument?.lot_size ? Number(activeInstrument.lot_size) : 1);
  const [quantity, setQuantity] = useState(defaultQty);
  const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT
  const [price, setPrice] = useState('');
  const [exchange, setExchange] = useState(activeInstrument?.exchange || 'NSE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (instrumentData?.side) {
      setTransactionType(instrumentData.side);
    }
    if (instrumentData?.quantity) {
      setQuantity(instrumentData.quantity);
    } else if (activeInstrument?.lot_size) {
      setQuantity(Number(activeInstrument.lot_size));
    }
  }, [instrumentData, activeInstrument]);
  
  // Live LTP from dashboard websocket
  const instKey = activeInstrument?.instrument_token || activeInstrument?.value;
  const ltp = livePrices?.[instKey]?.ltp || activeInstrument?.last_price || 0;
  const netChange = livePrices?.[instKey]?.netChange || 0;
  const pctChange = livePrices?.[instKey]?.pctChange || 0;
  
  const isUp = netChange >= 0;
  const colorClass = isUp ? 'text-[#158d60]' : 'text-[#eb4b4b]';

  // Subscribe this specific instrument for live depth data on mount
  useEffect(() => {
    if (instKey) {
      subscribeInstrumentKey(instKey);
    }
  }, [instKey]);

  useEffect(() => {
    if (orderType === 'LIMIT' && ltp && !price) {
      setPrice(ltp);
    }
  }, [orderType, ltp, price]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent placing orders for Spot Indices
    if (activeInstrument?.instrument_token?.startsWith('NSE_INDEX|') || activeInstrument?.value?.startsWith('NSE_INDEX|')) {
      toast.error('Cannot place orders directly on Spot Indices. Please select an Option or Futures contract.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        instrument_token: activeInstrument.instrument_token || activeInstrument.value,
        tradingsymbol: activeInstrument.tradingsymbol || activeInstrument.label,
        exchange: exchange,
        transaction_type: transactionType,
        order_type: orderType,
        quantity: Number(quantity),
        price: orderType === 'LIMIT' ? Number(price) : 0,
        product: 'I', // Upstox expects 'I' for Intraday
        validity: 'DAY',
        trigger_price: 0,
        is_amo: false,
        tag: orderType === 'MARKET' ? 'praxis_mkt' : 'praxis_lmt'
      };
      
      const response = await axiosInstance.post('/api/v1/orders/place', payload);
      toast.success(`Order Placed: ${response.data?.data?.order_id || 'Success'}`);
    } catch (err) {
      const data = err.response?.data;
      const upstoxErr = data?.errors?.[0]?.message || data?.errors?.[0]?.errorCode;
      toast.error(upstoxErr || data?.error || data?.message || err.message || 'Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQtyChange = (val) => {
    const lotSize = Number(activeInstrument?.lot_size) || 1;
    const currentQty = Number(quantity) || 0;
    let newQty = currentQty + (val * lotSize);
    if (newQty < lotSize) newQty = lotSize;
    setQuantity(newQty);
  };

  if (!activeInstrument) return null;

  return (
    <div 
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      className={`fixed bottom-8 right-8 z-[9999] w-[340px] ${isSearchOpen ? 'min-h-[460px]' : ''} bg-background-tooltip border border-border-default rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ${isDragging ? '' : 'transition-transform duration-75'} font-sans`}
    >
      {/* Search Overlay Modal */}
      {isSearchOpen && (
        <InstrumentSelectorModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          currentInstrument={activeInstrument}
          onSelect={(selected) => {
            setActiveInstrument(selected);
            setExchange(selected.exchange || 'NSE');
          }}
        />
      )}

      {/* HEADER SECTION - DRAGGABLE */}
      <div 
        onMouseDown={handleMouseDown}
        className="px-4 py-3 border-b border-border-default flex justify-between items-start bg-transparent cursor-grab active:cursor-grabbing select-none"
        title="Drag to move"
      >
        <div className="flex flex-col">
          <h2 className="text-text-primary text-base font-bold flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer outline-none non-draggable"
            >
              {activeInstrument.tradingsymbol || activeInstrument.label || 'ASSET'} <ChevronDown size={14} className="mt-0.5 text-text-tertiary" />
            </button>
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[13px] font-medium ${colorClass}`}>
              {isUp ? '+' : ''}{netChange.toFixed(2)} ({isUp ? '+' : ''}{pctChange.toFixed(2)}%)
            </span>
            <span className="text-text-tertiary font-mono font-medium text-[13px] ml-2">₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 non-draggable">
          <button 
            onClick={() => setGlobalOrderTicket && setGlobalOrderTicket({ type: 'FULL', data: { ...activeInstrument, side: transactionType, quantity: Number(quantity) } })} 
            className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer hover:bg-white/5"
            title="Switch to Full Ticket"
          >
            <Maximize2 size={16} />
          </button>
          <button onClick={onClose} className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer hover:bg-white/5" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* BUY / SELL TOGGLE */}
        <div className="flex gap-1.5 h-[38px] mb-4">
           <button 
             onClick={() => setTransactionType('BUY')}
             className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
               transactionType === 'BUY' 
                 ? 'bg-blue-600 text-white shadow-sm' 
                 : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-border-default'
             }`}
           >
             BUY
           </button>
           <button 
             onClick={() => setTransactionType('SELL')}
             className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
               transactionType === 'SELL' 
                 ? 'bg-[#eb4b4b] text-white shadow-sm' 
                 : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-border-default'
             }`}
           >
             SELL
           </button>
        </div>

        {/* QTY & ORDER TYPE ROW */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {/* Quantity */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between h-[28px] mb-1.5">
              <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">
                {(activeInstrument?.lot_size || 1) > 1 ? `Qty (Lot: ${activeInstrument.lot_size})` : 'Quantity'}
              </span>
            </div>
            <div className="flex items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden h-[38px] focus-within:border-blue-500 transition-colors">
              <button type="button" onClick={() => handleQtyChange(-1)} className="px-3 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-colors cursor-pointer border-r border-border-subtle"><Minus size={14} /></button>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-transparent text-text-primary text-center font-mono font-medium outline-none py-2 text-sm"
              />
              <button type="button" onClick={() => handleQtyChange(1)} className="px-3 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-colors cursor-pointer border-l border-border-subtle"><Plus size={14} /></button>
            </div>
          </div>

          {/* Price / Type */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between h-[28px] mb-1.5">
              <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">Price</span>
              <div className="flex items-center bg-background-surface rounded p-0.5 border border-border-subtle text-[10px] font-bold">
                <button 
                  type="button" 
                  onClick={() => setOrderType('MARKET')} 
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    orderType === 'MARKET' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Market
                </button>
                <button 
                  type="button" 
                  onClick={() => setOrderType('LIMIT')} 
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    orderType === 'LIMIT' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>
            <div className={`flex items-center bg-background-surface border rounded-md overflow-hidden h-[38px] focus-within:border-blue-500 transition-colors relative ${price === '0.00' ? 'border-[#e06655]' : 'border-border-subtle'}`}>
              <span className="pl-3 text-text-tertiary font-mono text-xs select-none">₹</span>
              <input 
                type="number"
                value={orderType === 'MARKET' ? '' : price}
                onChange={(e) => {
                  setOrderType('LIMIT');
                  setPrice(e.target.value);
                }}
                placeholder={orderType === 'MARKET' ? (ltp ? ltp.toFixed(2) : 'Market') : '0.00'}
                disabled={orderType === 'MARKET'}
                className="w-full bg-transparent text-text-primary pl-1.5 pr-3 py-2 font-mono font-medium outline-none disabled:opacity-50 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* ACTION BUTTON (BOTTOM) */}
      <div className="px-4 py-4 border-t border-border-default bg-background-surface">
         <div className="flex justify-between items-center mb-3">
           <span className="text-[12px] text-text-secondary font-medium tracking-wide">Required margin</span>
           <span className="text-[14px] text-text-primary font-mono font-medium">
             ₹{((orderType === 'LIMIT' && price ? Number(price) : ltp) * quantity * (activeInstrument?.lot_size || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
           </span>
         </div>
         <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || activeInstrument?.instrument_token?.startsWith('NSE_INDEX|')}
          className={`w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed ${
            transactionType === 'BUY'
              ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `${transactionType} ${orderType}`
          )}
        </button>
      </div>
    </div>
  );
}
