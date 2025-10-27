# Simple static site served by nginx
FROM nginx:stable-alpine
COPY . /usr/share/nginx/html
EXPOSE 80
