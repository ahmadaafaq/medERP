const http = require('http');

const data = JSON.stringify({
  email: 'nornx',
  password: 'nornx@med'
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', JSON.parse(body));
  });
});

req.on('error', err => console.error('Request error:', err));
req.write(data);
req.end();
