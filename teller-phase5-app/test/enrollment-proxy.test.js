#!/usr/bin/env node

const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function startMockBackend() {
  return new Promise((resolve, reject) => {
    const requests = [];
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api/enrollments') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          let parsed = null;
          try {
            parsed = body ? JSON.parse(body) : null;
          } catch (error) {
            res.statusCode = 400;
            res.end('invalid json');
            return;
          }

          requests.push({
            headers: { ...req.headers },
            body,
            parsed
          });

          res.statusCode = 201;
          res.setHeader('content-type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              forwardedAuthorization: req.headers['authorization'] || null,
              received: parsed
            })
          );
        });
        return;
      }

      res.statusCode = 404;
      res.end('not found');
    });

    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address.port !== 'number') {
        reject(new Error('Failed to bind mock backend'));
        return;
      }

      resolve({ server, requests, port: address.port });
    });

    server.on('error', reject);
  });
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address.port !== 'number') {
          reject(new Error('Failed to allocate ephemeral port'));
        } else {
          resolve(address.port);
        }
      });
    });
    server.on('error', reject);
  });
}

async function waitForServer(child, port) {
  const readyString = `Server running on http://0.0.0.0:${port}`;
  let output = '';

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for proxy to start. Output:\n${output}`));
    }, 10000);

    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(readyString)) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Proxy exited early with code ${code}. Output:\n${output}`));
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    function cleanup() {
      clearTimeout(timeout);
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
      child.off('exit', onExit);
      child.off('error', onError);
    }

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

test('POST /api/enrollments proxies payload and Authorization header', async (t) => {
  const backend = await startMockBackend();
  t.after(() => new Promise((resolve) => backend.server.close(resolve)));

  const proxyPort = await getAvailablePort();
  const env = {
    ...process.env,
    PORT: String(proxyPort),
    BACKEND_URL: `http://127.0.0.1:${backend.port}`
  };

  const proxyProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  t.after(async () => {
    if (!proxyProcess.killed) {
      proxyProcess.kill('SIGTERM');
    }
    if (proxyProcess.exitCode === null) {
      await new Promise((resolve) => proxyProcess.once('exit', resolve));
    }
  });

  await waitForServer(proxyProcess, proxyPort);

  const payload = {
    business_name: 'Acme LLC',
    owner_email: 'owner@example.com'
  };
  const authHeader = 'Bearer test-enrollment-token';

  const response = await fetch(`http://127.0.0.1:${proxyPort}/api/enrollments`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  assert.equal(response.status, 201, 'proxy should relay backend status code');
  assert.equal(response.headers.get('content-type'), 'application/json');
  const body = await response.json();
  assert.deepEqual(body.received, payload, 'backend should receive original payload');
  assert.equal(
    body.forwardedAuthorization,
    authHeader,
    'Authorization header should be preserved'
  );

  assert.equal(backend.requests.length, 1, 'backend should receive exactly one request');
  const recorded = backend.requests[0];
  assert.equal(
    recorded.headers['authorization'],
    authHeader,
    'backend should see original Authorization header'
  );
  assert.deepEqual(recorded.parsed, payload, 'backend should receive identical JSON');
});
