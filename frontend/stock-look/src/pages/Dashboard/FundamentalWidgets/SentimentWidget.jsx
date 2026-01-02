import React, { useEffect, useState } from "react";

const SentimentRow = ({ label, value, color }) => (
  <div className="flex justify-between py-2 border-b border-white/10 text-sm">
    <span className="text-white/70">{label}</span>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);

const SentimentWidget = ({ data }) => {
  if (!data) return null;

  const scoreColor =
    data.score >= 60
      ? "text-green-400"
      : data.score >= 40
      ? "text-yellow-300"
      : "text-red-400";

  // Animation state
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();

    const easeOutExpo = (t) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(progress);

      setAnimatedScore(Math.round(data.score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [data.score]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Market Sentiment
      </h2>

      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        {/* Score Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">
              Sentiment Score
            </span>
            <span className={`font-bold ${scoreColor}`}>
              {animatedScore} / 100
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-2000"
              style={{
                width: `${animatedScore}%`,
                background:
                  data.score >= 60
                    ? "#4ade80"
                    : data.score >= 40
                    ? "#facc15"
                    : "#f87171",
              }}
            />
          </div>
        </div>

        <SentimentRow
          label="Market Bias"
          value={data.bias}
          color={
            data.bias === "Bullish"
              ? "text-green-400"
              : data.bias === "Bearish"
              ? "text-red-400"
              : "text-yellow-300"
          }
        />

        <SentimentRow
          label="Fear & Greed Index"
          value={data.fearGreed}
          color="text-white"
        />

        <SentimentRow
          label="PCR Sentiment"
          value={data.pcrSentiment}
          color={
            data.pcrSentiment === "Bullish"
              ? "text-green-400"
              : data.pcrSentiment === "Bearish"
              ? "text-red-400"
              : "text-yellow-300"
          }
        />

        <SentimentRow
          label="Volatility Mood"
          value={data.volatilityMood}
          color={
            data.volatilityMood === "Calm"
              ? "text-green-400"
              : data.volatilityMood === "Fear"
              ? "text-red-400"
              : "text-yellow-300"
          }
        />

        <SentimentRow
          label="Global Risk Mode"
          value={data.globalRisk}
          color={
            data.globalRisk === "Risk-On"
              ? "text-green-400"
              : "text-red-400"
          }
        />

        <SentimentRow
          label="Market Breadth"
          value={`${data.breadth}% advancing`}
          color="text-white"
        />
      </div>
    </div>
  );
};

export default SentimentWidget;
