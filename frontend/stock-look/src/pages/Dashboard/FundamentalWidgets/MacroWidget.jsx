import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const MacroWidget = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Macro Indicators
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center py-3 border-b border-white/10"
          >
            <span className="text-white/80">{item.label}</span>

            <div className="flex justify-center w-24">
              <Sparkline
                values={item.history}
                color={item.color}
              />
            </div>

            <span className="text-white font-semibold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroWidget;
