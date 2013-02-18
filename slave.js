importScripts('wrapper.js');

new WorkerWrapper()
    .addMessageHandler(function (message) {
        if (message.func) {
            message.reply({
                result: new Function('return ' + message.func)().apply(this, message.args)
            });
        } else {
            if (message.vars) {
                Object.getOwnPropertyNames(message.vars).forEach(function (varName) {
                    self[varName] = message.vars[varName];
                });
            } else {
                if (message.scripts) {
                    importScripts.apply(self, message.scripts);
                }
            }
        }
    });
