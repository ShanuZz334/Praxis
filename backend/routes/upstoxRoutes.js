import express from "express";
import { authUrl, exchangeCodeForToken } from "../services/upstoxService.js";

const router = express.Router();

router.get('/login', (req, res) => {
  res.redirect(authUrl());
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    await exchangeCodeForToken(code);
    res.redirect('/dashboard/home');
  } catch (err) {
    console.error(err);
    res.status(500).send('Upstox login failed');
  }
});

export default router;
