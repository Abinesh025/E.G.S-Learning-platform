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
  validateBulkStaff,
  uploadBulkStaff,
  downloadStaffTemplate,

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
  downloadMaterialTemplate,
  validateBulkMaterials,
  uploadBulkMaterials,

  // Tests
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  downloadTestTemplate,
  validateBulkTests,
  uploadBulkTests,

  // Results
  getAllResults,
  deleteResult,
  downloadResultTemplate,
  validateBulkResults,
  uploadBulkResults,

  // Logs
  getAdminLogs,
  clearAdminLogs,
  downloadAdminLogs,
} = require("../controllers/adminController");

const { uploadMaterial: uploadMaterialHandler, downloadMaterial } = require("../controllers/materialController");

// 🔐 All admin routes require a valid admin JWT token
router.use(verifyAdminToken);

/* ── Dashboard ── */
router.get("/dashboard", getDashboardStats);

/* ── Staff ── */
router.get("/staff/sample-template", downloadStaffTemplate);
router.post("/staff/bulk-validate", uploadExcel.single("file"), validateBulkStaff);
router.post("/staff/bulk-upload", uploadExcel.single("file"), uploadBulkStaff);
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
router.get("/materials/sample-template", downloadMaterialTemplate);
router.post("/materials/bulk-validate", uploadExcel.single("file"), validateBulkMaterials);
router.post("/materials/bulk-upload", uploadExcel.single("file"), uploadBulkMaterials);
router.get("/materials", getAllMaterials);
router.post("/materials", createMaterial);
router.post("/materials/upload", uploadMaterial.single('file'), uploadMaterialHandler);
router.put("/materials/:id", updateMaterial);
router.delete("/materials/:id", deleteMaterial);
// Download proxy — uses admin token (not Bearer JWT) so admin can download without redirect
router.get("/materials/download/:id", downloadMaterial);

/* ── Tests ── */
router.get("/tests/sample-template", downloadTestTemplate);
router.post("/tests/bulk-validate", uploadExcel.single("file"), validateBulkTests);
router.post("/tests/bulk-upload", uploadExcel.single("file"), uploadBulkTests);
router.get("/tests", getAllTests);
router.post("/tests", createTest);
router.put("/tests/:id", updateTest);
router.delete("/tests/:id", deleteTest);

/* ── Results ── */
router.get("/results/sample-template", downloadResultTemplate);
router.post("/results/bulk-validate", uploadExcel.single("file"), validateBulkResults);
router.post("/results/bulk-upload", uploadExcel.single("file"), uploadBulkResults);
router.get("/results", getAllResults);
router.delete("/results/:id", deleteResult);

/* ── Logs ── */
router.get("/logs", getAdminLogs);
router.delete("/logs", clearAdminLogs);
router.get("/logs/download", downloadAdminLogs);

module.exports = router;