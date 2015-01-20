var Utils = {
    isArray: function(object){ //Check if object is array
        return Object.prototype.toString.call(object) === '[object Array]';
    },
    merge: function(obj, target){ //Merge two objects
        Object.keys(obj).map(function(key){
            if(!target.hasOwnProperty(key)){
                target[key] = obj[key];
            };
        });
        return target;
    }
};

module.exports = Utils;