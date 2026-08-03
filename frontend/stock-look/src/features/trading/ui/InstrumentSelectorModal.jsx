import React, { useState, useEffect } from 'react';
import { X, CheckCheck, ChevronDown, Layers, Building2, Sparkles, AlertCircle, CheckCircle2, Loader2, Filter } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { toast } from 'sonner';

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
    <div className="absolute inset-0 bg-background-tooltip border border-border-default rounded-xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full h-full flex flex-col justify-between gap-3 z-[99999] animate-in fade-in zoom-in-95 duration-200">
      {/* MODAL HEADER */}
      <div className="flex justify-between items-center border-b border-border-subtle/60 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Select Instrument</span>
        </div>
        <div className="flex items-center gap-1.5">

          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-text-tertiary hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* TOP CATEGORY SEGMENT */}
      <div className="flex bg-background-surface rounded-lg p-1 border border-border-default shadow-inner w-full">
        <button
          onClick={() => { setCategory('Indices'); setSelectedOptionKey(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
            category === 'Indices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers size={13} />
          Indices
        </button>
        <button
          onClick={() => { setCategory('Companies'); setSelectedOptionKey(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1 rounded-md font-bold transition-all cursor-pointer ${
            category === 'Companies'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Building2 size={13} />
          Companies
        </button>
      </div>

      {/* CATEGORY BODY */}
      <div className="flex flex-col gap-2.5">
        {category === 'Indices' ? (
          <>
            {/* 1. SELECT INDEX */}
            <div>
              <label className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5">1. Choose Index</label>
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
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                  2. Select Option Contract <span className="text-rose-400">*</span>
                </label>
                {contracts.length > 0 && (
                  <div className="flex bg-background-surface p-0.5 rounded border border-border-subtle text-[9px] font-bold">
                    {['ALL', 'CE', 'PE'].map(type => (
                      <button
                        key={type}
                        onClick={() => setOptionTypeFilter(type)}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          optionTypeFilter === type ? 'bg-blue-500/20 text-blue-400' : 'text-text-tertiary hover:text-text-primary'
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
          </>
        ) : (
          <>
            {/* 1. SELECT COMPANY */}
            <div>
              <label className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5">1. Choose Company</label>
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
              <label className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block mb-0.5">2. Trade Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyTradeMode('EQUITY')}
                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                    companyTradeMode === 'EQUITY'
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                      : 'bg-background-surface text-text-secondary border-border-subtle hover:text-text-primary'
                  }`}
                >
                  Stock (Equity)
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyTradeMode('OPTIONS')}
                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                    companyTradeMode === 'OPTIONS'
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                      : 'bg-background-surface text-text-secondary border-border-subtle hover:text-text-primary'
                  }`}
                >
                  Company Options
                </button>
              </div>
            </div>

            {/* 3. OPTION CONTRACTS IF OPTIONS MODE */}
            {companyTradeMode === 'OPTIONS' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                    3. Select Option Contract <span className="text-rose-400">*</span>
                  </label>
                  {contracts.length > 0 && (
                    <div className="flex bg-background-surface p-0.5 rounded border border-border-subtle text-[9px] font-bold">
                      {['ALL', 'CE', 'PE'].map(type => (
                        <button
                          key={type}
                          onClick={() => setOptionTypeFilter(type)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            optionTypeFilter === type ? 'bg-blue-500/20 text-blue-400' : 'text-text-tertiary hover:text-text-primary'
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
      {mode === 'trade' && (
        <div className={`p-2 rounded-lg text-[11px] flex items-start gap-2 border transition-all ${
          isSelectionValid 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          {isSelectionValid ? (
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-tight font-medium">{validationMessage}</span>
        </div>
      )}

      {/* CONFIRM FOOTER BUTTON */}
      <button
        type="button"
        disabled={!isSelectionValid}
        onClick={handleApply}
        className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isSelectionValid
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.99]'
            : 'bg-background-surface text-text-tertiary border border-border-subtle cursor-not-allowed opacity-50'
        }`}
      >
        <CheckCheck size={15} />
        <span>
          {isSelectionValid
            ? `Confirm & Apply (${selectedTradable?.tradingsymbol || selectedTradable?.label})`
            : 'Select Tradable Option to Continue'}
        </span>
      </button>
    </div>
  );
}
