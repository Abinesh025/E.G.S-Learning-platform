const express = require("express");
const router = express.Router();

const {
  // Dashboard
  getDashboardStats,

  // Staff
  createStaff,
  updateStaff,
  deleteStaff,

  // Students
  getAllStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/adminController");

const { protectMe } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Protect all admin routes
router.use(protectMe);
router.use(authorizeRoles("admin"));

/* ── Dashboard ── */
router.get("/dashboard", getDashboardStats);

/* ── Staff ── */
router.post("/staff", createStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

/* ── Students ── */
router.get("/students", getAllStudents);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

module.exports = router;