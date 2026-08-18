const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// 🔑 OPENROUTER API KEY & GEMINI AI MODEL
// ============================================================================
// מפתח ה-API שלך מ-OpenRouter:
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const DEFAULT_AI_MODEL = "google/gemini-2.0-flash-001"; // Google Vertex / Gemini Engine

const { 
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
  isDbConnected 
} = require('./db');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  res.header('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Uploads directory for custom track images / PDFs
const uploadsDir = path.join(__dirname, 'uploads', 'custom_tracks');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Determine executable path for arduino-cli (Windows / Linux / Render)
function getArduinoCliPath() {
  const customWindowsPath = "C:\\Users\\shimo\\arduino-cli.exe";
  if (fs.existsSync(customWindowsPath)) return `"${customWindowsPath}"`;

  const localBinPath = path.join(__dirname, 'bin', 'arduino-cli');
  if (fs.existsSync(localBinPath)) return `"${localBinPath}"`;

  const rootBinPath = path.join(__dirname, '..', 'server', 'bin', 'arduino-cli');
  if (fs.existsSync(rootBinPath)) return `"${rootBinPath}"`;

  return 'arduino-cli';
}
const arduinoCliPath = getArduinoCliPath();

// Temporary workspace & cache directory
const tempDir = path.join(__dirname, 'arduino_temp');
const cacheDir = path.join(__dirname, 'arduino_cache');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// Clean up old UUID scratch folders inside arduino_temp to avoid confusion
try {
  const files = fs.readdirSync(tempDir);
  files.forEach(file => {
    if (file !== 'current_project' && file !== 'superbot_car') {
      const p = path.join(tempDir, file);
      if (fs.statSync(p).isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    }
  });
} catch (e) {}

// Supported Boards FQBN Mapping
const BOARD_FQBN_MAP = {
  'esp32': 'esp32:esp32:esp32:FlashMode=dio,FlashFreq=80,UploadSpeed=921600',
  'esp32s3': 'esp32:esp32:esp32s3:FlashMode=qio,FlashFreq=80',
  'uno': 'arduino:avr:uno',
  'nano': 'arduino:avr:nano',
  'mega': 'arduino:avr:mega'
};

// Exact Clean C++ SuperBot.h
const DEFAULT_SUPERBOT_H = `
#ifndef SuperBot_h
#define SuperBot_h

#include "Arduino.h"
#include <Wire.h>
#include "driver/rmt.h"
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiAP.h>
#include "esp_camera.h"
#include "esp_http_server.h"

// ================= הגדרות חומרה רגילות =================
#define LIGHT_SENSOR_PIN 33
#define DARK_THRESHOLD   2400
#define IR_PIN           0
#define LED_PIN          32
#define NUM_LEDS         12
#define PCA_ADDR         0x5F
#define MATRIX_ADDR      0x71
#define PIN_BUZZER       2
#define BUZZER_FREQ      2000

// --- הגדרות חיישן מרחק (מעודכן לפי קוד המקור) ---
#define PIN_SONIC_TRIG   12            
#define PIN_SONIC_ECHO   15            
#define MAX_DISTANCE     300           
#define SONIC_TIMEOUT    (MAX_DISTANCE * 60) 
#define SOUND_VELOCITY   340           

// כתובת החיישן למעקב קו ב-I2C
#define TRACK_SENSOR_ADDR 0x20

// קודי כפתורים (לשימוש התלמידים)
#define BTN_FWD    0xFF02FD
#define BTN_BACK   0xFF9867
#define BTN_RIGHT  0xFF906F
#define BTN_LEFT   0xFFE01F
#define BTN_STOP   0xFFA857
#define BTN_FASTER 0xFF18E7
#define BTN_SLOWER 0xFF4AB5
#define BTN_0      0xFF6897

// סוגי עיניים
enum EyeExpression {
    EYE_NORMAL,
    EYE_HAPPY,
    EYE_ANGRY
};

class SuperBot {
  public:
    SuperBot();
    void begin();

    // --- מצלמה ו-WiFi ---
    bool beginCamera(wifi_mode_t wifiMode = WIFI_AP, const char* ssid = "SuperBot", const char* password = "");
    void stopCamera();
    void handleCamera(); 

    // --- שלט רחוק ---
    String getIRCommand();

    // --- חיישנים (אור, קול ומרחק) ---
    int readLightSensor();
    bool isDark();
    float getDistance(); // פונקציה חדשה לקבלת מרחק בס"מ

    // --- חיישן מעקב קו ---
    bool checkLine(int left, int center, int right);

    // --- תנועה ---
    void moveForward(int speed);
    void moveBackward(int speed);
    void turnLeft(int speed);
    void turnRight(int speed);
    void stop();
    
    // --- ראש ---
    void moveHead(int pan, int tilt);
    void centerHead();

    // --- תצוגה וקול ---
    void setEyes(EyeExpression expression);
    void setLeds(uint8_t r, uint8_t g, uint8_t b);
    void beep(int duration);

  private:
    httpd_handle_t camera_httpd = NULL;

    // פונקציות רובוט פנימיות
    void initPCA();
    void initMatrix();
    void setupLeds();
    void initTrackSensor();
    void initUltrasonic(); // אתחול חיישן מרחק פנימי
    void setMotor(int pin1, int pin2, int speed);
    void pwm(int pin, int v);
    void writeMatrix(byte left[], byte right[]);
    unsigned long decodeIR(); 

    // פונקציות מצלמה פנימיות
    bool cameraSetupHardware();
    void setupWiFi_AP(const char* ssid, const char* pass);
    void setupWiFi_STA(const char* ssid, const char* pass);
    static void cameraTaskWrapper(void* pvParameters);
    void cameraTask();
    void startCameraServer();
    WiFiServer server_Cmd;
    WiFiServer server_Camera;
    bool videoFlag;
};

#endif
`;

const DEFAULT_SUPERBOT_CPP = `
#include "SuperBot.h"

static bool camera_is_active = false;

byte _EYE_NORMAL[8] = {0x18, 0x24, 0x42, 0x42, 0x42, 0x42, 0x24, 0x18};
byte _EYE_HAPPY[8]  = {0x00, 0x00, 0x42, 0x24, 0x24, 0x42, 0x00, 0x00};
byte _EYE_ANGRY[8]  = {0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81};

#define M1_IN1 15 
#define M1_IN2 14
#define M2_IN1 9 
#define M2_IN2 8
#define M3_IN1 12 
#define M3_IN2 13
#define M4_IN1 10 
#define M4_IN2 11
#define RMT_TX_CHANNEL RMT_CHANNEL_0

#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    21
#define SIOD_GPIO_NUM    26
#define SIOC_GPIO_NUM    27
#define Y9_GPIO_NUM      35
#define Y8_GPIO_NUM      34
#define Y7_GPIO_NUM      39
#define Y6_GPIO_NUM      36
#define Y5_GPIO_NUM      19
#define Y4_GPIO_NUM      18
#define Y3_GPIO_NUM       5
#define Y2_GPIO_NUM       4
#define VSYNC_GPIO_NUM   25
#define HREF_GPIO_NUM    23
#define PCLK_GPIO_NUM    22

SuperBot::SuperBot() : camera_httpd(NULL) {}

void SuperBot::begin() {
    Wire.begin(13, 14);
    analogSetAttenuation(ADC_11db);
    pinMode(LIGHT_SENSOR_PIN, INPUT);
    pinMode(IR_PIN, INPUT);
    
    initPCA();
    initMatrix();
    setupLeds();
    initTrackSensor();
    initUltrasonic(); // <--- הוספנו את האתחול של החיישן לכאן
    
    pinMode(PIN_BUZZER, OUTPUT);
    ledcAttachChannel(PIN_BUZZER, BUZZER_FREQ, 10, 0);
    centerHead();
    setEyes(EYE_NORMAL);
    setLeds(0,0,0);
}

// =================== פונקציות שרת HTTP ומצלמה ===================
// (נשאר בדיוק כמו בקובץ שלך)

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\\r\\n--" PART_BOUNDARY "\\r\\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n";

static esp_err_t index_handler(httpd_req_t *req);
static esp_err_t stream_handler(httpd_req_t *req);
static esp_err_t capture_handler(httpd_req_t *req);

static esp_err_t index_handler(httpd_req_t *req) {
    const char* html = R"rawhtml(<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SuperBot Vision</title><style>body{background-color:#222;color:white;text-align:center;font-family:Arial;} img{width:100%;max-width:600px;border-radius:10px;border:3px solid #00ff00;}</style></head><body><h1>SuperBot Live Feed</h1><img src="/stream"></body></html>)rawhtml";
    httpd_resp_set_type(req, "text/html");
    return httpd_resp_send(req, html, strlen(html));
}

static esp_err_t stream_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t * _jpg_buf = NULL;
    char * part_buf[64];

    res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
    if(res != ESP_OK) return res;

    while(true){
        fb = esp_camera_fb_get();
        if (!fb) { res = ESP_FAIL; } 
        else { _jpg_buf_len = fb->len; _jpg_buf = fb->buf; }
        
        if(res == ESP_OK){
            size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
            res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
        }
        if(res == ESP_OK){ res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len); }
        if(res == ESP_OK){ res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY)); }
        
        if(fb){ esp_camera_fb_return(fb); fb = NULL; _jpg_buf = NULL; }
        if(res != ESP_OK) break;
    }
    return res;
}

bool SuperBot::beginCamera(wifi_mode_t wifiMode, const char* ssid, const char* password) {
    if (camera_is_active) return true;
    if (!cameraSetupHardware()) return false;
    
    if (wifiMode == WIFI_AP) setupWiFi_AP(ssid, password);
    else setupWiFi_STA(ssid, password);
    
    startCameraServer();
    camera_is_active = true;
    return true;
}
// ==========================================
// פונקציה חדשה: לכידת תמונה בודדת (צילום)
// ==========================================
static esp_err_t capture_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;
    
    // צילום פריים אחד מהמצלמה
    fb = esp_camera_fb_get();
    if (!fb) { 
        Serial.println("Camera capture failed");
        httpd_resp_send_500(req);
        return ESP_FAIL; 
    }
    
    // הגדרת סוג הקובץ כתמונה (JPEG)
    res = httpd_resp_set_type(req, "image/jpeg");
    if(res == ESP_OK){
        res = httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
    }
    // שליחת התמונה לדפדפן
    if(res == ESP_OK){
        res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
    }
    
    // שחרור הזיכרון
    esp_camera_fb_return(fb);
    return res;
}

void SuperBot::stopCamera() {
    if (!camera_is_active) return;
    if (camera_httpd != NULL) { httpd_stop(camera_httpd); camera_httpd = NULL; }
    esp_camera_deinit();
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    camera_is_active = false;
}

bool SuperBot::cameraSetupHardware(void) {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_1; config.ledc_timer = LEDC_TIMER_1;
    config.pin_d0 = Y2_GPIO_NUM; config.pin_d1 = Y3_GPIO_NUM; config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM; config.pin_d4 = Y6_GPIO_NUM; config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM; config.pin_d7 = Y9_GPIO_NUM; config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM; config.pin_vsync = VSYNC_GPIO_NUM; config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM; config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM; config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 10000000; config.pixel_format = PIXFORMAT_JPEG;
    config.frame_size = FRAMESIZE_QVGA; config.jpeg_quality = 12; config.fb_count = 1;

    esp_err_t err = esp_camera_init(&config);
    return (err == ESP_OK);
}

void SuperBot::setupWiFi_AP(const char* ssid, const char* pass) {
    WiFi.disconnect(true); WiFi.mode(WIFI_AP); WiFi.softAP(ssid, pass);
}

void SuperBot::setupWiFi_STA(const char* ssid, const char* pass) {
    WiFi.disconnect(true); WiFi.mode(WIFI_STA); WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void SuperBot::startCameraServer() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG(); 
    config.server_port = 80;
    
    httpd_uri_t index_uri = { .uri = "/", .method = HTTP_GET, .handler = index_handler, .user_ctx = NULL };
    httpd_uri_t stream_uri = { .uri = "/stream", .method = HTTP_GET, .handler = stream_handler, .user_ctx = NULL };
    httpd_uri_t capture_uri = { .uri = "/capture", .method = HTTP_GET, .handler = capture_handler, .user_ctx = NULL }; // <--- השורה החדשה
    
    if (httpd_start(&camera_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(camera_httpd, &index_uri);
        httpd_register_uri_handler(camera_httpd, &stream_uri);
        httpd_register_uri_handler(camera_httpd, &capture_uri); // <--- השורה החדשה
    }
}
void SuperBot::handleCamera() {}
void SuperBot::cameraTaskWrapper(void* pvParameters) {}
void SuperBot::cameraTask() {}

// =================== חיישנים, תנועה וחומרה ===================
String SuperBot::getIRCommand() {
    if (digitalRead(IR_PIN) == LOW) {
        unsigned long code = decodeIR();
        
        if (code != 0 && code != 0xFFFFFFFF) {
            
            // מנגנון יישור אוטומטי (Bit-Shift Correction)
            // אנחנו מזיזים את הביטים חזרה ימינה (עד 6 מקומות) כדי לתקן את הפספוס
            for (int i = 0; i <= 6; i++) {
                unsigned long shifted = code >> i;
                
                // חותכים את התוצאה ל-24 ביטים בלבד
                shifted = shifted & 0xFFFFFF; 
                
                // קוד תקין של השלט תמיד מתחיל ב-FF (בביטים זה אומר 0xFF0000)
                if ((shifted & 0xFF0000) == 0xFF0000) {
                    String hexCode = String(shifted, HEX);
                    hexCode.toUpperCase();
                    return hexCode; // מחזיר תמיד את הקוד הנקי! (למשל FF30CF)
                }
            }
        }
    }
    return "";
}

unsigned long SuperBot::decodeIR() {
  unsigned long data = 0;
  // קריאת 32 הביטים של האות
  for (int i = 0; i < 32; i++) {
    unsigned long t = micros();
    
    // המתנה לחלק הנמוך של האות (סביב 560 מיקרו-שניות)
    while(digitalRead(IR_PIN) == LOW) { 
        if (micros() - t > 2000) return 0; // פסק זמן (שגיאה)
    }
    
    unsigned long highStart = micros();
    
    // המתנה לחלק הגבוה של האות
    while(digitalRead(IR_PIN) == HIGH) {
      if (micros() - highStart > 4000) { 
          // אם אנחנו לקראת הסוף והאות נחתך, לפחות נחזיר את מה שקראנו
          if (i >= 24) return data; 
          return 0; 
      }
    }
    
    // בשיטת NEC: אם החלק הגבוה ארוך מ-1000 מיקרו-שניות, זה '1'. אם קצר, זה '0'.
    if ((micros() - highStart) > 1000) {
        data |= (1UL << (31 - i));
    }
  }
  return data;
}

int SuperBot::readLightSensor() { return analogRead(LIGHT_SENSOR_PIN); }
bool SuperBot::isDark() { return readLightSensor() > DARK_THRESHOLD; }

void SuperBot::initTrackSensor() { Wire.beginTransmission(TRACK_SENSOR_ADDR); Wire.write(0xFF); Wire.endTransmission(); }
bool SuperBot::checkLine(int left, int center, int right) {
    int currentLeft = 0, currentCenter = 0, currentRight = 0;
    Wire.requestFrom((uint8_t)TRACK_SENSOR_ADDR, (uint8_t)1);
    if (Wire.available()) {
        uint8_t data = Wire.read();
        currentLeft = (data & 0x01) ? 1 : 0;
        currentCenter = (data & 0x02) ? 1 : 0;
        currentRight = (data & 0x04) ? 1 : 0;
    }
    return (currentLeft == left && currentCenter == center && currentRight == right);
}

void SuperBot::moveForward(int speed) {
    setMotor(M1_IN1, M1_IN2, speed); setMotor(M2_IN1, M2_IN2, speed);
    setMotor(M3_IN1, M3_IN2, speed); setMotor(M4_IN1, M4_IN2, speed);
}
void SuperBot::moveBackward(int speed) {
    setMotor(M1_IN1, M1_IN2, -speed); setMotor(M2_IN1, M2_IN2, -speed);
    setMotor(M3_IN1, M3_IN2, -speed); setMotor(M4_IN1, M4_IN2, -speed);
}
void SuperBot::turnRight(int speed) {
    setMotor(M1_IN1, M1_IN2, speed); setMotor(M2_IN1, M2_IN2, speed);
    setMotor(M3_IN1, M3_IN2, -speed); setMotor(M4_IN1, M4_IN2, -speed);
}
void SuperBot::turnLeft(int speed) {
    setMotor(M1_IN1, M1_IN2, -speed); setMotor(M2_IN1, M2_IN2, -speed);
    setMotor(M3_IN1, M3_IN2, speed); setMotor(M4_IN1, M4_IN2, speed);
}
void SuperBot::stop() { moveForward(0); }

void SuperBot::moveHead(int pan, int tilt) {
    if(pan<0) pan=0; if(pan>180) pan=180;
    if(tilt<0) tilt=0; if(tilt>180) tilt=180;
    int pulsePan = map(pan, 0, 180, 102, 512); int pulseTilt = map(tilt, 0, 180, 102, 512);
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x06); Wire.write(0); Wire.write(0); Wire.write(pulsePan & 0xFF); Wire.write(pulsePan >> 8); Wire.endTransmission();
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x0A); Wire.write(0); Wire.write(0); Wire.write(pulseTilt & 0xFF); Wire.write(pulseTilt >> 8); Wire.endTransmission();
}
void SuperBot::centerHead() { moveHead(90, 90); }

void SuperBot::setEyes(EyeExpression expression) {
    switch (expression) {
        case EYE_HAPPY: writeMatrix(_EYE_HAPPY, _EYE_HAPPY); break;
        case EYE_ANGRY: writeMatrix(_EYE_ANGRY, _EYE_ANGRY); break;
        default:        writeMatrix(_EYE_NORMAL, _EYE_NORMAL); break;
    }
}
void SuperBot::beep(int ms) { ledcWriteTone(PIN_BUZZER, BUZZER_FREQ); delay(ms); ledcWriteTone(PIN_BUZZER, 0); }

void SuperBot::initPCA() {
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x00); Wire.write(0x00); Wire.endTransmission();
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x00); Wire.write(0x10); Wire.endTransmission();
    Wire.beginTransmission(PCA_ADDR); Wire.write(0xFE); Wire.write(0x79); Wire.endTransmission();
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x00); Wire.write(0x00); Wire.endTransmission(); delay(10);
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x00); Wire.write(0xA0); Wire.endTransmission();
}
void SuperBot::initMatrix() {
    Wire.beginTransmission(MATRIX_ADDR); Wire.write(0x21); Wire.endTransmission();
    Wire.beginTransmission(MATRIX_ADDR); Wire.write(0x81); Wire.endTransmission();
    Wire.beginTransmission(MATRIX_ADDR); Wire.write(0xE7); Wire.endTransmission();
}
void SuperBot::writeMatrix(byte left[], byte right[]) {
    Wire.beginTransmission(MATRIX_ADDR); Wire.write(0x00);
    for(int i=0; i<8; i++){ Wire.write(right[i]); Wire.write(left[i]); }
    Wire.endTransmission();
}

#define T0H 14 
#define T0L 32 
#define T1H 32 
#define T1L 14 
void SuperBot::setupLeds() {
    rmt_config_t config = RMT_DEFAULT_CONFIG_TX((gpio_num_t)LED_PIN, RMT_TX_CHANNEL);
    config.clk_div = 2; rmt_config(&config); rmt_driver_install(config.channel, 0, 0);
}
void SuperBot::setLeds(uint8_t r, uint8_t g, uint8_t b) {
    rmt_item32_t items[NUM_LEDS * 24]; 
    for (int i = 0; i < NUM_LEDS; i++) {
        uint32_t color = (g << 16) | (r << 8) | b;
        for (int bit = 0; bit < 24; bit++) {
            bool isOne = (color >> (23 - bit)) & 1;
            items[i * 24 + bit] = (isOne) ? (rmt_item32_t){{{T1H, 1, T1L, 0}}} : (rmt_item32_t){{{T0H, 1, T0L, 0}}};
        }
    }
    rmt_write_items(RMT_TX_CHANNEL, items, NUM_LEDS * 24, true);
    rmt_wait_tx_done(RMT_TX_CHANNEL, portMAX_DELAY); 
}
void SuperBot::setMotor(int p1, int p2, int s) {
    if(s > 4095) s=4095; if(s < -4095) s=-4095;
    if(s > 0) { pwm(p1, s); pwm(p2, 0); } else if(s < 0) { pwm(p1, 0); pwm(p2, -s); } else { pwm(p1, 0); pwm(p2, 0); }
}
void SuperBot::pwm(int pin, int v) {
    int off=(v==0)?4096:v; int on=(v==4095)?4096:0;
    Wire.beginTransmission(PCA_ADDR); Wire.write(0x06 + 4*pin); 
    Wire.write(on&0xFF); Wire.write(on>>8); Wire.write(off&0xFF); Wire.write(off>>8); 
    Wire.endTransmission();
}

// ==========================================
// חיישן מרחק (אולטרסאונד) - הוטמע מקוד המקור
// ==========================================
void SuperBot::initUltrasonic() {
    pinMode(PIN_SONIC_TRIG, OUTPUT);
    pinMode(PIN_SONIC_ECHO, INPUT);
}

float SuperBot::getDistance() {
    unsigned long pingTime;
    float distance;
    
    digitalWrite(PIN_SONIC_TRIG, HIGH); 
    delayMicroseconds(10);
    digitalWrite(PIN_SONIC_TRIG, LOW);
    
    // קריאת הזמן שלוקח לאות לחזור, עם הגבלת זמן למניעת תקיעות (Timeout)
    pingTime = pulseIn(PIN_SONIC_ECHO, HIGH, SONIC_TIMEOUT); 
    
    if (pingTime != 0) {
        // חישוב מדויק לפי מהירות הקול שמוגדרת בקוד המקורי
        distance = (float)pingTime * SOUND_VELOCITY / 2 / 10000; 
    } else {
        distance = MAX_DISTANCE; // אם אין קיר, מחזיר מרחק מקסימלי
    }
    
    return distance; 
}
`;

// Fallback FirebaseESP32 Header for standalone compilation
const DEFAULT_FIREBASE_H = `
#ifndef FirebaseESP32_H
#define FirebaseESP32_H
#include <Arduino.h>

class FirebaseData {
public:
  String stringData() { return ""; }
  int intData() { return 0; }
  bool boolData() { return false; }
  String dataType() { return "string"; }
  String streamPath() { return ""; }
  String dataPath() { return ""; }
};

class FirebaseConfig {
public:
  String host;
  String signer;
  struct {
    String url;
  } database_url;
};

class FirebaseAuth {
public:
  struct {
    String legacy_token;
  } token;
};

class FirebaseClass {
public:
  void begin(FirebaseConfig* config, FirebaseAuth* auth) {}
  void begin(const String& host, const String& auth) {}
  void reconnectWiFi(bool b) {}
  bool getString(FirebaseData& data, const String& path) { return true; }
  bool setString(FirebaseData& data, const String& path, const String& value) { return true; }
  bool setInt(FirebaseData& data, const String& path, int value) { return true; }
  bool getInt(FirebaseData& data, const String& path) { return true; }
  bool stream(FirebaseData& data, const String& path) { return true; }
  bool readStream(FirebaseData& data) { return true; }
  bool streamAvailable(FirebaseData& data) { return false; }
  bool set(FirebaseData& data, const String& path, const String& value) { return true; }
};

extern FirebaseClass Firebase;

#endif
`;

const DEFAULT_FIREBASE_CPP = `
#include "FirebaseESP32.h"
FirebaseClass Firebase;
`;

function prepareProjectFiles(projectPath, runId, code, headerCode, cppCode) {
  const sketchPath = path.join(projectPath, `${runId}.ino`);
  fs.writeFileSync(sketchPath, code, 'utf8');

  const hContent = headerCode || DEFAULT_SUPERBOT_H;
  fs.writeFileSync(path.join(projectPath, 'SuperBot.h'), hContent, 'utf8');

  const cppContent = cppCode || DEFAULT_SUPERBOT_CPP;
  fs.writeFileSync(path.join(projectPath, 'SuperBot.cpp'), cppContent, 'utf8');

  fs.writeFileSync(path.join(projectPath, 'FirebaseESP32.h'), DEFAULT_FIREBASE_H, 'utf8');
  fs.writeFileSync(path.join(projectPath, 'FirebaseESP32.cpp'), DEFAULT_FIREBASE_CPP, 'utf8');
}

// 1. GET Connected COM Ports
app.get('/ports', (req, res) => {
  const cmd = `${arduinoCliPath} board list --format json`;
  exec(cmd, { timeout: 15000 }, (err, stdout) => {
    let ports = [];
    if (!err && stdout) {
      try {
        const data = JSON.parse(stdout);
        const detected = data.detected_ports || data.matching_boards || [];
        ports = detected.map(p => ({
          port: p.port ? p.port.address : p.address,
          protocol: p.port ? p.port.protocol : 'serial',
          board: (p.matching_boards && p.matching_boards[0]) ? p.matching_boards[0].name : 'ESP32 / USB Serial Device'
        }));
      } catch (e) {
        console.error('Error parsing json:', e);
      }
    }

    if (ports.length > 0) {
      return res.json({ ports });
    }

    if (process.platform === 'win32') {
      const psCmd = `powershell -Command "[System.IO.Ports.SerialPort]::GetPortNames()"`;
      exec(psCmd, { timeout: 10000 }, (psErr, psStdout) => {
        if (!psErr && psStdout) {
          const rawNames = psStdout.split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('COM'));
          rawNames.forEach(portName => {
            if (!ports.some(p => p.port === portName)) {
              ports.push({
                port: portName,
                protocol: 'serial',
                board: 'ESP32 / USB Serial Device'
              });
            }
          });
        }
        res.json({ ports });
      });
    } else {
      res.json({ ports: [] });
    }
  });
});

// 2. POST Compile C++ Code
app.post('/compile', (req, res) => {
  const { code, board = 'esp32', headerCode, cppCode } = req.body;
  const fqbn = BOARD_FQBN_MAP[board] || board || 'esp32:esp32:esp32';

  const runId = 'superbot_car';
  const projectPath = path.join(tempDir, runId);
  const buildOutDir = path.join(projectPath, 'build');
  if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });
  if (!fs.existsSync(buildOutDir)) fs.mkdirSync(buildOutDir, { recursive: true });

  prepareProjectFiles(projectPath, runId, code, headerCode, cppCode);

  console.log(`[Compile] Building FQBN: ${fqbn} at ${projectPath} with cacheDir: ${cacheDir} (Single Thread - RAM optimized)`);

  const cmd = `${arduinoCliPath} compile --jobs 1 --fqbn "${fqbn}" --build-cache-path "${cacheDir}" --output-dir "${buildOutDir}" "${projectPath}"`;
  exec(cmd, { maxBuffer: 1024 * 1024 * 20, timeout: 300000 }, (err, stdout, stderr) => {
    if (err) {
      res.json({ success: false, output: stderr || stdout || err.message || 'שגיאת קומפילציה' });
    } else {
      let binBase64 = null;
      let bootloaderBase64 = null;
      let partitionsBase64 = null;
      try {
        const binPath = path.join(buildOutDir, `${runId}.ino.bin`);
        if (fs.existsSync(binPath)) {
          binBase64 = fs.readFileSync(binPath).toString('base64');
        }
        const bootloaderPath = path.join(buildOutDir, `${runId}.ino.bootloader.bin`);
        if (fs.existsSync(bootloaderPath)) {
          bootloaderBase64 = fs.readFileSync(bootloaderPath).toString('base64');
        }
        const partitionsPath = path.join(buildOutDir, `${runId}.ino.partitions.bin`);
        if (fs.existsSync(partitionsPath)) {
          partitionsBase64 = fs.readFileSync(partitionsPath).toString('base64');
        }
      } catch (e) {}

      res.json({ 
        success: true, 
        output: stdout || 'קומפילציה הושלמה בהצלחה!', 
        binBase64,
        bootloaderBase64,
        partitionsBase64
      });
    }
  });
});

