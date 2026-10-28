ARG PLAYWRIGHT_VERSION

# Collects the package.json files apart from the source, so editing source
# never re-runs npm ci below — only changing dependencies does.
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS manifests
WORKDIR /src
COPY . .
RUN mkdir /manifests && find . -name package.json -not -path '*/node_modules/*' -exec cp --parents {} /manifests \;

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble
# pwuser gets the developer's uid/gid, so reports written to the mounted folders are owned by the developer.
ARG HOST_UID
ARG HOST_GID
RUN groupmod -o -g ${HOST_GID} pwuser && usermod -o -u ${HOST_UID} -g ${HOST_GID} pwuser \
  && chown -R pwuser:pwuser /home/pwuser && mkdir /work && chown pwuser:pwuser /work
WORKDIR /work
COPY --chown=pwuser:pwuser --from=manifests /manifests ./
COPY --chown=pwuser:pwuser package-lock.json .npmrc ./
# The image bundles an older Node; replace it with the project's pinned version.
RUN NODE_VERSION=$(node -p "require('./package.json').volta.node") \
  && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" | tar -xz -C /usr/local --strip-components=1
USER pwuser
RUN npm ci --no-audit
COPY --chown=pwuser:pwuser . .

WORKDIR /work/packages/web-forms
ENTRYPOINT ["xvfb-run", "--auto-servernum", "npx", "playwright", "test"]
