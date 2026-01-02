import React from "react";

const EarningsCalendar = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Earnings Calendar
      </h2>

      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
        <div className="text-white/70 text-sm mb-2">
          Upcoming (next 7 days)
        </div>

        <div className="space-y-2">
          {data.upcoming.slice(0, 5).map((e) => (
            <div
              key={`${e.symbol}-${e.date}`}
              className="flex justify-between items-center py-2 border-b border-white/10 text-sm"
            >
              <div>
                <div className="text-white/90 font-medium">
                  {e.symbol}
                </div>
                <div className="text-white/60 text-xs">
                  {e.company}
                </div>
              </div>

              <div className="text-right">
                <div className="text-white font-semibold">
                  {e.date}
                </div>
                <div
                  className={`text-sm ${
                    e.estimateChange >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {e.estimateChange >= 0 ? "+" : ""}
                  {e.estimateChange}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsCalendar;
