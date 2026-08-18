# syntax = docker/dockerfile:1
#
# Build context must be the NORDYAN repository root so that
# services/coach-language and shared/coach-language are both available.
#
# Deploy from repo root:
#   fly deploy . --config services/coach-language/fly.toml

ARG NODE_VERSION=24.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules from the service package manifests
COPY services/coach-language/package-lock.json services/coach-language/package.json ./services/coach-language/
WORKDIR /app/services/coach-language
RUN npm ci

# Application source (does not replace node_modules from npm ci)
COPY services/coach-language/src ./src
COPY services/coach-language/tsconfig.json ./tsconfig.json

# Shared contracts at the path expected by existing relative imports:
#   services/coach-language/src → ../../../shared/coach-language
#   services/coach-language/src/routes → ../../../../shared/coach-language
WORKDIR /app
COPY shared/coach-language ./shared/coach-language


# Final stage for app image
FROM base

COPY --from=build /app /app

WORKDIR /app/services/coach-language

EXPOSE 8788
CMD [ "npm", "run", "start" ]
