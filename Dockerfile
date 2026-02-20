# Etapa 1: build
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar todo el proyecto
COPY . .

# Build producción (genera carpeta dist)
RUN npm run build

# Etapa 2: servidor
FROM nginx:alpine

# Quitar contenido default de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]