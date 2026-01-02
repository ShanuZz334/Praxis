/* Fundamental Widgets */
import FundamentalGauge from "./FundamentalWidgets/FundamentalGauge";
import FiiDiiWidget from "./FundamentalWidgets/FiiDiiWidget";
import VixWidget from "./FundamentalWidgets/VixWidget";
import SectorWidget from "./FundamentalWidgets/SectorWidget";
import MacroWidget from "./FundamentalWidgets/MacroWidget";
import SgxWidget from "./FundamentalWidgets/SgxWidget";
import OptionsWidget from "./FundamentalWidgets/OptionsWidget";
import SentimentWidget from "./FundamentalWidgets/SentimentWidget";

/* NEW widgets */
import InstitutionalHoldings from "./FundamentalWidgets/InstitutionalHoldings";
import EarningsCalendar from "./FundamentalWidgets/EarningsCalendar";
import EconomicEvents from "./FundamentalWidgets/EconomicEvents";
import LiquidityMonitor from "./FundamentalWidgets/LiquidityMonitor";
import ShortInterest from "./FundamentalWidgets/ShortInterest";
import VolatilityTermStructure from "./FundamentalWidgets/VolatilityTermStructure";
import CurrencyStrength from "./FundamentalWidgets/CurrencyStrength";
import MarketBreadthDeep from "./FundamentalWidgets/MarketBreadthDeep";
import PCRTrend from "./FundamentalWidgets/PCRTrend";
import GsecYieldCurve from "./FundamentalWidgets/GsecYieldCurve";
import GlobalSentimentComposite from "./FundamentalWidgets/GlobalSentimentComposite";

/* fake data (temporary) */
import {
  fundamentalGaugeScore,
  fiiDiiData,
  vixData,
  sectorPerformance,
  macroData,
  sgxNifty,
  optionChainSummary,
  sentimentData,

  /* new data */
  institutionalHoldings,
  earningsCalendar,
  economicEventsData,
  liquidityMonitorData,
  shortInterestData,
  volTermStructure,
  currencyStrength,
  marketBreadthDeep,
  pcrTrend,
  gsecYieldCurve,
  globalSentimentComposite,
} from "../../utils/fakeFundData";

const Fundamental = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">
        Fundamental Overview
      </h1>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <FundamentalGauge data={fundamentalGaugeScore} />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <FiiDiiWidget data={fiiDiiData} />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <VixWidget data={vixData} />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <SectorWidget data={sectorPerformance} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <MacroWidget data={macroData} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <SgxWidget data={sgxNifty} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <OptionsWidget data={optionChainSummary} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <SentimentWidget data={sentimentData} />
        </div>
      </div>

      {/* Additional widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <InstitutionalHoldings data={institutionalHoldings} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <EarningsCalendar data={earningsCalendar} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <EconomicEvents data={economicEventsData} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <LiquidityMonitor data={liquidityMonitorData} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <ShortInterest data={shortInterestData} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <VolatilityTermStructure data={volTermStructure} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <CurrencyStrength data={currencyStrength} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <MarketBreadthDeep data={marketBreadthDeep} />
        </div>

        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <PCRTrend data={pcrTrend} />
        </div>
        <div className="p-4 rounded-xl bg-white/6 border border-white/10">
          <GsecYieldCurve data={gsecYieldCurve} />
        </div>
      </div>

      {/* Full width */}
      <div className="p-4 rounded-xl bg-white/6 border border-white/10">
        <GlobalSentimentComposite data={globalSentimentComposite} />
      </div>
    </div>
  );
};

export default Fundamental;
