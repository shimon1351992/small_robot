/**
 * SuperBot_SmartFirmware.ino
 * Universal Smart Runtime Firmware for ESP32 SuperBot
 * 
 * Upload this sketch ONCE to your ESP32 board.
 * Afterwards, you can upload and run any Blockly/Code commands
 * directly from the website in 0.3s via Web Serial without recompiling!
 */

#include "SuperBot.h"
#include <Preferences.h>

SuperBot bot;
Preferences prefs;

#define MAX_COMMANDS 128
#define PREF_NAMESPACE "superbot_prog"

enum CommandType {
  CMD_NONE = 0,
  CMD_FWD,
  CMD_BACK,
  CMD_LEFT,
  CMD_RIGHT,
  CMD_STOP,
  CMD_DELAY,
  CMD_EYES,
  CMD_LEDS,
  CMD_BEEP,
  CMD_HEAD,
  CMD_CHECK_LINE,
  CMD_CHECK_DIST,
  CMD_LOOP_START,
  CMD_LOOP_END
};

struct RobotCommand {
  uint8_t type;
  int16_t arg1;
  int16_t arg2;
  int16_t arg3;
};

RobotCommand program[MAX_COMMANDS];
uint16_t programLength = 0;
bool isProgramRunning = true;
unsigned long lastHeartbeat = 0;

void loadProgramFromFlash() {
  prefs.begin(PREF_NAMESPACE, true);
  programLength = prefs.getUShort("len", 0);
  if (programLength > MAX_COMMANDS) programLength = 0;
  
  if (programLength > 0) {
    size_t readBytes = prefs.getBytes("prog", program, sizeof(RobotCommand) * programLength);
    Serial.printf("📦 [Flash] Loaded %d commands from internal storage (%d bytes).\n", programLength, (int)readBytes);
  } else {
    Serial.println("ℹ️ [Flash] No saved program found. Waiting for commands from browser...");
  }
  prefs.end();
}

void saveProgramToFlash() {
  prefs.begin(PREF_NAMESPACE, false);
  prefs.putUShort("len", programLength);
  if (programLength > 0) {
    prefs.putBytes("prog", program, sizeof(RobotCommand) * programLength);
  }
  prefs.end();
  Serial.printf("💾 [Flash] Saved %d commands permanently to ESP32 Flash memory!\n", programLength);
}

void executeSingleCommand(const RobotCommand& cmd) {
  switch (cmd.type) {
    case CMD_FWD:
      bot.moveForward(cmd.arg1 > 0 ? cmd.arg1 : 150);
      break;
    case CMD_BACK:
      bot.moveBackward(cmd.arg1 > 0 ? cmd.arg1 : 150);
      break;
    case CMD_LEFT:
      bot.turnLeft(cmd.arg1 > 0 ? cmd.arg1 : 150);
      break;
    case CMD_RIGHT:
      bot.turnRight(cmd.arg1 > 0 ? cmd.arg1 : 150);
      break;
    case CMD_STOP:
      bot.stop();
      break;
    case CMD_DELAY:
      delay(cmd.arg1 > 0 ? cmd.arg1 : 100);
      break;
    case CMD_EYES:
      if (cmd.arg1 == 1) bot.setEyes(EYE_HAPPY);
      else if (cmd.arg1 == 2) bot.setEyes(EYE_ANGRY);
      else bot.setEyes(EYE_NORMAL);
      break;
    case CMD_LEDS:
      bot.setLeds(cmd.arg1, cmd.arg2, cmd.arg3);
      break;
    case CMD_BEEP:
      bot.beep(cmd.arg1 > 0 ? cmd.arg1 : 100);
      break;
    case CMD_HEAD:
      bot.setHead(cmd.arg1, cmd.arg2);
      break;
    default:
      break;
  }
}

void runStoredProgram() {
  if (programLength == 0 || !isProgramRunning) return;

  for (uint16_t i = 0; i < programLength; i++) {
    // Check if new serial command arrived while executing
    if (Serial.available() > 0) return;
    executeSingleCommand(program[i]);
  }
}

