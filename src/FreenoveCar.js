import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import MonacoEditor from 'react-monaco-editor';
import 'blockly/javascript';
import { registerAllBlocks, getAllRegisteredBlocks, registerFallbackBlock, SYSTEM_CUSTOM_BLOCKS, getDynamicProjectCategories } from './blockRegistry';
import AIBlockGeneratorModal from './AIBlockGeneratorModal';
import FlashingModal from './FlashingModal';
import SendCodeModal from './SendCodeModal';
import ComPortStatusBadge from './ComPortStatusBadge';
import { SUPERBOT_H_CODE, SUPERBOT_CPP_CODE, SUPERBOT_INO_FULL_CODE, mergeBlocksWithBaseTemplate } from './superbotCode';
import { CAR_4WD_HERO } from './projectImages';

// Base Freenove Docs CDN Image URL
const FREENOVE_IMG_BASE = 'https://docs.freenove.com/projects/fnk0053/en/latest/_images/';

// Pre-register all system blocks at top-level module evaluation
registerAllBlocks();

// Register Freenove Car Specific Basic Arduino Blocks
function registerFreenoveCarBasicBlocks() {
  Blockly.Blocks['freenove_motor_drive'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🏎️ נהיגה 4WD")
          .appendField(new Blockly.FieldDropdown([
            ["קדימה", "FORWARD"],
            ["אחורה", "BACKWARD"],
            ["שמאלה", "LEFT"],
            ["ימינה", "RIGHT"],
            ["עצור", "STOP"]
          ]), "DIR")
          .appendField("מהירות:")
          .appendField(new Blockly.FieldTextInput("200"), "SPEED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4f46e5');
      this.setTooltip("מניע את 4 מנועי המכונית");
    }
  };
  const motorGen = function(block) {
    const dir = block.getFieldValue('DIR');
    const speed = block.getFieldValue('SPEED') || '200';
    return `bot.moveForward(${speed}); // ${dir}\n`;
  };
  javascriptGenerator.forBlock['freenove_motor_drive'] = motorGen;
  javascriptGenerator['freenove_motor_drive'] = motorGen;

  Blockly.Blocks['freenove_servo_angle'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📐 זווית סרוו:")
          .appendField(new Blockly.FieldTextInput("90"), "ANGLE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7e22ce');
      this.setTooltip("מכוון את מנוע הסרוו לזווית הנבחרת");
    }
  };
  const servoGen = function(block) {
    const angle = block.getFieldValue('ANGLE') || '90';
    return `bot.moveHead(${angle}, 90);\n`;
  };
  javascriptGenerator.forBlock['freenove_servo_angle'] = servoGen;
  javascriptGenerator['freenove_servo_angle'] = servoGen;

  Blockly.Blocks['freenove_ultrasonic_distance'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📏 מרחק (ס\"מ)");
      this.setOutput(true, null);
      this.setColour('#059669');
      this.setTooltip("מחזיר מרחק בס\"מ ממכשול מול המכונית");
    }
  };
  const ultrasonicGen = function(block) {
    return [`bot.getDistance()`, javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['freenove_ultrasonic_distance'] = ultrasonicGen;
  javascriptGenerator['freenove_ultrasonic_distance'] = ultrasonicGen;

  Blockly.Blocks['freenove_line_sensor'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🛤️ חיישן קו:")
          .appendField(new Blockly.FieldDropdown([
            ["שמאל", "LEFT"],
            ["מרכז", "CENTER"],
            ["ימין", "RIGHT"]
          ]), "SENSOR");
      this.setOutput(true, null);
      this.setColour('#ea580c');
      this.setTooltip("מחזיר אמת אם החיישן מזהה קו שחור");
    }
  };
  const lineGen = function(block) {
    const sensor = block.getFieldValue('SENSOR');
    return [`bot.checkLine(0, 1, 0)`, javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['freenove_line_sensor'] = lineGen;
  javascriptGenerator['freenove_line_sensor'] = lineGen;

  Blockly.Blocks['freenove_delay'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("⏱️ המתן (מילי-שניות):")
          .appendField(new Blockly.FieldTextInput("1000"), "MS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#d97706');
      this.setTooltip("ממתין מספר מילי-שניות לפני המעבר לפקודה הבאה");
    }
  };
  const delayGen = function(block) {
    const ms = block.getFieldValue('MS') || '1000';
    return `delay(${ms});\n`;
  };
  javascriptGenerator.forBlock['freenove_delay'] = delayGen;
  javascriptGenerator['freenove_delay'] = delayGen;
}

// COMPLETE ALL 32 ASSEMBLY STEPS FROM FREENOVE OFFICIAL DOCS
const ASSEMBLY_STEPS_ALL = [
  // --- WELCOME PAGE ---
  {
    id: 'step_0.0',
    title: '✨ ברוכים הבאים לפרויקט רובוט מכונית 4WD Pro (Freenove ESP32)!',
    isWelcomePage: true,
    videoUrl: 'https://video.aliexpress-media.com/play/u/ae_sg_item/2213001014720/p/1/e/6/t/10301/1100063412438.mp4?from=chrome&definition=h265',
    videoLink: 'https://video.aliexpress-media.com/play/u/ae_sg_item/2213001014720/p/1/e/6/t/10301/1100063412438.mp4?from=chrome&definition=h265',
    welcomeText: 'ברוכים הבאים למסלול הרובוטיקה המתקדם! בפרויקט זה תבנו בעצמכם מכונית רובוטית 4WD Pro עוצמתית המבוססת על בקר ESP32-Wrover-Dev, עם ראש Pan-Tilt דו-צדדי, מצלמה בזמן אמת, מטריצת לדים, חיישן אולטרסוני, חיישן מעקב קו ושליטה מלאה באפליקציית Wi-Fi.',
    features: [
      { icon: '🏎️', title: '32 שלבי הרכבה מפורטים', desc: 'הרכבה מכאנית מלאה של ה-4WD, מנועי ה-DC, הגלגלים ושלדת האלומיניום.' },
      { icon: '📷', title: 'ראש Pan-Tilt ומצלמת ESP32', desc: 'תנועה דו-צירית למצלמת ה-Wi-Fi למעקב חזותי וצפייה בלייב.' },
      { icon: '🧩', title: 'תכנות בבלוקים ובקוד C++', desc: 'עריכת קוד C++ מלאה, סביבת Blockly ומחולל AI אוטומטי.' },
      { icon: '📱', title: 'שליטה באפליקציה ו-Wi-Fi', desc: 'נהיגה מרחוק באפליקציה, עקיפת מכשולים אוטונומית ומעקב קו.' }
    ]
  },
  { id: '1.0', title: 'ערכת חלקי תושבות המנוע (Motor Fixed Bracket Package)', partsNeeded: ['תושבת אלומיניום', '2x ברגי M3*30', '2x ברגי M3*8', '2x אומי M3'], instructions: ['זהה את חלקי תושבת המנוע בערכה: תושבות אלומיניום, ברגי M3*30, ברגי M3*8 ואומי M3.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_00.png` },
  { id: '1.1', title: 'שלב 1: חיבור תושבת המנוע ל-Car Shield', partsNeeded: ['2x ברגי M3*8', 'תושבת אלומיניום', 'לוח Car Shield תחתון'], instructions: ['הפוך את לוח השלדה כשהחלק התחתון מופנה כלפי מעלה.', 'חזק את תושבת המתכת לשלדה בעזרת שני ברגי M3*8.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_01.png` },
  { id: '1.2', title: 'שלב 2: הרכבת מנוע ה-DC לתושבת', partsNeeded: ['מנוע DC צהוב', '2x ברגי M3*30', '2x אומי M3'], instructions: ['הנח את מנוע ה-DC הצהוב בצמוד לתושבת המתכת.', 'הכנס שני ברגי M3*30 והדק בעזרת אומי M3 בצד השני.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_02.png` },
  { id: '1.3', title: 'שלב 3: חיווט כבלי המנוע לטרמינלים', partsNeeded: ['כבלי הזנת מנוע (אדום/שחור)'], instructions: ['העבר את כבלי המנוע דרך חור הכבלים במרכז הלוח.', 'חבר את הכבלים לטרמינלי המנוע העליונים ב-Car Shield.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_03.png` },
  { id: '1.4', title: 'שלב 4: הרכבת הגלגל לציר מנוע ה-DC', partsNeeded: ['גלגל גומי 65 מ"מ'], instructions: ['יישר את חור ציר ה-D בגלגל עם ציר מנוע ה-DC והחלק בלחץ עדין.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_04.png` },
  { id: '1.5', title: 'שלב 5: הרכבת 4 הגלגלים המלאה', partsNeeded: ['4x גלגלים', '4x מנועי DC'], instructions: ['חזור על הפעולה עבור כל 4 הגלגלים עד להשלמת כל גלגלי ה-4WD.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_05.png` },
  { id: '1.6', title: 'שלב 6: התקנת לוח בקר ה-ESP32-Wrover-Dev', partsNeeded: ['לוח ESP32-Wrover-Dev'], instructions: ['הכנס בזהירות את לוח ה-ESP32 לתושבת ה-Shield. אזהרה: אל תהפוך את כיוון הלוח כדי למנוע שריפת הרכיב.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_06.png` },
  { id: '1.7', title: 'שלב 7: ערכת חלקי מנוע הסרוו (Servo Package)', partsNeeded: ['מנוע סרוו SG90', '3x זרועות רוקר', '2x ברגי M2*8', 'בורג M2*4'], instructions: ['זהה את חלקי מנוע הסרוו בערכה: מנוע סרוו, 3 זרועות רוקר, ברגי M2*8 ובורג M2*4.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_07.png` },
  { id: '1.8', title: 'שלב 8: חיבור Servo1 ל-Car Shield', partsNeeded: ['2x ברגי M2*16', '2x אומי M2'], instructions: ['חזק את מנוע סרוו 1 ללוח ה-Car Shield בעזרת שני ברגי M2*16 ואומי M2.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_08.png` },
  { id: '1.9', title: 'שלב 9: חיבור שני לוחות ה-Pan-Tilt האקריליים', partsNeeded: ['בורג M2*16', 'אום M2'], instructions: ['חזק את שני חלקי ה-Pan-Tilt האקריליים יחד בעזרת בורג M2*16 ואום M2.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_09.png` },
  { id: '1.10', title: 'שלב 10: חיבור תושבת ה-Pan-Tilt ל-Servo1 (איפוס 90°)', partsNeeded: ['2x ברגי M2.5*8', 'בורג M2*4'], instructions: ['כוון את הסרוו ל-90 מעלות, חזק את התושבת לזרוע הרוקר בברגי M2.5*8 והדק לציר בבורג M2*4.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_10.png` },
  { id: '1.11', title: 'שלב 11: חיבור Servo2 לתושבת Pan-Tilt', partsNeeded: ['2x ברגי M2*16', '2x אומי M2'], instructions: ['חזק את מנוע סרוו 2 לתושבת ה-Pan-Tilt בעזרת שני ברגי M2*16 ואומי M2.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_11.png` },
  { id: '1.12', title: 'שלב 12: חיווט כבלי מנועי הסרוו ללוח', partsNeeded: ['כבלי Servo1 ו-Servo2'], instructions: ['חבר את כבלי Servo1 ו-Servo2 לפורטים המיועדים ב-Shield.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_12.png` },
  { id: '1.13', title: 'שלב 13: חלקי האקריליק של תושבת מטריצת ה-LED', partsNeeded: ['לוחות אקריליק לראש הרובוט'], instructions: ['זהה את לוחות האקריליק עבור הרכבת ראש הרובוט ומטריצת ה-LED.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_13.png` },
  { id: '1.14', title: 'שלב 14: פירוק רכיב המצלמה מ-ESP32', partsNeeded: ['בקר ESP32 CAM'], instructions: ['שחרר בעדינות את מנעול ה-FPC Connector והסר את המצלמה בזהירות.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_14.png` },
  { id: '1.15', title: 'שלב 15: חיבור תושבת המצלמה ל-Pan-Tilt', partsNeeded: ['4x ברגי M1.4*6'], instructions: ['חבר את תושבת המצלמה לתושבת ה-Pan-Tilt בעזרת ארבעה ברגי M1.4*6.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_15.png` },
  { id: '1.16', title: 'שלב 16: חיבור מטריצת ה-LED ל-Pan-Tilt', partsNeeded: ['4x ברגי M1.4*6', 'מטריצת LED'], instructions: ['חזק את מטריצת ה-LED לתושבת בעזרת ארבעה ברגי M1.4*6.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_16.png` },
  { id: '1.17', title: 'שלב 17: הוספת אומי M3 כספייסרים בין הלוחות', partsNeeded: ['2x אומי M3'], instructions: ['הנח שני אומי M3 כספייסרים בין שני לוחות האקריליק.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_17.png` },
  { id: '1.18', title: 'שלב 18: חיזוק הלוחות האקריליים (חלק 1)', partsNeeded: ['בורג M2*16', 'אום M2'], instructions: ['חזק את שני לוחות האקריליק בעזרת בורג M2*16 ואום M2.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_18.png` },
  { id: '1.19', title: 'שלב 19: חיזוק הלוחות האקריליים (חלק 2)', partsNeeded: ['בורג M2*16', 'אום M2'], instructions: ['חזק את החלק האקרילי השני בעזרת בורג M2*16 ואום M2.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_19.png` },
  { id: '1.20', title: 'שלב 20: חיבור זרוע הרוקר ללוח האקרילי', partsNeeded: ['2x ברגי M2.5*8'], instructions: ['חבר את זרוע הרוקר ללוח האקרילי בעזרת שני ברגי M2.5*8.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_20.png` },
  { id: '1.21', title: 'שלב 21: חיבור תושבת האולטרסוני ל-Servo2 (איפוס 90°)', partsNeeded: ['בורג M2*4'], instructions: ['כוון את סרוו 2 ל-90 מעלות והדק את התושבת לציר בבורג M2*4.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_21.png` },
  { id: '1.22', title: 'שלב 22: סיום הרכבת מכלול ה-Pan-Tilt והמטריצה', partsNeeded: ['מכלול מורכב ראש הרובוט'], instructions: ['בצע בדיקה ויזואלית מלאה של מכלול ה-Pan-Tilt המורכב.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_22.png` },
  { id: '1.23', title: 'שלב 23: התקנת מודול חיישני מעקב הקו בתחתית השלדה', partsNeeded: ['2x עמודי ספייסר M3*28', '4x ברגי M3*6'], instructions: ['חזק 2 עמודי ספייסר M3*28 לתחתית השלדה בברגי M3*6, וחבר אליהם את מודול מעקב הקו.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_23.png` },
  { id: '1.24', title: 'שלב 24: חיווט כבל מודול מעקב הקו', partsNeeded: ['כבל שטוח 5-Pin'], instructions: ['חבר את הכבל השטוח בין מודול מעקב הקו לפורט ה-TRACKING בלוח.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_24.png` },
  { id: '1.25', title: 'שלב 25: הרמת נעילת תופסן כבל ה-FPC', partsNeeded: ['מחבר FPC Connector ב-ESP32'], instructions: ['הרם בזהירות את נעילת התופסן במחבר ה-FPC.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_25.png` },
  { id: '1.26', title: 'שלב 26: הכנסת כבל ה-FPC (הצד הכחול כלפי מעלה)', partsNeeded: ['כבל FPC של המצלמה'], instructions: ['ודא שהצד הכחול פונה כלפי מעלה וצד המגעים המוזהבים כלפי מטה.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_26.png` },
  { id: '1.27', title: 'שלב 27: העברת כבל ה-FPC דרך החריץ האקרילי', partsNeeded: ['לוח אקרילי עליון'], instructions: ['ודא כבל ה-FPC עובר בצורה חלקה דרך החריץ בלוח האקרילי.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_27.png` },
  { id: '1.28', title: 'שלב 28: חיווט כבל ה-4P של מטריצת ה-LED', partsNeeded: ['כבל 4P Jumper'], instructions: ['חבר את כבל ה-4P בין מטריצת ה-LED ללוח בהתאם לסימונים.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_28.png` },
  { id: '1.29', title: 'שלב 29: הכנסת ברגי M3*6 מתחתית ה-Shield', partsNeeded: ['4x ברגי M3*6'], instructions: ['הכנס ארבעה ברגי M3*6 כלפי מעלה מתחתית ה-Car Shield.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_29.png` },
  { id: '1.30', title: 'שלב 30: חיזוק 4 עמודי ספייסר M3*28 עליונים', partsNeeded: ['4x עמודי ספייסר M3*28'], instructions: ['הברג ארבעה עמודי ספייסר M3*28 על גבי ברגי ה-M3*6.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_30.png` },
  { id: '1.31', title: 'שלב 31: חיזוק הלוח האקרילי העליון לרובוט', partsNeeded: ['לוח אקרילי עליון', '4x ברגי M3*6'], instructions: ['יישר את הלוח האקרילי העליון מעל עמודי הספייסר והדק בעזרת ארבעה ברגי M3*6.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_31.png` },
  { id: '1.32', title: 'שלב 32: בדיקת איכות סופית והדלקת המפסק הראשי', partsNeeded: ['2x סוללות 18650'], instructions: ['הכנס 2 סוללות 18650 טעונות, הדלק את מפסק ה-Power ובדוק שנורת ה-LED הירוקה דולקת.'], imgUrl: `${FREENOVE_IMG_BASE}Chapter01_37.png` }
];

const OOP_CHAPTER_2_LESSONS = [
  {
    id: '2.1',
    title: 'שיעור 2.1: תכנון תנועה בעזרת 🤖 תוכנית רובוט ו-🏎️ סע',
    goal: 'גרור את הבלוק "🤖 תוכנית רובוט" והכנס לתוכו בלוקי "🏎️ סע", "⏱️ המתן" ו-"🛑 עצור" לבניית קוד הנהיגה הראשוני.',
    neededBlocks: ['🤖 תוכנית רובוט', '🏎️ סע (קדימה)', '⏱️ המתן', '🏎️ סע (ימינה)', '🏎️ סע (אחורה)', '🛑 עצור'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.moveForward(200);\n  delay(2000);\n  bot.turnRight(180);\n  delay(1000);\n  bot.moveBackward(150);\n  delay(1000);\n  bot.stop();\n}\n\nvoid loop() {}`
  },
  {
    id: '2.2',
    title: 'שיעור 2.2: כוונון וסריקת ראש בעזרת 📐 סובב ראש',
    goal: 'תכנת סריקה חלקה של ראש הרובוט ואיפוס מרכז הראש בעזרת הבלוק "📐 סובב ראש".',
    neededBlocks: ['🤖 תוכנית רובוט', '📐 סובב ראש (Pan: 45, Tilt: 90)', '⏱️ המתן', '📐 סובב ראש (Pan: 135, Tilt: 90)', '📐 סובב ראש (Pan: 90, Tilt: 90)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.moveHead(45, 90);  // צידוד 45°\n  delay(500);\n  bot.moveHead(135, 90); // צידוד 135°\n  delay(500);\n  bot.moveHead(90, 90);  // מרכוז\n}\n\nvoid loop() {}`
  },
  {
    id: '2.3',
    title: 'שיעור 2.3: הבעת רגשות ופרצופים בעזרת 👀 הבעת עיניים',
    goal: 'החלף בין הבעות עיניים במטריצת ה-LED בעזרת הבלוק "👀 הבעת עיניים".',
    neededBlocks: ['🤖 תוכנית רובוט', '👀 הבעת עיניים (שמח 😊)', '⏱️ המתן', '👀 הבעת עיניים (כועס 😡)', '👀 הבעת עיניים (רגיל 😐)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.setEyes(EYE_HAPPY);\n  delay(1500);\n  bot.setEyes(EYE_ANGRY);\n  delay(1500);\n  bot.setEyes(EYE_NORMAL);\n}\n\nvoid loop() {}`
  },
  {
    id: '2.4',
    title: 'שיעור 2.4: עיצוב צבעי תאורה בעזרת 🎨 תאורת RGB',
    goal: 'תכנת שינוי צבעי 12 נוריות ה-RGB של הרובוט בעזרת הבלוק "🎨 תאורת RGB".',
    neededBlocks: ['🤖 תוכנית רובוט', '🎨 תאורת RGB (אדום)', '⏱️ המתן', '🎨 תאורת RGB (ירוק)', '🎨 תאורת RGB (כחול)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.setLeds(255, 0, 0);\n  delay(1000);\n  bot.setLeds(0, 255, 0);\n  delay(1000);\n  bot.setLeds(0, 0, 255);\n}\n\nvoid loop() {}`
  },
  {
    id: '2.5',
    title: 'שיעור 2.5: זהירות מכשולים בעזרת 📏 מרחק (ס"מ)',
    goal: 'השתמש בבלוק "📏 מרחק (ס"מ)" בתוך תנאי אם/אחרת כדי לעצור ולצפצף מול מכשול קרוב.',
    neededBlocks: ['🤖 תוכנית רובוט', '🔀 אם... אחרת', '📏 מרחק (ס"מ)', '🔔 צפצוף', '🛑 עצור', '🏎️ סע'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid loop() {\n  float dist = bot.getDistance();\n  if (dist < 15.0) {\n    bot.beep(200);\n    bot.stop();\n  } else {\n    bot.moveForward(150);\n  }\n}`
  },
  {
    id: '2.6',
    title: 'שיעור 2.6: תאורת לילה אוטומטית בעזרת 🌙 חשוך?',
    goal: 'קרא את חיישן האור בעזרת הבלוק "🌙 חשוך?" והדלק תאורת RGB לבנה בחשיכה.',
    neededBlocks: ['🤖 תוכנית רובוט', '🔀 אם... אחרת', '🌙 חשוך?', '🎨 תאורת RGB (לבן)', '🎨 תאורת RGB (כבוי)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid loop() {\n  if (bot.isDark()) {\n    bot.setLeds(255, 255, 255);\n  } else {\n    bot.setLeds(0, 0, 0);\n  }\n}`
  },
  {
    id: '2.7',
    title: 'שיעור 2.7: מעקב קו אוטונומי בעזרת 🛤️ חיישן קו',
    goal: 'תכנת ניווט אוטונומי על מסלול קו שחור בעזרת הבלוק "🛤️ חיישן קו".',
    neededBlocks: ['🤖 תוכנית רובוט', '🔀 אם... אחרת', '🛤️ חיישן קו (מרכז)', '🏎️ סע (קדימה)', '🏎️ סע (שמאל)', '🏎️ סע (ימין)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid loop() {\n  if (bot.checkLine(0, 1, 0)) {\n    bot.moveForward(150);\n  } else if (bot.checkLine(1, 0, 0)) {\n    bot.turnLeft(150);\n  }\n}`
  },
  {
    id: '2.8',
    title: 'שיעור 2.8: נהיגה בשלט רחוק IR בעזרת 📶 קליטת שלט',
    goal: 'קלוט לחיצות משלט ה-IR והפעל פקודות נהיגה בהתאם.',
    neededBlocks: ['🤖 תוכנית רובוט', '🔀 אם...', '🏎️ סע', '🛑 עצור'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid loop() {\n  String cmd = bot.getIRCommand();\n  if (cmd == "FF02FD") {\n    bot.moveForward(200);\n  } else if (cmd == "FFA857") {\n    bot.stop();\n  }\n}`
  },
  {
    id: '2.9',
    title: 'שיעור 2.9: שידור וידאו בלייב בעזרת 🎥 מצלמת Wi-Fi',
    goal: 'הפעל שרת מצלמת Wi-Fi בלייב בעזרת הבלוק "🎥 מצלמת Wi-Fi".',
    neededBlocks: ['🤖 תוכנית רובוט', '🎥 מצלמת Wi-Fi (רשת: SuperBot_WiFi)'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.beginCamera(WIFI_AP, "SuperBot_WiFi", "12345678");\n}\n\nvoid loop() {}`
  },
  {
    id: '2.10',
    title: 'שיעור 2.10: הפעלה מלאה של כל מודולי הרובוט (אתגר הסיום)',
    goal: 'פרויקט סיכום פרק 2: הפעלת כל פונקציות הרובוט במקביל (תנועה, ראש, עיניים, RGB, אולטרסוני, IR ומצלמה)!',
    neededBlocks: ['🤖 תוכנית רובוט', '👀 הבעת עיניים', '🎨 תאורת RGB', '🔔 צפצוף', '🎥 מצלמת Wi-Fi', '📏 מרחק (ס"מ)', '🏎️ סע', '🛑 עצור'],
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.setEyes(EYE_HAPPY);\n  bot.setLeds(0, 255, 100);\n  bot.beep(100);\n  bot.beginCamera(WIFI_AP, "SuperBot_Pro", "12345678");\n}\n\nvoid loop() {\n  if (bot.getDistance() < 20) {\n    bot.setEyes(EYE_ANGRY);\n    bot.beep(200);\n    bot.turnRight(200);\n  }\n}`
  }
];

const FIREBASE_CHAPTER_4_LESSONS = [
  {
    id: '4.0',
    title: 'מדריך מיוחד: פתיחת פרויקט וחיבור Firebase Realtime Database (צעד-אחר-צעד)',
    goal: 'למד כיצד להקים פרויקט ענן חינמי ב-Google Firebase, להגדיר בסיס נתונים בזמן אמת (Realtime Database), ולהפיק את מפתחות התקשורת הנדרשים ל-ESP32.',
    setupGuide: [
      { step: '1', title: 'כניסה ל-Firebase Console', desc: 'היכנס לאתר console.firebase.google.com והתחבר בעזרת חשבון ה-Google שלך.' },
      { step: '2', title: 'יצירת פרויקט חדש (Create a Project)', desc: 'לחץ על "Add project" / "צור פרויקט", הזן שם לפרויקט (למשל edorobot-iot), אשר את התנאים ולחץ "Create Project".' },
      { step: '3', title: 'הקמת בסיס נתונים בזמן אמת (Realtime Database)', desc: 'בתפריט הצדדי לחץ על Build -> Realtime Database, ולאחר מכן לחץ על "Create Database". בחר את מיקום השרת הקרוב ביותר.' },
      { step: '4', title: 'הגדרת הרשאות גישה (Security Rules)', desc: 'במסך בחירת ההרשאות בחר ב-"Start in test mode" (מצב ניסיון) כך שהרשאות הקריאה והכתיבה יוגדרו כציבוריות (.read: true, .write: true).' },
      { step: '5', title: 'העתקת ה-URL ומפתח האבטחה (Database URL & Auth Secret)', desc: 'העתק את כתובת ה-URL של בסיס הנתונים (למשל edorobot-e9cb1-default-rtdb.firebaseio.com), ועבור להגדרות הפרויקט (Project Settings -> Service Accounts -> Database secrets) כדי להעתיק את Secret Key.' }
    ]
  },
  {
    id: '4.1',
    title: 'שיעור 4.1: התחברות ל-WiFi וחיבור ראשוני ל-Firebase Realtime Database',
    goal: 'חבר את בקר ה-ESP32 לרשת ה-WiFi והגדר את החיבור הראשוני ל-Firebase בעזרת הבלוק "🔥 התחבר ל-WiFi & Firebase".',
    neededBlocks: ['🤖 תוכנית רובוט', '🔥 התחבר ל-WiFi & Firebase (SSID, Pass, URL, Auth)', '👀 הבעת עיניים', '🔔 צפצוף'],
    codeTemplate: `#include "SuperBot.h"\n#include <WiFi.h>\n#include <FirebaseESP32.h>\n\n#define WIFI_SSID "bamaale-teacher"\n#define WIFI_PASSWORD "OrtMala2025"\n#define FIREBASE_URL "edorobot-e9cb1-default-rtdb.firebaseio.com"\n#define FIREBASE_AUTH "8zaipFwVBlCAPF5Cz5WlK0bw5IyDAgc3IrKjpsEc"\n\nSuperBot bot;\nFirebaseData firebaseData;\nFirebaseConfig config;\nFirebaseAuth auth;\n\nvoid setup() {\n  Serial.begin(115200);\n  bot.begin();\n  bot.setEyes(EYE_HAPPY);\n  bot.beep(200);\n\n  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n  while (WiFi.status() != WL_CONNECTED) {\n    delay(500);\n  }\n  config.database_url = FIREBASE_URL;\n  if (strlen(FIREBASE_AUTH) > 0) {\n    config.signer.tokens.legacy_token = FIREBASE_AUTH;\n  }\n  Firebase.begin(&config, &auth);\n  Firebase.reconnectWiFi(true);\n}\n\nvoid loop() {}`
  },
  {
    id: '4.2',
    title: 'שיעור 4.2: קליטת פקודות נהיגה בזמן אמת מהענן (FORWARD, BACK, LEFT, RIGHT, STOP)',
    goal: 'הפעל פונקציית טיפול בפקודות handleFirebaseCommand(cmd) וקרא פקודות מחרוזת מ-Firebase בלולאה הראשית.',
    neededBlocks: ['🤖 תוכנית רובוט', '📡 קליטת פקודה מ-Firebase (/move/test/int)', '🏎️ סע', '🛑 עצור'],
    codeTemplate: `void loop() {\n  if (Firebase.getString(firebaseData, "/move/test/int")) {\n    if (firebaseData.dataType() == "string") {\n      String fbCommand = firebaseData.stringData();\n      handleFirebaseCommand(fbCommand);\n    }\n  }\n}\n\nvoid handleFirebaseCommand(String cmd) {\n  if (cmd == "1" || cmd == "FORWARD") {\n    robot.moveForward(200);\n  } else if (cmd == "2" || cmd == "BACK") {\n    robot.moveBackward(200);\n  } else if (cmd == "3" || cmd == "LEFT") {\n    robot.turnLeft(200);\n  } else if (cmd == "4" || cmd == "RIGHT") {\n    robot.turnRight(200);\n  } else if (cmd == "0" || cmd == "STOP") {\n    robot.stop();\n  }\n}`
  },
  {
    id: '4.3',
    title: 'שיעור 4.3: שליטה מרחוק על תאורת RGB והבעות עיניים בענן',
    goal: 'תכנת שינוי צבעי תאורה והבעת עיניים ברובוט לפי פקודות המתקבלות מ-Firebase.',
    neededBlocks: ['🤖 תוכנית רובוט', '📡 קליטת פקודה מ-Firebase', '👀 הבעת עיניים', '🎨 תאורת RGB'],
    codeTemplate: `void handleFirebaseCommand(String cmd) {\n  if (cmd == "HAPPY") {\n    robot.setEyes(EYE_HAPPY);\n    robot.setLeds(0, 255, 0);\n  } else if (cmd == "ANGRY") {\n    robot.setEyes(EYE_ANGRY);\n    robot.setLeds(255, 0, 0);\n  }\n}`
  },
  {
    id: '4.4',
    title: 'שיעור 4.4: שידור נתוני חיישן אולטרסוני ל-Firebase Database בזמן אמת',
    goal: 'מדוד את המרחק ממכשולים בעזרת bot.getDistance() ושלח את הנתון ל-Firebase בנתיב /robot/distance.',
    neededBlocks: ['🤖 תוכנית רובוט', '📏 מרחק (ס"מ)', '📤 שלח נתון ל-Firebase (/robot/distance)', '⏱️ המתן'],
    codeTemplate: `void loop() {\n  float distance = robot.getDistance();\n  Firebase.setFloat(firebaseData, "/robot/distance", distance);\n  delay(1000);\n}`
  },
  {
    id: '4.5',
    title: 'שיעור 4.5: אתגר סיום: רובוט אוטונומי נשלט ענן בחיבור מלא ל-Firebase',
    goal: 'פרויקט סיום פרק 4: חיבור מלא של כל רכיבי הרובוט (נהיגה, חיישנים, עיניים, RGB וזמזם) לשליטה ודיווח מלא בענן Firebase!',
    neededBlocks: ['🤖 תוכנית רובוט', '🔥 התחבר ל-WiFi & Firebase', '📡 קליטת פקודה מ-Firebase', '📤 שלח נתון ל-Firebase', '📏 מרחק (ס"מ)', '🏎️ סע', '🛑 עצור'],
    codeTemplate: `// 🎯 קוד C++ מלא ומקיף לכל פונקציות הרובוט ב-Firebase\nvoid setup() {\n  robot.begin();\n  connectFirebase();\n}\n\nvoid loop() {\n  listenFirebaseCommands();\n  reportSensorData();\n}`
  }
];

const COURSE_CHAPTERS = [
  { id: 'ch1', title: '🛠️ פרק 1: הרכבה מכאנית וזיווד מפורט (32 שלבי CAD)', description: 'מדריך הרכבת CAD מקורי מלא 32 שלבים מתוך האתר הרשמי', lessons: ASSEMBLY_STEPS_ALL },
  {
    id: 'ch2',
    title: '💻 פרק 2: תכנות מונחה עצמים (OOP) ושימוש בספריית הרובוט (10 שיעורים)',
    description: 'משימות תכנות ב-C++ מונחה עצמים (Object-Oriented Programming) בעזרת הבלוקים הייעודיים לרובוט',
    lessons: OOP_CHAPTER_2_LESSONS
  },
  {
    id: 'ch3',
    title: '🚀 פרק 3: פרויקטים אוטונומיים ואפליקציות (10 שיעורים)',
    description: 'בניית פרויקטים רובוטיים מתקדמים ואפליקציות Wi-Fi',
    lessons: [
      { id: '3.1', title: 'שיעור 3.1: רובוט אוטונומי חומק ממכשולים בחלל', goal: 'אלגוריתם עקיפת מכשולים אוטונומי מלא.' },
      { id: '3.2', title: 'שיעור 3.2: רובוט עוקב אור (Light Tracing Car)', goal: 'ניווט לעבר מקור אור חזק.' },
      { id: '3.3', title: 'שיעור 3.3: רובוט אוטונומי עוקב קו שחור', goal: 'אלגוריתם PID עוקב קו מהיר.' },
      { id: '3.4', title: 'שיעור 3.4: מכונית שלט רחוק אינפרא-אדום', goal: 'שליטה מלאה בנהיגה דרך שלט IR.' },
      { id: '3.5', title: 'שיעור 3.5: מכונית מרובת מצבים (Multi-Mode Smart Car)', goal: 'מעבר בין מצבים בלחיצת כפתור בשלט.' },
      { id: '3.6', title: 'שיעור 3.6: הגדרת נקודת גישה Wi-Fi (AP Mode)', goal: 'הפעלת רשת Wi-Fi עצמאית ב-ESP32.' },
      { id: '3.7', title: 'שיעור 3.7: שרת אינטרנט לבקרת נהיגה (ESP32 Web Server)', goal: 'דף אינטרנט פנימי לשליטה ברובוט.' },
      { id: '3.8', title: 'שיעור 3.8: שידור וידאו בזמן אמת ממצלמת ESP32-CAM', goal: 'שידור וידאו בלייב לדפדפן.' },
      { id: '3.9', title: 'שיעור 3.9: אפליקציית שלט רחוק ב-AppInventor', goal: 'אפליקציית Android/iOS מותאמת אישית.' },
      { id: '3.10', title: 'שיעור 3.10: פרויקט סיום: רובוט מתקדם רב-משימתי', goal: 'שילוב כל היכולות לפרויקט גמר יוקרתי!' }
    ]
  },
  {
    id: 'ch4',
    title: '🔥 פרק 4: תקשורת ענן ו-Firebase IoT (5 שיעורים + מדריך פתיחת פרויקט)',
    description: 'חיבור בקר ESP32 לבסיס נתונים בענן ב-Firebase Realtime Database לשליטה ודיווח בזמן אמת',
    lessons: FIREBASE_CHAPTER_4_LESSONS
  }
];

function FreenoveCar() {
  const [selectedLessonId, setSelectedLessonId] = useState('step_0.0');
  const [completedLessons, setCompletedLessons] = useState({});

  // Lightbox, AI & Flashing Modal States
  const [zoomImageSrc, setZoomImageSrc] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFlashingModal, setShowFlashingModal] = useState(false);
  const [flashingMode, setFlashingMode] = useState('flash');

  // Workspace Controls State
  const [selectedBoard, setSelectedBoard] = useState('esp32');
  const [comPort, setComPort] = useState('COM3');
  const [filename, setFilename] = useState('superbot_car.ino');
  const [isEditorVisible, setIsEditorVisible] = useState(true);

  // MULTI-FILE CODE EDITOR TABS STATE
  const [activeFileTab, setActiveFileTab] = useState('main'); // 'main', 'header', 'cpp'
  const [headerCode, setHeaderCode] = useState(SUPERBOT_H_CODE);
  const [cppCode, setCppCode] = useState(SUPERBOT_CPP_CODE);

  // Toolbox config state
  const [toolboxConfig, setToolboxConfig] = useState(null);

  // Blockly & Monaco State
  const blocklyDivRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');

  // Save Code State & Notification
  const [isCodeSaved, setIsCodeSaved] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);

  const handleSaveCode = () => {
    if (workspace) {
      const freshCode = generateCodeForWorkspace(workspace);
      setGeneratedCode(freshCode);
      try {
        localStorage.setItem('superbot_saved_code', freshCode);
      } catch (e) {}
      setIsCodeSaved(true);
      setSaveNotification('✅ הקוד נשמר בהצלחה! כעת ניתן לצרוב.');
      setTimeout(() => setSaveNotification(''), 4000);
    }
  };

  // Check if opened as standalone workspace popup window
  const isStandalone = new URLSearchParams(window.location.search).get('standalone') === 'true';

  // Active Lesson lookup
  let currentLesson = null;
  let currentChapter = null;

  COURSE_CHAPTERS.forEach(ch => {
    ch.lessons.forEach(l => {
      if (l.id === selectedLessonId) {
        currentLesson = l;
        currentChapter = ch;
      }
    });
  });

  if (!currentLesson) {
    currentLesson = OOP_CHAPTER_2_LESSONS[0];
    currentChapter = COURSE_CHAPTERS[1];
  }

  // Calculate Total Lessons across all chapters
  let totalLessonsCount = 0;
  COURSE_CHAPTERS.forEach(ch => { totalLessonsCount += ch.lessons.length; });

  // Load clean & focused robot toolbox configuration
  const loadToolboxConfiguration = () => {
    registerAllBlocks();
    registerFreenoveCarBasicBlocks();

    const robotToolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '🤖 רובוט',
          colour: '#4f46e5',
          contents: [
            { kind: 'block', type: 'robot_block_globals' },
            { kind: 'block', type: 'robot_block_setup' },
            { kind: 'block', type: 'robot_block_loop' },
            { kind: 'block', type: 'robot_block_bottom' },
            { kind: 'block', type: 'firebase_wifi_defines' },
            { kind: 'block', type: 'superbot_begin' },
            { kind: 'block', type: 'superbot_move' },
            { kind: 'block', type: 'superbot_stop' },
            { kind: 'block', type: 'superbot_head' },
            { kind: 'block', type: 'superbot_eyes' },
            { kind: 'block', type: 'superbot_leds' },
            { kind: 'block', type: 'superbot_get_distance' },
            { kind: 'block', type: 'superbot_is_dark' },
            { kind: 'block', type: 'superbot_camera_begin' },
            { kind: 'block', type: 'superbot_beep' },
            { kind: 'block', type: 'freenove_motor_drive' },
            { kind: 'block', type: 'freenove_servo_angle' },
            { kind: 'block', type: 'freenove_ultrasonic_distance' },
            { kind: 'block', type: 'freenove_line_sensor' },
            { kind: 'block', type: 'freenove_delay' },
            { kind: 'block', type: 'superbot_shape_dance' },
            { kind: 'block', type: 'superbot_grand_finale' },
            { kind: 'block', type: 'superbot_line_tracking' },
            { kind: 'block', type: 'superbot_handle_firebase' },
            { kind: 'block', type: 'superbot_handle_remote' }
          ]
        },
        {
          kind: 'category',
          name: '🔥 Firebase & ענן',
          colour: '#ff6f00',
          contents: [
            { kind: 'block', type: 'firebase_connect_full' },
            { kind: 'block', type: 'firebase_read_command' },
            { kind: 'block', type: 'firebase_send_data' }
          ]
        },
        {
          kind: 'category',
          name: '🔀 לוגיקה ותנאים',
          colour: '#2563eb',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_boolean' }
          ]
        },
        {
          kind: 'category',
          name: '🔁 לולאות',
          colour: '#10b981',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' }
          ]
        },
        {
          kind: 'category',
          name: '🔢 מתמטיקה',
          colour: '#f59e0b',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' }
          ]
        },
        {
          kind: 'category',
          name: '📝 טקסט',
          colour: '#ec4899',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' }
          ]
        },
        {
          kind: 'category',
          name: '📌 משתנים',
          custom: 'VARIABLE',
          colour: '#a855f7'
        },
        {
          kind: 'category',
          name: '⚙️ פונקציות',
          custom: 'PROCEDURE',
          colour: '#6366f1'
        }
      ]
    };

    const dynamicProjectCats = getDynamicProjectCategories();
    dynamicProjectCats.forEach(cat => {
      robotToolbox.contents.push(cat);
    });

    setToolboxConfig(robotToolbox);
    if (workspace) {
      workspace.updateToolbox(robotToolbox);
    }
  };

  useEffect(() => {
    loadToolboxConfiguration();
  }, []);

  // Live C++ Generator (Using top blocks merged into rich C++ base template)
  const generateCodeForWorkspace = (ws) => {
    if (!ws) return SUPERBOT_INO_FULL_CODE;
    try {
      const rawBlockCode = javascriptGenerator.workspaceToCode(ws);
      if (!rawBlockCode || !rawBlockCode.trim()) return SUPERBOT_INO_FULL_CODE;
      return mergeBlocksWithBaseTemplate(rawBlockCode, SUPERBOT_INO_FULL_CODE);
    } catch (err) {
      console.error('Error generating live code:', err);
      return SUPERBOT_INO_FULL_CODE;
    }
  };

  // Initialize Blockly Workspace
  useEffect(() => {
    if (blocklyDivRef.current && !workspace && toolboxConfig) {
      try {
        if (toolboxConfig.contents) {
          const scanAndRegister = (contents) => {
            contents.forEach(item => {
              if (item.kind === 'block' && item.type) {
                if (!Blockly.Blocks[item.type]) {
                  registerFallbackBlock(item.type);
                }
              } else if (item.contents) {
                scanAndRegister(item.contents);
              }
            });
          };
          scanAndRegister(toolboxConfig.contents);
        }

        const ws = Blockly.inject(blocklyDivRef.current, {
          toolbox: toolboxConfig,
          scrollbars: true,
          zoom: { controls: true, wheel: true, startScale: 1.0 },
          grid: { spacing: 20, length: 3, colour: '#cbd5e1', snap: true }
        });

        const updateLiveCode = () => {
          const code = generateCodeForWorkspace(ws);
          setGeneratedCode(code);
        };

        ws.addChangeListener(updateLiveCode);
        setWorkspace(ws);
      } catch (err) {
        console.error('Error initializing Blockly workspace:', err);
      }
    }
  }, [workspace, toolboxConfig]);

  useEffect(() => {
    if (workspace) {
      const timer = setTimeout(() => {
        try {
          Blockly.svgResize(workspace);
        } catch (e) {
          console.error(e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [workspace, isEditorVisible]);

  const handleCompleteLesson = () => {
    setCompletedLessons(prev => ({ ...prev, [selectedLessonId]: true }));
    alert(`🎉 כל הכבוד! השלמת בהצלחה את "${currentLesson.title}"!`);

    let allLessons = [];
    COURSE_CHAPTERS.forEach(ch => allLessons.push(...ch.lessons));
    const currentIdx = allLessons.findIndex(l => l.id === selectedLessonId);
    if (currentIdx < allLessons.length - 1) {
      setSelectedLessonId(allLessons[currentIdx + 1].id);
    }
  };

  // Download all 3 project files (.ino, SuperBot.h, SuperBot.cpp)
  const handleDownloadCode = () => {
    const downloadSingle = (content, fname) => {
      const element = document.createElement("a");
      const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = fname;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    const mainName = filename || "superbot_car.ino";
    const mainContent = generatedCode || `#include "SuperBot.h"\n\nSuperBot bot;\n\nvoid setup() {\n  bot.begin();\n}\n\nvoid loop() {\n}`;
    
    downloadSingle(mainContent, mainName);
    setTimeout(() => downloadSingle(headerCode, "SuperBot.h"), 300);
    setTimeout(() => downloadSingle(cppCode, "SuperBot.cpp"), 600);
  };

  // Open Standalone Workspace Window ONLY
  const handleOpenWorkspaceInNewWindow = () => {
    try {
      const currentUrl = window.location.href;
      const targetUrl = currentUrl.includes('?') 
        ? `${currentUrl}&standalone=true` 
        : `${currentUrl}?standalone=true`;
      window.open(targetUrl, '_blank', 'width=1350,height=900,resizable=yes,scrollbars=yes');
    } catch (e) {
      console.error('Error opening standalone browser window:', e);
    }
  };

  // 1. STANDALONE WORKSPACE POPUP VIEW ONLY (EXACT MATCH TO USER PICTURE)
  if (isStandalone) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff', direction: 'rtl', overflow: 'hidden' }}>
        
        {/* TOP WORKSPACE TOOLBAR */}
        <div style={{ padding: '10px 18px', background: '#ffffff', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleSaveCode} 
              className="builder-btn" 
              style={{ background: isCodeSaved ? '#16a34a' : '#22c55e', color: '#ffffff', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: isCodeSaved ? '0 0 10px rgba(22,163,74,0.5)' : 'none' }}
            >
              {isCodeSaved ? '✅ הקוד שמור' : '💾 שמור קוד פרויקט'}
            </button>

            <button onClick={() => { 
              handleSaveCode();
              setFlashingMode('flash'); 
              setShowFlashingModal(true); 
            }} className="builder-btn builder-btn-hero">
              🚀 צרוב ל-ESP32 / SuperBot
            </button>
            <button onClick={() => { 
              handleSaveCode();
              setFlashingMode('compile'); 
              setShowFlashingModal(true); 
            }} className="builder-btn">
              ⚙️ קמפל קוד
            </button>
            <a 
              href="/SmartStart_Agent.bat" 
              download="SmartStart_Agent.bat"
              className="builder-btn" 
              style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="הורד והפעל מאיץ צריבה מהיר למחשב"
            >
              📥 מאיץ צריבה למחשב
            </a>

            {saveNotification && (
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#15803d', background: '#f0fdf4', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                {saveNotification}
              </span>
            )}
            <button onClick={handleDownloadCode} className="builder-btn">
              📄 הורד קוד (.ino)
            </button>
            <button 
              type="button"
              onClick={() => {
                if (workspace) {
                  try {
                    const freshCode = generateCodeForWorkspace(workspace);
                    setGeneratedCode(freshCode);
                  } catch (e) {}
                }
                setShowSendEmailModal(true);
              }} 
              className="builder-btn" 
              style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📧 שלח קוד למייל
            </button>
            <button onClick={() => setIsEditorVisible(!isEditorVisible)} className="builder-btn" style={{ background: '#f8fafc' }}>
              👁️ {isEditorVisible ? 'הסתר קוד' : 'הצג קוד בלייב'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>שם קובץ:</span>
              <input type="text" value={filename} onChange={(e) => setFilename(e.target.value)} className="builder-input-field" style={{ width: '130px', padding: '4px 8px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>יציאה:</span>
              <select value={comPort} onChange={(e) => setComPort(e.target.value)} className="builder-select-box" style={{ padding: '4px 8px' }}>
                {Array.from({ length: 20 }, (_, i) => `COM${i + 1}`).map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
              <ComPortStatusBadge currentPort={comPort} onSelectPort={setComPort} board={selectedBoard} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>בחר לוח:</span>
              <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="builder-select-box" style={{ padding: '4px 8px', fontWeight: 'bold', color: '#4338ca' }}>
                <option value="esp32">🔥 ESP32 Dev Module</option>
                <option value="uno">🤖 Arduino Uno</option>
              </select>
            </div>

            <button onClick={() => window.close()} className="builder-btn">
              📖 חזרה לשיעורים
            </button>
          </div>
        </div>

        {/* SPLIT WORKSPACE CONTAINER */}
        <div 
          className="builder-workspace-container" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'row', 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            direction: 'ltr'
          }}
        >
          {/* BLOCKLY WORKSPACE MAIN AREA (LEFT SIDE) */}
          <div className="builder-blockly-wrapper" style={{ flex: 1, height: '100%', position: 'relative', minHeight: '580px', direction: 'rtl' }}>
            <div 
              ref={blocklyDivRef} 
              id="freenoveBlocklyDiv"
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
          </div>

          {/* LIVE MONACO C++ MULTI-FILE CODE PANEL (RIGHT SIDE) */}
          {isEditorVisible && (
            <div 
              className="builder-side-code-panel"
              style={{ width: '450px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #cbd5e1', background: '#0f172a', color: '#ffffff', flexShrink: 0, direction: 'rtl' }}
            >
              {/* Header Title & Close Button */}
              <div className="code-panel-header" style={{ padding: '10px 14px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>💻 עורך קוד מרובה קבצים (C++ / Arduino)</span>
                <button 
                  onClick={() => setIsEditorVisible(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              {/* MULTI-FILE TAB SELECTOR */}
              <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid #334155', padding: '4px 8px 0 8px', gap: '4px', direction: 'ltr' }}>
                <button
                  onClick={() => setActiveFileTab('main')}
                  style={{
                    padding: '8px 12px',
                    background: activeFileTab === 'main' ? '#1e293b' : 'transparent',
                    color: activeFileTab === 'main' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'main' ? '2px solid #38bdf8' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  📄 {filename || 'superbot_car.ino'}
                </button>

                <button
                  onClick={() => setActiveFileTab('header')}
                  style={{
                    padding: '8px 12px',
                    background: activeFileTab === 'header' ? '#1e293b' : 'transparent',
                    color: activeFileTab === 'header' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'header' ? '2px solid #38bdf8' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  📘 SuperBot.h
                </button>

                <button
                  onClick={() => setActiveFileTab('cpp')}
                  style={{
                    padding: '8px 12px',
                    background: activeFileTab === 'cpp' ? '#1e293b' : 'transparent',
                    color: activeFileTab === 'cpp' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'cpp' ? '2px solid #38bdf8' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  📙 SuperBot.cpp
                </button>
              </div>

              {/* MONACO EDITOR AREA */}
              <div style={{ flex: 1, direction: 'ltr' }}>
                <MonacoEditor
                  key={activeFileTab + '_' + (activeFileTab === 'main' ? generatedCode : activeFileTab === 'header' ? headerCode : cppCode)}
                  width="100%"
                  height="100%"
                  language="cpp"
                  theme="vs-dark"
                  value={
                    activeFileTab === 'main'
                      ? (generatedCode || SUPERBOT_INO_FULL_CODE)
                      : activeFileTab === 'header'
                      ? headerCode
                      : cppCode
                  }
                  onChange={(newValue) => {
                    if (activeFileTab === 'main') {
                      setGeneratedCode(newValue);
                    } else if (activeFileTab === 'header') {
                      setHeaderCode(newValue);
                    } else if (activeFileTab === 'cpp') {
                      setCppCode(newValue);
                    }
                  }}
                  options={{
                    selectOnLineNumbers: true,
                    readOnly: false,
                    wordWrap: 'on',
                    fontSize: 13,
                    minimap: { enabled: false }
                  }}
                />
              </div>
            </div>
          )}

          {/* 🚀 FLASHING & COMPILATION PROCESS MODAL (FOR STANDALONE WINDOW) */}
          <FlashingModal 
            isOpen={showFlashingModal}
            onClose={() => setShowFlashingModal(false)}
            mode={flashingMode}
            board={selectedBoard}
            comPort={comPort}
            filename={filename}
            code={generatedCode || SUPERBOT_INO_FULL_CODE}
          />

        </div>
      </div>
    );
  }

  // 2. MAIN WEBSITE LESSONS VIEW ONLY (NO WORKSPACE TAB IN SITE)
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', direction: 'rtl', overflow: 'hidden', position: 'relative' }}>
      
      {/* 🌟 TOP STUDIO NAVBAR */}
      <div className="builder-header-toolbar" style={{ padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div className="builder-brand-group">
          <Link to="/" className="builder-btn" style={{ textDecoration: 'none', background: '#f8fafc' }}>
            🏠 דף הבית
          </Link>
          <div style={{ marginRight: '16px', display: 'flex', flexDirection: 'column' }}>
            <span className="builder-brand-title" style={{ fontSize: '1.15rem' }}>
              ⚡ עורך קוד וצריבה ללוח (ESP32 / SuperBot C++)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              פרויקט לימודי מקיף | {currentChapter.title} - {currentLesson.title}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="builder-controls-wrapper" style={{ gap: '10px' }}>
          <button 
            onClick={() => setShowAIModal(true)}
            className="builder-btn builder-btn-hero"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff', border: 'none', fontWeight: '800' }}
          >
            ✨ מחולל AI לבלוקים
          </button>

          <span className="builder-btn builder-btn-hero" style={{ background: '#f1f5f9', color: '#4338ca', border: '1px solid #cbd5e1' }}>
            📚 תוכנית הלימודים וההרכבה המלאה (32 שלבי CAD)
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* 📜 SIDEBAR: ALL LESSONS TRACKER (HIDDEN ON WELCOME LANDING PAGE FOR 100% FULL WIDTH) */}
        {!currentLesson.isWelcomePage && (
          <div style={{ width: '340px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>🏎️ תוכנית השיעורים (4WD Pro)</h3>
              <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '4px' }}>
                {Object.keys(completedLessons).length} מתוך {totalLessonsCount} שיעורים הושלמו
              </div>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {COURSE_CHAPTERS.map(ch => (
                <div key={ch.id} style={{ borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f1f5f9', fontWeight: '800', fontSize: '0.85rem', color: '#334155' }}>
                    {ch.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {ch.lessons.map(l => {
                      const isSelected = l.id === selectedLessonId;
                      const isDone = completedLessons[l.id];
                      return (
                        <button
                          key={l.id}
                          onClick={() => setSelectedLessonId(l.id)}
                          style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            background: isSelected ? '#e0e7ff' : '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: isSelected ? '4px solid #4f46e5' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? '800' : '500',
                            color: isSelected ? '#4338ca' : '#475569'
                          }}
                        >
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l.title}
                          </span>
                          {isDone && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📺 MAIN CONTENT CONTAINER (FULL WIDTH WHEN WELCOME LANDING PAGE IS ACTIVE) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: currentLesson.isWelcomePage ? '0' : '24px' }}>
          
          {/* CURRICULUM & LESSON STEP DETAILS */}
          <div style={{ width: '100%', maxWidth: currentLesson.isWelcomePage ? '100%' : '1450px', margin: '0 auto' }}>
            
            {/* Title Card (Only shown for standard lessons, not on full-width welcome landing) */}
            {!currentLesson.isWelcomePage && (
              <div style={{ background: '#ffffff', padding: '24px 32px', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', fontWeight: 'bold' }}>
                    {currentChapter.title}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>שיעור {currentLesson.id}</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {currentLesson.title}
                </h2>
              </div>
            )}

            {/* 🌌 FULL-WIDTH FUTURISTIC WORLD OF ROBOTICS WELCOME LANDING */}
            {currentLesson.isWelcomePage && (
              <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #4f46e5 100%)', color: '#ffffff', padding: '48px 32px', direction: 'rtl', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* HERO BANNER & SHOWCASE */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '36px', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(129, 140, 248, 0.15)', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#a5b4fc', fontSize: '0.9rem', fontWeight: '800', marginBottom: '20px' }}>
                        ✨ ברוכים הבאים לעולם הרובוטיקה והפיתוח העתידני
                      </div>

                      <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: '900', lineHeight: '1.2', margin: '0 0 18px 0', background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 60%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🏎️ רובוט מכונית 4WD Pro (Freenove ESP32)
                      </h1>

                      <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: '1.8', margin: '0 0 32px 0', fontWeight: '400' }}>
                        צא למסע מרגש בעולם הרובוטיקה המתקדם! הרכב במו ידיך מכונית 4WD Pro עוצמתית, תכנת מנועי סרוו דו-ציריים (Pan-Tilt), חבר מצלמת Wi-Fi לשידור וידאו חי, ותכנת אלגוריתמים אוטונומיים למעקב קו ועקיפת מכשולים!
                      </p>

                      <button 
                        onClick={() => setSelectedLessonId('1.0')} 
                        style={{ padding: '18px 42px', borderRadius: '16px', background: 'linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)', color: '#ffffff', border: 'none', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer', boxShadow: '0 12px 35px rgba(79, 70, 229, 0.45)', transition: 'all 0.3s ease' }}
                      >
                        🚀 היכנס לעולם הרובוטיקה והתחל בהרכבה צעד-אחר-צעד ➔
                      </button>
                    </div>

                    {/* HERO PROTOTYPE SHOWCASE CARD */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '2px solid rgba(129, 140, 248, 0.3)', borderRadius: '28px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: '800', marginBottom: '12px' }}>
                        📸 דגם מוגמר סופי - 4WD Smart Car Pro
                      </span>
                      <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }}>
                        <img 
                          src={CAR_4WD_HERO} 
                          alt="4WD Smart Car Pro Prototype"
                          style={{ maxWidth: '100%', maxHeight: '290px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 CYBER EXPERIENCE CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    {currentLesson.features.map((feat, idx) => (
                      <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1.5px solid rgba(255, 255, 255, 0.1)', borderRadius: '22px', padding: '24px', backdropFilter: 'blur(16px)', textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{feat.icon}</div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>{feat.title}</h4>
                        <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>{feat.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* FULL-WIDTH CINEMA VIDEO STAGE */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '2px solid rgba(129, 140, 248, 0.3)', borderRadius: '28px', padding: '28px', backdropFilter: 'blur(20px)', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', padding: '0 8px' }}>
                      <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.2rem' }}>
                        🎬 סרטון הדגמה בלייב: רובוט מכונית 4WD Pro בפעולה!
                      </span>
                      <a href={currentLesson.videoLink} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 'bold', textDecoration: 'none' }}>
                        📺 פתח בלשונית חדשה ↗
                      </a>
                    </div>
                    <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', background: '#000000' }}>
                      <video 
                        src={currentLesson.videoUrl} 
                        controls 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block', borderRadius: '20px' }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* FIREBASE SETUP GUIDE DISPLAY */}
            {currentLesson.setupGuide && (
              <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ff6f00', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔥 מדריך פתיחת פרויקט וחיבור Firebase Realtime Database צעד-אחר-צעד
                </h4>
                <p style={{ color: '#334155', fontSize: '1.05rem', marginBottom: '24px', fontWeight: '500' }}>
                  {currentLesson.goal}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                  {currentLesson.setupGuide.map((item) => (
                    <div key={item.step} style={{ background: '#fff7ed', padding: '20px', borderRadius: '18px', border: '1.5px solid #ffedd5', boxShadow: '0 4px 14px rgba(255,111,0,0.06)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ff6f00', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '12px' }}>
                        {item.step}
                      </div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '800', color: '#c2410c', margin: '0 0 8px 0' }}>
                        {item.title}
                      </h5>
                      <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleOpenWorkspaceInNewWindow} 
                  className="builder-btn builder-btn-hero" 
                  style={{ padding: '16px 32px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #ff6f00 0%, #ff9900 100%)', boxShadow: '0 10px 25px rgba(255,111,0,0.3)' }}
                >
                  🧪 פתח את סביבת העבודה לתרגול המשימה בחלונית חדשה ↗
                </button>
              </div>
            )}

            {/* ASSEMBLY LESSON CONTENT */}
            {currentLesson.instructions && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.2fr) minmax(360px, 1fr)', gap: '28px', marginBottom: '28px' }}>
                
                {/* OFFICIAL FREENOVE CAD IMAGE COLUMN */}
                <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      📐 תמונת CAD הרכבה מקורית (Freenove Official Docs):
                    </h4>
                    <button 
                      onClick={() => setZoomImageSrc(currentLesson.imgUrl)} 
                      className="builder-btn"
                      style={{ padding: '8px 18px', fontSize: '0.85rem', background: '#f5f3ff', color: '#4338ca', fontWeight: '800', border: '1.5px solid #c7d2fe' }}
                    >
                      🔍 הגדל מסך מלא
                    </button>
                  </div>

                  <div 
                    style={{ 
                      background: '#ffffff', 
                      padding: '16px', 
                      borderRadius: '16px', 
                      border: '2px solid #cbd5e1', 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justify: 'center',
                      minHeight: '380px'
                    }}
                  >
                    <img 
                      src={currentLesson.imgUrl} 
                      alt={currentLesson.title}
                      style={{ maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '520px', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Instructions & Parts Column */}
                <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)' }}>
                  {currentLesson.partsNeeded && (
                    <>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                        🔩 רכיבים וברגים נדרשים:
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                        {currentLesson.partsNeeded.map((part, idx) => (
                          <span key={idx} style={{ padding: '8px 16px', borderRadius: '12px', background: '#f1f5f9', color: '#1e293b', fontSize: '0.92rem', fontWeight: '800', border: '1px solid #cbd5e1' }}>
                            ✓ {part}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                    📝 הוראות הרכבה צעד-אחר-צעד:
                  </h4>
                  <ol style={{ paddingRight: '22px', margin: 0, color: '#334155', fontSize: '1rem', lineHeight: '2.0' }}>
                    {currentLesson.instructions.map((inst, idx) => (
                      <li key={idx} style={{ marginBottom: '12px', fontWeight: '500' }}>{inst}</li>
                    ))}
                  </ol>
                </div>

              </div>
            )}

            {/* CODING LESSON CHALLENGE VIEW (SPLIT BLOCKS NEEDED & TARGET C++ PREVIEW) */}
            {currentLesson.codeTemplate && (
              <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  🎯 משימת התכנות בשיעור זה:
                </h4>
                <p style={{ color: '#334155', fontSize: '1.05rem', marginBottom: '24px', fontWeight: '500' }}>
                  {currentLesson.goal}
                </p>

                {/* 2-COLUMN SPLIT CHALLENGE GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                  
                  {/* COLUMN 1: BLOCKS NEEDED FOR THIS CHALLENGE */}
                  {currentLesson.neededBlocks && (
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#4338ca', margin: 0, marginBottom: '14px' }}>
                        🧩 הבלוקים הנדרשים לבניית המשימה:
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px', fontWeight: '500' }}>
                        גרור את הבלוקים הללו בסביבת הפיתוח וחבר אותם בסדר הנכון למילוי הקוד:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {currentLesson.neededBlocks.map((bName, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              padding: '10px 18px', 
                              borderRadius: '14px', 
                              background: '#ffffff', 
                              color: '#1e1b4b', 
                              fontSize: '0.92rem', 
                              fontWeight: '800', 
                              border: '2px solid #6366f1',
                              boxShadow: '0 4px 12px rgba(99,102,241,0.08)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {bName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLUMN 2: C++ TARGET CODE STRUCTURE PREVIEW */}
                  <div style={{ background: '#0f172a', padding: '20px', borderRadius: '18px', direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                      💻 קוד C++ המיועד להיווצר בלייב:
                    </div>
                    <pre style={{ margin: 0, color: '#f1f5f9', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', flex: 1 }}>
                      {currentLesson.codeTemplate}
                    </pre>
                  </div>

                </div>

                {/* OPEN WORKSPACE IN STANDALONE BROWSER WINDOW BUTTON ONLY */}
                <button 
                  onClick={handleOpenWorkspaceInNewWindow} 
                  className="builder-btn builder-btn-hero" 
                  style={{ padding: '16px 32px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 10px 25px rgba(99,102,241,0.3)' }}
                >
                  🧪 פתח את סביבת העבודה לתרגול המשימה בחלונית חדשה ↗
                </button>
              </div>
            )}

            {!currentLesson.isWelcomePage && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={handleCompleteLesson} className="builder-btn builder-btn-hero" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
                  🎉 סיימתי את השיעור! עבר לשיעור הבא ←
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 🔍 PERFECTLY CENTERED GLOBAL FULLSCREEN LIGHTBOX MODAL */}
      {zoomImageSrc && (
        <div 
          onClick={() => setZoomImageSrc(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#ffffff',
              padding: '24px',
              borderRadius: '24px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              maxWidth: '85vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justify: 'center',
              margin: 'auto'
            }}
          >
            <button 
              onClick={() => setZoomImageSrc(null)}
              style={{
                position: 'absolute',
                top: '-18px',
                right: '-18px',
                background: '#ffffff',
                border: '2px solid #0f172a',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                padding: 0,
                margin: 0,
                zIndex: 100
              }}
              title="סגור חלון"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <img 
              src={zoomImageSrc} 
              alt="Zoomed Official CAD Schematic" 
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
          </div>
        </div>
      )}

      {/* ✨ UPGRADED AI BLOCK GENERATOR MODAL */}
      <AIBlockGeneratorModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onBlockCreated={() => {
          loadToolboxConfiguration();
        }}
      />

      {/* 🚀 FLASHING & COMPILATION PROCESS MODAL */}
      <FlashingModal 
        isOpen={showFlashingModal}
        onClose={() => setShowFlashingModal(false)}
        mode={flashingMode}
        board={selectedBoard}
        comPort={comPort}
        filename={filename}
        code={generatedCode || SUPERBOT_INO_FULL_CODE}
      />

      {/* 📧 SEND CODE TO EMAIL MODAL */}
      <SendCodeModal 
        isOpen={showSendEmailModal}
        onClose={() => setShowSendEmailModal(false)}
        filename={filename}
        code={generatedCode || SUPERBOT_INO_FULL_CODE}
      />

    </div>
  );
}

export default FreenoveCar;
