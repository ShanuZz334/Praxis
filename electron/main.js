const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        backgroundColor: "#000000" // Prevents white flash
    });

    // Load the Vite dev server URL in development
    mainWindow.loadURL("http://localhost:5173");

    // Open DevTools automatically in dev
    mainWindow.webContents.openDevTools();

    mainWindow.on("closed", function () {
        mainWindow = null;
    });
}

function startBackend() {
    console.log("Starting backend Express server...");
    
    // Path to the backend server.js
    const backendPath = path.join(__dirname, "../backend/server.js");
    
    // Spawn the Node process
    backendProcess = spawn("node", [backendPath], {
        stdio: "inherit", // Pipe output to Electron's console
        cwd: path.join(__dirname, "../backend")
    });

    backendProcess.on("close", (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

app.on("ready", () => {
    startBackend();
    
    // Give the backend a second to boot up
    setTimeout(createWindow, 1500);
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("before-quit", () => {
    // Kill the backend child process when Electron closes
    if (backendProcess) {
        console.log("Shutting down backend...");
        backendProcess.kill();
    }
});