void parseSerialLine(String line) {
  line.trim();
  if (line.length() == 0) return;

  if (line == "PING") {
    Serial.println("PONG:SUPERBOT_READY");
    return;
  }

  if (line == "GET:SENSORS") {
    float dist = bot.getDistance();
    bool dark = bot.isDark();
    Serial.printf("DATA:DIST=%.1f,DARK=%d\n", dist, dark ? 1 : 0);
    return;
  }

  if (line == "PROG:CLEAR") {
    programLength = 0;
    saveProgramToFlash();
    bot.stop();
    Serial.println("OK:CLEARED");
    return;
  }

  if (line.startsWith("PROG:START")) {
    programLength = 0;
    isProgramRunning = false;
    bot.stop();
    Serial.println("OK:READY_FOR_PROGRAM");
    return;
  }

  if (line.startsWith("PROG:END")) {
    saveProgramToFlash();
    isProgramRunning = true;
    Serial.println("OK:PROGRAM_SAVED_AND_RUNNING");
    return;
  }

  // Parse Command Line: e.g. "FWD 200" or "DELAY 1000"
  int spaceIdx = line.indexOf(' ');
  String cmdStr = spaceIdx > 0 ? line.substring(0, spaceIdx) : line;
  String argsStr = spaceIdx > 0 ? line.substring(spaceIdx + 1) : "";

  RobotCommand cmd = { CMD_NONE, 0, 0, 0 };

  if (cmdStr == "FWD") {
    cmd.type = CMD_FWD;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "BACK") {
    cmd.type = CMD_BACK;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "LEFT") {
    cmd.type = CMD_LEFT;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "RIGHT") {
    cmd.type = CMD_RIGHT;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "STOP") {
    cmd.type = CMD_STOP;
  } else if (cmdStr == "DELAY") {
    cmd.type = CMD_DELAY;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "EYES") {
    cmd.type = CMD_EYES;
    if (argsStr == "HAPPY") cmd.arg1 = 1;
    else if (argsStr == "ANGRY") cmd.arg1 = 2;
    else cmd.arg1 = 0;
  } else if (cmdStr == "LEDS") {
    cmd.type = CMD_LEDS;
    int c1 = argsStr.indexOf(' ');
    int c2 = c1 > 0 ? argsStr.indexOf(' ', c1 + 1) : -1;
    if (c1 > 0 && c2 > 0) {
      cmd.arg1 = argsStr.substring(0, c1).toInt();
      cmd.arg2 = argsStr.substring(c1 + 1, c2).toInt();
      cmd.arg3 = argsStr.substring(c2 + 1).toInt();
    }
  } else if (cmdStr == "BEEP") {
    cmd.type = CMD_BEEP;
    cmd.arg1 = argsStr.toInt();
  } else if (cmdStr == "HEAD") {
    cmd.type = CMD_HEAD;
    int c1 = argsStr.indexOf(' ');
    if (c1 > 0) {
      cmd.arg1 = argsStr.substring(0, c1).toInt();
      cmd.arg2 = argsStr.substring(c1 + 1).toInt();
    }
  }

  if (cmd.type != CMD_NONE) {
    if (programLength < MAX_COMMANDS) {
      program[programLength++] = cmd;
      Serial.printf("OK:CMD_%d_ADDED\n", programLength);
    }
    // Also execute immediately for live testing
    executeSingleCommand(cmd);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("=================================================");
  Serial.println("🤖 SuperBot Universal Smart Firmware v2.0 Online");
  Serial.println("⚡ Web Serial Protocol Ready at 115200 baud");
  Serial.println("=================================================");

  bot.begin();
  bot.setEyes(EYE_HAPPY);
  bot.beep(150);

  loadProgramFromFlash();
}

void loop() {
  // Check for incoming commands over Web Serial
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\n');
    parseSerialLine(incoming);
  }

  // Run autonomous stored program if active
  runStoredProgram();
}
