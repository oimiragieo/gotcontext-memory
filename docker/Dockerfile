# Claude Code CLI + gotcontext-memory dogfood environment.
# Build/run from Windows PowerShell (Docker Desktop). See scripts/docker-verify.ps1.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git bash \
  && rm -rf /var/lib/apt/lists/*

# Claude Code CLI (npm ships the native binary for linux).
# Pin via build-arg so rebuilds are reproducible when desired.
ARG CLAUDE_CODE_VERSION=latest
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
  && claude --version

# Isolated dogfood user (non-root).
RUN useradd -m -u 10001 -s /bin/bash dogfood
USER dogfood
WORKDIR /home/dogfood/gotcontext-memory
ENV HOME=/home/dogfood \
  PATH="/home/dogfood/.npm-global/bin:/usr/local/bin:${PATH}" \
  NPM_CONFIG_PREFIX=/home/dogfood/.npm-global

RUN mkdir -p /home/dogfood/.npm-global \
  && npm config set prefix /home/dogfood/.npm-global

# Package sources are copied at build time; verify script also supports bind-mount override.
COPY --chown=dogfood:dogfood package.json package-lock.json tsconfig.json vitest.config.ts biome.json ./
COPY --chown=dogfood:dogfood src ./src
COPY --chown=dogfood:dogfood test ./test
COPY --chown=dogfood:dogfood docker/verify.sh ./docker/verify.sh

RUN npm ci \
  && npm run build \
  && npm install -g . \
  && chmod +x docker/verify.sh \
  && gotcontext-memory --help >/dev/null \
  && head -n1 "$(command -v gotcontext-memory)" | grep -q 'node'

WORKDIR /home/dogfood/workspace
ENTRYPOINT ["/bin/bash", "/home/dogfood/gotcontext-memory/docker/verify.sh"]
