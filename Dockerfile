FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    curl \
    file \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    patchelf \
  && rm -rf /var/lib/apt/lists/*

# Rust and Bun at fixed versions, each download checked against its SHA-256
# instead of piping an install script into sh. x86_64 only; update the
# versions and hashes together.
ARG RUSTUP_VERSION=1.29.3
ARG RUSTUP_SHA256=b1c8cb14e30889e7e2999e6b69e62d9e9b9ffc0f4df8180564d306d9680e6c55
ARG RUST_VERSION=1.100.0
ARG BUN_VERSION=1.4.5
ARG BUN_SHA256=94559b3b528995a49452f9f2404cec74f2efd7d06e0a000a8cd214b02c3666eb

RUN apt-get update && apt-get install -y --no-install-recommends unzip ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -fsSLo /tmp/rustup-init \
    "https://static.rust-lang.org/rustup/archive/${RUSTUP_VERSION}/x86_64-unknown-linux-gnu/rustup-init" \
  && echo "${RUSTUP_SHA256}  /tmp/rustup-init" | sha256sum -c - \
  && chmod +x /tmp/rustup-init \
  && /tmp/rustup-init -y --default-toolchain "${RUST_VERSION}" --profile minimal \
  && rm /tmp/rustup-init
ENV PATH="/root/.cargo/bin:${PATH}"

RUN curl --proto '=https' --tlsv1.2 -fsSLo /tmp/bun.zip \
    "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64.zip" \
  && echo "${BUN_SHA256}  /tmp/bun.zip" | sha256sum -c - \
  && unzip -q /tmp/bun.zip -d /tmp \
  && install -Dm755 /tmp/bun-linux-x64/bun /root/.bun/bin/bun \
  && rm -rf /tmp/bun.zip /tmp/bun-linux-x64
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app
CMD ["/bin/bash"]
