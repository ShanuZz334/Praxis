import React, { useEffect, useState } from "react";

const FundamentalGauge = ({ data }) => {
  const score = data?.score || 0;
  const max = data?.max || 100;

  // Final angle
  const finalAngle = (score / max) * 180 - 90;

  // Animated angle state
  const [angle, setAngle] = useState(-90);
  const [displayScore, setDisplayScore] = useState(0);

  // Easing for smooth motion
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = easeOutCubic(progress);

      setAngle(-90 + (finalAngle + 90) * eased);
      setDisplayScore(Math.round(score * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score, finalAngle]);

  const marks = [
    { label: "0°" },
    { label: "45°" },
    { label: "90°" },
    { label: "135°" },
    { label: "180°" },
  ];

  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold text-white mb-3">
        Fundamental Score
      </h2>

      {/* Gauge Container */}
      <div className="relative w-56 h-32 mx-auto">
        {/* Background red arc */}
        <div className="absolute top-0 w-full h-full overflow-hidden flex justify-center">
          <div className="w-56 h-56 rounded-full bg-red-500/30"></div>
        </div>

        {/* Foreground darker arc */}
        <div className="absolute top-0 w-full h-full overflow-hidden flex justify-center">
          <div className="w-56 h-56 rounded-full bg-[#1d222a]"></div>
        </div>

        {/* Needle */}
        <div
          className="absolute bottom-5 left-1/2 w-1.5 h-24 bg-green-400 origin-bottom rounded-full transition-transform"
          style={{
            transform: `translateX(-40%) rotate(${angle}deg)`,
          }}
        ></div>

        {/* Degree Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[12px] text-white/60">
          {marks.map((m, i) => (
            <span key={i} className="w-10 text-center">
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Animated Score */}
      <p className="mt-3 text-3xl font-bold text-green-400">
        {displayScore}
      </p>
    </div>
  );
};

export default FundamentalGauge;
