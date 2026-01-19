FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

# Create data directory for volume
RUN mkdir -p /app/data

CMD ["node", "server.js"]
