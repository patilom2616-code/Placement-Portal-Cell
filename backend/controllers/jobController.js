const Job = require("../models/Job");

// Create Job
exports.createJob = async (req, res) => {
  const job = await Job.create(req.body);
  res.status(201).json(job);
};

// Get All Jobs
exports.getJobs = async (req, res) => {
  const jobs = await Job.find();
  res.json(jobs);
};

// Get Job By ID
exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.json(job);
};

// Update Job
exports.updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(job);
};

// Delete Job
exports.deleteJob = async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);

  res.json({
    message: "Job Deleted"
  });
};