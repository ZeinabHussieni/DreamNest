FROM node:20-alpine AS base
WORKDIR /app


RUN apk add --no-cache bash libc6-compat openssl


COPY package.json package-lock.json ./
RUN npm ci


COPY . .


RUN npx prisma generate || true
RUN npm run build


FROM node:20-alpine AS prod
WORKDIR /app
RUN apk add --no-cache bash libc6-compat openssl

ENV NODE_ENV=production

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/package-lock.json ./package-lock.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma

EXPOSE 3000


ENV HOST=0.0.0.0


CMD sh -c "npx prisma migrate deploy && node dist/main.js"


