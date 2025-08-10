const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// נתיב ל־`arduino-cli.exe` שלך
const arduinoCliPath = `"C:\\Users\\shimo\\arduino-cli.exe"`;

// תיקייה קבועה לאחסון זמני
const tempDir = path.join(__dirname, 'arduino_temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.post('/compile', (req, res) => {
  const { code } = req.body;

  // יצירת תיקייה ייחודית לכל קבצי המשתמש
  const runId = uuidv4();
  const projectPath = path.join(tempDir, runId);
  fs.mkdirSync(projectPath, { recursive: true });

  // שמירת הקוד לקובץ `.ino` בתיקיה החדשה
  const sketchPath = path.join(projectPath, 'main.ino');
  fs.writeFileSync(sketchPath, code, 'utf8');
 console.log(sketchPath);
  // הרצת הקומפילציה על התיקייה שכוללת את הקובץ
  const cmd = `${arduinoCliPath} compile --fqbn "arduino:avr:uno" --build-path "${sketchPath}" `;
  console.log('קובץ קיים:', fs.existsSync(path.join(projectPath, 'sketch.ino')));
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      res.json({ output: stderr || 'שגיאת הקומפילציה' });
    } else {
      res.json({ output: stdout });
    }
    // אפשר למחוק את התיקייה כאן אם תרצה
    // fs.rmdirSync(projectPath, { recursive: true });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`שרת כולל Arduino פועל על PORT ${PORT}`);
});