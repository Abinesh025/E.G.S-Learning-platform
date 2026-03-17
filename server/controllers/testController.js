const Test = require('../models/Test')
const Result = require('../models/Result')

// 📌 Create Test (Staff Only)
exports.createTest = async (req, res) => {
  try {
    const { title, subject, duration, questions } = req.body

    // ❌ Validation
    if (!title || !subject || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // ❌ Ensure valid question structure
    for (let q of questions) {
      if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
        return res.status(400).json({ message: 'Invalid question format' })
      }
    }

    const test = await Test.create({
      title,
      subject,
      duration,
      questions,
      createdBy: req.user._id
    })

    res.status(201).json({
      message: 'Test created successfully',
      test
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// 📌 Get All Tests (Student View)
exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .select('-questions.correctAnswer')
      .sort({ createdAt: -1 })

    res.json(tests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// 📌 Get Single Test
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .select('-questions.correctAnswer')

    if (!test) return res.status(404).json({ message: 'Test not found' })

    res.json(test)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// 📌 Submit Test (🔥 FIXED)
exports.submitTest = async (req, res) => {
  try {
    const { answers } = req.body
    const testId = req.params.id

    const test = await Test.findById(testId)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    // ❌ Prevent multiple submissions
    const existing = await Result.findOne({
      student: req.user._id,
      test: testId
    })

    if (existing) {
      return res.status(400).json({ message: 'You already submitted this test' })
    }

    let score = 0

    test.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++
      }
    })

    const result = await Result.create({
      student: req.user._id,
      test: testId,
      answers,
      score,
      totalMarks: test.questions.length
    })

    res.json({
      message: 'Test submitted successfully',
      score,
      total: test.questions.length,
      result
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// 📌 Get Student Results
exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('test', 'title subject')
      .sort({ createdAt: -1 })

    res.json(results)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// 📌 Delete Test (Staff Only)
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await test.deleteOne()

    res.json({ message: 'Test deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}