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
import { TURTLE_HERO } from './projectImages';

// Base CDN Image URL for SuperBot Smart Robot
const SUPERBOT_IMG_BASE = 'https://docs.freenove.com/projects/fnk0053/en/latest/_images/';

// Pre-register all system blocks at top-level module evaluation
registerAllBlocks();

// COMPLETE 10 CODING LESSONS FOR CHAPTER 2 WITH SHORT BLOCK NAMES & NEEDED BLOCKS LIST
const SUPERBOT_CHAPTER_2_LESSONS = [
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
    codeTemplate: `// 🎯 קוד C++ המיועד להיווצר:\nvoid setup() {\n  bot.begin();\n  bot.moveHead(45, 90);\n  delay(500);\n  bot.moveHead(135, 90);\n  delay(500);\n  bot.moveHead(90, 90);\n}\n\nvoid loop() {}`
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

const KS0558_IMG_BASE = 'https://docs.keyestudio.com/projects/KS0558/en/latest/_images/';

const SUPERBOT_ASSEMBLY_STEPS = [
  // --- WELCOME PAGE ---
  {
    id: 'step_0.0',
    title: '✨ ברוכים הבאים לפרויקט רובוט צב חכם Keyestudio (KS0558 V3.0)!',
    isWelcomePage: true,
    videoUrl: 'https://video.aliexpress-media.com/play/u/ae_sg_item/17380998799/p/1/e/6/t/10301/1100092417021.mp4?from=chrome&definition=h265',
    videoLink: 'https://video.aliexpress-media.com/play/u/ae_sg_item/17380998799/p/1/e/6/t/10301/1100092417021.mp4?from=chrome&definition=h265',
    welcomeText: 'ברוכים הבאים לעולם הרובוטיקה הניידת! בפרויקט זה תבנו צעד-אחר-צעד את רובוט הצב החכם Keyestudio KS0558 V3.0. תלמדו להרכיב את השלדה, המנועים, גלגלי הניווט, חיישני עקיפת מכשולים אולטרסוניים, חיישני מעקב קו, ומטריצת הלדים 8x8!',
    features: [
      { icon: '🐢', title: 'בנייה מכאנית צעד-אחר-צעד', desc: 'כל שלבי הרכבת המנועים, התושבות והגלגלים עם תמונות CAD מפורטות.' },
      { icon: '📡', title: 'חיישנים וניווט אוטונומי', desc: 'תכנות עקיפת מכשולים בעזרת חיישן אולטרסוני ומעקב אחר קו שחור.' },
      { icon: '💡', title: 'תצוגת מטריצת לדים 8x8', desc: 'תכנות פרצופים חמודים, אייקונים והתרעות קוליות בזמן אמת.' },
      { icon: '🕹️', title: 'שלט רחוק ו-Bluetooth', desc: 'בקרת ניווט מלאה דרך שלט IR או אפליקציה סלולרית ב-Bluetooth.' }
    ]
  },
  // --- STEP 1 ---
  { 
    id: 'step_1.1', 
    title: 'שלב 1.1: רשימת רכיבים להרכבת השלדה התחתית (Bottom Motor Wheel - Parts)', 
    partsNeeded: ['ברגי M3*6mm עגולים x2', 'אומים M3 x2', 'שלדת PCB תחתית x1', 'חיישן עוקב קו Tracking Sensor x1', 'גלגלי ניווט כדוריים Universal Casters x2'], 
    instructions: [
      'המציאו ורכזו את כל הרכיבים הנדרשים לשלב 1: לוח PCB תחתון, חיישן מעקב קו ושני גלגלי ניווט כדוריים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_01.png` 
  },
  { 
    id: 'step_1.2', 
    title: 'שלב 1.2: חיבור חיישן מעקב הקו וגלגלי הניווט (Bottom Motor Wheel - Assembly)', 
    partsNeeded: ['שלדת PCB תחתית', 'חיישן עוקב קו', 'גלגלי ניווט כדוריים x2'], 
    instructions: [
      '1. התקן את שני גלגלי הניווט הכדוריים בחלק האחורי של הלוח התחתון.',
      '2. חבר את מודול חיישן עוקב הקו (Tracking Sensor) בחזית הלוח התחתון בעזרת 2 ברגי M3*6mm ואומים M3.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_01.png` 
  },

  // --- STEP 2 ---
  { 
    id: 'step_2.1', 
    title: 'שלב 2.1: רשימת רכיבים להרכבת המנועים ובית הסוללות (Assemble Parts - Required)', 
    partsNeeded: ['אומים M2 x4', 'מנועי גיר 12FN20 N20 x2', 'תושבות מתכת U-type x2', 'גלגלי גומי N20 x2', 'כבלי 2P מנועים x2', 'כבל 5P x1', 'ברגי M2*12mm עגולים x4', 'בית סוללות 18650 x1', 'ברגי M3*10mm שטוחים x2', 'אומים M3 x2'], 
    instructions: [
      'רכזו את מנועי ה-N20, תושבות המתכת U-type, הגלגלים, בית הסוללות 18650 והברגים המתאימים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_07.png` 
  },
  { 
    id: 'step_2.2', 
    title: 'שלב 2.2: חיזוק תושבות המתכת U-type למנועי ה-N20 (Motors & Bracket Mount)', 
    partsNeeded: ['מנועי N20 x2', 'תושבות U-type x2'], 
    instructions: [
      'הלבישו את תושבות המתכת U-type על שני מנועי ה-12FN20 N20 והדקו בעזרת ברגי M2*12mm ואומים M2.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_07.png` 
  },
  { 
    id: 'step_2.3', 
    title: 'שלב 2.3: הידוק המנועים לשלדת ה-PCB התחתית (Securing Motors to Chassis)', 
    partsNeeded: ['שלדת PCB תחתית', 'מנועי N20 מורכבים', 'ברגי M2*12mm x4'], 
    instructions: [
      'מקמו את שני המנועים בחורים המיועדים בצידי הלוח התחתון והדקו היטב בברגים ואומים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_08.png` 
  },
  { 
    id: 'step_2.4', 
    title: 'שלב 2.4: חיבור כבלי ה-2P למנועי ה-DC (Motor Wiring)', 
    partsNeeded: ['כבלי 2P מנועים x2'], 
    instructions: [
      'חברו את שני כבלי ה-2P לחיבורי החשמל של מנועי ה-N20 מימין ומשמאל.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_09.png` 
  },
  { 
    id: 'step_2.5', 
    title: 'שלב 2.5: הרכבת 2 גלגלי הגומי N20 לצירי המנועים (Mounting Rubber Wheels)', 
    partsNeeded: ['גלגלי גומי N20 x2'], 
    instructions: [
      'דחפו והרכיבו את גלגלי הגומי לצירי מנועי ה-N20 עד להתאמה מלאה.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_10.png` 
  },
  { 
    id: 'step_2.6', 
    title: 'שלב 2.6: התקנת בית הסוללות 18650 במרכז הלוח (Mounting Battery Holder)', 
    partsNeeded: ['בית סוללות 18650 x1', 'ברגי M3*10mm שטוחים x2', 'אומים M3 x2'], 
    instructions: [
      'מקמו את בית הסוללות במרכז השלדה והדקו בעזרת ברגי M3*10mm שטוחים מלמעלה ואומים מלמטה.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_11.png` 
  },
  { 
    id: 'step_2.7', 
    title: 'שלב 2.7: ניתוח והעברת הכבלים דרך חריצי השלדה (Cable Routing)', 
    partsNeeded: ['כבלי 2P מנועים', 'כבל סוללה'], 
    instructions: [
      'העבירו את כבלי המנועים וכבל הסוללה דרך חריצי הלוח למעלה לקראת החיבור ללוח הבקר.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_12.png` 
  },

  // --- STEP 3 ---
  { 
    id: 'step_3.1', 
    title: 'שלב 3.1: רשימת רכיבים ללוח העליון (Install Top PCB - Required)', 
    partsNeeded: ['לוח PCB עליון Top PCB x1', 'ברגי M3*6mm עגולים x8', 'עמודי נחושת M3*10mm Dual-pass x8'], 
    instructions: [
      'רכזו את לוח ה-PCB העליון, 8 עמודי הנחושת 10 מ"מ ו-8 ברגי M3*6mm.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_15.png` 
  },
  { 
    id: 'step_3.2', 
    title: 'שלב 3.2: חיזוק עמודי הנחושת והרכבת הלוח העליון (Fastening Top PCB)', 
    partsNeeded: ['עמודי נחושת M3*10mm x8', 'לוח PCB עליון', 'ברגי M3*6mm x8'], 
    instructions: [
      '1. הברגו 8 עמודי נחושת M3*10mm בחורים ההיקפיים של הלוח התחתון.',
      '2. הציבו את לוח ה-PCB העליון מעל עמודי הנחושת והדקו בברגי M3*6mm עגולים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_15.png` 
  },

  // --- STEP 4 ---
  { 
    id: 'step_4.1', 
    title: 'שלב 4.1: רשימת רכיבים ללוח הבקר וכרטיס ההרחבה (Mount Control Board - Required)', 
    partsNeeded: ['לוח בקר ראשי V4.0 Board (תואם UNO) x1', 'לוח הרחבת מנועים 8833 Motor Drive Shield x1', 'ברגי M3*6mm עגולים x4'], 
    instructions: [
      'רכזו את לוח הבקר V4.0, כרטיס הרחבת המנועים 8833 וברגי M3*6mm.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_27.png` 
  },
  { 
    id: 'step_4.2', 
    title: 'שלב 4.2: חיבור לוח הבקר הראשי V4.0 ללוח העליון (Securing Control Board)', 
    partsNeeded: ['לוח V4.0 Board', 'ברגי M3*6mm x4'], 
    instructions: [
      'התקינו את לוח הבקר V4.0 על גבי הלוח העליון והדקו בעזרת 4 ברגי M3*6mm.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_27.png` 
  },
  { 
    id: 'step_4.3', 
    title: 'שלב 4.3: חיבור כרטיס הרחבת המנועים 8833 Shield (Plugging Motor Shield)', 
    partsNeeded: ['8833 Motor Drive Shield'], 
    instructions: [
      'חברו בזהירות את כרטיס ההרחבה 8833 Shield ישירות מעל פיני התקשורת של לוח ה-V4.0.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_28.png` 
  },

  // --- STEP 5 ---
  { 
    id: 'step_5.1', 
    title: 'שלב 5.1: רשימת רכיבים לתושבת הסרוו והחיישן האולטרסוני (Servo Plastic Platform - Required)', 
    partsNeeded: ['מנוע סרוו Servo SG90 x1', 'בורג M2*4 (מארז סרוו) x1', 'אזיקונים שחורים x2', 'חיישן אולטרסוני Ultrasonic x1', 'תושבת פלסטיק שחורה לראש x1', 'ברגי הברזה M1.2*4 x4', 'ברגי הברזה M2*8 x2'], 
    instructions: [
      'רכזו את מנוע הסרוו, חיישן האולטרסוניק, תושבת הפלסטיק השחורה והברגים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_30.png` 
  },
  { 
    id: 'step_5.2', 
    title: 'שלב 5.2: הרכבת מנוע הסרוו לתושבת הפלסטיק השחורה (Mounting Servo to Platform)', 
    partsNeeded: ['תושבת פלסטיק שחורה', 'מנוע סרוו SG90', 'ברגי M1.2*4 x4'], 
    instructions: [
      'הכניסו את מנוע הסרוו לתושבת הפלסטיק והדקו היטב בעזרת 4 ברגי M1.2*4.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_30.png` 
  },
  { 
    id: 'step_5.3', 
    title: 'שלב 5.3: חיזוק חיישן האולטרסוניק לתושבת בעזרת אזיקונים (Ultrasonic Sensor Attachment)', 
    partsNeeded: ['חיישן אולטרסוניק', 'אזיקונים שחורים x2'], 
    instructions: [
      'הציבו את חיישן האולטרסוניק בחזית התושבת וחזקו אותו בעזרת 2 אזיקונים שחורים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_30-1.png` 
  },
  { 
    id: 'step_5.4', 
    title: 'שלב 5.4: הרכבת זרוע הסרוו עם בורג M2*4 (Mounting Servo Horn)', 
    partsNeeded: ['זרוע סרוו', 'בורג M2*4'], 
    instructions: [
      'חברו את זרוע הסרוו לציר מנוע הסרוו והדקו במרכז בעזרת בורג M2*4.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_31.png` 
  },
  { 
    id: 'step_5.5', 
    title: 'שלב 5.5: יישור מנוע הסרוו לזווית 90° מרכזית (Servo 90° Alignment)', 
    partsNeeded: ['מנוע סרוו SG90', 'תושבת ראש פלסטיק'], 
    instructions: [
      '1. סובבו בעדינות את ציר מנוע הסרוו עד למרכז הטווח שלו.',
      '2. וודאו שזרוע מנוע הסרוו מיושרת ישר קדימה בזווית של 90° בדיוק לקראת הרכבת הראש.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_32.png` 
  },
  { 
    id: 'step_5.6', 
    title: 'שלב 5.6: ניתוק כבל הסרוו לאחר איפוס (Disconnect Servo Wire)', 
    partsNeeded: ['כבל סרוו'], 
    instructions: [
      'לאחר שזרוע הסרוו הסתובבה והתיישרה ל-90°, נתקו זמנית את כבל הסרוו לצורך ההרכבה המכאנית.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_33.png` 
  },
  { 
    id: 'step_5.7', 
    title: 'שלב 5.7: חיבור תושבת הראש המורכבת לשלדת הרובוט (Attaching Head Assembly)', 
    partsNeeded: ['תושבת ראש מורכבת', 'ברגי M2*8 x2'], 
    instructions: [
      'חברו את תושבת הראש המורכבת לחלק הקדמי של הלוח העליון והדקו בברגי M2*8.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_34.png` 
  },

  // --- STEP 6 ---
  { 
    id: 'step_6.1', 
    title: 'שלב 6.1: רשימת רכיבים להרכבה סופית (Final Assembly - Required)', 
    partsNeeded: ['כבלי דופונט 20CM F-F x4', 'ברגי M3*6mm עגולים x12', 'עמודי נחושת M3*40mm x4', 'מודול בלוטות\' Bluetooth x1', 'מטריצת לדים 8x8 Dot Matrix x1', 'גשרים Jumper Caps x8'], 
    instructions: [
      'רכזו את מודול מטריצת הלדים 8x8, מודול הבלוטות\', 4 עמודי נחושת 40 מ"מ והברגים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_42.png` 
  },
  { 
    id: 'step_6.2', 
    title: 'שלב 6.2: הברגת 4 עמודי נחושת M3*40mm היקפיים (Installing Long Copper Pillars)', 
    partsNeeded: ['עמודי נחושת M3*40mm x4', 'ברגי M3*6mm x4'], 
    instructions: [
      'הברגו 4 עמודי נחושת ארוכים M3*40mm בארבע פינות הלוח העליון.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_42.png` 
  },
  { 
    id: '6.3', 
    title: 'שלב 6.3: התקנת מודול תצוגת מטריצת הלדים 8*8 בחזית (Mounting 8x8 Matrix Display)', 
    partsNeeded: ['מודול 8x8 Dot Matrix', 'ברגי M3*6mm x2'], 
    instructions: [
      'הרכיבו את מודול תצוגת מטריצת הלדים 8*8 בחזית תושבת הראש להצגת הבעות ופרצופים.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_43.png` 
  },
  { 
    id: '6.4', 
    title: 'שלב 6.4: חיבור מודול הבלוטות\' DX-BT24 ללוח ההרחבה (Plugging Bluetooth Module)', 
    partsNeeded: ['מודול בלוטות\' DX-BT24 BLE'], 
    instructions: [
      'חברו את מודול הבלוטות\' DX-BT24 לשקע הבלוטות\' הייעודי בלוח הרחבת המנועים 8833.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_47.png` 
  },
  { 
    id: '6.5', 
    title: 'שלב 6.5: סגירת לוח האקריליק העליון בברגים (Mounting Top Acrylic Cover)', 
    partsNeeded: ['כיסוי אקריליק עליון', 'ברגי M3*6mm x4'], 
    instructions: [
      'הציבו את כיסוי האקריליק מעל 4 עמודי הנחושת 40 מ"מ והדקו בברגי M3*6mm.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_48.png` 
  },

  // --- STEP 7 ---
  { 
    id: '7.1', 
    title: 'שלב 7.1: חיבור כבלי המנועים ללוח ה-8833 Driver (Wiring Motors to Shield)', 
    partsNeeded: ['כבלי 2P מנוע ימין ושמאל'], 
    instructions: [
      'חברו את כבל מנוע שמאל ליציאת Motor A ואת כבל מנוע ימין ליציאת Motor B בלוח ה-8833 Shield.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_63.png` 
  },
  { 
    id: '7.2', 
    title: 'שלב 7.2: חיבור כבל חיישן מעקב הקו 5P (Wiring Tracking Sensor)', 
    partsNeeded: ['כבל 5P חיישן קו'], 
    instructions: [
      'חברו את כבל ה-5P של חיישן מעקב הקו משלדת הבסיס לפיני התקשורת A0, A1, A2 בלוח ה-Shield.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_64.png` 
  },
  { 
    id: '7.3', 
    title: 'שלב 7.3: חיבור כבל חיישן האולטרסוניק (Wiring Ultrasonic Sensor)', 
    partsNeeded: ['כבל 4P אולטרסוניק'], 
    instructions: [
      'חברו את כבל חיישן האולטרסוניק: VCC->5V, GND->GND, Trig->D12, Echo->D13.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_65.png` 
  },
  { 
    id: '7.4', 
    title: 'שלב 7.4: חיבור כבל מנוע הסרוו לפין D10 (Wiring Servo to D10)', 
    partsNeeded: ['כבל 3P סרוו'], 
    instructions: [
      'חברו את כבל מנוע הסרוו SG90 לשקע הסרוו פין D10 (שימו לב לכיוון: חום->GND, אדום->VCC, כתום->Signal).'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_66.png` 
  },
  { 
    id: '7.5', 
    title: 'שלב 7.5: חיבור כבלי מטריצת הלדים 8*8 לפיני I2C A4/A5 (Wiring 8x8 Matrix)', 
    partsNeeded: ['כבלי דופונט מטריצה'], 
    instructions: [
      'חברו את מטריצת הלדים 8*8 לפיני התקשורת I2C: SDA->A4, SCL->A5.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_67.png` 
  },
  { 
    id: '7.6', 
    title: 'שלב 7.6: חיבור תקע החשמל של בית הסוללות לשקע ה-DC (Connecting Power Plug)', 
    partsNeeded: ['כבל תקע סוללה DC'], 
    instructions: [
      'הכניסו את תקע החשמל מבית הסוללות 18650 ישירות לשקע ה-DC Power בלוח ה-V4.0.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_69.png` 
  },
  { 
    id: '7.7', 
    title: 'שלב 7.7: הגדרת גשרי ה-Jumpers למתח מנועים ובלוטות\' (Configuring Jumpers & Diagram)', 
    partsNeeded: ['גשרים Jumper Caps'], 
    instructions: [
      '1. וודאו שגשרי ה-Jumper Caps מורכבים במצב VIN לבחירת מתח סוללות עבור המנועים.',
      '2. עיינו בדיאגרמת החיווט הכוללת להפניה מהירה.'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_50.png` 
  },

  // --- STEP 8 ---
  { 
    id: '8.1', 
    title: 'שלב 8.1: סיום ההרכבה, הכנסת סוללות 18650 ובדיקת תקינות (Complete Smart Robot Car)', 
    partsNeeded: ['סוללות 18650 נטענות x2', 'רובוט חכם מורכב מוכן'], 
    instructions: [
      '1. הכניסו 2 סוללות 18650 נטענות בלחיצה לבית הסוללות.',
      '2. הפעילו את מתג ההפעלה הראשי. ברכות! הרובוט החכם מורכב ב-100% ומוכן לצריבת קוד!'
    ], 
    imgUrl: `${KS0558_IMG_BASE}ZnNc_68.png` 
  }
];

const SUPERBOT_CHAPTER_3_PROJECTS = [
  { id: '3.1', title: 'שיעור 3.1: רובוט אוטונומי חומק ממכשולים בחלל', goal: 'אלגוריתם עקיפת מכשולים אוטונומי מלא בעזרת bot.getDistance() ו-bot.turnRight().' },
  { id: '3.2', title: 'שיעור 3.2: רובוט אוטונומי עוקב קו שחור', goal: 'אלגוריתם עוקב קו בעזרת bot.checkLine().' },
  { id: '3.3', title: 'שיעור 3.3: מכונית שלט רחוק אינפרא-אדום מלאה', goal: 'שליטה מלאה בנהיגה דרך שלט IR בעזרת bot.getIRCommand().' },
  { id: '3.4', title: 'שיעור 3.4: רובוט מצלמה Wi-Fi אינטראקטיבי', goal: 'שליטה וצפייה בוידאו חי ממצלמת הרובוט בדפדפן.' }
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
      { step: '4', title: 'הגדרת הרשאות גישה (Security Rules)', desc: 'במסךבחירת ההרשאות בחר ב-"Start in test mode" (מצב ניסיון) כך שהרשאות הקריאה והכתיבה יוגדרו כציבוריות (.read: true, .write: true).' },
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

const SUPERBOT_CHAPTERS = [
  { id: 'ch1', title: '🛠️ פרק 1: הרכבה מכאנית וזיווד מפורט - Keyestudio KS0558 Smart Little Turtle Robot V3.0 (Smart Robot)', description: 'מדריך הרכבה מקיף צעד-אחר-צעד עם תמונות ברזולוציה גבוהה ורשימת רכיבים מלאה לפי תיעוד Keyestudio הרשמי', lessons: SUPERBOT_ASSEMBLY_STEPS },
  { id: 'ch2', title: '💻 פרק 2: תכנות חיישנים ומודולים ב-Smart Robot (10 שיעורים)', description: 'שיעורי תכנות בבלוקים ובקוד C++ לפי ספריית SuperBot', lessons: SUPERBOT_CHAPTER_2_LESSONS },
  { id: 'ch3', title: '🚀 פרק 3: פרויקטים אוטונומיים מתקדמים ב-Smart Robot', description: 'פרויקטים אוטונומיים משולבים', lessons: SUPERBOT_CHAPTER_3_PROJECTS },
  { id: 'ch4', title: '🔥 פרק 4: תקשורת ענן ו-Firebase IoT (5 שיעורים + מדריך פתיחת פרויקט)', description: 'חיבור בקר ESP32 לבסיס נתונים בענן ב-Firebase Realtime Database לשליטה ודיווח בזמן אמת', lessons: FIREBASE_CHAPTER_4_LESSONS }
];

function RobotSmall() {
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
  const [filename, setFilename] = useState('superbot_code.ino');
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

  SUPERBOT_CHAPTERS.forEach(ch => {
    ch.lessons.forEach(l => {
      if (l.id === selectedLessonId) {
        currentLesson = l;
        currentChapter = ch;
      }
    });
  });

  if (!currentLesson) {
    currentLesson = SUPERBOT_CHAPTER_2_LESSONS[0];
    currentChapter = SUPERBOT_CHAPTERS[1];
  }

  // Calculate Total Lessons across all chapters
  let totalLessonsCount = 0;
  SUPERBOT_CHAPTERS.forEach(ch => { totalLessonsCount += ch.lessons.length; });

  // Load clean & focused robot toolbox configuration
  const loadToolboxConfiguration = () => {
    registerAllBlocks();

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
    SUPERBOT_CHAPTERS.forEach(ch => allLessons.push(...ch.lessons));
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

    const mainName = filename || "superbot_code.ino";
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
            }} className="builder-btn builder-btn-hero" style={{ background: 'linear-gradient(135deg, #FF9900 0%, #FF5500 100%)' }}>
              🚀 צרוב ל-SuperBot / ESP32
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
            <button onClick={() => setShowSendEmailModal(true)} className="builder-btn" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}>
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
              <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="builder-select-box" style={{ padding: '4px 8px', fontWeight: 'bold', color: '#ea580c' }}>
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
              id="superbotBlocklyDiv"
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
                <span style={{ color: '#ff9900', fontSize: '0.85rem', fontWeight: 'bold' }}>💻 עורך קוד מרובה קבצים (SuperBot C++)</span>
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
                    color: activeFileTab === 'main' ? '#ff9900' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'main' ? '2px solid #ff9900' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  📄 {filename || 'superbot_code.ino'}
                </button>

                <button
                  onClick={() => setActiveFileTab('header')}
                  style={{
                    padding: '8px 12px',
                    background: activeFileTab === 'header' ? '#1e293b' : 'transparent',
                    color: activeFileTab === 'header' ? '#ff9900' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'header' ? '2px solid #ff9900' : '2px solid transparent',
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
                    color: activeFileTab === 'cpp' ? '#ff9900' : '#94a3b8',
                    border: 'none',
                    borderBottom: activeFileTab === 'cpp' ? '2px solid #ff9900' : '2px solid transparent',
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
              🤖 רובוט חכם (SuperBot Smart Robot)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              ספריית SuperBot C++ | {currentChapter.title} - {currentLesson.title}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="builder-controls-wrapper" style={{ gap: '10px' }}>
          <button 
            onClick={() => setShowAIModal(true)}
            className="builder-btn builder-btn-hero"
            style={{ background: 'linear-gradient(135deg, #FF9900 0%, #FF5500 100%)', color: '#ffffff', border: 'none', fontWeight: '800' }}
          >
            ✨ מחולל AI לבלוקים
          </button>

          <span className="builder-btn builder-btn-hero" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
            📚 תוכנית הלימודים והשיעורים (SuperBot)
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* 📜 SIDEBAR: ALL LESSONS TRACKER (HIDDEN ON WELCOME LANDING PAGE FOR 100% FULL WIDTH) */}
        {!currentLesson.isWelcomePage && (
          <div style={{ width: '340px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>🤖 תוכנית השיעורים (SuperBot)</h3>
              <div style={{ fontSize: '0.78rem', color: '#ff9900', marginTop: '4px' }}>
                {Object.keys(completedLessons).length} מתוך {totalLessonsCount} שיעורים הושלמו
              </div>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SUPERBOT_CHAPTERS.map(ch => (
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
                            background: isSelected ? '#ffedd5' : '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: isSelected ? '4px solid #f97316' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? '800' : '500',
                            color: isSelected ? '#c2410c' : '#475569'
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
                  <span style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px', background: '#ffedd5', color: '#ea580c', fontWeight: 'bold' }}>
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
              <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #ea580c 100%)', color: '#ffffff', padding: '48px 32px', direction: 'rtl', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* HERO BANNER & SHOWCASE */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '36px', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)', color: '#fdba74', fontSize: '0.9rem', fontWeight: '800', marginBottom: '20px' }}>
                        ✨ ברוכים הבאים לעולם הרובוטיקה והפיתוח העתידני
                      </div>

                      <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: '900', lineHeight: '1.2', margin: '0 0 18px 0', background: 'linear-gradient(135deg, #ffffff 0%, #fdba74 60%, #ff9900 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🤖 רובוט צב חכם Keyestudio (KS0558 V3.0)
                      </h1>

                      <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: '1.8', margin: '0 0 32px 0', fontWeight: '400' }}>
                        כנס לעולם הרובוטיקה הניידת! הרכב במו ידיך את רובוט הצב החכם V3.0, חבר חיישני אולטרסוניק לזיהוי ועקיפת מכשולים, תכנת מטריצת לדים 8x8 להצגת פרצופים חמודים, ושלול ברובוט מרחוק דרך שלט IR ו-Bluetooth!
                      </p>

                      <button 
                        onClick={() => setSelectedLessonId('step_1.1')} 
                        style={{ padding: '18px 42px', borderRadius: '16px', background: 'linear-gradient(135deg, #FF9900 0%, #FF5500 100%)', color: '#ffffff', border: 'none', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer', boxShadow: '0 12px 35px rgba(255, 153, 0, 0.45)', transition: 'all 0.3s ease' }}
                      >
                        🚀 היכנס לעולם הרובוטיקה והתחל בהרכבה צעד-אחר-צעד ➔
                      </button>
                    </div>

                    {/* HERO PROTOTYPE SHOWCASE CARD */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '2px solid rgba(251, 146, 60, 0.3)', borderRadius: '28px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fdba74', fontWeight: '800', marginBottom: '12px' }}>
                        📸 דגם מוגמר סופי - Smart Turtle Robot V3.0
                      </span>
                      <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px' }}>
                        <img 
                          src={TURTLE_HERO} 
                          alt="Smart Turtle Robot Prototype"
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
                  <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '2px solid rgba(251, 146, 60, 0.3)', borderRadius: '28px', padding: '28px', backdropFilter: 'blur(20px)', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', padding: '0 8px' }}>
                      <span style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.2rem' }}>
                        🎬 סרטון הדגמה בלייב: רובוט הצב החכם בפעולה!
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
                
                {/* CAD IMAGE COLUMN */}
                <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      📐 תמונת הרכבה מקורית (Keyestudio KS0558 Docs):
                    </h4>
                    <button 
                      onClick={() => setZoomImageSrc(currentLesson.imgUrl)} 
                      className="builder-btn"
                      style={{ padding: '8px 18px', fontSize: '0.85rem', background: '#fff7ed', color: '#c2410c', fontWeight: '800', border: '1.5px solid #ffedd5' }}
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
                    <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '18px', border: '1.5px solid #ffedd5', display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#c2410c', margin: 0, marginBottom: '14px' }}>
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
                              color: '#7c2d12', 
                              fontSize: '0.92rem', 
                              fontWeight: '800', 
                              border: '2px solid #f97316',
                              boxShadow: '0 4px 12px rgba(249,115,22,0.08)',
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
                    <div style={{ color: '#ff9900', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
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
                  style={{ padding: '16px 32px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #FF9900 0%, #FF5500 100%)', boxShadow: '0 10px 25px rgba(249,115,22,0.3)' }}
                >
                  🧪 פתח את סביבת העבודה לתרגול המשימה בחלונית חדשה ↗
                </button>
              </div>
            )}

            {!currentLesson.isWelcomePage && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={handleCompleteLesson} className="builder-btn builder-btn-hero" style={{ padding: '16px 36px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #FF9900 0%, #FF5500 100%)' }}>
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
              alt="Zoomed SuperBot Schematic" 
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

export default RobotSmall;