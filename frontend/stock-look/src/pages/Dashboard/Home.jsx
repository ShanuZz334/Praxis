import React from "react";
import { overallGaugeData } from "../../utils/fakeFundData";

// Dashboard widgets
import NiftyCard from "./dashboardWidgets/NiftyCard";
import BankNiftyCard from "./dashboardWidgets/BankNiftyCard";
import StockyGauge from "./dashboardWidgets/StockyGauge";
import OptionsBlock from "./dashboardWidgets/OptionsBlock";
import MoversBlock from "./dashboardWidgets/MoversBlock";
import WorldMarkets from "./dashboardWidgets/WorldMarkets";
import AccountSummary from "./dashboardWidgets/AccountSummary";

// Fake temporary data
import {
  niftySeries,
  bankNiftySeries,
  optionsSummary,
  movers,
  worldMarkets,
  accountOverview,
} from "../../utils/fakeFundData";


const Home = () => {
  // TEMPORARY STATIC VALUES — will be replaced by backend later
  const vixValue = 14.52;
  const fiiValue = 1250;

  const fiiColor =
    fiiValue > 0
      ? "text-green-400"
      : fiiValue < 0
      ? "text-red-400"
      : "text-gray-300";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Dashboard Overview
        </h1>

        <div className="flex gap-3 items-center text-sm text-neutral-300">
          <div className="px-3 py-2 rounded-lg bg-white/5 backdrop-blur border border-white/10">
            VIX: {vixValue}
          </div>

          <div
            className={`px-3 py-2 rounded-lg bg-white/5 backdrop-blur border border-white/10 font-semibold ${fiiColor}`}
          >
            FII: {fiiValue > 0 ? `+₹${fiiValue} Cr` : `₹${fiiValue} Cr`}
          </div>

          <div className="px-3 py-2 rounded-lg bg-white/5 backdrop-blur border border-white/10">
            Account: ₹125k
          </div>
        </div>
      </div>

      {/* Row 1 — Nifty / Gauge / BankNifty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <NiftyCard data={niftySeries} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <StockyGauge data={overallGaugeData} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <BankNiftyCard data={bankNiftySeries} />
        </div>
      </div>

      {/* Row 2 — Options + Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <OptionsBlock data={optionsSummary} />
        </div>

        <div className="lg:col-span-2 p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <MoversBlock data={movers} />
        </div>
      </div>

      {/* Row 3 — World Markets + Account */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <WorldMarkets data={worldMarkets} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 backdrop-blur border border-white/10">
          <AccountSummary data={accountOverview} />
        </div>
      </div>
    </div>
  );
};

export default Home;
