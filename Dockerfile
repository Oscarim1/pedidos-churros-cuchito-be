# Usa una imagen base oficial de Node.js
FROM node:current

# Instala dependencias de Puppeteer/Chrome
RUN apt-get update && \
apt-get install -y \
wget \
ca-certificates \
fonts-liberation \
libappindicator3-1 \
libasound2 \
libatk-bridge2.0-0 \
libatk1.0-0 \
libcups2 \
libdbus-1-3 \
libgdk-pixbuf2.0-0 \
libnspr4 \
libnss3 \
libx11-xcb1 \
libxcomposite1 \
libxdamage1 \
libxrandr2 \
xdg-utils \
**libgbm1** \
--no-install-recommends && \
rm -rf /var/lib/apt/lists/*

# Crea y usa el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias primero
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto de los archivos de tu proyecto
COPY . .

# Expone el puerto en el que corre tu app (cambia si usas otro)
EXPOSE 3000

# Comando para correr tu app
CMD [ "npm", "run", "dev" ]
