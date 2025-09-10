FROM node:20-alpine


RUN apk add --no-cache bash

WORKDIR /app


COPY package.json package-lock.json ./
RUN npm ci


COPY . .


ENV HOST=0.0.0.0
ENV PORT=3001
ENV CI=false
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3001

CMD ["npm", "start"]


