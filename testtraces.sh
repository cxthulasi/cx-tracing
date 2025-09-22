#!/bin/bash

for i in {1..20}; do
  curl http://localhost:3000/api/users
  curl http://localhost:3001/api/profiles
  curl http://localhost:3002/api/settings
  echo
done
