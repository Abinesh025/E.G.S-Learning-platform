const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const bulkMaterialService = require('../services/bulkMaterialService')
const bulkTestService = require('../services/bulkTestService')
const bulkResultService = require('../services/bulkResultService')

async function runTests() {
  console.log('========================================================')
  console.log('🧪 RUNNING BULK DOMAIN DATA (MATERIALS, TESTS, RESULTS) TESTS')
  console.log('========================================================\n')

  let passed = 0
  let total = 0

  function assert(condition, message) {
    total++
    if (condition) {
      passed++
      console.log(`✅ [PASS] ${message}`)
    } else {
      console.error(`❌ [FAIL] ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  // -------------------------------------------------------------------
  // 1. Test Materials Bulk Service
  // -------------------------------------------------------------------
  console.log('--- Test 1: Materials Template & Validation ---')
  const matTemplate = bulkMaterialService.generateSampleMaterialExcelTemplate()
  assert(Buffer.isBuffer(matTemplate) && matTemplate.length > 0, 'Material sample template generated successfully as Excel buffer')

  const matFilePath = path.join(__dirname, '../../migration_templates/materials_migration.xlsx')
  assert(fs.existsSync(matFilePath), 'materials_migration.xlsx file exists')

  const matBuffer = fs.readFileSync(matFilePath)
  const matValidation = await bulkMaterialService.validateMaterialExcelBuffer(matBuffer)
  assert(matValidation.valid === true, `materials_migration.xlsx validation passed with ${matValidation.validCount} valid materials`)
  assert(matValidation.errorCount === 0, 'materials_migration.xlsx has 0 errors')
  assert(matValidation.preview.length > 0, 'materials preview array is populated')

  console.log('\n--- Test 2: Materials Bulk Insertion ---')
  const matInsert = await bulkMaterialService.insertBulkMaterials(matValidation.validMaterials)
  assert(matInsert.insertedCount === matValidation.validCount, `Successfully inserted ${matInsert.insertedCount} materials into database`)

  // -------------------------------------------------------------------
  // 2. Test Tests Bulk Service
  // -------------------------------------------------------------------
  console.log('\n--- Test 3: Tests Template & Validation ---')
  const testTemplate = bulkTestService.generateSampleTestExcelTemplate()
  assert(Buffer.isBuffer(testTemplate) && testTemplate.length > 0, 'Test sample template generated successfully as Excel buffer')

  const testFilePath = path.join(__dirname, '../../migration_templates/tests_migration.xlsx')
  assert(fs.existsSync(testFilePath), 'tests_migration.xlsx file exists')

  const testBuffer = fs.readFileSync(testFilePath)
  const testValidation = await bulkTestService.validateTestExcelBuffer(testBuffer)
  assert(testValidation.valid === true, `tests_migration.xlsx validation passed with ${testValidation.testCount} tests and ${testValidation.validCount} questions`)
  assert(testValidation.errorCount === 0, 'tests_migration.xlsx has 0 errors')
  assert(testValidation.preview.length > 0, 'tests preview array is populated')

  console.log('\n--- Test 4: Tests Bulk Insertion ---')
  const testInsert = await bulkTestService.insertBulkTests(testValidation.validTests)
  assert(testInsert.insertedTestsCount === testValidation.testCount, `Successfully inserted ${testInsert.insertedTestsCount} tests with ${testInsert.insertedQuestionsCount} questions into database`)

  // -------------------------------------------------------------------
  // 3. Test Results Bulk Service
  // -------------------------------------------------------------------
  console.log('\n--- Test 5: Results Template & Validation ---')
  const resultTemplate = bulkResultService.generateSampleResultExcelTemplate()
  assert(Buffer.isBuffer(resultTemplate) && resultTemplate.length > 0, 'Result sample template generated successfully as Excel buffer')

  const resultFilePath = path.join(__dirname, '../../migration_templates/results_migration.xlsx')
  assert(fs.existsSync(resultFilePath), 'results_migration.xlsx file exists')

  const resultBuffer = fs.readFileSync(resultFilePath)
  const resultValidation = await bulkResultService.validateResultExcelBuffer(resultBuffer)
  assert(resultValidation.valid === true, `results_migration.xlsx validation passed with ${resultValidation.validCount} valid student results`)
  assert(resultValidation.errorCount === 0, 'results_migration.xlsx has 0 errors')
  assert(resultValidation.preview.length > 0, 'results preview array is populated')

  console.log('\n--- Test 6: Results Bulk Insertion ---')
  const resultInsert = await bulkResultService.insertBulkResults(resultValidation.validResults)
  assert(resultInsert.insertedCount === resultValidation.validCount, `Successfully inserted ${resultInsert.insertedCount} student test results into database`)

  console.log('\n========================================================')
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total}`)
  console.log('========================================================\n')
  process.exit(0)
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err)
  process.exit(1)
})
