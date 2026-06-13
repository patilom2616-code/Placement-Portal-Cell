const express = require("express");

const router = express.Router();

const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");

router.post("/", createJob);

router.get("/", getJobs);

router.get("/:id", getJob);

router.put("/:id", updateJob);

router.delete("/:id", deleteJob);

module.exports = router;