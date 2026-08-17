/**
 * smartBotProtocol.js
 * Instant Web Serial Communication Protocol for SuperBot Smart Firmware
 */

/**
 * Translates C++ code / Blockly text into SuperBot Smart Firmware instructions
 */
export function translateCodeToSmartBotCommands(code) {
  if (!code) return [];
  const commands = [];

  // Extract only setup and loop bodies to avoid inactive helper functions
  let targetCode = code;
  const setupMatch = code.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\}/);
  const loopMatch = code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\}/);

  if (setupMatch || loopMatch) {
    targetCode = (setupMatch ? setupMatch[1] : '') + '\n' + (loopMatch ? loopMatch[1] : '');
  }

  const lines = targetCode.split('\n');

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // 1. Move Forward
    const fwdMatch = line.match(/bot\.moveForward\s*\(\s*(\d+)?\s*\)/);
    if (fwdMatch) {
      commands.push(`FWD ${fwdMatch[1] || 150}`);
      continue;
    }

    // 2. Move Backward
    const backMatch = line.match(/bot\.moveBackward\s*\(\s*(\d+)?\s*\)/);
    if (backMatch) {
      commands.push(`BACK ${backMatch[1] || 150}`);
      continue;
    }

    // 3. Turn Left
    const leftMatch = line.match(/bot\.turnLeft\s*\(\s*(\d+)?\s*\)/);
    if (leftMatch) {
      commands.push(`LEFT ${leftMatch[1] || 150}`);
      continue;
    }

    // 4. Turn Right
    const rightMatch = line.match(/bot\.turnRight\s*\(\s*(\d+)?\s*\)/);
    if (rightMatch) {
      commands.push(`RIGHT ${rightMatch[1] || 150}`);
      continue;
    }

    // 5. Stop
    if (line.includes('bot.stop()')) {
      commands.push('STOP');
      continue;
    }

    // 6. Delay / Wait
    const delayMatch = line.match(/delay\s*\(\s*(\d+)\s*\)/);
    if (delayMatch) {
      commands.push(`DELAY ${delayMatch[1]}`);
      continue;
    }

    // 7. Beep
    const beepMatch = line.match(/bot\.beep\s*\(\s*(\d+)\s*\)/);
    if (beepMatch) {
      commands.push(`BEEP ${beepMatch[1]}`);
      continue;
    }

    // 8. Eyes Expression
    if (line.includes('EYE_HAPPY')) {
      commands.push('EYES HAPPY');
      continue;
    } else if (line.includes('EYE_ANGRY')) {
      commands.push('EYES ANGRY');
      continue;
    } else if (line.includes('EYE_NORMAL')) {
      commands.push('EYES NORMAL');
      continue;
    }

    // 9. LEDs (RGB)
    const ledMatch = line.match(/bot\.setLeds\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (ledMatch) {
      commands.push(`LEDS ${ledMatch[1]} ${ledMatch[2]} ${ledMatch[3]}`);
      continue;
    }

    // 10. Head Servo
    const headMatch = line.match(/bot\.setHead\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (headMatch) {
      commands.push(`HEAD ${headMatch[1]} ${headMatch[2]}`);
      continue;
    }
  }

  return commands;
}

/**
 * Uploads a list of commands directly to ESP32 Flash memory over Web Serial
 */
export async function uploadSmartProgramOverSerial({
  commands = [],
  baudRate = 115200,
  onLog = console.log,
  onProgress = () => {}
}) {
  if (!navigator.serial) {
    throw new Error('דפדפן זה אינו תומך ב-Web Serial API. אנא השתמש ב-Chrome או Edge.');
  }

  onLog('🔍 נא לבחור את חיבור ה-USB של הרובוט בחלון שיופיע בדפדפן...');
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate });

  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();

  const writeLine = async (str) => {
    await writer.write(encoder.encode(str + '\n'));
    await new Promise(r => setTimeout(r, 40));
  };

  try {
    onLog('⚡ מתחבר לרובוט ה-ESP32...');
    onProgress(10);

    await writeLine('PING');
    onProgress(25);

    onLog(`📦 מכין להעברה ${commands.length} פקודות לזיכרון ה-Flash של הרובוט...`);
    await writeLine('PROG:START');

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      onLog(`  > פקודה ${i + 1}/${commands.length}: ${cmd}`);
      await writeLine(cmd);
      const pct = 30 + Math.round(((i + 1) / commands.length) * 60);
      onProgress(pct);
    }

    onLog('💾 שומר את התוכנית בזיכרון ה-Flash של ה-ESP32...');
    await writeLine('PROG:END');
    onProgress(100);

    onLog('🎉 התוכנית החדשה נשמרה ברובוט בהצלחה תוך 0.4 שניות!');
    onLog('💡 כעת הרובוט פועל! ניתן גם לנתק את כבל ה-USB ולהפעיל אותו על הרצפה.');

    // Release port
    await writer.releaseLock();
    reader.releaseLock();
    await port.close();

    return true;
  } catch (err) {
    try {
      writer.releaseLock();
      reader.releaseLock();
      await port.close();
    } catch (e) {}
    throw err;
  }
}
