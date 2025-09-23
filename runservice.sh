#!/bin/bash

# generate script to clone this project, install and other steps

# make sure you have git installed and authenticated

git clone https://github.com/cxthulasi/cx-tracing.git &&

cd cx-tracing

export OTEL_TRACES_EXPORTER="otlp"
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
export OTEL_EXPORTER_OTLP_COMPRESSION="gzip"
export OTEL_RESOURCE_ATTRIBUTES="cx.application.name=sampleapp, cx.subsystem.name=samplesubapp, service.namespace=samplens"
export OTEL_NODE_RESOURCE_DETECTORS="all"

chmod +x runservice.sh testtraces.sh &&

npm install &&

npm start


