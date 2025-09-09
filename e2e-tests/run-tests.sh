#!/bin/bash -eu

log() {
  echo "[e2e-tester] $*"
}

# default values
ODK_DOMAIN="central-dev.localhost"
ODK_PORT="8989"
ODK_PROTOCOL="http://"
ODK_USER="alice@example.com"
ODK_PASSWORD="Testpassword@12345"

show_help() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --domain=DOMAIN     Set the domain (default: $ODK_DOMAIN)
  --port=PORT         Set the port (default: $ODK_PORT)
  --protocol=PROTOCOL Set the protocol (default: $ODK_PROTOCOL)
  --user=USER         Set the protocol (default: $ODK_USER)
  --password=PASSWORD Set the protocol (default: $ODK_PASSWORD)
  --ui                Pass --ui option to playwright
  --help              Show this help message and exit
EOF
}

# parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain=*) ODK_DOMAIN="${1#*=}"; shift ;;
    --port=*) ODK_PORT="${1#*=}"; shift ;;
    --protocol=*) ODK_PROTOCOL="${1#*=}"; shift ;;
    --user=*) ODK_USER="${1#*=}"; shift ;;
    --password=*) ODK_PASSWORD="${1#*=}"; shift ;;
    --ui) PLAYWRIGHT_UI=true; shift ;;
    --help) show_help; exit 0 ;;
    *) echo "Unknown option: $1"; show_help; exit 1 ;;
  esac
done

export ODK_DOMAIN
export ODK_PORT
export ODK_PROTOCOL
export ODK_USER
export ODK_PASSWORD
if [ "$ODK_PORT" = "80" ]; then
  export ODK_URL="${ODK_PROTOCOL}${ODK_DOMAIN}"
else
  export ODK_URL="${ODK_PROTOCOL}${ODK_DOMAIN}:$ODK_PORT"
fi

export PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1
if [[ ${CI-} = true ]]; then
  log "Installing apt dependencies..."
  sudo apt-get install -y wait-for-it

  log "Waiting for ODK Central to start..."
  wait-for-it $ODK_DOMAIN:$ODK_PORT --strict --timeout=60 -- echo '[e2e-tester] odk-central is UP!'

  log "Creating test users..."
  docker compose exec service bash -c "echo $ODK_PASSWORD | node lib/bin/cli.js --email $ODK_USER user-create"
  docker compose exec service node lib/bin/cli.js --email $ODK_USER user-promote
  log "Test user created."
  cd client
fi

log "Installing npm packages..."
npm ci

cd e2e-tests
log "Playwright: $(npx playwright --version)"

log "Installing playwright deps..."
npx playwright install --with-deps

log "Running playwright tests..."
npx playwright test ${PLAYWRIGHT_UI:+--ui}

log "Tests completed OK!"
