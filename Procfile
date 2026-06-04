vite: vite dev
build: vite build --mode development --watch
nginx: docker run --rm --publish 127.0.0.1:8686:8686 -v "$PWD/nginx-conf":/etc/nginx/ -v "$PWD/.nginx":/etc/nginx/.nginx -v "$PWD/dist":/dist nginx:1.27.4
