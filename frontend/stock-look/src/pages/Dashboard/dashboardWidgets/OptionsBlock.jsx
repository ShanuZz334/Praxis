import React from "react";

const Row = ({ item }) => {
  const isPositive = item.change >= 0;

  return (
    <div className="py-2 border-b border-white/10">
      <div className="flex justify-between text-sm text-white font-semibold">
        {item.symbol}
      </div>

      <div className="flex justify-between text-xs text-white/70 mt-1">
        <span>Exp: {item.exp}</span>
        <span>LTP: ₹ {item.ltp}</span>
      </div>

      <div
        className={`text-xs font-medium mt-1 ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {isPositive ? "+" : ""}
        {item.change}%
      </div>
    </div>
  );
};

const OptionsBlock = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Options (CE / PE)
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* CE */}
        <div className="bg-black/20 rounded-xl p-3 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            CE - Top Movers
          </h3>

          <div className="h-[200px] overflow-y-auto invisibleScroll pr-1">
            {data.ce.map((item) => (
              <Row
                key={`${item.symbol}-${item.exp}`}
                item={item}
              />
            ))}
          </div>
        </div>

        {/* PE */}
        <div className="bg-black/20 rounded-xl p-3 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            PE - Top Movers
          </h3>

          <div className="h-[200px] overflow-y-auto invisibleScroll pr-1">
            {data.pe.map((item) => (
              <Row
                key={`${item.symbol}-${item.exp}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsBlock;
