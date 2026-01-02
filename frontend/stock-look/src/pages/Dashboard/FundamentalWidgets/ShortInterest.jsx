import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const ShortInterest = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Short Interest
      </h2>

      <div className="bg-black/20 border backdrop-blur-xl border-white/10 rounded-xl p-4">
        <div className="flex justify-between">
          <div>
            <div className="text-white/70 text-sm">
              Total Short Interest
            </div>
            <div className="text-white font-semibold">
              {data.total}L
            </div>
          </div>

          <div className="text-right">
            <div
              className={`font-semibold ${
                data.change >= 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {data.change >= 0 ? "+" : ""}
              {data.change}%
            </div>
            <div className="text-white/60 text-xs">
              (change)
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <Sparkline
            values={data.history}
            color="#f87171"
          />
          <div className="ml-auto text-white/80 text-sm">
            Days to cover: {data.daysToCover}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortInterest;
