var flock = require('flockos');

flock.setAppId('818016e2-2b8c-4f60-86de-6ad9b7869db9');
flock.setAppSecret('fca31146-278b-450e-9b9d-cf9429bac9e1');

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(flock.validationTokenChecker);

app.post('/events', flock.router);
flock.events.on('client.slashCommand', function (event) {
    store.saveBookmark(event.userId, event.chat, event.text);
    return {
        text: "Saved your bookmark: " + event.text
    }
});

var Mustache = require('mustache');
var template = require('fs').readFileSync('index.mustache.html', 'utf8');
//Mustache.parse(template);
var store = require('./store');
var urlRegex = new RegExp('(http|ftp|https)://([\\w_-]+(?:(?:\\.[\\w_-]+)+))([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?');

app.get('/bookmarks', function (req, res) {
    console.log('request query: ', req.query);
    var userId = res.locals.validationTokenPayload.userId;
    console.log('user id: ', userId);
    var event = JSON.parse(req.query.flockEvent);
    console.log('event: ', event);
    res.set('Content-Type', 'text/html');
    var list = store.listBookmarks(userId, event.chat);
    console.log('list: ', list);
    if (list) {
        list = list.map(function (text) {
            return text.replace(urlRegex, '<a href="$&">$&</a>');
        });
    }
    var body = Mustache.render(template, { list: list, event: event });
    res.send(body);
});

app.listen(8080, function () {
    console.log('Listening on port 8080');
});
