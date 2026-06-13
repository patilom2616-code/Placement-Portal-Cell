const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");

exports.getDashboardStats = async (req, res) => {

  const totalStudents =
    await Student.countDocuments();

  const totalCompanies =
    await Company.countDocuments();

  const totalJobs =
    await Job.countDocuments();

  const totalApplications =
    await Application.countDocuments();

  res.json({
    totalStudents,
    totalCompanies,
    totalJobs,
    totalApplications
  });
};