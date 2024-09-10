FROM node:21-alpine3.18 as builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY .npmrc ./
COPY src ./src
COPY tools ./tools
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile && pnpm run build

FROM node:21-alpine3.18

WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pm2 pnpm
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/build ./build

EXPOSE 4002

CMD [ "npm", "run", "start" ]
