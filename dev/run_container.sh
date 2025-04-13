#!/bin/bash
set -euo pipefail

PORTAINER_DATA=${PORTAINER_DATA:-/tmp/portainer}
PORTAINER_FLAGS=${PORTAINER_FLAGS:-}

# Stop and remove any existing container
  docker rm -f portainer || true

docker run -d \
  --name portainer \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp/portainer:/data \
  local-server


