import React from "react";

const Stat = ({ label, value, color }) => (
  <div className="flex justify-between py-2 border-b border-white/10 text-sm">
    <span className="text-white/70">{label}</span>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);

const OptionChainWidget = ({ data }) => {
  if (!data) return null;

  const pcrColor = data.pcr >= 1 ? "text-green-400" : "text-red-400";
  const trendColor =
    data.trend === "Bullish"
      ? "text-green-400"
      : data.trend === "Bearish"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Option Chain Summary
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        <Stat label="PCR" value={data.pcr} color={pcrColor} />
        <Stat label="Max Pain" value={data.maxPain} color="text-white" />

        <Stat
          label="Highest OI (CE)"
          value={`${data.highestOICE.strike} — ${data.highestOICE.oi}L`}
          color="text-blue-300"
        />

        <Stat
          label="Highest OI (PE)"
          value={`${data.highestOIPE.strike} — ${data.highestOIPE.oi}L`}
          color="text-purple-300"
        />

        <Stat label="IV (CE)" value={`${data.ivCE}%`} color="text-white" />
        <Stat label="IV (PE)" value={`${data.ivPE}%`} color="text-white" />

        <Stat label="Trend" value={data.trend} color={trendColor} />
      </div>
    </div>
  );
};

export default OptionChainWidget;
