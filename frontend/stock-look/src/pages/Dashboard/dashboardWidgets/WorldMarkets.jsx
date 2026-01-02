import React from "react";

/* ------------------------------------------
   FLAG MAP
------------------------------------------- */
const FLAG_MAP = {
  "HANG SENG": "https://flagcdn.com/w40/hk.png",
  NASDAQ: "https://flagcdn.com/w40/us.png",
  DOW: "https://flagcdn.com/w40/us.png",
  "S&P 500": "https://flagcdn.com/w40/us.png",
  SHANGHAI: "https://flagcdn.com/w40/cn.png",
  KOSPI: "https://flagcdn.com/w40/kr.png",
  TAIEX: "https://flagcdn.com/w40/tw.png",
  FTSE: "https://flagcdn.com/w40/gb.png",
  DAX: "https://flagcdn.com/w40/de.png",
  CAC: "https://flagcdn.com/w40/fr.png",
};

/* ------------------------------------------
   MARKET OPEN/CLOSED LOGIC
------------------------------------------- */
const getMarketStatus = (name) => {
  const utcHour = new Date().getUTCHours();

  let openHour = 0;
  let closeHour = 0;

  switch (name) {
    case "NASDAQ":
    case "DOW":
    case "S&P 500":
      openHour = 14;
      closeHour = 21;
      break;

    case "HANG SENG":
      openHour = 1;
      closeHour = 8;
      break;

    case "SHANGHAI":
      openHour = 1;
      closeHour = 7;
      break;

    case "KOSPI":
      openHour = 0;
      closeHour = 6;
      break;

    case "TAIEX":
      openHour = 0;
      closeHour = 5;
      break;

    case "DAX":
    case "FTSE":
    case "CAC":
      openHour = 7;
      closeHour = 15;
      break;

    default:
      return { open: false, label: "Closed" };
  }

  const isOpen = utcHour >= openHour && utcHour < closeHour;

  return {
    open: isOpen,
    label: isOpen ? "Open" : "Closed",
  };
};

/* -------------------------------------------------------
   SINGLE ROW ITEM
-------------------------------------------------------- */
const WorldItem = ({ item }) => {
  const isPositive = item.percent >= 0;
  const status = getMarketStatus(item.name.toUpperCase());

  const flag =
    FLAG_MAP[item.name.toUpperCase()] ||
    "https://flagcdn.com/w40/un.png";

  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <img
          src={flag}
          alt={`${item.name} flag`}
          className="w-6 h-4 rounded-sm border border-white/20 object-cover"
        />

        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {item.name}
            </span>
            <span
              className={`text-xs font-semibold ${
                status.open
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {status.label}
            </span>
          </div>

          <div className="text-white/25 text-xs">
            ₹ {item.value}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className={`text-right ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        <div className="text-xs font-medium">
          {isPositive ? "+" : ""}
          {item.change}
        </div>
        <div className="text-xs font-medium">
          {isPositive ? "+" : ""}
          {item.percent}%
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------- */
const WorldMarkets = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        World Markets
      </h2>

      <div className="bg-black/20 border border-white/10 rounded-xl p-4 h-73 overflow-y-auto invisibleScroll">
        {data.map((item) => (
          <WorldItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
};

export default WorldMarkets;
