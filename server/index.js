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

let httpServer = null;

const handle404Response = (response, err) => {
    console.error(err);
    response.statusCode = 404;
    return response.end('Nothing here...');
};

const handleResponse = (response, data, contentType) => {
    response.setHeader('Content-Type', contentType);
    response.end(data);
};

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
    
        handleResponse(response, data, contentType);
    }
};

const getUrlSegments = request => 
    request.url !== '/' 
        ? request.url.split('/')
        : [];

const serveGetRequest = (request, response) => {
    const urlSegments = getUrlSegments(request);

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
                    handleResponse(response, JSON.stringify(files), MEDIA_TYPES.JSON);
                }
              });
        }; break;
        default: {
            fs.readFile(`${CONTENT_FOLDER}${request.url}`, handleFileResponse(request.url, response))
        }
    }
};

const servePostRequest = (request, response) => {
    switch(request.url) {
        case '/stop': {
            const message = 'Server is shutting down...';
            handleResponse(response, JSON.stringify({message}), MEDIA_TYPES.JSON);
            setTimeout(() => {
                httpServer.close(() => {
                    console.log(message);
                    process.exit(0);
                });
            }, 5000);
        } break;
        default: 
            handle404Response(response, `No handler for ${request.url}`);
    }
};

httpServer = http.createServer((request, response) => {
    switch(request.method) {
        case 'GET': {
            serveGetRequest(request, response);
        }; break;
        case 'POST': {
            servePostRequest(request, response);
        }
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