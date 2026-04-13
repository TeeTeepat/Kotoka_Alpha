FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip postinstall to avoid prisma generate before schema is copied)
RUN npm ci --ignore-scripts

# Copy application files (including prisma schema)
COPY . .

# Generate Prisma client now that schema is available
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
