# ---------- ETAPA 1: BUILD ----------
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y generar build
COPY . .
RUN npm run build


# ---------- ETAPA 2: NGINX ----------
FROM nginx:alpine

# 🔥 Eliminar configuración por defecto de nginx
RUN rm -rf /etc/nginx/conf.d/*
RUN rm -rf /usr/share/nginx/html/*

# Copiar build generado
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar nuestra configuración personalizada
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]