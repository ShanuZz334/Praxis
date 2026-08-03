import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Plus, Minus, ArrowRightLeft, Info, Clock, Check, ShieldCheck, Shield, Minimize2 } from 'lucide-react';
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

export default function OrderTicket({ instrumentData, onClose }) {
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
  const [activeTab, setActiveTab] = useState('REGULAR'); // REGULAR, GTT, MTF
  const [productType, setProductType] = useState('DELIVERY'); // DELIVERY, INTRADAY
  const [transactionType, setTransactionType] = useState(instrumentData?.side || 'BUY'); // BUY, SELL
  const defaultQty = instrumentData?.quantity || (instrumentData?.lot_size ? Number(instrumentData.lot_size) : 1);
  const [quantity, setQuantity] = useState(defaultQty);
  const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT
  const [price, setPrice] = useState('');
  const [exchange, setExchange] = useState(activeInstrument?.exchange || 'NSE');

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
  
  // GTT states
  const [gttCondition, setGttCondition] = useState('BELOW'); // 'BELOW', 'ABOVE', 'IMMEDIATELY'
  const [isGttDropdownOpen, setIsGttDropdownOpen] = useState(false);
  const [gttPrice, setGttPrice] = useState('');
  const [gttPercent, setGttPercent] = useState('');
  const [mppEnabled, setMppEnabled] = useState(false);
  
  // Accordion & Dropdown states
  const [isMarketDepthOpen, setIsMarketDepthOpen] = useState(false);
  const [isAdditionalSettingsOpen, setIsAdditionalSettingsOpen] = useState(false);
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
  
  // Options & Additional Fields
  const [qtyMode, setQtyMode] = useState('Quantity'); // Quantity, Amount
  const [useMtf, setUseMtf] = useState(false);
  const [addStopLoss, setAddStopLoss] = useState(false);
  const [slPrice, setSlPrice] = useState('');
  const [slPercent, setSlPercent] = useState('');
  const [addTrailingSl, setAddTrailingSl] = useState(false);
  const [trailingGap, setTrailingGap] = useState('1.30');
  
  const [addTarget, setAddTarget] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [targetPercent, setTargetPercent] = useState('');
  
  const [showTriggerField, setShowTriggerField] = useState(false);
  const [triggerPrice, setTriggerPrice] = useState('');
  
  const [disclosedQuantity, setDisclosedQuantity] = useState('');
  const [validity, setValidity] = useState('DAY');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Sync activeTab side effect
  useEffect(() => {
    if (activeTab === 'MTF') {
      setUseMtf(true);
      setProductType('DELIVERY');
    } else {
      setUseMtf(false);
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeTab === 'GTT') {
         // Construct GTT Payload
         const rules = [];
         
         // Entry rule
         rules.push({
           strategy: "ENTRY",
           trigger_type: gttCondition,
           trigger_price: Number(gttPrice) || ltp
         });

         if (addStopLoss) {
            const defaultSl = transactionType === 'BUY' ? ltp * 0.96 : ltp * 1.04;
            const slRule = {
              strategy: "STOPLOSS",
              trigger_type: "IMMEDIATE",
              trigger_price: Number(slPrice) || Number(defaultSl.toFixed(2))
            };
            if (addTrailingSl && trailingGap) {
               slRule.trailing_gap = Number(trailingGap);
            }
            rules.push(slRule);
         }

         if (addTarget) {
            const defaultTarget = transactionType === 'BUY' ? ltp * 1.05 : ltp * 0.95;
            rules.push({
              strategy: "TARGET",
              trigger_type: "IMMEDIATE",
              trigger_price: Number(targetPrice) || Number(defaultTarget.toFixed(2))
            });
         }

         const gttPayload = {
            type: rules.length > 1 ? "MULTIPLE" : "SINGLE",
            quantity: Number(quantity),
            product: useMtf ? "MTF" : (productType === 'DELIVERY' ? 'D' : 'I'),
            transaction_type: transactionType,
            instrument_key: activeInstrument.instrument_token || activeInstrument.value,
            order_type: orderType,
            price: orderType === 'LIMIT' ? Number(price) : 0,
            rules: rules
         };
         const response = await axiosInstance.post('/api/v1/orders/gtt/place', gttPayload);
         
         if (response.data?.status === 'error' || response.data?.errors) {
            throw { response: { data: response.data } }; // Mimic axios error structure to hit the catch block
         }

         toast.success(`GTT Order Placed: ${response.data?.data?.order_id || 'Success'}`);
      } else {
         // REGULAR OR MTF
         const payload = {
            instrument_key: activeInstrument.instrument_token || activeInstrument.value,
            quantity: Number(quantity),
            transaction_type: transactionType,
            order_type: orderType,
            price: orderType === 'LIMIT' ? Number(price) : 0,
            product: useMtf ? 'MTF' : (productType === 'DELIVERY' ? 'D' : 'I'),
            validity: validity,
            disclosed_quantity: Number(disclosedQuantity) || 0,
            trigger_price: showTriggerField ? Number(triggerPrice) : 0,
            is_amo: false,
            tag: orderType === 'MARKET' ? 'praxis_mkt' : 'praxis_lmt'
         };
         
         const response = await axiosInstance.post('/api/v1/orders/place', payload);
         toast.success(`Order Placed: ${response.data?.data?.order_id || 'Success'}`);
      }
      // onClose(); // Removed so scalpers can rapidly place multiple orders
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

  let calcPrice = ltp;
  if (activeTab === 'GTT' && gttPrice) {
    calcPrice = Number(gttPrice) || ltp;
  } else if (orderType === 'LIMIT' && price) {
    calcPrice = Number(price) || ltp;
  }
  const totalBuyingPower = calcPrice * quantity * (activeInstrument?.lot_size || 1);
  const mtfMargin = 0.2645; // Approx 3.78x leverage matching Upstox funds ratio for this asset
  const yourFunds = totalBuyingPower * mtfMargin;
  const upstoxFunds = totalBuyingPower - yourFunds;
  const yourFundsPct = totalBuyingPower > 0 ? (yourFunds / totalBuyingPower) * 100 : 0;
  const upstoxFundsPct = totalBuyingPower > 0 ? (upstoxFunds / totalBuyingPower) * 100 : 0;

  if (!activeInstrument) return null;

  return (
    <div 
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      className={`fixed bottom-8 right-8 z-[9999] w-[360px] ${isSearchOpen ? 'min-h-[480px]' : ''} bg-background-tooltip border border-border-default rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ${isDragging ? '' : 'transition-transform duration-75'} font-sans`}
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
            onClick={() => setGlobalOrderTicket && setGlobalOrderTicket({ type: 'QUICK', data: { ...activeInstrument, side: transactionType, quantity: Number(quantity) } })} 
            className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer hover:bg-white/5"
            title="Switch to Quick Order"
          >
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose} className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer hover:bg-white/5" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center px-4 border-b border-border-default gap-6 text-[13px] font-bold bg-transparent">
        {[
          { id: 'REGULAR', label: 'Regular' },
          { id: 'GTT', label: 'GTT' },
          { id: 'MTF', label: 'MTF', badge: '4.3X' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 relative flex items-center gap-2 transition-all cursor-pointer ${
                isActive 
                  ? 'text-blue-500 font-extrabold' 
                  : 'text-text-secondary hover:text-text-primary font-semibold'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm transition-all ${
                  isActive ? 'bg-[#24aeb0] text-black shadow-sm ring-1 ring-blue-400/40' : 'bg-[#24aeb0]/80 text-black'
                }`}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[65vh] p-4 hide-scrollbar">
        

        {activeTab === 'MTF' && (
          <div className="mb-4">
            <p className="text-[13px] text-text-primary font-medium">
              You'll get <span className="font-bold">{Math.round(((1 / mtfMargin) - 1) * 100)}%</span> more stocks with the same amount
            </p>
          </div>
        )}

        {/* Product Type (Delivery / Intraday) */}
        {activeTab !== 'MTF' && (
          <div className="flex gap-3 mb-5">
          {/* Delivery */}
          <button 
            onClick={() => setProductType('DELIVERY')}
            className={`flex-1 flex flex-col items-center justify-center rounded-md h-[42px] transition-all cursor-pointer ${
              productType === 'DELIVERY' 
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm' 
                : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
            }`}
          >
            <span className="text-[13px] font-bold">Delivery <span className={`text-[10px] font-normal ml-0.5 ${productType === 'DELIVERY' ? 'text-blue-400/80' : 'opacity-80'}`}>(Long term)</span></span>
          </button>

          {/* Intraday */}
          <button 
            onClick={() => setProductType('INTRADAY')}
            className={`flex-1 flex flex-col items-center justify-center rounded-md h-[42px] transition-all cursor-pointer ${
              productType === 'INTRADAY' 
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm' 
                : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
            }`}
          >
            <span className="text-[13px] font-bold">Intraday <span className={`text-[10px] font-normal ml-0.5 ${productType === 'INTRADAY' ? 'text-blue-400/80' : 'opacity-80'}`}>(Same day)</span></span>
          </button>
        </div>
        )}

        {/* QTY & ORDER TYPE ROW */}
        <div className="flex gap-4 mb-5">
          {/* Quantity */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2 relative">
              <div className="w-[85px] z-[70]">
                <UiverseDropdown 
                  options={[
                    {label: activeInstrument?.lot_size > 1 ? `Qty (Lot: ${activeInstrument.lot_size})` : 'Quantity', value: 'Quantity'}, 
                    {label: 'Amount', value: 'Amount'}
                  ]}
                  value={qtyMode}
                  onChange={(val) => setQtyMode(val)}
                  hideSearch={true}
                  className="!min-w-[85px] text-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="flex items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden flex-1 focus-within:border-blue-500 transition-colors h-[38px]">
                <button type="button" onClick={() => handleQtyChange(-1)} className="px-3 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-colors cursor-pointer border-r border-border-subtle"><Minus size={14} /></button>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-transparent text-text-primary text-center font-mono font-medium outline-none py-2 text-sm"
                />
                <button type="button" onClick={() => handleQtyChange(1)} className="px-3 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-colors cursor-pointer border-l border-border-subtle"><Plus size={14} /></button>
              </div>
              <button 
                type="button"
                onClick={() => setQtyMode(qtyMode === 'Quantity' ? 'Amount' : 'Quantity')}
                className="h-[38px] w-[38px] flex items-center justify-center border border-border-subtle rounded-md text-blue-500 hover:bg-background-subtle transition-colors cursor-pointer shrink-0"
              >
                <ArrowRightLeft size={14} />
              </button>
            </div>
          </div>

          {/* Side / Type */}
          {activeTab === 'GTT' ? (
             <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] text-text-secondary font-bold">Side</label>
                </div>
                <div className="flex gap-1.5 h-[38px]">
                   <button 
                     onClick={() => setTransactionType('BUY')}
                     className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
                       transactionType === 'BUY' 
                         ? 'bg-blue-600 text-white shadow-sm' 
                         : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
                     }`}
                   >
                     Buy
                   </button>
                   <button 
                     onClick={() => setTransactionType('SELL')}
                     className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
                       transactionType === 'SELL' 
                         ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm' 
                         : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle border border-transparent'
                     }`}
                   >
                     Sell
                   </button>
                </div>
             </div>
          ) : (
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2 relative">
                <div className="w-[85px] z-[70]">
                  <UiverseDropdown 
                    options={[{label: 'Market', value: 'MARKET'}, {label: 'Limit', value: 'LIMIT'}]}
                    value={orderType}
                    onChange={(val) => setOrderType(val)}
                    hideSearch={true}
                    className="!min-w-[85px] text-blue-500"
                  />
                </div>
                <button 
                  className={`text-[11px] hover:text-text-primary flex items-center gap-0.5 cursor-pointer font-bold transition-colors ${showTriggerField ? 'text-text-primary' : 'text-blue-500'}`}
                  onClick={() => setShowTriggerField(!showTriggerField)}
                >
                  {showTriggerField ? <X size={10} /> : <Plus size={10} />} Trigger
                </button>
              </div>
              <div className="flex gap-1.5 items-center">
                <div className={`flex items-center bg-background-surface border rounded-md overflow-hidden flex-1 focus-within:border-blue-500 transition-colors relative h-[38px] ${price === '0.00' ? 'border-[#e06655]' : 'border-border-subtle'}`}>
                   <input 
                    type="number"
                    value={orderType === 'MARKET' ? '' : price}
                    onChange={(e) => {
                      setOrderType('LIMIT');
                      setPrice(e.target.value);
                    }}
                    placeholder={orderType === 'MARKET' ? 'Market' : '0.00'}
                    disabled={orderType === 'MARKET'}
                    className="w-full bg-transparent text-text-primary pl-3 pr-2 py-2 font-mono font-medium outline-none disabled:opacity-50 text-sm"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setOrderType(orderType === 'MARKET' ? 'LIMIT' : 'MARKET')}
                  className="h-[38px] w-[38px] flex items-center justify-center border border-border-subtle rounded-md text-blue-500 hover:bg-background-subtle transition-colors cursor-pointer shrink-0"
                >
                  <ArrowRightLeft size={14} />
                </button>
              </div>
              {price === '0.00' && (
                <p className="text-[#e06655] text-[10px] mt-1">This field must be greater than zero</p>
              )}
            </div>
          )}
        </div>

        {/* TRIGGER PRICE FIELD (If toggled) */}
        {showTriggerField && activeTab !== 'GTT' && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-[11px] text-text-primary font-medium block mb-1.5">Order type</label>
            <div className="relative mb-3 z-[60]">
              <UiverseDropdown 
                options={[{label: 'Trigger price (SL)', value: 'SL'}]}
                value={'SL'}
                onChange={() => {}}
                hideSearch={true}
                className="!w-full"
              />
            </div>
            
            <label className="text-[11px] text-text-primary font-medium block mb-1.5">Trigger price</label>
            <input 
              type="number"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-background-surface border rounded-md px-3 py-2 text-text-primary font-mono font-medium outline-none text-sm focus:border-blue-500 transition-colors mb-1 ${triggerPrice && Number(triggerPrice) > Number(price || 0) ? 'border-[#e06655]' : 'border-border-subtle'}`}
            />
            {triggerPrice && Number(triggerPrice) > Number(price || 0) && (
              <p className="text-[#e06655] text-[10px]">This field must be less than or equal to price({price || '0.00'})</p>
            )}
            <p className="text-text-secondary text-[11px] mt-1">Triggers above order when trigger price is reached</p>
          </div>
        )}

        {/* BUY / SELL TOGGLE FOR REGULAR (If they want to switch in regular mode) */}
        {activeTab !== 'GTT' && (
           <div className="flex gap-1.5 h-[38px] mb-5">
              <button 
                onClick={() => setTransactionType('BUY')}
                className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${transactionType === 'BUY' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent border border-border-subtle text-text-primary hover:bg-background-subtle'}`}
              >
                Buy
              </button>
              <button 
                onClick={() => setTransactionType('SELL')}
                className={`flex-1 rounded-md text-[13px] font-bold transition-all cursor-pointer ${transactionType === 'SELL' ? 'bg-[#eb4b4b] text-white shadow-sm' : 'bg-transparent border border-border-subtle text-text-primary hover:bg-background-subtle'}`}
              >
                Sell
              </button>
           </div>
        )}


        {/* MTF BANNER */}
        <div 
          className={`border rounded-lg px-3 py-2.5 flex items-center justify-between cursor-pointer mb-5 transition-all ${
            useMtf 
              ? 'bg-[#091f21] border-[#009688] shadow-[0_0_15px_rgba(0,150,136,0.15)]' 
              : 'bg-[#0b171c]/80 border-[#0d4a46]/50 hover:border-[#009688]/60'
          }`}
          onClick={() => {
             if (activeTab === 'MTF') {
                setActiveTab('REGULAR');
             } else if (activeTab === 'REGULAR') {
                setActiveTab('MTF');
             } else {
                setUseMtf(!useMtf);
             }
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${useMtf ? 'bg-[#009688] border-[#009688]' : 'border-[#2d4d54] bg-[#071317]'}`}>
              {useMtf && <Check size={12} className="text-black stroke-[3]" />}
            </div>
            <div className="text-[12.5px] text-text-primary font-bold flex items-center flex-wrap gap-x-1.5">
              Buy for <span className="font-mono font-medium">₹{(ltp / 3.8).toFixed(2)}</span>/share with MTF
              <span className="border border-[#00b4a0]/60 text-[#00e5cc] text-[10px] font-bold px-1.5 py-[0.5px] rounded ml-1">3.8X</span>
            </div>
          </div>
          <Info size={16} className="text-[#00e5cc]/70 hover:text-[#00e5cc] shrink-0 transition-colors" />
        </div>

        {/* GTT SPECIFIC UI */}
        {activeTab === 'GTT' && (
          <div className="mb-5 animate-in fade-in duration-300">
             <div className="flex items-center justify-between mb-3 relative">
                <div className="flex items-center gap-2">
                   <span className="text-[13px] text-text-primary font-bold">Place order</span>
                   <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setIsGttDropdownOpen(!isGttDropdownOpen)}
                        className="text-[13px] text-[#6d79e8] font-bold flex items-center gap-1 cursor-pointer hover:text-[#8e99ff] transition-colors outline-none"
                      >
                        {gttCondition === 'BELOW' ? 'If price is below' : gttCondition === 'ABOVE' ? 'If price is above' : 'Immediately'}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isGttDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isGttDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 bg-[#121622] border border-[#2b2f3e] rounded-lg py-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)] w-[180px] z-[999] animate-in fade-in zoom-in-95 duration-150">
                          <div 
                            onClick={() => { setGttCondition('BELOW'); setIsGttDropdownOpen(false); }}
                            className={`px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${gttCondition === 'BELOW' ? 'text-white font-bold bg-[#1a1f30]' : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1f30]/60'}`}
                          >
                            If price is below
                          </div>
                          <div 
                            onClick={() => { setGttCondition('ABOVE'); setIsGttDropdownOpen(false); }}
                            className={`px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${gttCondition === 'ABOVE' ? 'text-white font-bold bg-[#1a1f30]' : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1f30]/60'}`}
                          >
                            If price is above
                          </div>
                          <div 
                            onClick={() => { setGttCondition('IMMEDIATELY'); setIsGttDropdownOpen(false); }}
                            className={`px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${gttCondition === 'IMMEDIATELY' ? 'text-white font-bold bg-[#1a1f30]' : 'text-text-secondary hover:text-text-primary hover:bg-[#1a1f30]/60'}`}
                          >
                            Immediately
                          </div>
                        </div>
                      )}
                   </div>
                </div>
                <div className="w-[16px] h-[16px] bg-[#2b2f3e] rounded-full text-text-secondary hover:text-text-primary flex items-center justify-center font-bold text-[10px] cursor-pointer">?</div>
             </div>
             
             {gttCondition !== 'IMMEDIATELY' ? (
               <div className="flex items-center gap-2 mb-4">
                 <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                   <span className="text-text-tertiary mr-2 text-[13px] font-mono">₹</span>
                   <input 
                      type="number"
                      value={gttPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGttPrice(val);
                        if (ltp && val) {
                          const pct = (((Number(val) - ltp) / ltp) * 100).toFixed(2);
                          setGttPercent(pct);
                        } else {
                          setGttPercent('');
                        }
                      }}
                      placeholder={ltp ? ltp.toFixed(2) : "0.00"}
                      className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-sm"
                    />
                 </div>
                 <ArrowRightLeft size={16} className="text-text-secondary shrink-0 mx-1" />
                 <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                   <input 
                      type="number"
                      value={gttPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGttPercent(val);
                        if (ltp && val !== '') {
                          const p = (ltp * (1 + Number(val) / 100)).toFixed(2);
                          setGttPrice(p);
                        } else {
                          setGttPrice('');
                        }
                      }}
                      placeholder="0.25"
                      className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-right text-sm"
                    />
                   <span className="text-text-tertiary ml-2 text-[13px] font-mono">%</span>
                 </div>
               </div>
             ) : (
               <div className="bg-[#121622] border border-[#2b2f3e] rounded-md px-3 py-2.5 text-[12px] text-text-secondary mb-4 flex items-center gap-2">
                 <Info size={14} className="text-[#6d79e8]" />
                 <span>Order triggers immediately when submitted.</span>
               </div>
             )}


             
             <div className="space-y-4 mb-5">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <label className="praxis-checkbox-wrapper scale-[0.7] shrink-0">
                      <input type="checkbox" checked={addStopLoss} onChange={() => setAddStopLoss(!addStopLoss)} />
                      <span className="praxis-checkmark"></span>
                    </label>
                    <span className="text-[13px] text-text-primary font-bold flex items-center gap-1">Add stop loss <ShieldCheck size={14} className="text-text-secondary" /></span>
                  </label>
                  
                  {addStopLoss && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                          <span className="text-text-tertiary mr-2 text-[13px] font-mono">₹</span>
                          <input 
                             type="number"
                             value={slPrice}
                             onChange={(e) => setSlPrice(e.target.value)}
                             placeholder={ltp ? (ltp * 0.96).toFixed(2) : "0.00"}
                             className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-sm"
                           />
                        </div>
                        <ArrowRightLeft size={16} className="text-text-secondary shrink-0 mx-1" />
                        <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                          <input 
                             type="number"
                             value={slPercent}
                             onChange={(e) => setSlPercent(e.target.value)}
                             placeholder="0.25"
                             className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-right text-sm"
                           />
                           <span className="text-text-tertiary ml-2 text-[13px] font-mono">%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer group flex-1">
                          <label className="praxis-checkbox-wrapper scale-[0.6] shrink-0">
                            <input type="checkbox" checked={addTrailingSl} onChange={() => setAddTrailingSl(!addTrailingSl)} />
                            <span className="praxis-checkmark"></span>
                          </label>
                          <span className="text-[12px] text-text-primary font-bold flex items-center gap-1">Trailing stop-loss <Info size={12} className="text-text-secondary" /></span>
                        </label>
                        {addTrailingSl && (
                          <div className="flex-1">
                            <label className="text-[12px] text-text-primary font-bold flex items-center gap-1 mb-1">Trailing gap <Info size={12} className="text-text-secondary" /></label>
                            <input 
                              type="number"
                              value={trailingGap}
                              onChange={(e) => setTrailingGap(e.target.value)}
                              className="w-full bg-background-surface border border-border-subtle rounded-md px-3 py-1.5 text-text-primary font-mono font-medium outline-none text-sm focus:border-blue-500 transition-colors"
                            />
                          </div>
                        )}
                      </div>
                      
                      {addTrailingSl && (
                        <div className="bg-background-card border border-border-subtle rounded-md p-3 flex items-start gap-3">
                          <Info size={16} className="text-text-primary shrink-0 mt-0.5" />
                          <div className="text-[12px] text-text-primary leading-relaxed">
                            For every ₹{trailingGap} rise in LTP, the stop loss will move up with the same value. <a href="#" className="text-blue-500 hover:underline">Learn more</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-[#2b2d35] w-full my-2" />

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <label className="praxis-checkbox-wrapper scale-[0.7] shrink-0">
                      <input type="checkbox" checked={addTarget} onChange={() => setAddTarget(!addTarget)} />
                      <span className="praxis-checkmark"></span>
                    </label>
                    <span className="text-[13px] text-text-primary font-bold flex items-center gap-1">Add target</span>
                  </label>
                  
                  {addTarget && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                          <span className="text-text-tertiary mr-2 text-[13px] font-mono">₹</span>
                          <input 
                             type="number"
                             value={targetPrice}
                             onChange={(e) => setTargetPrice(e.target.value)}
                             placeholder={ltp ? ltp.toFixed(2) : "0.00"}
                             className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-sm"
                           />
                        </div>
                        <ArrowRightLeft size={16} className="text-text-secondary shrink-0 mx-1" />
                        <div className="flex flex-1 items-center bg-background-surface border border-border-subtle rounded-md overflow-hidden focus-within:border-blue-500 transition-colors px-3 h-[38px]">
                          <input 
                             type="number"
                             value={targetPercent}
                             onChange={(e) => setTargetPercent(e.target.value)}
                             placeholder="0.25"
                             className="w-full bg-transparent text-text-primary font-mono font-medium outline-none text-right text-sm"
                           />
                           <span className="text-text-tertiary ml-2 text-[13px] font-mono">%</span>
                        </div>
                      </div>
                      
                      <div className="bg-background-card border border-[#3a2c5a] rounded-lg px-3 py-2.5 flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 text-[12px] text-text-primary font-medium">
                          <ShieldCheck size={14} className="text-text-secondary" />
                          SL leg is protected by MPP
                        </div>
                        <span className="text-[11px] text-blue-500 font-bold cursor-pointer hover:text-text-primary transition-colors">Edit</span>
                      </div>
                    </div>
                  )}
                </div>
             </div>
             

          </div>
        )}

        {/* ACCORDIONS */}
        {activeTab !== 'GTT' && (
          <div className="space-y-4 mt-2">
            {/* Market Depth Accordion */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer group mb-1"
                onClick={() => setIsMarketDepthOpen(!isMarketDepthOpen)}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-text-primary flex items-center gap-1 group-hover:text-text-primary transition-colors">
                    Market depth <ArrowRightLeft size={12} className="text-text-secondary ml-1 rotate-90" />
                  </span>
                  {isMarketDepthOpen && <span className="text-[11px] text-text-secondary mt-0.5">Click on the price to select</span>}
                </div>
                <ChevronDown size={16} className={`text-text-secondary group-hover:text-text-primary transition-transform ${isMarketDepthOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isMarketDepthOpen && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-medium text-text-secondary mb-2 px-1">
                    <div className="text-left">Quantity</div>
                    <div className="text-right text-[#158d60]">Bid Price</div>
                    <div className="text-right text-[#eb4b4b]">Ask Price</div>
                    <div className="text-right">Quantity</div>
                  </div>
                  {/* Live Market Depth */}
                  <div className="space-y-0.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const quote = (livePrices?.[instrumentData?.instrument_token]?.marketDepth || [])[i] || { bidQ: 0, bidP: 0, askQ: 0, askP: 0 };
                      const isAskActive = quote.askQ > 0;
                      const isBidActive = quote.bidQ > 0;
                      return (
                        <div key={i} className="grid grid-cols-4 gap-2 text-[12px] font-mono text-text-primary cursor-pointer hover:bg-background-subtle rounded px-1 py-1 transition-colors">
                          <div className={`text-left -my-1 py-1 pl-1 rounded-l ${isBidActive ? 'bg-[#158d60]/20 text-[#158d60]' : ''}`}>{Number(quote.bidQ || 0).toLocaleString()}</div>
                          <div className={`text-right -my-1 py-1 pr-1 rounded-r ${isBidActive ? 'bg-[#158d60]/20 text-[#158d60]' : ''}`}>{Number(quote.bidP || 0).toFixed(2)}</div>
                          <div className={`text-right -my-1 py-1 pl-1 rounded-l ${isAskActive ? 'bg-[#eb4b4b]/20 text-[#eb4b4b]' : ''}`}>{Number(quote.askP || 0).toFixed(2)}</div>
                          <div className={`text-right -my-1 py-1 pr-1 rounded-r ${isAskActive ? 'bg-[#eb4b4b]/20 text-[#eb4b4b]' : ''}`}>{Number(quote.askQ || 0).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 px-1">
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary mb-1.5">
                      <span>Total buy qty.<br/>
                        <span className="text-text-primary">
                          {livePrices?.[instrumentData?.instrument_token]?.tbq || livePrices?.[instrumentData?.instrument_token]?.tsq 
                            ? Math.round((Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) / (Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) + Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0))) * 100) 
                            : 0}% ({Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0).toLocaleString()})
                        </span>
                      </span>
                      <span className="text-right">Total sell qty.<br/>
                        <span className="text-text-primary">
                          ({Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0).toLocaleString()}) {livePrices?.[instrumentData?.instrument_token]?.tbq || livePrices?.[instrumentData?.instrument_token]?.tsq 
                            ? Math.round((Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0) / (Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) + Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0))) * 100) 
                            : 0}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#373a46] rounded-full overflow-hidden flex">
                       <div className="h-full bg-[#158d60]" style={{ width: `${livePrices?.[instrumentData?.instrument_token]?.tbq || livePrices?.[instrumentData?.instrument_token]?.tsq ? Math.round((Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) / (Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) + Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0))) * 100) : 0}%` }}></div>
                       <div className="h-full bg-[#eb4b4b]" style={{ width: `${livePrices?.[instrumentData?.instrument_token]?.tbq || livePrices?.[instrumentData?.instrument_token]?.tsq ? Math.round((Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0) / (Number(livePrices?.[instrumentData?.instrument_token]?.tbq || 0) + Number(livePrices?.[instrumentData?.instrument_token]?.tsq || 0))) * 100) : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-px bg-[#2b2d35] w-full" />

            {/* Additional Settings Accordion */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer group mb-1"
                onClick={() => setIsAdditionalSettingsOpen(!isAdditionalSettingsOpen)}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-text-primary flex items-center gap-1 group-hover:text-text-primary transition-colors">
                    Additional settings
                  </span>
                  <span className="text-[11px] text-text-secondary mt-0.5">Add validity & disclosed quantity.</span>
                </div>
                <ChevronDown size={16} className={`text-text-secondary group-hover:text-text-primary transition-transform ${isAdditionalSettingsOpen ? 'rotate-180' : ''}`} />
              </div>

              {isAdditionalSettingsOpen && (
                <div className="mt-4 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex-1">
                    <label className="text-[11px] text-text-primary font-bold mb-1.5 block">Disclosed Quantity</label>
                    <input 
                      type="number" 
                      value={disclosedQuantity}
                      onChange={(e) => setDisclosedQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full bg-background-surface border border-border-subtle rounded-md px-3 py-2 text-text-primary font-mono text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] text-text-primary font-bold mb-1.5 block">Validity</label>
                    <div className="relative z-[50]">
                      <UiverseDropdown 
                        options={[{label: 'DAY', value: 'DAY'}, {label: 'IOC', value: 'IOC'}]}
                        value={validity}
                        onChange={(val) => setValidity(val)}
                        hideSearch={true}
                        className="!w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Market Closed Banner */}
            <div className="bg-background-card border border-border-default rounded-lg p-3 flex items-start gap-3 mt-4">
              <Clock size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-text-primary leading-snug">
                Markets are closed. Order will be placed during the next trading session.
              </div>
            </div>
          </div>
        )}

        {/* MTF Calculator Widget (Bottom) */}
        {activeTab === 'MTF' && (
          <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="border border-border-default rounded-lg p-4 mb-4 bg-background-surface">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary text-[12px]">Your funds</span>
                <span className="text-text-secondary text-[12px]">+</span>
                <span className="text-text-secondary text-[12px]">Upstox funds</span>
              </div>
              <div className="flex justify-between items-center mb-2 font-mono font-medium text-[13px]">
                <span className="text-[#24aeb0]">{yourFunds.toFixed(2)} <span className="text-text-primary text-[11px]">({yourFundsPct.toFixed(2)}%)</span></span>
                <span className="text-[#8468d9]"><span className="text-text-primary text-[11px]">({upstoxFundsPct.toFixed(2)}%)</span> {upstoxFunds.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full flex rounded-full overflow-hidden mb-3">
                <div className="bg-[#24aeb0] h-full transition-all duration-300" style={{ width: `${yourFundsPct}%` }}></div>
                <div className="w-[1px] bg-background-tooltip h-full z-10"></div>
                <div className="bg-[#8468d9] h-full transition-all duration-300" style={{ width: `${upstoxFundsPct}%` }}></div>
              </div>
              <div className="text-center text-text-primary text-[13px] font-bold">
                Your total buying power = {totalBuyingPower.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

          </div>
        )}

      </div>
      
      {/* ACTION BUTTON (BOTTOM) */}
      <div className="px-4 py-4 border-t border-border-default bg-background-surface">
         <div className="flex justify-between items-center mb-3">
           <span className="text-[12px] text-text-secondary font-medium tracking-wide">Required margin</span>
           <span className="text-[14px] text-text-primary font-mono font-medium">
             ₹{(totalBuyingPower / (useMtf ? 4.3 : 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
           </span>
         </div>
         <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all 
            cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50
            ${transactionType === 'BUY' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#eb4b4b] hover:bg-[#f35a5a]'}`}
          >
            {isSubmitting ? 'PROCESSING...' : `${activeTab === 'GTT' ? 'Place GTT' : (transactionType === 'BUY' ? 'Buy' : 'Sell')} ${activeTab !== 'GTT' ? orderType : ''}`}
          </button>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
