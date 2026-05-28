# --- Builder: install dev deps and build Vite app ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
# install including devDependencies for build
RUN npm install || npm install
COPY . .
RUN npm run build

# --- Runtime: only prod deps, serve built assets with Express ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
# install only production deps for smaller image
RUN npm install --omit=dev || npm install --omit=dev
# copy server and built client
COPY --from=builder /app/dist ./dist
COPY index.js ./index.js
EXPOSE 3000
CMD ["node", "index.js"]

