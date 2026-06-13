const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  companyName: String,
  location: String,
  salary: String,
  skillsRequired: [String],
  description: String
});

module.exports = mongoose.model("Job", jobSchema);