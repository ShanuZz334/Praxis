import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const InstitutionalHoldings = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Institutional Holdings
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-8.5">
        {/* Top 3 Institutions */}
        <div className="text-sm text-white/70 mb-2">
          Top 3 Institutional Holders
        </div>

        <ul className="space-y-1 text-sm mb-4">
          {data.top3.map((m) => (
            <li
              key={m.name}
              className="flex justify-between"
            >
              <span className="text-white/80">{m.name}</span>
              <span className="text-white font-semibold">
                {m.holding}%
              </span>
            </li>
          ))}
        </ul>

        {/* Net Change */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70 text-sm">
            Net change (3M)
          </span>
          <span
            className={`font-semibold ${
              data.netChange >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.netChange >= 0 ? "+" : ""}
            {data.netChange}%
          </span>
        </div>

        {/* Sparkline */}
        <Sparkline
          values={data.holdingHistory}
          color="#60a5fa"
        />

        {/* FII / DII inflows */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              FII Net Inflow (1M)
            </span>
            <span className="text-green-400 font-semibold">
              {data.fii1M} Cr
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              DII Net Inflow (1M)
            </span>
            <span className="text-green-400 font-semibold">
              {data.dii1M} Cr
            </span>
          </div>

          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/70">
              Promoter Holding
            </span>
            <span className="text-white font-semibold">
              {data.promoterHold}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">
              Pledged Shares
            </span>
            <span className="text-red-400 font-semibold">
              {data.pledge}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalHoldings;
