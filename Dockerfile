FROM node:14.15.0

RUN npm install jsvu -g
RUN /usr/local/bin/jsvu --os=linux64 --engines="spidermonkey,v8,javascriptcore"

ARG FOLDER=jsenco
RUN mkdir -p /${FOLDER}
RUN mkdir -p /${FOLDER}/test_chamber
RUN mkdir -p /${FOLDER}/tests
RUN mkdir -p /${FOLDER}/results

WORKDIR /${FOLDER}

COPY ./core /${FOLDER}/core
COPY ./server /${FOLDER}/server
COPY ./results /${FOLDER}/results
COPY ./benchmark.js /${FOLDER}/benchmark.js
COPY ./index.js /${FOLDER}/index.js
COPY ./package.json /${FOLDER}/package.json

WORKDIR /${FOLDER}
RUN npm install

ENV PORT 3333
EXPOSE 3333

ENTRYPOINT ["node", "index.js"]