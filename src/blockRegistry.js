import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// =============================================================
// CENTRAL DYNAMIC BLOCK REGISTRY ENGINE (5 CORE STRUCTURAL TYPES)
// =============================================================

// Pre-defined System Custom Blocks Registry
export const SYSTEM_CUSTOM_BLOCKS = [
  {
    id: 'motion_sensor_function',
    name: '🚶 קרא חיישן תנועה (PIR)',
    type: 'value_input',
    color: '#4338ca',
    inputLabel: 'מספר פורט',
    tooltip: 'מחזיר אמת (True) אם זוהתה תנועה בחיישן',
    code: 'digitalRead(PORT_PIN) == HIGH',
    category: 'חיישנים',
    language: 'C++ / Arduino'
  },
  {
    id: 'sensor_display_multi',
    name: '📊 הצגת נתוני חיישנים',
    type: 'multi_input',
    color: '#059669',
    inputLinesCount: 4,
    tooltip: 'מציג נתוני 4 חיישנים במסך',
    code: 'displaySensorData(val1, val2, val3, val4);\n',
    category: 'תצוגה',
    language: 'C++ / Arduino'
  },
  {
    id: 'temp_check_function_def',
    name: '⚙️ פונקציה: בדיקת טמפרטורה',
    type: 'function_def',
    color: '#7e22ce',
    tooltip: 'מגדיר פונקציית בדיקת טמפרטורה',
    code: 'void checkTemperature() {\n{STACK}}\n',
    category: 'פונקציות',
    language: 'C++ / Arduino'
  },
  {
    id: 'temp_check_function_call',
    name: '📞 קריאה לפונקציה: בדיקת טמפרטורה',
    type: 'function_call',
    color: '#9333ea',
    tooltip: 'מפעיל את פונקציית בדיקת הטמפרטורה',
    code: 'checkTemperature();\n',
    category: 'פונקציות',
    language: 'C++ / Arduino'
  },
  {
    id: 'html_image_upload',
    name: '🖼️ העלאת תמונה (HTML)',
    type: 'statement',
    color: '#ea580c',
    tooltip: 'יוצר רכיב העלאת תמונה ב-HTML',
    code: '<input type="file" id="imageUpload" accept="image/*" />',
    category: 'HTML / Web',
    language: 'HTML / CSS'
  }
];

