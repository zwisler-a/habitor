FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CORS_ORIGIN=http://localhost:3000
ENV SQLITE_PATH=/app/data/habitor.sqlite

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/web/dist/web/browser ./api/public/web

EXPOSE 3000

CMD ["node", "api/dist/main.js"]
