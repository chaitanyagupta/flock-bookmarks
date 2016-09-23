var id = '93df590f-1a6d-4012-b0d6-3c10af353514';
var secret = '55a70e7a-4374-42fc-b705-fd0fe1811d5a';

var crypto = require('crypto');

// FIXME:
//   1. Doesn't do constant time comparison of signatures
//   2. Doesn't verify expiry
//   3. Check that the app id is ours
var verifyValidationToken = function (token, secret) {
    var constEqual = function (b1, b2) {
        return Buffer.compare(b1, b2) === 0;
    }
    var parts = token.split('.');
    var jwsPayload = parts.slice(0, 2).join('.');
    var hmac = crypto.createHmac('sha256', secret);
    hmac.update(jwsPayload);
    var signature = hmac.digest();
    var tokenSignature = new Buffer(parts[2], 'base64');
    if (!constEqual(signature, tokenSignature)) {
        return null;
    } else {
        return JSON.parse(new Buffer(parts[1], 'base64'));
    }
}

var express = require('express');
var bodyParser = require('body-parser');
var EventEmitter = require('events');

var app = express();
var eventListener = new EventEmitter();

app.use(bodyParser.json());

app.post('/events', function (request, response) {
    console.log('received request: ', request.method, request.url, request.headers);

    var validationToken = request.headers['x-flock-validation-token'];
    var decodedToken = verifyValidationToken(validationToken, secret);
    console.log('decoded token: ', decodedToken);
    if (!decodedToken) {
        console.log('Invalidation validation token');
        response.status(400).send();
    } else {
        console.log('request body: %j', request.body);
        eventListener.emit(request.body.name, request.body, decodedToken.userId, request, response);
    }
});

var Mustache = require('mustache');
var template = require('fs').readFileSync('index.mustache.html', 'utf8');
//Mustache.parse(template);
var store = require('./store');
var urlRegex = new RegExp('(http|ftp|https)://([\\w_-]+(?:(?:\\.[\\w_-]+)+))([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?');

app.get('/bookmarks', function (request, response) {
    console.log('request query: ', request.query);
    var event = JSON.parse(request.query.flockEvent);
    console.log('event: ', event);
    var validationToken = request.query.flockValidationToken;
    var decodedToken = verifyValidationToken(validationToken, secret);
    console.log('decoded token: ', decodedToken);
    response.set('Content-Type', 'text/html');
    var list = store.listBookmarks(decodedToken.userId, event.chat);
    console.log('list: ', list);
    if (list) {
        list = list.map(function (text) {
            return text.replace(urlRegex, '<a href="$&">$&</a>');
        });
    }
    var body = Mustache.render(template, { list: list, event: event });
    response.send(body);
});

eventListener.on('app.install', function (payload, userId, request, response) {
    //store.saveUserToken(userId, payload.userToken);
    response.send();
});

var request = require('request');
var apiEndpoint = 'https://api.flock-staging.co/v1/chat.sendMessage';

eventListener.on('client.slashCommand', function (payload, userId, request, response) {
    store.saveBookmark(userId, payload.chat, payload.text);
    /*
    request.post({
        url: apiEndpoint,
        headers: {
            'X-Flock-User-Token': store.getUserToken(userId);
        },
        body { text: 'Bookmark added: ' + payload.text }
    }).on('response', function (response) {
        console.log(response.statusCode);
        console.log(response.headers['content-type']);
    });
    */
});

app.listen(8080, function () {
    console.log('Listening on port 8080');
});
