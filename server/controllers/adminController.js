const User = require("../models/User");
const Material = require("../models/Material");
const Test = require("../models/Test");
const Result = require("../models/Result");
const bcrypt = require("bcryptjs");
const { getIo } = require("../socket/chatSocket");

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalStaff, totalStudents, totalMaterials, totalTests, totalResults] =
      await Promise.all([
        User.countDocuments({ role: "staff" }),
        User.countDocuments({ role: "student" }),
        Material.countDocuments(),
        Test.countDocuments(),
        Result.countDocuments(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalStaff,
        totalStudents,
        totalMaterials,
        totalTests,
        totalResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE STAFF
// ─────────────────────────────────────────────
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      department,
      role: "staff",
    });

    const data = staff.toObject();
    delete data.password;

    const io = getIo();
    if (io) io.emit('data_changed', 'staff');

    res.status(201).json({
      success: true,
      message: "Staff created",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE STAFF
// ─────────────────────────────────────────────
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, phone, department, isActive, password } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updateData.email = email;
    }
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "staff" },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const io = getIo();
    if (io) io.emit('data_changed', 'staff');

    res.status(200).json({
      success: true,
      message: "Staff updated",
      data: staff,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE STAFF
// ─────────────────────────────────────────────
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id: req.params.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const io = getIo();
    if (io) io.emit('data_changed', 'staff');

    res.status(200).json({
      success: true,
      message: "Staff deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL STUDENTS
// ─────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE STUDENT
// ─────────────────────────────────────────────
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, phone, batch, course, department, isActive, password } = req.body;

    const updateData = {};

    if (name) updateData.name = name;

    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updateData.email = email;
    }

    if (phone) updateData.phone = phone;
    if (batch) updateData.batch = batch;
    if (course) updateData.course = course;
    if (department) updateData.department = department;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student updated",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE STUDENT
// ─────────────────────────────────────────────
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const io = getIo();
    if (io) io.emit('data_changed', 'student');

    res.status(200).json({
      success: true,
      message: "Student deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL STAFF
// ─────────────────────────────────────────────
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE STUDENT
// ─────────────────────────────────────────────
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, batch, course, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Required fields missing" });
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: "Email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await User.create({ name, email, password: hashedPassword, phone, batch, course, department, role: "student" });
    const data = student.toObject(); delete data.password;

    const io = getIo();
    if (io) io.emit('data_changed', 'student');

    res.status(201).json({ success: true, message: "Student created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN MATERIALS
// ─────────────────────────────────────────────
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().populate("uploadedBy", "name").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createMaterial = async (req, res) => {
  try {
    const material = await Material.create({ ...req.body, uploadedBy: req.user._id });
    
    const io = getIo();
    if (io) io.emit('data_changed', 'material');

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    const io = getIo();
    if (io) io.emit('data_changed', 'material');

    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteMaterial = async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    
    const io = getIo();
    if (io) io.emit('data_changed', 'material');

    res.status(200).json({ success: true, message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN TESTS
// ─────────────────────────────────────────────
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().populate("createdBy", "name").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createTest = async (req, res) => {
  try {
    const test = await Test.create({ ...req.body, createdBy: req.user._id });

    const io = getIo();
    if (io) io.emit('data_changed', 'test');

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const io = getIo();
    if (io) io.emit('data_changed', 'test');

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteTest = async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);

    const io = getIo();
    if (io) io.emit('data_changed', 'test');

    res.status(200).json({ success: true, message: "Test deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN TEST RESULTS
// ─────────────────────────────────────────────
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate("student", "name email").populate("test", "title").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteResult = async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);

    const io = getIo();
    if (io) io.emit('data_changed', 'result');

    res.status(200).json({ success: true, message: "Result deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};