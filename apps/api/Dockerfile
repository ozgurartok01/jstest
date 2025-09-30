FROM node:20-alpine AS install
WORKDIR /app
COPY . .
RUN npm install

FROM node:20-alpine AS run
WORKDIR /app
COPY --from=install /app .
EXPOSE 3000

ENTRYPOINT ["npm"]