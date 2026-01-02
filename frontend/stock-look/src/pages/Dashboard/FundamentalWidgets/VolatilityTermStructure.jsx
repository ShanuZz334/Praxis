import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const VolatilityTermStructure = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Volatility Term Structure
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-7">
        <div className="text-white/70 text-sm mb-3">
          IV curve (short → long)
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs w-24 text-white/70">
            1M:
            <div className="font-semibold text-white">
              {data.iv1m}%
            </div>
          </div>

          <div className="text-xs w-24 text-white/70">
            3M:
            <div className="font-semibold text-white">
              {data.iv3m}%
            </div>
          </div>

          <div className="text-xs w-24 text-white/70">
            6M:
            <div className="font-semibold text-white">
              {data.iv6m}%
            </div>
          </div>

          <div className="ml-auto">
            <Sparkline
              values={data.history}
              color="#facc15"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityTermStructure;
