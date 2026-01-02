import React from "react";

const MarketBreadthDeep = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Market Breadth (Deep)
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-7">
        <div className="text-white/70 text-sm mb-3">
          Advance / Decline Details
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-black/10 border-b border-white/10 rounded">
            <div className="text-white/70 text-xs">Advancers</div>
            <div className="text-white font-semibold">
              {data.advancing}
            </div>
          </div>

          <div className="p-3 bg-black/10 border-b border-white/10 rounded">
            <div className="text-white/70 text-xs">Decliners</div>
            <div className="text-white font-semibold">
              {data.declining}
            </div>
          </div>

          <div className="p-3 bg-black/10 border-b border-white/10 rounded">
            <div className="text-white/70 text-xs">New Highs</div>
            <div className="text-white font-semibold">
              {data.newHighs}
            </div>
          </div>

          <div className="p-3 bg-black/10 border-b border-white/10 rounded">
            <div className="text-white/70 text-xs">New Lows</div>
            <div className="text-white font-semibold">
              {data.newLows}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-white/80">
          Breadth Ratio:{" "}
          <span className="font-semibold">{data.ratio}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketBreadthDeep;
