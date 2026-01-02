import React from "react";

const FiiDiiWidget = ({ data }) => {
  if (!data) return null;

  const formatNum = (num) =>
    num.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const netClass =
    data.fiiNet + data.diiNet >= 0
      ? "text-green-400"
      : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        FII / DII Activity
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-6">
        {/* FII Net */}
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-white/70">FII Net (Today)</span>
          <span
            className={`font-semibold ${
              data.fiiNet >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.fiiNet >= 0 ? "+" : ""}
            ₹{formatNum(data.fiiNet)} Cr
          </span>
        </div>

        {/* DII Net */}
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-white/70">DII Net (Today)</span>
          <span
            className={`font-semibold ${
              data.diiNet >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.diiNet >= 0 ? "+" : ""}
            ₹{formatNum(data.diiNet)} Cr
          </span>
        </div>

        {/* Market Net Inflow */}
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-white/70">
            Market Net Inflow
          </span>
          <span className={netClass}>
            {data.fiiNet + data.diiNet >= 0 ? "+" : ""}
            ₹{formatNum(data.fiiNet + data.diiNet)} Cr
          </span>
        </div>

        {/* 1-Month High FII */}
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-white/70">
            1-Month High FII
          </span>
          <span
            className={`font-semibold ${
              data.highFii1M >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.highFii1M >= 0 ? "+" : ""}
            ₹{formatNum(data.highFii1M)} Cr
          </span>
        </div>

        {/* 1-Month High DII */}
        <div className="flex justify-between py-2">
          <span className="text-white/70">
            1-Month High DII
          </span>
          <span
            className={`font-semibold ${
              data.highDii1M >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {data.highDii1M >= 0 ? "+" : ""}
            ₹{formatNum(data.highDii1M)} Cr
          </span>
        </div>
      </div>
    </div>
  );
};

export default FiiDiiWidget;
