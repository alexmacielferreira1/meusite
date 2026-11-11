# syntax=docker/dockerfile:1.6
# Frontend (dev) — mesmo padrão da Base SaaS V1 com cache compartilhado do npm (ADR-006).
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-global-cache,target=/root/.npm npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
