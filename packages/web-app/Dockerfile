FROM node:16-alpine

WORKDIR /app

COPY . .

RUN run yarn

RUN yarn build

ENV NODE_ENV production

CMD [ "yarn start" ]
