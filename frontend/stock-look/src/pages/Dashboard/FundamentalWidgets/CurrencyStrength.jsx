import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const CurrencyStrength = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Currency Strength (versus INR)
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        {data.items.map((it) => (
          <div
            key={it.code}
            className="flex items-center justify-between py-2 border-b border-white/10"
          >
            <div>
              <div className="text-white/80">{it.code}</div>
              <div className="text-xs text-white/60">{it.name}</div>
            </div>

            <div className="flex items-center gap-3">
              <Sparkline
                values={it.history}
                color={it.color || "#60a5fa"}
              />
              <div
                className={`font-semibold ${
                  it.change >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {it.change >= 0 ? "+" : ""}
                {it.change}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyStrength;
