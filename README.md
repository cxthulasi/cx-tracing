# Node.js OpenTelemetry Tracing Sample

This sample application demonstrates distributed tracing with OpenTelemetry in Node.js using Express.

## Architecture

The application consists of three services:
- **Service A (Port 3000)**: Main API that handles user requests
- **Service B (Port 3001)**: Profile service that manages user profiles
- **Service C (Port 3002)**: Settings service that provides user settings

## Features

- ✅ OpenTelemetry auto-instrumentation for Express and HTTP requests
- ✅ Distributed tracing across multiple services
- ✅ JSON structured logging with trace ID and span ID correlation
- ✅ Variable latencies (100-2000ms)
- ✅ Multiple HTTP status codes (200, 400, 500) with 10% error rate each
- ✅ OTLP export to collector
- ✅ Ready for Coralogix APM integration

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Test the application:**
   ```bash
   # Generate traces with different outcomes
   curl http://localhost:3000/api/users
   curl http://localhost:3001/api/profiles
   curl http://localhost:3002/api/settings
   ```


4. **View logs:**
   ```bash
   # Service-specific logs are stored in separate directories
   tail -f logs/service-a/combined.log
   tail -f logs/service-b/combined.log
   tail -f logs/service-c/combined.log

   # Error logs only
   tail -f logs/service-a/error.log
   ```

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start OTEL Collector:**
   ```bash
   docker run -p 4317:4317 -p 4318:4318 \
     -v $(pwd)/otel-collector-config.yaml:/etc/otel-collector-config.yaml \
     otel/opentelemetry-collector-contrib:latest \
     --config=/etc/otel-collector-config.yaml
   ```

3. **Start services in separate terminals using .env files:**
   ```bash
   # Terminal 1 - Service A
   npx dotenv -e .env.service-a npm start

   # Terminal 2 - Service B
   npx dotenv -e .env.service-b npm start

   # Terminal 3 - Service C
   npx dotenv -e .env.service-c npm start
   ```

   **Alternative (manual environment setup):**
   ```bash
   # Terminal 1 - Service A
   export $(cat .env.service-a | xargs) && npm start

   # Terminal 2 - Service B
   export $(cat .env.service-b | xargs) && npm start

   # Terminal 3 - Service C
   export $(cat .env.service-c | xargs) && npm start
   ```

## Environment Variables

The application uses `.env` files for configuration:

- **`.env`**: Default configuration for Docker Compose
- **`.env.service-a`**: Service A specific configuration for local development
- **`.env.service-b`**: Service B specific configuration for local development
- **`.env.service-c`**: Service C specific configuration for local development

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVICE_NAME` | `service-a` | Service identifier (service-a, service-b, service-c) |
| `SERVICE_A_PORT` | `3000` | Port for Service A |
| `SERVICE_B_PORT` | `3001` | Port for Service B |
| `SERVICE_C_PORT` | `3002` | Port for Service C |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` | OTLP collector endpoint |
| `OTEL_SERVICE_NAME` | `nodejs-tracing-app` | Service name for traces |
| `NODE_ENV` | `production` | Node.js environment |
| `LOG_LEVEL` | `info` | Logging level |


## API Endpoints

### Service A (Main API)
- `GET /api/users` - Retrieve users (calls Service B)
- `GET /health` - Health check

### Service B (Profiles)
- `GET /api/profiles` - Get user profiles (calls Service C)
- `GET /health` - Health check

### Service C (Settings)
- `GET /api/settings` - Get user settings
- `GET /health` - Health check

## Logging Configuration

The application uses Winston for structured logging with the following features:

### Log Files
- **`logs/combined.log`**: All log levels (info, warn, error)
- **`logs/error.log`**: Error logs only
- **Log Rotation**: 5MB max file size, keeps 5 files
- **Console Output**: Logs also appear in console/stdout

### Log Locations
- **Docker**: Logs are mounted to `./logs/service-{a,b,c}/` on the host
- **Local Development**: Logs are written to `./logs/` directory

### Log Format
Each log entry includes trace correlation:
```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "info",
  "message": "Processing user request",
  "service": "nodejs-service-a",
  "trace_id": "1234567890abcdef1234567890abcdef",
  "span_id": "1234567890abcdef"
}
```

### Viewing Logs
```bash
# Real-time log monitoring
tail -f logs/service-a/combined.log

# Error logs only
tail -f logs/service-a/error.log

# All services combined (if running locally)
tail -f logs/combined.log
```

## Testing Different Scenarios

The application randomly generates:
- **Success (80%)**: HTTP 200 responses
- **Client Error (10%)**: HTTP 400 responses  
- **Server Error (10%)**: HTTP 500 responses
- **Variable Latency**: 100-2000ms per request

Run multiple requests to see different trace patterns:
```bash
for i in {1..20}; do curl http://localhost:3000/api/users; echo; done
```

## Development

- **Start with hot reload:**
  ```bash
  npm run dev
  ```

- **Install new dependencies:**
  ```bash
  npm install <package-name>
  ```

## Troubleshooting

1. **Services not connecting**: Ensure all services are running and ports are available
2. **No traces in collector**: Check OTEL_EXPORTER_OTLP_ENDPOINT configuration
3. **Missing trace correlation**: Verify OpenTelemetry SDK initialization
4. **Docker issues**: Run `docker-compose down -v` and `docker-compose up --build`
5. **Node.js version**: Ensure Node.js 16+ is installed



