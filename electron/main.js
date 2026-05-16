const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let nextServerProcess;
const PORT = 3000;

// Function to check if the port is ready to accept connections
function waitForServer(port, callback) {
  const tryConnection = () => {
    const socket = new net.Socket();
    socket.on('connect', () => {
      socket.destroy();
      callback();
    });
    socket.on('error', () => {
      setTimeout(tryConnection, 200);
    });
    socket.connect(port, '127.0.0.1');
  };
  tryConnection();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = !app.isPackaged;
  const basePath = isDev 
      ? path.join(__dirname, '..', '.next', 'standalone') 
      : path.join(app.getAppPath(), '.next', 'standalone');
  const nextServerScript = path.join(basePath, 'server.js');

  console.log('Starting Next.js detached server at:', nextServerScript);

  // When packaged, .env.local will be in process.resourcesPath (extraResources)
  const envPath = isDev ? path.join(__dirname, '..', '.env.local') : path.join(process.resourcesPath, '.env.local');

  nextServerProcess = spawn('node', [nextServerScript], {
    env: {
      ...process.env,
      PORT: PORT,
      NODE_ENV: isDev ? 'development' : 'production'
    },
    stdio: 'pipe'
  });

  nextServerProcess.stdout.on('data', (data) => console.log(`[Next.js]: ${data.toString()}`));
  nextServerProcess.stderr.on('data', (data) => console.error(`[Next.js Error]: ${data.toString()}`));

  // Wait for the local server to respond, then load URL
  waitForServer(PORT, () => {
    console.log('Next.js server is ready, loading window...');
    mainWindow.loadURL(`http://localhost:${PORT}`);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }
});
