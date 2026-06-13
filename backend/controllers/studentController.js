const Student = require("../models/Student");

// Create Student
exports.createStudent = async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json(student);
};

// Get All Students
exports.getStudents = async (req, res) => {
  const students = await Student.find();
  res.json(students);
};

// Get Student By ID
exports.getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.json(student);
};

// Update Student
exports.updateStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(student);
};

// Delete Student
exports.deleteStudent = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);

  res.json({
    message: "Student Deleted"
  });
};