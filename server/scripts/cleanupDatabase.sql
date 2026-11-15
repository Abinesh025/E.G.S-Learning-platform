-- ========================================================================
-- E.G.S. Learning Platform - Database Cleanup & Reset Script (T-SQL)
-- Target Database: [EGS_LMS_HUB]
-- Compatible with: Microsoft SQL Server 2016+ / Express
-- ========================================================================

USE [EGS_LMS_HUB];
GO

-- ========================================================================
-- OPTION 1: COMPLETE OPERATIONAL CLEANUP (PRESERVE DEPARTMENTS & YEARS)
-- Cleans test submissions, results, materials, tests, messages, notifications,
-- and resets Students & Staff while keeping Departments, Years & Default Admin.
-- ========================================================================

BEGIN TRANSACTION;
BEGIN TRY

    PRINT '🧹 Step 1: Cleaning Domain & Activity Data...';
    
    -- Child tables first
    DELETE FROM StudentAnswers;
    DELETE FROM Results;
    DELETE FROM TestSubmissions;
    DELETE FROM Notifications;
    DELETE FROM Messages;
    DELETE FROM QuestionOptions;
    DELETE FROM TestQuestions;
    DELETE FROM Tests;
    DELETE FROM Materials;

    PRINT '🧹 Step 2: Cleaning Students and Staff (Leaving Default Admin)...';
    DELETE FROM Students;
    DELETE FROM Staff;

    -- Clean any extra admin accounts except default system admin
    DELETE FROM Admins WHERE Email <> 'admin@egspec.edu';

    PRINT '🔄 Step 3: Reseeding Identity Seeds...';
    
    -- Reseed Staff IDs to start at 5001
    DBCC CHECKIDENT ('Staff', RESEED, 5000);

    -- Reseed Admin IDs to start at 9001
    DBCC CHECKIDENT ('Admins', RESEED, 9000);

    -- Reseed Domain tables
    DBCC CHECKIDENT ('Materials', RESEED, 0);
    DBCC CHECKIDENT ('Tests', RESEED, 0);
    DBCC CHECKIDENT ('TestQuestions', RESEED, 0);
    DBCC CHECKIDENT ('QuestionOptions', RESEED, 0);
    DBCC CHECKIDENT ('TestSubmissions', RESEED, 0);
    DBCC CHECKIDENT ('Results', RESEED, 0);
    DBCC CHECKIDENT ('StudentAnswers', RESEED, 0);
    DBCC CHECKIDENT ('Messages', RESEED, 0);
    DBCC CHECKIDENT ('Notifications', RESEED, 0);

    COMMIT TRANSACTION;
    PRINT '✅ Database successfully cleaned! Operational data purged and seeds reset.';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error occurred during cleanup: ' + ERROR_MESSAGE();
END CATCH;
GO


-- ========================================================================
-- OPTION 2: FULL TEARDOWN (DROP ALL TABLES IN PROPER DEPENDENCY ORDER)
-- Use this if you want to wipe everything and run initDatabase.js from scratch.
-- ========================================================================
/*
BEGIN TRANSACTION;
BEGIN TRY

    DROP TABLE IF EXISTS Notifications;
    DROP TABLE IF EXISTS Messages;
    DROP TABLE IF EXISTS StudentAnswers;
    DROP TABLE IF EXISTS Results;
    DROP TABLE IF EXISTS TestSubmissions;
    DROP TABLE IF EXISTS QuestionOptions;
    DROP TABLE IF EXISTS TestQuestions;
    DROP TABLE IF EXISTS Tests;
    DROP TABLE IF EXISTS Materials;
    DROP TABLE IF EXISTS Students;
    DROP TABLE IF EXISTS Staff;
    DROP TABLE IF EXISTS Admins;
    DROP TABLE IF EXISTS Users; -- In case of legacy presence
    DROP TABLE IF EXISTS Years;
    DROP TABLE IF EXISTS Departments;

    COMMIT TRANSACTION;
    PRINT '✅ All tables dropped cleanly in dependency order.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error dropping tables: ' + ERROR_MESSAGE();
END CATCH;
GO
*/
