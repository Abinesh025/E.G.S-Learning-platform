

// Regular entry dept codes (suffix R)
const STUDENT_DEPT_CODES_REGULAR = ['CSR', 'ITR', 'MER', 'ADR', 'BSR', 'BER', 'EER', 'ECR', 'CER']

// Lateral entry dept codes (suffix L)
const STUDENT_DEPT_CODES_LATERAL = ['CSL', 'ITL', 'MEL', 'ADL', 'BSL', 'BEL', 'EEL', 'ECL', 'CEL']

// All valid dept codes (regular + lateral)
const STUDENT_DEPT_CODES = [...STUDENT_DEPT_CODES_REGULAR, ...STUDENT_DEPT_CODES_LATERAL]

// Fixed valid years: 2023, 2024, 2025
const VALID_YEARS = ['23', '24', '25']

/**
 * Build the student regex with a fixed year range (23 | 24 | 25).
 */
function buildStudentRegex() {
  const yearPattern = VALID_YEARS.join('|')
  const deptPattern = STUDENT_DEPT_CODES.join('|')

  // 8208E  (23|24|25|26)  (CSR|ITR|…)  \d{3}
  return new RegExp(`^8208E(${yearPattern})(${deptPattern})(\\d{3})$`)
}

// Staff: EGSP<digits> or EGSPE<digits>
const STAFF_REGEX = /^EGSPE?\d+$/

/**
 * Validate a registration number against the given role.
 *
 * @param {string} regnum - The registration number to validate.
 * @param {'student'|'staff'} role - The user's role.
 * @returns {{ valid: boolean, message: string }}
 */
function validateRegNum(regnum, role) {
  if (!regnum || typeof regnum !== 'string') {
    return { valid: false, message: 'Registration number is required' }
  }

  const trimmed = regnum.trim().toUpperCase()

  if (role === 'student') {
    const regex = buildStudentRegex()
    if (!regex.test(trimmed)) {
      return {
        valid: false,
        message:
          `Invalid student registration number. ` +
          `Format: 8208E[YY][DEPT][3 digits] — ` +
          `Regular e.g. 8208E23BSR001 | Lateral e.g. 8208E23BSL001. ` +
          `Regular codes: ${STUDENT_DEPT_CODES_REGULAR.join(', ')}. ` +
          `Lateral codes: ${STUDENT_DEPT_CODES_LATERAL.join(', ')}.`
      }
    }
    return { valid: true, message: 'Valid' }
  }

  if (role === 'staff') {
    if (!STAFF_REGEX.test(trimmed)) {
      return {
        valid: false,
        message:
          'Invalid staff registration number. ' +
          'Must start with EGSP or EGSPE followed by digits — e.g. EGSP001 or EGSPE001.'
      }
    }
    return { valid: true, message: 'Valid' }
  }

  return { valid: false, message: 'Unknown role — cannot validate registration number' }
}

module.exports = { validateRegNum, buildStudentRegex, STAFF_REGEX, STUDENT_DEPT_CODES, STUDENT_DEPT_CODES_REGULAR, STUDENT_DEPT_CODES_LATERAL }
