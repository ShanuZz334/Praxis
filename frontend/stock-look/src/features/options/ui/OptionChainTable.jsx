import React from 'react';

const OptionChainTable = ({ chainData, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-text-secondary">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
          <span>Loading Option Chain...</span>
        </div>
      </div>
    );
  }

  if (!chainData || chainData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-text-secondary">
        No Option Chain Data Available. Select an expiry date.
      </div>
    );
  }

  // Helper to get formatted value or fallback
  const getVal = (val, fallback = '—') => val !== undefined && val !== null ? val : fallback;
  
  // Format numbers nicely
  const formatNum = (num) => num ? num.toLocaleString('en-IN') : '—';
  
  // Format percentage
  const formatPct = (num) => num ? `${num > 0 ? '+' : ''}${num.toFixed(2)}%` : '—';

  return (
    <div className="w-full overflow-x-auto border border-border-light rounded-lg bg-surface-primary shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-surface-secondary text-text-secondary border-b border-border-light">
          <tr>
            {/* CALLS HEADER */}
            <th colSpan="6" className="px-4 py-3 text-center border-r border-border-light font-semibold text-emerald-400/80">
              CALLS
            </th>
            {/* STRIKE HEADER */}
            <th className="px-4 py-3 text-center font-bold text-text-primary w-24">
              STRIKE
            </th>
            {/* PUTS HEADER */}
            <th colSpan="6" className="px-4 py-3 text-center border-l border-border-light font-semibold text-rose-400/80">
              PUTS
            </th>
          </tr>
          <tr className="border-b border-border-light">
            {/* CALLS COLUMNS */}
            <th className="px-2 py-2 text-right">LTP</th>
            <th className="px-2 py-2 text-right">OI</th>
            <th className="px-2 py-2 text-right">CHG%</th>
            <th className="px-2 py-2 text-right">VOL</th>
            <th className="px-2 py-2 text-right">IV</th>
            <th className="px-2 py-2 text-right border-r border-border-light">DELTA</th>
            
            {/* STRIKE */}
            <th className="px-2 py-2 text-center bg-surface-secondary"></th>
            
            {/* PUTS COLUMNS */}
            <th className="px-2 py-2 text-left border-l border-border-light">DELTA</th>
            <th className="px-2 py-2 text-left">IV</th>
            <th className="px-2 py-2 text-left">VOL</th>
            <th className="px-2 py-2 text-left">CHG%</th>
            <th className="px-2 py-2 text-left">OI</th>
            <th className="px-2 py-2 text-left">LTP</th>
          </tr>
        </thead>
        <tbody>
          {chainData.map((row, idx) => {
            const ce = row.call_options?.market_data || {};
            const pe = row.put_options?.market_data || {};
            const strike = row.strike_price;
            const spot = row.underlying_spot_price;
            
            // Basic ITM/OTM highlighting
            const ceIsItm = strike < spot;
            const peIsItm = strike > spot;

            const ceBg = ceIsItm ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-transparent hover:bg-surface-secondary';
            const peBg = peIsItm ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-transparent hover:bg-surface-secondary';

            return (
              <tr key={idx} className="border-b border-border-light/50 last:border-0 transition-colors">
                {/* CALLS */}
                <td className={`px-2 py-2.5 text-right font-semibold ${ceBg}`}>
                  {getVal(ce.ltp)}
                </td>
                <td className={`px-2 py-2.5 text-right ${ceBg}`}>
                  {formatNum(ce.oi)}
                </td>
                <td className={`px-2 py-2.5 text-right ${ceBg} ${ce.oi_change > 0 ? 'text-emerald-400' : ce.oi_change < 0 ? 'text-rose-400' : ''}`}>
                  {formatPct(ce.oi_change)}
                </td>
                <td className={`px-2 py-2.5 text-right ${ceBg}`}>
                  {formatNum(ce.volume)}
                </td>
                <td className={`px-2 py-2.5 text-right text-orange-400 ${ceBg}`}>
                  — {/* IV placeholder */}
                </td>
                <td className={`px-2 py-2.5 text-right border-r border-border-light text-text-tertiary ${ceBg}`}>
                  — {/* Delta placeholder */}
                </td>

                {/* STRIKE */}
                <td className="px-2 py-2.5 text-center font-bold text-text-primary bg-surface-secondary/50">
                  {strike}
                </td>

                {/* PUTS */}
                <td className={`px-2 py-2.5 text-left border-l border-border-light text-text-tertiary ${peBg}`}>
                  — {/* Delta placeholder */}
                </td>
                <td className={`px-2 py-2.5 text-left text-orange-400 ${peBg}`}>
                  — {/* IV placeholder */}
                </td>
                <td className={`px-2 py-2.5 text-left ${peBg}`}>
                  {formatNum(pe.volume)}
                </td>
                <td className={`px-2 py-2.5 text-left ${peBg} ${pe.oi_change > 0 ? 'text-emerald-400' : pe.oi_change < 0 ? 'text-rose-400' : ''}`}>
                  {formatPct(pe.oi_change)}
                </td>
                <td className={`px-2 py-2.5 text-left ${peBg}`}>
                  {formatNum(pe.oi)}
                </td>
                <td className={`px-2 py-2.5 text-left font-semibold ${peBg}`}>
                  {getVal(pe.ltp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OptionChainTable;
