# Usa una imagen base oficial de Node.js
FROM node:current

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
