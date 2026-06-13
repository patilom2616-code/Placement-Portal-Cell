const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: String,
  email: String,
  location: String,
  website: String,
  description: String
});

module.exports = mongoose.model("Company", companySchema);