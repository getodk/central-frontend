vite: vite dev
build: vite build --mode development --watch
nginx-host: nginx -c "$PWD/nginx-conf/main.conf" -p "$PWD"
nginx-docker: docker run --rm --network=host -v $PWD/nginx-conf:/etc/nginx/ -v $PWD/dist:/dist nginx:1.27.4
