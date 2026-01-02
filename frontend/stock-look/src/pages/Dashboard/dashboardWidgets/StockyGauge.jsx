import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

const StockyGauge = ({ data }) => {
  if (!data) return null;

  const {
    fundamental,
    technical,
    foreignMarket,
    options,
    events,
  } = data;

  // ---- Combined Stocky Score ----
  const stockyScore = Math.round(
    fundamental * 0.25 +
      technical * 0.25 +
      foreignMarket * 0.20 +
      options * 0.15 +
      events * 0.15
  );

  const chartData = {
    datasets: [
      {
        data: [stockyScore, 100 - stockyScore],
        backgroundColor: [
          stockyScore >= 50 ? "#4ade80" : "#f87171",
          "rgba(255,255,255,0.1)",
        ],
        borderWidth: 0,
        cutout: "70%",
        circumference: 180,
        rotation: -90,
      },
    ],
  };

  const optionsChart = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-lg font-semibold text-white mb-3 text-center">
        Stocky Score
      </h2>

      {/* MAIN GAUGE */}
      <div className="relative w-52 h-28">
        <Doughnut data={chartData} options={optionsChart} />

        <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
          <span className="text-3xl font-bold text-white">
            {stockyScore}
          </span>
        </div>
      </div>

      {/* BREAKDOWN */}
      <div className="mt-4 w-full text-sm space-y-1 text-white/80">
        <div className="flex justify-between px-4">
          <span>Fundamental</span>
          <span className="text-white font-semibold">{fundamental}</span>
        </div>
        <div className="flex justify-between px-4">
          <span>Technical</span>
          <span className="text-white font-semibold">{technical}</span>
        </div>
        <div className="flex justify-between px-4">
          <span>Foreign Market</span>
          <span className="text-white font-semibold">{foreignMarket}</span>
        </div>
        <div className="flex justify-between px-4">
          <span>Options</span>
          <span className="text-white font-semibold">{options}</span>
        </div>
        <div className="flex justify-between px-4">
          <span>Events</span>
          <span className="text-white font-semibold">{events}</span>
        </div>
      </div>
    </div>
  );
};

export default StockyGauge;
