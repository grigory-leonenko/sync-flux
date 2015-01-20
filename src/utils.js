var Utils = {
    isArray: function(object){
        return Object.prototype.toString.call(object) === '[object Array]';
    },
    merge: function(obj, target){
        Object.keys(obj).map(function(key){
            if(!target.hasOwnProperty(key)){
                target[key] = obj[key];
            };
        });
        return target;
    }
};

module.exports = Utils;