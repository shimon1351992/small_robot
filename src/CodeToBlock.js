import React, {
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';
import * as Blockly from 'blockly';
import {
  javascriptGenerator
} from 'blockly/javascript';
import MonacoEditor from 'react-monaco-editor';
import ReactFlow, {
  Controls,
  Background
} from 'react-flow-renderer';
import 'blockly/javascript';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

function CodeToBlock({
  initialXml
}) {
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
  const [categoryOptions, setCategoryOptions] = useState([]);
const [selectedCategory, setSelectedCategory] = useState(''); // הקטגוריה שנבחרה
const [newCategory, setNewCategory] = useState(''); // הקטגוריה שתיכתב על ידי המשתמש
  const isInitialMount = useRef(true);

const baseCode = `
#include <Arduino.h>
uint8_t  LEDArray[8];
const int left_ctrl = 4;//define the direction control pin of A motor
const int left_pwm = 6;//define the speed control of A motor
const int right_ctrl = 2;//define the direction control pin of B motor 
const int right_pwm = 5;//define the speed control pin of B motor 
#include <IRremote.h>//function library of IR remote control
int RECV_PIN = 3;//set the pin of IR receiver to D3
IRrecv irrecv(RECV_PIN);
long irr_val;
decode_results results;
const int speedIncrement = 10; 
char currentDirection = 'S';
uint8_t matrix_heart[8] = {0xCC, 0x33, 0x03, 0x03, 0x84, 0x48, 0x30, 0x00};
uint8_t matrix_smile[8] = {0x84, 0x4B, 0x4B, 0x00, 0x00, 0x48, 0x30, 0x00};
uint8_t matrix_front2[8]={0x18,0x24,0x42,0x99,0x24,0x42,0x81,0x00};
uint8_t matrix_back2[8]={0x00,0x81,0x42,0x24,0x99,0x42,0x24,0x18};
uint8_t matrix_left2[8]={0x12,0x24,0x48,0x90,0x90,0x48,0x24,0x12};
uint8_t matrix_right2[8]={0x48,0x24,0x12,0x09,0x09,0x12,0x24,0x48};
uint8_t matrix_stop2[8]={0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x18};
// **GLOBAL_VARIABLES** 

void setup() {
 pinMode(left_ctrl,OUTPUT);//
  pinMode(left_pwm,OUTPUT);//
  pinMode(right_ctrl,OUTPUT);//
  pinMode(right_pwm,OUTPUT);//
    Serial.begin(115200);//
  // In case the interrupt driver crashes on setup, give a clue
  // to the user what's going on.
  Serial.println("Enabling IRin");
  irrecv.enableIRIn(); // Start the receiver
  Serial.println("Enabled IRin");
  matrix.begin(0x70); // כתובת I2C ברירת מחדל
  matrix.clear();
  
  // **SETUP_CODE**  
}

void loop() {
  if (irrecv.decode(&results)) {

    
  // **LOOP_CODE** 


 irrecv.resume(); // קבלת הפקודה הבאה
    delay(100);
} 

}


void applyCurrentDirection() {
  // פונקציה שמפעילה את הכיוון הנוכחי עם המהירות הנוכחית
  switch (currentDirection) {
    case 'F':
      car_front(speedleft, speedright);
      break;
    case 'B':
      car_back(speedleft, speedright);
      break;
    case 'L':
      car_left(speedleft, speedright);
      break;
    case 'R':
      car_right(speedleft, speedright);
      break;
    case 'S':
      car_Stop(speedleft, speedright);
      break;
  }
}


void car_front(int speed1 , int speed2)//define the state of going front
{
  digitalWrite(left_ctrl,HIGH);
  analogWrite(left_pwm,speed1);
  digitalWrite(right_ctrl,HIGH);
  analogWrite(right_pwm,speed2);
}

void car_back(int speed1 , int speed2)//define the status of going back
{
  digitalWrite(left_ctrl,LOW);
  analogWrite(left_pwm,speed1);
  digitalWrite(right_ctrl,LOW);
  analogWrite(right_pwm,speed2);
}

void car_left(int speed1 , int speed2)//set the status of left turning
{
  digitalWrite(left_ctrl,LOW);
  analogWrite(left_pwm,speed1);
  digitalWrite(right_ctrl,HIGH);
  analogWrite(right_pwm,speed2);
}

void car_right(int speed1 , int speed2)//set the status of right turning
{
  digitalWrite(left_ctrl,HIGH);
  analogWrite(left_pwm,speed1);
  digitalWrite(right_ctrl,LOW);
  analogWrite(right_pwm,speed2);
}

void car_Stop(int speed1 , int speed2)//define the state of stop
{
  digitalWrite(left_ctrl,LOW);
  analogWrite(left_pwm,0);
  digitalWrite(right_ctrl,LOW);
  analogWrite(right_pwm,0);
}

void matrix_display(unsigned char matrix_value[]) {
  matrix.clear(); // מנקה את התצוגה לפני שמציירים משהו חדש

  for (int i = 0; i < 8; i++) {
    unsigned char row = matrix_value[i]; // מקבל את הערך של השורה הנוכחית

    for (int j = 0; j < 8; j++) { // שיניתי את הסדר של הלולאה כדי להתאים לספרייה
      if (row & 0x01) { // בודק אם הביט הכי פחות משמעותי דולק
        matrix.drawPixel(j, i, LED_ON); // מצייר פיקסל דולק במיקום (j, i)
      }
      row >>= 1; // מזיז את הביטים ימינה כדי לבדוק את הביט הבא
    }
  }

  matrix.writeDisplay(); // מעדכן את התצוגה עם הפיקסלים שצוירו
}
// **FUNCTION_DEFINITIONS** 
`;

  const resizeBlocklyDiv = () => {
    if (blocklyDiv.current && blocklyArea.current && workspace) {
      blocklyDiv.current.style.width = blocklyArea.current.offsetWidth + 'px';
      blocklyDiv.current.style.height = blocklyArea.current.offsetHeight + 'px';
      Blockly.svgResize(workspace);
    }
  };



  
const createDynamicBlock = useCallback((blockName, blockData) => {
  if (!blockName || !blockData) {
    console.warn("Invalid block data received. Skipping block creation.");
    return;
  }

  Blockly.Blocks[blockName] = {
    init: function() {
      this.appendDummyInput().appendField(blockData.name || blockName);
      this.setTooltip(blockData.tooltip || '');
      this.setColour(blockData.colour || 210);

      // הוסף סוגים נוספים של כניסות אם יש לך כאלה בנתונים שלך.
    
      this.setPreviousStatement(blockData.previousStatement !== undefined ? blockData.previousStatement : true);
      this.setNextStatement(blockData.nextStatement !== undefined ? blockData.nextStatement : true);
      this.setOutput(blockData.output !== undefined ? blockData.output : false, blockData.outputType || null);
    },
  };

  if (blockData.code) {
    javascriptGenerator.forBlock[blockName] = function(block) {
      return blockData.code;
    };
  }
}, []);






  const loadBlocksFromFirebase = useCallback(async () => {
    try {
      const ref = firebase.database().ref(`categories`);
      const snapshot = await ref.once('value');
      const categories = snapshot.val();

      if (categories) {
        Object.entries(categories).forEach(([categoryName, categoryData]) => {
          if (categoryData && categoryData.blocks) {
            Object.entries(categoryData.blocks).forEach(([blockName, blockData]) => {
              if (!Blockly.Blocks[blockName]) {
                console.log('Creating block', blockName, 'with data', blockData);
                createDynamicBlock(blockName, blockData);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error loading blocks from Firebase:', error);
    }
  }, [createDynamicBlock]);





  const createToolboxConfiguration = useCallback((categoriesData) => {
    const toolbox = {
      "kind": "categoryToolbox",
      "contents": []
    };

    if (categoriesData) {
      Object.entries(categoriesData).forEach(([categoryName, categoryData]) => {
        if (categoryData && categoryData.blocks) {
          const category = {
            "kind": "category",
            "name": categoryName.replace(/_/g, ' '),
            "contents": Object.entries(categoryData.blocks).map(([blockName, blockData]) => ({
              "kind": "block",
              "type": blockName
            }))
          };
          toolbox.contents.push(category);
        }
      });
    }

    return toolbox;
  }, []);




  const initializeBlockly = useCallback(async (toolbox) => {
    try {
      if (!toolbox) {
        alert('Toolbox configuration not loaded yet. Waiting...');
        return;
      }

      if (!workspace && blocklyDiv.current) {
        const ws = Blockly.inject(blocklyDiv.current, {
          toolbox: toolbox,
          scrollbars: true,
        });
        setWorkspace(ws);
      }

      const ws = workspace;
      if (!ws) return;

      if (initialXml) {
        try {
          const xml = Blockly.Xml.textToDom(initialXml);
          Blockly.Xml.domToWorkspace(xml, ws);
        } catch (err) {
          console.error('שגיאה בטעינת ה XML:', err);
        }
      }

      const generateCode = () => {
        if (ws) {
          let code = javascriptGenerator.workspaceToCode(ws);
          setGeneratedCode(code);
        }
      };
      ws.addChangeListener(() => {
        generateCode();
      });

      window.addEventListener('resize', resizeBlocklyDiv);
      resizeBlocklyDiv();

      return () => {
        window.removeEventListener('resize', resizeBlocklyDiv);
        if (ws) {
          ws.dispose();
        }
      };
    } catch (error) {
      console.error('שגיאה באתחול Blockly:', error);
    }
  }, [initialXml, workspace]);
    const fetchToolboxConfiguration = useCallback(async () => {
        try {
            const response = await fetch('toolbox.json');
            const data = await response.json();
            return data
        } catch (error) {
            console.error('Error loading toolbox:', error);
        }
    }, []);




  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadBlocksFromFirebase();

        const snapshot = await firebase.database().ref(`categories`).once('value');
        const categoriesData = snapshot.val() || {};
        const finalToolboxConfiguration = createToolboxConfiguration(categoriesData);
        initializeBlockly(finalToolboxConfiguration);
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchData();
    }
  }, [createToolboxConfiguration, initializeBlockly, loadBlocksFromFirebase]);





    useEffect(() => {
        if (blocklyDiv.current && workspace) {
            resizeBlocklyDiv();
        }
    }, [workspace]);

    const handleDownload = () => {
        const blob = new Blob([generatedCode], {
            type: 'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // Use the filename from the state
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const toggleEditorVisibility = () => {
        setIsEditorVisible(!isEditorVisible);
    };
    const saveWorkspaceButtonClick = () => {
        saveWorkspaceRef.current();
        alert('Workspace saved!');
    };






   const saveBlockToFirebase = useCallback(async (blockData, categoryId) => {
  try {
    const categoryRef = database.ref(`categories/${categoryId}`);
    const snapshot = await categoryRef.once('value');

    // בודק אם הקטגוריה קיימת
    if (!snapshot.exists()) {
      // יוצרת את הקטגוריה אם לא קיימת
      await categoryRef.set({ blocks: {} });
    }

    // שומר את הבלוק בתוך הקטגוריה
    const blockId = blockData.name.replace(/\s+/g, '_');
    await categoryRef.child(`blocks/${blockId}`).set(blockData);

    console.log('Block saved to Firebase');
  } catch (error) {
    console.error('Error saving block to Firebase:', error);
  }
}, []);





    const handleNewBlockNameChange = (event) => {
        setNewBlockName(event.target.value);
    };

    const handleNewBlockColorChange = (event) => {
        setNewBlockColor(event.target.value);
    };

    const handleNewBlockTooltipChange = (event) => {
        setNewBlockTooltip(event.target.value);
    };

    const handleNewBlockCodeChange = (event) => {
        setNewBlockCode(event.target.value);
    };

    const handleNewCategoryNameChange = (event) => {
        setNewCategoryName(event.target.value);
    };





   const createNewBlock = useCallback(async () => {
  if (newBlockName && newBlockCode && (newCategory.trim() || selectedCategory)) {
    const categoryId = newCategory.trim()
      ? newCategory.replace(/\s+/g, '_')
      : selectedCategory.replace(/\s+/g, '_');

    const blockData = {
      name: newBlockName,
      tooltip: newBlockTooltip,
      colour: newBlockColor,
      code: newBlockCode,
    };

    await saveBlockToFirebase(blockData, categoryId);

    // איפוס שדות
    setNewBlockName('');
    setNewBlockColor('#4286f4');
    setNewBlockTooltip('');
    setNewBlockCode('');
    setNewCategory('');
    setSelectedCategory('');
    setShowNewBlockForm(false);
  } else {
    alert('יש למלא את כל השדות');
  }
}, [newBlockName, newBlockColor, newBlockTooltip, newBlockCode, newCategory, selectedCategory, saveBlockToFirebase]);




    const toggleNewBlockForm = () => {
        setShowNewBlockForm(!showNewBlockForm);
    };







    return (
        <div
            style={{
                width: '100%',
                height: '800px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{
                width: '100%',
                flex: 1,
                overflow: 'auto'
            }}>

            </div>

            <div
                ref={blocklyDiv}
                id="blocklyDiv"
                style={{
                    width: '100%',
                    height: '7000px',
                    position: 'relative',
                    zIndex: 2,
                }}
            ></div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '100px'
            }}>
                <label htmlFor="filename" style={{
                    marginRight: '5px',
                    marginTop: '10px',
                }}>שם קובץ:</label>
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
                    style={{
                        zIndex: 1
                    }}
                />
            )}

            
            {/* טופס ליצירת בלוקים */}
            <button
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
                    <h3>יצירת בלוק חדש</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px'
                        }}>שם הבלוק:</label>
                        <input
                            type="text"
                            value={newBlockName}
                            onChange={handleNewBlockNameChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px'
                        }}>שם הקטגוריה:</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={handleNewCategoryNameChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px'
                        }}>צבע הבלוק:</label>
                        <input
                            type="color"
                            value={newBlockColor}
                            onChange={handleNewBlockColorChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px'
                        }}>Tooltip:</label>
                        <input
                            type="text"
                            value={newBlockTooltip}
                            onChange={handleNewBlockTooltipChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px'
                        }}>קוד:</label>
                        <textarea
                            value={newBlockCode}
                            onChange={handleNewBlockCodeChange}
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '8px',
                                boxSizing: 'border-box',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>בחר קטגוריה קיימת או הוסף אחת חדשה:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setNewCategory('');
                            }}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        >
                            <option value="">-- בחר קטגוריה קיימת --</option>
                            {categoryOptions.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <label style={{ display: 'block', marginBottom: '5px' }}>או הקלד קטגוריה חדשה:</label>
                        <input
                            type="text"
                            placeholder="שם הקטגוריה החדשה"
                            onChange={(e) => {
                                setNewCategory(e.target.value);
                                setSelectedCategory(''); // נקה את הקטגוריה שנבחרה
                            }}
                            value={newCategory}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        />
</div>
                    <button
                        onClick={createNewBlock}
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
                </div>
            )}
        </div>
    );
}

export default CodeToBlock;