FROM node:20-alpine

# Create app directory
WORKDIR /app

RUN apk add make curl && rm -rf /var/cache/apk/*

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