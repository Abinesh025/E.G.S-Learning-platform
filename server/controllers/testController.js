const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const userRepository = require('../repositories/userRepository')
const createNotifications = require('../utils/createNotification')
const sendSms = require('../utils/sendSms')

// ─────────────────────────────────────────────
// CREATE TEST (Staff / Admin Only)
// ─────────────────────────────────────────────
exports.createTest = async (req, res) => {
  try {
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only staff can create tests' })
    }

    const { title, subject, duration, questions } = req.body

    const department = req.user.department
    if (!department) {
      return res.status(400).json({ message: 'Staff department is required' })
    }

    if (!title || !subject || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    for (let q of questions) {
      if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
        return res.status(400).json({ message: 'Invalid question format' })
      }
    }

    const test = await testRepository.createTestWithQuestions({
      title,
      subject,
      department,
      duration: Number(duration),
      createdBy: req.user._id,
      questions,
    })

    // Find students in department
    const students = await userRepository.getAllUsers({ role: 'student', department })

    const message = `New test uploaded by ${req.user.name || 'Staff'}: ${title}`
    await createNotifications({
      senderId: req.user._id,
      receivers: students,
      receiverRole: 'student',
      department,
      type: 'test_upload',
      title: 'New Test Uploaded',
      message,
      testId: test._id,
      relatedModel: 'Test',
    })

    res.status(201).json({
      message: 'Test created successfully',
      test,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET ALL TESTS (Student / Staff View)
// ─────────────────────────────────────────────
exports.getTests = async (req, res) => {
  try {
    const department = req.user.role === 'student' ? req.user.department : undefined
    const tests = await testRepository.getTests({ department })
    res.json(tests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET SINGLE TEST
// ─────────────────────────────────────────────
exports.getTestById = async (req, res) => {
  try {
    const isStaff = req.user.role === 'staff' || req.user.role === 'admin'
    const test = await testRepository.getTestById(req.params.id, isStaff)

    if (!test) return res.status(404).json({ message: 'Test not found' })

    res.json(test)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────
// SUBMIT TEST
// ─────────────────────────────────────────────
exports.submitTest = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit tests' })
    }

    const { answers } = req.body
    const testId = Number(req.params.id)

    const test = await testRepository.getTestById(testId, true)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    // Prevent duplicate attempts
    const existing = await submissionRepository.findExistingResult(req.user._id, testId)
    if (existing) {
      return res.status(400).json({ message: 'You already submitted this test' })
    }

    let score = 0
    const studentAnswerMappings = []

    test.questions.forEach((q, index) => {
      const selectedOptionIdx = answers ? answers[index] : null
      if (selectedOptionIdx !== null && selectedOptionIdx !== undefined && selectedOptionIdx === q.correctAnswer) {
        score++
      }

      let selectedOptionId = null
      if (selectedOptionIdx !== null && selectedOptionIdx !== undefined && q.rawOptions) {
        const matchingOpt = q.rawOptions[selectedOptionIdx]
        if (matchingOpt) {
          selectedOptionId = matchingOpt.optionId
        }
      }

      studentAnswerMappings.push({
        questionId: q.QuestionId || q._id,
        selectedOptionId,
      })
    })

    const totalQuestions = test.questions.length
    const totalMarks = totalQuestions
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0

    // Send SMS to student phone if available
    let smsStatus = 'not_sent'
    let smsSentAt = null

    if (req.user.phone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/
      if (phoneRegex.test(req.user.phone.trim())) {
        const studentName = req.user.name || 'Student'
        const testTitle = test.title || 'Test'
        const department = req.user.department || 'General'
        const smsMessage = `Dear ${studentName}, your test '${testTitle}' has been submitted successfully. Department: ${department}. Score: ${score}/${totalQuestions}. Thank you.`

        try {
          const smsResult = await sendSms(req.user.phone, smsMessage)
          if (smsResult && smsResult.success) {
            smsStatus = 'sent'
            smsSentAt = new Date()
          } else {
            smsStatus = 'failed'
          }
        } catch (smsErr) {
          console.error('[SMS ERROR] SMS dispatch failed:', smsErr.message)
          smsStatus = 'failed'
        }
      } else {
        smsStatus = 'failed'
      }
    }

    const { result, submission } = await submissionRepository.createSubmissionAndResult({
      studentId: req.user._id,
      testId,
      score,
      totalMarks,
      percentage,
      totalQuestions,
      smsStatus,
      smsSentAt,
      studentAnswerMappings,
    })

    // Notify staff who created the test
    let warning = null
    const staff = await userRepository.findUserById(test.createdBy)
    if (!staff) {
      warning = 'Corresponding staff not found for notification, but submission saved.'
    } else {
      const studentName = req.user.name || 'Student'
      await createNotifications({
        senderId: req.user._id,
        receivers: [staff],
        receiverRole: 'staff',
        department: req.user.department,
        type: 'test_submission',
        title: 'New Test Submission',
        message: `${studentName} submitted the test: ${test.title}`,
        submissionId: submission._id,
        relatedModel: 'TestSubmission',
      })
    }

    res.json({
      message: 'Test submitted successfully',
      score,
      total: totalQuestions,
      result,
      submission,
      warning,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET STUDENT RESULTS
// ─────────────────────────────────────────────
exports.getStudentResults = async (req, res) => {
  try {
    const results = await submissionRepository.getResultsByStudent(req.user._id)
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────
// DELETE TEST (Staff / Admin Only)
// ─────────────────────────────────────────────
exports.deleteTest = async (req, res) => {
  try {
    const testId = Number(req.params.id)
    const test = await testRepository.getTestById(testId)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    if (test.createdBy !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await testRepository.deleteTest(testId)

    res.json({ message: 'Test deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}