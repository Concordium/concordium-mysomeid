ARG build_image
ARG base_image
FROM ${build_image} AS build

WORKDIR /build
COPY backend backend
COPY deps/concordium-rust-sdk deps/concordium-rust-sdk
RUN apt-get update && apt-get -y install libzbar-dev
RUN cargo build --locked --manifest-path backend/Cargo.toml --release

FROM ${base_image}
RUN apt-get update && \
    apt-get -y install ca-certificates libzbar0 && \
    rm -rf /var/lib/apt/lists/*
COPY --from=build /build/backend/target/release/mysomeid-backend /usr/local/bin/
