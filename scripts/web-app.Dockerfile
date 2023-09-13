FROM node:16-alpine
ARG environment

WORKDIR /app

COPY ./package.json .
COPY ./packages/chrome-ext-shared /app/packages/chrome-ext-shared
COPY ./packages/web-app /app/packages/web-app

RUN yarn
RUN cd ./packages/chrome-ext-shared && yarn build
RUN cd ./packages/web-app && yarn build

COPY .env.${environment} .env.production

RUN apk add --no-cache git

ENV NODE_ENV production

CMD [ "yarn", "start:web-app" ]
