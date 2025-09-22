const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const opentelemetry = require('@opentelemetry/api');

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'nodejs-tracing-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317'

  //   url: 'https://ingress.{YOUR_CORALOGIX_REGION}.coralogix.com:443',
  //   headers: {
  //   Authorization: 'Bearer YOUR_CORALOGIX_PRIVATE_KEY',
  // },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

const express = require('express');
const axios = require('axios');
const winston = require('winston');

// Custom JSON formatter with trace correlation
const jsonFormatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const span = opentelemetry.trace.getActiveSpan();
    const traceId = span?.spanContext()?.traceId || null;
    const spanId = span?.spanContext()?.spanId || null;
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: process.env.SERVICE_NAME || 'nodejs-tracing-app',
      trace_id: traceId,
      span_id: spanId,
      ...meta
    });
  })
);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: jsonFormatter,
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
app.use(express.json());

// Service ports
const SERVICE_A_PORT = parseInt(process.env.SERVICE_A_PORT) || 3000;
const SERVICE_B_PORT = parseInt(process.env.SERVICE_B_PORT) || 3001;
const SERVICE_C_PORT = parseInt(process.env.SERVICE_C_PORT) || 3002;

// Utility functions
function simulateLatency() {
  const delay = Math.random() * 1900 + 100; // 100-2000ms
  return new Promise(resolve => setTimeout(resolve, delay));
}

function simulateError() {
  const errorChance = Math.random();
  if (errorChance < 0.1) return 500; // 10% chance of 500 error
  if (errorChance < 0.2) return 400; // 10% chance of 400 error
  return 200;
}

// Service A Routes (Main API)
app.get('/api/users', async (req, res) => {
  const tracer = opentelemetry.trace.getTracer('nodejs-app');
  const span = tracer.startSpan('get_users');
  
  try {
    logger.info('Processing user request');
    
    await simulateLatency();
    const statusCode = simulateError();
    
    span.setAttributes({
      'http.method': 'GET',
      'http.route': '/api/users',
      'http.status_code': statusCode
    });
    
    if (statusCode === 500) {
      logger.error('Internal server error occurred');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Internal server error' });
      return res.status(500).json({ error: 'Internal server error' });
    } else if (statusCode === 400) {
      logger.warn('Bad request received');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Bad request' });
      return res.status(400).json({ error: 'Bad request' });
    }
    
    // Call Service B
    const profileResponse = await axios.get(`http://localhost:${SERVICE_B_PORT}/api/profiles`);
    const profileData = profileResponse.data;
    
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' }
    ];
    
    const result = {
      users,
      profile_data: profileData,
      total_count: users.length
    };
    
    logger.info(`Successfully processed ${users.length} users`);
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    res.json(result);
    
  } catch (error) {
    logger.error(`Error calling profile service: ${error.message}`);
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: error.message });
    res.status(503).json({ error: 'Service unavailable' });
  } finally {
    span.end();
  }
});

// Service B Routes (Secondary API)
app.get('/api/profiles', async (req, res) => {
  const tracer = opentelemetry.trace.getTracer('nodejs-app');
  const span = tracer.startSpan('get_profiles');
  
  try {
    logger.info('Processing profile request');
    
    await simulateLatency();
    const statusCode = simulateError();
    
    span.setAttributes({
      'http.method': 'GET',
      'http.route': '/api/profiles',
      'http.status_code': statusCode
    });
    
    if (statusCode === 500) {
      logger.error('Profile service error');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Profile service error' });
      return res.status(500).json({ error: 'Profile service error' });
    } else if (statusCode === 400) {
      logger.warn('Invalid profile request');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Invalid request' });
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Call Service C
    const settingsResponse = await axios.get(`http://localhost:${SERVICE_C_PORT}/api/settings`);
    const settingsData = settingsResponse.data;
    
    const profiles = {
      active_profiles: 45,
      inactive_profiles: 12,
      settings: settingsData,
      last_sync: new Date().toISOString()
    };
    
    logger.info('Successfully retrieved profile data');
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    res.json(profiles);
    
  } catch (error) {
    logger.error(`Error calling settings service: ${error.message}`);
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: error.message });
    res.status(503).json({ error: 'Settings service unavailable' });
  } finally {
    span.end();
  }
});

// Service C Routes (Data Service)
app.get('/api/settings', async (req, res) => {
  const tracer = opentelemetry.trace.getTracer('nodejs-app');
  const span = tracer.startSpan('get_settings');
  
  try {
    logger.info('Processing settings request');
    
    await simulateLatency();
    const statusCode = simulateError();
    
    span.setAttributes({
      'http.method': 'GET',
      'http.route': '/api/settings',
      'http.status_code': statusCode
    });
    
    if (statusCode === 500) {
      logger.error('Settings service database error');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Database error' });
      return res.status(500).json({ error: 'Database error' });
    } else if (statusCode === 400) {
      logger.warn('Invalid settings query');
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: 'Invalid query' });
      return res.status(400).json({ error: 'Invalid query' });
    }
    
    const settings = {
      theme: 'dark',
      notifications: true,
      language: 'en',
      timezone: 'UTC',
      features: {
        beta_features: false,
        analytics: true
      }
    };
    
    logger.info('Successfully retrieved settings data');
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    res.json(settings);
    
  } finally {
    span.end();
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: process.env.SERVICE_NAME || 'nodejs-tracing-app',
    timestamp: new Date().toISOString()
  });
});

// Start server
const serviceName = process.env.SERVICE_NAME || 'service-a';
let port;

if (serviceName === 'service-a') {
  port = SERVICE_A_PORT;
} else if (serviceName === 'service-b') {
  port = SERVICE_B_PORT;
} else {
  port = SERVICE_C_PORT;
}

app.listen(port, () => {
  logger.info(`${serviceName} started on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  sdk.shutdown();
  process.exit(0);
});
