const mongoose = require('mongoose');
const { Schema } = mongoose;

const dailyMenuSchema = new Schema({
  day: { type: String, required: true }, 
  breakfast: { type: String, required: true },
  lunch: { type: String, required: true },
  dinner: { type: String, required: true }
});

const weeklyMenuSchema = new Schema({
  weekStart: { type: Date, required: true },
  menu: [dailyMenuSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeeklyMenu', weeklyMenuSchema);
