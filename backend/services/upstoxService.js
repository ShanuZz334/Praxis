import axios from "axios";
import Token from "../models/Token.js";
import qs from "querystring";

const {
  UPSTOX_CLIENT_ID,
  UPSTOX_CLIENT_SECRET,
  UPSTOX_REDIRECT_URI
} = process.env;

// Build authorization URL
export const authUrl = () => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: UPSTOX_CLIENT_ID,
    redirect_uri: UPSTOX_REDIRECT_URI,
    scope: "orders trade",
    state: "stocky_state",
  });

  return `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
};

// Exchange auth code for access token
export async function exchangeCodeForToken(code) {
  const tokenEndpoint = "https://api.upstox.com/v2/login/authorization/token";

  const body = {
    code,
    client_id: UPSTOX_CLIENT_ID,
    client_secret: UPSTOX_CLIENT_SECRET,
    redirect_uri: UPSTOX_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  const r = await axios.post(tokenEndpoint, qs.stringify(body), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenData = r.data;
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  let token = await Token.findOne({ provider: "upstox" });
  if (!token) token = new Token({ provider: "upstox" });

  token.accessToken = tokenData.access_token;
  token.refreshToken = tokenData.refresh_token;
  token.expiresAt = expiresAt;
  token.raw = tokenData;

  await token.save();
  return token;
}

// Refresh token
export async function refreshToken(refreshTokenValue) {
  const tokenEndpoint = "https://api.upstox.com/v2/login/authorization/token";

  const body = {
    refresh_token: refreshTokenValue,
    client_id: UPSTOX_CLIENT_ID,
    client_secret: UPSTOX_CLIENT_SECRET,
    grant_type: "refresh_token",
  };

  const r = await axios.post(tokenEndpoint, qs.stringify(body), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenData = r.data;
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  let token = await Token.findOne({ provider: "upstox" });
  if (!token) token = new Token({ provider: "upstox" });

  token.accessToken = tokenData.access_token;
  token.refreshToken = tokenData.refresh_token || token.refreshToken;
  token.expiresAt = expiresAt;
  token.raw = tokenData;

  await token.save();
  return token;
}

// Generic Upstox API requester
export async function requestUpstox(endpoint, opts = {}) {
  let token = await Token.findOne({ provider: "upstox" });

  if (!token) throw new Error("Upstox token not found. Login again.");

  // Refresh before expiry (60 sec early)
  if (token.expiresAt < new Date(Date.now() + 60000)) {
    token = await refreshToken(token.refreshToken);
  }

  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    ...opts.headers,
  };

  const res = await axios({
    url: endpoint,
    method: opts.method || "GET",
    headers,
    data: opts.data || undefined,
    params: opts.params || undefined,
  });

  return res.data;
}
export async function fetchLivePrice(symbol) {
  return requestUpstox(
    "https://api.upstox.com/v2/market-quote/quotes",
    { params: { symbol } }
  );
}
export async function fetchOptionChain(identifier) {
  return requestUpstox(
    "https://api.upstox.com/v2/option-chain",
    { params: { instrument_key: identifier } }
  );
}
