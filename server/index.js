const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;
const CONTENT_FOLDER = `${process.cwd()}/results`;
const MEDIA_TYPES = {
    HTML: 'text/html',
    CSS: 'text/css',
    JS: 'application/javascript',
    JSON: 'application/json',
    ZIP: 'application/zip',
    JPG: 'image/jpeg',
};

const handle404Response = (response, err) => {
    console.error(err);
    response.statusCode = 404;
    return response.end('Nothing here...');
} 

const handleFileResponse = (filePath, response, mediaType = null) => (err, data) => {
    if(err) {
        handle404Response(response, err);
    } else {
        let contentType;
        if(mediaType) {
            contentType = mediaType;
        } else {
            const ext = path.extname(filePath);
            const type = ext && ext.length ? ext.slice(1).toUpperCase() : null;
            if (type && MEDIA_TYPES.hasOwnProperty(type)) {
                contentType = MEDIA_TYPES[type];
            }
        }
    
        response.setHeader('Content-Type', contentType);
        response.end(data);
    }
};

const serveGetRequest = (request, response) => {
    const urlSegments = request.url !== '/' 
        ? request.url.split('/')
        : [];

    switch(request.url) {
        case '/': {
            const filePath = '/index.html';
            fs.readFile(`${CONTENT_FOLDER}${filePath}`, handleFileResponse(filePath, response))
        }; break
        case '/results': {
            fs.readdir(`${CONTENT_FOLDER}/data/`, (err, files) => {
                if(err) {
                    handle404Response(response, err);
                } else {
                    response.setHeader('Content-Type', MEDIA_TYPES.JSON);
                    response.end(JSON.stringify(files));
                }
              });
        }; break;
        default: {
            fs.readFile(`${CONTENT_FOLDER}${request.url}`, handleFileResponse(request.url, response))
        }
    }
};

const httpServer = http.createServer((request, response) => {
    console.log(request.method + ' ' + request.url);
    switch(request.method) {
        case 'GET': {
            serveGetRequest(request, response);
        }; break;
    }
});

httpServer.on('clientError', function onClientError(err, socket) {
    console.log('clientError', err)
    socket.end('HTTP/1.1 400 Bad Request\n')
});
  
httpServer.listen(PORT, function() {
    console.log(`📊 See results at http://localhost:${PORT}.`)
});

module.exports = {
    httpServer,
};