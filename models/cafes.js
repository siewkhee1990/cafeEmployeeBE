const mongoose = require("mongoose");

const cafeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    lowercase: true,
    min: 6,
    max: 10,
  },
  description: {
    type: String,
    required: true,
    max: 256,
  },
  location: { type: String },
  status: { type: String },
});

const Cafes = mongoose.model("cafes", cafeSchema);

module.exports = Cafes;
