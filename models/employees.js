const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    lowercase: true,
    required: true,
  },
  email_address: {
    type: String,
    lowercase: true,
    required: true,
  },
  phone_number: {
    type: Number,
    required: true,
  },
  gender: { type: String, required: true },
  status: { type: String, required: true },
});

const Employees = mongoose.model("employees", employeeSchema);

module.exports = Employees;
