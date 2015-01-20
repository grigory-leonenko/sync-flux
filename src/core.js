var Utils = require('./utils.js');

var Flux = (function(){
    var _listeners = [];
    var _stores = [];
    var _store_methods = {
        listen: listen,
        emit: emit,
        storeSync: storeSync,
        syncMixin: syncMixin,
        stopSync: stopSync
    };

    var _flux_methods = {
        listen: listen,
        dispatch: dispatch,
        createStore: createStore
    };

    function listen(event, cb){
        var _ctx = this;
        if(typeof event === 'object'){
            for(var i in event){
                _listeners.push({event: i, cb: event[i], ctx: _ctx})
            };
        } else {
            _listeners.push({event: event, cb: cb, ctx: _ctx});
        };
    };

    function dispatch(event){
        return function(){
            var _arguments = arguments;
            getListeners(event).map(function(listener){
                listener.cb.apply(listener.ctx, _arguments);
            })
        };
    };

    function createStore(fn){
        Utils.merge(_store_methods, fn.prototype);
        return _stores[_stores.push(new fn()) - 1];
    };

    function storeSync(values, cb){
        if(this.$syncListeners){
            this.$syncListeners.push({values: values, cb: cb})
        } else {
            this.$syncListeners = [{values: values, cb: cb}]
        };
    };

    function stopSync(listener){
        this.$syncListeners.map(function(lst, $index){
            if(listener === lst.cb){
                this.$syncListeners.splice($index, 1);
            };
        })
    };

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
                _listener = _self.storeSync(values, this.updateBySync)
            },
            updateBySync: function(){
                var _updated = {};
                Array.prototype.slice.call(arguments).map(function(arg, $index){
                    if(Utils.isArray(values)){
                        _updated[values[$index]] = arg;
                    } else {
                        _updated[values] = arg;
                    }
                });

                this.setState(_updated);
            },
            componentWillUnmount: function(){
                _self.stopSync(_listener);
            }
        }
    }

    function emit(){
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