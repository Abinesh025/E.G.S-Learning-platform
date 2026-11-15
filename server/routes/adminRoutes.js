const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyAdminToken } = require("../middleware/adminTokenMiddleware");
const { uploadMaterial } = require("../config/cloudinary");

// Multer memory storage for Excel files
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const {
  // Dashboard
  getDashboardStats,

  // Staff
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,

  // Students
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  validateBulkStudents,
  uploadBulkStudents,
  downloadStudentTemplate,

  // Materials
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,

  // Tests
  getAllTests,
  createTest,
  updateTest,
  deleteTest,

  // Results
  getAllResults,
  deleteResult,
} = require("../controllers/adminController");

const { uploadMaterial: uploadMaterialHandler, downloadMaterial } = require("../controllers/materialController");

// 🔐 All admin routes require a valid admin JWT token
router.use(verifyAdminToken);

/* ── Dashboard ── */
router.get("/dashboard", getDashboardStats);

/* ── Staff ── */
router.get("/staff", getAllStaff);
router.post("/staff", createStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

/* ── Students ── */
router.get("/students/sample-template", downloadStudentTemplate);
router.post("/students/bulk-validate", uploadExcel.single("file"), validateBulkStudents);
router.post("/students/bulk-upload", uploadExcel.single("file"), uploadBulkStudents);
router.get("/students", getAllStudents);
router.post("/students", createStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

/* ── Materials ── */
router.get("/materials", getAllMaterials);
router.post("/materials", createMaterial);
router.post("/materials/upload", uploadMaterial.single('file'), uploadMaterialHandler);
router.put("/materials/:id", updateMaterial);
router.delete("/materials/:id", deleteMaterial);
// Download proxy — uses admin token (not Bearer JWT) so admin can download without redirect
router.get("/materials/download/:id", downloadMaterial);

/* ── Tests ── */
router.get("/tests", getAllTests);
router.post("/tests", createTest);
router.put("/tests/:id", updateTest);
router.delete("/tests/:id", deleteTest);

/* ── Results ── */
router.get("/results", getAllResults);
router.delete("/results/:id", deleteResult);

module.exports = router;