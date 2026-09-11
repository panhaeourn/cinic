FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
ENV PORT=80
ENV BACKEND_ORIGIN=http://backend:8080
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_ORIGIN)$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
