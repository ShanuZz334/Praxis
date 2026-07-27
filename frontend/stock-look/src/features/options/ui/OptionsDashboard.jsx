import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import OptionChainTable from './OptionChainTable';

const OptionsDashboard = () => {
  const [instruments] = useState([
    { label: "NIFTY 50", value: "NSE_INDEX|Nifty 50" },
    { label: "BANK NIFTY", value: "NSE_INDEX|Nifty Bank" },
    { label: "FINNIFTY", value: "NSE_INDEX|Nifty Fin Service" },
    { label: "RELIANCE", value: "NSE_EQ|INE002A01018" }
  ]);

  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0].value);
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  
  const [chainData, setChainData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expiriesLoading, setExpiriesLoading] = useState(false);

  // Fetch expiries when instrument changes
  useEffect(() => {
    const fetchExpiries = async () => {
      setExpiriesLoading(true);
      try {
        const response = await axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(selectedInstrument));
        const data = response.data?.data || [];
        // Extract unique expiry dates from contracts
        const dates = [...new Set(data.map(contract => contract.expiry_date))].sort();
        setExpiries(dates);
        if (dates.length > 0) {
          setSelectedExpiry(dates[0]); // auto-select nearest expiry
        } else {
          setSelectedExpiry('');
          setChainData([]);
        }
      } catch (err) {
        console.error("Failed to fetch option contracts:", err);
        setExpiries([]);
        setSelectedExpiry('');
      } finally {
        setExpiriesLoading(false);
      }
    };
    
    if (selectedInstrument) fetchExpiries();
  }, [selectedInstrument]);

  // Fetch Option Chain when expiry or instrument changes
  useEffect(() => {
    const fetchChain = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN(selectedInstrument, selectedExpiry));
        // Upstox option chain sometimes is unordered, sort by strike price
        const data = response.data?.data || [];
        const sortedData = data.sort((a, b) => a.strike_price - b.strike_price);
        setChainData(sortedData);
      } catch (err) {
        console.error("Failed to fetch option chain:", err);
        setChainData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedInstrument && selectedExpiry) {
      fetchChain();
    }
  }, [selectedInstrument, selectedExpiry]);

  return (
    <div className="p-4 sm:p-6 pb-32 animate-in fade-in duration-500 w-full mx-auto h-full space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface-primary p-4 rounded-lg shadow-sm border border-border-light gap-4">
        <h2 className="text-xl font-bold text-text-primary tracking-wide">Options Module</h2>
        
        <div className="flex gap-4">
          <select 
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border-light rounded px-3 py-2 outline-none focus:border-primary-500 transition-colors"
          >
            {instruments.map(inst => (
              <option key={inst.value} value={inst.value}>{inst.label}</option>
            ))}
          </select>

          <select 
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
            disabled={expiriesLoading || expiries.length === 0}
            className="bg-surface-secondary text-text-primary border border-border-light rounded px-3 py-2 outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          >
            {expiriesLoading ? (
              <option>Loading expiries...</option>
            ) : expiries.length === 0 ? (
              <option>No expiries</option>
            ) : (
              expiries.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Chain Data */}
      <OptionChainTable chainData={chainData} loading={loading} />
    </div>
  );
};

export default OptionsDashboard;
