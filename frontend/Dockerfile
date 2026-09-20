FROM node:20-alpine

WORKDIR /app

# Copia pacotes primeiro para otimizar cache de build
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Dispara o Vite escutando conexões externas ao container
CMD ["npm", "run", "dev", "--", "--host"]
