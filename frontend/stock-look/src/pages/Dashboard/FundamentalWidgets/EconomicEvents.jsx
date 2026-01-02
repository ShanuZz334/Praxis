import React from "react";

const EconomicEvents = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Economic Events
      </h2>

      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
        <div className="text-white/70 text-sm mb-3">
          Next important macro events
        </div>

        <div className="space-y-2 text-sm">
          {data.events.slice(0, 6).map((ev) => (
            <div
              key={`${ev.name}-${ev.date}`}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <div>
                <div className="text-white/90">{ev.name}</div>
                <div className="text-white/60 text-xs">
                  {ev.country}
                </div>
              </div>

              <div className="text-right">
                <div className="text-white font-semibold">
                  {ev.date}
                </div>
                <div
                  className={`text-xs ${
                    ev.impact === "High"
                      ? "text-red-400"
                      : ev.impact === "Medium"
                      ? "text-yellow-300"
                      : "text-white/60"
                  }`}
                >
                  {ev.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EconomicEvents;
