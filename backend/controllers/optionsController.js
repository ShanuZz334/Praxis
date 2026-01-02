import OptionAnalysis from "../models/OptionAnalysis.js";

// GET /api/options
export const getAllOptions = async (req, res) => {
  try {
    const options = await OptionAnalysis.find().sort({ symbol: 1, expiry_date: 1, strike_price: 1 });
    res.status(200).json(options);
  } catch (err) {
    res.status(500).json({ message: "Error fetching options", error: err.message });
  }
};

// GET /api/options/:id
export const getOptionById = async (req, res) => {
  try {
    const option = await OptionAnalysis.findById(req.params.id);
    if (!option) return res.status(404).json({ message: "Option not found" });
    res.status(200).json(option);
  } catch (err) {
    res.status(500).json({ message: "Error fetching option", error: err.message });
  }
};

// POST /api/options
export const createOption = async (req, res) => {
  try {
    const newOption = await OptionAnalysis.create(req.body);
    res.status(201).json(newOption);
  } catch (err) {
    res.status(400).json({ message: "Error creating option", error: err.message });
  }
};

// PUT /api/options/:id
export const updateOption = async (req, res) => {
  try {
    const updatedOption = await OptionAnalysis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedOption) return res.status(404).json({ message: "Option not found" });
    res.status(200).json(updatedOption);
  } catch (err) {
    res.status(400).json({ message: "Error updating option", error: err.message });
  }
};

// DELETE /api/options/:id
export const deleteOption = async (req, res) => {
  try {
    const deletedOption = await OptionAnalysis.findByIdAndDelete(req.params.id);
    if (!deletedOption) return res.status(404).json({ message: "Option not found" });
    res.status(200).json({ message: "Option deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting option", error: err.message });
  }
};
