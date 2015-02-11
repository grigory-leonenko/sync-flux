var Utils = require('./utils.js');

var Flux = (function(){
    var _listeners = [];
    var _stores = [];
    // Public store methods
    var _store_methods = {
        listen: listen,
        dispatch: dispatch,
        listenActions: listenActions,
        listenAction: listenAction,
        emit: emit,
        storeSync: storeSync,
        syncMixin: syncMixin,
        stopSync: stopSync
    };
    // Public lib methods
    var _flux_methods = {
        listen: listen,
        dispatch: dispatch,
        createStore: createStore,
        createActions: createActions
    };

    /**
     * Set up a subscription to dispatched events. Available in Store from context or directly from lib api.
     *
     * @param {event} name of the event is to be listen.
     * @param {cb} callback function for listener.
     *
     * */

    function listen(event, cb){
        console.warn('Sync-Flux: Do not use a central dispatcher and listeners will removed in version 0.3.0.');
        var _ctx = this;
        if(typeof event === 'object'){
            for(var i in event){
                _listeners.push({event: i, cb: event[i], ctx: _ctx})
            };
        } else {
            _listeners.push({event: event, cb: cb, ctx: _ctx});
        };
    };


    /**
     * Store method for connection action and listener functions
     *
     * @param {actions} actions object
     * */

    function listenActions(actions){
        for(var i in actions){
            if(typeof this[i] === 'function'){
                actions[i].listen.call(this, this[i]);
            };
        };
    };

    /**
     * Action listen decorator for store and listener function
     *
     * @param {action} action
     * @param {listener} listener function
     * */

    function listenAction(action, listener){
        action.listen.call(this, listener);
    };

    /**
     * Dispatch (emit) event to listeners.
     *
     * @param {event} event name.
     * @returns wrapper function for arguments which will be the transmitted to listeners functions.
     * */

    function dispatch(event){
        console.warn('Sync-Flux: Do not use a central dispatcher and listeners will removed in version 0.3.0.');
        return function(){
            var _arguments = arguments;
            getListeners(event).map(function(listener){
                listener.cb.apply(listener.ctx, _arguments);
            })
        };
    };

    /**
     * Store constructor.
     *
     * @param {fn} takes a function for creating store.
     * @returns store instance.
     * */

    function createStore(fn){
        Utils.merge(_store_methods, fn.prototype);
        return _stores[_stores.push(new fn()) - 1];
    };

    /**
     * Actions constructor.
     *
     * @param {actions} action name array
     * @returns actions object.
     */

    function createActions(actions){
        var _actions = {};

        if(!Utils.isArray(actions)){
            console.error('Sync-Flux: actions list must be array', actions);
        } else {
            actions.map(function(name){
                _actions[name] = new action(name);
            })
        };

        function action(name){
            var _self = this;
            this.$listeners = [];

            this.listen = function(listener){
                _self.$listeners.push({
                    ctx: this === _self || typeof this === 'function' ? undefined : this, // Check context of listen function not be self context or decorator function
                    fn: listener
                });
            };

            this.emit = function(){
                var _args = arguments;
                _self.$listeners.map(function(listener, $index){
                    try {
                        listener.fn.apply(listener.ctx, _args);
                    } catch (e){
                        _self.$listeners.splice($index, 1);
                        throw new Error('Error calling action listeners', e);
                    };
                }.bind(this));
            };

            this.type = 'action';

            function caller(){
                console.log(this, _self)
                _self.emit(arguments);
            };

            Utils.merge(this, caller);

            return caller;
        };

        return _actions;
    };

    /**
     * Sync variable from store context.
     *
     * @param {values} takes a single value name or values names array to sync.
     * @param {cb} function will be executed after values updated, takes as arguments updated values.
     * */

    function storeSync(values, cb){
        if(this.$syncListeners){
            this.$syncListeners.push({values: values, cb: cb})
        } else {
            this.$syncListeners = [{values: values, cb: cb}]
        };
        return cb;
    };

    /**
     * Stop sync.
     *
     * @param {listener} function used as cb for storeSync.
     * */

    function stopSync(listener){
        if(!this.$syncListeners) return;

        this.$syncListeners.map(function(lst, $index){
            if(listener === lst.cb){
                this.$syncListeners.splice($index, 1);
            };
        }.bind(this))
    };

    /**
     * Sync Mixin constructor can be added to React component for sync Store values and Component "state" values.
     *
     * @params {values} names of values to sync.
     * @returns mixin.
     * !Important values to sync not need to init with getInitialState in Component;
     * */

    function syncMixin(values){
        var _listener;
        var _self = this;
        return {
            getInitialState: function(){
                var _initial = {};

                if(Utils.isArray(values)){
                    values.map(function(value){
                        _initial[value] = _self[value];
                    }.bind(this))
                } else {
                    _initial[values] = _self[values];
                };

                return _initial;
            },
            componentWillMount: function(){
                _listener = _self.storeSync(values, updateBySync.bind(this))
            },
            componentWillUnmount: function(){
                _self.stopSync(_listener);
            }
        }

        function updateBySync(){
            if(this._lifeCycleState !== 'MOUNTED' && this._lifeCycleState !== 'MOUNTING') return;

            var _updated = {};
            Array.prototype.slice.call(arguments).map(function(arg, $index){
                if(Utils.isArray(values)){
                    _updated[values[$index]] = arg;
                } else {
                    _updated[values] = arg;
                }
            });

            this.setState(_updated);
        };
    }

    /**
     * Executes after value or values in store updated, after execution store start sync cycle.
     * */

    function emit(){
        if(!this.$syncListeners) return;

        this.$syncListeners.map(function(lst){
            var _arguments = [];
            if(Utils.isArray(lst.values)){
                lst.values.map(function(value){
                    _arguments.push(this[value]);
                }.bind(this))
            } else {
                _arguments.push(this[lst.values]);
            };
            lst.cb.apply(null, _arguments);
        }.bind(this));
    };

    /**
     * Find listener by event name.
     *
     * @params {event} event name.
     * */

    function getListeners(event){
        var _matched = [];

        _listeners.map(function(listener){
            if(listener.event === event){
                _matched.push({cb: listener.cb, ctx: listener.ctx});
            };
        });

        return _matched;
    };

    return _flux_methods;

}.bind({}))();

module.exports = Flux;