const express = require('express');
const cors = require('cors');
const client = require('prom-client');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Enable default runtime metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics();

// Define custom business metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status']
});

const submissionCounter = new client.Counter({
  name: 'app_submissions_total',
  help: 'Total number of text submissions received'
});

// Middleware for global request tracking
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// API Routes
app.post('/api/submit', (req, res) => {
  const { payload } = req.body;
  submissionCounter.inc();
  res.status(200).json({ status: 'success', received: payload });
});

// Prometheus Scrape Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => console.log(`Backend server active on port ${PORT}`));