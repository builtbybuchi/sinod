# # Stage 1: build
# FROM node:20 AS builder
# WORKDIR /app

# COPY package*.json ./
# RUN npm install --legacy-peer-deps
# COPY . .
# RUN npm run build

# # Stage 2: serve with Nginx
FROM nginx:alpine

# COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=10  CMD curl -f http://localhost || exit 1
