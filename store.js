var chats = {};

var conversationId = function (userId, chat) {
    if (chat.startsWith('u:') || chat.startsWith('b:')) {
        return [userId, chat].sort().join('|');
    } else {
        return chat;
    }
}

exports.save = function (userId, chat, text) {
    var cid = conversationId(userId, chat);
    if (!chats[cid]) {
        chats[cid] = [text];
    } else {
        chats[cid].push(text);
    }
};

exports.list = function (userId, chat) {
    return chats[conversationId(userId, chat)];
};
