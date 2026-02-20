# =========================
# Etapa 1: Build
# =========================
FROM node:20-alpine AS build


WORKDIR /app

# Copiar dependencias primero (mejor cache)
COPY package*.json ./
RUN npm install

# Copiar resto del proyecto
COPY . .

# Construir proyecto
RUN npm run build

# =========================
# Etapa 2: Producción
# =========================
FROM nginx:alpine

# Eliminar config default de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build generado por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]