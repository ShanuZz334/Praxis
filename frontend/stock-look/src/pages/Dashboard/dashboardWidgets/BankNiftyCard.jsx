import React from "react";
import CandleChart from "../../../components/common/CandleChart";

const BankNiftyCard = ({ data }) => {
  if (!data || !data.candles?.length) return null;

  const isPositive = data.change >= 0;

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="grid grid-cols-3 items-center w-full">
        <h2 className="text-lg font-semibold text-white">BANK NIFTY</h2>

        <div
          className={`text-3xl font-bold text-center ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          ₹ {data.latest}
        </div>

        <div
          className={`text-right font-semibold ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {data.change}%
        </div>
      </div>

      {/* Previous Values */}
      <div className="space-y-1 text-white/80 text-sm">
        <div className="flex justify-between">
          <span>Prev Close:</span> <span>₹ {data.prevClose}</span>
        </div>
        <div className="flex justify-between">
          <span>Prev Open:</span> <span>₹ {data.prevOpen}</span>
        </div>
        <div className="flex justify-between">
          <span>Prev High:</span> <span>₹ {data.prevHigh}</span>
        </div>
        <div className="flex justify-between">
          <span>Prev Low:</span> <span>₹ {data.prevLow}</span>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="mt-2">
        <CandleChart candles={data.candles} height={60} />
      </div>
    </div>
  );
};

export default BankNiftyCard;
