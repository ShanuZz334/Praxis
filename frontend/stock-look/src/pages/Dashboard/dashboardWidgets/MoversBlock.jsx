import React from "react";

const Item = ({ stock }) => {
  const isPositive = stock.percent >= 0;

  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
      <span className="text-white/90">{stock.symbol}</span>

      <div className="text-right">
        <div className="text-white/80">₹ {stock.price}</div>
        <div
          className={`text-xs font-medium ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {stock.percent}%
        </div>
      </div>
    </div>
  );
};

const MoversBlock = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Market Movers</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* TOP GAINERS */}
        <div className="bg-black/20 border border-white/10 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            Top Gainers
          </h3>

          <div className="h-[200px] overflow-y-auto invisibleScroll pr-1">
            {data.topGainers.map((stock) => (
              <Item key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>

        {/* TOP LOSERS */}
        <div className="bg-black/20 border border-white/10 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            Top Losers
          </h3>

          <div className="h-[200px] overflow-y-auto invisibleScroll pr-1">
            {data.topLosers.map((stock) => (
              <Item key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoversBlock;
