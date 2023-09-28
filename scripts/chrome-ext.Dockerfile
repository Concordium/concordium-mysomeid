FROM node:16-alpine
ARG environment

WORKDIR /app

COPY ./package.json .
COPY ./yarn.lock .
COPY ./packages/chrome-ext-shared /app/packages/chrome-ext-shared
COPY ./packages/chrome-ext /app/packages/chrome-ext

RUN yarn
RUN cd ./packages/chrome-ext-shared && yarn build
RUN cd ./packages/chrome-ext && yarn build
COPY .env.${environment} .env.production

RUN apk add --no-cache git

ENV NODE_ENV production

# CMD [ "yarn", "start:web-app" ]
