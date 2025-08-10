import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import MonacoEditor from 'react-monaco-editor';
import ReactFlow, { Controls, Background } from 'react-flow-renderer';
import BlockObject from './BlockObject'; // ייבוא המחלקה


// Define these outside of the Builder component
const nodeTypes = {
  // customNode: CustomNodeComponent, // Replace with your actual node component
};

const edgeTypes = {
  // customEdge: CustomEdgeComponent, // Replace with your actual edge component
};

function Builder({ initialXml }) {
  const blocklyDiv = useRef(null);
  const blocklyArea = useRef(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [workspace, setWorkspace] = useState(null);
  const [toolboxConfiguration, setToolboxConfiguration] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [filename, setFilename] = useState('arduino_code.ino');
  const saveWorkspaceRef = useRef(null);
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);

  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockColor, setNewBlockColor] = useState('#4286f4');
  const [newBlockTooltip, setNewBlockTooltip] = useState('');
  const [newBlockCode, setNewBlockCode] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('My Category');







 
const baseCode = `
#include <LCD_I2C.h>
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/RTDBHelper.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <math.h>  // Include the math library

// #define echoPin 2
// #define trigPin 4
#define WIFI_SSID "alina"
#define WIFI_PASSWORD "0523611662"
#define DATABASE_URL "smarthouse-85b56-default-rtdb.firebaseio.com"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

LCD_I2C lcd(0x27, 16, 2);

const float R0 = 100.0;                      // Resistance at 100% steam (adjust this value)
const float B = 3950.0;                      // Thermistor B value (check your sensor's datasheet)
const float REFERENCE_TEMPERATURE = 298.15;  // Temperature in Kelvin at 25°C (298.15 K) - RENAMED!
const float VCC = 3.3;
// Variables
float temperatureCelsius = 0.0;

const int pwmChannel = 0;     // ערוץ PWM (בנוסף יש גם 0 עד 15)
const int pwmFreq = 5000;     // תדר PWM (לדוגמה 5000Hz)
const int pwmResolution = 8;  // רזולוציית PWM בבתים (0-255)

const int gasssensoreA032 = 32;
const int withledpin2 = 2;
const int yelowledpin12 = 12;
const int buzzer4 = 4;
const int button16 = 16;
const int button27 = 27;
const int motionsensore14 = 14;
const int fanpin19 = 19;
const int fanpin18 = 18;
const int lightsensore35 = 35;
const int watersensore34 = 34;
const int lcdSDA = 21;
const int lcdSCL = 22;
int gassValue = 0;
int witheledValue = 0;
int yelowLedValue = 0;
int finaldata = 0;
int lightsensoreValue = 0;
int code1 = 8;
int code2 = 7;
int code3 = 5;
int code4 = 4;
// int currentDigitIndex = 0;
Servo windowServo;
Servo doorServo;
float f;

int code[4] = {0, 0, 0, 0};  // קוד בן 4 ספרות
int currentDigitIndex = 0;      // אינדקס של הספרה הנוכחית
bool codeEntered = false;       // דגל שמסמן אם הקוד הוזן
bool correctCodeEntered = false;  // דגל שמסמן שהקוד הנכון הוזן
// **GLOBAL_VARIABLES**



void setup() {
  Serial.begin(115200);

  // Pin modes
  pinMode(gasssensoreA032, INPUT);
  pinMode(buzzer4, OUTPUT);
  pinMode(withledpin2, OUTPUT);
  pinMode(fanpin19, OUTPUT);
  pinMode(fanpin18, OUTPUT);
  pinMode(motionsensore14, INPUT);
  doorServo.attach(5);
  windowServo.attach(13);

  lcd.begin();
  lcd.display();
  lcd.backlight();
  setdata("0", "/smart_house/motionValue");

   // **SETUP_CODE**
}

    

void loop() {

// **LOOP_CODE** 

 
}


//-------------------------------------------------------  אזור הפונקציות --------------------------------------------------------------------
//---------------פונקציות לשימוש -----------------------------

// Function to read temperature from the steam sensor in Celsius
int getSteamSensorTemperature(int numofPin) {
  int sensorValue = analogRead(numofPin);
  sensorValue = constrain(sensorValue, 0, 2000);
  float temperatureCelsius = map(sensorValue, 0, 2000, 0, 100);
  return (int)temperatureCelsius;
}

//פונקציה להמרה הערך של חיישן גז
int getGasSensorValue(int gasPin) {
  int sensorValue = analogRead(gasPin);
  Serial.print("Gas Sensor Value: ");
  Serial.println(sensorValue);

  return sensorValue;
}

//פונקציה להמרה הערך של חיישן אור
int calculateLux(int pinNumber) {
  int sensorValue = analogRead(pinNumber);
  float lux = map(sensorValue, 0, 1023, 0, 1000);
  Serial.print("lux = ");
  Serial.println(lux);
  return int(lux);
}

// שני טקסט - פונקציה להדפסה למסך LCD
void printLCD(String FirsRwoText, String SecendRowText) {
  lcd.clear();
  lcd.setCursor(2, 0);  //Set cursor to character 2 on line 0
  lcd.print(FirsRwoText);

  lcd.setCursor(2, 1);  //Move cursor to character 2 on line 1
  lcd.print(SecendRowText);

  delay(1000);
}

// מספר וטקסט - פונקציה להדפסה למסך LCD
void printLCDINT(int FirsRwoText, String SecendRowText) {
  lcd.clear();
  // Print a message on both lines of the LCD.
  lcd.setCursor(2, 0);  //Set cursor to character 2 on line 0
  lcd.print(FirsRwoText);

  lcd.setCursor(2, 1);  //Move cursor to character 2 on line 1
  lcd.print(SecendRowText);

  delay(1000);
}

//פונקציה לקבלת מידע מה- database
int getdata(String DataLink) {
  if (Firebase.getString(fbdo, DataLink)) {
    String data = fbdo.stringData();
    finaldata = data.toInt();
  }
  return finaldata;
}
//פונקציה הכנסת מידע ל - database
void setdata(String value, String DataLink) {
  if (Firebase.setString(fbdo, DataLink, value)) {
    Serial.println("Alarm status updated successfully");
  } else {
    Serial.println("Failed to update alarm status: ");
  }
}

// פונקציה לעדכון ה LCD
void updateLCDPassword() {
  lcd.setCursor(0, 0);
  lcd.print("Enter code:");
  lcd.setCursor(0, 1);
  for (int i = 0; i < 4; i++) {
    lcd.print(code[i]);
  }
  lcd.setCursor(currentDigitIndex, 1);
  // lcd.print("_");
}
//פונקציה לטיפול בלחיצות כפתורים
void handleButtonPresses(int port1, int port2, int code1, int code2, int code3, int code4) {
  // קריאת מצב הכפתורים
  bool button1Pressed = digitalRead(port1) == LOW;
  bool button2Pressed = digitalRead(port2) == LOW;

  // טיפול בקפיצות כפתורים - הקטנת השהייה
  delay(100);

  // אם כפתור 1 נלחץ, הגדל את הספרה הנוכחית
  if (button1Pressed) {
    code[currentDigitIndex]++;
    if (code[currentDigitIndex] > 9) {
      code[currentDigitIndex] = 0;
    }
     updateLCDPassword();
     Serial.println(code[currentDigitIndex]);
     Serial.println("LCD updated successfully");
  }

  // אם כפתור 2 נלחץ, אשר את הספרה הנוכחית ועבור לספרה הבאה
  if (button2Pressed) {
    currentDigitIndex++;
    if (currentDigitIndex >= 4) {
      codeEntered = true;
         if (code[0] == code1 && code[1] == code2 && code[2] == code3 && code[3] == code4) {
          
            correctCodeEntered = true;
         
         }
         else {
           
          resetCodeEntry();
         }
    }
      updateLCDPassword();
    Serial.println("LCD updated successfully FINAL");
     
   
  }

  
}

//פונקציה לאיפוס הכנסת הקוד
void resetCodeEntry() {
  codeEntered = false;
  correctCodeEntered = false;
  currentDigitIndex = 0;
  for (int i = 0; i < 4; i++) {
    code[i] = 0;
  }
  lcd.clear();
  lcd.print("Enter code:");
  updateLCDPassword();
}


// LiquidCrystal_I2C lcd(0x27, 16, 2); // Make sure this is initialized elsewhere in your code

void display7Values(String label1, int value1,
                     String label2, int value2,
                     String label3, int value3,
                     String label4, int value4) {
 lcd.clear();
  lcd.setCursor(0, 0); // First row
  lcd.print(label1 + ":" + value1 + " ");
  lcd.print(label2 + ":" + value2);
 

  lcd.setCursor(0, 1); // Second row
  lcd.print(label4 + ":" + value4 + " ");
  lcd.print(label3 + ":" + value3);



}

//---------------אזור הפונקציות שאתם בונים   -----------------------------

// **FUNCTION_DEFINITIONS**








`;
//---------------------------------------------------- יצירת בלוק חדש -----------------------------------------------------





 


