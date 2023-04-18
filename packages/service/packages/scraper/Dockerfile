FROM node:18
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
COPY yarn.lock ./
RUN npm install
EXPOSE 3003
CMD [ "yarn", "start" ]
