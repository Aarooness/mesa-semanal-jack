FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs platform-api.mjs shopping-search.mjs ./
COPY public ./public
RUN mkdir /data && chown node:node /data
ENV HOST=0.0.0.0 PORT=8734 DATA_DIR=/data
USER node
EXPOSE 8734
CMD ["node","server.mjs"]