//-----------------------------------------------------------------בלוקים -------------------------------------------------------------------

  const resizeBlocklyDiv = () => {
    if (blocklyDiv.current && blocklyArea.current && workspace) {     
      blocklyDiv.current.style.width = blocklyArea.current.offsetWidth + 'px';
      blocklyDiv.current.style.height = blocklyArea.current.offsetHeight + 'px';
      Blockly.svgResize(workspace);
    }
  };



  

//רשימת בלוקים


//בלוק ליצירת טקסט עם גרשיים גפולות
Blockly.Blocks['double_quoted_text'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("טקסט:")
        .appendField(new Blockly.FieldTextInput(""), "TEXT");
    this.setOutput(true, "String");
    this.setColour(160);
    this.setTooltip("הכנס טקסט שיופיע בתוך גרשיים כפולות");
  }
};

javascriptGenerator.forBlock['double_quoted_text'] = function(block) {
  var text = block.getFieldValue('TEXT');
  var code = `"${text}"`;
  return [code, javascriptGenerator.ORDER_ATOMIC];
};




// בלוק קריאה לפונקציה שמתחבר לבלוק טקסט
Blockly.Blocks['call_getdata'] = {
  init: function() {
    this.appendValueInput("DATALINK")
        .setCheck("String")
        .appendField("קבל ערך מ - קישור ל - database");
    this.setOutput(true, "Number");
    this.setColour(350);
    this.setTooltip("Calls getdata() with DataLink");
  }
};

// קוד הפלט של הבלוק
javascriptGenerator.forBlock['call_getdata'] = function(block) {
  var datalink = javascriptGenerator.valueToCode(block, 'DATALINK', javascriptGenerator.ORDER_NONE) || '""';
  var code = `getdata(${datalink})`;
  return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
};

// בלוק לקלט של DataLink
Blockly.Blocks['datalink_input'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("DataLink:")
        .appendField(new Blockly.FieldTextInput("/smart_house/humidityValue"), "DATALINK_VALUE");
    this.setOutput(true, "String");
    this.setColour(230);
    this.setTooltip("Enter the DataLink value (e.g., /smart_house/humidityValue)");
  }
};

// קוד הפלט של הבלוק
javascriptGenerator.forBlock['datalink_input'] = function(block) {
  var datalinkValue = block.getFieldValue('DATALINK_VALUE');
  var code = `"${datalinkValue}"`; // מחזיר את הערך כמחרוזת
  return [code, javascriptGenerator.ORDER_ATOMIC];
};




// בלוק שמייצר את הקריאה לפונקציה עם הערכים שהוזנו
Blockly.Blocks['call_setdata_function'] = {
  init: function() {
    this.appendValueInput("VALUE")
        .setCheck("String")
        .appendField("ערך");
    this.appendValueInput("DATALINK")
        .setCheck("String")
        .appendField("קישור ל- database");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(350);
    this.setTooltip("Call setdata function with specified values");
    this.setHelpUrl("");
  }
};

// קוד הפלט של הבלוק
javascriptGenerator.forBlock['call_setdata_function'] = function(block) {
  var value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || '""';
  var datalink = javascriptGenerator.valueToCode(block, 'DATALINK', javascriptGenerator.ORDER_NONE) || '""';

  var code = `setdata(${value}, ${datalink});\n`;
  return code;
};

