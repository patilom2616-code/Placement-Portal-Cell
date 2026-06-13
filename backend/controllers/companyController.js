const Company = require("../models/Company");

// Create Company
exports.createCompany = async (req, res) => {
  const company = await Company.create(req.body);
  res.status(201).json(company);
};

// Get All Companies
exports.getCompanies = async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
};

// Get Company By ID
exports.getCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);
  res.json(company);
};

// Update Company
exports.updateCompany = async (req, res) => {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(company);
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  await Company.findByIdAndDelete(req.params.id);

  res.json({
    message: "Company Deleted"
  });
};