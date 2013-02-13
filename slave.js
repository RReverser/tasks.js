onmessage = function (event) {
    var message = event.data,
        id = message.id,
        func = new Function('return ' + message.func)();

    postMessage({
        replyTo: id,
        result: func()
    });
};