// בלוק לפונקציה display7Values
Blockly.Blocks['lcd_multi_print'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(" הצגת נתוני חיישנים   ");
    this.appendValueInput("LABEL1")
        .setCheck("String")
        .appendField("תווית 1");
    this.appendValueInput("VALUE1")
        .setCheck("Number")
        .appendField("חיישן אור");
    this.appendValueInput("LABEL2")
        .setCheck("String")
        .appendField("תווית 2");
    this.appendValueInput("VALUE2")
        .setCheck("Number")
        .appendField("חיישן גז");
    this.appendValueInput("LABEL3")
        .setCheck("String")
        .appendField("תווית 3");
    this.appendValueInput("VALUE3")
        .setCheck("Number")
        .appendField("חיישן טמפרטורה");
    this.appendValueInput("LABEL4")
        .setCheck("String")
        .appendField("תווית 4");
    this.appendValueInput("VALUE4")
  
  
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Displays 7 labeled values on the LCD.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['lcd_multi_print'] = function(block) {
  var label1 = javascriptGenerator.valueToCode(block, 'LABEL1', javascriptGenerator.ORDER_ATOMIC) || '""';
  var value1 = javascriptGenerator.valueToCode(block, 'VALUE1', javascriptGenerator.ORDER_ATOMIC) || '0';
  var label2 = javascriptGenerator.valueToCode(block, 'LABEL2', javascriptGenerator.ORDER_ATOMIC) || '""';
  var value2 = javascriptGenerator.valueToCode(block, 'VALUE2', javascriptGenerator.ORDER_ATOMIC) || '0';
  var label3 = javascriptGenerator.valueToCode(block, 'LABEL3', javascriptGenerator.ORDER_ATOMIC) || '""';
  var value3 = javascriptGenerator.valueToCode(block, 'VALUE3', javascriptGenerator.ORDER_ATOMIC) || '0';
  var label4 = javascriptGenerator.valueToCode(block, 'LABEL4', javascriptGenerator.ORDER_ATOMIC) || '""';
  var value4 = javascriptGenerator.valueToCode(block, 'VALUE4', javascriptGenerator.ORDER_ATOMIC) || '0';

  
  var code = 'display7Values(' + label1 + ', ' + value1 + ', ' + label2 + ', ' + value2 + ', ' + label3 + ', ' + value3 + ', ' + label4 + ', ' + value4 + ' );\n';
  return code;
};


// בלוק שמפעיל את הפונקציה printLCD עם שני טקסטים
Blockly.Blocks['lcd_display_text'] = {
  init: function() {
    // כותרת בלבד, בלי אפשרות לחבר אליה בלוקים אחרים
    this.appendDummyInput()
        .appendField("הדפסה למסך");
        
    // שורה 1 - שדה לחיבור
    this.appendValueInput("FIRST_TEXT")
        .setCheck("String")
        .appendField("שורה 1 - טקסט");
    // שורה 2 - שדה לחיבור
    this.appendValueInput("SECOND_TEXT")
        .setCheck("String")
        .appendField("שורה 2 - טקסט");
        
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("מדפיס טקסט על ה-LCD על שתי שורות");
  }
};
// מייצר קוד ל־JavaScript, שיקרא לפונקציה שלך
javascriptGenerator.forBlock['lcd_display_text'] = function(block) {
  var firstText = javascriptGenerator.valueToCode(block, 'FIRST_TEXT', javascriptGenerator.ORDER_ATOMIC) || '""';
  var secondText = javascriptGenerator.valueToCode(block, 'SECOND_TEXT', javascriptGenerator.ORDER_ATOMIC) || '""';

  var code = `printLCD(${firstText}, ${secondText});\n`;
  return code;
};


//הדפסה למסך מספר וטקסט 
Blockly.Blocks['call_printlcdint'] = {
   init: function() {
    // כותרת בלבד, בלי אפשרות לחבר אליה בלוקים אחרים
    this.appendDummyInput()
        .appendField("הדפסה למסך");
        
    // שורה 1 - שדה לחיבור
    this.appendValueInput("FIRST_TEXT")
        .setCheck("Number")
        .appendField("שורה 1 - מספר");
    // שורה 2 - שדה לחיבור
    this.appendValueInput("SECOND_TEXT")
        .setCheck("String")
        .appendField("שורה 2 - טקסט");
        
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("מדפיס טקסט על ה-LCD על שתי שורות");
  }
};

javascriptGenerator.forBlock['call_printlcdint'] = function(block) {
  var firstText = javascriptGenerator.valueToCode(block, 'FIRST_TEXT', javascriptGenerator.ORDER_ATOMIC) || '""';
  var secondText = javascriptGenerator.valueToCode(block, 'SECOND_TEXT', javascriptGenerator.ORDER_ATOMIC) || '""';

  var code = `printLCDINT(${firstText}, ${secondText});\n`;
  return code;
};



// בלוק להגדיר את מיקום הקורסר ב-LCD
Blockly.Blocks['lcd_set_cursor'] = {
  init: function() {
    this.appendValueInput("COLUMN")
        .setCheck("Number")
        .appendField("עדכן עמודה");
    this.appendValueInput("ROW")
        .setCheck("Number")
        .appendField("עדכן שורה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Sets the position of the cursor on the LCD screen");
    this.setHelpUrl("");
  }
};

// קוד ג'אווסקריפט לבלוק זה
javascriptGenerator.forBlock['lcd_set_cursor'] = function(block) {
  var column = javascriptGenerator.valueToCode(block, 'COLUMN', javascriptGenerator.ORDER_ATOMIC) || '0';
  var row = javascriptGenerator.valueToCode(block, 'ROW', javascriptGenerator.ORDER_ATOMIC) || '0';
  var code = `lcd.setCursor(${column}, ${row});\n`;
  return code;
};



// בלוק לניקוי המסך LCD
Blockly.Blocks['lcd_clear'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("נקה מסך");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Clears the LCD screen");
    this.setHelpUrl("");
  }
};

// קוד ג'אווסקריפט לבלוק זה
javascriptGenerator.forBlock['lcd_clear'] = function(block) {
  return 'lcd.clear();\n';
};

Blockly.Blocks['logic_compare_custom'] = {
  init: function() {
    this.appendValueInput("A")
        .setCheck(null)
        .appendField("");

    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
            ["גדול מ", "GT"],
            ["קטן מ", "LT"],
            ["שווה ל", "EQ"],
            ["שונה מ", "NEQ"],
            ["גדול או שווה ל", "GTE"],
            ["קטן או שווה ל", "LTE"]
        ]), "OP");

    this.appendValueInput("B")
        .setCheck(null);

    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(210);
    this.setTooltip("בלוק השוואה מותאם לבדיקת גדלים, שוויון ושונות");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['logic_compare_custom'] = function(block) {
  var lhs = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ATOMIC) || '0';
  var rhs = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ATOMIC) || '0';
  var operator = block.getFieldValue('OP');

  var opMap = {
    'GT': '>',
    'LT': '<',
    'EQ': '==',
    'NEQ': '!=',
    'GTE': '>=',
    'LTE': '<='
  };

  var opSymbol = opMap[operator];

  var code = lhs + ' ' + opSymbol + ' ' + rhs;
 return [code, javascriptGenerator.ORDER_ATOMIC];
};


// If-Else Block
Blockly.Blocks['controls_if_else'] = {
  init: function() {
    this.appendValueInput("IF0")
        .setCheck("Boolean")
        .appendField("אם");
    this.appendStatementInput("DO0")
        .appendField("אז");
    this.appendStatementInput("ELSE")
        .appendField("אחרת");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("If-Else condition block.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['controls_if_else'] = function(block) {
  var condition = javascriptGenerator.valueToCode(block, 'IF0', javascriptGenerator.ORDER_NONE) || 'false';
  var statements_do = javascriptGenerator.statementToCode(block, 'DO0');
  var statements_else = javascriptGenerator.statementToCode(block, 'ELSE');
  var code = `if (${condition}) {\n${statements_do}} else {\n${statements_else}}\n`;
  return code;
};



// בלוק ליצירת משתנה חדש
Blockly.Blocks['variables_create'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("צור משתנה חדש")
      .appendField(new Blockly.FieldVariable("param"), "PARAM");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
    this.setTooltip("Create a new variable");
    this.setHelpUrl("");
  }
};

// גנרטור לבלוק שמייצר קוד ליצירת משתנה
javascriptGenerator.forBlock['variables_create'] = function(block) {
  var paramName = block.getField('PARAM').getText();
  // תכתוב את הקוד ליצירת משתנה: 
  var code = `var ${paramName};\n`; 
  return code; 
};




// הגדרת בלוק "get" עם FieldVariable
Blockly.Blocks['get_param'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("קבל ערך")
      .appendField(new Blockly.FieldVariable("param"), "PARAM");
    this.setOutput(true, null);
    this.setColour(330);
    this.setTooltip("Gets the value of the parameter.");
    this.setHelpUrl("");
  }
};

// גנרטור לקוד
javascriptGenerator.forBlock['get_param'] = function(block) {
  // מקבלים את השם שהמשתמש הזין ל־FieldVariable
  var paramVariable = block.getField('PARAM');
  var paramName = paramVariable.getText(); // זהו השם כפי שהמשתמש הזין

  // בנה את הקוד עם השם שהוזן
  var code = paramName;
  return [code, javascriptGenerator.ORDER_ATOMIC];
};





// הגדרת בלוק "set" עם FieldVariable
Blockly.Blocks['set_param'] = {
  init: function() {
    this.appendValueInput("SET_VALUE")
      .setCheck(null)
      .appendField("הגדר ערך עבור")
      .appendField(new Blockly.FieldVariable("param"), "PARAM");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
    this.setTooltip("Sets the value of the parameter.");
    this.setHelpUrl("");
  }
};

// גנרטור לקוד
javascriptGenerator.forBlock['set_param'] = function(block) {
  // מקבלים את השם שהמשתמש הזין ל־`FieldVariable`
  var paramVariable = block.getField('PARAM');
  var paramName = paramVariable.getText(); // זהו השם כפי שהמשתמש הזין

  var value = javascriptGenerator.valueToCode(block, 'SET_VALUE', javascriptGenerator.ORDER_ATOMIC);

  // שימוש בשם כמו שמסומן ב־FieldVariable
  var code = paramName + ' = ' + value + ';\n';
  return code;
};




