# Stage: Node dev server
FROM node:20-alpine AS dev

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept backend URL from docker-compose or .env
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV FRONTEND_PORT=5173

EXPOSE 5173

# Run Vite dev server (accessible from Codespaces)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
