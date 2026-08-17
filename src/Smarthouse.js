import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import MonacoEditor from 'react-monaco-editor';
import 'blockly/javascript';
import { registerAllBlocks, getAllRegisteredBlocks, registerFallbackBlock, SYSTEM_CUSTOM_BLOCKS, getDynamicProjectCategories } from './blockRegistry';
import AIBlockGeneratorModal from './AIBlockGeneratorModal';
import FlashingModal from './FlashingModal';
import ComPortStatusBadge from './ComPortStatusBadge';
import { SMARTHOUSE_HERO } from './projectImages';
import { mergeBlocksWithBaseTemplate, SUPERBOT_INO_FULL_CODE } from './superbotCode';

// Base Keyestudio Docs CDN Image URL
const KEYESTUDIO_IMG_BASE = 'https://docs.keyestudio.com/projects/KS5009/en/latest/_images/';

// Pre-register all system blocks at top-level module evaluation
registerAllBlocks();

// Register Smart House Specific Custom Arduino Blocks
function registerSmartHouseBasicBlocks() {
  Blockly.Blocks['smarthouse_led_control'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("💡 תאורת LED צהובה | מצב:")
          .appendField(new Blockly.FieldDropdown([
            ["הדלק (ON)", "HIGH"],
            ["כבה (OFF)", "LOW"]
          ]), "STATE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#eab308');
      this.setTooltip("מדליק או מכבה את תאורת ה-LED הראשית בבית");
    }
  };
  const ledGen = function(block) {
    const state = block.getFieldValue('STATE');
    return `digitalWrite(YELLOW_LED_PIN, ${state});\n`;
  };
  javascriptGenerator.forBlock['smarthouse_led_control'] = ledGen;
  javascriptGenerator['smarthouse_led_control'] = ledGen;

  Blockly.Blocks['smarthouse_rgb_color'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🎨 תאורת RGB סלון (6812) | צבע R:")
          .appendField(new Blockly.FieldTextInput("255"), "R")
          .appendField("G:")
          .appendField(new Blockly.FieldTextInput("100"), "G")
          .appendField("B:")
          .appendField(new Blockly.FieldTextInput("0"), "B");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#ec4899');
      this.setTooltip("מכוון צבע תאורת RGB בסלון");
    }
  };
  const rgbGen = function(block) {
    const r = block.getFieldValue('R') || '255';
    const g = block.getFieldValue('G') || '100';
    const b = block.getFieldValue('B') || '0';
    return `setSmartHomeRGBColor(${r}, ${g}, ${b});\n`;
  };
  javascriptGenerator.forBlock['smarthouse_rgb_color'] = rgbGen;
  javascriptGenerator['smarthouse_rgb_color'] = rgbGen;

  Blockly.Blocks['smarthouse_fan_control'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🌀 מאוורר אוורור ביתי | עוצמה:")
          .appendField(new Blockly.FieldDropdown([
            ["כבה (0)", "0"],
            ["מהירות נמוכה (120)", "120"],
            ["מהירות בינונית (180)", "180"],
            ["מהירות מקסימלית (255)", "255"]
          ]), "SPEED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0ea5e9');
      this.setTooltip("מפעיל או מפסיק את מנוע ה-DC של אוורור הבית");
    }
  };
  const fanGen = function(block) {
    const speed = block.getFieldValue('SPEED');
    return `setSmartHomeFanSpeed(${speed});\n`;
  };
  javascriptGenerator.forBlock['smarthouse_fan_control'] = fanGen;
  javascriptGenerator['smarthouse_fan_control'] = fanGen;

  Blockly.Blocks['smarthouse_servo_door'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🚪 דלת כניסה ראשית | מצב:")
          .appendField(new Blockly.FieldDropdown([
            ["פתח דלת (90°)", "90"],
            ["סגור דלת (0°)", "0"]
          ]), "ANGLE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#8b5cf6');
      this.setTooltip("פותח או סוגר את דלת הבית בעזרת מנוע סרוו");
    }
  };
  const doorGen = function(block) {
    const angle = block.getFieldValue('ANGLE');
    return `setDoorServoAngle(${angle});\n`;
  };
  javascriptGenerator.forBlock['smarthouse_servo_door'] = doorGen;
  javascriptGenerator['smarthouse_servo_door'] = doorGen;

  Blockly.Blocks['smarthouse_servo_window'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🪟 חלון בית חכם | מצב:")
          .appendField(new Blockly.FieldDropdown([
            ["פתח חלון (90°)", "90"],
            ["סגור חלון (0°)", "0"]
          ]), "ANGLE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#a855f7');
      this.setTooltip("פותח או סוגר את חלון הבית בעזרת מנוע סרוו");
    }
  };
  const windowGen = function(block) {
    const angle = block.getFieldValue('ANGLE');
    return `setWindowServoAngle(${angle});\n`;
  };
  javascriptGenerator.forBlock['smarthouse_servo_window'] = windowGen;
  javascriptGenerator['smarthouse_servo_window'] = windowGen;

  Blockly.Blocks['smarthouse_read_pir'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🚶 קרא חיישן תנועה PIR (אבטחה)");
      this.setOutput(true, null);
      this.setColour('#6366f1');
      this.setTooltip("מחזיר אמת אם זוהתה תנועת אדם בחצר או בבית");
    }
  };
  const pirGen = function() {
    return [`(digitalRead(PIR_MOTION_PIN) == HIGH)`, javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['smarthouse_read_pir'] = pirGen;
  javascriptGenerator['smarthouse_read_pir'] = pirGen;

  Blockly.Blocks['smarthouse_read_gas'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🔥 קרא חיישן גז ועשן (MQ-2/Gas)");
      this.setOutput(true, null);
      this.setColour('#ef4444');
      this.setTooltip("מחזיר את רמת העשן והגז באוויר");
    }
  };
  const gasGen = function() {
    return [`analogRead(GAS_SENSOR_PIN)`, javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['smarthouse_read_gas'] = gasGen;
  javascriptGenerator['smarthouse_read_gas'] = gasGen;

  Blockly.Blocks['smarthouse_read_steam'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("🌧️ קרא חיישן אדים / גשם (Steam)");
      this.setOutput(true, null);
      this.setColour('#0284c7');
      this.setTooltip("מחזיר רמת לחות/טיפות גשם על גג הבית");
    }
  };
  const steamGen = function() {
    return [`analogRead(STEAM_SENSOR_PIN)`, javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['smarthouse_read_steam'] = steamGen;
  javascriptGenerator['smarthouse_read_steam'] = steamGen;

  Blockly.Blocks['smarthouse_lcd_print'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("📟 הצג במסך LCD1602 | שורה 1:")
          .appendField(new Blockly.FieldTextInput("Smart Home Active"), "LINE1")
          .appendField("שורה 2:")
          .appendField(new Blockly.FieldTextInput("Temp: 24C Humi:50%"), "LINE2");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#10b981');
      this.setTooltip("מדפיס טקסט למסך ה-LCD בבית");
    }
  };
  const lcdGen = function(block) {
    const line1 = block.getFieldValue('LINE1') || '';
    const line2 = block.getFieldValue('LINE2') || '';
    return `printLCD1602("${line1}", "${line2}");\n`;
  };
  javascriptGenerator.forBlock['smarthouse_lcd_print'] = lcdGen;
  javascriptGenerator['smarthouse_lcd_print'] = lcdGen;
}

// COMPLETE ALL 20 MECHANICAL ASSEMBLY STEPS WITH ALL SUB-STEP IMAGES (KEYESTUDIO KS5009 ESP32 SMART HOME)
const SMART_HOME_ASSEMBLY_ALL = [
  { 
    id: 'ks_welcome', 
    title: '✨ ברוכים הבאים לפרויקט הבית החכם IoT (Keyestudio KS5009)!', 
    isWelcomePage: true,
    videoUrl: 'https://video.aliexpress-media.com/play/u/ae_sg_item/3000000699004/p/1/e/6/t/10301/1100067992406.mp4?from=chrome&definition=h265',
    videoLink: 'https://video.aliexpress-media.com/play/u/ae_sg_item/3000000699004/p/1/e/6/t/10301/1100067992406.mp4?from=chrome&definition=h265',
    welcomeText: 'ברוכים הבאים למסלול הבנייה והתכנות המתקדם של הבית החכם! במסלול זה תבנו בעצמכם בית חכם מלא מעץ, ותתכננו 13 חיישנים ומודולים מתקדמים: חיישן טמפרטורה ולחות, חיישן גז ועשן, חיישן גשם, בקרת RFID, מסך LCD1602, מנועי סרוו לחלונות ודלתות, ותאורת RGB סלון.',
    features: [
      { icon: '🛠️', title: '20 שלבי CAD מפורטים', desc: 'כל שלבי הבנייה המכאנית, זיווד לוחות העץ והרכבת החיישנים עם תמונות מקוריות!' },
      { icon: '🔌', title: '13 מודולים וחיישני IoT', desc: 'חיבור וחיווט מדויק של כל חיישן לבקר ה-ESP32 PLUS Board המתקדם.' },
      { icon: '🧩', title: 'תכנות בבלוקים וב-C++', desc: 'סביבת Blockly עשירה עם קוד C++ אוטומטי, מחולל AI וצריבה ישירה לחומרה.' },
      { icon: '☁️', title: 'שליטה באפליקציה וענן', desc: 'פרויקט גמר אוטונומי המקשר את הבית החכם לרשת ה-Wi-Fi ולאפליקציה סלולרית.' }
    ]
  },
  { 
    id: 'ks_step_1.1', 
    title: 'שלב 1: הרכבת לוח הבסיס וקירות העץ ההיקפיים (Base & Wooden Board Setup)', 
    partsNeeded: ['לוח עץ בסיסי Base Board x1', 'קירות עץ היקפיים x2', '24x ברגי M4*8mm', '24x אומי M4'], 
    instructions: [
      '1. הנחו את לוח העץ התחתון (Base Board) על משטח עבודה ישר.',
      '2. חברו את קירות העץ והאקריליק ההיקפיים לבסיס בעזרת ברגי M4*8mm ואומי M4.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A01.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A02.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A03.png`
  },
  { 
    id: 'ks_step_1.2', 
    title: 'שלב 2: הרכבת מסגרות עץ מבניות היקפיות (Structural Frame Setup)', 
    partsNeeded: ['מסגרות עץ היקפיות x2', '8x ברגי M4*8mm', '8x אומי M4'], 
    instructions: [
      '1. הרכיבו את מסגרות העץ הצדדיות ליצירת המבנה ההיקפי של הבית.',
      '2. חזקו בברגי M4*8mm ואומי M4 ליציבות מלאה.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A04.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A05.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A06.png`
  },
  { 
    id: 'ks_step_1.3', 
    title: 'שלב 3: התקנת לוח הבקר המרכזי ESP32 PLUS Development Board', 
    partsNeeded: ['לוח בקר ESP32 PLUS Development Board x1', '4x עמודי ספייסר M3*10mm Dual-pass', '4x ברגי M3*6mm'], 
    instructions: [
      '1. הנחו 4 עמודי ספייסר M3*10mm בחורי הלוח הבסיסי.',
      '2. הברגו את לוח הבקר המרכזי ESP32 PLUS מעל עמודי הנחושת בברגי M3*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A07.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A08.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A09.png`
  },
  { 
    id: 'ks_step_1.4', 
    title: 'שלב 4: הרכבת מסגרות הפינה וחיבור הקירות (Corner Brackets & Wall Framing)', 
    partsNeeded: ['תושבות זווית עץ x4', '12x ברגי M4*8mm', '12x אומי M4'], 
    instructions: [
      '1. חברו את פינות הבית בעזרת תושבות הזווית והברגים.',
      '2. הדקו בברגי M4*8mm ואומי M4 ליצירת שלדה קשיחה.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A10.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A11.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A12.png`
  },
  { 
    id: 'ks_step_1.5', 
    title: 'שלב 5: הרכבת קורות התמיכה של הגג העליון (Top Roof Beams Assembly)', 
    partsNeeded: ['קורות עץ עליונות לגג x2', '8x ברגי M4*8mm', '8x אומי M4'], 
    instructions: [
      '1. הרכיבו את קורות התמיכה העליונות בחלק העליון של קירות הבית.',
      '2. חזקו את הקורות ללוחות הקיר בעזרת ברגים ואומים.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A13.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A14.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A15.png`
  },
  { 
    id: 'ks_step_1.6', 
    title: 'שלב 6: הרכבת מסגרת החלון האקרילי (Acrylic Window Frame Assembly)', 
    partsNeeded: ['מסגרת חלון אקריליק שקוף x1', 'אומי ניילון ננעלים M3 self-locking x2', 'ברגי M3*10mm x2'], 
    instructions: [
      '1. הרכיבו את מסגרת החלון האקרילית השקופה.',
      '2. ⚠️ אזהרה: אל תהדק עד הסוף את אומי הניילון הננעלים (Self-locking nuts) כדי לאפשר לחלון לנוע בחופשיות!'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A16.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A17.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A18.png`
  },
  { 
    id: 'ks_step_1.7', 
    title: 'שלב 7: התקנת מנוע הסרוו של החלון האוטומטי (Window Servo Motor Setup)', 
    partsNeeded: ['מנוע סרוו SG90 x1', 'זרוע סרוו x1', '2x ברגי M2*12mm', 'בורג M1.4*6mm x1'], 
    instructions: [
      '1. ⚠️ כוונו את זרוע מנוע הסרוו ל-0 מעלות בדיוק לפני ההתקנה.',
      '2. התקינו את מנוע הסרוו של החלון למסגרת העץ בעזרת ברגי M2*12mm והדקו את הזרוע למנגנון החלון.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A19.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}wps1-1.jpg`,
    extraImg: `${KEYESTUDIO_IMG_BASE}wps2.jpg`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A22.png`
  },
  { 
    id: 'ks_step_1.8', 
    title: 'שלב 8: התקנת מנוע הסרוו של דלת הכניסה הראשית (Main Door Servo Motor Setup)', 
    partsNeeded: ['מנוע סרוו SG90 x1', 'דלת עץ כניסה x1', '2x ברגי M2*12mm', 'בורג M1.4*6mm x1'], 
    instructions: [
      '1. כוונו את סרוו הדלת ל-0 מעלות (מצב סגור).',
      '2. חברו את ציר הדלת לזרוע הסרוו והדקו בעזרת בורג M1.4*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A23.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A24.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A25.png`
  },
  { 
    id: 'ks_step_1.9', 
    title: 'שלב 9: התקנת מודול מנוע 130 DC ומאוורר הבית (130 DC Fan Motor Setup)', 
    partsNeeded: ['מנוע 130 DC x1', 'להבי מאוורר פלסטיק x1', 'תושבת מנוע x1', 'ברגי M3*6mm x2'], 
    instructions: [
      '1. הכניסו את מנוע ה-130 DC לתושבת האוורור בגג הבית.',
      '2. החליקו את להבי המאוורר על ציר המנוע בלחץ עדין.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A26.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A27.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A28.png`
  },
  { 
    id: 'ks_step_1.10', 
    title: 'שלב 10: התקנת חיישן גז ועשן אנלוגי (MQ-2 Analog Gas Sensor)', 
    partsNeeded: ['חיישן גז אנלוגי (MQ-2) x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. מקמו את חיישן הגז MQ-2 באזור המטבח מעל תושבת העץ.',
      '2. הדקו בעזרת 2 ברגי M3*6mm ואומים M3.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A29.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A30.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A31.png`
  },
  { 
    id: 'ks_step_1.11', 
    title: 'שלב 11: התקנת חיישן אדים / גשם (Steam Water Sensor)', 
    partsNeeded: ['חיישן אדים (Steam Sensor) x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. התקינו את חיישן הגשם/האדים במיקום העליון על גג הבית.',
      '2. הדקו בברגי M3*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A32.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A33.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A34.png`
  },
  { 
    id: 'ks_step_1.12', 
    title: 'שלב 12: התקנת חיישן תנועה PIR (PIR Motion Sensor Setup)', 
    partsNeeded: ['חיישן תנועה PIR x1', 'עדשת פלסטיק x1', '2x ברגי M3*6mm'], 
    instructions: [
      '1. התקינו את חיישן התנועה PIR בחזית הבית מעל הדלת הראשית.',
      '2. קבעו את עדשת הפלסטיק והדקו בברגי M3*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A35.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A36.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A37.png`
  },
  { 
    id: 'ks_step_1.13', 
    title: 'שלב 13: התקנת חיישן טמפרטורה ולחות XHT11 (XHT11 Sensor Setup)', 
    partsNeeded: ['חיישן XHT11 x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. חברו את חיישן האקלים XHT11 בתוך חלל הבית.',
      '2. הדקו בעזרת 2 ברגי M3*6mm ואומים M3.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A38.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A39.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A40.png`
  },
  { 
    id: 'ks_step_1.14', 
    title: 'שלב 14: התקנת מודול תאורת LED צהובה (Yellow LED Module Setup)', 
    partsNeeded: ['מודול LED צהוב x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. התקינו את מודול ה-LED הצהוב בתקרת הבית.',
      '2. הדקו בעזרת ברגי M3*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A41.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A43.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A44.png`
  },
  { 
    id: 'ks_step_1.15', 
    title: 'שלב 15: התקנת מודול תאורת 6812 RGB Neopixel (RGB Module Setup)', 
    partsNeeded: ['מודול 6812 RGB x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. התקינו את מודול תאורת ה-RGB 6812 בסלון הבית.',
      '2. הדקו בברגי M3*6mm.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A45.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A46.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A47.png`
  },
  { 
    id: 'ks_step_1.16', 
    title: 'שלב 16: התקנת זמזם פסיבי (Passive Buzzer Module Setup)', 
    partsNeeded: ['מודול זמזם פסיבי x1', '2x ברגי M3*6mm', '2x אומי M3'], 
    instructions: [
      '1. התקינו את זמזם ההתראה הקולית ליד מודול האבטחה.',
      '2. הדקו בברגי M3*6mm ואומים M3.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A48.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A49.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A50.png`
  },
  { 
    id: 'ks_step_1.17', 
    title: 'שלב 17: התקנת מודול RFID RC522 (RFID RC522 Door Lock Setup)', 
    partsNeeded: ['מודול RFID RC522 x1', '4x ברגי M3*6mm', '4x אומי M3'], 
    instructions: [
      '1. התקינו את מודול קורא כרטיסי ה-RFID בסמוך לדלת הכניסה.',
      '2. הדקו ב-4 ברגי M3*6mm ואומים M3.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A51.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A52.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A53.png`
  },
  { 
    id: 'ks_step_1.18', 
    title: 'שלב 18: הרכבת מסך LCD1602 I2C בחזית הבית (LCD1602 I2C Display Setup)', 
    partsNeeded: ['מסך LCD1602 I2C x1', '4x ברגי M3*6mm', '4x אומי M3'], 
    instructions: [
      '1. הרכיבו את מסך ה-LCD1602 בחזית הבית.',
      '2. הדקו היטב ב-4 ברגי M3*6mm ואומים M3.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A54.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A55.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A56.png`
  },
  { 
    id: 'ks_step_1.19', 
    title: 'שלב 19: הרכבת מסגרת הגג העליון ולוח הסגירה (Top Roof Cover Assembly)', 
    partsNeeded: ['לוחות עץ לגג העליון x2', '4x ברגי M4*8mm', '4x אומי M4'], 
    instructions: [
      '1. הציבו את לוחות סגירת הגג מעל קורות התמיכה.',
      '2. הדקו בעזרת ברגי M4*8mm ואומים M4 לסיום המבנה המכאני.'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A57.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A58.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A59.png`
  },
  { 
    id: 'ks_step_1.20', 
    title: 'שלב 20: חיווט מלא של כל 13 המודולים ל-ESP32 PLUS Board (Full Wiring Guide)', 
    partsNeeded: ['כבלי דופונט 3P / 4P F-F'], 
    instructions: [
      '1. חבר את חיישן הטמפרטורה ל-GPIO17, חיישן הגז ל-GPIO23, חיישן הגשם ל-GPIO34, מנוע הסרוו ל-GPIO5 ו-GPIO13.',
      '2. חבר את מסך ה-LCD1602 ומודול ה-RFID לפורט ה-I2C.',
      '3. עיין בכל איורי החיווט המפורטים למטה לכל מודול ומודול בנפרד!'
    ], 
    partsImg: `${KEYESTUDIO_IMG_BASE}A60-1.png`,
    assemblyImg: `${KEYESTUDIO_IMG_BASE}A60.png`,
    extraImg: `${KEYESTUDIO_IMG_BASE}A61.png`,
    prototypeImg: `${KEYESTUDIO_IMG_BASE}A68.png`
  }
];

const SMART_HOME_CODING_LESSONS = [
  { id: '2.21', title: 'שיעור 21: בקרת תאורת LED צהובה ותאורת 6812 RGB Neopixel', goal: 'תכנת הדלקה וכיבוי של תאורת הבית ותאורת RGB סלון.', codeTemplate: 'digitalWrite(12, HIGH); // Yellow LED ON\nsetSmartHomeRGBColor(255, 100, 0); // Warm RGB' },
  { id: '2.22', title: 'שיעור 22: שליטה במנוע DC ומאוורר האוורור לבית', goal: 'תכנת הפעלת מאוורר האוורור במהירויות משתנות.', codeTemplate: 'setSmartHomeFanSpeed(200);\ndelay(3000);\nsetSmartHomeFanSpeed(0);' },
  { id: '2.23', title: 'שיעור 23: פתיחה וסגירת חלון ודלת בעזרת מנועי סרוו', goal: 'תכנת פתיחת דלת כניסה וסגירת חלון בלחיצת כפתור.', codeTemplate: 'setDoorServoAngle(90); // Open Door\nsetWindowServoAngle(0);  // Close Window' },
  { id: '2.24', title: 'שיעור 24: קריאת חיישן טמפרטורה ולחות XHT11', goal: 'מדוד טמפרטורה ולחות והדפס למסך ה-LCD1602.', codeTemplate: 'float temp = dht.readTemperature();\nfloat humi = dht.readHumidity();\nprintLCD1602("Temp: " + String(temp), "Humi: " + String(humi));' },
  { id: '2.25', title: 'שיעור 25: זיהוי תנועת אדם (PIR) והפעלת התרעה קולית', goal: 'אלגוריתם אבטחה: אם זוהתה תנועה, הפעל זמזם ותאורת אזהרה.', codeTemplate: 'if (digitalRead(14) == HIGH) {\n  tone(25, 1000, 500);\n  digitalWrite(12, HIGH);\n}' },
  { id: '2.26', title: 'שיעור 26: זיהוי דליפת גז ועשן והפעלת מערכת חירום', goal: 'אם דליפת גז מעל 400, הפעל מאוורר אוורור ופתח חלונות.', codeTemplate: 'if (analogRead(23) > 400) {\n  setSmartHomeFanSpeed(255);\n  setWindowServoAngle(90);\n}' },
  { id: '3.27', title: 'שיעור 27: פרויקט גמר: בית חכם אוטונומי ומקושר IoT', goal: 'שילוב כל 13 המודולים למערכת ניהול בית חכם אוטונומית מלאה!', codeTemplate: 'void loop() {\n  checkGasSafety();\n  checkRainAndWindows();\n  handleRFIDAccess();\n  updateLCDDisplay();\n}' }
];

const SMART_HOME_CHAPTERS = [
  { id: 'ch1', title: '🛠️ פרק 1: הרכבה מכאנית וזיווד מפורט (20 שלבי CAD)', description: 'מדריך הרכבת הבית והחיישנים צעד-אחר-צעד לפי מפרט Keyestudio KS5009 הרשמי', lessons: SMART_HOME_ASSEMBLY_ALL },
  { id: 'ch2', title: '💻 פרק 2: תכנות חיישנים ומודולים בנפרד (6 שיעורים)', description: 'משימות תכנות מעשיות בבלוקים ובקוד C++', lessons: SMART_HOME_CODING_LESSONS.slice(0, 6) },
  { id: 'ch3', title: '🚀 פרק 3: פרויקט גמר: בית חכם אוטונומי ומקושר IoT (שיעור 27)', description: 'שילוב כל המודולים למערכת בית חכם מתקדמת', lessons: SMART_HOME_CODING_LESSONS.slice(6, 7) }
];

function Smarthouse() {
  const [smartHouseKit, setSmartHouseKit] = useState('ks5009'); // 'ks5009' (ESP32 Built-in) | 'ks0085' (Arduino External ESP)
  const [showKitSelectModal, setShowKitSelectModal] = useState(true); // Popup modal on entrance
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedLessonId, setSelectedLessonId] = useState('ks_welcome');
  const [completedLessons, setCompletedLessons] = useState({});

  // Lightbox, AI & Flashing Modal States
  const [zoomImageSrc, setZoomImageSrc] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFlashingModal, setShowFlashingModal] = useState(false);
  const [flashingMode, setFlashingMode] = useState('flash');

  // Workspace Controls State
  const [selectedBoard, setSelectedBoard] = useState('esp32');
  const [comPort, setComPort] = useState('COM3');
  const [filename, setFilename] = useState('smarthouse_code.ino');
  const [isEditorVisible, setIsEditorVisible] = useState(true);

  // Toolbox config state
  const [toolboxConfig, setToolboxConfig] = useState(null);

  // Blockly & Monaco State
  const blocklyDivRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');

  // Active Lesson lookup
  let currentLesson = null;
  let currentChapter = null;

  SMART_HOME_CHAPTERS.forEach(ch => {
    ch.lessons.forEach(l => {
      if (l.id === selectedLessonId) {
        currentLesson = l;
        currentChapter = ch;
      }
    });
  });

  if (!currentLesson) {
    currentLesson = SMART_HOME_ASSEMBLY_ALL[0];
    currentChapter = SMART_HOME_CHAPTERS[0];
  }

  // Load and refresh full toolbox configuration including dynamic user projects
  const loadToolboxConfiguration = () => {
    registerAllBlocks();
    registerSmartHouseBasicBlocks();

    fetch('toolbox.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.contents) {
          data.contents.unshift({
            kind: 'category',
            name: '🏠 בית חכם (Smart House Kit)',
            contents: [
              { kind: 'block', type: 'smarthouse_led_control' },
              { kind: 'block', type: 'smarthouse_rgb_color' },
              { kind: 'block', type: 'smarthouse_fan_control' },
              { kind: 'block', type: 'smarthouse_servo_door' },
              { kind: 'block', type: 'smarthouse_servo_window' },
              { kind: 'block', type: 'smarthouse_read_pir' },
              { kind: 'block', type: 'smarthouse_read_gas' },
              { kind: 'block', type: 'smarthouse_read_steam' },
              { kind: 'block', type: 'smarthouse_lcd_print' }
            ]
          });

          const dynamicProjectCats = getDynamicProjectCategories();
          dynamicProjectCats.forEach(cat => {
            data.contents.push(cat);
          });

          setToolboxConfig(data);
          if (workspace) {
            workspace.updateToolbox(data);
          }
        }
      })
      .catch(err => {
        console.error('Could not fetch toolbox.json:', err);
      });
  };

  useEffect(() => {
    loadToolboxConfiguration();
  }, []);

  // Live C++ Generator
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
    if (activeTab === 'workspace' && workspace) {
      const timer = setTimeout(() => {
        try {
          Blockly.svgResize(workspace);
        } catch (e) {
          console.error(e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, workspace, isEditorVisible]);

  const handleCompleteLesson = () => {
    setCompletedLessons(prev => ({ ...prev, [selectedLessonId]: true }));
    alert(`🎉 כל הכבוד! השלמת בהצלחה את "${currentLesson.title}"!`);

    let allLessons = [...SMART_HOME_ASSEMBLY_ALL, ...SMART_HOME_CODING_LESSONS];
    const currentIdx = allLessons.findIndex(l => l.id === selectedLessonId);
    if (currentIdx < allLessons.length - 1) {
      setSelectedLessonId(allLessons[currentIdx + 1].id);
    }
  };

  const handleDownloadCode = () => {
    const fullCode = `// 🏠 Keyestudio Smart House Code\n#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n${generatedCode}}`;
    const element = document.createElement("a");
    const file = new Blob([fullCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename || "smarthouse_code.ino";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
              ⚡ בית חכם (Smart House IoT Kit)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              מסלול הרכבה וקוד מלא | {currentChapter.title} - {currentLesson.title}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="builder-controls-wrapper" style={{ gap: '10px' }}>
          <button 
            onClick={() => setShowAIModal(true)}
            className="builder-btn builder-btn-hero"
            style={{ background: 'linear-gradient(135deg, #FF007A 0%, #FF758C 100%)', color: '#ffffff', border: 'none', fontWeight: '800' }}
          >
            ✨ מחולל AI לבלוקים
          </button>

          <button 
            onClick={() => setActiveTab('curriculum')} 
            className={`builder-btn ${activeTab === 'curriculum' ? 'builder-btn-hero' : ''}`}
          >
            📚 תוכנית הלימודים וההרכבה המלאה (20 שלבי CAD)
          </button>
          <button 
            onClick={() => setActiveTab('workspace')} 
            className={`builder-btn ${activeTab === 'workspace' ? 'builder-btn-hero' : ''}`}
          >
            🧪 סביבת פיתוח בבלוקים וקוד C++
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* 📜 SIDEBAR: ALL LESSONS TRACKER (HIDDEN ON WELCOME LANDING PAGE FOR 100% FULL WIDTH) */}
        {!currentLesson.isWelcomePage && (
          <div style={{ width: '340px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>🏠 תוכנית השיעורים המלאה</h3>
              <div style={{ fontSize: '0.78rem', color: '#ff758c', marginTop: '4px' }}>
                {Object.keys(completedLessons).length} מתוך {SMART_HOME_ASSEMBLY_ALL.length + SMART_HOME_CODING_LESSONS.length} שיעורים הושלמו
              </div>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SMART_HOME_CHAPTERS.map(ch => (
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
                            background: isSelected ? '#ffe4e6' : '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: isSelected ? '4px solid #e11d48' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? '800' : '500',
                            color: isSelected ? '#be123c' : '#475569'
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
          
          {/* TAB 1: CURRICULUM & LESSON STEP DETAILS */}
          <div style={{ display: activeTab === 'curriculum' ? 'block' : 'none', width: '100%', maxWidth: currentLesson.isWelcomePage ? '100%' : '1450px', margin: '0 auto' }}>
            
            {/* Title Card (Only shown for standard lessons, not on full-width welcome landing) */}
            {!currentLesson.isWelcomePage && (
              <div style={{ background: '#ffffff', padding: '24px 32px', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px', background: '#ffe4e6', color: '#e11d48', fontWeight: 'bold' }}>
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
              <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #be123c 100%)', color: '#ffffff', padding: '48px 32px', direction: 'rtl', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* HERO BANNER & SHOWCASE */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '36px', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.9rem', fontWeight: '800', marginBottom: '20px' }}>
                        ✨ ברוכים הבאים לעולם הרובוטיקה והבית החכם IoT
                      </div>

                      <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: '900', lineHeight: '1.2', margin: '0 0 18px 0', background: 'linear-gradient(135deg, #ffffff 0%, #fda4af 60%, #e11d48 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🏡 בית חכם IoT עם ESP32 (Keyestudio KS5009)
                      </h1>

                      <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: '1.8', margin: '0 0 32px 0', fontWeight: '400' }}>
                        צא למסע בנייה ותכנות מרתק! תכנן ובנה בעצמך בית חכם מלא מעץ, חבר 13 חיישנים ומודולים מתקדמים (טמפרטורה, גז, גשם, RFID, LCD1602, מנועי סרוו), ותכנת אלגוריתמי IoT לשליטה סלולרית וחיבור ענן!
                      </p>

                      <button 
                        onClick={() => setSelectedLessonId('ks_step_1.1')} 
                        style={{ padding: '18px 42px', borderRadius: '16px', background: 'linear-gradient(135deg, #FF007A 0%, #FF758C 100%)', color: '#ffffff', border: 'none', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer', boxShadow: '0 12px 35px rgba(255, 0, 122, 0.45)', transition: 'all 0.3s ease' }}
                      >
                        🚀 היכנס לעולם הבית החכם והתחל בהרכבה צעד-אחר-צעד ➔
                      </button>
                    </div>

                    {/* HERO PROTOTYPE SHOWCASE CARD */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '2px solid rgba(244, 63, 94, 0.3)', borderRadius: '28px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fda4af', fontWeight: '800', marginBottom: '12px' }}>
                        📸 דגם מוגמר סופי - Smart Home IoT KS5009
                      </span>
                      <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }}>
                        <img 
                          src={SMARTHOUSE_HERO} 
                          alt="Smart Home IoT Prototype"
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
                  <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '2px solid rgba(244, 63, 94, 0.3)', borderRadius: '28px', padding: '28px', backdropFilter: 'blur(20px)', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', padding: '0 8px' }}>
                      <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.2rem' }}>
                        🎬 סרטון הדגמה בלייב: הבית החכם בפעולה!
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

            {/* ASSEMBLY LESSON CONTENT - ALL SUB-STEP IMAGES DISPLAY */}
            {currentLesson.instructions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
                
                {/* INSTRUCTIONS & PARTS BANNER */}
                <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)' }}>
                  {currentLesson.partsNeeded && (
                    <>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                        🔩 רכיבים וברגים נדרשים לשלב זה:
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                        {currentLesson.partsNeeded.map((part, idx) => (
                          <span key={idx} style={{ padding: '8px 16px', borderRadius: '12px', background: '#ffe4e6', color: '#be123c', fontSize: '0.92rem', fontWeight: '800', border: '1px solid #fecdd3' }}>
                            ✓ {part}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                    📝 הוראות הרכבה צעד-אחר-צעד:
                  </h4>
                  <ol style={{ paddingRight: '22px', margin: 0, color: '#334155', fontSize: '1.02rem', lineHeight: '2.0' }}>
                    {currentLesson.instructions.map((inst, idx) => (
                      <li key={idx} style={{ marginBottom: '10px', fontWeight: '600' }}>{inst}</li>
                    ))}
                  </ol>
                </div>

                {/* 3-CARD VISUAL GALLERY (ALL SUB-STEP IMAGES) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  {/* CARD 1: COMPONENTS REQUIRED */}
                  {(currentLesson.partsImg || currentLesson.imgUrl) && (
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>📸 1. רכיבים נדרשים</span>
                        <button 
                          onClick={() => setZoomImageSrc(currentLesson.partsImg || currentLesson.imgUrl)} 
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          🔍 הגדל
                        </button>
                      </div>
                      <div style={{ width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                        <img 
                          src={currentLesson.partsImg || currentLesson.imgUrl} 
                          alt="Components Required"
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD 2: INSTALLATION DIAGRAM */}
                  {currentLesson.assemblyImg && (
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>📐 2. דיאגרמת הרכבה (Diagram)</span>
                        <button 
                          onClick={() => setZoomImageSrc(currentLesson.assemblyImg)} 
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          🔍 הגדל
                        </button>
                      </div>
                      <div style={{ width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                        <img 
                          src={currentLesson.assemblyImg} 
                          alt="Assembly Diagram"
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD 3: PROTOTYPE / FINISHED STEP */}
                  {currentLesson.prototypeImg && (
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>✨ 3. תוצאת השלב (Finished Step)</span>
                        <button 
                          onClick={() => setZoomImageSrc(currentLesson.prototypeImg)} 
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          🔍 הגדל
                        </button>
                      </div>
                      <div style={{ width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                        <img 
                          src={currentLesson.prototypeImg} 
                          alt="Finished Prototype"
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD 4: EXTRA DIAGRAM / WIRING NOTE (IF PRESENT) */}
                  {currentLesson.extraImg && (
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#be123c' }}>⚠️ 4. איור חיווט / הערה מיוחדת</span>
                        <button 
                          onClick={() => setZoomImageSrc(currentLesson.extraImg)} 
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          🔍 הגדל
                        </button>
                      </div>
                      <div style={{ width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                        <img 
                          src={currentLesson.extraImg} 
                          alt="Extra Diagram Note"
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* CODING LESSON CONTENT */}
            {currentLesson.codeTemplate && (
              <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  🎯 משימת התכנות בשיעור זה:
                </h4>
                <p style={{ color: '#334155', fontSize: '1rem', marginBottom: '18px' }}>
                  {currentLesson.goal}
                </p>
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', direction: 'ltr', textAlign: 'left', marginBottom: '24px' }}>
                  <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.92rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {currentLesson.codeTemplate}
                  </pre>
                </div>
                <button onClick={() => setActiveTab('workspace')} className="builder-btn builder-btn-primary" style={{ padding: '14px 24px', fontSize: '0.95rem' }}>
                  🧪 פתח את סביבת העבודה לתרגול המשימה
                </button>
              </div>
            )}

            {!currentLesson.isWelcomePage && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={handleCompleteLesson} className="builder-btn builder-btn-hero" style={{ padding: '16px 36px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #FF007A 0%, #FF758C 100%)' }}>
                  🎉 סיימתי את השיעור! עבר לשיעור הבא ←
                </button>
              </div>
            )}
          </div>

          {/* TAB 2: WORKSPACE (BLOCKS ON LEFT, CODE ON RIGHT) */}
          <div style={{ display: activeTab === 'workspace' ? 'flex' : 'none', flex: 1, flexDirection: 'column', background: '#ffffff', borderRadius: '20px', border: '1.5px solid #cbd5e1', overflow: 'hidden', minHeight: '620px' }}>
            
            {/* TOP WORKSPACE TOOLBAR */}
            <div style={{ padding: '10px 18px', background: '#ffffff', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => { 
                  if (workspace) {
                    const freshCode = generateCodeForWorkspace(workspace);
                    setGeneratedCode(freshCode);
                  }
                  setFlashingMode('flash'); 
                  setShowFlashingModal(true); 
                }} className="builder-btn builder-btn-hero" style={{ background: 'linear-gradient(135deg, #FF007A 0%, #FF758C 100%)' }}>
                  🚀 צרוב ל-ESP32 / בית חכם
                </button>
                <button onClick={() => { 
                  if (workspace) {
                    const freshCode = generateCodeForWorkspace(workspace);
                    setGeneratedCode(freshCode);
                  }
                  setFlashingMode('compile'); 
                  setShowFlashingModal(true); 
                }} className="builder-btn">
                  ⚙️ קמפל קוד
                </button>
                <button onClick={handleDownloadCode} className="builder-btn">
                  📄 הורד קוד (.ino)
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
                  <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="builder-select-box" style={{ padding: '4px 8px', fontWeight: 'bold', color: '#e11d48' }}>
                    <option value="esp32">🔥 ESP32 Dev Module</option>
                    <option value="uno">🤖 Arduino Uno</option>
                  </select>
                </div>

                <button onClick={() => setActiveTab('curriculum')} className="builder-btn">
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
                  id="smarthouseBlocklyDiv"
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
                />
              </div>

              {/* LIVE MONACO C++ SIDE CODE PANEL (RIGHT SIDE) */}
              {isEditorVisible && (
                <div 
                  className="builder-side-code-panel"
                  style={{ width: '420px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #cbd5e1', background: '#0f172a', color: '#ffffff', flexShrink: 0, direction: 'rtl' }}
                >
                  <div className="code-panel-header" style={{ padding: '10px 14px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#ff758c', fontSize: '0.85rem', fontWeight: 'bold' }}>💻 קוד C++ / Arduino בלייב (בית חכם)</span>
                    <button 
                      onClick={() => setIsEditorVisible(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ flex: 1, direction: 'ltr' }}>
                    <MonacoEditor
                      key={generatedCode}
                      width="100%"
                      height="100%"
                      language="cpp"
                      theme="vs-dark"
                      value={generatedCode ? `// 🏠 Keyestudio Smart House IoT Code\n#include <Arduino.h>\n\n${generatedCode}` : `// 🏠 Keyestudio Smart House IoT Code\n#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  // גרור בלוקים למשטח העבודה ליצירת קוד אוטומטית\n}`}
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

            </div>
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
              alt="Zoomed Keyestudio Smart House CAD" 
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
        code={generatedCode}
      />

      {/* 🏠 BEAUTIFUL POPUP SMART HOUSE MODEL SELECTION MODAL */}
      {showKitSelectModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            margin: 0,
            boxSizing: 'border-box',
            direction: 'rtl'
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '28px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 25px 70px rgba(15, 23, 42, 0.35)',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '36px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              margin: 'auto'
            }}
          >
            <div style={{ background: '#ffe4e6', color: '#be123c', padding: '8px 20px', borderRadius: '16px', fontWeight: '800', fontSize: '0.9rem', marginBottom: '16px' }}>
              🏠 בחירת דגם ערכת הבית החכם
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0' }}>
              איזה דגם בית חכם ברשותך?
            </h2>

            <p style={{ color: '#64748b', fontSize: '1.02rem', margin: '0 0 32px 0', maxWidth: '640px', lineHeight: '1.6' }}>
              בחר את סוג הבית החכם שברשותך. המערכת תטעין באופן מותאם אישית את מדריך ההרכבה, התמונות והקוד המתאים!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', width: '100%' }}>
              
              {/* CARD 1: ESP32 BUILT-IN (KS5009) */}
              <div 
                onClick={() => {
                  setSmartHouseKit('ks5009');
                  setSelectedBoard('esp32');
                  setSelectedLessonId('ks_welcome');
                  setShowKitSelectModal(false);
                }}
                style={{
                  background: 'linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)',
                  border: '2.5px solid #fecdd3',
                  borderRadius: '24px',
                  padding: '28px',
                  textAlign: 'right',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(225,29,72,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  position: 'relative'
                }}
              >
                <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#e11d48', color: '#ffffff', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '10px', fontWeight: '800' }}>
                  🔥 מומלץ - ESP32 מובנה
                </span>

                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏡</div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
                    בית חכם עם ESP32 מובנה (KS5009)
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                    ערכת ה-IoT המתקדמת של Keyestudio עם בקר ESP32 PLUS מובנה, 20 שלבי הרכבה מפורטים, חיישני גז, גשם, RFID, מסך LCD1602 ותאורת RGB.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #fecdd3' }}>
                  <span style={{ fontSize: '0.85rem', color: '#be123c', fontWeight: '800' }}>20 שלבי הרכבה CAD + קוד</span>
                  <button style={{ background: '#be123c', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer' }}>
                    בחר בדגם זה ➔
                  </button>
                </div>
              </div>

              {/* CARD 2: ARDUINO UNO EXTERNAL ESP (KS0085) */}
              <div 
                onClick={() => {
                  setSmartHouseKit('ks0085');
                  setSelectedBoard('uno');
                  setSelectedLessonId('ks_welcome');
                  setShowKitSelectModal(false);
                }}
                style={{
                  background: 'linear-gradient(145deg, #ffffff 0%, #e0e7ff 100%)',
                  border: '2.5px solid #c7d2fe',
                  borderRadius: '24px',
                  padding: '28px',
                  textAlign: 'right',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(99,102,241,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  position: 'relative'
                }}
              >
                <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#4338ca', color: '#ffffff', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '10px', fontWeight: '800' }}>
                  🔌 Arduino UNO + ESP8266
                </span>

                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔌</div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
                    בית חכם עם Arduino (KS0085)
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                    ערכת הבית החכם המסורתית המבוססת על בקר Arduino UNO עם כרטיס הרחבה חיצוני תקשורת ESP8266 Wi-Fi וחיישנים בסיסיים.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #c7d2fe' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: '800' }}>בקר Arduino UNO רשמי</span>
                  <button style={{ background: '#4338ca', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer' }}>
                    בחר בדגם זה ➔
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Smarthouse;