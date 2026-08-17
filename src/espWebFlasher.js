/**
 * espWebFlasher.js
 * Browser-based ESP32 / ESP8266 flasher using Web Serial API & esptool-js
 */

export async function loadEsptoolLibrary() {
  if (window.esptooljs || (window.ESPLoader && window.Transport)) {
    return window.esptooljs || { ESPLoader: window.ESPLoader, Transport: window.Transport };
  }

  // Load dynamically if not loaded from index.html
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="esptool-js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        resolve(window.esptooljs || { ESPLoader: window.ESPLoader, Transport: window.Transport });
      });
      existingScript.addEventListener('error', reject);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/esptool-js@0.5.4/bundle.js';
      script.onload = () => resolve(window.esptooljs || { ESPLoader: window.ESPLoader, Transport: window.Transport });
      script.onerror = () => reject(new Error('Failed to load esptool-js library from CDN'));
      document.head.appendChild(script);
    }
  });
}

/**
 * Converts a base64 string to a binary string suitable for esptool-js
 */
export function base64ToBinaryString(base64) {
  const binaryString = atob(base64);
  return binaryString;
}

/**
 * Flash ESP32 directly from the browser
 * @param {Object} options
 * @param {string} options.binBase64 Base64 encoded app binary
 * @param {string} [options.bootloaderBase64] Base64 bootloader binary
 * @param {string} [options.partitionsBase64] Base64 partitions binary
 * @param {number} [options.baudRate=115200]
 * @param {Function} options.onLog Callback for log messages
 * @param {Function} options.onProgress Callback for progress percentage (0-100)
 */
export async function flashESP32FromBrowser({
  binBase64,
  bootloaderBase64,
  partitionsBase64,
  baudRate = 115200,
  onLog = console.log,
  onProgress = () => {}
}) {
  if (!navigator.serial) {
    throw new Error('הדפדפן אינו תומך ב-Web Serial API. אנא השתמש בדפדפן Google Chrome או Microsoft Edge.');
  }

  onLog('🔍 נא לבחור את חיבור ה-USB של הרובוט בחלון שיופיע בדפדפן...');
  const port = await navigator.serial.requestPort();

  onLog('🔌 טוען מנוע צריבה Web Serial (esptool-js)...');
  const esptool = await loadEsptoolLibrary();
  const ESPLoader = esptool.ESPLoader || window.ESPLoader;
  const Transport = esptool.Transport || window.Transport;

  if (!ESPLoader || !Transport) {
    throw new Error('לא ניתן היה לטעון את מנוע ה-esptool-js בדפדפן.');
  }

  onLog('⚡ מתחבר ליציאת ה-USB...');
  const transport = new Transport(port);

  const customTerminal = {
    clean() {},
    writeLine(data) {
      if (data && data.trim()) onLog(`[ESP] ${data.trim()}`);
    },
    write(data) {
      if (data && data.trim()) onLog(`[ESP] ${data.trim()}`);
    }
  };

  const loaderOptions = {
    transport,
    baudrate: baudRate,
    terminal: customTerminal,
    romBaudrate: 115200
  };

  const espLoader = new ESPLoader(loaderOptions);

  onLog('⏳ מתחבר ל-Bootloader של ה-ESP32 (Syncing)...');
  const chip = await espLoader.main();
  onLog(`✅ זוהה בהצלחה רכיב: ${chip || 'ESP32'}`);

  const fileArray = [];

  // Add bootloader if provided
  if (bootloaderBase64) {
    fileArray.push({
      data: base64ToBinaryString(bootloaderBase64),
      address: 0x1000
    });
  }

  // Add partitions if provided
  if (partitionsBase64) {
    fileArray.push({
      data: base64ToBinaryString(partitionsBase64),
      address: 0x8000
    });
  }

  // App binary (default address 0x10000 for ESP32)
  if (binBase64) {
    fileArray.push({
      data: base64ToBinaryString(binBase64),
      address: 0x10000
    });
  }

  if (fileArray.length === 0) {
    throw new Error('לא התקבל קובץ בינארי (.bin) לצריבה.');
  }

  onLog('🚀 מתחיל בכתיבת הנתונים לזיכרון ה-Flash של ה-ESP32...');

  const flashOptions = {
    fileArray,
    flashSize: 'keep',
    eraseAll: false,
    compress: true,
    calculateMD5Hash: (image) => ''
  };

  let lastReportedPercent = -1;

  await espLoader.writeFlash({
    ...flashOptions,
    reportProgress: (fileIndex, written, total) => {
      const percent = Math.round((written / total) * 100);
      if (percent !== lastReportedPercent) {
        lastReportedPercent = percent;
        onProgress(percent);
        if (percent % 20 === 0 || percent === 100) {
          onLog(`📦 צורב נתונים ל-ESP32: ${percent}%`);
        }
      }
    }
  });

  onLog('🔄 מבצע Hard Reset לכרטיס ה-ESP32 להפעלת התוכנה החדשה...');
  try {
    await espLoader.hardReset();
  } catch (e) {
    // Some ESP32 boards reset automatically
  }

  try {
    await transport.disconnect();
  } catch (e) {}

  onLog('🎉 הצריבה הושלמה ב-100% בהצלחה! הרובוט פועל עכשיו עם הקוד החדש.');
  return true;
}
