FROM node:22-alpine

RUN apk add --no-cache git python3 make g++

WORKDIR /app
COPY main.js package.json ./
RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "main.js"]
