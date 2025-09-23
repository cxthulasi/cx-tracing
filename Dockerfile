FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY app.js .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3000 3001 3002

CMD ["npm", "start"]
