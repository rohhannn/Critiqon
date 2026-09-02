FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
COPY package*.json ./
RUN npm ci
COPY . .
RUN printf 'VITE_API_URL=%s\nVITE_GOOGLE_CLIENT_ID=%s\n' "$VITE_API_URL" "$VITE_GOOGLE_CLIENT_ID" > .env.production && npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
