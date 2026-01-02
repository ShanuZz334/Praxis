import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const SgxWidget = ({ data }) => {
  if (!data) return null;

  const isPositive = data.change >= 0;

  return (
    <div className="space-y-4 w-full">
      {/* Title */}
      <h2 className="text-lg font-semibold text-white">
        SGX Nifty
      </h2>

      {/* Main Container */}
      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white text-sm font-semibold">
              SGX Nifty
            </div>
            <div className="text-white/60 text-xs">
              ₹ {data.value}
            </div>
          </div>

          <div
            className={`${
              isPositive ? "text-green-400" : "text-red-400"
            } text-right`}
          >
            <div className="text-xs font-medium">
              {isPositive ? "+" : ""}
              {data.change}
            </div>
            <div className="text-xs font-medium">
              {isPositive ? "+" : ""}
              {data.percent}%
            </div>
          </div>
        </div>

        {/* Details Rows */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Day High</span>
            <span className="text-white">{data.high}</span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Day Low</span>
            <span className="text-white">{data.low}</span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/70">Prev Close</span>
            <span className="text-white">
              {data.prevClose}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Futures Trend
            </span>
            <span
              className={`font-semibold ${
                data.trend === "Bullish"
                  ? "text-green-400"
                  : data.trend === "Bearish"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {data.trend}
            </span>
          </div>

          {/* Sparkline */}
          <div className="pt-4 w-full">
            <Sparkline
              values={
                data.history ?? [
                  26000,
                  26100,
                  25950,
                  26080,
                  26200,
                  26280,
                ]
              }
              color="#22c55e"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SgxWidget;