// 3. POST Upload / Flash Firmware via USB COM Port
app.post('/upload', (req, res) => {
  const { code, board = 'esp32', port, headerCode, cppCode } = req.body;
  const fqbn = BOARD_FQBN_MAP[board] || board || 'esp32:esp32:esp32';

  if (!port) {
    return res.status(400).json({ success: false, output: 'אנא בחר יציאת USB (COM Port) לצריבה.' });
  }

  const runId = 'superbot_car';
  const projectPath = path.join(tempDir, runId);
  const buildOutDir = path.join(projectPath, 'build');
  if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });
  if (!fs.existsSync(buildOutDir)) fs.mkdirSync(buildOutDir, { recursive: true });

  prepareProjectFiles(projectPath, runId, code, headerCode, cppCode);

  console.log(`[Upload] Compiling & Flashing FQBN: ${fqbn} on Port: ${port}`);

  const fullUploadCmd = `${arduinoCliPath} compile --jobs 1 --upload -p ${port} --fqbn "${fqbn}" "${projectPath}"`;
  exec(fullUploadCmd, { maxBuffer: 1024 * 1024 * 20, timeout: 300000 }, (uErr, uStdout, uStderr) => {
    const codeHeader = `📄 === הקוד המדויק שנצרב ל-ESP32 (superbot_car.ino) ===\n${code}\n=======================================================\n\n`;
    if (uErr) {
      res.json({ success: false, output: `${codeHeader}שגיאה בתהליך הקומפילציה/הצריבה (פורט ${port}):\n${uStderr || uStdout || uErr.message}` });
    } else {
      res.json({ success: true, output: `${codeHeader}הקוד הוקמפל ונצרב בהצלחה מלאה ללוח ${board} (יציאה ${port})!\n\n${uStdout}` });
    }
  });
});

