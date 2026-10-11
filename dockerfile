# # --- Etapa de construcción (build) ---
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Copiar archivos de dependencias (para cache eficiente)
# COPY package.json package-lock.json ./
# RUN npm ci --silent

# # Copiar el resto de archivos y construir
# COPY . .
# RUN npm run build

# # --- Etapa de producción (serve) ---
# FROM nginx:alpine

# # Configuración personalizada para SPA (React Router)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Copiar los archivos construidos desde la etapa builder
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Variables de entorno (opcional, si las necesitas en runtime)
# ENV VITE_REACT_APP_BASE_URL=http://localhost:5191/api/

# # Exponer puerto 80 (Nginx)
# EXPOSE 80
# EXPOSE 5173
# # Iniciar Nginx
# CMD ["nginx", "-g", "daemon off;"]

# --- Etapa de construcción (build) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias (para cache eficiente)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copiar el resto de archivos y construir
COPY . .
RUN npm run build

# --- Etapa de producción (serve) ---
FROM node:18-alpine

WORKDIR /app

# Instalar 'serve' globalmente para servir archivos estáticos
RUN npm install -g serve

# Copiar los archivos construidos desde la etapa builder
COPY --from=builder /app/dist ./dist

# Variable de entorno para la API (ajusta la URL según tu backend)
ENV VITE_REACT_APP_BASE_URL=http://tu-api.com/api/

# Exponer solo el puerto del frontend (5173 por defecto en Vite)
EXPOSE 5173

# Iniciar el servidor (--single para SPA como React Router)
CMD ["serve", "-s", "dist", "-l", "5173"]
