FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/ dist/
EXPOSE 3334
CMD ["node", "dist/services/authService.js"]
