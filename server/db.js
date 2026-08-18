let sql = null;
try {
  sql = require('mssql');
} catch (e) {
  // mssql package not installed yet
}

const path = require('path');
const fs = require('fs');

// SQL Server Configuration
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'SmartStartDB',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 8000,
    requestTimeout: 15000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;
let isConnected = false;

// Fallback JSON storage files
const fallbackSubmissionsFile = path.join(__dirname, 'submissions_backup.json');
const fallbackTeachersFile = path.join(__dirname, 'teachers_backup.json');
const fallbackCustomTracksFile = path.join(__dirname, 'custom_tracks_backup.json');

function readFallbackCustomTracks() {
  try {
    if (fs.existsSync(fallbackCustomTracksFile)) {
      const data = fs.readFileSync(fallbackCustomTracksFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}
  return [];
}

function writeFallbackCustomTracks(tracks) {
  try {
    fs.writeFileSync(fallbackCustomTracksFile, JSON.stringify(tracks, null, 2), 'utf8');
  } catch (e) {}
}

function readFallbackTeachers() {
  try {
    if (fs.existsSync(fallbackTeachersFile)) {
      const data = fs.readFileSync(fallbackTeachersFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}
  // Default teacher
  return [
    { id: 1, fullName: 'המורה שמעון', username: 'shimon', password: '123' }
  ];
}

function writeFallbackTeachers(teachers) {
  try {
    fs.writeFileSync(fallbackTeachersFile, JSON.stringify(teachers, null, 2), 'utf8');
  } catch (e) {}
}

function readFallbackSubmissions() {
  try {
    if (fs.existsSync(fallbackSubmissionsFile)) {
      const data = fs.readFileSync(fallbackSubmissionsFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}
  return [];
}

function writeFallbackSubmissions(submissions) {
  try {
    fs.writeFileSync(fallbackSubmissionsFile, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Initialize Database and Tables automatically on startup
 */
async function initDatabase() {
  if (!sql) {
    console.log('ℹ️ חבילת mssql טרם הותקנה (להפעלת חיבור ישיר ל-SQL Server הרץ בטרמינל: npm install mssql).');
    console.log('💡 השרת ממשיך לפעול כרגיל עם מנגנון שמירה וניהול מקומי.');
    isConnected = false;
    return false;
  }

  console.log(`🔌 מתחבר ל-SQL Server (${dbConfig.server}:${dbConfig.port})...`);
  
  try {
    // 1. Check/create SmartStartDB
    const masterConfig = { ...dbConfig, database: 'master' };
    let masterPool = null;
    try {
      masterPool = await new sql.ConnectionPool(masterConfig).connect();
      await masterPool.request().query(`
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${dbConfig.database}')
        BEGIN
            CREATE DATABASE [${dbConfig.database}];
            PRINT 'Created Database ${dbConfig.database}';
        END
      `);
      await masterPool.close();
    } catch (masterErr) {}

    // 2. Connect to SmartStartDB
    pool = await new sql.ConnectionPool(dbConfig).connect();
    isConnected = true;
    console.log(`✅ חיבור ל-SQL Server במסד ${dbConfig.database} בוצע בהצלחה!`);

    // 3. Create Teachers table if not exists
    await pool.request().query(`
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
        PRINT 'Table Teachers initialized successfully.';
      END
    `);

    // 4. Create StudentSubmissions table if not exists
    await pool.request().query(`
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
        PRINT 'Table StudentSubmissions initialized successfully.';
      END
    `);

    // 5. Create SavedProjects table if not exists
    await pool.request().query(`
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
        PRINT 'Table SavedProjects initialized successfully.';
      END
    `);

    // 6. Create Classes table if not exists (starts empty with zero predefined classes)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Classes]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Classes] (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [className] NVARCHAR(150) NOT NULL UNIQUE,
            [createdTeacher] NVARCHAR(150) NULL,
            [classCode] NVARCHAR(100) NULL,
            [assignedTracks] NVARCHAR(MAX) NULL,
            [joinedStudents] NVARCHAR(MAX) NULL,
            [createdAt] DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table Classes initialized successfully.';
      END
      ELSE
      BEGIN
        -- Clean up any legacy default seed classes so teachers start from zero classes
        DELETE FROM [dbo].[Classes] 
        WHERE className IN (N'כיתה ז׳1', N'כיתה ז׳2', N'כיתה ח׳1', N'כיתה ח׳2', N'כיתה ט׳1', N'חוג רובוטיקה') 
          AND (classCode IS NULL OR classCode LIKE 'CLS-1' OR classCode LIKE 'CLS-2' OR classCode LIKE 'CLS-3' OR classCode LIKE 'CLS-4' OR classCode LIKE 'CLS-5' OR classCode LIKE 'CLS-6');
      END
    `);

    // 7. Create Licenses table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Licenses]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Licenses] (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [code] NVARCHAR(100) NOT NULL UNIQUE,
            [ownerType] NVARCHAR(50) NOT NULL DEFAULT 'teacher',
            [ownerName] NVARCHAR(150) NOT NULL,
            [ownerContact] NVARCHAR(150) NULL,
            [targetTrack] NVARCHAR(50) NOT NULL DEFAULT 'all',
            [maxStudents] INT NOT NULL DEFAULT 35,
            [usedCount] INT NOT NULL DEFAULT 0,
            [expiresAt] DATETIME2 NULL,
            [isActive] BIT NOT NULL DEFAULT 1,
            [notes] NVARCHAR(500) NULL,
            [createdAt] DATETIME2 DEFAULT GETDATE()
        );
        INSERT INTO [dbo].[Licenses] (code, ownerType, ownerName, targetTrack, maxStudents, expiresAt, notes)
        VALUES 
            (N'DEMO-ALL-2026', 'teacher', N'כיתת הדגמה', 'all', 100, DATEADD(year, 1, GETDATE()), N'רישיון בדיקה לכל המסלולים'),
            (N'CAR-PRO-2026', 'teacher', N'המורה שמעון - מכונית', 'car', 35, DATEADD(year, 1, GETDATE()), N'רישיון מסלול מכונית');
        PRINT 'Table Licenses initialized successfully.';
      END

      -- Custom Tracks Table (AI Created Tracks)
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomTracks' AND xtype='U')
      BEGIN
        CREATE TABLE [dbo].[CustomTracks] (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [trackId] NVARCHAR(100) NOT NULL UNIQUE,
            [title] NVARCHAR(250) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [targetBoard] NVARCHAR(50) DEFAULT 'esp32',
            [authorTeacher] NVARCHAR(150) NULL,
            [trackJson] NVARCHAR(MAX) NOT NULL,
            [createdAt] DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table CustomTracks initialized successfully.';
      END
    `);

    return true;
  } catch (err) {
    console.warn(`⚠️ שים לב: לא ניתן היה להתחבר ישירות ל-SQL Server (${err.message}).`);
    console.warn(`💡 המערכת תשתמש במנגנון גיבוי מקומי אוטומטי עד להגדרת החיבור ל-SQL Server.`);
    isConnected = false;
    return false;
  }
}

/**
 * Register Teacher
 */
async function registerTeacher({ fullName, username, password, email = '' }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanFullName = fullName.trim();

  if (isConnected && pool) {
    try {
      const checkReq = pool.request();
      checkReq.input('username', sql.NVarChar(100), cleanUsername);
      const existing = await checkReq.query(`SELECT id FROM [dbo].[Teachers] WHERE username = @username;`);
      if (existing.recordset.length > 0) {
        throw new Error('שם המשתמש כבר תפוס במערכת. אנא בחר שם משתמש אחר.');
      }

      const req = pool.request();
      req.input('fullName', sql.NVarChar(150), cleanFullName);
      req.input('username', sql.NVarChar(100), cleanUsername);
      req.input('password', sql.NVarChar(200), password);
      req.input('email', sql.NVarChar(150), email.trim());

      const result = await req.query(`
        INSERT INTO [dbo].[Teachers] (fullName, username, password, email)
        OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.username
        VALUES (@fullName, @username, @password, @email);
      `);

      return {
        id: result.recordset[0].id,
        fullName: result.recordset[0].fullName,
        username: result.recordset[0].username
      };
    } catch (err) {
      throw err;
    }
  }

  // Fallback storage
  const teachers = readFallbackTeachers();
  if (teachers.some(t => t.username.toLowerCase() === cleanUsername)) {
    throw new Error('שם המשתמש כבר תפוס במערכת. אנא בחר שם משתמש אחר.');
  }

  const newTeacher = {
    id: Date.now(),
    fullName: cleanFullName,
    username: cleanUsername,
    password,
    email: email.trim(),
    createdAt: new Date().toISOString()
  };
  teachers.push(newTeacher);
  writeFallbackTeachers(teachers);

  return {
    id: newTeacher.id,
    fullName: newTeacher.fullName,
    username: newTeacher.username
  };
}

/**
 * Login Teacher
 */
async function loginTeacher({ username, password }) {
  const cleanUsername = username.trim().toLowerCase();

  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('username', sql.NVarChar(100), cleanUsername);
      req.input('password', sql.NVarChar(200), password);

      const result = await req.query(`
        SELECT id, fullName, username, email FROM [dbo].[Teachers]
        WHERE username = @username AND password = @password;
      `);

      if (result.recordset.length > 0) {
        return result.recordset[0];
      }
      throw new Error('שם משתמש או סיסמה שגויים');
    } catch (err) {
      throw err;
    }
  }

  // Fallback login
  const teachers = readFallbackTeachers();
  const found = teachers.find(t => t.username.toLowerCase() === cleanUsername && t.password === password);
  if (found) {
    return {
      id: found.id,
      fullName: found.fullName,
      username: found.username,
      email: found.email || ''
    };
  }
  throw new Error('שם משתמש או סיסמה שגויים');
}

/**
 * Get public teachers list (for student dropdown selection)
 */
async function getTeachersList() {
  if (isConnected && pool) {
    try {
      const result = await pool.request().query(`
        SELECT id, fullName, username FROM [dbo].[Teachers] ORDER BY fullName ASC;
      `);
      return result.recordset;
    } catch (err) {}
  }

  const teachers = readFallbackTeachers();
  return teachers.map(t => ({ id: t.id, fullName: t.fullName, username: t.username }));
}

/**
 * Save new student submission
 */
async function saveSubmission({ studentName, teacherName = 'המורה שמעון', className = '', projectName, projectType = 'car', code = '', blockXml = '', notes = '' }) {
  if (isConnected && pool) {
    try {
      const request = pool.request();
      request.input('studentName', sql.NVarChar(150), studentName || 'תלמיד ללא שם');
      request.input('teacherName', sql.NVarChar(150), teacherName || 'המורה שמעון');
      request.input('className', sql.NVarChar(100), className || '');
      request.input('projectName', sql.NVarChar(150), projectName || 'פרויקט רובוט');
      request.input('projectType', sql.NVarChar(100), projectType);
      request.input('code', sql.NVarChar(sql.MAX), code);
      request.input('blockXml', sql.NVarChar(sql.MAX), blockXml);
      request.input('notes', sql.NVarChar(1000), notes || '');

      const result = await request.query(`
        INSERT INTO [dbo].[StudentSubmissions] (studentName, teacherName, className, projectName, projectType, code, blockXml, notes, status, createdAt, updatedAt)
        OUTPUT INSERTED.id, INSERTED.createdAt
        VALUES (@studentName, @teacherName, @className, @projectName, @projectType, @code, @blockXml, @notes, 'new', GETDATE(), GETDATE());
      `);

      return {
        id: result.recordset[0].id,
        studentName,
        teacherName,
        className,
        projectName,
        projectType,
        code,
        blockXml,
        notes,
        status: 'new',
        createdAt: result.recordset[0].createdAt,
        source: 'mssql'
      };
    } catch (dbErr) {
      console.error('Database insert error:', dbErr);
    }
  }

  // Fallback storage
  const list = readFallbackSubmissions();
  const newSub = {
    id: Date.now(),
    studentName: studentName || 'תלמיד ללא שם',
    teacherName: teacherName || 'המורה שמעון',
    className: className || '',
    projectName: projectName || 'פרויקט רובוט',
    projectType,
    code,
    blockXml,
    notes: notes || '',
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'local_backup'
  };
  list.unshift(newSub);
  writeFallbackSubmissions(list);
  return newSub;
}

/**
 * Get student submissions
 */
async function getSubmissions({ search = '', teacherName = '', className = '', projectType = '', status = '' } = {}) {
  if (isConnected && pool) {
    try {
      let query = `SELECT id, studentName, teacherName, className, projectName, projectType, code, blockXml, notes, status, createdAt, updatedAt FROM [dbo].[StudentSubmissions] WHERE 1=1 `;
      const request = pool.request();

      if (search) {
        request.input('search', sql.NVarChar, `%${search}%`);
        query += ` AND (studentName LIKE @search OR projectName LIKE @search OR notes LIKE @search OR className LIKE @search) `;
      }
      if (teacherName && teacherName !== 'הכל') {
        request.input('teacherName', sql.NVarChar, teacherName);
        query += ` AND teacherName = @teacherName `;
      }
      if (className && className !== 'הכל') {
        request.input('className', sql.NVarChar, className);
        query += ` AND className = @className `;
      }
      if (projectType) {
        request.input('projectType', sql.NVarChar, projectType);
        query += ` AND projectType = @projectType `;
      }
      if (status) {
        request.input('status', sql.NVarChar, status);
        query += ` AND status = @status `;
      }

      query += ` ORDER BY createdAt DESC;`;
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      console.error('Error fetching submissions from DB:', err);
    }
  }

  // Fallback filter
  let list = readFallbackSubmissions();
  if (teacherName && teacherName !== 'הכל') {
    list = list.filter(item => item.teacherName === teacherName);
  }
  if (className && className !== 'הכל') {
    list = list.filter(item => item.className === className);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(item => 
      (item.studentName && item.studentName.toLowerCase().includes(s)) ||
      (item.projectName && item.projectName.toLowerCase().includes(s)) ||
      (item.className && item.className.toLowerCase().includes(s)) ||
      (item.notes && item.notes.toLowerCase().includes(s))
    );
  }
  if (projectType) {
    list = list.filter(item => item.projectType === projectType);
  }
  if (status) {
    list = list.filter(item => item.status === status);
  }
  return list;
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(id, status) {
  if (isConnected && pool) {
    try {
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id, 10));
      request.input('status', sql.NVarChar(50), status);
      await request.query(`
        UPDATE [dbo].[StudentSubmissions]
        SET status = @status, updatedAt = GETDATE()
        WHERE id = @id;
      `);
      return true;
    } catch (err) {
      console.error('Error updating status in DB:', err);
    }
  }

  const list = readFallbackSubmissions();
  const idx = list.findIndex(i => i.id == id);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    writeFallbackSubmissions(list);
    return true;
  }
  return false;
}

/**
 * Delete submission
 */
async function deleteSubmission(id) {
  if (isConnected && pool) {
    try {
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id, 10));
      await request.query(`DELETE FROM [dbo].[StudentSubmissions] WHERE id = @id;`);
      return true;
    } catch (err) {
      console.error('Error deleting submission from DB:', err);
    }
  }

  let list = readFallbackSubmissions();
  list = list.filter(i => i.id != id);
  writeFallbackSubmissions(list);
  return true;
}

// Fallback saved projects storage
const fallbackSavedProjectsFile = path.join(__dirname, 'saved_projects_backup.json');

function readFallbackSavedProjects() {
  try {
    if (fs.existsSync(fallbackSavedProjectsFile)) {
      const data = fs.readFileSync(fallbackSavedProjectsFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}
  return [];
}

function writeFallbackSavedProjects(projects) {
  try {
    fs.writeFileSync(fallbackSavedProjectsFile, JSON.stringify(projects, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Save / Update student personal project with password
 */
async function saveStudentProject({ studentName, projectName, projectType, password, blockXml = '', code = '' }) {
  const cleanStudent = studentName.trim();
  const cleanProject = (projectName || 'פרויקט רובוטיקה').trim();
  const cleanType = projectType.trim();
  const cleanPass = password.trim();

  if (!cleanStudent || !cleanPass) {
    throw new Error('שם תלמיד וסיסמה אישית הינם שדות חובה');
  }

  if (isConnected && pool) {
    try {
      // 1. First check if student already has existing projects to verify global student password
      const userCheck = pool.request();
      userCheck.input('studentName', sql.NVarChar(150), cleanStudent);
      const userProjects = await userCheck.query(`
        SELECT TOP 1 password FROM [dbo].[SavedProjects] WHERE studentName = @studentName;
      `);

      if (userProjects.recordset.length > 0) {
        if (userProjects.recordset[0].password !== cleanPass) {
          throw new Error('הסיסמה האישית שהזנת שגויה. אנא הזן את הסיסמה שבחרת בהרשמה/שמירה ראשונה.');
        }
      }

      // 2. Check if a project with THIS projectName and projectType already exists
      const checkReq = pool.request();
      checkReq.input('studentName', sql.NVarChar(150), cleanStudent);
      checkReq.input('projectName', sql.NVarChar(150), cleanProject);
      checkReq.input('projectType', sql.NVarChar(100), cleanType);
      const existing = await checkReq.query(`
        SELECT id FROM [dbo].[SavedProjects]
        WHERE studentName = @studentName AND projectName = @projectName AND projectType = @projectType;
      `);

      if (existing.recordset.length > 0) {
        const recordId = existing.recordset[0].id;
        const updateReq = pool.request();
        updateReq.input('id', sql.Int, recordId);
        updateReq.input('blockXml', sql.NVarChar(sql.MAX), blockXml);
        updateReq.input('code', sql.NVarChar(sql.MAX), code);
        await updateReq.query(`
          UPDATE [dbo].[SavedProjects]
          SET blockXml = @blockXml, code = @code, updatedAt = GETDATE()
          WHERE id = @id;
        `);

        return { success: true, message: `הפרויקט "${cleanProject}" עודכן ונשמר בהצלחה בענן!`, id: recordId };
      }

      // 3. Otherwise insert as a new project for this student
      const insertReq = pool.request();
      insertReq.input('studentName', sql.NVarChar(150), cleanStudent);
      insertReq.input('projectName', sql.NVarChar(150), cleanProject);
      insertReq.input('projectType', sql.NVarChar(100), cleanType);
      insertReq.input('password', sql.NVarChar(200), cleanPass);
      insertReq.input('blockXml', sql.NVarChar(sql.MAX), blockXml);
      insertReq.input('code', sql.NVarChar(sql.MAX), code);

      const result = await insertReq.query(`
        INSERT INTO [dbo].[SavedProjects] (studentName, projectName, projectType, password, blockXml, code, updatedAt)
        OUTPUT INSERTED.id
        VALUES (@studentName, @projectName, @projectType, @password, @blockXml, @code, GETDATE());
      `);

      return { success: true, message: `הפרויקט "${cleanProject}" נשמר בהצלחה תחת הסיסמה האישית שלך!`, id: result.recordset[0].id };
    } catch (err) {
      throw err;
    }
  }

  // Fallback storage
  const list = readFallbackSavedProjects();
  const existingUserProj = list.find(p => p.studentName.toLowerCase() === cleanStudent.toLowerCase());
  if (existingUserProj && existingUserProj.password !== cleanPass) {
    throw new Error('הסיסמה האישית שהזנת שגויה.');
  }

  const existingIdx = list.findIndex(p => 
    p.studentName.toLowerCase() === cleanStudent.toLowerCase() && 
    p.projectName.toLowerCase() === cleanProject.toLowerCase() && 
    p.projectType === cleanType
  );

  if (existingIdx !== -1) {
    list[existingIdx].blockXml = blockXml;
    list[existingIdx].code = code;
    list[existingIdx].updatedAt = new Date().toISOString();
    writeFallbackSavedProjects(list);
    return { success: true, message: `הפרויקט "${cleanProject}" עודכן ונשמר בהצלחה!` };
  }

  const newProj = {
    id: Date.now(),
    studentName: cleanStudent,
    projectName: cleanProject,
    projectType: cleanType,
    password: cleanPass,
    blockXml,
    code,
    updatedAt: new Date().toISOString()
  };
  list.push(newProj);
  writeFallbackSavedProjects(list);
  return { success: true, message: `הפרויקט "${cleanProject}" נשמר בהצלחה תחת הסיסמה האישית שלך!` };
}

/**
 * List all saved projects of a student (requires password)
 */
async function listStudentProjects({ studentName, projectType, password }) {
  const cleanStudent = studentName.trim();
  const cleanType = (projectType || '').trim();
  const cleanPass = password.trim();

  if (!cleanStudent || !cleanPass) {
    throw new Error('שם תלמיד וסיסמה אישית הינם שדות חובה');
  }

  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('studentName', sql.NVarChar(150), cleanStudent);
      let query = `
        SELECT id, projectName, projectType, password, updatedAt
        FROM [dbo].[SavedProjects]
        WHERE studentName = @studentName
      `;
      if (cleanType) {
        req.input('projectType', sql.NVarChar(100), cleanType);
        query += ` AND projectType = @projectType `;
      }
      query += ` ORDER BY updatedAt DESC;`;

      const result = await req.query(query);
      if (result.recordset.length === 0) {
        return { success: true, projects: [] };
      }

      // Verify password
      if (result.recordset[0].password !== cleanPass) {
        throw new Error('הסיסמה האישית שהזנת שגויה');
      }

      const projects = result.recordset.map(p => ({
        id: p.id,
        projectName: p.projectName,
        projectType: p.projectType,
        updatedAt: p.updatedAt
      }));

      return { success: true, projects };
    } catch (err) {
      throw err;
    }
  }

  // Fallback storage
  const list = readFallbackSavedProjects();
  let userProjs = list.filter(p => p.studentName.toLowerCase() === cleanStudent.toLowerCase());
  if (cleanType) {
    userProjs = userProjs.filter(p => p.projectType === cleanType);
  }

  if (userProjs.length === 0) {
    return { success: true, projects: [] };
  }

  if (userProjs[0].password !== cleanPass) {
    throw new Error('הסיסמה האישית שהזנת שגויה');
  }

  const projects = userProjs.map(p => ({
    id: p.id,
    projectName: p.projectName,
    projectType: p.projectType,
    updatedAt: p.updatedAt
  }));

  return { success: true, projects };
}

/**
 * Load student personal project by ID (or by name) with password verification
 */
async function loadStudentProject({ id, studentName, projectName, projectType, password }) {
  const cleanStudent = (studentName || '').trim();
  const cleanPass = (password || '').trim();

  if (isConnected && pool) {
    try {
      const req = pool.request();
      let query = `
        SELECT id, studentName, projectName, projectType, password, blockXml, code, updatedAt
        FROM [dbo].[SavedProjects]
        WHERE 1=1
      `;
      if (id) {
        req.input('id', sql.Int, parseInt(id, 10));
        query += ` AND id = @id `;
      } else {
        req.input('studentName', sql.NVarChar(150), cleanStudent);
        query += ` AND studentName = @studentName `;
        if (projectName) {
          req.input('projectName', sql.NVarChar(150), projectName.trim());
          query += ` AND projectName = @projectName `;
        }
        if (projectType) {
          req.input('projectType', sql.NVarChar(100), projectType.trim());
          query += ` AND projectType = @projectType `;
        }
      }

      const result = await req.query(query);
      if (result.recordset.length === 0) {
        throw new Error('לא נמצא פרויקט שמור התואם לבקשה');
      }

      const project = result.recordset[0];
      if (cleanPass && project.password !== cleanPass) {
        throw new Error('הסיסמה האישית שהזנת שגויה');
      }

      return {
        success: true,
        id: project.id,
        projectName: project.projectName,
        projectType: project.projectType,
        blockXml: project.blockXml,
        code: project.code,
        updatedAt: project.updatedAt
      };
    } catch (err) {
      throw err;
    }
  }

  // Fallback loading
  const list = readFallbackSavedProjects();
  let found = null;
  if (id) {
    found = list.find(p => p.id == id);
  } else {
    found = list.find(p => 
      p.studentName.toLowerCase() === cleanStudent.toLowerCase() && 
      (!projectType || p.projectType === projectType) &&
      (!projectName || p.projectName.toLowerCase() === projectName.trim().toLowerCase())
    );
  }

  if (!found) {
    throw new Error('לא נמצא פרויקט שמור התואם לבקשה');
  }
  if (cleanPass && found.password !== cleanPass) {
    throw new Error('הסיסמה האישית שהזנת שגויה');
  }

  return {
    success: true,
    id: found.id,
    projectName: found.projectName,
    projectType: found.projectType,
    blockXml: found.blockXml,
    code: found.code,
    updatedAt: found.updatedAt
  };
}

/**
 * Delete a student saved project
 */
async function deleteStudentProject({ id, studentName, password }) {
  if (isConnected && pool) {
    try {
      const checkReq = pool.request();
      checkReq.input('id', sql.Int, parseInt(id, 10));
      const res = await checkReq.query(`SELECT password FROM [dbo].[SavedProjects] WHERE id = @id;`);
      if (res.recordset.length === 0) return true;
      if (password && res.recordset[0].password !== password.trim()) {
        throw new Error('סיסמה שגויה למחיקת פרויקט זה');
      }

      const delReq = pool.request();
      delReq.input('id', sql.Int, parseInt(id, 10));
      await delReq.query(`DELETE FROM [dbo].[SavedProjects] WHERE id = @id;`);
      return true;
    } catch (err) {
      throw err;
    }
  }

  const list = readFallbackSavedProjects();
  const found = list.find(p => p.id == id);
  if (found && password && found.password !== password.trim()) {
    throw new Error('סיסמה שגויה למחיקת פרויקט זה');
  }
  const filtered = list.filter(p => p.id != id);
  writeFallbackSavedProjects(filtered);
  return true;
}

// Fallback classes storage
const fallbackClassesFile = path.join(__dirname, 'classes_backup.json');

const DEFAULT_PRESET_CLASSES = [];

function readFallbackClasses() {
  try {
    if (fs.existsSync(fallbackClassesFile)) {
      const data = fs.readFileSync(fallbackClassesFile, 'utf8');
      const parsed = JSON.parse(data || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function writeFallbackClasses(classes) {
  try {
    fs.writeFileSync(fallbackClassesFile, JSON.stringify(classes, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Helper to generate random clean 6-character class code
 */
function generateClassCode(prefix = 'SMART') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let numPart = '';
  for (let i = 0; i < 4; i++) {
    numPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${numPart}`;
}

/**
 * Get list of all classes
 */
async function getClassesList(teacherName = '') {
  if (isConnected && pool) {
    try {
      try {
        await pool.request().query(`
          DELETE FROM [dbo].[Classes] 
          WHERE className IN (N'כיתה ז׳1', N'כיתה ז׳2', N'כיתה ח׳1', N'כיתה ח׳2', N'כיתה ט׳1', N'חוג רובוטיקה') 
            AND (classCode IS NULL OR classCode LIKE 'CLS-1' OR classCode LIKE 'CLS-2' OR classCode LIKE 'CLS-3' OR classCode LIKE 'CLS-4' OR classCode LIKE 'CLS-5' OR classCode LIKE 'CLS-6');
        `);
      } catch (cleanErr) {}

      let query = `
        SELECT id, className, classCode, createdTeacher, assignedTracks, createdAt
        FROM [dbo].[Classes]
      `;
      if (teacherName) {
        query += ` WHERE createdTeacher = @teacherName`;
      }
      query += ` ORDER BY className ASC;`;

      const req = pool.request();
      if (teacherName) req.input('teacherName', sql.NVarChar(150), teacherName);
      const result = await req.query(query);
      return (result.recordset || []).map(c => ({
        ...c,
        assignedTracks: typeof c.assignedTracks === 'string' ? JSON.parse(c.assignedTracks || '["car"]') : (c.assignedTracks || ['car'])
      }));
    } catch (err) {
      console.error('Error fetching classes from DB:', err);
    }
  }

  let list = readFallbackClasses();
  if (teacherName) {
    list = list.filter(c => !c.createdTeacher || c.createdTeacher === teacherName);
  }
  return list;
}

/**
 * Create a new class with assigned track(s) and auto-generated unique class code
 */
async function createClass({ className, createdTeacher = '', classCode = '', assignedTracks = ['car'] }) {
  const cleanName = (className || '').trim();
  if (!cleanName) {
    throw new Error('שם הכיתה הינו שדה חובה');
  }

  let finalCode = (classCode || '').trim().toUpperCase();
  if (!finalCode) {
    finalCode = generateClassCode('CLS');
  }

  const tracksArray = Array.isArray(assignedTracks) && assignedTracks.length > 0 ? assignedTracks : ['car'];
  const tracksJson = JSON.stringify(tracksArray);

  if (isConnected && pool) {
    try {
      const checkReq = pool.request();
      checkReq.input('className', sql.NVarChar(150), cleanName);
      const existing = await checkReq.query(`SELECT id FROM [dbo].[Classes] WHERE className = @className;`);
      if (existing.recordset.length > 0) {
        throw new Error(`כיתה בשם "${cleanName}" כבר קיימת במערכת`);
      }

      const insertReq = pool.request();
      insertReq.input('className', sql.NVarChar(150), cleanName);
      insertReq.input('classCode', sql.NVarChar(50), finalCode);
      insertReq.input('createdTeacher', sql.NVarChar(150), createdTeacher || 'מורה');
      insertReq.input('assignedTracks', sql.NVarChar(sql.MAX), tracksJson);
      
      const res = await insertReq.query(`
        INSERT INTO [dbo].[Classes] (className, classCode, createdTeacher, assignedTracks, createdAt)
        OUTPUT INSERTED.id, INSERTED.className, INSERTED.classCode, INSERTED.createdTeacher, INSERTED.assignedTracks, INSERTED.createdAt
        VALUES (@className, @classCode, @createdTeacher, @assignedTracks, GETDATE());
      `);

      const created = res.recordset[0];
      return { 
        success: true, 
        classItem: {
          ...created,
          assignedTracks: tracksArray
        }
      };
    } catch (err) {
      // If table doesn't have classCode/assignedTracks column yet, fallback to JSON or rethrow
      console.error('DB error on createClass, using fallback:', err.message);
    }
  }

  const list = readFallbackClasses();
  if (list.some(c => c.className.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`כיתה בשם "${cleanName}" כבר קיימת במערכת`);
  }

  // Ensure unique code in fallback
  while (list.some(c => c.classCode === finalCode)) {
    finalCode = generateClassCode('CLS');
  }

  const newClass = {
    id: Date.now(),
    className: cleanName,
    classCode: finalCode,
    createdTeacher: createdTeacher || 'מורה',
    assignedTracks: tracksArray,
    joinedStudents: [],
    createdAt: new Date().toISOString()
  };

  list.push(newClass);
  writeFallbackClasses(list);
  return { success: true, classItem: newClass };
}

/**
 * Delete a class
 */
async function deleteClass(id) {
  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('id', sql.Int, parseInt(id, 10));
      await req.query(`DELETE FROM [dbo].[Classes] WHERE id = @id;`);
      return true;
    } catch (err) {
      console.error('Error deleting class from DB:', err);
    }
  }

  let list = readFallbackClasses();
  list = list.filter(c => c.id != id);
  writeFallbackClasses(list);
  return true;
}

/**
 * Student Class Login (Validates Class Code + Student Name)
 */
async function studentClassLogin({ classCode, studentName }) {
  const cleanCode = (classCode || '').trim().toUpperCase();
  const cleanStudent = (studentName || '').trim();

  if (!cleanCode) {
    throw new Error('נא להזין קוד כיתה');
  }
  if (!cleanStudent) {
    throw new Error('נא להזין את שם התלמיד');
  }

  // 1. Search in Classes first
  const classes = readFallbackClasses();
  const foundClass = classes.find(c => (c.classCode && c.classCode.toUpperCase() === cleanCode) || (c.className && c.className.toUpperCase() === cleanCode));

  if (foundClass) {
    if (!foundClass.joinedStudents) foundClass.joinedStudents = [];
    if (!foundClass.joinedStudents.some(s => s.name === cleanStudent)) {
      foundClass.joinedStudents.push({ name: cleanStudent, joinedAt: new Date().toISOString() });
      writeFallbackClasses(classes);
    }

    const assignedTracks = foundClass.assignedTracks && foundClass.assignedTracks.length > 0
      ? foundClass.assignedTracks
      : ['car'];

    return {
      success: true,
      type: 'class',
      student: {
        studentName: cleanStudent,
        classCode: foundClass.classCode || cleanCode,
        className: foundClass.className,
        teacherName: foundClass.createdTeacher || 'המורה',
        assignedTracks
      },
      message: `ברוך הבא ${cleanStudent}! התחברת בהצלחה לכיתה ${foundClass.className}`
    };
  }

  // 2. Search in Licenses
  try {
    const licResult = await validateLicenseCode({ code: cleanCode, studentName: cleanStudent });
    if (licResult && licResult.success) {
      const target = licResult.license.targetTrack;
      const assignedTracks = target === 'all' 
        ? ['car', 'turtle', 'house', 'builder'] 
        : [target];

      return {
        success: true,
        type: 'license',
        student: {
          studentName: cleanStudent,
          classCode: cleanCode,
          className: licResult.license.ownerName || 'כיתת רובוטיקה',
          teacherName: licResult.license.ownerName || 'המורה',
          assignedTracks
        },
        message: `ברוך הבא ${cleanStudent}! הרישיון אומת בהצלחה`
      };
    }
  } catch (err) {
    throw new Error(`קוד הכיתה "${cleanCode}" אינו קיים במערכת. אנא ודא שהזנת את הקוד המדויק שקיבלת מהמורה.`);
  }

  throw new Error(`קוד הכיתה "${cleanCode}" אינו קיים במערכת. אנא ודא שהזנת את הקוד המדויק שקיבלת מהמורה.`);
}

// ==========================================
// 🔑 LICENSES & SUBSCRIPTIONS SYSTEM
// ==========================================

const fallbackLicensesFile = path.join(__dirname, 'licenses_backup.json');

const DEFAULT_PRESET_LICENSES = [
  {
    id: 1,
    code: 'DEMO-ALL-2026',
    ownerType: 'teacher',
    ownerName: 'כיתת הדגמה',
    ownerContact: '',
    targetTrack: 'all',
    maxStudents: 100,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    notes: 'רישיון בדיקה לכל המסלולים',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'CAR-PRO-2026',
    ownerType: 'teacher',
    ownerName: 'המורה שמעון - מכונית',
    ownerContact: '',
    targetTrack: 'car',
    maxStudents: 35,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    notes: 'רישיון מסלול מכונית',
    createdAt: new Date().toISOString()
  }
];

function readFallbackLicenses() {
  try {
    if (fs.existsSync(fallbackLicensesFile)) {
      const data = fs.readFileSync(fallbackLicensesFile, 'utf8');
      const parsed = JSON.parse(data || '[]');
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_PRESET_LICENSES;
}

function writeFallbackLicenses(licenses) {
  try {
    fs.writeFileSync(fallbackLicensesFile, JSON.stringify(licenses, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Validate a License or Class Code
 */
async function validateLicenseCode({ code, studentName = '', projectType = '' }) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    throw new Error('נא להזין קוד כיתה או רישיון');
  }

  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('code', sql.NVarChar(100), cleanCode);
      const res = await req.query(`
        SELECT id, code, ownerType, ownerName, targetTrack, maxStudents, usedCount, expiresAt, isActive, notes
        FROM [dbo].[Licenses]
        WHERE UPPER(code) = @code;
      `);

      if (res.recordset.length === 0) {
        throw new Error('קוד הרישיון או קוד הכיתה אינו קיים במערכת');
      }

      const lic = res.recordset[0];
      if (!lic.isActive) {
        throw new Error('רישיון זה הושעה או בוטל על ידי מנהל המערכת');
      }

      if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) {
        throw new Error('תוקף הרישיון פג. אנא פנה למורה או למנהל המערכת');
      }

      // Check track match if specific
      if (projectType && lic.targetTrack !== 'all' && lic.targetTrack !== projectType) {
        throw new Error(`רישיון זה תקף למסלול "${lic.targetTrack}" בלבד, ולא למסלול הנוכחי`);
      }

      // Increment used count
      try {
        const incReq = pool.request();
        incReq.input('id', sql.Int, lic.id);
        await incReq.query(`UPDATE [dbo].[Licenses] SET usedCount = usedCount + 1 WHERE id = @id;`);
      } catch (e) {}

      return {
        success: true,
        license: {
          code: lic.code,
          ownerName: lic.ownerName,
          ownerType: lic.ownerType,
          targetTrack: lic.targetTrack,
          expiresAt: lic.expiresAt
        }
      };
    } catch (err) {
      throw err;
    }
  }

  // Fallback
  const list = readFallbackLicenses();
  const found = list.find(l => l.code.toUpperCase() === cleanCode);
  if (!found) {
    throw new Error('קוד הרישיון או קוד הכיתה אינו קיים במערכת');
  }
  if (!found.isActive) {
    throw new Error('רישיון זה הושעה או בוטל על ידי מנהל המערכת');
  }
  if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
    throw new Error('תוקף הרישיון פג. אנא פנה למורה או למנהל המערכת');
  }
  if (projectType && found.targetTrack !== 'all' && found.targetTrack !== projectType) {
    throw new Error(`רישיון זה תקף למסלול "${found.targetTrack}" בלבד`);
  }

  found.usedCount = (found.usedCount || 0) + 1;
  writeFallbackLicenses(list);

  return {
    success: true,
    license: {
      code: found.code,
      ownerName: found.ownerName,
      ownerType: found.ownerType,
      targetTrack: found.targetTrack,
      expiresAt: found.expiresAt
    }
  };
}

/**
 * Generate a new License / Class Code (Admin only)
 */
async function generateLicense({ 
  code = '', 
  ownerType = 'teacher', 
  ownerName, 
  ownerContact = '', 
  targetTrack = 'all', 
  maxStudents = 35, 
  expiresInDays = 365,
  notes = ''
}) {
  const cleanOwner = (ownerName || '').trim();
  if (!cleanOwner) {
    throw new Error('שם בעל הרישיון / המורה הינו שדה חובה');
  }

  // Generate unique code if not provided
  let finalCode = (code || '').trim().toUpperCase();
  if (!finalCode) {
    const prefix = targetTrack === 'all' ? 'SMART' : targetTrack.toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    finalCode = `${prefix}-${rand}-2026`;
  }

  const expiresAt = expiresInDays > 0 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  if (isConnected && pool) {
    try {
      const checkReq = pool.request();
      checkReq.input('code', sql.NVarChar(100), finalCode);
      const existing = await checkReq.query(`SELECT id FROM [dbo].[Licenses] WHERE code = @code;`);
      if (existing.recordset.length > 0) {
        throw new Error(`קוד רישיון "${finalCode}" כבר קיים במערכת`);
      }

      const req = pool.request();
      req.input('code', sql.NVarChar(100), finalCode);
      req.input('ownerType', sql.NVarChar(50), ownerType);
      req.input('ownerName', sql.NVarChar(150), cleanOwner);
      req.input('ownerContact', sql.NVarChar(150), ownerContact);
      req.input('targetTrack', sql.NVarChar(50), targetTrack);
      req.input('maxStudents', sql.Int, parseInt(maxStudents, 10) || 35);
      req.input('expiresAt', sql.DateTime2, expiresAt ? new Date(expiresAt) : null);
      req.input('notes', sql.NVarChar(500), notes);

      const res = await req.query(`
        INSERT INTO [dbo].[Licenses] (code, ownerType, ownerName, ownerContact, targetTrack, maxStudents, expiresAt, notes, createdAt)
        OUTPUT INSERTED.*
        VALUES (@code, @ownerType, @ownerName, @ownerContact, @targetTrack, @maxStudents, @expiresAt, @notes, GETDATE());
      `);

      return { success: true, license: res.recordset[0] };
    } catch (err) {
      throw err;
    }
  }

  const list = readFallbackLicenses();
  if (list.some(l => l.code.toUpperCase() === finalCode)) {
    throw new Error(`קוד רישיון "${finalCode}" כבר קיים במערכת`);
  }

  const newLic = {
    id: Date.now(),
    code: finalCode,
    ownerType,
    ownerName: cleanOwner,
    ownerContact,
    targetTrack,
    maxStudents: parseInt(maxStudents, 10) || 35,
    usedCount: 0,
    expiresAt,
    isActive: true,
    notes,
    createdAt: new Date().toISOString()
  };
  list.unshift(newLic);
  writeFallbackLicenses(list);
  return { success: true, license: newLic };
}

/**
 * Get all Licenses (Admin only)
 */
async function getAllLicenses() {
  if (isConnected && pool) {
    try {
      const res = await pool.request().query(`
        SELECT id, code, ownerType, ownerName, ownerContact, targetTrack, maxStudents, usedCount, expiresAt, isActive, notes, createdAt
        FROM [dbo].[Licenses]
        ORDER BY createdAt DESC;
      `);
      return res.recordset;
    } catch (err) {
      console.error('Error fetching licenses from DB:', err);
    }
  }
  return readFallbackLicenses();
}

/**
 * Delete a License
 */
async function deleteLicense(id) {
  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('id', sql.Int, parseInt(id, 10));
      await req.query(`DELETE FROM [dbo].[Licenses] WHERE id = @id;`);
      return true;
    } catch (err) {
      console.error('Error deleting license from DB:', err);
    }
  }

  let list = readFallbackLicenses();
  list = list.filter(l => l.id != id);
  writeFallbackLicenses(list);
  return true;
}

/**
 * Save or Update a Custom AI-Generated Track
 */
async function saveCustomTrack(trackData) {
  const trackId = trackData.id || trackData.trackId || `custom_${Date.now()}`;
  const title = (trackData.title || 'מסלול למידה אישי').trim();
  const description = (trackData.description || '').trim();
  const targetBoard = trackData.targetBoard || 'esp32';
  const authorTeacher = (trackData.authorTeacher || trackData.author || '').trim();
  const trackJson = typeof trackData === 'string' ? trackData : JSON.stringify(trackData);

  if (isConnected && pool) {
    try {
      const checkReq = pool.request();
      checkReq.input('trackId', sql.NVarChar(100), trackId);
      const existing = await checkReq.query(`SELECT id FROM [dbo].[CustomTracks] WHERE trackId = @trackId;`);

      if (existing.recordset.length > 0) {
        const updateReq = pool.request();
        updateReq.input('trackId', sql.NVarChar(100), trackId);
        updateReq.input('title', sql.NVarChar(250), title);
        updateReq.input('description', sql.NVarChar(sql.MAX), description);
        updateReq.input('targetBoard', sql.NVarChar(50), targetBoard);
        updateReq.input('authorTeacher', sql.NVarChar(150), authorTeacher);
        updateReq.input('trackJson', sql.NVarChar(sql.MAX), trackJson);

        await updateReq.query(`
          UPDATE [dbo].[CustomTracks]
          SET title = @title, description = @description, targetBoard = @targetBoard, authorTeacher = @authorTeacher, trackJson = @trackJson
          WHERE trackId = @trackId;
        `);
      } else {
        const insertReq = pool.request();
        insertReq.input('trackId', sql.NVarChar(100), trackId);
        insertReq.input('title', sql.NVarChar(250), title);
        insertReq.input('description', sql.NVarChar(sql.MAX), description);
        insertReq.input('targetBoard', sql.NVarChar(50), targetBoard);
        insertReq.input('authorTeacher', sql.NVarChar(150), authorTeacher);
        insertReq.input('trackJson', sql.NVarChar(sql.MAX), trackJson);

        await insertReq.query(`
          INSERT INTO [dbo].[CustomTracks] (trackId, title, description, targetBoard, authorTeacher, trackJson)
          VALUES (@trackId, @title, @description, @targetBoard, @authorTeacher, @trackJson);
        `);
      }
      return { success: true, trackId, title };
    } catch (err) {
      console.error('Error saving custom track to DB:', err);
    }
  }

  // Fallback file storage
  let list = readFallbackCustomTracks();
  const idx = list.findIndex(t => (t.id === trackId || t.trackId === trackId));
  const fullTrackObj = typeof trackData === 'object' ? { ...trackData, id: trackId, trackId } : JSON.parse(trackJson);
  if (idx >= 0) {
    list[idx] = fullTrackObj;
  } else {
    list.unshift(fullTrackObj);
  }
  writeFallbackCustomTracks(list);
  return { success: true, trackId, title };
}

/**
 * Get all Custom Tracks list
 */
async function getCustomTracksList() {
  if (isConnected && pool) {
    try {
      const res = await pool.request().query(`
        SELECT id, trackId, title, description, targetBoard, authorTeacher, trackJson, createdAt
        FROM [dbo].[CustomTracks]
        ORDER BY createdAt DESC;
      `);
      return res.recordset.map(row => {
        try {
          const parsed = JSON.parse(row.trackJson);
          return {
            ...parsed,
            id: row.trackId || parsed.id,
            trackId: row.trackId || parsed.id,
            dbId: row.id,
            title: row.title || parsed.title,
            description: row.description || parsed.description,
            targetBoard: row.targetBoard || parsed.targetBoard,
            authorTeacher: row.authorTeacher || parsed.authorTeacher,
            createdAt: row.createdAt
          };
        } catch (e) {
          return row;
        }
      });
    } catch (err) {
      console.error('Error fetching custom tracks from DB:', err);
    }
  }
  return readFallbackCustomTracks();
}

/**
 * Get single Custom Track by ID
 */
async function getCustomTrackById(trackId) {
  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('trackId', sql.NVarChar(100), trackId);
      const res = await req.query(`
        SELECT id, trackId, title, description, targetBoard, authorTeacher, trackJson, createdAt
        FROM [dbo].[CustomTracks]
        WHERE trackId = @trackId;
      `);
      if (res.recordset.length > 0) {
        const row = res.recordset[0];
        try {
          return JSON.parse(row.trackJson);
        } catch (e) {
          return row;
        }
      }
    } catch (err) {
      console.error('Error fetching custom track by ID from DB:', err);
    }
  }

  const list = readFallbackCustomTracks();
  return list.find(t => t.id === trackId || t.trackId === trackId) || null;
}

/**
 * Delete a Custom Track
 */
async function deleteCustomTrack(trackId) {
  const cleanId = String(trackId || '').trim();
  if (!cleanId) return false;

  // 1. Always delete from SQL Server if connected
  if (isConnected && pool) {
    try {
      const req = pool.request();
      req.input('trackId', sql.NVarChar(100), cleanId);
      await req.query(`DELETE FROM [dbo].[CustomTracks] WHERE trackId = @trackId OR CAST(id AS NVARCHAR) = @trackId;`);
      console.log(`[DB] Custom track ${cleanId} deleted from SQL Server successfully.`);
    } catch (err) {
      console.error('Error deleting custom track from DB:', err);
    }
  }

  // 2. Always delete from fallback JSON backup file as well
  let list = readFallbackCustomTracks();
  const initialLen = list.length;
  list = list.filter(t => {
    const tId = String(t.id || t.trackId || '').trim();
    const trkId = String(t.trackId || t.id || '').trim();
    return tId !== cleanId && trkId !== cleanId;
  });
  writeFallbackCustomTracks(list);
  console.log(`[DB] Custom track ${cleanId} deleted from backup JSON (went from ${initialLen} to ${list.length} tracks).`);
  return true;
}

module.exports = {
  initDatabase,
  registerTeacher,
  loginTeacher,
  getTeachersList,
  getClassesList,
  createClass,
  deleteClass,
  saveSubmission,
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  saveStudentProject,
  listStudentProjects,
  loadStudentProject,
  deleteStudentProject,
  validateLicenseCode,
  studentClassLogin,
  generateLicense,
  getAllLicenses,
  deleteLicense,
  saveCustomTrack,
  getCustomTracksList,
  getCustomTrackById,
  deleteCustomTrack,
  isDbConnected: () => isConnected
};
