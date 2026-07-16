import { fetchOptionChain } from "./services/upstoxOptionChain.js";
(async () => {
  try {
    const data = await fetchOptionChain("NSE_INDEX|Nifty 50", "2026-07-16");
    console.log(JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error(err);
  }
})();
