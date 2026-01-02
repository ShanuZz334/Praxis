import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const GsecYieldCurve = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        G-Sec Yield Curve
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        <div className="text-white/70 text-sm mb-3">
          Tenor yields
        </div>

        <div className="space-y-2 text-sm">
          {data.tenors.map((t) => (
            <div
              key={t.tenor}
              className="flex justify-between items-center py-2 border-b border-white/10"
            >
              <div className="text-white/80">{t.tenor}</div>

              <div className="flex items-center gap-3">
                <Sparkline values={t.history} color="#facc15" />
                <div className="text-white font-semibold">
                  {t.yield}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GsecYieldCurve;
