const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  cgpa: Number,
  skills: [String],
  branch: String,
  resumeLink: String
});

module.exports = mongoose.model("Student", studentSchema);