# provenance.fm frontend — place at:  frontend/Dockerfile
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
# Vite dev server, reachable from outside the container:
CMD ["npm", "run", "dev", "--", "--host"]
