#!/bin/bash

# Node.js Log Monitoring Script
# Usage: ./scripts/monitor-logs.sh [service] [log-type]
# Examples:
#   ./scripts/monitor-logs.sh service-a combined
#   ./scripts/monitor-logs.sh service-b error
#   ./scripts/monitor-logs.sh all combined

SERVICE=${1:-all}
LOG_TYPE=${2:-combined}

echo "🔍 Monitoring Node.js Application Logs"
echo "Service: $SERVICE | Log Type: $LOG_TYPE"
echo "----------------------------------------"

if [ "$SERVICE" = "all" ]; then
    echo "📊 Monitoring all services..."
    if [ "$LOG_TYPE" = "combined" ]; then
        tail -f logs/service-a/combined.log logs/service-b/combined.log logs/service-c/combined.log
    else
        tail -f logs/service-a/error.log logs/service-b/error.log logs/service-c/error.log
    fi
else
    echo "📊 Monitoring $SERVICE..."
    if [ -f "logs/$SERVICE/$LOG_TYPE.log" ]; then
        tail -f "logs/$SERVICE/$LOG_TYPE.log"
    else
        echo "❌ Log file not found: logs/$SERVICE/$LOG_TYPE.log"
        echo "Available log files:"
        find logs -name "*.log" 2>/dev/null || echo "No log files found. Start the services first."
    fi
fi
