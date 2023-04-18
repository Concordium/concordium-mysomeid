FROM debian:stable

RUN set -ex; \
    apt-get update; \
    apt-get install -y \
      apt-utils \
      bash \
      fluxbox \
      git \
      net-tools \
      novnc \
      socat \
      supervisor \
      x11vnc \
      xterm \
      xvfb \
      curl \
      procps \
      chromium

ENV HOME=/root \
  DEBIAN_FRONTEND=noninteractive \
  LANG=en_US.UTF-8 \
  LANGUAGE=en_US.UTF-8 \
  LC_ALL=C.UTF-8 \
  DISPLAY=:0.0 \
  DISPLAY_WIDTH=1024 \
  DISPLAY_HEIGHT=768 \
  RUN_XTERM=yes \
  RUN_FLUXBOX=yes

COPY ./pin_nodesource /etc/apt/preferences.d/nodesource
RUN apt-get install -y gpg \
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs gpg \
    && rm -rf /var/lib/apt/lists

RUN npm install yarn --global

COPY ./xvfb-chromium /usr/bin/xvfb-chromium

RUN ln -s /usr/bin/xvfb-chromium /usr/bin/google-chrome
RUN ln -s /usr/bin/xvfb-chromium /usr/bin/chromium-browser

RUN chmod +x /usr/bin/google-chrome
RUN chmod +x /usr/bin/chromium-browser

WORKDIR /usr/src/app

COPY ./certs ./certs
COPY ./extensions ./extensions
COPY ./images ./images
COPY ./*.js .
COPY ./mock-linkedin-pages ./mock-linkedin-pages
COPY ./pin_nodesource .
COPY ./tests ./tests
COPY ./utils ./utils
COPY ./xvfb-chromium .
COPY ./yarn.lock .
COPY ./*.json .

ADD user-data.tar.gz .

RUN yarn add ts-node --global
RUN yarn

