const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const COLORS = {
    CYAN: '\x1b[36m',
    GREEN: '\x1b[32m',
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
};

function startService(name, command, args, cwd, color) {
    console.log(`${color}[${name}] Starting...${COLORS.RESET}`);

    const process = spawn(command, args, {
        cwd: cwd,
        shell: true, // Required for npm on Windows
        stdio: 'pipe',
    });

    process.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                console.log(`${color}[${name}] ${COLORS.RESET}${line.trim()}`);
            }
        });
    });

    process.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                console.error(`${color}[${name}] ${COLORS.RED}ERR: ${COLORS.RESET}${line.trim()}`);
            }
        });
    });

    process.on('close', (code) => {
        console.log(`${color}[${name}] Exited with code ${code}${COLORS.RESET}`);
    });

    process.on('error', (err) => {
        console.error(`${color}[${name}] Failed to start: ${err.message}${COLORS.RESET}`);
    });

    return process;
}

// Define paths
const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Start Frontend (Vite)
const frontend = startService('Frontend', 'npm', ['run', 'dev'], frontendDir, COLORS.CYAN);

// Start Backend (Node/Nodemon)
const backend = startService('Backend', 'npm', ['run', 'dev'], backendDir, COLORS.GREEN);

// Handle graceful shutdown
const cleanup = () => {
    console.log('\nStopping services...');
    frontend.kill();
    backend.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
