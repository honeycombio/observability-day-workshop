FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=10119
EXPOSE 10119

CMD ["node", "index.js"]
