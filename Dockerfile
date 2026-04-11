FROM node:20-alpine AS builder

ARG VITE_POCKETBASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./

EXPOSE 4173

CMD ["npm", "run", "preview"]
