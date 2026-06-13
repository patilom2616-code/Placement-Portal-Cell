const Application =
require("../models/Application");

// Apply Job
exports.applyJob = async (req, res) => {
  const application =
  await Application.create(req.body);

  res.status(201).json(application);
};

// Get All Applications
exports.getApplications =
async (req, res) => {

  const applications =
  await Application.find();

  res.json(applications);
};