// controllers/foreignController.js
import ForeignMarket from "../models/ForeignMarket.js";

// GET /api/foreign-markets
export const getAllMarkets = async (req, res) => {
  try {
    const markets = await ForeignMarket.find().sort({ asset_name: 1 });
    res.status(200).json(markets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching markets", error: err.message });
  }
};

// GET /api/foreign-markets/:id
export const getMarketById = async (req, res) => {
  try {
    const market = await ForeignMarket.findById(req.params.id);
    if (!market) return res.status(404).json({ message: "Market not found" });
    res.status(200).json(market);
  } catch (err) {
    res.status(500).json({ message: "Error fetching market", error: err.message });
  }
};

// POST /api/foreign-markets
export const createMarket = async (req, res) => {
  try {
    const newMarket = await ForeignMarket.create(req.body);
    res.status(201).json(newMarket);
  } catch (err) {
    res.status(400).json({ message: "Error creating market", error: err.message });
  }
};

// PUT /api/foreign-markets/:id
export const updateMarket = async (req, res) => {
  try {
    const updatedMarket = await ForeignMarket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMarket) return res.status(404).json({ message: "Market not found" });
    res.status(200).json(updatedMarket);
  } catch (err) {
    res.status(400).json({ message: "Error updating market", error: err.message });
  }
};

// DELETE /api/foreign-markets/:id
export const deleteMarket = async (req, res) => {
  try {
    const deletedMarket = await ForeignMarket.findByIdAndDelete(req.params.id);
    if (!deletedMarket) return res.status(404).json({ message: "Market not found" });
    res.status(200).json({ message: "Market deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting market", error: err.message });
  }
};
