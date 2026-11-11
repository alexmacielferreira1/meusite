# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS ui
WORKDIR /build
COPY frontend/package*.json ./
RUN --mount=type=cache,id=meusite-npm,target=/root/.npm npm ci
COPY frontend/ ./
RUN VITE_API_URL=. npm run build
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
COPY backend/ ./backend/
RUN --mount=type=cache,id=meusite-pip,target=/root/.cache/pip pip install -r requirements.txt
COPY run.py main.py ./
COPY --from=ui /build/dist /app/frontend/dist
ENV PYTHONUNBUFFERED=1 PORT=8000 FRONTEND_DIST=/app/frontend/dist
RUN useradd -m -u 10001 meusite && chown -R meusite /app
USER meusite
EXPOSE 8000
CMD ["python", "main.py"]
