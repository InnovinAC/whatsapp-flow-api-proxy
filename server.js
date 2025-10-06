const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let baseUrl = '';
async function makeProxyRequest(method, path, data = null, query = null) {
  if (!baseUrl) {
    throw new Error('Base URL not set. Please set the base URL first.');
  }

  const url = `${baseUrl}${path}`;
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'test'
    },
  };

  if (data) {
    config.data = data;
  }

  if (query) {
    config.params = query;
  }

  try {
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else {
      throw error;
    }
  }
}

app.post('/config/base-url', (req, res) => {
  const { baseUrl: newBaseUrl } = req.body;
  
  if (!newBaseUrl) {
    return res.status(400).json({ error: 'Base URL is required' });
  }

  try {
    new URL(newBaseUrl);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  baseUrl = newBaseUrl;
  res.json({ 
    message: 'Base URL updated successfully', 
    baseUrl: baseUrl 
  });
});

app.get('/config/base-url', (req, res) => {
  res.json({ baseUrl: baseUrl || 'Not set' });
});

app.get('/webhook', async (req, res) => {
  try {
    const result = await makeProxyRequest('GET', '/webhook', null, req.query);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.post('/flow', async (req, res) => {
  try {
    const result = await makeProxyRequest('POST', '/flow', req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const result = await makeProxyRequest('POST', '/webhook', req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    baseUrl: baseUrl || 'Not set',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Flow API Proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Set base URL: POST http://localhost:${PORT}/config/base-url`);
});

module.exports = app;
