FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 10119

CMD ["node", "index.js"]
