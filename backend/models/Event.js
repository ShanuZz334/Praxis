import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ["Economic", "Corporate", "Political", "Central Bank", "Other"],
    default: "Other",
  },
  impact: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  country: { type: String },
  start_datetime: { type: Date, required: true },
  end_datetime: { type: Date },
  source: { type: String },
  importance_score: { type: Number, default: 0 },
}, { timestamps: true });

EventSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const Event = mongoose.model("Event", EventSchema);
export default Event;
