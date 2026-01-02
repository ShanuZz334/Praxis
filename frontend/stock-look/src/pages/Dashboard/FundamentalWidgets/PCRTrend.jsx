import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const PCRTrend = ({ data }) => {
  if (!data) return null;

  const pcrColor = data.current >= 1 ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        PCR Trend
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        {/* MAIN ROW */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white/70 text-sm">
              Current PCR
            </div>
            <div className={`text-white font-semibold ${pcrColor}`}>
              {data.current}
            </div>
          </div>

          <Sparkline values={data.history} color="#a78bfa" />
        </div>

        {/* EXISTING SIGNAL */}
        <div className="mt-3 text-sm text-white/70">
          Signal:{" "}
          <span className="font-semibold text-white">
            {data.signal}
          </span>
        </div>

        {/* EXTRA ROWS */}
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">5-Day Avg PCR</span>
            <span className="text-white font-semibold">
              {data.avg5}
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">Extreme Level</span>
            <span className="text-white font-semibold">
              {data.extreme}
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">Market Zone</span>
            <span className="font-semibold text-yellow-300">
              {data.zone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCRTrend;
