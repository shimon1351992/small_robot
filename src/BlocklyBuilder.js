import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from 'react-flow-renderer';

const initialBlocks = [
  { id: 'block1', label: 'תשובה 1', position: { x: 50, y: 150 }, imageUrl: 'https://i.imgur.com/BhqD0wa.png' },
  { id: 'block2', label: 'תשובה 2', position: { x: 200, y: 150 }, imageUrl: 'https://i.imgur.com/7AyPrtO.png' },
  { id: 'block3', label: 'תשובה 3', position: { x: 50, y: 250 }, imageUrl: 'https://i.imgur.com/BhqD0wa.png' },
  { id: 'block4', label: 'תשובה 4', position: { x: 200, y: 250 }, imageUrl: 'https://i.imgur.com/BhqD0wa.png' },
];

const questions = [
  {
    questionData: (
      <>
        <h2>שאלה 1</h2>
        איזה מבין התשובות הבאות<br />
      ?מכילה את התמונה המלאה של הקוד לשליטה על חיישן גז
      </>
    ),
    correctAnswerId: 'block2',
  },
  {
    questionData: (
      <>
        <h2>שאלה 2</h2>
        מהי התשובה הנכונה לשאלה 2?<br />
        השאלה השנייה היא שונה מזו הקודמת
      </>
    ),
    correctAnswerId: 'block3',
  },
];

// סגנונות לבלוקים
const containerStyle = {
  width: 140,
  height: 60,
  borderRadius: 15,
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1em',
  color: '#555',
  border: '2px dashed #ccc',
  padding: '5px',
  zIndex: 1,
};

const blockStyle = {
  width: 140,
  height: 60,
  borderRadius: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  fontSize: '1.1em',
  boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
  border: '1px solid #90caf9',
  padding: '5px',
  zIndex: 2,
  backgroundImage: 'https://i.imgur.com/aQbl3i2.png',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  textAlign: 'center',
  color: 'black',
};

function BlocklyBuilder() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = questions[currentQuestionIndex];

  const [nodes, setNodes] = useNodesState(() => {
    const initialContainer = {
      id: 'container',
      data: { label: 'תיבת תשובה', insideBlock: null },
      position: { x: 125, y: 50 },
      style: containerStyle,
      draggable: false,
      type: 'container',
    };

    const initialBlockNodes = initialBlocks.map(b => ({
      id: b.id,
      data: { label: b.label },
      position: b.position,
      style: { ...blockStyle, backgroundColor: '#fff' },
      type: 'block',
    }));

    return [initialContainer, ...initialBlockNodes];
  });

  const [edges, setEdges] = useEdgesState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(currentQuestion.correctAnswerId);

  // עדכון התשובה הנכונה כאשר השאלה משתנה
  useEffect(() => {
    setCorrectAnswer(currentQuestion.correctAnswerId);
  }, [currentQuestion]);

  // עדכון מיקום נוד (בלוק או תיבת תשובה)
  const updateNodePosition = useCallback((nodeId, newPosition) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, position: newPosition } : node
      )
    );
  }, [setNodes]);

  // אירוע התחלת גרירה של נוד
  const onNodeDragStart = (event, node) => {
    // ניתן להוסיף לוגיקה כאן אם רוצים לנהל משהו בהתחלה
  };

  // אירוע בזמן גרירת נוד
  const onNodeDrag = (event, node) => {
    updateNodePosition(node.id, node.position);
  };

  const onNodeDragStop = (event, node) => {
  const containerNode = nodes.find(n => n.id === 'container');

  if (!containerNode) return;

  // הגדרת גבולות תיבת התשובה
  const container = {
    x: containerNode.position.x,
    y: containerNode.position.y,
    width: containerNode.style.width ?? 140,
    height: containerNode.style.height ?? 60,
  };

  // מיקום מרכז תיבת התשובה
  const containerCenterX = container.x + container.width / 2;
  const containerCenterY = container.y + container.height / 2;

  // מיקום מרכז ה-node
  const nodeCenterX = node.position.x + 70; // חצי מ־width=140
  const nodeCenterY = node.position.y + 30; // חצי מ־height=60

  // מרחק בין ה-node למרכז התיבה
  const distance = Math.hypot(nodeCenterX - containerCenterX, nodeCenterY - containerCenterY);
  const threshold = 50; // טווח קל לכניסה אוטומטית

  if (distance < threshold) {
    // הכנסת ה-node למרכז תיבת התשובה
    updateNodePosition(node.id, {
      x: containerCenterX - 70, // מרכז הבלוק בתיבה
      y: containerCenterY - 30,
    });

    // עדכון בתוך נוד תיבת התשובה
    setNodes(prevNodes =>
      prevNodes.map(n => {
        if (n.id === 'container') {
          return { ...n, data: { ...n.data, insideBlock: node.id } };
        }
        if (n.id === node.id) {
          const isCorrect = node.id === correctAnswer;
          const bgColor = isCorrect ? '#a8e6cf' : '#ff8a80';
          return { ...n, style: { ...n.style, background: bgColor } };
        }
        return n;
      })
    );
  } else {
    // במידה וה-node יצא מרחק בטווח, מחזיר למיקום ההתחלתי
    const initialPosition = initialBlocks.find(b => b.id === node.id)?.position;
    if (initialPosition) {
      updateNodePosition(node.id, initialPosition);
      // לנקות את הinsideBlock אם ה-node יצא מהתיבה
      setNodes(prevNodes =>
        prevNodes.map(n => {
          if (n.id === 'container') {
            return { ...n, data: { ...n.data, insideBlock: null }, style: { ...n.style, background: '#f7f7f7' } };
          } else if (n.id === node.id) {
            // לשמר את הרקע המקורי של הבלוק
            return { ...n, style: { ...n.style, background: '#f7f7f7', backgroundImage: 'https://i.imgur.com/aQbl3i2.png' } };
          }
          return n;
        })
      );
    }
  }
};

  const handleBlockClick = (event, node) => {
    const block = initialBlocks.find((b) => b.id === node.id);
    if (block && block.imageUrl) {
      setSelectedImage(block.imageUrl);
    }
  };


return (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column-reverse',
      height: '80vh',
      background: '#f5f5f5',
    }}
  >
    {/* חלק עליון: אזור ה-ReactFlow */}
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={handleBlockClick}
          style={{ background: 'transparent' }}
          fitView
        >
          <Controls />
          <Background color="#eee" gap={16} />
        </ReactFlow>
      </div>
    </div>

    {/* חלק תחתון: שאלה וכפתורי מעבר */}
    <div
      style={{
        flex: 1,
        maxHeight: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* מיקום השאלה */}
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {currentQuestion.questionData}
      </h2>

      {/* כפתורי מעבר בין שאלות */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        {/* שאלה קודמת */}
        <button
          style={{
            flex: 1,
            height: '50px',
            fontSize: '1em',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
            }
          }}
        >
          שאלה קודמת
        </button>

        {/* שאלה הבאה */}
        <button
          style={{
            flex: 1,
            height: '50px',
            fontSize: '1em',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
          }}
        >
          שאלה הבאה
        </button>
      </div>
    </div>

    {/* תצוגת תמונה במרכז המסך במידת הצורך */}
    {selectedImage && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
          }}
        >
          {/* התמונה שנבחרה */}
          <img src={selectedImage} alt="Selected Block" style={{ maxWidth: '100%', maxHeight: '100%' }} />
           {/* כפתור סגירה */}
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              fontSize: '1em',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            סגור
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default BlocklyBuilder;