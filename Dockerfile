FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Set environment variable and run migrations
ENV DATABASE_URL=./sqlite.db
RUN npx drizzle-kit push

EXPOSE 3000

CMD ["node", "dist/index.js"]
