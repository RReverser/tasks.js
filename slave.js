onmessage = function (event) {
    var message = event.data,
        id = message.id;

    if (message.func) {
        postMessage({
            replyTo: id,
            result: new Function('return ' + message.func)()()
        });
    } else {
        if (message.vars) {
            Object.getOwnPropertyNames(message.vars).forEach(function (varName) {
                self[varName] = message.vars[varName];
            });
        }
    }
};
