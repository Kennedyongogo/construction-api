FROM node:lts-slim

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --silent

# Install pm2 globally
RUN npm install -g pm2

# Copy the rest of the application
COPY . ./

EXPOSE 4000

# Use PM2 to run the app in production mode
CMD ["pm2-runtime", "src/server.js", "-i", "max"]
