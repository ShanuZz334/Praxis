import React from "react";
import Sparkline from "../../../components/common/Sparkline";

const GlobalSentimentComposite = ({ data }) => {
  if (!data) return null;

  const color =
    data.score >= 60
      ? "text-green-400"
      : data.score >= 40
      ? "text-yellow-300"
      : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Global Sentiment Composite
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white/70 text-sm">
              Composite Score
            </div>
            <div className={`text-white text-2xl font-bold ${color}`}>
              {data.score}/100
            </div>
          </div>

          <div className="text-right">
            <div className="text-white/60 text-xs">
              Region Trend
            </div>
            <div className="text-white font-semibold">
              {data.overall}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Sparkline values={data.history} color="#60a5fa" />
          <div className="text-white/70 text-sm ml-auto">
            Volatility Regime:{" "}
            <span className="font-semibold text-white">
              {data.volRegime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSentimentComposite;
