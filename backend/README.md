## mysomeid backend and test tools

## Building a docker image

There is a [Dockerfile](./scripts/build.Dockerfile). This builds an image with
the server binary called `mysomeid-backend` installed in `/usr/local/bin` inside
the image.

The image can be built with
```
docker build \
    --build-arg build_image=rust:1.67-buster\
    --build-arg base_image=debian:buster\
    -f backend/scripts/build.Dockerfile -t mysomeid:latest .
```
running from the repository root.
