const mongoose = require("mongoose");

const employmentHistorySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  cafeId: {
    type: String,
    required: true,
  },
  employment_start_date: {
    type: Date,
  },
  employment_end_date: {
    type: Date,
  },
});

const EmploymentHistories = mongoose.model(
  "employmentHistories",
  employmentHistorySchema
);

module.exports = EmploymentHistories;
