import React, { useEffect, useState } from "react";

const VixWidget = ({ data }) => {
  if (!data) return null;

  const changeClass =
    data.change >= 0 ? "text-green-400" : "text-red-400";

  const calculateRegime = (vix) => {
    if (vix < 12) return "Low Volatility";
    if (vix < 18) return "Normal";
    if (vix < 25) return "Elevated";
    return "High-Risk Zone";
  };

  const regime = calculateRegime(data.value);

  // -------------------------
  // ANIMATION STATES
  // -------------------------
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();

    const easeOutExpo = (t) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(progress);

      setAnimatedValue((data.value * eased).toFixed(2));
      setAnimatedWidth(
        ((data.value / data.high52Week) * 100 * eased).toFixed(2)
      );

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [data.value, data.high52Week]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        India VIX
      </h2>

      <div className="bg-black/20 border border-white/10 backdrop-blur-xl rounded-xl p-4">
        {/* VALUE + CHANGE */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-white text-3xl font-bold">
            {animatedValue}
          </span>
          <span className={`font-semibold ${changeClass}`}>
            {data.change >= 0 ? "+" : ""}
            {data.change}%
          </span>
        </div>

        {/* BAR */}
        <div className="w-full h-2 bg-white/10 rounded-full mb-2">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-2000"
            style={{ width: `${animatedWidth}%` }}
          ></div>
        </div>

        {/* 30-Day Average */}
        <div className="text-xs text-white/60 mb-4">
          30-Day Avg VIX:{" "}
          <span className="text-white">{data.avg30Day}</span>
        </div>

        {/* EXTRA VIX DATA */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">VIX High (Today)</span>
            <span className="text-white">{data.todayHigh}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">VIX Low (Today)</span>
            <span className="text-white">{data.todayLow}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">52-Week High</span>
            <span className="text-white">{data.high52Week}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">52-Week Low</span>
            <span className="text-white">{data.low52Week}</span>
          </div>

          <div className="flex justify-between mt-2">
            <span className="text-white/70">
              Volatility Regime
            </span>
            <span className="text-yellow-300 font-semibold">
              {regime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VixWidget;
