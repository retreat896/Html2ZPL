const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body }));
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Tests ---');

    // 1. Register
    const userData = JSON.stringify({ username: 'testuser', password: 'password123' });
    try {
        console.log('Test 1: Registering user...');
        const regRes = await post('/register', userData);
        console.log(`Status: ${regRes.status}, Body: ${regRes.body}`);
    } catch(e) { console.error('Register failed', e); }

    // 2. Login Success
    try {
        console.log('Test 2: Logging in...');
        const loginRes = await post('/login', userData);
        console.log(`Status: ${loginRes.status}, Body: ${loginRes.body}`);
    } catch(e) { console.error('Login failed', e); }

    // 3. Login Fail
    const badData = JSON.stringify({ username: 'testuser', password: 'wrongpassword' });
    try {
        console.log('Test 3: Logging in with wrong password...');
        const failRes = await post('/login', badData);
        console.log(`Status: ${failRes.status}, Body: ${failRes.body}`);
    } catch(e) { console.error('Login fail test error', e); }
    
    console.log('--- Tests Complete ---');
}

runTests();
