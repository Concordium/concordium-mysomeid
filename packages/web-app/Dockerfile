FROM node:16-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache git

RUN yarn

RUN yarn build

ENV NODE_ENV production

CMD [ "yarn", "start" ]
