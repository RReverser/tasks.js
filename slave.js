importScripts('wrapper.js');

new WorkerWrapper()
    .addMessageHandler(function (message) {
        if (message.func) {
            message.reply({
                result: new Function('return ' + message.func)().call(this)
            });
        } else {
            if (message.vars) {
                Object.getOwnPropertyNames(message.vars).forEach(function (varName) {
                    this[varName] = message.vars[varName];
                });
            }
        }
    });
