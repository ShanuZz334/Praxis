import axios from "axios";

export const upstoxLogin = (req, res) => {
  const clientId = process.env.UPSTOX_CLIENT_ID;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;
  const authUrl = `https://api-v2.upstox.com/login/authorization/dialog?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;

  res.redirect(authUrl);
};

export const upstoxCallback = async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.UPSTOX_CLIENT_ID;
  const clientSecret = process.env.UPSTOX_CLIENT_SECRET;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  try {
    const tokenResponse = await axios.post(
      "https://api-v2.upstox.com/login/authorization/token",
      new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // ✅ Save tokens for the user in DB (optional)
    res.status(200).json({
      message: "Upstox authorization successful!",
      access_token,
      refresh_token,
    });
  } catch (error) {
    console.error("Error getting Upstox token:", error.response?.data || error);
    res.status(500).json({
      message: "Failed to retrieve Upstox access token",
      error: error.message,
    });
  }
};