// Function Definition Block (No Return Value)
    Blockly.Blocks['function_definition_noreturn'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("Function Definition (No Return)");
        this.appendDummyInput()
          .appendField("void")
        .appendField(new Blockly.FieldTextInput("myFunctionName"), "NAME");
        this.appendStatementInput("STATEMENTS")
          .setCheck(null)
          .appendField("Statements");
        this.setColour(290);
        this.setTooltip("Defines a function with no return value.");
        this.setHelpUrl("");
      }
    };

    javascriptGenerator.forBlock['function_definition_noreturn'] = function(block) {
      var functionName = block.getFieldValue('NAME');
      var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
      var code = 'void ' + functionName + '() {\n' + statements + '}\n';
      return code;
    };



// פונקציה לבדיקת גז
Blockly.Blocks['gass_function'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("פונקציה: בדיקת גז");
    this.appendStatementInput("STATEMENTS")
      .setCheck(null)
      .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function for gas detection.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['gass_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void checkGas() {\n' +
             statements +
             '}\n';
  return code;
};

// בלוק לבדיקת חיישן תנועה
Blockly.Blocks['motion_sensor_function'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("פונקציה: בדיקת חיישן תנועה");
    this.appendStatementInput("STATEMENTS")
      .setCheck(null)
      .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function for motion sensor detection.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['motion_sensor_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void checkMotion() {\n' +
             statements +
             '}\n';
  return code;
};

// בלוק לפונקציה לבדיקת חיישן אור
Blockly.Blocks['light_sensor_function'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("פונקציה: בדיקת חיישן אור");
    this.appendStatementInput("STATEMENTS")
      .setCheck(null)
      .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function for light sensor detection.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['light_sensor_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void checkLight() {\n' +
             statements +
             '}\n';
  return code;
};

// בלוק לפונקציה לבדיקת טמפרטורה
Blockly.Blocks['temp_function'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("פונקציה: בדיקת טמפרטורה");
    this.appendStatementInput("STATEMENTS")
      .setCheck(null)
      .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function for temperature detection.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['temp_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void checkTemperature() {\n' +
             statements +
             '}\n';
  return code;
};


// בלוק לפונקציה לפתיחת דלת
Blockly.Blocks['open_door_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("פונקציה: פתיחת/סגירת דלת");
    this.appendStatementInput("STATEMENTS")
        .setCheck(null)
        .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function to open the door.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['open_door_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void openDoor() {\n' +
             statements +
             '}\n';
  return code;
};



// בלוק לפונקציה לפתיחת חלון
Blockly.Blocks['open_window_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("פונקציה: פתיחת/סגירת חלון");
    this.appendStatementInput("STATEMENTS")
        .setCheck(null)
        .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function to open the window.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['open_window_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void openWindow() {\n' +
             statements +
             '}\n';
  return code;
};



// בלוק לפונקציה להפעלת אזעקה
Blockly.Blocks['activate_alarm_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("פונקציה: הפעלה/כיבוי אזעקה");
    this.appendStatementInput("STATEMENTS")
        .setCheck(null)
        .appendField("בלוקים");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Defines a function to activate the alarm.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['activate_alarm_function'] = function(block) {
  var statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
  var code = 'void activateAlarm() {\n' +
             statements +
             '}\n';
  return code;
};

// בלוק לקריאה לפונקציה לבדיקת גז
Blockly.Blocks['call_gass_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: בדיקת גז");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the checkGas function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_gass_function'] = function(block) {
  var code = 'checkGas();\n';
  return code;
};

// בלוק לקריאה לפונקציה לבדיקת חיישן תנועה
Blockly.Blocks['call_motion_sensor_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: בדיקת חיישן תנועה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the checkMotion function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_motion_sensor_function'] = function(block) {
  var code = 'checkMotion();\n';
  return code;
};

// בלוק לקריאה לפונקציה לבדיקת חיישן אור
Blockly.Blocks['call_light_sensor_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: בדיקת חיישן אור");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the checkLight function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_light_sensor_function'] = function(block) {
  var code = 'checkLight();\n';
  return code;
};

// בלוק לקריאה לפונקציה לבדיקת טמפרטורה
Blockly.Blocks['call_temp_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: בדיקת טמפרטורה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the checkTemperature function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_temp_function'] = function(block) {
  var code = 'checkTemperature();\n';
  return code;
};

// בלוק לקריאה לפונקציה לפתיחת דלת
Blockly.Blocks['call_open_door_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: פתיחה/סגירת דלת");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the openDoor function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_open_door_function'] = function(block) {
  var code = 'openDoor();\n';
  return code;
};



// בלוק לקריאה לפונקציה לפתיחת חלון
Blockly.Blocks['call_open_window_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: פתיחת/סגירת חלון");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the openWindow function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_open_window_function'] = function(block) {
  var code = 'openWindow();\n';
  return code;
};



// בלוק לקריאה לפונקציה להפעלת אזעקה
Blockly.Blocks['call_activate_alarm_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קריאה לפונקציה: הפעלת אזעקה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the activateAlarm function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_activate_alarm_function'] = function(block) {
  var code = 'activateAlarm();\n';
  return code;
};




// Function Call Block
    Blockly.Blocks['function_call'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("Call Function")
          .appendField(new Blockly.FieldTextInput("myFunctionName"), "NAME");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Calls a defined function.");
        this.setHelpUrl("");
      }
    };

    javascriptGenerator.forBlock['function_call'] = function(block) {
      var functionName = block.getFieldValue('NAME');
      var code = functionName + '();\n';
      return code;
    };



    // Infinite Loop Block
    Blockly.Blocks['infinite_loop'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("Arduino Code");
        this.appendStatementInput("SETUP")
          .setCheck(null)
          .appendField("פעם אחת");
        this.appendStatementInput("LOOP")
          .setCheck(null)
          .appendField("לעולמים");
        this.setColour(120);
        this.setTooltip("Generates Arduino code with setup and loop functions.");
        this.setHelpUrl("");
      }
    };

javascriptGenerator.forBlock['infinite_loop'] = function(block) {
  var setupCode = javascriptGenerator.statementToCode(block, 'SETUP');
  var loopCode = javascriptGenerator.statementToCode(block, 'LOOP');
  var code = `#include <Arduino.h>\n#include <LiquidCrystal_I2C.h>\n#include <Servo.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\nServo myservo;\n\nvoid setup() {\n  lcd.init();\n  lcd.backlight();\n  Serial.begin(115200);\n  ${setupCode}\n}\n\nvoid loop() {\n  ${loopCode}\n}`;
  return code;
};
    
    
//  analogRead
    Blockly.Blocks['esp32_analog_read'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("קבלת מידע מחיישן אנלוגי");
        this.appendValueInput("PIN")
          .setCheck("Number")
          .appendField("פורט");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(210);
        this.setTooltip("Reads an analog value from a specified ESP32 pin.");
        this.setHelpUrl("");
      }
    };

    //     analogRead
    javascriptGenerator.forBlock['esp32_analog_read'] = function(block) {
      var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
      var code = 'analogRead(' + pin + ')';
      return [code, javascriptGenerator.ORDER_ATOMIC];
    };



// Delay Block
Blockly.Blocks['delay_seconds'] = {
  init: function() {
    this.appendValueInput("SECONDS")
      .setCheck("Number")
      .appendField("חכה");
    this.appendDummyInput()
      .appendField("שניות");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(70);
    this.setTooltip("Pauses the program for specified number of seconds.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['delay_seconds'] = function(block) {
  var seconds = javascriptGenerator.valueToCode(block, 'SECONDS', javascriptGenerator.ORDER_ATOMIC) || '0';
  var code = `delay(${seconds} * 1000);\n`;
  return code;
};



// Include Servo Library Block
Blockly.Blocks['servo_include_library'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Include Servo Library");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(300);
    this.setTooltip("Includes the Servo library.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['servo_include_library'] = function(block) {
  var code = '#include <Servo.h>\n';
  return code;
};


// Create Servo Object Block
Blockly.Blocks['servo_create_object'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Create Servo Object")
        .appendField("Name:")
        .appendField(new Blockly.FieldTextInput("myServo"), "SERVO_NAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Creates a Servo object with the specified name.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['servo_create_object'] = function(block) {
  var servoName = block.getFieldValue('SERVO_NAME');
  var code = `Servo ${servoName};\n`;
  return code;
};



// servo write
 Blockly.Blocks['servo_write'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קביעת זווית ושם לסרבו");
    this.appendDummyInput()
      .appendField("שם")
      .appendField(new Blockly.FieldTextInput("myServo"), "SERVO_NAME"); //
    this.appendValueInput("ANGLE")
        .setCheck("Number")
        .appendField("זווית");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(300);
    this.setTooltip("Writes an angle (0-180) to the servo.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['servo_write'] = function(block) {
var servoName = block.getFieldValue('SERVO_NAME');
  var angle = javascriptGenerator.valueToCode(block, 'ANGLE', javascriptGenerator.ORDER_ATOMIC);
  var code = servoName + '.write(' + angle + ');\n';
  return code;
};


// פתיחת דלת
Blockly.Blocks['open_door'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("פתיחת דלת");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Opens the door by setting the servo to the open angle.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['open_door'] = function(block) {
  var code = 'doorServo.write(90);\n'; // Set to your open angle
  return code;
};

// סגירת דלת
Blockly.Blocks['close_door'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("סגירת דלת");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Closes the door by setting the servo to the closed angle.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['close_door'] = function(block) {
  var code = 'doorServo.write(0);\n'; // Set to your closed angle
  return code;
};

// פתיחת חלון
Blockly.Blocks['open_window'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("פתיחת חלון");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Opens the window by setting the servo to the open angle.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['open_window'] = function(block) {
  var code = 'windowServo.write(180);\n'; // Set to your open angle
  return code;
};

// סגירת חלון
Blockly.Blocks['close_window'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("סגירת חלון");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Closes the window by setting the servo to the closed angle.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['close_window'] = function(block) {
  var code = 'windowServo.write(0);\n'; // Set to your closed angle
  return code;
};



// servo attach
Blockly.Blocks['servo_attach'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("חיבור סרבו לפורט");
    this.appendDummyInput()
      .appendField("שם ")
      .appendField(new Blockly.FieldTextInput("myServo"), "SERVO_NAME"); // Use a text input field and store the value in 'SERVO_NAME'
    this.appendValueInput("PIN")
      .setCheck("Number")
      .appendField("מספר פורט");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(300);
    this.setTooltip("Attach a servo object to a specific pin with custom name.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['servo_attach'] = function(block) {
  // Get the servo name from the text input field
  var servoName = block.getFieldValue('SERVO_NAME');
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  var code = servoName + '.attach(' + pin + ');\n';
  return code;
};




 // ESP32 Digital Write (Existing Block)
    Blockly.Blocks['esp32_digital_write'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("קביעת ערך לחיישן דיגיטלי");
        this.appendValueInput("PIN")
          .setCheck("Number")
          .appendField("פורט");
        this.appendDummyInput()
          .appendField("ערך")
          .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "VALUE");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Writes a digital value (HIGH or LOW) to a specified ESP32 pin.");
        this.setHelpUrl("");
      }
    };

    javascriptGenerator.forBlock['esp32_digital_write'] = function(block) {
      var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
      var value = block.getFieldValue('VALUE');
      var code = '// This is a predefined code for ESP32 digital write\n';
      code += 'digitalWrite(' + pin + ', ' + value + ');\n';
      return code;
    };





//הלדה וכיבוי לד לבן 
Blockly.Blocks['white_led'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldLabel(this.getLedStatus()), 'LED_STATUS'); // Use FieldLabel for dynamic text
    this.appendValueInput("PIN")
      .setCheck("Number")
      .appendField("פורט");
    this.appendDummyInput()
      .appendField("ערך")
      .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]], this.updateLedStatus.bind(this)), "VALUE"); // Attach update function to dropdown
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Writes a digital value (HIGH or LOW) to a specified ESP32 pin.");
    this.setHelpUrl("");

    this.updateLedStatus(this.getFieldValue("VALUE")); // Initial update
  },

  // Function to get the LED status text
  getLedStatus: function() {
    var value = this.getFieldValue("VALUE");
    return "הדלקה/כיבוי לד לבן: " + (value === "HIGH" ? "מכובה" : "דלוק");
  },

  // Function to update the LED status text when the dropdown changes
  updateLedStatus: function(newValue) {
    this.setFieldValue(this.getLedStatus(), 'LED_STATUS'); // Set the FieldLabel value
    return newValue;  // Return the new value for the dropdown
  }
};

javascriptGenerator.forBlock['white_led'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  var value = block.getFieldValue('VALUE');
  var code = '// This is a predefined code for ESP32 digital write\n';
  code += 'digitalWrite(' + pin + ', ' + value + ');\n';
  return code;
};



//הלדה וכיבוי לד צהוב 
Blockly.Blocks['yellow_led'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldLabel(this.getLedStatus()), 'LED_STATUS'); // Use FieldLabel for dynamic text
    this.appendValueInput("PIN")
      .setCheck("Number")
      .appendField("פורט");
    this.appendDummyInput()
      .appendField("ערך")
      .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]], this.updateLedStatus.bind(this)), "VALUE"); // Attach update function to dropdown
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Writes a digital value (HIGH or LOW) to a specified ESP32 pin.");
    this.setHelpUrl("");

    this.updateLedStatus(this.getFieldValue("VALUE")); // Initial update
  },

  // Function to get the LED status text
  getLedStatus: function() {
    var value = this.getFieldValue("VALUE");
    return "להדלקה/כיבוי לד צהוב:" + (value === "HIGH" ? "מכובה" : "דלוק");
  },

  // Function to update the LED status text when the dropdown changes
  updateLedStatus: function(newValue) {
    this.setFieldValue(this.getLedStatus(), 'LED_STATUS'); // Set the FieldLabel value
    return newValue;  // Return the new value for the dropdown
  }
};

