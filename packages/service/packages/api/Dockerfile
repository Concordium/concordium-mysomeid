FROM rust:1.62 AS builder
WORKDIR /verify-cmd
COPY ./verify-cmd/deps/concordium-rust-sdk ./deps/concordium-rust-sdk
COPY ./verify-cmd/src ./src
COPY ./verify-cmd/Cargo.lock ./Cargo.lock
COPY ./verify-cmd/Cargo.toml ./Cargo.toml
RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v3.15.3/protoc-3.15.3-linux-x86_64.zip \
      && unzip protoc-3.15.3-linux-x86_64.zip \
      && mv ./bin/protoc /usr/bin/protoc \
      && chmod +x /usr/bin/protoc
RUN cargo build --release

FROM ubuntu:22.04

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt update -y && apt upgrade -y
RUN apt install -y curl gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt install -y nodejs 
RUN apt install -y yarn
# RUN npm install yarn --global
RUN apt install -y zbar-tools

WORKDIR /app
COPY --from=builder --chmod=0755 /verify-cmd/target/release/verify /app
COPY package*.json /app
COPY yarn.lock /app
RUN yarn 
RUN yarn add ts-node
COPY src src/
COPY images images/
COPY tsconfig.json /app
COPY mysomeid.schema.bin /app
ENV NODE_ENV production
ENV PORT 8080
EXPOSE 8080
CMD ["yarn", "start"]




