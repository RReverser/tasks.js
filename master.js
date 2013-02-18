/**
 * Task scheduler
 * @param {Number} slavesNumber
 * @constructor
 */
function Scheduler(slavesNumber) {
    this.tasks = [];
    this.workers = [];
    for (var i = 0; i < slavesNumber; i++) {
        this.workers.push(new WorkerWrapper('slave.js'));
    }
    this.freeWorkers = this.workers.slice();
}

Scheduler.prototype = {
    /**
     * Starts execution of scheduled tasks.
     */
    flush: function () {
        while (this.tasks.length && this.freeWorkers.length) {
            this.tasks.shift().sendTo(this.freeWorkers.pop());
        }
    },

    /**
     * Schedules a task for later execution.
     * @param {Scheduler.Task} task
     */
    schedule: function (task) {
        this.tasks.push(task);
    },

    /**
     * Sets JSONable variable in all or exact given worker.
     * @param {String} name
     * @param {*} value
     * @param {WorkerWrapper} [exactWorker]
     */
    setVar: function (name, value, exactWorker) {
        var vars = {};
        vars[name] = value;
        this.setVars(vars, exactWorker);
    },

    /**
     * Sets JSONable variables in all or exact given worker.
     * @param {Object} vars
     * @param {WorkerWrapper} [exactWorker]
     */
    setVars: function (vars, exactWorker) {
        var workers = exactWorker ? [exactWorker] : this.workers,
            message = {
                vars: vars
            };

        workers.forEach(function (worker) {
            worker.send(message);
        });
    },

    /**
     * Imports given scripts to all workers.
     * @param {...String} [scriptN]
     */
    importScripts: function (scriptN) {
        var message = {
            scripts: Array.prototype.slice.call(arguments)
        };

        this.workers.forEach(function (worker) {
            worker.send(message);
        });
    },

    /**
     * Sends given task for execution immediately.
     * @param {Scheduler.Task} task
     */
    execute: function (task) {
        this.schedule(task);
        this.flush();
    },

    /**
     * Sends given task collection (array or hashmap) for execution and returns result in the same style.
     * @param {Function[]|Object} funcs
     * @param {Function} callback
     */
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
                scheduler.schedule(new Scheduler.Task(index, func, null, innerCallback));
            });
        } else {
            results = {};
            var keys = Object.getOwnPropertyNames(funcs);
            leftCount = keys.length;

            keys.forEach(function (key) {
                scheduler.schedule(new Scheduler.Task(key, funcs[key], null, innerCallback));
            });
        }

        this.flush();
    },

    /**
     * Sends given task with argument sets for execution and returns result in the same style.
     * @param {Function} func
     * @param {Array[]|Object} argSets
     * @param {Function} callback
     */
    executeForMany: function (func, argSets, callback) {
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

        if (argSets instanceof Array) {
            results = new Array(argSets.length);
            leftCount = argSets.length;

            argSets.forEach(function (args, index) {
                scheduler.schedule(new Scheduler.Task(index, func, args, innerCallback));
            });
        } else {
            results = {};
            var keys = Object.getOwnPropertyNames(argSets);
            leftCount = keys.length;

            keys.forEach(function (key) {
                scheduler.schedule(new Scheduler.Task(key, func, argSets[key], innerCallback));
            });
        }

        this.flush();
    }
};

/**
 * Task instance
 * @param {String|Number} [id]
 * @param {Function} func
 * @param {Array} args
 * @param {Function} callback
 * @constructor
 */
Scheduler.Task = function (id, func, args, callback) {
    if (!(id instanceof Function)) {
        this.id = id;
    } else {
        callback = func;
        func = id;
    }
    this.func = func;
    this.args = args;
    this.callback = callback;
};

Scheduler.Task.prototype = {
    /**
     * Sends task for execution to given worker.
     * @param {WorkerWrapper} worker
     */
    sendTo: function (worker) {
        var task = this;

        worker.send(
            {
                func: this.func.toString(),
                args: this.args
            },
            function (data) {
                task.callback(data.result, this);
            }
        );
    }
};
