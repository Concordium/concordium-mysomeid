FROM node:16-alpine
ARG environment

WORKDIR /app

COPY . .

COPY .env.${environment} .env.production

RUN apk add --no-cache git

RUN yarn

RUN yarn build

ENV NODE_ENV production

CMD [ "yarn", "start" ]
