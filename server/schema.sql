-- =======================================================
-- SmartStart System - SQL Server Database & Table Schema
-- =======================================================

-- 1. יצירת מסד הנתונים במידה ואינו קיים
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SmartStartDB')
BEGIN
    CREATE DATABASE SmartStartDB;
    PRINT 'Database SmartStartDB created successfully.';
END
GO

USE SmartStartDB;
GO

-- 2. יצירת טבלת מורים (Teachers)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Teachers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Teachers] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [fullName] NVARCHAR(150) NOT NULL,
        [username] NVARCHAR(100) NOT NULL UNIQUE,
        [password] NVARCHAR(200) NOT NULL,
        [email] NVARCHAR(150) NULL,
        [createdAt] DATETIME2 DEFAULT GETDATE()
    );

    INSERT INTO [dbo].[Teachers] (fullName, username, password)
    VALUES (N'המורה שמעון', 'shimon', '123');

    PRINT 'Table Teachers created successfully.';
END
GO

-- 3. יצירת טבלת כיתות וקבוצות (Classes)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Classes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Classes] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [className] NVARCHAR(150) NOT NULL UNIQUE,
        [createdTeacher] NVARCHAR(150) NULL,
        [createdAt] DATETIME2 DEFAULT GETDATE()
    );

    INSERT INTO [dbo].[Classes] (className, createdTeacher)
    VALUES 
        (N'כיתה ז׳1', N'המורה שמעון'),
        (N'כיתה ז׳2', N'המורה שמעון'),
        (N'כיתה ח׳1', N'המורה שמעון'),
        (N'כיתה ח׳2', N'המורה שמעון'),
        (N'כיתה ט׳1', N'המורה שמעון'),
        (N'חוג רובוטיקה', N'המורה שמעון');

    PRINT 'Table Classes created successfully.';
END
GO

-- 4. יצירת טבלת הגשות תלמידים (StudentSubmissions)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StudentSubmissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[StudentSubmissions] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [studentName] NVARCHAR(150) NOT NULL,
        [teacherName] NVARCHAR(150) NOT NULL,
        [className] NVARCHAR(100) NULL,
        [projectName] NVARCHAR(150) NOT NULL,
        [projectType] NVARCHAR(100) NULL,
        [code] NVARCHAR(MAX) NOT NULL,
        [blockXml] NVARCHAR(MAX) NULL,
        [notes] NVARCHAR(1000) NULL,
        [status] NVARCHAR(50) DEFAULT 'new',
        [createdAt] DATETIME2 DEFAULT GETDATE(),
        [updatedAt] DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_StudentSubmissions_StudentName ON [dbo].[StudentSubmissions]([studentName]);
    CREATE INDEX IX_StudentSubmissions_TeacherName ON [dbo].[StudentSubmissions]([teacherName]);
    CREATE INDEX IX_StudentSubmissions_ClassName ON [dbo].[StudentSubmissions]([className]);
    CREATE INDEX IX_StudentSubmissions_CreatedAt ON [dbo].[StudentSubmissions]([createdAt] DESC);

    PRINT 'Table StudentSubmissions created successfully.';
END
GO

-- 5. יצירת טבלת פרויקטים שמורים אישיים של תלמידים (SavedProjects)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SavedProjects]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SavedProjects] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [studentName] NVARCHAR(150) NOT NULL,
        [projectName] NVARCHAR(150) NOT NULL,
        [projectType] NVARCHAR(100) NOT NULL,
        [password] NVARCHAR(200) NOT NULL,
        [blockXml] NVARCHAR(MAX) NULL,
        [code] NVARCHAR(MAX) NULL,
        [updatedAt] DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_SavedProjects_Lookup ON [dbo].[SavedProjects]([studentName], [projectType]);

    PRINT 'Table SavedProjects created successfully.';
END
GO

-- 6. יצירת טבלת רישיונות ומנויים (Licenses)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Licenses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Licenses] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [code] NVARCHAR(100) NOT NULL UNIQUE,
        [ownerType] NVARCHAR(50) NOT NULL DEFAULT 'teacher', -- 'teacher' | 'individual'
        [ownerName] NVARCHAR(150) NOT NULL,
        [ownerContact] NVARCHAR(150) NULL,
        [targetTrack] NVARCHAR(50) NOT NULL DEFAULT 'all',  -- 'car', 'turtle', 'smarthouse', 'builder', 'all'
        [maxStudents] INT NOT NULL DEFAULT 35,
        [usedCount] INT NOT NULL DEFAULT 0,
        [expiresAt] DATETIME2 NULL,
        [isActive] BIT NOT NULL DEFAULT 1,
        [notes] NVARCHAR(500) NULL,
        [createdAt] DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX IX_Licenses_Code ON [dbo].[Licenses]([code]);

    -- Demo licenses for testing
    INSERT INTO [dbo].[Licenses] (code, ownerType, ownerName, targetTrack, maxStudents, expiresAt, notes)
    VALUES 
        (N'DEMO-ALL-2026', 'teacher', N'כיתת הדגמה', 'all', 100, DATEADD(year, 1, GETDATE()), N'רישיון בדיקה לכל המסלולים'),
        (N'CAR-PRO-2026', 'teacher', N'המורה שמעון - מכונית', 'car', 35, DATEADD(year, 1, GETDATE()), N'רישיון מסלול מכונית');

    PRINT 'Table Licenses created successfully.';
END
GO
