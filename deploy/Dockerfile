# ==============================================================================
# TradeOS AI - Multi-Stage Production Dockerfile for AWS EC2/ECS Deployment
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pm2 && apk add --no-cache curl

RUN addgroup -S tradeos && adduser -S tradeos -G tradeos

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/ecosystem.config.cjs ./ecosystem.config.cjs

RUN npm install --only=production && npm cache clean --force

RUN mkdir -p /app/data && chown -R tradeos:tradeos /app

USER tradeos

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/system/metrics || exit 1

CMD ["pm2-runtime", "ecosystem.config.cjs"]
