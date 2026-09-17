const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;
let ensembleProcess;

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

function startEnsemble() {
    console.log("Starting Python foundation model ensemble service (Kronos & Chronos-Bolt)...");
    const researchDir = path.resolve(__dirname, "../../praxis-research");
    const pythonExe = path.join(researchDir, ".venv", "Scripts", "python.exe");
    const runScript = path.join(researchDir, "run_ensemble.py");

    if (fs.existsSync(pythonExe) && fs.existsSync(runScript)) {
        ensembleProcess = spawn(pythonExe, [runScript], {
            stdio: "inherit",
            cwd: researchDir
        });

        ensembleProcess.on("close", (code) => {
            console.log(`Ensemble process exited with code ${code}`);
        });
    } else {
        console.warn("Python venv or run_ensemble.py not found at:", researchDir);
    }
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
    startEnsemble();
    startBackend();
    
    // Give services a moment to boot up
    setTimeout(createWindow, 2000);
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
    // Kill child processes when Electron closes
    if (backendProcess) {
        console.log("Shutting down backend...");
        backendProcess.kill();
    }
    if (ensembleProcess) {
        console.log("Shutting down Python ensemble service...");
        ensembleProcess.kill();
    }
});
