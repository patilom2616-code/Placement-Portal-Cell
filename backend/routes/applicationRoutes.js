const express = require("express");

const router = express.Router();

const {
 applyJob,
 getApplications
}
=
require("../controllers/applicationController");

router.post("/", applyJob);

router.get("/", getApplications);

module.exports = router;