import React, { useState, useEffect } from 'react';
import { X, CheckCheck, ChevronDown, Layers, Building2, Sparkles, AlertCircle, CheckCircle2, Loader2, Filter, TrendingUp, Zap } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { toast } from 'sonner';

const QUICK_INDICES = [
  { label: 'Nifty 50', query: 'Nifty 50' },
  { label: 'Bank Nifty', query: 'Nifty Bank' },
  { label: 'Fin Nifty', query: 'FINNIFTY' },
  { label: 'Midcap', query: 'MIDCPNIFTY' },
];

const QUICK_EQUITIES = [
  { label: 'RELIANCE', symbol: 'RELIANCE' },
  { label: 'HDFCBANK', symbol: 'HDFCBANK' },
  { label: 'TCS', symbol: 'TCS' },
  { label: 'INFY', symbol: 'INFY' },
  { label: 'ICICIBANK', symbol: 'ICICIBANK' },
];

export default function InstrumentSelectorModal({
  isOpen,
  onClose,
  currentInstrument,
  onSelect,
  mode = 'trade'
}) {
  const { selectedInstrument } = useDashboardContext();
  
  const [category, setCategory] = useState(() => {
    const activeKey = currentInstrument?.instrument_token || currentInstrument?.value || '';
    if (activeKey.startsWith('NSE_EQ|') || currentInstrument?.segment === 'EQ' || FO_EQUITIES.some(e => e.value === activeKey)) {
      return 'Companies';
    }
    return 'Indices';
  });
  
  // Indices states
  const [selectedIndexKey, setSelectedIndexKey] = useState(() => {
    const activeKey = currentInstrument?.instrument_token || currentInstrument?.value;
    if (activeKey?.startsWith('NSE_INDEX|')) {
      return activeKey;
    }
    return FO_INDICES[0]?.value || 'NSE_INDEX|Nifty 50';
  });
  
  // Companies states
  const [selectedCompanyKey, setSelectedCompanyKey] = useState(() => {
    const activeKey = currentInstrument?.instrument_token || currentInstrument?.value;
    if (activeKey?.startsWith('NSE_EQ|')) {
      return activeKey;
    }
    return FO_EQUITIES[0]?.value || 'NSE_EQ|INE002A01018';
  });
  const [companyTradeMode, setCompanyTradeMode] = useState('EQUITY'); // 'EQUITY' | 'OPTIONS'

  // Option contracts states
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [selectedOptionKey, setSelectedOptionKey] = useState(null);
  const [optionTypeFilter, setOptionTypeFilter] = useState('ALL'); // 'ALL' | 'CE' | 'PE'

  // Sync selected instrument and category whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const activeKey = currentInstrument?.instrument_token || currentInstrument?.value || selectedInstrument || '';
      const isCompany = activeKey.startsWith('NSE_EQ|') || currentInstrument?.segment === 'EQ' || FO_EQUITIES.some(e => e.value === activeKey);
      const isIndex = activeKey.startsWith('NSE_INDEX|') || FO_INDICES.some(i => i.value === activeKey);
      
      if (isCompany) {
        setCategory('Companies');
        setSelectedCompanyKey(activeKey);
        setCompanyTradeMode(currentInstrument?.option_type ? 'OPTIONS' : 'EQUITY');
        if (currentInstrument?.option_type) {
          setSelectedOptionKey(activeKey);
        }
      } else {
        setCategory('Indices');
        if (isIndex) {
          setSelectedIndexKey(activeKey);
        }
        if (currentInstrument?.option_type) {
          setSelectedOptionKey(activeKey);
        }
      }
    }
  }, [isOpen, currentInstrument, selectedInstrument]);

  // Fetch option contracts when underlying changes (for Indices or for Company in OPTIONS mode)
  useEffect(() => {
    if (!isOpen) return;

    let targetUnderlying = null;
    if (category === 'Indices') {
      targetUnderlying = selectedIndexKey;
    } else if (category === 'Companies' && companyTradeMode === 'OPTIONS') {
      targetUnderlying = selectedCompanyKey;
    }

    if (targetUnderlying) {
      setContractsLoading(true);
      setSelectedOptionKey(null);
      axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(targetUnderlying))
        .then(res => {
          const raw = res.data?.data || res.data || [];
          const sorted = raw.sort((a, b) => {
            const dateA = new Date(a.expiry || a.expiry_date || 0);
            const dateB = new Date(b.expiry || b.expiry_date || 0);
            if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
            return (a.strike || a.strike_price || 0) - (b.strike || b.strike_price || 0);
          });
          const formatted = sorted.map(c => {
            const sym = String(c.trading_symbol || c.name || c.instrument_key || '').toUpperCase();
            let oType = 'PE';
            if (c.option_type === 'CE' || c.instrument_type === 'CE' || sym.endsWith('CE') || sym.includes('-CE') || sym.match(/CE\d*$/)) {
              oType = 'CE';
            } else if (c.option_type === 'PE' || c.instrument_type === 'PE' || sym.endsWith('PE') || sym.includes('-PE') || sym.match(/PE\d*$/)) {
              oType = 'PE';
            }
            
            return {
              label: c.trading_symbol || c.name || c.instrument_key,
              value: c.instrument_key,
              exchange: c.exchange || 'NFO',
              tradingsymbol: c.trading_symbol || c.name,
              instrument_token: c.instrument_key,
              lot_size: c.lot_size || 1,
              option_type: oType,
              strike: c.strike || c.strike_price,
              expiry: c.expiry || c.expiry_date
            };
          });
          setContracts(formatted);
        })
        .catch(err => {
          console.error("Failed to fetch option contracts:", err);
          setContracts([]);
        })
        .finally(() => setContractsLoading(false));
    } else {
      setContracts([]);
      setSelectedOptionKey(null);
    }
  }, [isOpen, category, selectedIndexKey, selectedCompanyKey, companyTradeMode]);

  if (!isOpen) return null;

  // Filter contracts by CE / PE if needed
  const filteredContracts = contracts.filter(c => {
    if (optionTypeFilter === 'ALL') return true;
    return c.option_type === optionTypeFilter;
  });

  // Determine current chosen tradable asset
  let selectedTradable = null;
  let isSelectionValid = false;
  let validationMessage = '';

  if (category === 'Indices') {
    const selectedOption = contracts.find(c => c.value === selectedOptionKey);
    if (selectedOption) {
      selectedTradable = selectedOption;
      isSelectionValid = true;
      validationMessage = `Option Contract Ready: ${selectedOption.label}`;
    } else if (mode === 'select') {
      const idxObj = FO_INDICES.find(i => i.value === selectedIndexKey) || { label: selectedIndexKey, value: selectedIndexKey };
      selectedTradable = {
        label: idxObj.label,
        value: idxObj.value,
        tradingsymbol: idxObj.label,
        instrument_token: idxObj.value,
        exchange: 'NSE'
      };
      isSelectionValid = true;
      validationMessage = `Ready to select: ${idxObj.label}`;
    } else {
      isSelectionValid = false;
      validationMessage = 'Indices cannot be traded directly. Please select an Option contract.';
    }
  } else if (category === 'Companies') {
    const compObj = FO_EQUITIES.find(e => e.value === selectedCompanyKey) || {
      label: 'Selected Company',
      value: selectedCompanyKey
    };

    if (companyTradeMode === 'EQUITY' || mode === 'select') {
      selectedTradable = {
        label: compObj.label,
        value: compObj.value,
        tradingsymbol: compObj.label,
        instrument_token: compObj.value,
        exchange: 'NSE'
      };
      isSelectionValid = true;
      validationMessage = `Ready to ${mode}: ${compObj.label}`;
    } else {
      const selectedOption = contracts.find(c => c.value === selectedOptionKey);
      if (selectedOption) {
        selectedTradable = selectedOption;
        isSelectionValid = true;
        validationMessage = `Option Contract Ready: ${selectedOption.label}`;
      } else {
        isSelectionValid = false;
        validationMessage = `Please select an Option contract for ${compObj.label}.`;
      }
    }
  }

  const handleApply = () => {
    if (!isSelectionValid || !selectedTradable) {
      toast.error(validationMessage, { id: 'invalid-selection' });
      return;
    }

    onSelect(selectedTradable);
    toast.success(`Instrument set to ${selectedTradable.tradingsymbol || selectedTradable.label}`);
    onClose();
  };

  return (
    <div className="relative w-full bg-background-surface/95 dark:bg-[#0c1017]/95 backdrop-blur-xl border border-border-default/80 dark:border-white/10 rounded-2xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col justify-between gap-3 z-[99999] animate-in fade-in zoom-in-95 duration-200 font-sans">
      {/* MODAL HEADER */}
      <div className="flex justify-between items-center border-b border-border-subtle/70 dark:border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shadow-sm">
            <Sparkles size={13} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">Select Instrument</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-white/5 text-text-tertiary border border-white/10 uppercase tracking-widest">
                NSE · NFO
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-md text-text-tertiary hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* TOP CATEGORY SEGMENTED PILL */}
      <div className="flex bg-black/20 dark:bg-white/[0.03] rounded-xl p-1 border border-border-subtle/70 dark:border-white/[0.06] shadow-inner w-full gap-1">
        <button
          onClick={() => { setCategory('Indices'); setSelectedOptionKey(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            category === 'Indices'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers size={13} />
          Indices
        </button>
        <button
          onClick={() => { setCategory('Companies'); setSelectedOptionKey(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            category === 'Companies'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
          }`}
        >
          <Building2 size={13} />
          Companies
        </button>
      </div>

      {/* QUICK SELECTION CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[8px] font-mono font-bold text-text-tertiary uppercase tracking-wider shrink-0">Quick:</span>
        {category === 'Indices' ? (
          QUICK_INDICES.map(item => {
            const match = FO_INDICES.find(i => i.label?.toLowerCase().includes(item.query.toLowerCase()) || i.name?.toLowerCase().includes(item.query.toLowerCase()));
            const isSelected = match && selectedIndexKey === match.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (match) {
                    setSelectedIndexKey(match.value);
                    setSelectedOptionKey(null);
                  }
                }}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isSelected 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm' 
                    : 'bg-white/[0.03] text-text-secondary hover:text-text-primary hover:bg-white/[0.08] border-border-subtle/60 dark:border-white/[0.06]'
                }`}
              >
                {item.label}
              </button>
            );
          })
        ) : (
          QUICK_EQUITIES.map(item => {
            const match = FO_EQUITIES.find(e => e.label === item.symbol || e.name?.includes(item.symbol));
            const isSelected = match && selectedCompanyKey === match.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (match) {
                    setSelectedCompanyKey(match.value);
                    setSelectedOptionKey(null);
                  }
                }}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isSelected 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm' 
                    : 'bg-white/[0.03] text-text-secondary hover:text-text-primary hover:bg-white/[0.08] border-border-subtle/60 dark:border-white/[0.06]'
                }`}
              >
                {item.label}
              </button>
            );
          })
        )}
      </div>

      {/* CATEGORY BODY */}
      <div className="flex flex-col gap-2.5">
        {category === 'Indices' ? (
          <>
            {/* 1. SELECT INDEX */}
            <div>
              <label className="text-[9px] text-text-secondary font-mono font-bold uppercase tracking-wider block mb-1">
                1. Underlying Index
              </label>
              <UiverseDropdown
                value={selectedIndexKey}
                onChange={(val) => {
                  setSelectedIndexKey(val);
                  setSelectedOptionKey(null);
                }}
                options={FO_INDICES}
                placeholder="Select Index..."
                searchPlaceholder="Search Index (Nifty, BankNifty...)"
              />
            </div>

            {/* 2. SELECT OPTION CONTRACT */}
            {mode === 'trade' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-text-secondary font-mono font-bold uppercase tracking-wider">
                    2. Option Contract <span className="text-rose-400">*</span>
                  </label>
                  {contracts.length > 0 && (
                    <div className="flex bg-black/20 p-0.5 rounded-md border border-border-subtle/60 dark:border-white/[0.06] text-[9px] font-mono font-bold gap-0.5">
                      {['ALL', 'CE', 'PE'].map(type => (
                        <button
                          key={type}
                          onClick={() => setOptionTypeFilter(type)}
                          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            optionTypeFilter === type 
                              ? (type === 'CE' ? 'bg-emerald-500/20 text-emerald-400' : type === 'PE' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400') 
                              : 'text-text-tertiary hover:text-text-primary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <UiverseDropdown
                  value={selectedOptionKey}
                  onChange={(val) => setSelectedOptionKey(val)}
                  options={filteredContracts}
                  placeholder={contractsLoading ? "Fetching option contracts..." : `Select Option Contract (${filteredContracts.length} available)...`}
                  searchPlaceholder="Search Strike, Expiry, CE/PE..."
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* 1. SELECT COMPANY */}
            <div>
              <label className="text-[9px] text-text-secondary font-mono font-bold uppercase tracking-wider block mb-1">
                1. Underlying Company
              </label>
              <UiverseDropdown
                value={selectedCompanyKey}
                onChange={(val) => {
                  setSelectedCompanyKey(val);
                  setSelectedOptionKey(null);
                }}
                options={FO_EQUITIES}
                placeholder="Select Company..."
                searchPlaceholder="Search Company (Reliance, TCS...)"
              />
            </div>

            {/* 2. COMPANY TRADE MODE (STOCK OR OPTION) */}
            <div>
              <label className="text-[9px] text-text-secondary font-mono font-bold uppercase tracking-wider block mb-1">
                2. Instrument Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyTradeMode('EQUITY')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    companyTradeMode === 'EQUITY'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-sm'
                      : 'bg-white/[0.03] text-text-secondary border-border-subtle/60 dark:border-white/[0.06] hover:text-text-primary hover:bg-white/[0.06]'
                  }`}
                >
                  <TrendingUp size={12} className="text-emerald-400" />
                  <span>Stock (Equity)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyTradeMode('OPTIONS')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    companyTradeMode === 'OPTIONS'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-sm'
                      : 'bg-white/[0.03] text-text-secondary border-border-subtle/60 dark:border-white/[0.06] hover:text-text-primary hover:bg-white/[0.06]'
                  }`}
                >
                  <Zap size={12} className="text-amber-400" />
                  <span>Company Options</span>
                </button>
              </div>
            </div>

            {/* 3. OPTION CONTRACTS IF OPTIONS MODE */}
            {companyTradeMode === 'OPTIONS' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-text-secondary font-mono font-bold uppercase tracking-wider">
                    3. Option Contract <span className="text-rose-400">*</span>
                  </label>
                  {contracts.length > 0 && (
                    <div className="flex bg-black/20 p-0.5 rounded-md border border-border-subtle/60 dark:border-white/[0.06] text-[9px] font-mono font-bold gap-0.5">
                      {['ALL', 'CE', 'PE'].map(type => (
                        <button
                          key={type}
                          onClick={() => setOptionTypeFilter(type)}
                          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            optionTypeFilter === type 
                              ? (type === 'CE' ? 'bg-emerald-500/20 text-emerald-400' : type === 'PE' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400') 
                              : 'text-text-tertiary hover:text-text-primary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <UiverseDropdown
                  value={selectedOptionKey}
                  onChange={(val) => setSelectedOptionKey(val)}
                  options={filteredContracts}
                  placeholder={contractsLoading ? "Fetching option contracts..." : `Select Option Contract (${filteredContracts.length} available)...`}
                  searchPlaceholder="Search Strike, Expiry, CE/PE..."
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* VALIDATION STATUS NOTICE */}
      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-2 border transition-all ${
        isSelectionValid 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      }`}>
        {isSelectionValid ? (
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle size={13} className="text-amber-400 shrink-0" />
        )}
        <span className="leading-tight font-medium truncate">{validationMessage}</span>
      </div>

      {/* CONFIRM FOOTER BUTTON */}
      <button
        type="button"
        disabled={!isSelectionValid}
        onClick={handleApply}
        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isSelectionValid
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.99]'
            : 'bg-white/[0.03] text-text-tertiary border border-border-subtle/60 dark:border-white/[0.06] cursor-not-allowed opacity-40'
        }`}
      >
        <CheckCheck size={14} strokeWidth={2.5} />
        <span className="truncate">
          {isSelectionValid
            ? `Confirm & Apply (${selectedTradable?.tradingsymbol || selectedTradable?.label})`
            : 'Select Asset to Continue'}
        </span>
      </button>
    </div>
  );
}