// Helper to Get All Combined Blocks
export function getAllRegisteredBlocks() {
  let customBlocks = [];
  try {
    const saved = localStorage.getItem('userCustomBlocks');
    if (saved) {
      customBlocks = JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse userCustomBlocks:', err);
  }

  const map = new Map();
  SYSTEM_CUSTOM_BLOCKS.forEach(b => map.set(b.id, b));
  customBlocks.forEach(b => map.set(b.id, b));

  return Array.from(map.values());
}

// Helper to Add a New Custom Block to LocalStorage & Registry
export function addBlockToRegistry(newBlock) {
  const allCurrent = getAllRegisteredBlocks();
  const existsIndex = allCurrent.findIndex(b => b.id === newBlock.id);
  if (existsIndex >= 0) {
    allCurrent[existsIndex] = newBlock;
  } else {
    allCurrent.push(newBlock);
  }

  try {
    localStorage.setItem('userCustomBlocks', JSON.stringify(allCurrent));
  } catch (err) {
    console.error('Failed to save to userCustomBlocks:', err);
  }

  registerSingleBlock(newBlock);
}

// Helper to generate dynamic categories for user-created projects/blocks
export function getDynamicProjectCategories() {
  const blocks = getAllRegisteredBlocks();
  const projectMap = new Map();
  const UNWANTED_CATS = ['חיישנים', 'תצוגה', 'פונקציות', 'HTML / Web', 'HTML / CSS', 'Java', 'Python', 'C++ / Arduino', 'בית חכם', 'כללי', 'מנועים'];

  blocks.forEach(b => {
    const categoryName = b.project || b.category || '🧩 בלוקים אישיים';
    
    if (UNWANTED_CATS.includes(categoryName)) {
      return;
    }

    if (!projectMap.has(categoryName)) {
      projectMap.set(categoryName, {
        colour: b.color || '#4f46e5',
        blocks: []
      });
    }
    projectMap.get(categoryName).blocks.push(b);
  });

  const categories = [];
  projectMap.forEach((data, catName) => {
    if (data.blocks.length > 0) {
      categories.push({
        kind: 'category',
        name: catName,
        colour: data.colour,
        contents: data.blocks.map(b => ({ kind: 'block', type: b.id }))
      });
    }
  });

  return categories;
}

// Register Fallback Block Handler for Unknown / System Blocks
export function registerFallbackBlock(blockId) {
  if (!Blockly.Blocks[blockId]) {
    Blockly.Blocks[blockId] = {
      init: function() {
        this.appendDummyInput()
            .appendField(blockId);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#4f46e5');
      }
    };
    const fallbackGen = function() { return `// ${blockId}\n`; };
    javascriptGenerator.forBlock[blockId] = fallbackGen;
    javascriptGenerator[blockId] = fallbackGen;
  }
}

// Single Block Registrar supporting 5 Structural Categories & Inputs
export function registerSingleBlock(blockData) {
  if (!blockData || !blockData.id) return;
  const safeId = blockData.id;

  try {
    Blockly.Blocks[safeId] = {
      init: function() {
        const dummyInput = this.appendDummyInput()
            .appendField(blockData.name || 'בלוק מותאם');

        if (blockData.hasFieldInput) {
          dummyInput.appendField(
            new Blockly.FieldTextInput(blockData.fieldDefault || "100"), 
            "FIELD_VAL"
          );
        }

        if (blockData.type === 'value_input' || blockData.hasValueInput) {
          this.appendValueInput("PORT_INPUT")
              .setCheck(null)
              .appendField(blockData.inputLabel || "מספר פורט:");
          this.setOutput(true, null);
        }
        else if (blockData.type === 'multi_input') {
          const lines = blockData.inputLinesCount || 4;
          for (let i = 1; i <= lines; i++) {
            this.appendValueInput(`LINE_${i}`)
                .appendField(`תווית ${i}`);
          }
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        }
        else if (blockData.type === 'function_def' || blockData.type === 'container') {
          this.appendStatementInput("STACK")
              .appendField("בלוקים / בצע:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        }
        else if (blockData.type === 'function_call') {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        }
        else if (blockData.type === 'value') {
          this.setOutput(true, null);
        }
        else {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        }

        this.setColour(blockData.color || '#4f46e5');
        this.setTooltip(blockData.tooltip || '');
      }
    };

    const genFunc = function(block) {
      let codeStr = blockData.code || '// Custom block\n';

      if (blockData.hasFieldInput) {
        const fieldValue = block.getFieldValue('FIELD_VAL') || blockData.fieldDefault || '100';
        codeStr = codeStr.replace(/{FIELD_VAL}/g, fieldValue);
      }

      if (blockData.type === 'function_def' || blockData.type === 'container') {
        const innerCode = javascriptGenerator.statementToCode(block, 'STACK');
        codeStr = codeStr.replace(/{STACK}/g, innerCode);
      }

      return (blockData.type === 'value' || blockData.type === 'value_input')
        ? [codeStr, javascriptGenerator.ORDER_ATOMIC]
        : codeStr.endsWith('\n') ? codeStr : codeStr + '\n';
    };

    javascriptGenerator.forBlock[safeId] = genFunc;
    javascriptGenerator[safeId] = genFunc;
  } catch (err) {
    console.error(`Error registering block ${safeId}:`, err);
  }
}

// Explicit Registration of Core Arduino & Robot System Blocks
function registerSystemCoreBlocks() {
  // 1. Arduino Main Container (infinite_loop)
  Blockly.Blocks['infinite_loop'] = {
    init: function() {
      this.appendDummyInput().appendField("Arduino Code");
      this.appendStatementInput("SETUP").appendField("פעם אחת");
      this.appendStatementInput("LOOP").appendField("לעולמים");
      this.setColour('#8bb032');
    }
  };
  const loopGen = function(block) {
    const setup = javascriptGenerator.statementToCode(block, 'SETUP');
    const loop = javascriptGenerator.statementToCode(block, 'LOOP');
    return `// Setup Code\nvoid setup() {\n${setup}}\n\n// Loop Code\nvoid loop() {\n${loop}}\n`;
  };
  javascriptGenerator.forBlock['infinite_loop'] = loopGen;
  javascriptGenerator['infinite_loop'] = loopGen;

  // 2. Multi Sensor Display Block (sensor_display_multi)
  Blockly.Blocks['sensor_display_multi'] = {
    init: function() {
      this.appendDummyInput().appendField("📊 הצגת נתוני חיישנים");
      this.appendValueInput("LINE_1").appendField("תווית 1 / חיישן אור");
      this.appendValueInput("LINE_2").appendField("תווית 2 / חיישן גז");
      this.appendValueInput("LINE_3").appendField("תווית 3 / חיישן טמפרטורה");
      this.appendValueInput("LINE_4").appendField("תווית 4");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#059669');
    }
  };
  const sensorDisplayGen = function(block) {
    const line1 = javascriptGenerator.valueToCode(block, 'LINE_1', javascriptGenerator.ORDER_ATOMIC) || '0';
    const line2 = javascriptGenerator.valueToCode(block, 'LINE_2', javascriptGenerator.ORDER_ATOMIC) || '0';
    const line3 = javascriptGenerator.valueToCode(block, 'LINE_3', javascriptGenerator.ORDER_ATOMIC) || '0';
    const line4 = javascriptGenerator.valueToCode(block, 'LINE_4', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `displaySensorData(${line1}, ${line2}, ${line3}, ${line4});\n`;
  };
  javascriptGenerator.forBlock['sensor_display_multi'] = sensorDisplayGen;
  javascriptGenerator['sensor_display_multi'] = sensorDisplayGen;

  // 3. Robot Motion Blocks
  Blockly.Blocks['robot_apply_current_direction'] = {
    init: function() {
      this.appendDummyInput().appendField("🤖 הפעל תנועת רובוט לכיוון הנוכחי");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2563eb');
    }
  };
  const robotApplyGen = function() { return 'robotApplyCurrentDirection();\n'; };
  javascriptGenerator.forBlock['robot_apply_current_direction'] = robotApplyGen;
  javascriptGenerator['robot_apply_current_direction'] = robotApplyGen;

  Blockly.Blocks['robot_infinite_loop'] = {
    init: function() {
      this.appendDummyInput().appendField("🔁 לולאת רובוט אינסופית");
      this.appendStatementInput("STACK").appendField("בצע ברצף:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#1d4ed8');
    }
  };
  const robotLoopGen = function(block) {
    const branch = javascriptGenerator.statementToCode(block, 'STACK');
    return `while(true) {\n${branch}}\n`;
  };
  javascriptGenerator.forBlock['robot_infinite_loop'] = robotLoopGen;
  javascriptGenerator['robot_infinite_loop'] = robotLoopGen;

  // 3.5. WiFi & Firebase Defines Block (can be placed in top GLOBALS slot above setup)
  Blockly.Blocks['firebase_wifi_defines'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🔥 הגדרות רשת ו-Firebase (#define)");
      this.appendDummyInput()
          .appendField("SSID:")
          .appendField(new Blockly.FieldTextInput("bamaale-teacher"), "SSID");
      this.appendDummyInput()
          .appendField("PASS:")
          .appendField(new Blockly.FieldTextInput("OrtMala2025"), "PASS");
      this.appendDummyInput()
          .appendField("URL:")
          .appendField(new Blockly.FieldTextInput("edorobot-e9cb1-default-rtdb.firebaseio.com"), "URL");
      this.appendDummyInput()
          .appendField("AUTH/Secret:")
          .appendField(new Blockly.FieldTextInput("8zaipFwVBlCAPF5Cz5WlK0bw5IyDAgc3IrKjpsEc"), "AUTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ff6f00');
      this.setTooltip("מגדיר את משתני הרשת וה-Firebase עליונים (#define)");
    }
  };
  const firebaseDefinesGen = function(block) {
    const ssid = block.getFieldValue('SSID') || 'bamaale-teacher';
    const pass = block.getFieldValue('PASS') || 'OrtMala2025';
    const url = block.getFieldValue('URL') || 'edorobot-e9cb1-default-rtdb.firebaseio.com';
    const auth = block.getFieldValue('AUTH') || '';
    return `// ==========================================\n// הגדרות רשת ו-Firebase\n// ==========================================\n#define WIFI_SSID "${ssid}"\n#define WIFI_PASSWORD "${pass}"\n#define FIREBASE_URL "${url}"\n#define FIREBASE_AUTH "${auth}"\n`;
  };
  javascriptGenerator.forBlock['firebase_wifi_defines'] = firebaseDefinesGen;
  javascriptGenerator['firebase_wifi_defines'] = firebaseDefinesGen;

  // 4. WiFi & Firebase Full Connection Block
  Blockly.Blocks['firebase_connect_full'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🔥 התחבר ל-WiFi & Firebase Realtime DB");
      this.appendDummyInput()
          .appendField("SSID:")
          .appendField(new Blockly.FieldTextInput("bamaale-teacher"), "SSID")
          .appendField("Pass:")
          .appendField(new Blockly.FieldTextInput("OrtMala2025"), "PASS");
      this.appendDummyInput()
          .appendField("URL:")
          .appendField(new Blockly.FieldTextInput("edorobot-e9cb1-default-rtdb.firebaseio.com"), "URL");
      this.appendDummyInput()
          .appendField("Secret/Auth:")
          .appendField(new Blockly.FieldTextInput("8zaipFwVBlCAPF5Cz5WlK0bw5IyDAgc3IrKjpsEc"), "AUTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ff6f00');
      this.setTooltip("מתחבר לרשת ה-WiFi ולבסיס הנתונים של Firebase Realtime Database");
    }
  };
  const firebaseConnectFullGen = function(block) {
    const ssid = block.getFieldValue('SSID') || 'bamaale-teacher';
    const pass = block.getFieldValue('PASS') || 'OrtMala2025';
    const url = block.getFieldValue('URL') || 'edorobot-e9cb1-default-rtdb.firebaseio.com';
    const auth = block.getFieldValue('AUTH') || '';
    return `// 📡 WiFi & Firebase Realtime DB Setup\nWiFi.begin("${ssid}", "${pass}");\nwhile (WiFi.status() != WL_CONNECTED) {\n  delay(500);\n}\nconfig.database_url = "${url}";\nif (strlen("${auth}") > 0) {\n  config.signer.tokens.legacy_token = "${auth}";\n}\nFirebase.begin(&config, &auth);\nFirebase.reconnectWiFi(true);\n`;
  };
  javascriptGenerator.forBlock['firebase_connect_full'] = firebaseConnectFullGen;
  javascriptGenerator['firebase_connect_full'] = firebaseConnectFullGen;

  // 5. Firebase Read Command Block
  Blockly.Blocks['firebase_read_command'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📡 קליטת פקודה מ-Firebase | נתיב:")
          .appendField(new Blockly.FieldTextInput("/move/test/int"), "PATH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#eab308');
      this.setTooltip("קורא פקודת מחרוזת מהענן בזמן אמת ומפעיל את הרובוט");
    }
  };
  const firebaseReadGen = function(block) {
    const path = block.getFieldValue('PATH') || '/move/test/int';
    return `if (Firebase.getString(firebaseData, "${path}")) {\n  if (firebaseData.dataType() == "string") {\n    String fbCommand = firebaseData.stringData();\n    handleFirebaseCommand(fbCommand);\n  }\n}\n`;
  };
  javascriptGenerator.forBlock['firebase_read_command'] = firebaseReadGen;
  javascriptGenerator['firebase_read_command'] = firebaseReadGen;

  // 6. Firebase Send Data Block
  Blockly.Blocks['firebase_send_data'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📤 שלח נתון ל-Firebase | נתיב:")
          .appendField(new Blockly.FieldTextInput("/robot/status"), "PATH")
          .appendField("ערך:")
          .appendField(new Blockly.FieldTextInput("OK"), "VAL");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#10b981');
      this.setTooltip("שולח נתון חדש ל-Firebase Realtime Database");
    }
  };
  const firebaseSendGen = function(block) {
    const path = block.getFieldValue('PATH') || '/robot/status';
    const val = block.getFieldValue('VAL') || 'OK';
    return `Firebase.setString(firebaseData, "${path}", "${val}");\n`;
  };
  javascriptGenerator.forBlock['firebase_send_data'] = firebaseSendGen;
  javascriptGenerator['firebase_send_data'] = firebaseSendGen;

  // 6a. Standalone Block 1: GLOBALS (above setup)
  Blockly.Blocks['robot_block_globals'] = {
    init: function() {
      this.appendDummyInput().appendField("📌 משתנים והגדרות עליונות (מעל setup):");
      this.appendStatementInput("GLOBALS");
      this.setColour('#6366f1');
      this.setTooltip("הגדרות ומשתנים גלובליים מעל פונקציית setup");
    }
  };
  const robotBlockGlobalsGen = function(block) {
    const code = javascriptGenerator.statementToCode(block, 'GLOBALS');
    return `// ___BLOCK_GLOBALS_START___\n${code}\n// ___BLOCK_GLOBALS_END___\n`;
  };
  javascriptGenerator.forBlock['robot_block_globals'] = robotBlockGlobalsGen;
  javascriptGenerator['robot_block_globals'] = robotBlockGlobalsGen;

  // 6b. Standalone Block 2: SETUP
  Blockly.Blocks['robot_block_setup'] = {
    init: function() {
      this.appendDummyInput().appendField("⚡ פעם אחת בזינוק (setup):");
      this.appendStatementInput("SETUP");
      this.setColour('#3b82f6');
      this.setTooltip("פונקציית setup - מורצת פעם אחת בזינוק הלוח");
    }
  };
  const robotBlockSetupGen = function(block) {
    const code = javascriptGenerator.statementToCode(block, 'SETUP');
    return `// ___BLOCK_SETUP_START___\n${code}\n// ___BLOCK_SETUP_END___\n`;
  };
  javascriptGenerator.forBlock['robot_block_setup'] = robotBlockSetupGen;
  javascriptGenerator['robot_block_setup'] = robotBlockSetupGen;

  // 6c. Standalone Block 3: LOOP
  Blockly.Blocks['robot_block_loop'] = {
    init: function() {
      this.appendDummyInput().appendField("🔁 בלולאה אינסופית (loop):");
      this.appendStatementInput("LOOP");
      this.setColour('#8b5cf6');
      this.setTooltip("פונקציית loop - מורצת בלולאה אינסופית");
    }
  };
  const robotBlockLoopGen = function(block) {
    const code = javascriptGenerator.statementToCode(block, 'LOOP');
    return `// ___BLOCK_LOOP_START___\n${code}\n// ___BLOCK_LOOP_END___\n`;
  };
  javascriptGenerator.forBlock['robot_block_loop'] = robotBlockLoopGen;
  javascriptGenerator['robot_block_loop'] = robotBlockLoopGen;

  // 6d. Standalone Block 4: BOTTOM_FUNCTIONS (below loop)
  Blockly.Blocks['robot_block_bottom'] = {
    init: function() {
      this.appendDummyInput().appendField("⚙️ פונקציות וקוד נוסף (מתחת ל-loop):");
      this.appendStatementInput("BOTTOM_FUNCTIONS");
      this.setColour('#0ea5e9');
      this.setTooltip("פונקציות עזר וקוד נוסף הממוקם מתחת ל-loop");
    }
  };
  const robotBlockBottomGen = function(block) {
    const code = javascriptGenerator.statementToCode(block, 'BOTTOM_FUNCTIONS');
    return `// ___BLOCK_BOTTOM_START___\n${code}\n// ___BLOCK_BOTTOM_END___\n`;
  };
  javascriptGenerator.forBlock['robot_block_bottom'] = robotBlockBottomGen;
  javascriptGenerator['robot_block_bottom'] = robotBlockBottomGen;

  // 6e. Robot Main Container Block (Combined 4 slots)
  Blockly.Blocks['robot_main_container'] = {
    init: function() {
      this.appendDummyInput().appendField("🤖 תוכנית רובוט");
      this.appendStatementInput("GLOBALS").appendField("📌 משתנים והגדרות עליונות (מעל setup):");
      this.appendStatementInput("SETUP").appendField("⚡ פעם אחת בזינוק (setup):");
      this.appendStatementInput("LOOP").appendField("🔁 בלולאה אינסופית (loop):");
      this.appendStatementInput("BOTTOM_FUNCTIONS").appendField("⚙️ פונקציות וקוד נוסף (מתחת ל-loop):");
      this.setColour('#4f46e5');
      this.setTooltip("בלוק המכולה הראשי של הרובוט - הגדרת משתנים, setup, loop ופונקציות מתחת ל-loop");
    }
  };
  const robotMainGen = function(block) {
    const globalsCode = javascriptGenerator.statementToCode(block, 'GLOBALS');
    const setupCode = javascriptGenerator.statementToCode(block, 'SETUP');
    const loopCode = javascriptGenerator.statementToCode(block, 'LOOP');
    const bottomFunctionsCode = javascriptGenerator.statementToCode(block, 'BOTTOM_FUNCTIONS');
    
    return `#include "SuperBot.h"
#include <WiFi.h>
#include <FirebaseESP32.h>

${globalsCode}
SuperBot bot;
FirebaseData firebaseData;

// הגדרת אובייקטים הדרושים לגרסה החדשה של Firebase
FirebaseConfig config;
FirebaseAuth auth;

// ==========================================
// קודים של שלט רחוק (נשמר כגיבוי)
// ==========================================
const String CMD_MODE_MANUAL = "FF30CF"; // 1: נהיגה ידנית
const String CMD_MODE_LINE   = "FF7A85"; // 3: מעקב קו
const String CMD_TOGGLE_CAM  = "FFB04F"; // c: כיבוי/הדלקת מצלמה
const String CMD_TOGGLE_LED  = "FF08F4"; // refresh: החלפת מצבי תאורה
const String CMD_HORN        = "FF50AE"; // play: צופר (זמזם)
const String CMD_TAKE_PHOTO  = "FF6897"; // 0: צילום תמונה (אפקט פלאש)

const String CMD_FWD     = "FF18E7"; // 2
const String CMD_BACK    = "FF4AB5"; // 8
const String CMD_RIGHT   = "FF5AA5"; // 6
const String CMD_LEFT    = "FF10EF"; // 4
const String CMD_STOP    = "FF18E7"; // 5
const String CMD_FASTER  = "FF02FD"; // +
const String CMD_SLOWER  = "FF30CE"; // -

// ==========================================
// משתני מערכת
// ==========================================
enum RobotMode { MODE_MANUAL, MODE_LINE_TRACK };
RobotMode currentMode = MODE_MANUAL;

int currentSpeed = 800;
bool isCameraOn = false;
int ledMode = 0; 
bool isMovingForward = false; 
const int ROBOT_ROLE = 1;
const int TURN_90_TIME = 600;

// משתנה עזר למניעת הצפת הדפסות ב-Serial
String lastFirebaseCmd = ""; 

void setup() {
${setupCode}}

void loop() {
${loopCode}}

${bottomFunctionsCode}

// ==========================================
// 🕹️ פונקציית ניהול פקודות מ-Firebase
// ==========================================
void handleFirebaseCommand(String cmd) {
  if (cmd != lastFirebaseCmd) {
    Serial.println("Firebase Command: " + cmd);
    lastFirebaseCmd = cmd;
  }

  if (currentMode == MODE_MANUAL) {
    if (cmd == "1" || cmd == "FORWARD") {
      bot.moveForward(currentSpeed);
      isMovingForward = true;
      bot.setEyes(EYE_HAPPY);
    } 
    else if (cmd == "2" || cmd == "BACK") {
      bot.moveBackward(currentSpeed);
      isMovingForward = false;
      bot.setEyes(EYE_NORMAL);
    } 
    else if (cmd == "3" || cmd == "LEFT") {
      bot.turnLeft(currentSpeed);
      isMovingForward = false;
    } 
    else if (cmd == "4" || cmd == "RIGHT") {
      bot.turnRight(currentSpeed);
      isMovingForward = false;
    } 
    else if (cmd == "0" || cmd == "STOP") {
      bot.stop();
      isMovingForward = false;
      bot.setEyes(EYE_NORMAL);
    }
  }
}

// ==========================================
// 📺 ניהול פקודות שלט רחוק (קוד מקורי)
// ==========================================
void handleRemoteCommand(String code) {
  if (currentMode == MODE_MANUAL) {
    if (code == CMD_FWD) {
      bot.moveForward(currentSpeed);
      isMovingForward = true;
      bot.setEyes(EYE_HAPPY);
    } 
    else if (code == CMD_BACK) {
      bot.moveBackward(currentSpeed);
      isMovingForward = false;
    } 
    else if (code == CMD_LEFT) {
      bot.turnLeft(currentSpeed);
      isMovingForward = false;
    } 
    else if (code == CMD_RIGHT) {
      bot.turnRight(currentSpeed);
      isMovingForward = false;
    } 
    else if (code == CMD_STOP) {
      bot.stop();
      isMovingForward = false;
      bot.setEyes(EYE_NORMAL);
    }
    else if (code == CMD_FASTER) {
      currentSpeed += 300;
      if (currentSpeed > 4000) currentSpeed = 4000;
    }
    else if (code == CMD_SLOWER) {
      currentSpeed -= 300;
      if (currentSpeed < 1000) currentSpeed = 1000;
    }
  }
}

// ==========================================
// 🎨 פונקציית ציור הצורות
// ==========================================
void performShapeDance() {
  int driveSpeed = 1500;
  int turnSpeed = 1500;

  if (ROBOT_ROLE == 1) {
    bot.setLeds(0, 0, 255);
    bot.setEyes(EYE_NORMAL);
    
    for (int i = 0; i < 4; i++) {
      bot.moveForward(driveSpeed);
      delay(1000); 
      bot.stop();
      delay(200);
      bot.turnRight(turnSpeed);
      delay(TURN_90_TIME);
      bot.stop();
      delay(200);
    }
  } 
  else if (ROBOT_ROLE == 2) {
    bot.setLeds(255, 0, 0);
    bot.setEyes(EYE_ANGRY); 
    
    for (int i = 0; i < 3; i++) {
      bot.moveForward(driveSpeed);
      delay(1300); 
      bot.stop();
      delay(200);
      bot.turnRight(turnSpeed);
      delay(TURN_90_TIME * 1.33);
      bot.stop();
      delay(200);
    }
  } 
  else if (ROBOT_ROLE == 3) {
    bot.setLeds(0, 255, 0);
    bot.setEyes(EYE_HAPPY); 
    
    for (int i = 0; i < 8; i++) {
      bot.moveForward(driveSpeed);
      delay(500); 
      bot.stop();
      delay(200);
      bot.turnRight(turnSpeed);
      delay(TURN_90_TIME / 2);
      bot.stop();
      delay(200);
    }
  }
}

void performGrandFinale() {
  delay(500);
  bot.moveHead(90, 135);
  bot.setEyes(EYE_HAPPY);

  for (int i = 0; i < 3; i++) {
    bot.setLeds(255, 255, 255); delay(150);
    bot.setLeds(255, 0, 255);   delay(150); 
    bot.setLeds(0, 255, 255);   delay(150);
  }

  bot.setLeds(255, 255, 0); 
  bot.turnLeft(2000);
  delay(1000);
  bot.stop();

  bot.setLeds(255, 255, 255);
  bot.beep(800);
}

void runLineTracking() {
  if (bot.getDistance() < 10.0) {
     bot.stop();
     return;
  }

  if (bot.checkLine(0, 1, 0)) {          
    bot.moveForward(1200);
  } 
  else if (bot.checkLine(1, 0, 0) || bot.checkLine(1, 1, 0)) { 
    bot.turnLeft(1500);
  } 
  else if (bot.checkLine(0, 0, 1) || bot.checkLine(0, 1, 1)) { 
    bot.turnRight(1500);
  } 
  else if (bot.checkLine(0, 0, 0)) {     
    bot.stop();
  }
}\n`;
  };
  javascriptGenerator.forBlock['robot_main_container'] = robotMainGen;
  javascriptGenerator['robot_main_container'] = robotMainGen;

  // 7. Helper Function Call Blocks
  Blockly.Blocks['superbot_shape_dance'] = {
    init: function() {
      this.appendDummyInput().appendField("💃 ריקוד צורות (performShapeDance)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7e22ce');
      this.setTooltip("מפעיל ריקוד צורות מבוסס תפקיד הרובוט");
    }
  };
  javascriptGenerator.forBlock['superbot_shape_dance'] = function() { return 'performShapeDance();\n'; };
  javascriptGenerator['superbot_shape_dance'] = function() { return 'performShapeDance();\n'; };

  Blockly.Blocks['superbot_grand_finale'] = {
    init: function() {
      this.appendDummyInput().appendField("🎆 מופע סיום חגיגי (performGrandFinale)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ec4899');
      this.setTooltip("מפעיל מופע סיום חגיגי עם תאורה וצידוד ראש");
    }
  };
  javascriptGenerator.forBlock['superbot_grand_finale'] = function() { return 'performGrandFinale();\n'; };
  javascriptGenerator['superbot_grand_finale'] = function() { return 'performGrandFinale();\n'; };

  Blockly.Blocks['superbot_line_tracking'] = {
    init: function() {
      this.appendDummyInput().appendField("🛤️ מעקב קו אוטונומי (runLineTracking)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ea580c');
      this.setTooltip("מפעיל מעקב קו אוטונומי ועקירת מכשולים");
    }
  };
  javascriptGenerator.forBlock['superbot_line_tracking'] = function() { return 'runLineTracking();\n'; };
  javascriptGenerator['superbot_line_tracking'] = function() { return 'runLineTracking();\n'; };

  Blockly.Blocks['superbot_handle_firebase'] = {
    init: function() {
      this.appendDummyInput().appendField("🕹️ הפעל פקודת Firebase (handleFirebaseCommand)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ff6f00');
      this.setTooltip("קורא ומפעיל פקודות מ-Firebase Realtime Database");
    }
  };
  javascriptGenerator.forBlock['superbot_handle_firebase'] = function() {
    return 'if (Firebase.getString(firebaseData, "/move/test/int")) {\n  if (firebaseData.dataType() == "string") {\n    String fbCommand = firebaseData.stringData();\n    handleFirebaseCommand(fbCommand);\n  }\n}\n';
  };
  javascriptGenerator['superbot_handle_firebase'] = function() {
    return 'if (Firebase.getString(firebaseData, "/move/test/int")) {\n  if (firebaseData.dataType() == "string") {\n    String fbCommand = firebaseData.stringData();\n    handleFirebaseCommand(fbCommand);\n  }\n}\n';
  };

  Blockly.Blocks['superbot_handle_remote'] = {
    init: function() {
      this.appendDummyInput().appendField("📺 קליטת פקודת שלט IR (handleRemoteCommand)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2563eb');
      this.setTooltip("קורא פקודת שלט אינפרא-אדום ומפעיל פונקציית שלט רחוק");
    }
  };
  javascriptGenerator.forBlock['superbot_handle_remote'] = function() {
    return 'String irCode = bot.getIRCommand();\nif (irCode != "") {\n  handleRemoteCommand(irCode);\n}\n';
  };
  javascriptGenerator['superbot_handle_remote'] = function() {
    return 'String irCode = bot.getIRCommand();\nif (irCode != "") {\n  handleRemoteCommand(irCode);\n}\n';
  };

  // 7. Short & Punchy SuperBot Custom Blocks
  Blockly.Blocks['superbot_begin'] = {
    init: function() {
      this.appendDummyInput().appendField("🚀 אתחל רובוט");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4f46e5');
    }
  };
  javascriptGenerator.forBlock['superbot_begin'] = function() { return 'bot.begin();\n'; };
  javascriptGenerator['superbot_begin'] = function() { return 'bot.begin();\n'; };

  Blockly.Blocks['superbot_move'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🏎️ סע")
          .appendField(new Blockly.FieldDropdown([
            ["קדימה", "moveForward"],
            ["אחורה", "moveBackward"],
            ["שמאלה", "turnLeft"],
            ["ימינה", "turnRight"]
          ]), "DIR")
          .appendField("מהירות:")
          .appendField(new Blockly.FieldTextInput("200"), "SPEED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4f46e5');
    }
  };
  const superbotMoveGen = function(block) {
    const dir = block.getFieldValue('DIR') || 'moveForward';
    const speed = block.getFieldValue('SPEED') || '200';
    return `bot.${dir}(${speed});\n`;
  };
  javascriptGenerator.forBlock['superbot_move'] = superbotMoveGen;
  javascriptGenerator['superbot_move'] = superbotMoveGen;

  Blockly.Blocks['superbot_stop'] = {
    init: function() {
      this.appendDummyInput().appendField("🛑 עצור");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#dc2626');
    }
  };
  javascriptGenerator.forBlock['superbot_stop'] = function() { return 'bot.stop();\n'; };
  javascriptGenerator['superbot_stop'] = function() { return 'bot.stop();\n'; };

  Blockly.Blocks['superbot_head'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📐 סובב ראש | Pan:")
          .appendField(new Blockly.FieldTextInput("90"), "PAN")
          .appendField("Tilt:")
          .appendField(new Blockly.FieldTextInput("90"), "TILT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7e22ce');
    }
  };
  const superbotHeadGen = function(block) {
    const pan = block.getFieldValue('PAN') || '90';
    const tilt = block.getFieldValue('TILT') || '90';
    return `bot.moveHead(${pan}, ${tilt});\n`;
  };
  javascriptGenerator.forBlock['superbot_head'] = superbotHeadGen;
  javascriptGenerator['superbot_head'] = superbotHeadGen;

  Blockly.Blocks['superbot_eyes'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("👀 הבעת עיניים:")
          .appendField(new Blockly.FieldDropdown([
            ["שמח 😊", "EYE_HAPPY"],
            ["כועס 😡", "EYE_ANGRY"],
            ["רגיל 😐", "EYE_NORMAL"]
          ]), "EYE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ec4899');
    }
  };
  const superbotEyesGen = function(block) {
    const eye = block.getFieldValue('EYE') || 'EYE_NORMAL';
    return `bot.setEyes(${eye});\n`;
  };
  javascriptGenerator.forBlock['superbot_eyes'] = superbotEyesGen;
  javascriptGenerator['superbot_eyes'] = superbotEyesGen;

  Blockly.Blocks['superbot_leds'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🎨 תאורת RGB | R:")
          .appendField(new Blockly.FieldTextInput("255"), "R")
          .appendField("G:")
          .appendField(new Blockly.FieldTextInput("0"), "G")
          .appendField("B:")
          .appendField(new Blockly.FieldTextInput("0"), "B");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#eab308');
    }
  };
  const superbotLedsGen = function(block) {
    const r = block.getFieldValue('R') || '255';
    const g = block.getFieldValue('G') || '0';
    const b = block.getFieldValue('B') || '0';
    return `bot.setLeds(${r}, ${g}, ${b});\n`;
  };
  javascriptGenerator.forBlock['superbot_leds'] = superbotLedsGen;
  javascriptGenerator['superbot_leds'] = superbotLedsGen;

  Blockly.Blocks['superbot_get_distance'] = {
    init: function() {
      this.appendDummyInput().appendField("📏 מרחק (ס\"מ)");
      this.setOutput(true, null);
      this.setColour('#059669');
    }
  };
  const superbotDistGen = function() {
    return ['bot.getDistance()', javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['superbot_get_distance'] = superbotDistGen;
  javascriptGenerator['superbot_get_distance'] = superbotDistGen;

  Blockly.Blocks['superbot_is_dark'] = {
    init: function() {
      this.appendDummyInput().appendField("🌙 חשוך?");
      this.setOutput(true, null);
      this.setColour('#6366f1');
    }
  };
  const superbotDarkGen = function() {
    return ['bot.isDark()', javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['superbot_is_dark'] = superbotDarkGen;
  javascriptGenerator['superbot_is_dark'] = superbotDarkGen;

  Blockly.Blocks['superbot_camera_begin'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🎥 מצלמת Wi-Fi | רשת:")
          .appendField(new Blockly.FieldTextInput("SuperBot_WiFi"), "SSID")
          .appendField("סיסמה:")
          .appendField(new Blockly.FieldTextInput("12345678"), "PASS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0284c7');
    }
  };
  const superbotCamGen = function(block) {
    const ssid = block.getFieldValue('SSID') || 'SuperBot_WiFi';
    const pass = block.getFieldValue('PASS') || '12345678';
    return `bot.beginCamera(WIFI_AP, "${ssid}", "${pass}");\n`;
  };
  javascriptGenerator.forBlock['superbot_camera_begin'] = superbotCamGen;
  javascriptGenerator['superbot_camera_begin'] = superbotCamGen;

  Blockly.Blocks['superbot_beep'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🔔 צפצוף (מילי-שניות):")
          .appendField(new Blockly.FieldTextInput("200"), "MS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#d97706');
    }
  };
  const superbotBeepGen = function(block) {
    const ms = block.getFieldValue('MS') || '200';
    return `bot.beep(${ms});\n`;
  };
  javascriptGenerator.forBlock['superbot_beep'] = superbotBeepGen;
  javascriptGenerator['superbot_beep'] = superbotBeepGen;
}

// Register All Blocks in Blockly Engine
export function registerAllBlocks() {
  registerSystemCoreBlocks();
  const all = getAllRegisteredBlocks();
  all.forEach(b => registerSingleBlock(b));
}
