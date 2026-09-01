# UZA Mobility — staff panel.
#
# Three stages so the runtime image carries the server and its traced dependencies, and
# neither the source nor the full node_modules.
#
# NEXT_PUBLIC_* values are inlined by Next at BUILD time, not read at runtime. They are
# therefore build arguments, and a different environment means a different image — which
# is also what makes the image reproducible. Nothing secret belongs in them: anything
# bundled into a browser application is public by definition.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://api:7000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1

# next/font downloads the typeface at build time to self-host it, and does NOT fail the
# build when it cannot. A runner without egress to fonts.googleapis.com produces a green
# build in a fallback font. If this image is built air-gapped, vendor the font first.
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001

# Do not run as root. A compromised render path should not own the container.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs

EXPOSE 3001
CMD ["node", "server.js"]
