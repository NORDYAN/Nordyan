# syntax = docker/dockerfile:1
#
# Build context must be the NORDYAN repository root.
#
# Deploy from repo root:
#   fly deploy . --config services/account/fly.toml

ARG NODE_VERSION=24.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV="production"

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY services/account/package-lock.json services/account/package.json ./services/account/
WORKDIR /app/services/account
RUN npm ci

COPY services/account/src ./src
COPY services/account/tsconfig.json ./tsconfig.json

FROM base

COPY --from=build /app /app

WORKDIR /app/services/account

EXPOSE 8789
CMD [ "npm", "run", "start" ]
