# Beasiswa Self-Hosted — Dockerfile
# Build:  docker build -t beasiswa-selfhosted .
# Run:    docker run -d -p 4321:4321 --env-file .env -v $(pwd)/data:/app/data beasiswa-selfhosted

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
# data di-mount sebagai volume (persist SQLite)
VOLUME ["/app/data"]
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
