/**
 * @param {Worker} worker
 * @constructor
 */
function WorkerWrapper(worker) {
    this._worker = worker;
}

/**
 * Inner auto-increment.
 * @type {Number}
 * @private
 * @static
 */
WorkerWrapper.__increment__ = 0;

WorkerWrapper.prototype = {
    /**
     * Worker object
     * @type {Worker}
     * @private
     */
    _worker: undefined,

    /**
     * Sends message with optional response callback.
     * @param {*} message
     * @param {Function} callback
     */
    send: function (message, callback) {
        var wrapper = this;

        function responseHandler(event) {
            var response = event.data;

            if (response.replyTo === message.id) {
                this.removeEventListener('message', responseHandler);

                response.reply = function (nextResponse, nextCallback) {
                    nextResponse.replyTo = response.id;
                    wrapper.send(nextResponse, nextCallback);
                };

                callback.call(wrapper, response);
            }
        }

        this._worker.addEventListener('message', responseHandler);

        message.id = WorkerWrapper.__increment__++;
        this._worker.postMessage(message);
    }
};
