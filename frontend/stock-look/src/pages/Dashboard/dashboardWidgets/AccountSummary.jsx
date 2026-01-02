import React from "react";

const StatBox = ({ label, value, isMoney = false, isPnL = false }) => {
  const pnlClass =
    isPnL && value !== 0
      ? value > 0
        ? "text-green-400"
        : "text-red-400"
      : "text-white";

  return (
    <div className="flex justify-between py-2 border-b border-white/10">
      <span className="text-white/70 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${pnlClass}`}>
        {isMoney ? "₹" : ""}
        {value}
      </span>
    </div>
  );
};

const AccountSummary = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Account Overview
      </h2>

      <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-2">
        <StatBox label="Opening Balance" value={data.opening_balance} isMoney />
        <StatBox label="Closing Balance" value={data.closing_balance} isMoney />
        <StatBox label="Open Trades" value={data.openTrades} />
        <StatBox label="Closed Trades" value={data.closedTrades} />
        <StatBox
          label="Today's PnL"
          value={data.profitToday}
          isMoney
          isPnL
        />
        <StatBox
          label="Monthly PnL"
          value={data.monthlyPnL}
          isMoney
          isPnL
        />
      </div>
    </div>
  );
};

export default AccountSummary;
