import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const LiquidityMonitor = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Liquidity Monitor
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-5.5">
        {/* Main Turnover */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white/70 text-sm">
              Market Turnover (1W)
            </div>
            <div className="text-white font-bold text-lg">
              {data.turnover} Cr
            </div>
          </div>

          <span
            className={`font-semibold ${
              data.change >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.change >= 0 ? "+" : ""}
            {data.change}%
            <span className="text-white/70 text-xs">
              {" "}vs prev week
            </span>
          </span>
        </div>

        {/* Sparkline */}
        <div className="mt-2">
          <Sparkline
            values={data.turnoverHistory}
            color="#4ade80"
          />
        </div>

        {/* Data Rows */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Cash Market Volume (1D)
            </span>
            <span className="text-white font-semibold">
              {data.cashVolume} Cr
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              F&O Contracts (1D)
            </span>
            <span className="text-white font-semibold">
              {data.foContracts} L
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Delivery %
            </span>
            <span className="text-yellow-300 font-semibold">
              {data.delivery}%
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Liquidity Score
            </span>
            <span className="text-green-400 font-semibold">
              {data.liqScore}/100
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Bid–Ask Spread
            </span>
            <span className="text-white font-semibold">
              {data.spread}%
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Volume Shock
            </span>
            <span
              className={`font-semibold ${
                data.volumeShock > 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {data.volumeShock > 0 ? "+" : ""}
              {data.volumeShock}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">
              Liquidity Rating
            </span>
            <span
              className={`font-semibold ${
                data.liqRating === "High"
                  ? "text-green-400"
                  : data.liqRating === "Medium"
                  ? "text-yellow-300"
                  : "text-red-400"
              }`}
            >
              {data.liqRating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityMonitor;
