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

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 8091

CMD ["serve", "-s", "dist", "-l", "8091"]