javascriptGenerator.forBlock['yellow_led'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  var value = block.getFieldValue('VALUE');
  var code = '// This is a predefined code for ESP32 digital write\n';
  code += 'digitalWrite(' + pin + ', ' + value + ');\n';
  return code;
};


   

    //הפעלת זמזם 
    Blockly.Blocks['buzzer_tone'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("הפעל זמזם");
    this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("פורט");
    this.appendDummyInput()
        .appendField("טון")
        .appendField(new Blockly.FieldDropdown([
          ["C2", "65"],
          ["D2", "73"],
          ["E2", "82"],
          ["F2", "87"],
          ["G2", "98"],
          ["A2", "110"],
          ["B2", "123"],
          ["C3", "131"],
          ["D3", "147"],
          ["E3", "165"],
          ["F3", "175"],
          ["G3", "196"],
          ["A3", "220"],
          ["B3", "247"],
          ["C4", "262"],
          ["D4", "294"],
          ["E4", "330"],
          ["F4", "349"],
          ["G4", "392"],
          ["A4", "440"],
          ["B4", "494"],
          ["C5", "523"],
          ["D5", "587"],
          ["E5", "659"],
          ["F5", "698"],
          ["G5", "784"],
          ["A5", "880"],
          ["B5", "988"],
          ["C6", "1047"],
          ["D6", "1175"],
          ["E6", "1319"],
          ["F6", "1397"],
          ["G6", "1568"],
          ["A6", "1760"],
          ["B6", "1976"],
          ["C7", "2093"]
        ]), "TONE");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("מנגן טון מסוים בזמזם המחובר לפין שצוין.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['buzzer_tone'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  var tone = block.getFieldValue('TONE');
  // Generate the code to play the tone on the buzzer
  var code = 'tone(' + pin + ', ' + tone + ');\n';
  return code;
};

//השתקת הזמזם 
Blockly.Blocks['no_tone'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("כבה זמזם");
     this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("פורט");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("מפסיק את השמעת הטון בזמזם המחובר לפין שצוין.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['no_tone'] = function(block) {
  // Generate the code to stop the tone on the buzzer
 var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);

  var code = 'noTone(' + pin + ');\n'
  return code;
};



  // motion_sensore
Blockly.Blocks['motion_sensore'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קבלת מידע מחיישן תנועה");
    this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("מספר פורט");
    this.setInputsInline(true);
    this.setOutput(true, "Number"); // Change to "Number"
    this.setColour(230);
    this.setTooltip("קורא ערך דיגיטלי (HIGH/LOW) מפין שצוין.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['motion_sensore'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  // Generate the code to call the digitalRead function with the pin argument
  var code = 'digitalRead(' + pin + ')';
  return [code, javascriptGenerator.ORDER_ATOMIC];
};




//function return
 Blockly.Blocks['function_return'] = {
  init: function() {
    this.appendValueInput("RETURN_VALUE")
        .setCheck(null) // Allow any type of value to be returned
        .appendField("return");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null); // Only allowed inside a function
    this.setColour(210); // Choose a color that visually groups with functions
    this.setTooltip("Returns a value from the function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['function_return'] = function(block) {
  var returnValue = javascriptGenerator.valueToCode(block, 'RETURN_VALUE', javascriptGenerator.ORDER_ATOMIC) || ''; // Get the return value
  var code = 'return ' + returnValue + ';\n'; // Generate the return statement
  return code;
};



//בלוק חיישן טמפרטורה
Blockly.Blocks['get_steam_sensor_temperature_with_pin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קבלת מידע מחיישן טמפרטורה");
    this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("מספר פורט");
    this.appendDummyInput()
        .appendField(" (°C)");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("Reads the temperature from a steam sensor connected to a specified pin (0-100°C) using the getSteamSensorTemperature function.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['get_steam_sensor_temperature_with_pin'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  // Generate the code to call the function with the pin argument
  var code = 'getSteamSensorTemperature(' + pin + ')';
  return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
};

// בלוק חיישן גז
Blockly.Blocks['get_gas_sensor_value_with_pin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קבלת מידע מחיישן גז");
    this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("מספר פורט");
    this.appendDummyInput()
        .appendField(" (ערך)"); // או (PPM) אם כבר עשית המרה
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("קורא ערך מחיישן גז המחובר לפין שצוין באמצעות הפונקציה getGasSensorValue.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['get_gas_sensor_value_with_pin'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  // Generate the code to call the function with the pin argument
  var code = 'getGasSensorValue(' + pin + ')';
  return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
};




//בלוק חיישן אור 
Blockly.Blocks['calculate_lux'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קבלת מידע מחיישן אור");
    this.appendValueInput("PIN")
        .setCheck("Number")
        .appendField("מספר פורט");
    this.appendDummyInput()
        .appendField(" (Lux)");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("קורא את עוצמת האור מחיישן אור המחובר לפין שצוין באמצעות הפונקציה calculateLux.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['calculate_lux'] = function(block) {
  var pin = javascriptGenerator.valueToCode(block, 'PIN', javascriptGenerator.ORDER_ATOMIC);
  // Generate the code to call the function with the pin argument
  var code = 'calculateLux(' + pin + ')';
  return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
};




//הפעלת מאוור
Blockly.Blocks['fan_sensore'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("הפעלת מהאוורר");
    this.appendValueInput("PIN1")
        .setCheck("Number")
        .appendField("פורט 1");
    this.appendValueInput("VALUE1")
        .setCheck("Boolean")
        .appendField("ערך");
    this.appendValueInput("PIN2")
        .setCheck("Number")
        .appendField("פורט 2");
    this.appendValueInput("VALUE2")
        .setCheck("Boolean")
        .appendField("ערך");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("כותב ערך דיגיטלי (HIGH/LOW) לשני פינים שונים.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['fan_sensore'] = function(block) {
  var pin1 = javascriptGenerator.valueToCode(block, 'PIN1', javascriptGenerator.ORDER_ATOMIC);
  var value1 = javascriptGenerator.valueToCode(block, 'VALUE1', javascriptGenerator.ORDER_ATOMIC);
  var pin2 = javascriptGenerator.valueToCode(block, 'PIN2', javascriptGenerator.ORDER_ATOMIC);
  var value2 = javascriptGenerator.valueToCode(block, 'VALUE2', javascriptGenerator.ORDER_ATOMIC);
  // Generate the code to call the digitalWrite function for both pins
  var code = 'digitalWrite(' + pin1 + ', ' + value1 + ');\n';
  code += 'digitalWrite(' + pin2 + ', ' + value2 + ');\n';
  return code;
};




// בלוק עבור הערך 'אמת' (true)
Blockly.Blocks['boolean_true'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("אמת");
    this.setOutput(true, "Boolean");
    this.setColour(210);
    this.setTooltip("מחזיר את הערך 'אמת'.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['boolean_true'] = function(block) {
  return ['true', javascriptGenerator.ORDER_ATOMIC];
};




// בלוק עבור הערך 'שקר' (false)
Blockly.Blocks['boolean_false'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("שקר");
    this.setOutput(true, "Boolean");
    this.setColour(210);
    this.setTooltip("מחזיר את הערך 'שקר'.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['boolean_false'] = function(block) {
  return ['false', javascriptGenerator.ORDER_ATOMIC];
};


//בלוק טיפול בכפתורים 
Blockly.Blocks['call_handle_button_presses'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("טפל בלחיצות כפתורים");
    this.appendValueInput("PORT1")
        .setCheck("Number")
        .appendField("פורט 1");
    this.appendValueInput("PORT2")
        .setCheck("Number")
        .appendField("פורט 2");
    this.appendValueInput("CODE1")
        .setCheck("Number")
        .appendField("קוד 1");
    this.appendValueInput("CODE2")
        .setCheck("Number")
        .appendField("קוד 2");
    this.appendValueInput("CODE3")
        .setCheck("Number")
        .appendField("קוד 3");
    this.appendValueInput("CODE4")
        .setCheck("Number")
        .appendField("קוד 4");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Calls the handleButtonPresses function with the specified parameters.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['call_handle_button_presses'] = function(block) {
  var port1 = javascriptGenerator.valueToCode(block, 'PORT1', javascriptGenerator.ORDER_ATOMIC);
  var port2 = javascriptGenerator.valueToCode(block, 'PORT2', javascriptGenerator.ORDER_ATOMIC);
  var code1 = javascriptGenerator.valueToCode(block, 'CODE1', javascriptGenerator.ORDER_ATOMIC);
  var code2 = javascriptGenerator.valueToCode(block, 'CODE2', javascriptGenerator.ORDER_ATOMIC);
  var code3 = javascriptGenerator.valueToCode(block, 'CODE3', javascriptGenerator.ORDER_ATOMIC);
  var code4 = javascriptGenerator.valueToCode(block, 'CODE4', javascriptGenerator.ORDER_ATOMIC);
  // Assemble JavaScript into code variable.
  var code = 'handleButtonPresses(' + port1 + ', ' + port2 + ', ' + code1 + ', ' + code2 + ', ' + code3 + ', ' + code4 + ');\n';
  return code;
};

//קריאה לפונקציה לבדיקת גז 
Blockly.Blocks['check_gas'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("בדיקת גז");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Checks gas value and updates Firebase.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['check_gas'] = function(block) {
  var code = 'String value = gass(getdata("/smart_house/gassValue"));\n';
  code += 'setdata(value, "/smart_house/gass");\n';
  code += 'Serial.println("gass is:");\n';
  code += 'Serial.println(analogRead(32));\n';
  return code;
};

//בלוק להכנסת קוד 
Blockly.Blocks['correct_code_entered'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("קוד פתיחה");
    this.appendStatementInput("CORRECT_CODE")
        .setCheck(null)
        .appendField("בצע אם הקוד נכון");
    this.appendStatementInput("INCORRECT_CODE")
        .setCheck(null)
        .appendField("בצע אם הקוד שגוי");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("Executes code when the correct code is entered.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['correct_code_entered'] = function(block) {
  var correctCodeStatements = javascriptGenerator.statementToCode(block, 'CORRECT_CODE');
  var incorrectCodeStatements = javascriptGenerator.statementToCode(block, 'INCORRECT_CODE');
  var code = 'if (correctCodeEntered) {\n';
  code += correctCodeStatements;
  code += '} else {\n';
  code += '  updateLCDPassword();\n'; // הוספתי את הקריאה לפונקציה
  code += incorrectCodeStatements;
  code += '}\n';
  return code;
};

//בדיקת חיישן תנועה 
Blockly.Blocks['check_motion'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("בדיקת תנועה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Checks motion sensor value and updates Firebase.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['check_motion'] = function(block) {
  var code = 'String Motionsensore = Motion(getdata("/smart_house/motionValue"));\n';
  code += 'setdata(Motionsensore, "/smart_house/motionValue");\n';
  code += 'Serial.println("motion is:");\n';
  code += 'Serial.println(digitalRead(14));\n';
  return code;
};

//חיבור ל- wifi
Blockly.Blocks['wifi_connect'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("התחברות ל-Wi-Fi");
    this.appendValueInput("WIFI_SSID")
        .setCheck("String")
        .appendField("שם הרשת");
    this.appendValueInput("WIFI_PASSWORD")
        .setCheck("String")
        .appendField("סיסמה");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Connects to Wi-Fi using the specified SSID and password, and displays a message on the LCD.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['wifi_connect'] = function(block) {
  var wifi_ssid = javascriptGenerator.valueToCode(block, 'WIFI_SSID', javascriptGenerator.ORDER_ATOMIC);
  var wifi_password = javascriptGenerator.valueToCode(block, 'WIFI_PASSWORD', javascriptGenerator.ORDER_ATOMIC);
  
  var code = '//Connect to Wi-Fi\n';
  code += 'WiFi.begin(' + wifi_ssid + ', ' + wifi_password + ');\n';
  code += 'Serial.print("Connecting to Wi-Fi");\n';
  code += 'lcd.clear();\n';
  code += 'lcd.setCursor(0, 0);\n';
  code += 'lcd.print("Connecting...");\n';
  code += 'int dots = 0;\n';
  code += 'while (WiFi.status() != WL_CONNECTED) {\n';
  code += '  Serial.print(".");\n';
  code += '  lcd.setCursor(13 + dots, 0);\n';
  code += '  lcd.print(".");\n';
  code += '  dots = (dots + 1) % 3;\n';
  code += '  delay(300);\n';
  code += '}\n';
  code += 'Serial.println("\\nConnected to Wi-Fi");\n';
  code += 'Serial.println(WiFi.localIP());\n';
  code += 'lcd.clear();\n';
  code += 'lcd.setCursor(0, 0);\n';
  code += 'lcd.print("WiFi Connected!");\n';
  code += 'lcd.setCursor(0, 1);\n';
  code += 'lcd.print(WiFi.localIP());\n';
  code += 'delay(2000);\n';
  return code;
};

//חיבור לפיירבייס
Blockly.Blocks['firebase_config'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("התחברות ל- Firebase");
    this.appendValueInput("DATABASE_URL")
        .setCheck("String")
        .appendField("קישור ל-Database");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(350);
    this.setTooltip("Configures and connects to Firebase with the specified database URL.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['firebase_config'] = function(block) {
  var database_url = javascriptGenerator.valueToCode(block, 'DATABASE_URL', javascriptGenerator.ORDER_ATOMIC);
  
  var code = '// Firebase configuration\n';
  code += 'config.database_url = ' + database_url + ';\n';
  code += 'config.signer.test_mode = true;\n';
  code += 'Firebase.reconnectNetwork(true);\n';
  code += 'Firebase.begin(&config, &auth);\n';
  return code;
}

//המרה ממספר לטקסט 
Blockly.Blocks['int_to_string'] = {
  init: function() {
    this.appendValueInput("NUMBER")
        .setCheck("Number")
        .appendField("המר מספר לטקסט");
    this.setOutput(true, "String");
    this.setColour(160);
    this.setTooltip("Converts an integer to a clean string.");
    this.setHelpUrl("");
  }
};

javascriptGenerator.forBlock['int_to_string'] = function(block) {
  var number = javascriptGenerator.valueToCode(block, 'NUMBER', javascriptGenerator.ORDER_ATOMIC) || '0';
  var code = 'String(' + number + ')';
  return [code, javascriptGenerator.ORDER_ATOMIC];
};


//-------------------------------------------------------------------- פונקציות והיתחול הבלוקים ------------------------------------------------------
const initializeBlockly = () => {
    if (!toolboxConfiguration) {
      alert('Toolbox configuration not loaded yet. Waiting...');
      return;
    }

    try {
      const ws = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxConfiguration,
        scrollbars: true,
      });

      if (initialXml) {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(initialXml), ws);
      } else {
        const storedWorkspace = localStorage.getItem('blocklyWorkspace');
        if (storedWorkspace && storedWorkspace.length > 0) {
          try {
            const dom = Blockly.utils.xml.textToDom(storedWorkspace);
            Blockly.Xml.domToWorkspace(dom, ws);
          } catch (error) {
            console.error('Failed to load workspace from localStorage:', error);
          }
        }
      }

      setWorkspace(ws);

      const generateCode = () => {
        if (ws) {
          let setupCode = '';
          let loopCode = '';
          let functionCode = '';
          let globalVariablesCode = '';

          const arduinoCodeBlock = ws.getAllBlocks().find((block) => block.type === 'infinite_loop');

          if (arduinoCodeBlock) {
            setupCode = javascriptGenerator.statementToCode(arduinoCodeBlock, 'SETUP');
            loopCode = javascriptGenerator.statementToCode(arduinoCodeBlock, 'LOOP');
          }

          for (const block of ws.getAllBlocks()) {
            try {
              if (block.type === 'variables_create') {
                globalVariablesCode += javascriptGenerator.blockToCode(block) + '\n';
              } else if (
                block.type === 'function_definition_noreturn' ||
                block.type === 'gass_function' ||
                block.type === 'temp_function' ||
                block.type === 'motion_sensor_function' ||
                block.type === 'light_sensor_function' ||
                block.type === 'open_door_function' ||
                block.type === 'open_window_function' ||
                block.type === 'activate_alarm_function'
              ) {
                functionCode += javascriptGenerator.blockToCode(block) + '\n';
              }
            } catch (error) {
              console.error('Error generating code for block', block, error);
            }
          }

          const completeCode = baseCode
            .replace('// **GLOBAL_VARIABLES**', globalVariablesCode)
            .replace('// **SETUP_CODE**', setupCode)
            .replace('// **LOOP_CODE**', loopCode)
            .replace('// **FUNCTION_DEFINITIONS**', functionCode);

          setGeneratedCode(completeCode);
        }
      };

      const saveWorkspace = () => {
        if (ws) {
          try {
            const xml = Blockly.Xml.workspaceToDom(ws);
            const xmlText = Blockly.Xml.domToText(xml);
            localStorage.setItem('blocklyWorkspace', xmlText);
            console.log('Workspace saved to localStorage!');
          } catch (error) {
            console.error('Failed to save workspace to localStorage:', error);
          }
        }
      };

      saveWorkspaceRef.current = saveWorkspace;

      ws.addChangeListener(() => {
        generateCode();
        saveWorkspaceRef.current();
      });

      ws.addChangeListener(generateCode);

      window.addEventListener('resize', resizeBlocklyDiv);
      resizeBlocklyDiv();

      return () => {
        window.removeEventListener('resize', resizeBlocklyDiv);
        ws.dispose();
      };
    } catch (error) {
      console.error('Error initializing Blockly:', error);
    }
  };

  useEffect(() => {
    const fetchToolboxConfiguration = async () => {
      try {
        const response = await fetch('toolbox.json');
        const data = await response.json();
        setToolboxConfiguration(data);
      } catch (error) {
        console.error('Error loading toolbox:', error);
      }
    };

    fetchToolboxConfiguration();
  }, []);

  useEffect(() => {
    if (toolboxConfiguration) {
      initializeBlockly();
    }
  }, [toolboxConfiguration]);

  useEffect(() => {
    if (blocklyDiv.current && workspace) {
      resizeBlocklyDiv();
    }
  }, [workspace]);

    const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Use the filename from the state
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


   const toggleEditorVisibility = () => { // פונקציה לשינוי מצב התצוגה
    setIsEditorVisible(!isEditorVisible);
  };
    const saveWorkspaceButtonClick = () => {
    saveWorkspaceRef.current();
    alert('Workspace saved!');
  };



  return (
    
    
    
<div
  style={{
    width: '100%',
    height: '800px',
    // position: 'relative',
    display: 'flex',
    flexDirection: 'column',
   
  }}
>
  {/* חלק ה־ReactFlow בתוך אזור הגלילה */}
  <div style={{ width: '100%', flex: 1, overflow: 'auto' ,}}>
    <div style={{ width: '5000px', height: '10000px', }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // nodes={nodes}
        // edges={edges}
        style={{ width: '100%', height: '100%' }}
      >
        <Controls />
        <Background color="#eee" gap={16} />
      </ReactFlow>
    </div>
  </div>

  {/* הבלוקים של Blockly */}
  <div
    ref={blocklyDiv}
    id="blocklyDiv"
    style={{
      width: '100%',
      height: '7000px',
      position: '-moz-initial',
     
      zIndex: 2,
    }}
  ></div>

    {/* כפתור להצגה/הסתרה של עורך הקוד */}
   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '100px' }}>
  <label htmlFor="filename" style={{ marginRight: '5px', marginTop: '10px', }}>שם קובץ:</label>
  <input
    type="text"
    id="filename"
    value={filename}
    onChange={(e) => setFilename(e.target.value)}
    style={{
      marginRight: '10px',
       marginTop: '10px',
      padding: '8px',
      fontSize: '14px',
      borderRadius: '5px',
      border: '1px solid #ccc',
    }}
  />
    <button
    onClick={handleDownload}
    style={{
      backgroundColor: '#4CAF50',
      border: 'none',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
       marginTop: '10px',
      fontSize: '14px',
      marginRight: '10px',
      cursor: 'pointer',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
      transition: 'background-color 0.3s ease',
    }}
  >
    הורד קוד
  </button>
  <button
    onClick={toggleEditorVisibility}
    style={{
      backgroundColor: '#2196F3',
      border: 'none',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '14px',
      marginRight: '10px',
      marginTop: '10px',
      cursor: 'pointer',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
      transition: 'background-color 0.3s ease',
    }}
  >
    {isEditorVisible ? 'הסתר קוד' : 'הצג קוד'}
  </button>




  <button
    onClick={saveWorkspaceButtonClick}
    style={{
      backgroundColor: '#007BFF',
      border: 'none',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
       marginTop: '10px',
      fontSize: '14px',
      cursor: 'pointer',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
      transition: 'background-color 0.3s ease',
    }}
  >
    שמור Workspace
  </button>
</div>
{/* תנאי להצגה/הסתרה של עורך הקוד */}
    {isEditorVisible && (
      <MonacoEditor
        key={generatedCode}
        width="100%"
        height="6000px"
        language="arduino"
        theme="vs-light"
        value={generatedCode}
        options={{
          selectOnLineNumbers: true,
          readOnly: false,
          wordWrap: 'on',
          wrappingIndent: 'deepIndent'
        }}
        style={{ zIndex: 1 }}
      />
    )}


{/* <button
    onClick={toggleNewBlockForm}
    style={{
        backgroundColor: '#673ab7',
        color: 'white',
        padding: '8px 16px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '14px',
        cursor: 'pointer',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
        transition: 'background-color 0.3s ease',
        marginBottom: '10px',
    }}
>
    {showNewBlockForm ? 'הסתר יצירת בלוק חדש' : 'הצג יצירת בלוק חדש'}
</button>

{showNewBlockForm && (
    <div style={{
        width: '100%',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px',
    }}>
       <div style={{
    width: '100%',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
}}>
    <h3>יצירת בלוק חדש</h3>
    <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>שם הבלוק:</label>
        <input
            type="text"
            value={newBlockName}
            onChange={handleNewBlockNameChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
    </div>
      <div style={{ marginBottom: '10px' }}>
<label style={{ display: 'block', marginBottom: '5px' }}>שם הקטגוריה:</label>
<input
    type="text"
    value={newCategoryName}
    onChange={handleNewCategoryNameChange}
    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
    />
</div>
    <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>צבע הבלוק:</label>
        <input
            type="color"
            value={newBlockColor}
            onChange={handleNewBlockColorChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
    </div>
    <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Tooltip:</label>
        <input
            type="text"
            value={newBlockTooltip}
            onChange={handleNewBlockTooltipChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
    </div>
    <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>קוד:</label>
        <textarea
            value={newBlockCode}
            onChange={handleNewBlockCodeChange}
            style={{ width: '100%', height: '100px', padding: '8px', boxSizing: 'border-box', resize: 'vertical' }}
        />
    </div>
    <button
        onClick = {createNewBlock}
        style={{
           
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
        }}
    >
        צור בלוק
    </button>
</div> */}
    {/* </div>
)} */}


    

</div>
  );
}

export default Builder;