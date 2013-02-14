/**
 * Creates worker wrapper for given worker or worker that constructor was called from.
 * @param {Worker|String} [worker]
 * @constructor
 */
function WorkerWrapper(worker) {
    if (typeof worker === 'string') {
        worker = new Worker(worker);
    }

    this._worker = worker || self;
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
     * @param {Function} [callback]
     */
    send: function (message, callback) {
        if (callback instanceof Function) {
            var msgHandler = this.addMessageHandler(function (response) {
                if (response.replyTo !== message.id) return;

                this.removeMessageHandler(msgHandler);
                callback.call(this, response);
            });
        }

        message.id = WorkerWrapper.__increment__++;

        this._worker.postMessage(message);
    },

    /**
     * Sends response fpr given message.
     * @param {*} message
     * @param {*} response
     * @param {Function} [callback]
     * @private
     */
    _replyTo: function (message, response, callback) {
        response.replyTo = message.id;
        this.send(response, callback);
    },

    /**
     * Listener wrapper for incoming messages.
     * @param {Function} callback
     * @param {Event} event
     * @private
     */
    _wrappedListener: function (callback, event) {
        var message = event.data;

        message.reply = this._replyTo.bind(this, message);
        callback.call(this, message);
    },

    /**
     * Adds handler for incoming messages and returns wrapped one for later removal.
     * @param {Function} callback
     * @returns {Function}
     */
    addMessageHandler: function (callback) {
        var wrapperListener = this._wrappedListener.bind(this, callback);
        this._worker.addEventListener('message', wrapperListener);
        return wrapperListener;
    },

    /**
     * Removes wrapper message listener that was returned from addMessageHandler.
     * @param {Function} wrapperListener
     */
    removeMessageHandler: function (wrapperListener) {
        this._worker.removeEventListener('message', wrapperListener);
    }
};