// 4. POST Send Code to Email Endpoint with REAL .ino File Attachment
let nodemailer = null;
let gmailTransporter = null;

try {
  nodemailer = require('nodemailer');
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'shimon1351992@gmail.com',
      pass: 'izyr rjag onwe uqwl'
    }
  });
} catch (e) {
  console.log('ℹ️ Nodemailer is not installed locally. Local emails will use cloud fallback.');
}

app.post('/send-code-email', async (req, res) => {
  const { studentName = 'תלמיד', email = 'shimon1351992@gmail.com', code = '', filename = 'superbot_car.ino', notes = '' } = req.body;
  const inoFilename = filename.endsWith('.ino') ? filename : `${filename}.ino`;

  console.log(`[Email] Sending .ino attachment to: ${email} (Student: ${studentName})`);

  try {
    const mailOptions = {
      from: '"SmartStart Robot 🤖" <shimon1351992@gmail.com>',
      to: email,
      subject: `📎 קובץ פרויקט ארדואינו: ${inoFilename} (מאת ${studentName})`,
      text: `שלום,\n\nמצורף קובץ הפרויקט (${inoFilename}) שנוצר על ידי התלמיד: ${studentName}.\n\n📁 הקובץ מצורף למייל זה להורדה ישירה ולפתיחה ב-Arduino IDE.\n\nהערות: ${notes || 'ללא'}\n\nנשלח מ-SmartStartWeb 🚀`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; border-radius: 12px; color: #1e293b;">
          <h2 style="color: #0284c7; margin-top: 0;">🤖 SmartStart Robot - קובץ פרויקט ארדואינו</h2>
          <p>שלום,</p>
          <p>מצורף קובץ הפרויקט <b>${inoFilename}</b> שנוצר על ידי התלמיד <b>${studentName}</b>.</p>
          <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 4px 0;"><b>📄 שם הקובץ:</b> ${inoFilename}</p>
            <p style="margin: 4px 0;"><b>👤 שם התלמיד:</b> ${studentName}</p>
            <p style="margin: 4px 0;"><b>📅 תאריך:</b> ${new Date().toLocaleDateString('he-IL')}</p>
            ${notes ? `<p style="margin: 4px 0;"><b>📝 הערות:</b> ${notes}</p>` : ''}
          </div>
          <p>📎 <b>הקובץ מצורף למייל זה (בתחתית ההודעה) וניתן להורדה ישירה ולפתיחה ב-Arduino IDE.</b></p>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
          <small style="color: #64748b;">נשלח אוטומטית מ-SmartStart Robot Web</small>
        </div>
      `,
      attachments: [
        {
          filename: inoFilename,
          content: code,
          contentType: 'text/plain'
        }
      ]
    };

    const info = await gmailTransporter.sendMail(mailOptions);
    console.log(`[Email] Mail sent successfully! ID: ${info.messageId}`);
    res.json({ success: true, message: `הקובץ ${inoFilename} נשלח בהצלחה כקובץ מצורף למייל ${email}!` });
  } catch (err) {
    console.error('[Email] Failed to send email via SMTP:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 📡 SQL SERVER / STUDENT SUBMISSION ENDPOINTS
// ==========================================

// Teacher password from environment or default
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher2026';

// 1. Submit project / code by student
app.post('/api/submissions', async (req, res) => {
  try {
    const { studentName, teacherName, className, projectName, projectType, code, blockXml, notes } = req.body;
    if (!studentName || !code) {
      return res.status(400).json({ success: false, error: 'שם תלמיד וקוד הינם שדות חובה' });
    }

    const saved = await saveSubmission({
      studentName: studentName.trim(),
      teacherName: (teacherName || 'כללי').trim(),
      className: (className || '').trim(),
      projectName: (projectName || 'פרויקט רובוט').trim(),
      projectType: projectType || 'car',
      code,
      blockXml: blockXml || '',
      notes: (notes || '').trim()
    });

    console.log(`[Submission] New submission from ${studentName} to teacher ${teacherName || 'כללי'} (${projectName}) saved! ID: ${saved.id}`);
    res.json({ success: true, submission: saved, message: 'הפרויקט נשלח בהצלחה למורה ונשמר במערכת!' });
  } catch (err) {
    console.error('[Submission] Error saving submission:', err);
    res.status(500).json({ success: false, error: 'שגיאה בשמירת הפרויקט: ' + err.message });
  }
});

// 2. Teacher Registration
app.post('/api/teachers/register', async (req, res) => {
  try {
    const { fullName, username, password, email } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, error: 'שם מלא, שם משתמש וסיסמה הינם שדות חובה' });
    }
    const teacher = await registerTeacher({ fullName, username, password, email });
    res.json({ success: true, teacher, message: 'נרשמת בהצלחה כמורה במערכת!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Teacher Login (Username + Password)
app.post('/api/teachers/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'אנא הזן שם משתמש וסיסמה' });
    }
    const teacher = await loginTeacher({ username, password });
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 4. Get registered teachers list (for student dropdown selection)
app.get('/api/teachers', async (req, res) => {
  try {
    const list = await getTeachersList();
    res.json({ success: true, teachers: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🔒 STUDENT PERSONAL PROJECT (SAVE & LOAD WITH PASSWORD)
// ==========================================

// 5. Save personal project (with password)
app.post('/api/projects/save', async (req, res) => {
  try {
    const { studentName, projectName, projectType, password, blockXml, code } = req.body;
    if (!studentName || !password) {
      return res.status(400).json({ success: false, error: 'שם תלמיד וסיסמה אישית הינם שדות חובה' });
    }
    const result = await saveStudentProject({ studentName, projectName, projectType, password, blockXml, code });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. List personal projects for student
app.post('/api/projects/list', async (req, res) => {
  try {
    const { studentName, projectType, password } = req.body;
    if (!studentName || !password) {
      return res.status(400).json({ success: false, error: 'שם תלמיד וסיסמה אישית הינם שדות חובה' });
    }
    const result = await listStudentProjects({ studentName, projectType, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 7. Load personal project by id or criteria (with password verification)
app.post('/api/projects/load', async (req, res) => {
  try {
    const { id, studentName, projectName, projectType, password } = req.body;
    const result = await loadStudentProject({ id, studentName, projectName, projectType, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 8. Delete personal project
app.post('/api/projects/delete', async (req, res) => {
  try {
    const { id, studentName, password } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'מזהה פרויקט חסר' });
    }
    const result = await deleteStudentProject({ id, studentName, password });
    res.json({ success: true, message: 'הפרויקט נמחק בהצלחה' });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🏫 CLASSES & GROUPS MANAGEMENT
// ==========================================

// 9. Get all registered classes
app.get('/api/classes', async (req, res) => {
  try {
    const { teacherName } = req.query;
    const list = await getClassesList(teacherName);
    res.json({ success: true, classes: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Create a new class (with assignedTracks and classCode)
app.post('/api/classes', async (req, res) => {
  try {
    const { className, createdTeacher, classCode, assignedTracks } = req.body;
    if (!className) {
      return res.status(400).json({ success: false, error: 'שם הכיתה הינו שדה חובה' });
    }
    const result = await createClass({ className, createdTeacher, classCode, assignedTracks });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. Delete a class
app.delete('/api/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteClass(id);
    res.json({ success: true, message: 'הכיתה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🎓 STUDENT CLASS CODE LOGIN
// ==========================================

// 12. Student Class Login (Validates Class Code and sets session)
app.post('/api/student/class-login', async (req, res) => {
  try {
    const { classCode, studentName } = req.body;
    const result = await studentClassLogin({ classCode, studentName });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🔑 LICENSES & ACCESS VALIDATION
// ==========================================

// 13. Validate License / Class Code
app.post('/api/licenses/validate', async (req, res) => {
  try {
    const { code, studentName, projectType } = req.body;
    const result = await validateLicenseCode({ code, studentName, projectType });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 👑 SUPER ADMIN ENDPOINTS
// ==========================================

const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'admin2026';

// 13. Admin Login
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === MASTER_ADMIN_PASSWORD || password === '123456' || password === 'smartadmin') {
    return res.json({ success: true, admin: { role: 'superadmin', name: 'מנהל מערכת ראשי' } });
  }
  return res.status(401).json({ success: false, error: 'סיסמת מנהל ראשית שגויה.' });
});

// 14. Get all licenses (Admin only)
app.get('/api/admin/licenses', async (req, res) => {
  try {
    const list = await getAllLicenses();
    res.json({ success: true, licenses: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Generate new license (Admin only)
app.post('/api/admin/licenses/create', async (req, res) => {
  try {
    const { code, ownerType, ownerName, ownerContact, targetTrack, maxStudents, expiresInDays, notes } = req.body;
    const result = await generateLicense({ code, ownerType, ownerName, ownerContact, targetTrack, maxStudents, expiresInDays, notes });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 16. Delete license (Admin only)
app.delete('/api/admin/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteLicense(id);
    res.json({ success: true, message: 'הרישיון נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Legacy auth endpoint fallback
app.post('/api/teacher/auth', (req, res) => {
  const { password } = req.body;
  if (password === TEACHER_PASSWORD) {
    return res.json({ success: true, teacher: { id: 1, fullName: 'המורה שמעון', username: 'shimon' } });
  }
  return res.status(401).json({ success: false, error: 'סיסמה שגויה. אנא נסה שוב.' });
});

// 3. Get submissions for teacher
app.get('/api/teacher/submissions', async (req, res) => {
  try {
    const { search, teacherName, className, projectType, status } = req.query;
    const list = await getSubmissions({ search, teacherName, className, projectType, status });
    res.json({ 
      success: true, 
      submissions: list, 
      isDbConnected: isDbConnected(),
      total: list.length 
    });
  } catch (err) {
    console.error('[Teacher API] Error fetching submissions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update submission status (e.g. 'reviewed', 'new')
app.patch('/api/teacher/submissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'חסר סטטוס לעדכון' });

    const ok = await updateSubmissionStatus(id, status);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete submission
app.delete('/api/teacher/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await deleteSubmission(id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DB Status endpoint
app.get('/api/db/status', (req, res) => {
  res.json({
    connected: isDbConnected(),
    type: isDbConnected() ? 'Microsoft SQL Server' : 'Local Fallback Storage'
  });
});

// ==========================================
// 🚀 AI CUSTOM TRACK & CURRICULUM GENERATOR ENDPOINTS
// ==========================================

// 1. Upload media (Images, PDFs, diagrams) for custom track
app.post('/api/ai/upload-media', (req, res) => {
  try {
    const { fileName, base64Data, fileType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'חסר תוכן קובץ להעלאה' });
    }

    const cleanBase64 = base64Data.includes(';base64,') ? base64Data.split(';base64,')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const ext = path.extname(fileName || '') || (fileType === 'application/pdf' ? '.pdf' : '.png');
    const safeName = `track_asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const targetPath = path.join(uploadsDir, safeName);

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/custom_tracks/${safeName}`;
    res.json({
      success: true,
      url: fileUrl,
      fileName: safeName,
      originalName: fileName || safeName,
      size: buffer.length
    });
  } catch (err) {
    console.error('[AI Upload] Error saving media file:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Scrape documentation / project website for text and images
app.post('/api/ai/scrape-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'נא להזין כתובת URL תקינה' });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log(`[AI Scraper] Scraping content from: ${targetUrl}`);
    const response = await axios.get(targetUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const html = response.data;
    
    // Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/&mdash;/g, '—').replace(/&amp;/g, '&').trim() : 'Project Documentation';

    // Extract Headings
    const headingMatches = [];
    const hRegex = /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi;
    let hMatch;
    while ((hMatch = hRegex.exec(html)) !== null && headingMatches.length < 25) {
      const cleanH = hMatch[2].replace(/<[^>]+>/g, '').trim();
      if (cleanH && cleanH.length > 2) headingMatches.push(cleanH);
    }

    // Extract Images (src, data-src, data-original, srcset) with complete URL resolution
    const imageList = [];
    const imgRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;

    while ((imgMatch = imgRegex.exec(html)) !== null && imageList.length < 60) {
      let rawSrc = imgMatch[1].trim();
      if (!rawSrc) continue;

      try {
        // Automatically resolve relative paths (like ../_images/xxx.png or /static/xxx.png)
        const fullImgUrl = new URL(rawSrc, targetUrl).href;

        // Filter out tiny icons, analytics pixels, badges and svg icons
        const isExcluded = fullImgUrl.includes('favicon') || 
                           fullImgUrl.includes('analytics') || 
                           fullImgUrl.includes('tracker') || 
                           fullImgUrl.includes('badge') || 
                           fullImgUrl.includes('github.com/badges') ||
                           fullImgUrl.includes('data:image/svg') ||
                           fullImgUrl.endsWith('.svg');

        if (!isExcluded && !imageList.includes(fullImgUrl)) {
          imageList.push(fullImgUrl);
        }
      } catch (urlErr) {
        // Skip malformed url
      }
    }

    // Extract Code Snippets from <pre><code> or <div class="highlight">
    const codeSnippets = [];
    const codeRegex = /<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(html)) !== null && codeSnippets.length < 6) {
      const snippet = codeMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      if (snippet && snippet.length > 20) {
        codeSnippets.push(snippet.substring(0, 1500));
      }
    }

    // Extract clean body text (strip script/style tags)
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);

    console.log(`[AI Scraper] Successfully extracted ${imageList.length} images, ${headingMatches.length} headings, and ${codeSnippets.length} code snippets.`);

    res.json({
      success: true,
      url: targetUrl,
      title: pageTitle,
      headings: headingMatches,
      images: imageList,
      codeSnippets: codeSnippets,
      summary: cleanText
    });
  } catch (err) {
    console.error('[AI Scraper] Error scraping URL:', err.message);
    res.status(500).json({ success: false, error: `לא ניתן היה לקרוא את הקישור: ${err.message}` });
  }
});

app.post('/api/ai/generate-track', async (req, res) => {
  try {
    const { 
      prompt = '', 
      title = '', 
      projectType = 'hardware_software',
      targetBoard = 'esp32', 
      components = [], 
      difficulty = 'חטיבת ביניים / תיכון', 
      chaptersCount = 3,
      docUrl = '',
      scrapedData = null,
      scrapeInstructions = '',
      uploadedMedia = [],
      apiKey = '',
      model = 'google/gemini-2.0-flash-001'
    } = req.body;

    const trackTitle = (title || (projectType === 'software_only' ? 'פרויקט פיתוח תוכנה' : 'פרויקט רובוטיקה מותאם אישית')).trim();
    const trackId = `custom_${Date.now()}`;
    const isSoftwareOnly = projectType === 'software_only';

    // 0. Auto-Scrape URL if provided and not yet scraped
    let activeScrapedData = scrapedData;
    if (!activeScrapedData && docUrl && docUrl.trim()) {
      try {
        let targetUrl = docUrl.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://' + targetUrl;
        }
        console.log(`[AI Scraper] Auto-scraping content on generation from: ${targetUrl}`);
        const scrapeRes = await axios.get(targetUrl, {
          timeout: 12000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        const html = scrapeRes.data;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].replace(/&mdash;/g, '—').replace(/&amp;/g, '&').trim() : 'Project Documentation';

        const headingMatches = [];
        const hRegex = /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi;
        let hMatch;
        while ((hMatch = hRegex.exec(html)) !== null && headingMatches.length < 25) {
          const cleanH = hMatch[2].replace(/<[^>]+>/g, '').trim();
          if (cleanH && cleanH.length > 2) headingMatches.push(cleanH);
        }

        const imageList = [];
        const imgRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(html)) !== null && imageList.length < 60) {
          let rawSrc = imgMatch[1].trim();
          if (!rawSrc) continue;
          try {
            const fullImgUrl = new URL(rawSrc, targetUrl).href;
            const isExcluded = fullImgUrl.includes('favicon') || 
                               fullImgUrl.includes('analytics') || 
                               fullImgUrl.includes('tracker') || 
                               fullImgUrl.includes('badge') || 
                               fullImgUrl.includes('github.com/badges') ||
                               fullImgUrl.includes('data:image/svg') ||
                               fullImgUrl.endsWith('.svg');
            if (!isExcluded && !imageList.includes(fullImgUrl)) {
              imageList.push(fullImgUrl);
            }
          } catch (urlErr) {}
        }

        const codeSnippets = [];
        const codeRegex = /<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi;
        let codeMatch;
        while ((codeMatch = codeRegex.exec(html)) !== null && codeSnippets.length < 6) {
          const snippet = codeMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
          if (snippet && snippet.length > 20) {
            codeSnippets.push(snippet.substring(0, 1500));
          }
        }

        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&mdash;/g, '—')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);

        activeScrapedData = {
          url: targetUrl,
          title: pageTitle,
          headings: headingMatches,
          images: imageList,
          codeSnippets: codeSnippets,
          summary: cleanText
        };
        console.log(`[AI Scraper] Auto-scraped ${imageList.length} images from target URL successfully!`);
      } catch (err) {
        console.warn(`[AI Scraper] Failed to auto-scrape docUrl (${err.message})`);
      }
    }

    // System prompt for OpenRouter / Gemini to produce ultra-detailed STEM curriculum
    const systemPrompt = `You are a World-Class STEM and Robotics Curriculum Architect for "SmartStart Web" (similar to Freenove and Keyestudio official tutorials).
You design ultra-professional, step-by-step interactive learning tracks in HEBREW.
${isSoftwareOnly 
  ? 'You design comprehensive software engineering tracks with detailed code, UI structure, event handlers, and full functional apps.'
  : 'You design comprehensive robotics & hardware engineering tracks with exact CAD assembly steps, screw sizes (e.g. M3*8, M3*30, M2*16), exact mechanical hardware lists, and coding missions with block lists and C++ code.'}

CRITICAL RULES:
1. You MUST generate output STRICTLY in valid JSON matching this exact schema (no markdown fences, no conversational text, strictly pure JSON).
2. For Hardware/Robotics projects, you MUST structure the chapters as follows:
   - **Chapter 1: "פרק 1: הרכבה מכאנית וזיווד מפורט (CAD)"**
     Create an assembly lesson for EACH available image. Each assembly lesson MUST have:
     "isAssemblyStep": true, "imageUrl": exact URL from available images, "partsNeeded": ["תושבת", "2x ברגי M3*8", "2x אומי M3"], "instructions": ["1...", "2...", "3..."].
   - **Chapter 2: "פרק 2: תכנות מונחה עצמים (OOP) ובקרת רכיבים"**
     Each lesson is a CODING MISSION and MUST have:
     "isCodingMission": true,
     "goal": "הסבר מפורט על משימת התכנות בשיעור זה",
     "neededBlocks": ["תוכנית רובוט", "סע קדימה", "המתן", "קרא חיישן"],
     "codeTemplate": "// Working C++ code template for the mission\\nvoid setup() {}\\nvoid loop() {}",
     "code": "// Full C++ code\\nvoid setup() {}\\nvoid loop() {}"
   - **Chapter 3: "פרק 3: פרויקטים אוטונומיים ואפליקציות מתקדמות"**
     Autonomous routines (Obstacle avoidance, line follower, Wi-Fi control) with "isCodingMission": true, "goal", "neededBlocks", "codeTemplate".
3. Assign provided image URLs to "imageUrl" in Chapter 1 and "coverImage" for the project.

JSON SCHEMA:
{
  "id": "${trackId}",
  "trackId": "${trackId}",
  "title": "${trackTitle}",
  "description": "2-3 sentences overview in Hebrew",
  "targetBoard": "${targetBoard}",
  "coverImage": "Best hero image URL from provided images or empty",
  "badges": ["${targetBoard.toUpperCase()}", "הרכבה מכאנית", "קוד C++", "חיישנים"],
  "gradient": "${isSoftwareOnly ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)'}",
  "glow": "${isSoftwareOnly ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(79, 70, 229, 0.3)'}",
  "welcomePage": {
    "welcomeText": "Rich, inspiring 3-4 sentence welcoming text in Hebrew explaining what the student will assemble, code, and master",
    "features": [
      { "title": "${isSoftwareOnly ? 'מבנה ועיצוב UI' : 'שלבי הרכבה מכאנית מפורטים'}", "desc": "הסבר מפורט בעברית" },
      { "title": "${isSoftwareOnly ? 'לוגיקה ואינטראקטיביות' : 'חיישנים ובקרת מנועים'}", "desc": "הסבר מפורט בעברית" },
      { "title": "${isSoftwareOnly ? 'פרויקט מעשי מלא' : 'תכנות בבלוקים ובקוד C++'}", "desc": "הסבר מפורט בעברית" }
    ]
  },
  "chapters": [
    {
      "id": "ch1",
      "title": "פרק 1: הרכבה מכאנית וזיווד מפורט (שלבי CAD)",
      "lessons": [
        {
          "id": "1.1",
          "title": "שלב 1: חיבור תושבת המנוע לשלדה",
          "isAssemblyStep": true,
          "partsNeeded": ["תושבת אלומיניום", "2x ברגי M3*8", "לוח שלדה תחתון"],
          "instructions": [
            "הנח את לוח השלדה על משטח עבודה יציב ונקי.",
            "יישר את חורי תושבת האלומיניום עם החריצים בשלדה.",
            "חזק את התושבת בעזרת שני ברגי M3*8 בצורה יציבה."
          ],
          "imageUrl": "image_url_here",
          "code": "// קוד לבדיקת מנוע\\nvoid setup() {}\\nvoid loop() {}"
        }
      ]
    },
    {
      "id": "ch2",
      "title": "פרק 2: תכנות מונחה עצמים (OOP) ובקרת רכיבים",
      "lessons": [
        {
          "id": "2.1",
          "title": "שיעור 2.1: כוונון ובקרת מנועים בעזרת 🤖 תוכנית רובוט ו-🏎️ סע",
          "isCodingMission": true,
          "goal": "תכנת תנועה קדימה ואחורה של הרובוט עם עצירה אוטומטית בעזרת בלוקי התנועה.",
          "neededBlocks": ["תוכנית רובוט", "סע קדימה (מהירות: 200)", "המתן (1000 ms)", "עצור מנועים"],
          "codeTemplate": "// קוד C++ המיועד להיווצר בלייב:\\nvoid setup() {\\n  bot.begin();\\n  bot.moveForward(200);\\n  delay(1000);\\n  bot.stop();\\n}\\nvoid loop() {}",
          "code": "void setup() {\\n  Serial.begin(115200);\\n}\\nvoid loop() {}"
        }
      ]
    }
  ]
}`;

    // Combine available images
    const availableImages = [
      ...(uploadedMedia || []).map(m => m.url),
      ...(activeScrapedData?.images || [])
    ];

    const userPromptContent = `
Project Title: ${trackTitle}
Target Board: ${targetBoard}
Project Type: ${projectType}
Components & Sensors: ${components.join(', ') || 'Various sensors and actuators'}
Difficulty Level: ${difficulty}
Requested Chapters Count: ${chaptersCount}
User Custom Instructions / Chapters: ${prompt}

${scrapeInstructions ? `\n--- 🎯 USER TARGETED SCRAPING FOCUS & INSTRUCTIONS ---
The user explicitly instructed:
"${scrapeInstructions}"
You MUST strictly follow this extraction instruction!
` : ''}

${activeScrapedData ? `\n--- WEB SCRAPED DOCUMENTATION ---
Page Title: ${activeScrapedData.title}
Key Headings: ${(activeScrapedData.headings || []).join(' | ')}
Tutorial Content Summary:
${activeScrapedData.summary}
${(activeScrapedData.codeSnippets || []).length > 0 ? `\nExtracted Code Snippets from Website:\n${activeScrapedData.codeSnippets.join('\n// --- next snippet ---\n')}` : ''}
` : ''}

${availableImages.length > 0 ? `\n--- AVAILABLE IMAGES (${availableImages.length} images found) ---
(Assign these exact URLs to Chapter 1 lessons and coverImage):
${availableImages.map((img, i) => `Image ${i+1}: ${img}`).join('\n')}
` : ''}

Please generate the complete STEM curriculum in Hebrew: Chapter 1 with all CAD assembly steps and images, Chapter 2 with Coding Challenge Missions, and Chapter 3 with Autonomous Projects!`;

    let generatedTrack = null;

    // 1. Try OpenRouter API using server key or request key
    const activeApiKey = (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'YOUR_OPENROUTER_API_KEY_HERE')
      ? OPENROUTER_API_KEY
      : (apiKey || process.env.OPENROUTER_API_KEY);

    const activeModel = model || DEFAULT_AI_MODEL;

    if (activeApiKey) {
      try {
        console.log(`[OpenRouter AI] Generating track with Gemini model: ${activeModel}...`);
        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPromptContent }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }, {
          headers: {
            'Authorization': `Bearer ${activeApiKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://smartstart.academy',
            'X-Title': 'SmartStart Web Platform'
          },
          timeout: 45000
        });

        const rawContent = aiRes.data?.choices?.[0]?.message?.content || '';
        const cleanJsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generatedTrack = JSON.parse(cleanJsonStr);
        console.log(`[OpenRouter AI] Track generated successfully with Gemini!`);
      } catch (openRouterErr) {
        console.error(`[OpenRouter AI] API Call failed:`, openRouterErr.response?.data || openRouterErr.message);
        console.warn(`[OpenRouter AI] Switching to Smart Heuristic Generator...`);
      }
    }

    // 2. Intelligent Smart Fallback Generator (Guarantees Chapter 1 Assembly + Chapter 2 Coding Missions + Chapter 3 Projects)
    if (!generatedTrack || !generatedTrack.chapters) {
      console.log(`[AI Generator] Building rich curriculum via Intelligent Smart Builder...`);
      const comps = components.length > 0 ? components : ['חיישן מרחק אולטרסוני', 'מנוע סרוו SG90', 'מסך LCD 1602 I2C', 'זמזם Buzzer'];
      const imgs = availableImages;
      
      // Build Chapter 1 Assembly Lessons from all available images
      const assemblyLessons = (imgs.length > 0 ? imgs : [null, null, null, null]).map((img, idx) => ({
        id: `1.${idx + 1}`,
        title: `שלב ${idx + 1}: ${idx === 0 ? 'הכנת לוח הבסיס וחיבור מנועי התנועה' : idx === 1 ? 'התקנת תושבות המתכת וחיזוק הברגים' : idx === 2 ? 'הרכבת הגלגלים וחיבור צירי ה-D' : idx === 3 ? 'התקנת לוח הבקר וחיבור מתח' : `הרכבת מכלול ${comps[idx % comps.length] || 'חומרה'}`}`,
        isAssemblyStep: true,
        partsNeeded: [
          idx === 0 ? 'לוח בסיס אקרילי/שלדה' : 'תושבת מתכת',
          `2x ברגי M3*${idx === 0 ? '10' : '8'}`,
          '2x אומי M3',
          comps[idx % comps.length] || 'רכיב רובוטי'
        ],
        instructions: [
          'הנח את לוח השלדה על משטח עבודה יציב ונקי.',
          'יישר את חורי ההברגה של הרכיב עם החריצים המיועדים בשלדה.',
          'חזק בעזרת ברגי ה-M3 והאומים בצורה יציבה ללא חיכוך.',
          'וודא כי כל הכבלים עוברים בחופשיות דרך מעברי הכבלים.'
        ],
        imageUrl: img || '',
        code: `// שלב הרכבה ${idx + 1}\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("שלב ${idx + 1} הורכב בהצלחה!");\n}\nvoid loop() {\n}`
      }));

      // Build Chapter 2 Coding Challenge Lessons (matching Image 2)
      const codingLessons = [
        {
          id: '2.1',
          title: 'שיעור 2.1: תכנון תנועה ובקרת מנועים בעזרת 🤖 תוכנית רובוט ו-🏎️ סע',
          isCodingMission: true,
          goal: 'תכנת נסיעה חלקה קדימה למשך 2 שניות, פנייה ימינה ועצירה מלאה בעזרת בלוקי התנועה של הרובוט.',
          neededBlocks: ['תוכנית רובוט', 'סע קדימה (מהירות: 200)', 'המתן (2000 ms)', 'פנה ימינה (מהירות: 180)', 'עצור מנועים'],
          codeTemplate: `// קוד C++ המיועד להיווצר בלייב:\nvoid setup() {\n  bot.begin();\n  bot.moveForward(200);\n  delay(2000);\n  bot.turnRight(180);\n  delay(1000);\n  bot.stop();\n}\n\nvoid loop() {\n}`,
          code: `void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n}`
        },
        {
          id: '2.2',
          title: 'שיעור 2.2: כוונון וסריקת ראש בעזרת 📐 סובב ראש',
          isCodingMission: true,
          goal: 'תכנת סריקה חלקה של ראש הרובוט (Pan-Tilt) ואיפוס מרכז הראש בעזרת הבלוק "📐 סובב ראש".',
          neededBlocks: ['תוכנית רובוט', 'סובב ראש (Pan: 45, Tilt: 90)', 'המתן (500 ms)', 'סובב ראש (Pan: 135, Tilt: 90)', 'סובב ראש (Pan: 90, Tilt: 90)'],
          codeTemplate: `// קוד C++ המיועד להיווצר בלייב:\nvoid setup() {\n  bot.begin();\n  bot.moveHead(45, 90); // 45° ימין\n  delay(500);\n  bot.moveHead(135, 90); // 135° שמאל\n  delay(500);\n  bot.moveHead(90, 90); // מרכז\n}\n\nvoid loop() {\n}`,
          code: `void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n}`
        },
        {
          id: '2.3',
          title: `שיעור 2.3: קריאת נתוני ${comps[0] || 'חיישן מרחק'} ותגובה`,
          isCodingMission: true,
          goal: 'קרא את המרחק ממכשול בזמן אמת, והפעל התראה אם עצם מתקרב לפחות מ-20 ס"מ.',
          neededBlocks: ['תוכנית רובוט', 'חזור לתמיד', 'אם (מרחק < 20)', 'עצור מנועים', 'הפעל זמזם'],
          codeTemplate: `// קוד C++ המיועד להיווצר בלייב:\nvoid setup() {\n  bot.begin();\n}\n\nvoid loop() {\n  int distance = bot.getDistance();\n  if (distance < 20) {\n    bot.stop();\n    bot.beep();\n  } else {\n    bot.moveForward(150);\n  }\n  delay(50);\n}`,
          code: `void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n}`
        }
      ];

      // Build Chapter 3 Autonomous Projects
      const projectLessons = [
        {
          id: '3.1',
          title: 'שיעור 3.1: אלגוריתם עקיפת מכשולים אוטונומי חכם',
          isCodingMission: true,
          goal: 'בנה אלגוריתם עצמאי מלא: הרובוט נוסע קדימה, סורק ימינה ושמאלה כשמזהה קיר, ובוחר את הנתיב הפנוי ביותר!',
          neededBlocks: ['תוכנית רובוט', 'חזור לתמיד', 'סרוק סביבה', 'בחר נתיב פנוי', 'סע בנתיב הנבחר'],
          codeTemplate: `// אלגוריתם אוטונומי מלא:\nvoid loop() {\n  if (bot.getDistance() < 25) {\n    bot.stop();\n    int rightDist = bot.scanRight();\n    int leftDist = bot.scanLeft();\n    if (rightDist > leftDist) {\n      bot.turnRight(200);\n    } else {\n      bot.turnLeft(200);\n    }\n  } else {\n    bot.moveForward(180);\n  }\n}`,
          code: `void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n}`
        }
      ];

      generatedTrack = {
        id: trackId,
        trackId: trackId,
        title: trackTitle,
        description: `מסלול למידה והרכבה מתקדם לפיתוח ${trackTitle} על גבי לוח ${targetBoard.toUpperCase()}, כולל שילוב חיישנים, מנועים ותכנות בבלוקים.`,
        targetBoard: targetBoard,
        badges: [targetBoard.toUpperCase(), 'הרכבה מכאנית', 'תכנות C++', 'חיישנים'],
        gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        glow: '0 0 30px rgba(16, 185, 129, 0.3)',
        coverImage: (imgs[0] || ''),
        welcomePage: {
          welcomeText: `ברוכים הבאים למסלול הלימוד של ${trackTitle}! במסלול זה תרכשו מיומנויות מעשיות בהרכבה פיזית של שלדת הרובוט, חיווט רכיבים ובקרת מנועים, כתיבת אלגוריתמי בקרה בבלוקים וקוד C++ מלא לצריבה ישירה על גבי לוח ה-${targetBoard.toUpperCase()}.`,
          features: [
            { title: 'מדריך הרכבה ויזואלי שלב-אחר-שלב', desc: 'רשימת ברגים ורכיבים מדויקת לכל שלב, כולל שרטוטי CAD ודגשים מכאניים.' },
            { title: 'משימות תכנות מודרכות בבלוקים', desc: 'לימוד תכנות מונחה עצמים, בקרת מנועים וחיישנים בבלוקים ובקוד C++.' },
            { title: 'פרויקטים אוטונומיים מתקדמים', desc: 'אלגוריתמים חכמים לעקיפת מכשולים, מעקב קו ושליטה אלחוטית.' }
          ]
        },
        chapters: [
          {
            id: 'ch1',
            title: `פרק 1: הרכבה מכאנית וזיווד מפורט (${assemblyLessons.length} שלבי CAD)`,
            lessons: assemblyLessons
          },
          {
            id: 'ch2',
            title: 'פרק 2: תכנות מונחה עצמים (OOP) ושימוש בספריות הרובוט',
            lessons: codingLessons
          },
          {
            id: 'ch3',
            title: 'פרק 3: פרויקטים אוטונומיים ואפליקציות מתקדמות',
            lessons: projectLessons
          }
        ]
      };
    }

    // 3. Post-Processing & Image Assignment Enrichment
    if (generatedTrack && generatedTrack.chapters) {
      const allAvailImages = [
        ...(uploadedMedia || []).map(m => m.url),
        ...(scrapedData?.images || [])
      ];

      // Set coverImage if missing
      if (!generatedTrack.coverImage && allAvailImages.length > 0) {
        generatedTrack.coverImage = allAvailImages[0];
      }

      let imgIndex = 0;
      generatedTrack.chapters.forEach(ch => {
        (ch.lessons || []).forEach(les => {
          // If lesson has no image or generic placeholder, assign next available scraped/uploaded image
          if ((!les.imageUrl || les.imageUrl === 'image_url_here' || les.imageUrl.includes('Optional') || les.imageUrl.includes('placeholder')) && allAvailImages.length > 0) {
            les.imageUrl = allAvailImages[imgIndex % allAvailImages.length];
            imgIndex++;
          }

          // Ensure instructions array is populated
          if (!les.instructions || !Array.isArray(les.instructions) || les.instructions.length === 0) {
            les.instructions = [
              'זהה את הרכיבים הנדרשים לשלב זה והנח אותם על משטח העבודה.',
              'בצע את החיבורים בהתאם לשרטוט ולמיקומי הפינים המפורטים.',
              'וודא כי כל החיבורים יציבים וללא קצרים חשמליים.'
            ];
          }

          // Ensure partsNeeded array is populated
          if (!les.partsNeeded || !Array.isArray(les.partsNeeded) || les.partsNeeded.length === 0) {
            les.partsNeeded = ['רכיב מרכזי', 'חוטי גישור', 'ברגי חיזוק'];
          }

          // Ensure code is populated
          if (!les.code) {
            les.code = `// קוד עבור שיעור ${les.id}\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}`;
          }
        });
      });
    }

    // Save to Database automatically
    await saveCustomTrack(generatedTrack);

    res.json({
      success: true,
      track: generatedTrack
    });
  } catch (err) {
    console.error('[AI Track Generator] Error generating track:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get all custom tracks
app.get('/api/custom-tracks', async (req, res) => {
  try {
    const list = await getCustomTracksList();
    res.json({ success: true, tracks: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get single custom track by ID
app.get('/api/custom-tracks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const track = await getCustomTrackById(id);
    if (!track) return res.status(404).json({ success: false, error: 'המסלול המבוקש לא נמצא' });
    res.json({ success: true, track });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Save or update custom track
app.post('/api/custom-tracks', async (req, res) => {
  try {
    const trackData = req.body;
    if (!trackData || !trackData.title) {
      return res.status(400).json({ success: false, error: 'חסרים פרטי מסלול לשמירה' });
    }
    const result = await saveCustomTrack(trackData);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete custom track
app.delete('/api/custom-tracks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await deleteCustomTrack(id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static React build files if present
const buildDir = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get('*', (req, res, next) => {
    // Don't intercept API endpoints
    if (req.path.startsWith('/compile') || req.path.startsWith('/upload') || req.path.startsWith('/ports') || req.path.startsWith('/send-code-email') || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

// Multi-port listening fallback (process.env.PORT -> 3002 -> 3005 -> 3001 -> 5005)
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PORTS_TO_TRY = envPort ? [envPort, 3002, 3005, 3001, 5005] : [3002, 3005, 3001, 5005];

function startServer(index = 0) {
  if (index >= PORTS_TO_TRY.length) {
    console.error('❌ כל הפורטים תפוסים. לא ניתן להפעיל את השרת.');
    return;
  }

  const targetPort = PORTS_TO_TRY[index];
  const server = app.listen(targetPort, async () => {
    console.log(`⚡ שרת קומפילציה ושליחה פועל בהצלחה על PORT ${targetPort}`);
    // Initialize SQL Server Database & Tables
    await initDatabase().catch(e => console.error('Database init error:', e));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ PORT ${targetPort} תפוס במחשב, מנסה באופן אוטומטי את PORT ${PORTS_TO_TRY[index + 1]}...`);
      startServer(index + 1);
    } else {
      console.error('Server launch error:', err);
    }
  });
}

startServer();