vue: echo "{\"oidcEnabled\":${VUE_APP_OIDC_ENABLED-false}}" >./public/client-config.json && vue-cli-service build --mode development --watch
nginx: docker run --rm --network=host -v $PWD/nginx-conf:/etc/nginx/:ro -v $PWD/dist:/odk-central-frontend/dist nginx
