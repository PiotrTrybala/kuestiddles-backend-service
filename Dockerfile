FROM oven/bun:1 AS base
WORKDIR /usr/app

FROM base AS install
RUN mkdir -p /tmp/prod
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --production

FROM base AS prerelease
COPY --from=install /tmp/prod/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=install /tmp/prod/node_modules node_modules
COPY --from=prerelease /usr/app/dist ./dist
COPY --from=prerelease /usr/app/package.json .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "./dist/index.js"]