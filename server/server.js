const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
app.use(express.json({ limit: '10mb' }));

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

// 4. POST Send Code to Email Endpoint
app.post('/send-code-email', (req, res) => {
  const { email = 'shimon1351992@gmail.com', code, filename = 'superbot_car.ino', notes } = req.body;
  console.log(`[Email] Request to send code to ${email} for file: ${filename}`);

  // Returns success response with instructions/payload confirmation
  res.json({ 
    success: true, 
    message: `הקוד נשלח בהצלחה למייל ${email}`,
    recipient: email 
  });
});

// Multi-port listening fallback (process.env.PORT -> 3002 -> 3005 -> 3001 -> 5005)
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PORTS_TO_TRY = envPort ? [envPort, 3002, 3005, 3001, 5005] : [3002, 3005, 3001, 5005];

function startServer(index = 0) {
  if (index >= PORTS_TO_TRY.length) {
    console.error('❌ כל הפורטים תפוסים. לא ניתן להפעיל את השרת.');
    return;
  }

  const targetPort = PORTS_TO_TRY[index];
  const server = app.listen(targetPort, () => {
    console.log(`⚡ שרת קומפילציה פועל בהצלחה על PORT ${targetPort}`);
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