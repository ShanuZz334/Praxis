import TechnicalAnalysis from "../models/TechnicalAnalysis.js";

// GET /api/technical
export const getAllTechnicals = async (req, res) => {
  try {
    const technicals = await TechnicalAnalysis.find().sort({ symbol: 1, datetime: -1 });
    res.status(200).json(technicals);
  } catch (err) {
    res.status(500).json({ message: "Error fetching technicals", error: err.message });
  }
};

// GET /api/technical/:id
export const getTechnicalById = async (req, res) => {
  try {
    const technical = await TechnicalAnalysis.findById(req.params.id);
    if (!technical) return res.status(404).json({ message: "Technical not found" });
    res.status(200).json(technical);
  } catch (err) {
    res.status(500).json({ message: "Error fetching technical", error: err.message });
  }
};

// POST /api/technical
export const createTechnical = async (req, res) => {
  try {
    const newTechnical = await TechnicalAnalysis.create(req.body);
    res.status(201).json(newTechnical);
  } catch (err) {
    res.status(400).json({ message: "Error creating technical", error: err.message });
  }
};

// PUT /api/technical/:id
export const updateTechnical = async (req, res) => {
  try {
    const updatedTechnical = await TechnicalAnalysis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTechnical) return res.status(404).json({ message: "Technical not found" });
    res.status(200).json(updatedTechnical);
  } catch (err) {
    res.status(400).json({ message: "Error updating technical", error: err.message });
  }
};

// DELETE /api/technical/:id
export const deleteTechnical = async (req, res) => {
  try {
    const deletedTechnical = await TechnicalAnalysis.findByIdAndDelete(req.params.id);
    if (!deletedTechnical) return res.status(404).json({ message: "Technical not found" });
    res.status(200).json({ message: "Technical deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting technical", error: err.message });
  }
};
