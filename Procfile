vite: vite dev
build: vite build --mode development --watch
nginx-host: nginx -g "daemon off;" -c "$PWD/nginx-conf/nginx.conf" -p "$PWD"
nginx-docker: docker run --rm --network=host -v "$PWD/nginx-conf":/etc/nginx/ -v "$PWD/.nginx":/etc/nginx/.nginx -v "$PWD/dist":/dist nginx:1.27.4
