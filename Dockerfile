FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY vue.config.js ./

COPY *.json ./

RUN npm install

COPY ./src ./src
COPY ./public ./public 
COPY ./bin ./bin 
COPY ./docs ./docs
COPY ./.tx ./.tx
COPY ./transifex ./transifex

RUN npm run build

FROM nginx:alpine
RUN mkdir -p /var/tmp/nginx/client_body_temp /var/tmp/nginx/proxy_temp
COPY ./dev.nginx.conf /etc/nginx/nginx.conf
COPY ./common-headers.nginx.conf /etc/nginx/conf.d/common-headers.nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html 

EXPOSE 8989
CMD ["nginx", "-g", "daemon off;"]
