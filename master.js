/**
 * Task scheduler
 * @param {Number} slavesNumber
 * @constructor
 */
function Scheduler(slavesNumber) {
    this.tasks = [];
    this.workers = [];
    for (var i = 0; i < slavesNumber; i++) {
        this.workers.push(new WorkerWrapper(new Worker('slave.js')));
    }
    this.freeWorkers = this.workers.slice();
}

Scheduler.prototype = {
    flush: function () {
        while (this.tasks.length && this.freeWorkers.length) {
            this.tasks.shift().sendTo(this.freeWorkers.pop());
        }
    },

    schedule: function (task) {
        this.tasks.push(task);
    },

    setVar: function (name, value, exactWorker) {
        var vars = {};
        vars[name] = value;
        this.setVars(vars, exactWorker);
    },

    setVars: function (vars, exactWorker) {
        var workers = exactWorker ? [exactWorker] : this.workers;

        workers.forEach(function (worker) {
            worker.send({
                vars: vars
            });
        });
    },

    execute: function (task) {
        this.schedule(task);
        this.flush();
    },

    executeMany: function (funcs, callback) {
        var scheduler = this,
            results,
            leftCount;

        function innerCallback(result, worker) {
            // console.log(this.id, result, results, results.length, scheduler.freeWorkers.length);
            results[this.id] = result;
            if (--leftCount === 0) {
                callback.call(scheduler, results);
            }
            scheduler.freeWorkers.push(worker);
            scheduler.flush();
        }

        if (funcs instanceof Array) {
            results = new Array(funcs.length);
            leftCount = funcs.length;

            funcs.forEach(function (func, index) {
                scheduler.schedule(new Scheduler.Task(index, func, innerCallback));
            });
        } else {
            results = {};
            var keys = Object.getOwnPropertyNames(funcs);
            leftCount = keys.length;

            keys.forEach(function (key) {
                scheduler.schedule(new Scheduler.Task(key, funcs[key], innerCallback));
            });
        }

        this.flush();
    }
};

/**
 * Task instance
 * @param {String|Number} [id]
 * @param {Function} func
 * @param {Function} callback
 * @constructor
 */
Scheduler.Task = function (id, func, callback) {
    if (!(id instanceof Function)) {
        this.id = id;
    } else {
        callback = func;
        func = id;
    }
    this.func = func;
    this.callback = callback;
};

Scheduler.Task.prototype = {
    toMessage: function () {
        return {
            func: this.func.toString()
        };
    },

    sendTo: function (worker) {
        var task = this;
        worker.send(this.toMessage(), function (data) {
            task.callback(data.result, this);
        });
    }
};
