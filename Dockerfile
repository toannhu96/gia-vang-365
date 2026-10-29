FROM node:20-alpine

# Create app directory
WORKDIR /app

# Prisma 5 only looks for libssl in /lib. Alpine 3.21+ ships it in /usr/lib,
# so detection falls back to openssl-1.1.x and the query engine crashes (P5010).
RUN apk add --no-cache make curl openssl \
  && if [ -e /usr/lib/libssl.so.3 ] && [ ! -e /lib/libssl.so.3 ]; then ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3; fi \
  && if [ -e /usr/lib/libcrypto.so.3 ] && [ ! -e /lib/libcrypto.so.3 ]; then ln -s /usr/lib/libcrypto.so.3 /lib/libcrypto.so.3; fi

COPY package.json .
COPY yarn.lock .

ADD prisma/schema.prisma prisma/schema.prisma
RUN corepack enable
RUN yarn

COPY . .
RUN yarn build

HEALTHCHECK --interval=30s --timeout=30s --retries=5 --start-period=30s CMD curl -f http://localhost:3000/ || exit 1

EXPOSE 3000

CMD [ "yarn", "start" ]