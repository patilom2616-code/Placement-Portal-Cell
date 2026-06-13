const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  studentName: String,
  studentEmail: String,
  jobTitle: String,
  companyName: String,
  status: {
    type: String,
    default: "Applied"
  }
});

module.exports =
mongoose.model("Application", applicationSchema);