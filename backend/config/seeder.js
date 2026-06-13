const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");

const seedDB = async () => {
  try {
    // Check if seeding is already done
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already has data. Skipping seeding.");
      return;
    }

    console.log("Seeding database with sample data...");

    // 1. Create Users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = await User.create([
      {
        name: "Om Patel",
        email: "student@example.com",
        passwordHash: hashedPassword,
        role: "student"
      },
      {
        name: "Google Recruiter",
        email: "company@example.com",
        passwordHash: hashedPassword,
        role: "company"
      },
      {
        name: "Admin Placement Cell",
        email: "admin@example.com",
        passwordHash: hashedPassword,
        role: "admin"
      }
    ]);

    // 2. Create Students
    await Student.create([
      {
        name: "Om Patel",
        email: "student@example.com",
        cgpa: 9.2,
        skills: ["React", "Node.js", "Express", "MongoDB"],
        branch: "Computer Science",
        resumeLink: "https://resume.example.com/ompatel"
      },
      {
        name: "Jane Doe",
        email: "jane@example.com",
        cgpa: 8.5,
        skills: ["Python", "Django", "PostgreSQL"],
        branch: "Information Technology",
        resumeLink: "https://resume.example.com/janedoe"
      },
      {
        name: "John Smith",
        email: "john@example.com",
        cgpa: 7.9,
        skills: ["Java", "Spring Boot", "MySQL"],
        branch: "Electronics",
        resumeLink: "https://resume.example.com/johnsmith"
      }
    ]);

    // 3. Create Companies
    await Company.create([
      {
        companyName: "Google",
        email: "info@google.com",
        location: "Mountain View, CA",
        website: "https://google.com",
        description: "Global technology leader specializing in search and cloud computing."
      },
      {
        companyName: "Microsoft",
        email: "careers@microsoft.com",
        location: "Redmond, WA",
        website: "https://microsoft.com",
        description: "Empowers every person and organization on the planet to achieve more."
      },
      {
        companyName: "Amazon",
        email: "jobs@amazon.com",
        location: "Seattle, WA",
        website: "https://amazon.com",
        description: "Earth's most customer-centric company and e-commerce leader."
      }
    ]);

    // 4. Create Jobs
    await Job.create([
      {
        title: "Software Engineer",
        companyName: "Google",
        location: "Mountain View, CA",
        salary: "$150,000",
        skillsRequired: ["React", "Node.js", "Go"],
        description: "Rebuild web infrastructure and scale user-facing web services."
      },
      {
        title: "Frontend Developer",
        companyName: "Microsoft",
        location: "Redmond, WA",
        salary: "$120,000",
        skillsRequired: ["React", "CSS", "TypeScript"],
        description: "Create beautiful, highly-responsive web applications in React."
      },
      {
        title: "Cloud Architect",
        companyName: "Amazon",
        location: "Seattle, WA",
        salary: "$160,000",
        skillsRequired: ["AWS", "Node.js", "Python"],
        description: "Build, deploy, and optimize scalable cloud architecture solutions."
      }
    ]);

    // 5. Create Applications
    await Application.create([
      {
        studentName: "Jane Doe",
        studentEmail: "jane@example.com",
        jobTitle: "Frontend Developer",
        companyName: "Microsoft",
        status: "Shortlisted"
      },
      {
        studentName: "John Smith",
        studentEmail: "john@example.com",
        jobTitle: "Cloud Architect",
        companyName: "Amazon",
        status: "Applied"
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error.message);
  }
};

module.exports = seedDB;
