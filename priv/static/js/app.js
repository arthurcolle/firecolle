(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
/*!
 * eventie v1.0.6
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

"use strict";

(function (window) {

  "use strict";

  var docElem = document.documentElement;

  var bind = function bind() {};

  function getIEEvent(obj) {
    var event = window.event;
    // add event.target
    event.target = event.target || event.srcElement || obj;
    return event;
  }

  if (docElem.addEventListener) {
    bind = function (obj, type, fn) {
      obj.addEventListener(type, fn, false);
    };
  } else if (docElem.attachEvent) {
    bind = function (obj, type, fn) {
      obj[type + fn] = fn.handleEvent ? function () {
        var event = getIEEvent(obj);
        fn.handleEvent.call(fn, event);
      } : function () {
        var event = getIEEvent(obj);
        fn.call(obj, event);
      };
      obj.attachEvent("on" + type, obj[type + fn]);
    };
  }

  var unbind = function unbind() {};

  if (docElem.removeEventListener) {
    unbind = function (obj, type, fn) {
      obj.removeEventListener(type, fn, false);
    };
  } else if (docElem.detachEvent) {
    unbind = function (obj, type, fn) {
      obj.detachEvent("on" + type, obj[type + fn]);
      try {
        delete obj[type + fn];
      } catch (err) {
        // can't delete window object properties
        obj[type + fn] = undefined;
      }
    };
  }

  var eventie = {
    bind: bind,
    unbind: unbind
  };

  // ----- module definition ----- //

  if (typeof define === "function" && define.amd) {
    // AMD
    define(eventie);
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = eventie;
  } else {
    // browser global
    window.eventie = eventie;
  }
})(window);
/*!
 * docReady v1.0.4
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

'use strict';

(function (window) {

  'use strict';

  var document = window.document;
  // collection of functions to be triggered on ready
  var queue = [];

  function docReady(fn) {
    // throw out non-functions
    if (typeof fn !== 'function') {
      return;
    }

    if (docReady.isReady) {
      // ready now, hit it
      fn();
    } else {
      // queue function when ready
      queue.push(fn);
    }
  }

  docReady.isReady = false;

  // triggered on various doc ready events
  function onReady(event) {
    // bail if already triggered or IE8 document is not ready just yet
    var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
    if (docReady.isReady || isIE8NotReady) {
      return;
    }

    trigger();
  }

  function trigger() {
    docReady.isReady = true;
    // process queue
    for (var i = 0, len = queue.length; i < len; i++) {
      var fn = queue[i];
      fn();
    }
  }

  function defineDocReady(eventie) {
    // trigger ready if page is ready
    if (document.readyState === 'complete') {
      trigger();
    } else {
      // listen for events
      eventie.bind(document, 'DOMContentLoaded', onReady);
      eventie.bind(document, 'readystatechange', onReady);
      eventie.bind(window, 'load', onReady);
    }

    return docReady;
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['eventie/eventie'], defineDocReady);
  } else if (typeof exports === 'object') {
    module.exports = defineDocReady(require('eventie'));
  } else {
    // browser global
    window.docReady = defineDocReady(window.eventie);
  }
})(window);
/*!
 * getStyleProperty v1.0.4
 * original by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false, exports: false, module: false */

'use strict';

(function (window) {

  'use strict';

  var prefixes = 'Webkit Moz ms Ms O'.split(' ');
  var docElemStyle = document.documentElement.style;

  function getStyleProperty(propName) {
    if (!propName) {
      return;
    }

    // test standard property first
    if (typeof docElemStyle[propName] === 'string') {
      return propName;
    }

    // capitalize
    propName = propName.charAt(0).toUpperCase() + propName.slice(1);

    // test vendor specific properties
    var prefixed;
    for (var i = 0, len = prefixes.length; i < len; i++) {
      prefixed = prefixes[i] + propName;
      if (typeof docElemStyle[prefixed] === 'string') {
        return prefixed;
      }
    }
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
      return getStyleProperty;
    });
  } else if (typeof exports === 'object') {
    // CommonJS for Component
    module.exports = getStyleProperty;
  } else {
    // browser global
    window.getStyleProperty = getStyleProperty;
  }
})(window);
/**
 * matchesSelector v1.0.3
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

'use strict';

(function (ElemProto) {

  'use strict';

  var matchesMethod = (function () {
    // check for the standard method name first
    if (ElemProto.matches) {
      return 'matches';
    }
    // check un-prefixed
    if (ElemProto.matchesSelector) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    for (var i = 0, len = prefixes.length; i < len; i++) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if (ElemProto[method]) {
        return method;
      }
    }
  })();

  // ----- match ----- //

  function match(elem, selector) {
    return elem[matchesMethod](selector);
  }

  // ----- appendToFragment ----- //

  function checkParent(elem) {
    // not needed if already has parent
    if (elem.parentNode) {
      return;
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild(elem);
  }

  // ----- query ----- //

  // fall back to using QSA
  // thx @jonathantneal https://gist.github.com/3062955
  function query(elem, selector) {
    // append to fragment if no parent
    checkParent(elem);

    // match elem with all selected elems of parent
    var elems = elem.parentNode.querySelectorAll(selector);
    for (var i = 0, len = elems.length; i < len; i++) {
      // return true if match
      if (elems[i] === elem) {
        return true;
      }
    }
    // otherwise return false
    return false;
  }

  // ----- matchChild ----- //

  function matchChild(elem, selector) {
    checkParent(elem);
    return match(elem, selector);
  }

  // ----- matchesSelector ----- //

  var matchesSelector;

  if (matchesMethod) {
    // IE9 supports matchesSelector, but doesn't work on orphaned elems
    // check for that
    var div = document.createElement('div');
    var supportsOrphans = match(div, 'div');
    matchesSelector = supportsOrphans ? match : matchChild;
  } else {
    matchesSelector = query;
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
      return matchesSelector;
    });
  } else if (typeof exports === 'object') {
    module.exports = matchesSelector;
  } else {
    // browser global
    window.matchesSelector = matchesSelector;
  }
})(Element.prototype);
/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

'use strict';

;(function () {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        } else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    } else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        } else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        } else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        } else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        } else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = EventEmitter;
    } else {
        exports.EventEmitter = EventEmitter;
    }
}).call(undefined);
/**
 * Fizzy UI utils v1.0.1
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

'use strict';

(function (window, factory) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['doc-ready/doc-ready', 'matches-selector/matches-selector'], function (docReady, matchesSelector) {
      return factory(window, docReady, matchesSelector);
    });
  } else if (typeof exports == 'object') {
    // CommonJS
    module.exports = factory(window, require('doc-ready'), require('desandro-matches-selector'));
  } else {
    // browser global
    window.fizzyUIUtils = factory(window, window.docReady, window.matchesSelector);
  }
})(window, function factory(window, docReady, matchesSelector) {

  'use strict';

  var utils = {};

  // ----- extend ----- //

  // extends objects
  utils.extend = function (a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  };

  // ----- modulo ----- //

  utils.modulo = function (num, div) {
    return (num % div + div) % div;
  };

  // ----- isArray ----- //

  var objToString = Object.prototype.toString;
  utils.isArray = function (obj) {
    return objToString.call(obj) == '[object Array]';
  };

  // ----- makeArray ----- //

  // turn element or nodeList into an array
  utils.makeArray = function (obj) {
    var ary = [];
    if (utils.isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (obj && typeof obj.length == 'number') {
      // convert nodeList to array
      for (var i = 0, len = obj.length; i < len; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  };

  // ----- indexOf ----- //

  // index of helper cause IE8
  utils.indexOf = Array.prototype.indexOf ? function (ary, obj) {
    return ary.indexOf(obj);
  } : function (ary, obj) {
    for (var i = 0, len = ary.length; i < len; i++) {
      if (ary[i] === obj) {
        return i;
      }
    }
    return -1;
  };

  // ----- removeFrom ----- //

  utils.removeFrom = function (ary, obj) {
    var index = utils.indexOf(ary, obj);
    if (index != -1) {
      ary.splice(index, 1);
    }
  };

  // ----- isElement ----- //

  // http://stackoverflow.com/a/384380/182183
  utils.isElement = typeof HTMLElement == 'function' || typeof HTMLElement == 'object' ? function isElementDOM2(obj) {
    return obj instanceof HTMLElement;
  } : function isElementQuirky(obj) {
    return obj && typeof obj == 'object' && obj.nodeType == 1 && typeof obj.nodeName == 'string';
  };

  // ----- setText ----- //

  utils.setText = (function () {
    var setTextProperty;
    function setText(elem, text) {
      // only check setTextProperty once
      setTextProperty = setTextProperty || (document.documentElement.textContent !== undefined ? 'textContent' : 'innerText');
      elem[setTextProperty] = text;
    }
    return setText;
  })();

  // ----- getParent ----- //

  utils.getParent = function (elem, selector) {
    while (elem != document.body) {
      elem = elem.parentNode;
      if (matchesSelector(elem, selector)) {
        return elem;
      }
    }
  };

  // ----- getQueryElement ----- //

  // use element as selector string
  utils.getQueryElement = function (elem) {
    if (typeof elem == 'string') {
      return document.querySelector(elem);
    }
    return elem;
  };

  // ----- handleEvent ----- //

  // enable .ontype to trigger from .addEventListener( elem, 'type' )
  utils.handleEvent = function (event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  // ----- filterFindElements ----- //

  utils.filterFindElements = function (elems, selector) {
    // make array of elems
    elems = utils.makeArray(elems);
    var ffElems = [];

    for (var i = 0, len = elems.length; i < len; i++) {
      var elem = elems[i];
      // check that elem is an actual element
      if (!utils.isElement(elem)) {
        continue;
      }
      // filter & find items if we have a selector
      if (selector) {
        // filter siblings
        if (matchesSelector(elem, selector)) {
          ffElems.push(elem);
        }
        // find children
        var childElems = elem.querySelectorAll(selector);
        // concat childElems to filterFound array
        for (var j = 0, jLen = childElems.length; j < jLen; j++) {
          ffElems.push(childElems[j]);
        }
      } else {
        ffElems.push(elem);
      }
    }

    return ffElems;
  };

  // ----- debounceMethod ----- //

  utils.debounceMethod = function (_class, methodName, threshold) {
    // original method
    var method = _class.prototype[methodName];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[methodName] = function () {
      var timeout = this[timeoutName];
      if (timeout) {
        clearTimeout(timeout);
      }
      var args = arguments;

      var _this = this;
      this[timeoutName] = setTimeout(function () {
        method.apply(_this, args);
        delete _this[timeoutName];
      }, threshold || 100);
    };
  };

  // ----- htmlInit ----- //

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
  utils.toDashed = function (str) {
    return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-option attribute
   */
  utils.htmlInit = function (WidgetClass, namespace) {
    docReady(function () {
      var dashedNamespace = utils.toDashed(namespace);
      var elems = document.querySelectorAll('.js-' + dashedNamespace);
      var dataAttr = 'data-' + dashedNamespace + '-options';

      for (var i = 0, len = elems.length; i < len; i++) {
        var elem = elems[i];
        var attr = elem.getAttribute(dataAttr);
        var options;
        try {
          options = attr && JSON.parse(attr);
        } catch (error) {
          // log error, do not initialize
          if (console) {
            console.error('Error parsing ' + dataAttr + ' on ' + elem.nodeName.toLowerCase() + (elem.id ? '#' + elem.id : '') + ': ' + error);
          }
          continue;
        }
        // initialize
        var instance = new WidgetClass(elem, options);
        // make available via $().data('layoutname')
        var jQuery = window.jQuery;
        if (jQuery) {
          jQuery.data(elem, namespace, instance);
        }
      }
    });
  };

  // -----  ----- //

  return utils;
});
/*!
 * getSize v1.2.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, exports: false, require: false, module: false, console: false */

'use strict';

(function (window, undefined) {

  'use strict';

  // -------------------------- helpers -------------------------- //

  // get a number from a string, not a percentage
  function getStyleSize(value) {
    var num = parseFloat(value);
    // not a percent like '100%', and a number
    var isValid = value.indexOf('%') === -1 && !isNaN(num);
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console === 'undefined' ? noop : function (message) {
    console.error(message);
  };

  // -------------------------- measurements -------------------------- //

  var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };
    for (var i = 0, len = measurements.length; i < len; i++) {
      var measurement = measurements[i];
      size[measurement] = 0;
    }
    return size;
  }

  function defineGetSize(getStyleProperty) {

    // -------------------------- setup -------------------------- //

    var isSetup = false;

    var getStyle, boxSizingProp, isBoxSizeOuter;

    /**
     * setup vars and functions
     * do it on initial getSize(), rather than on script load
     * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
     */
    function setup() {
      // setup once
      if (isSetup) {
        return;
      }
      isSetup = true;

      var getComputedStyle = window.getComputedStyle;
      getStyle = (function () {
        var getStyleFn = getComputedStyle ? function (elem) {
          return getComputedStyle(elem, null);
        } : function (elem) {
          return elem.currentStyle;
        };

        return function getStyle(elem) {
          var style = getStyleFn(elem);
          if (!style) {
            logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See http://bit.ly/getsizebug1');
          }
          return style;
        };
      })();

      // -------------------------- box sizing -------------------------- //

      boxSizingProp = getStyleProperty('boxSizing');

      /**
       * WebKit measures the outer-width on style.width on border-box elems
       * IE & Firefox measures the inner-width
       */
      if (boxSizingProp) {
        var div = document.createElement('div');
        div.style.width = '200px';
        div.style.padding = '1px 2px 3px 4px';
        div.style.borderStyle = 'solid';
        div.style.borderWidth = '1px 2px 3px 4px';
        div.style[boxSizingProp] = 'border-box';

        var body = document.body || document.documentElement;
        body.appendChild(div);
        var style = getStyle(div);

        isBoxSizeOuter = getStyleSize(style.width) === 200;
        body.removeChild(div);
      }
    }

    // -------------------------- getSize -------------------------- //

    function getSize(elem) {
      setup();

      // use querySeletor if elem is string
      if (typeof elem === 'string') {
        elem = document.querySelector(elem);
      }

      // do not proceed on non-objects
      if (!elem || typeof elem !== 'object' || !elem.nodeType) {
        return;
      }

      var style = getStyle(elem);

      // if hidden, everything is 0
      if (style.display === 'none') {
        return getZeroSize();
      }

      var size = {};
      size.width = elem.offsetWidth;
      size.height = elem.offsetHeight;

      var isBorderBox = size.isBorderBox = !!(boxSizingProp && style[boxSizingProp] && style[boxSizingProp] === 'border-box');

      // get all measurements
      for (var i = 0, len = measurements.length; i < len; i++) {
        var measurement = measurements[i];
        var value = style[measurement];
        value = mungeNonPixel(elem, value);
        var num = parseFloat(value);
        // any 'auto', 'medium' value will be 0
        size[measurement] = !isNaN(num) ? num : 0;
      }

      var paddingWidth = size.paddingLeft + size.paddingRight;
      var paddingHeight = size.paddingTop + size.paddingBottom;
      var marginWidth = size.marginLeft + size.marginRight;
      var marginHeight = size.marginTop + size.marginBottom;
      var borderWidth = size.borderLeftWidth + size.borderRightWidth;
      var borderHeight = size.borderTopWidth + size.borderBottomWidth;

      var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

      // overwrite width and height if we can get it from style
      var styleWidth = getStyleSize(style.width);
      if (styleWidth !== false) {
        size.width = styleWidth + (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
      }

      var styleHeight = getStyleSize(style.height);
      if (styleHeight !== false) {
        size.height = styleHeight + (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
      }

      size.innerWidth = size.width - (paddingWidth + borderWidth);
      size.innerHeight = size.height - (paddingHeight + borderHeight);

      size.outerWidth = size.width + marginWidth;
      size.outerHeight = size.height + marginHeight;

      return size;
    }

    // IE8 returns percent values, not pixels
    // taken from jQuery's curCSS
    function mungeNonPixel(elem, value) {
      // IE8 and has percent value
      if (window.getComputedStyle || value.indexOf('%') === -1) {
        return value;
      }
      var style = elem.style;
      // Remember the original values
      var left = style.left;
      var rs = elem.runtimeStyle;
      var rsLeft = rs && rs.left;

      // Put in the new values to get a computed value out
      if (rsLeft) {
        rs.left = elem.currentStyle.left;
      }
      style.left = value;
      value = style.pixelLeft;

      // Revert the changed values
      style.left = left;
      if (rsLeft) {
        rs.left = rsLeft;
      }

      return value;
    }

    return getSize;
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD for RequireJS
    define(['get-style-property/get-style-property'], defineGetSize);
  } else if (typeof exports === 'object') {
    // CommonJS for Component
    module.exports = defineGetSize(require('desandro-get-style-property'));
  } else {
    // browser global
    window.getSize = defineGetSize(window.getStyleProperty);
  }
})(window);

// add padding and border unless it's already including it

// add padding and border unless it's already including it
"use strict";(function(global, factory){if(typeof module === "object" && typeof module.exports === "object"){module.exports = global.document?factory(global, true):function(w){if(!w.document){throw new Error("jQuery requires a window with a document");}return factory(w);};}else {factory(global);}})(typeof window !== "undefined"?window:undefined, function(window, noGlobal){var arr=[];var _slice=arr.slice;var concat=arr.concat;var push=arr.push;var indexOf=arr.indexOf;var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var support={};var document=window.document, version="2.1.4", jQuery=function jQuery(selector, context){return new jQuery.fn.init(selector, context);}, rtrim=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, rmsPrefix=/^-ms-/, rdashAlpha=/-([\da-z])/gi, fcamelCase=function fcamelCase(all, letter){return letter.toUpperCase();};jQuery.fn = jQuery.prototype = {jquery:version, constructor:jQuery, selector:"", length:0, toArray:function toArray(){return _slice.call(this);}, get:function get(num){return num != null?num < 0?this[num + this.length]:this[num]:_slice.call(this);}, pushStack:function pushStack(elems){var ret=jQuery.merge(this.constructor(), elems);ret.prevObject = this;ret.context = this.context;return ret;}, each:function each(callback, args){return jQuery.each(this, callback, args);}, map:function map(callback){return this.pushStack(jQuery.map(this, function(elem, i){return callback.call(elem, i, elem);}));}, slice:function slice(){return this.pushStack(_slice.apply(this, arguments));}, first:function first(){return this.eq(0);}, last:function last(){return this.eq(-1);}, eq:function eq(i){var len=this.length, j=+i + (i < 0?len:0);return this.pushStack(j >= 0 && j < len?[this[j]]:[]);}, end:function end(){return this.prevObject || this.constructor(null);}, push:push, sort:arr.sort, splice:arr.splice};jQuery.extend = jQuery.fn.extend = function(){var options, name, src, copy, copyIsArray, clone, target=arguments[0] || {}, i=1, length=arguments.length, deep=false;if(typeof target === "boolean"){deep = target;target = arguments[i] || {};i++;}if(typeof target !== "object" && !jQuery.isFunction(target)){target = {};}if(i === length){target = this;i--;}for(; i < length; i++) {if((options = arguments[i]) != null){for(name in options) {src = target[name];copy = options[name];if(target === copy){continue;}if(deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))){if(copyIsArray){copyIsArray = false;clone = src && jQuery.isArray(src)?src:[];}else {clone = src && jQuery.isPlainObject(src)?src:{};}target[name] = jQuery.extend(deep, clone, copy);}else if(copy !== undefined){target[name] = copy;}}}}return target;};jQuery.extend({expando:"jQuery" + (version + Math.random()).replace(/\D/g, ""), isReady:true, error:function error(msg){throw new Error(msg);}, noop:function noop(){}, isFunction:function isFunction(obj){return jQuery.type(obj) === "function";}, isArray:Array.isArray, isWindow:function isWindow(obj){return obj != null && obj === obj.window;}, isNumeric:function isNumeric(obj){return !jQuery.isArray(obj) && obj - parseFloat(obj) + 1 >= 0;}, isPlainObject:function isPlainObject(obj){if(jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)){return false;}if(obj.constructor && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")){return false;}return true;}, isEmptyObject:function isEmptyObject(obj){var name;for(name in obj) {return false;}return true;}, type:function type(obj){if(obj == null){return obj + "";}return typeof obj === "object" || typeof obj === "function"?class2type[toString.call(obj)] || "object":typeof obj;}, globalEval:function globalEval(code){var script, indirect=eval;code = jQuery.trim(code);if(code){if(code.indexOf("use strict") === 1){script = document.createElement("script");script.text = code;document.head.appendChild(script).parentNode.removeChild(script);}else {indirect(code);}}}, camelCase:function camelCase(string){return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);}, nodeName:function nodeName(elem, name){return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();}, each:function each(obj, callback, args){var value, i=0, length=obj.length, isArray=isArraylike(obj);if(args){if(isArray){for(; i < length; i++) {value = callback.apply(obj[i], args);if(value === false){break;}}}else {for(i in obj) {value = callback.apply(obj[i], args);if(value === false){break;}}}}else {if(isArray){for(; i < length; i++) {value = callback.call(obj[i], i, obj[i]);if(value === false){break;}}}else {for(i in obj) {value = callback.call(obj[i], i, obj[i]);if(value === false){break;}}}}return obj;}, trim:function trim(text){return text == null?"":(text + "").replace(rtrim, "");}, makeArray:function makeArray(arr, results){var ret=results || [];if(arr != null){if(isArraylike(Object(arr))){jQuery.merge(ret, typeof arr === "string"?[arr]:arr);}else {push.call(ret, arr);}}return ret;}, inArray:function inArray(elem, arr, i){return arr == null?-1:indexOf.call(arr, elem, i);}, merge:function merge(first, second){var len=+second.length, j=0, i=first.length;for(; j < len; j++) {first[i++] = second[j];}first.length = i;return first;}, grep:function grep(elems, callback, invert){var callbackInverse, matches=[], i=0, length=elems.length, callbackExpect=!invert;for(; i < length; i++) {callbackInverse = !callback(elems[i], i);if(callbackInverse !== callbackExpect){matches.push(elems[i]);}}return matches;}, map:function map(elems, callback, arg){var value, i=0, length=elems.length, isArray=isArraylike(elems), ret=[];if(isArray){for(; i < length; i++) {value = callback(elems[i], i, arg);if(value != null){ret.push(value);}}}else {for(i in elems) {value = callback(elems[i], i, arg);if(value != null){ret.push(value);}}}return concat.apply([], ret);}, guid:1, proxy:function proxy(fn, context){var tmp, args, proxy;if(typeof context === "string"){tmp = fn[context];context = fn;fn = tmp;}if(!jQuery.isFunction(fn)){return undefined;}args = _slice.call(arguments, 2);proxy = function(){return fn.apply(context || this, args.concat(_slice.call(arguments)));};proxy.guid = fn.guid = fn.guid || jQuery.guid++;return proxy;}, now:Date.now, support:support});jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name){class2type["[object " + name + "]"] = name.toLowerCase();});function isArraylike(obj){var length="length" in obj && obj.length, type=jQuery.type(obj);if(type === "function" || jQuery.isWindow(obj)){return false;}if(obj.nodeType === 1 && length){return true;}return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;}var Sizzle=(function(window){var i, support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando="sizzle" + 1 * new Date(), preferredDoc=window.document, dirruns=0, done=0, classCache=createCache(), tokenCache=createCache(), compilerCache=createCache(), sortOrder=function sortOrder(a, b){if(a === b){hasDuplicate = true;}return 0;}, MAX_NEGATIVE=1 << 31, hasOwn=({}).hasOwnProperty, arr=[], pop=arr.pop, push_native=arr.push, push=arr.push, slice=arr.slice, indexOf=function indexOf(list, elem){var i=0, len=list.length;for(; i < len; i++) {if(list[i] === elem){return i;}}return -1;}, booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", whitespace="[\\x20\\t\\r\\n\\f]", characterEncoding="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", identifier=characterEncoding.replace("w", "w#"), attributes="\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]", pseudos=":(" + characterEncoding + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)", rwhitespace=new RegExp(whitespace + "+", "g"), rtrim=new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma=new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators=new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rattributeQuotes=new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"), rpseudo=new RegExp(pseudos), ridentifier=new RegExp("^" + identifier + "$"), matchExpr={"ID":new RegExp("^#(" + characterEncoding + ")"), "CLASS":new RegExp("^\\.(" + characterEncoding + ")"), "TAG":new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"), "ATTR":new RegExp("^" + attributes), "PSEUDO":new RegExp("^" + pseudos), "CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"), "bool":new RegExp("^(?:" + booleans + ")$", "i"), "needsContext":new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")}, rinputs=/^(?:input|select|textarea|button)$/i, rheader=/^h\d$/i, rnative=/^[^{]+\{\s*\[native \w/, rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling=/[+~]/, rescape=/'|\\/g, runescape=new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"), funescape=function funescape(_, escaped, escapedWhitespace){var high="0x" + escaped - 65536;return high !== high || escapedWhitespace?escaped:high < 0?String.fromCharCode(high + 65536):String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);}, unloadHandler=function unloadHandler(){setDocument();};try{push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);arr[preferredDoc.childNodes.length].nodeType;}catch(e) {push = {apply:arr.length?function(target, els){push_native.apply(target, slice.call(els));}:function(target, els){var j=target.length, i=0;while(target[j++] = els[i++]) {}target.length = j - 1;}};}function Sizzle(selector, context, results, seed){var match, elem, m, nodeType, i, groups, old, nid, newContext, newSelector;if((context?context.ownerDocument || context:preferredDoc) !== document){setDocument(context);}context = context || document;results = results || [];nodeType = context.nodeType;if(typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11){return results;}if(!seed && documentIsHTML){if(nodeType !== 11 && (match = rquickExpr.exec(selector))){if(m = match[1]){if(nodeType === 9){elem = context.getElementById(m);if(elem && elem.parentNode){if(elem.id === m){results.push(elem);return results;}}else {return results;}}else {if(context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m){results.push(elem);return results;}}}else if(match[2]){push.apply(results, context.getElementsByTagName(selector));return results;}else if((m = match[3]) && support.getElementsByClassName){push.apply(results, context.getElementsByClassName(m));return results;}}if(support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))){nid = old = expando;newContext = context;newSelector = nodeType !== 1 && selector;if(nodeType === 1 && context.nodeName.toLowerCase() !== "object"){groups = tokenize(selector);if(old = context.getAttribute("id")){nid = old.replace(rescape, "\\$&");}else {context.setAttribute("id", nid);}nid = "[id='" + nid + "'] ";i = groups.length;while(i--) {groups[i] = nid + toSelector(groups[i]);}newContext = rsibling.test(selector) && testContext(context.parentNode) || context;newSelector = groups.join(",");}if(newSelector){try{push.apply(results, newContext.querySelectorAll(newSelector));return results;}catch(qsaError) {}finally {if(!old){context.removeAttribute("id");}}}}}return select(selector.replace(rtrim, "$1"), context, results, seed);}function createCache(){var keys=[];function cache(key, value){if(keys.push(key + " ") > Expr.cacheLength){delete cache[keys.shift()];}return cache[key + " "] = value;}return cache;}function markFunction(fn){fn[expando] = true;return fn;}function assert(fn){var div=document.createElement("div");try{return !!fn(div);}catch(e) {return false;}finally {if(div.parentNode){div.parentNode.removeChild(div);}div = null;}}function addHandle(attrs, handler){var arr=attrs.split("|"), i=attrs.length;while(i--) {Expr.attrHandle[arr[i]] = handler;}}function siblingCheck(a, b){var cur=b && a, diff=cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);if(diff){return diff;}if(cur){while(cur = cur.nextSibling) {if(cur === b){return -1;}}}return a?1:-1;}function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === type;};}function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return (name === "input" || name === "button") && elem.type === type;};}function createPositionalPseudo(fn){return markFunction(function(argument){argument = +argument;return markFunction(function(seed, matches){var j, matchIndexes=fn([], seed.length, argument), i=matchIndexes.length;while(i--) {if(seed[j = matchIndexes[i]]){seed[j] = !(matches[j] = seed[j]);}}});});}function testContext(context){return context && typeof context.getElementsByTagName !== "undefined" && context;}support = Sizzle.support = {};isXML = Sizzle.isXML = function(elem){var documentElement=elem && (elem.ownerDocument || elem).documentElement;return documentElement?documentElement.nodeName !== "HTML":false;};setDocument = Sizzle.setDocument = function(node){var hasCompare, parent, doc=node?node.ownerDocument || node:preferredDoc;if(doc === document || doc.nodeType !== 9 || !doc.documentElement){return document;}document = doc;docElem = doc.documentElement;parent = doc.defaultView;if(parent && parent !== parent.top){if(parent.addEventListener){parent.addEventListener("unload", unloadHandler, false);}else if(parent.attachEvent){parent.attachEvent("onunload", unloadHandler);}}documentIsHTML = !isXML(doc);support.attributes = assert(function(div){div.className = "i";return !div.getAttribute("className");});support.getElementsByTagName = assert(function(div){div.appendChild(doc.createComment(""));return !div.getElementsByTagName("*").length;});support.getElementsByClassName = rnative.test(doc.getElementsByClassName);support.getById = assert(function(div){docElem.appendChild(div).id = expando;return !doc.getElementsByName || !doc.getElementsByName(expando).length;});if(support.getById){Expr.find["ID"] = function(id, context){if(typeof context.getElementById !== "undefined" && documentIsHTML){var m=context.getElementById(id);return m && m.parentNode?[m]:[];}};Expr.filter["ID"] = function(id){var attrId=id.replace(runescape, funescape);return function(elem){return elem.getAttribute("id") === attrId;};};}else {delete Expr.find["ID"];Expr.filter["ID"] = function(id){var attrId=id.replace(runescape, funescape);return function(elem){var node=typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");return node && node.value === attrId;};};}Expr.find["TAG"] = support.getElementsByTagName?function(tag, context){if(typeof context.getElementsByTagName !== "undefined"){return context.getElementsByTagName(tag);}else if(support.qsa){return context.querySelectorAll(tag);}}:function(tag, context){var elem, tmp=[], i=0, results=context.getElementsByTagName(tag);if(tag === "*"){while(elem = results[i++]) {if(elem.nodeType === 1){tmp.push(elem);}}return tmp;}return results;};Expr.find["CLASS"] = support.getElementsByClassName && function(className, context){if(documentIsHTML){return context.getElementsByClassName(className);}};rbuggyMatches = [];rbuggyQSA = [];if(support.qsa = rnative.test(doc.querySelectorAll)){assert(function(div){docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\f]' msallowcapture=''>" + "<option selected=''></option></select>";if(div.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");}if(!div.querySelectorAll("[selected]").length){rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");}if(!div.querySelectorAll("[id~=" + expando + "-]").length){rbuggyQSA.push("~=");}if(!div.querySelectorAll(":checked").length){rbuggyQSA.push(":checked");}if(!div.querySelectorAll("a#" + expando + "+*").length){rbuggyQSA.push(".#.+[+~]");}});assert(function(div){var input=doc.createElement("input");input.setAttribute("type", "hidden");div.appendChild(input).setAttribute("name", "D");if(div.querySelectorAll("[name=d]").length){rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");}if(!div.querySelectorAll(":enabled").length){rbuggyQSA.push(":enabled", ":disabled");}div.querySelectorAll("*,:x");rbuggyQSA.push(",.*:");});}if(support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)){assert(function(div){support.disconnectedMatch = matches.call(div, "div");matches.call(div, "[s!='']:x");rbuggyMatches.push("!=", pseudos);});}rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));hasCompare = rnative.test(docElem.compareDocumentPosition);contains = hasCompare || rnative.test(docElem.contains)?function(a, b){var adown=a.nodeType === 9?a.documentElement:a, bup=b && b.parentNode;return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains?adown.contains(bup):a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));}:function(a, b){if(b){while(b = b.parentNode) {if(b === a){return true;}}}return false;};sortOrder = hasCompare?function(a, b){if(a === b){hasDuplicate = true;return 0;}var compare=!a.compareDocumentPosition - !b.compareDocumentPosition;if(compare){return compare;}compare = (a.ownerDocument || a) === (b.ownerDocument || b)?a.compareDocumentPosition(b):1;if(compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare){if(a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a)){return -1;}if(b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b)){return 1;}return sortInput?indexOf(sortInput, a) - indexOf(sortInput, b):0;}return compare & 4?-1:1;}:function(a, b){if(a === b){hasDuplicate = true;return 0;}var cur, i=0, aup=a.parentNode, bup=b.parentNode, ap=[a], bp=[b];if(!aup || !bup){return a === doc?-1:b === doc?1:aup?-1:bup?1:sortInput?indexOf(sortInput, a) - indexOf(sortInput, b):0;}else if(aup === bup){return siblingCheck(a, b);}cur = a;while(cur = cur.parentNode) {ap.unshift(cur);}cur = b;while(cur = cur.parentNode) {bp.unshift(cur);}while(ap[i] === bp[i]) {i++;}return i?siblingCheck(ap[i], bp[i]):ap[i] === preferredDoc?-1:bp[i] === preferredDoc?1:0;};return doc;};Sizzle.matches = function(expr, elements){return Sizzle(expr, null, null, elements);};Sizzle.matchesSelector = function(elem, expr){if((elem.ownerDocument || elem) !== document){setDocument(elem);}expr = expr.replace(rattributeQuotes, "='$1']");if(support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))){try{var ret=matches.call(elem, expr);if(ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11){return ret;}}catch(e) {}}return Sizzle(expr, document, null, [elem]).length > 0;};Sizzle.contains = function(context, elem){if((context.ownerDocument || context) !== document){setDocument(context);}return contains(context, elem);};Sizzle.attr = function(elem, name){if((elem.ownerDocument || elem) !== document){setDocument(elem);}var fn=Expr.attrHandle[name.toLowerCase()], val=fn && hasOwn.call(Expr.attrHandle, name.toLowerCase())?fn(elem, name, !documentIsHTML):undefined;return val !== undefined?val:support.attributes || !documentIsHTML?elem.getAttribute(name):(val = elem.getAttributeNode(name)) && val.specified?val.value:null;};Sizzle.error = function(msg){throw new Error("Syntax error, unrecognized expression: " + msg);};Sizzle.uniqueSort = function(results){var elem, duplicates=[], j=0, i=0;hasDuplicate = !support.detectDuplicates;sortInput = !support.sortStable && results.slice(0);results.sort(sortOrder);if(hasDuplicate){while(elem = results[i++]) {if(elem === results[i]){j = duplicates.push(i);}}while(j--) {results.splice(duplicates[j], 1);}}sortInput = null;return results;};getText = Sizzle.getText = function(elem){var node, ret="", i=0, nodeType=elem.nodeType;if(!nodeType){while(node = elem[i++]) {ret += getText(node);}}else if(nodeType === 1 || nodeType === 9 || nodeType === 11){if(typeof elem.textContent === "string"){return elem.textContent;}else {for(elem = elem.firstChild; elem; elem = elem.nextSibling) {ret += getText(elem);}}}else if(nodeType === 3 || nodeType === 4){return elem.nodeValue;}return ret;};Expr = Sizzle.selectors = {cacheLength:50, createPseudo:markFunction, match:matchExpr, attrHandle:{}, find:{}, relative:{">":{dir:"parentNode", first:true}, " ":{dir:"parentNode"}, "+":{dir:"previousSibling", first:true}, "~":{dir:"previousSibling"}}, preFilter:{"ATTR":function ATTR(match){match[1] = match[1].replace(runescape, funescape);match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);if(match[2] === "~="){match[3] = " " + match[3] + " ";}return match.slice(0, 4);}, "CHILD":function CHILD(match){match[1] = match[1].toLowerCase();if(match[1].slice(0, 3) === "nth"){if(!match[3]){Sizzle.error(match[0]);}match[4] = +(match[4]?match[5] + (match[6] || 1):2 * (match[3] === "even" || match[3] === "odd"));match[5] = +(match[7] + match[8] || match[3] === "odd");}else if(match[3]){Sizzle.error(match[0]);}return match;}, "PSEUDO":function PSEUDO(match){var excess, unquoted=!match[6] && match[2];if(matchExpr["CHILD"].test(match[0])){return null;}if(match[3]){match[2] = match[4] || match[5] || "";}else if(unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)){match[0] = match[0].slice(0, excess);match[2] = unquoted.slice(0, excess);}return match.slice(0, 3);}}, filter:{"TAG":function TAG(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape, funescape).toLowerCase();return nodeNameSelector === "*"?function(){return true;}:function(elem){return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;};}, "CLASS":function CLASS(className){var pattern=classCache[className + " "];return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem){return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");});}, "ATTR":function ATTR(name, operator, check){return function(elem){var result=Sizzle.attr(elem, name);if(result == null){return operator === "!=";}if(!operator){return true;}result += "";return operator === "="?result === check:operator === "!="?result !== check:operator === "^="?check && result.indexOf(check) === 0:operator === "*="?check && result.indexOf(check) > -1:operator === "$="?check && result.slice(-check.length) === check:operator === "~="?(" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1:operator === "|="?result === check || result.slice(0, check.length + 1) === check + "-":false;};}, "CHILD":function CHILD(type, what, argument, first, last){var simple=type.slice(0, 3) !== "nth", forward=type.slice(-4) !== "last", ofType=what === "of-type";return first === 1 && last === 0?function(elem){return !!elem.parentNode;}:function(elem, context, xml){var cache, outerCache, node, diff, nodeIndex, start, dir=simple !== forward?"nextSibling":"previousSibling", parent=elem.parentNode, name=ofType && elem.nodeName.toLowerCase(), useCache=!xml && !ofType;if(parent){if(simple){while(dir) {node = elem;while(node = node[dir]) {if(ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1){return false;}}start = dir = type === "only" && !start && "nextSibling";}return true;}start = [forward?parent.firstChild:parent.lastChild];if(forward && useCache){outerCache = parent[expando] || (parent[expando] = {});cache = outerCache[type] || [];nodeIndex = cache[0] === dirruns && cache[1];diff = cache[0] === dirruns && cache[2];node = nodeIndex && parent.childNodes[nodeIndex];while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if(node.nodeType === 1 && ++diff && node === elem){outerCache[type] = [dirruns, nodeIndex, diff];break;}}}else if(useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns){diff = cache[1];}else {while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if((ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1) && ++diff){if(useCache){(node[expando] || (node[expando] = {}))[type] = [dirruns, diff];}if(node === elem){break;}}}}diff -= last;return diff === first || diff % first === 0 && diff / first >= 0;}};}, "PSEUDO":function PSEUDO(pseudo, argument){var args, fn=Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);if(fn[expando]){return fn(argument);}if(fn.length > 1){args = [pseudo, pseudo, "", argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed, matches){var idx, matched=fn(seed, argument), i=matched.length;while(i--) {idx = indexOf(seed, matched[i]);seed[idx] = !(matches[idx] = matched[i]);}}):function(elem){return fn(elem, 0, args);};}return fn;}}, pseudos:{"not":markFunction(function(selector){var input=[], results=[], matcher=compile(selector.replace(rtrim, "$1"));return matcher[expando]?markFunction(function(seed, matches, context, xml){var elem, unmatched=matcher(seed, null, xml, []), i=seed.length;while(i--) {if(elem = unmatched[i]){seed[i] = !(matches[i] = elem);}}}):function(elem, context, xml){input[0] = elem;matcher(input, null, xml, results);input[0] = null;return !results.pop();};}), "has":markFunction(function(selector){return function(elem){return Sizzle(selector, elem).length > 0;};}), "contains":markFunction(function(text){text = text.replace(runescape, funescape);return function(elem){return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;};}), "lang":markFunction(function(lang){if(!ridentifier.test(lang || "")){Sizzle.error("unsupported lang: " + lang);}lang = lang.replace(runescape, funescape).toLowerCase();return function(elem){var elemLang;do {if(elemLang = documentIsHTML?elem.lang:elem.getAttribute("xml:lang") || elem.getAttribute("lang")){elemLang = elemLang.toLowerCase();return elemLang === lang || elemLang.indexOf(lang + "-") === 0;}}while((elem = elem.parentNode) && elem.nodeType === 1);return false;};}), "target":function target(elem){var hash=window.location && window.location.hash;return hash && hash.slice(1) === elem.id;}, "root":function root(elem){return elem === docElem;}, "focus":function focus(elem){return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);}, "enabled":function enabled(elem){return elem.disabled === false;}, "disabled":function disabled(elem){return elem.disabled === true;}, "checked":function checked(elem){var nodeName=elem.nodeName.toLowerCase();return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;}, "selected":function selected(elem){if(elem.parentNode){elem.parentNode.selectedIndex;}return elem.selected === true;}, "empty":function empty(elem){for(elem = elem.firstChild; elem; elem = elem.nextSibling) {if(elem.nodeType < 6){return false;}}return true;}, "parent":function parent(elem){return !Expr.pseudos["empty"](elem);}, "header":function header(elem){return rheader.test(elem.nodeName);}, "input":function input(elem){return rinputs.test(elem.nodeName);}, "button":function button(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === "button" || name === "button";}, "text":function text(elem){var attr;return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");}, "first":createPositionalPseudo(function(){return [0];}), "last":createPositionalPseudo(function(matchIndexes, length){return [length - 1];}), "eq":createPositionalPseudo(function(matchIndexes, length, argument){return [argument < 0?argument + length:argument];}), "even":createPositionalPseudo(function(matchIndexes, length){var i=0;for(; i < length; i += 2) {matchIndexes.push(i);}return matchIndexes;}), "odd":createPositionalPseudo(function(matchIndexes, length){var i=1;for(; i < length; i += 2) {matchIndexes.push(i);}return matchIndexes;}), "lt":createPositionalPseudo(function(matchIndexes, length, argument){var i=argument < 0?argument + length:argument;for(; --i >= 0;) {matchIndexes.push(i);}return matchIndexes;}), "gt":createPositionalPseudo(function(matchIndexes, length, argument){var i=argument < 0?argument + length:argument;for(; ++i < length;) {matchIndexes.push(i);}return matchIndexes;})}};Expr.pseudos["nth"] = Expr.pseudos["eq"];for(i in {radio:true, checkbox:true, file:true, password:true, image:true}) {Expr.pseudos[i] = createInputPseudo(i);}for(i in {submit:true, reset:true}) {Expr.pseudos[i] = createButtonPseudo(i);}function setFilters(){}setFilters.prototype = Expr.filters = Expr.pseudos;Expr.setFilters = new setFilters();tokenize = Sizzle.tokenize = function(selector, parseOnly){var matched, match, tokens, type, soFar, groups, preFilters, cached=tokenCache[selector + " "];if(cached){return parseOnly?0:cached.slice(0);}soFar = selector;groups = [];preFilters = Expr.preFilter;while(soFar) {if(!matched || (match = rcomma.exec(soFar))){if(match){soFar = soFar.slice(match[0].length) || soFar;}groups.push(tokens = []);}matched = false;if(match = rcombinators.exec(soFar)){matched = match.shift();tokens.push({value:matched, type:match[0].replace(rtrim, " ")});soFar = soFar.slice(matched.length);}for(type in Expr.filter) {if((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))){matched = match.shift();tokens.push({value:matched, type:type, matches:match});soFar = soFar.slice(matched.length);}}if(!matched){break;}}return parseOnly?soFar.length:soFar?Sizzle.error(selector):tokenCache(selector, groups).slice(0);};function toSelector(tokens){var i=0, len=tokens.length, selector="";for(; i < len; i++) {selector += tokens[i].value;}return selector;}function addCombinator(matcher, combinator, base){var dir=combinator.dir, checkNonElements=base && dir === "parentNode", doneName=done++;return combinator.first?function(elem, context, xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){return matcher(elem, context, xml);}}}:function(elem, context, xml){var oldCache, outerCache, newCache=[dirruns, doneName];if(xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){if(matcher(elem, context, xml)){return true;}}}}else {while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){outerCache = elem[expando] || (elem[expando] = {});if((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName){return newCache[2] = oldCache[2];}else {outerCache[dir] = newCache;if(newCache[2] = matcher(elem, context, xml)){return true;}}}}}};}function elementMatcher(matchers){return matchers.length > 1?function(elem, context, xml){var i=matchers.length;while(i--) {if(!matchers[i](elem, context, xml)){return false;}}return true;}:matchers[0];}function multipleContexts(selector, contexts, results){var i=0, len=contexts.length;for(; i < len; i++) {Sizzle(selector, contexts[i], results);}return results;}function condense(unmatched, map, filter, context, xml){var elem, newUnmatched=[], i=0, len=unmatched.length, mapped=map != null;for(; i < len; i++) {if(elem = unmatched[i]){if(!filter || filter(elem, context, xml)){newUnmatched.push(elem);if(mapped){map.push(i);}}}}return newUnmatched;}function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector){if(postFilter && !postFilter[expando]){postFilter = setMatcher(postFilter);}if(postFinder && !postFinder[expando]){postFinder = setMatcher(postFinder, postSelector);}return markFunction(function(seed, results, context, xml){var temp, i, elem, preMap=[], postMap=[], preexisting=results.length, elems=seed || multipleContexts(selector || "*", context.nodeType?[context]:context, []), matcherIn=preFilter && (seed || !selector)?condense(elems, preMap, preFilter, context, xml):elems, matcherOut=matcher?postFinder || (seed?preFilter:preexisting || postFilter)?[]:results:matcherIn;if(matcher){matcher(matcherIn, matcherOut, context, xml);}if(postFilter){temp = condense(matcherOut, postMap);postFilter(temp, [], context, xml);i = temp.length;while(i--) {if(elem = temp[i]){matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);}}}if(seed){if(postFinder || preFilter){if(postFinder){temp = [];i = matcherOut.length;while(i--) {if(elem = matcherOut[i]){temp.push(matcherIn[i] = elem);}}postFinder(null, matcherOut = [], temp, xml);}i = matcherOut.length;while(i--) {if((elem = matcherOut[i]) && (temp = postFinder?indexOf(seed, elem):preMap[i]) > -1){seed[temp] = !(results[temp] = elem);}}}}else {matcherOut = condense(matcherOut === results?matcherOut.splice(preexisting, matcherOut.length):matcherOut);if(postFinder){postFinder(null, results, matcherOut, xml);}else {push.apply(results, matcherOut);}}});}function matcherFromTokens(tokens){var checkContext, matcher, j, len=tokens.length, leadingRelative=Expr.relative[tokens[0].type], implicitRelative=leadingRelative || Expr.relative[" "], i=leadingRelative?1:0, matchContext=addCombinator(function(elem){return elem === checkContext;}, implicitRelative, true), matchAnyContext=addCombinator(function(elem){return indexOf(checkContext, elem) > -1;}, implicitRelative, true), matchers=[function(elem, context, xml){var ret=!leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType?matchContext(elem, context, xml):matchAnyContext(elem, context, xml));checkContext = null;return ret;}];for(; i < len; i++) {if(matcher = Expr.relative[tokens[i].type]){matchers = [addCombinator(elementMatcher(matchers), matcher)];}else {matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);if(matcher[expando]){j = ++i;for(; j < len; j++) {if(Expr.relative[tokens[j].type]){break;}}return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({value:tokens[i - 2].type === " "?"*":""})).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));}matchers.push(matcher);}}return elementMatcher(matchers);}function matcherFromGroupMatchers(elementMatchers, setMatchers){var bySet=setMatchers.length > 0, byElement=elementMatchers.length > 0, superMatcher=function superMatcher(seed, context, xml, results, outermost){var elem, j, matcher, matchedCount=0, i="0", unmatched=seed && [], setMatched=[], contextBackup=outermostContext, elems=seed || byElement && Expr.find["TAG"]("*", outermost), dirrunsUnique=dirruns += contextBackup == null?1:Math.random() || 0.1, len=elems.length;if(outermost){outermostContext = context !== document && context;}for(; i !== len && (elem = elems[i]) != null; i++) {if(byElement && elem){j = 0;while(matcher = elementMatchers[j++]) {if(matcher(elem, context, xml)){results.push(elem);break;}}if(outermost){dirruns = dirrunsUnique;}}if(bySet){if(elem = !matcher && elem){matchedCount--;}if(seed){unmatched.push(elem);}}}matchedCount += i;if(bySet && i !== matchedCount){j = 0;while(matcher = setMatchers[j++]) {matcher(unmatched, setMatched, context, xml);}if(seed){if(matchedCount > 0){while(i--) {if(!(unmatched[i] || setMatched[i])){setMatched[i] = pop.call(results);}}}setMatched = condense(setMatched);}push.apply(results, setMatched);if(outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1){Sizzle.uniqueSort(results);}}if(outermost){dirruns = dirrunsUnique;outermostContext = contextBackup;}return unmatched;};return bySet?markFunction(superMatcher):superMatcher;}compile = Sizzle.compile = function(selector, match){var i, setMatchers=[], elementMatchers=[], cached=compilerCache[selector + " "];if(!cached){if(!match){match = tokenize(selector);}i = match.length;while(i--) {cached = matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached);}else {elementMatchers.push(cached);}}cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));cached.selector = selector;}return cached;};select = Sizzle.select = function(selector, context, results, seed){var i, tokens, token, type, find, compiled=typeof selector === "function" && selector, match=!seed && tokenize(selector = compiled.selector || selector);results = results || [];if(match.length === 1){tokens = match[0] = match[0].slice(0);if(tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]){context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];if(!context){return results;}else if(compiled){context = context.parentNode;}selector = selector.slice(tokens.shift().value.length);}i = matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--) {token = tokens[i];if(Expr.relative[type = token.type]){break;}if(find = Expr.find[type]){if(seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)){tokens.splice(i, 1);selector = seed.length && toSelector(tokens);if(!selector){push.apply(results, seed);return results;}break;}}}}(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, rsibling.test(selector) && testContext(context.parentNode) || context);return results;};support.sortStable = expando.split("").sort(sortOrder).join("") === expando;support.detectDuplicates = !!hasDuplicate;setDocument();support.sortDetached = assert(function(div1){return div1.compareDocumentPosition(document.createElement("div")) & 1;});if(!assert(function(div){div.innerHTML = "<a href='#'></a>";return div.firstChild.getAttribute("href") === "#";})){addHandle("type|href|height|width", function(elem, name, isXML){if(!isXML){return elem.getAttribute(name, name.toLowerCase() === "type"?1:2);}});}if(!support.attributes || !assert(function(div){div.innerHTML = "<input/>";div.firstChild.setAttribute("value", "");return div.firstChild.getAttribute("value") === "";})){addHandle("value", function(elem, name, isXML){if(!isXML && elem.nodeName.toLowerCase() === "input"){return elem.defaultValue;}});}if(!assert(function(div){return div.getAttribute("disabled") == null;})){addHandle(booleans, function(elem, name, isXML){var val;if(!isXML){return elem[name] === true?name.toLowerCase():(val = elem.getAttributeNode(name)) && val.specified?val.value:null;}});}return Sizzle;})(window);jQuery.find = Sizzle;jQuery.expr = Sizzle.selectors;jQuery.expr[":"] = jQuery.expr.pseudos;jQuery.unique = Sizzle.uniqueSort;jQuery.text = Sizzle.getText;jQuery.isXMLDoc = Sizzle.isXML;jQuery.contains = Sizzle.contains;var rneedsContext=jQuery.expr.match.needsContext;var rsingleTag=/^<(\w+)\s*\/?>(?:<\/\1>|)$/;var risSimple=/^.[^:#\[\.,]*$/;function winnow(elements, qualifier, not){if(jQuery.isFunction(qualifier)){return jQuery.grep(elements, function(elem, i){return !!qualifier.call(elem, i, elem) !== not;});}if(qualifier.nodeType){return jQuery.grep(elements, function(elem){return elem === qualifier !== not;});}if(typeof qualifier === "string"){if(risSimple.test(qualifier)){return jQuery.filter(qualifier, elements, not);}qualifier = jQuery.filter(qualifier, elements);}return jQuery.grep(elements, function(elem){return indexOf.call(qualifier, elem) >= 0 !== not;});}jQuery.filter = function(expr, elems, not){var elem=elems[0];if(not){expr = ":not(" + expr + ")";}return elems.length === 1 && elem.nodeType === 1?jQuery.find.matchesSelector(elem, expr)?[elem]:[]:jQuery.find.matches(expr, jQuery.grep(elems, function(elem){return elem.nodeType === 1;}));};jQuery.fn.extend({find:function find(selector){var i, len=this.length, ret=[], self=this;if(typeof selector !== "string"){return this.pushStack(jQuery(selector).filter(function(){for(i = 0; i < len; i++) {if(jQuery.contains(self[i], this)){return true;}}}));}for(i = 0; i < len; i++) {jQuery.find(selector, self[i], ret);}ret = this.pushStack(len > 1?jQuery.unique(ret):ret);ret.selector = this.selector?this.selector + " " + selector:selector;return ret;}, filter:function filter(selector){return this.pushStack(winnow(this, selector || [], false));}, not:function not(selector){return this.pushStack(winnow(this, selector || [], true));}, is:function is(selector){return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector)?jQuery(selector):selector || [], false).length;}});var rootjQuery, rquickExpr=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, init=jQuery.fn.init = function(selector, context){var match, elem;if(!selector){return this;}if(typeof selector === "string"){if(selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3){match = [null, selector, null];}else {match = rquickExpr.exec(selector);}if(match && (match[1] || !context)){if(match[1]){context = context instanceof jQuery?context[0]:context;jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType?context.ownerDocument || context:document, true));if(rsingleTag.test(match[1]) && jQuery.isPlainObject(context)){for(match in context) {if(jQuery.isFunction(this[match])){this[match](context[match]);}else {this.attr(match, context[match]);}}}return this;}else {elem = document.getElementById(match[2]);if(elem && elem.parentNode){this.length = 1;this[0] = elem;}this.context = document;this.selector = selector;return this;}}else if(!context || context.jquery){return (context || rootjQuery).find(selector);}else {return this.constructor(context).find(selector);}}else if(selector.nodeType){this.context = this[0] = selector;this.length = 1;return this;}else if(jQuery.isFunction(selector)){return typeof rootjQuery.ready !== "undefined"?rootjQuery.ready(selector):selector(jQuery);}if(selector.selector !== undefined){this.selector = selector.selector;this.context = selector.context;}return jQuery.makeArray(selector, this);};init.prototype = jQuery.fn;rootjQuery = jQuery(document);var rparentsprev=/^(?:parents|prev(?:Until|All))/, guaranteedUnique={children:true, contents:true, next:true, prev:true};jQuery.extend({dir:function dir(elem, _dir, until){var matched=[], truncate=until !== undefined;while((elem = elem[_dir]) && elem.nodeType !== 9) {if(elem.nodeType === 1){if(truncate && jQuery(elem).is(until)){break;}matched.push(elem);}}return matched;}, sibling:function sibling(n, elem){var matched=[];for(; n; n = n.nextSibling) {if(n.nodeType === 1 && n !== elem){matched.push(n);}}return matched;}});jQuery.fn.extend({has:function has(target){var targets=jQuery(target, this), l=targets.length;return this.filter(function(){var i=0;for(; i < l; i++) {if(jQuery.contains(this, targets[i])){return true;}}});}, closest:function closest(selectors, context){var cur, i=0, l=this.length, matched=[], pos=rneedsContext.test(selectors) || typeof selectors !== "string"?jQuery(selectors, context || this.context):0;for(; i < l; i++) {for(cur = this[i]; cur && cur !== context; cur = cur.parentNode) {if(cur.nodeType < 11 && (pos?pos.index(cur) > -1:cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))){matched.push(cur);break;}}}return this.pushStack(matched.length > 1?jQuery.unique(matched):matched);}, index:function index(elem){if(!elem){return this[0] && this[0].parentNode?this.first().prevAll().length:-1;}if(typeof elem === "string"){return indexOf.call(jQuery(elem), this[0]);}return indexOf.call(this, elem.jquery?elem[0]:elem);}, add:function add(selector, context){return this.pushStack(jQuery.unique(jQuery.merge(this.get(), jQuery(selector, context))));}, addBack:function addBack(selector){return this.add(selector == null?this.prevObject:this.prevObject.filter(selector));}});function sibling(cur, dir){while((cur = cur[dir]) && cur.nodeType !== 1) {}return cur;}jQuery.each({parent:function parent(elem){var parent=elem.parentNode;return parent && parent.nodeType !== 11?parent:null;}, parents:function parents(elem){return jQuery.dir(elem, "parentNode");}, parentsUntil:function parentsUntil(elem, i, until){return jQuery.dir(elem, "parentNode", until);}, next:function next(elem){return sibling(elem, "nextSibling");}, prev:function prev(elem){return sibling(elem, "previousSibling");}, nextAll:function nextAll(elem){return jQuery.dir(elem, "nextSibling");}, prevAll:function prevAll(elem){return jQuery.dir(elem, "previousSibling");}, nextUntil:function nextUntil(elem, i, until){return jQuery.dir(elem, "nextSibling", until);}, prevUntil:function prevUntil(elem, i, until){return jQuery.dir(elem, "previousSibling", until);}, siblings:function siblings(elem){return jQuery.sibling((elem.parentNode || {}).firstChild, elem);}, children:function children(elem){return jQuery.sibling(elem.firstChild);}, contents:function contents(elem){return elem.contentDocument || jQuery.merge([], elem.childNodes);}}, function(name, fn){jQuery.fn[name] = function(until, selector){var matched=jQuery.map(this, fn, until);if(name.slice(-5) !== "Until"){selector = until;}if(selector && typeof selector === "string"){matched = jQuery.filter(selector, matched);}if(this.length > 1){if(!guaranteedUnique[name]){jQuery.unique(matched);}if(rparentsprev.test(name)){matched.reverse();}}return this.pushStack(matched);};});var rnotwhite=/\S+/g;var optionsCache={};function createOptions(options){var object=optionsCache[options] = {};jQuery.each(options.match(rnotwhite) || [], function(_, flag){object[flag] = true;});return object;}jQuery.Callbacks = function(options){options = typeof options === "string"?optionsCache[options] || createOptions(options):jQuery.extend({}, options);var memory, _fired, firing, firingStart, firingLength, firingIndex, list=[], stack=!options.once && [], fire=function fire(data){memory = options.memory && data;_fired = true;firingIndex = firingStart || 0;firingStart = 0;firingLength = list.length;firing = true;for(; list && firingIndex < firingLength; firingIndex++) {if(list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse){memory = false;break;}}firing = false;if(list){if(stack){if(stack.length){fire(stack.shift());}}else if(memory){list = [];}else {self.disable();}}}, self={add:function add(){if(list){var start=list.length;(function add(args){jQuery.each(args, function(_, arg){var type=jQuery.type(arg);if(type === "function"){if(!options.unique || !self.has(arg)){list.push(arg);}}else if(arg && arg.length && type !== "string"){add(arg);}});})(arguments);if(firing){firingLength = list.length;}else if(memory){firingStart = start;fire(memory);}}return this;}, remove:function remove(){if(list){jQuery.each(arguments, function(_, arg){var index;while((index = jQuery.inArray(arg, list, index)) > -1) {list.splice(index, 1);if(firing){if(index <= firingLength){firingLength--;}if(index <= firingIndex){firingIndex--;}}}});}return this;}, has:function has(fn){return fn?jQuery.inArray(fn, list) > -1:!!(list && list.length);}, empty:function empty(){list = [];firingLength = 0;return this;}, disable:function disable(){list = stack = memory = undefined;return this;}, disabled:function disabled(){return !list;}, lock:function lock(){stack = undefined;if(!memory){self.disable();}return this;}, locked:function locked(){return !stack;}, fireWith:function fireWith(context, args){if(list && (!_fired || stack)){args = args || [];args = [context, args.slice?args.slice():args];if(firing){stack.push(args);}else {fire(args);}}return this;}, fire:function fire(){self.fireWith(this, arguments);return this;}, fired:function fired(){return !!_fired;}};return self;};jQuery.extend({Deferred:function Deferred(func){var tuples=[["resolve", "done", jQuery.Callbacks("once memory"), "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"], ["notify", "progress", jQuery.Callbacks("memory")]], _state="pending", _promise={state:function state(){return _state;}, always:function always(){deferred.done(arguments).fail(arguments);return this;}, then:function then(){var fns=arguments;return jQuery.Deferred(function(newDefer){jQuery.each(tuples, function(i, tuple){var fn=jQuery.isFunction(fns[i]) && fns[i];deferred[tuple[1]](function(){var returned=fn && fn.apply(this, arguments);if(returned && jQuery.isFunction(returned.promise)){returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);}else {newDefer[tuple[0] + "With"](this === _promise?newDefer.promise():this, fn?[returned]:arguments);}});});fns = null;}).promise();}, promise:function promise(obj){return obj != null?jQuery.extend(obj, _promise):_promise;}}, deferred={};_promise.pipe = _promise.then;jQuery.each(tuples, function(i, tuple){var list=tuple[2], stateString=tuple[3];_promise[tuple[1]] = list.add;if(stateString){list.add(function(){_state = stateString;}, tuples[i ^ 1][2].disable, tuples[2][2].lock);}deferred[tuple[0]] = function(){deferred[tuple[0] + "With"](this === deferred?_promise:this, arguments);return this;};deferred[tuple[0] + "With"] = list.fireWith;});_promise.promise(deferred);if(func){func.call(deferred, deferred);}return deferred;}, when:function when(subordinate){var i=0, resolveValues=_slice.call(arguments), length=resolveValues.length, remaining=length !== 1 || subordinate && jQuery.isFunction(subordinate.promise)?length:0, deferred=remaining === 1?subordinate:jQuery.Deferred(), updateFunc=function updateFunc(i, contexts, values){return function(value){contexts[i] = this;values[i] = arguments.length > 1?_slice.call(arguments):value;if(values === progressValues){deferred.notifyWith(contexts, values);}else if(! --remaining){deferred.resolveWith(contexts, values);}};}, progressValues, progressContexts, resolveContexts;if(length > 1){progressValues = new Array(length);progressContexts = new Array(length);resolveContexts = new Array(length);for(; i < length; i++) {if(resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)){resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues));}else {--remaining;}}}if(!remaining){deferred.resolveWith(resolveContexts, resolveValues);}return deferred.promise();}});var readyList;jQuery.fn.ready = function(fn){jQuery.ready.promise().done(fn);return this;};jQuery.extend({isReady:false, readyWait:1, holdReady:function holdReady(hold){if(hold){jQuery.readyWait++;}else {jQuery.ready(true);}}, ready:function ready(wait){if(wait === true?--jQuery.readyWait:jQuery.isReady){return;}jQuery.isReady = true;if(wait !== true && --jQuery.readyWait > 0){return;}readyList.resolveWith(document, [jQuery]);if(jQuery.fn.triggerHandler){jQuery(document).triggerHandler("ready");jQuery(document).off("ready");}}});function completed(){document.removeEventListener("DOMContentLoaded", completed, false);window.removeEventListener("load", completed, false);jQuery.ready();}jQuery.ready.promise = function(obj){if(!readyList){readyList = jQuery.Deferred();if(document.readyState === "complete"){setTimeout(jQuery.ready);}else {document.addEventListener("DOMContentLoaded", completed, false);window.addEventListener("load", completed, false);}}return readyList.promise(obj);};jQuery.ready.promise();var access=jQuery.access = function(elems, fn, key, value, chainable, emptyGet, raw){var i=0, len=elems.length, bulk=key == null;if(jQuery.type(key) === "object"){chainable = true;for(i in key) {jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);}}else if(value !== undefined){chainable = true;if(!jQuery.isFunction(value)){raw = true;}if(bulk){if(raw){fn.call(elems, value);fn = null;}else {bulk = fn;fn = function(elem, key, value){return bulk.call(jQuery(elem), value);};}}if(fn){for(; i < len; i++) {fn(elems[i], key, raw?value:value.call(elems[i], i, fn(elems[i], key)));}}}return chainable?elems:bulk?fn.call(elems):len?fn(elems[0], key):emptyGet;};jQuery.acceptData = function(owner){return owner.nodeType === 1 || owner.nodeType === 9 || ! +owner.nodeType;};function Data(){Object.defineProperty(this.cache = {}, 0, {get:function get(){return {};}});this.expando = jQuery.expando + Data.uid++;}Data.uid = 1;Data.accepts = jQuery.acceptData;Data.prototype = {key:function key(owner){if(!Data.accepts(owner)){return 0;}var descriptor={}, unlock=owner[this.expando];if(!unlock){unlock = Data.uid++;try{descriptor[this.expando] = {value:unlock};Object.defineProperties(owner, descriptor);}catch(e) {descriptor[this.expando] = unlock;jQuery.extend(owner, descriptor);}}if(!this.cache[unlock]){this.cache[unlock] = {};}return unlock;}, set:function set(owner, data, value){var prop, unlock=this.key(owner), cache=this.cache[unlock];if(typeof data === "string"){cache[data] = value;}else {if(jQuery.isEmptyObject(cache)){jQuery.extend(this.cache[unlock], data);}else {for(prop in data) {cache[prop] = data[prop];}}}return cache;}, get:function get(owner, key){var cache=this.cache[this.key(owner)];return key === undefined?cache:cache[key];}, access:function access(owner, key, value){var stored;if(key === undefined || key && typeof key === "string" && value === undefined){stored = this.get(owner, key);return stored !== undefined?stored:this.get(owner, jQuery.camelCase(key));}this.set(owner, key, value);return value !== undefined?value:key;}, remove:function remove(owner, key){var i, name, camel, unlock=this.key(owner), cache=this.cache[unlock];if(key === undefined){this.cache[unlock] = {};}else {if(jQuery.isArray(key)){name = key.concat(key.map(jQuery.camelCase));}else {camel = jQuery.camelCase(key);if(key in cache){name = [key, camel];}else {name = camel;name = name in cache?[name]:name.match(rnotwhite) || [];}}i = name.length;while(i--) {delete cache[name[i]];}}}, hasData:function hasData(owner){return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});}, discard:function discard(owner){if(owner[this.expando]){delete this.cache[owner[this.expando]];}}};var data_priv=new Data();var data_user=new Data();var rbrace=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash=/([A-Z])/g;function dataAttr(elem, key, data){var name;if(data === undefined && elem.nodeType === 1){name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();data = elem.getAttribute(name);if(typeof data === "string"){try{data = data === "true"?true:data === "false"?false:data === "null"?null:+data + "" === data?+data:rbrace.test(data)?jQuery.parseJSON(data):data;}catch(e) {}data_user.set(elem, key, data);}else {data = undefined;}}return data;}jQuery.extend({hasData:function hasData(elem){return data_user.hasData(elem) || data_priv.hasData(elem);}, data:function data(elem, name, _data){return data_user.access(elem, name, _data);}, removeData:function removeData(elem, name){data_user.remove(elem, name);}, _data:function _data(elem, name, data){return data_priv.access(elem, name, data);}, _removeData:function _removeData(elem, name){data_priv.remove(elem, name);}});jQuery.fn.extend({data:function data(key, value){var i, name, data, elem=this[0], attrs=elem && elem.attributes;if(key === undefined){if(this.length){data = data_user.get(elem);if(elem.nodeType === 1 && !data_priv.get(elem, "hasDataAttrs")){i = attrs.length;while(i--) {if(attrs[i]){name = attrs[i].name;if(name.indexOf("data-") === 0){name = jQuery.camelCase(name.slice(5));dataAttr(elem, name, data[name]);}}}data_priv.set(elem, "hasDataAttrs", true);}}return data;}if(typeof key === "object"){return this.each(function(){data_user.set(this, key);});}return access(this, function(value){var data, camelKey=jQuery.camelCase(key);if(elem && value === undefined){data = data_user.get(elem, key);if(data !== undefined){return data;}data = data_user.get(elem, camelKey);if(data !== undefined){return data;}data = dataAttr(elem, camelKey, undefined);if(data !== undefined){return data;}return;}this.each(function(){var data=data_user.get(this, camelKey);data_user.set(this, camelKey, value);if(key.indexOf("-") !== -1 && data !== undefined){data_user.set(this, key, value);}});}, null, value, arguments.length > 1, null, true);}, removeData:function removeData(key){return this.each(function(){data_user.remove(this, key);});}});jQuery.extend({queue:function queue(elem, type, data){var queue;if(elem){type = (type || "fx") + "queue";queue = data_priv.get(elem, type);if(data){if(!queue || jQuery.isArray(data)){queue = data_priv.access(elem, type, jQuery.makeArray(data));}else {queue.push(data);}}return queue || [];}}, dequeue:function dequeue(elem, type){type = type || "fx";var queue=jQuery.queue(elem, type), startLength=queue.length, fn=queue.shift(), hooks=jQuery._queueHooks(elem, type), next=function next(){jQuery.dequeue(elem, type);};if(fn === "inprogress"){fn = queue.shift();startLength--;}if(fn){if(type === "fx"){queue.unshift("inprogress");}delete hooks.stop;fn.call(elem, next, hooks);}if(!startLength && hooks){hooks.empty.fire();}}, _queueHooks:function _queueHooks(elem, type){var key=type + "queueHooks";return data_priv.get(elem, key) || data_priv.access(elem, key, {empty:jQuery.Callbacks("once memory").add(function(){data_priv.remove(elem, [type + "queue", key]);})});}});jQuery.fn.extend({queue:function queue(type, data){var setter=2;if(typeof type !== "string"){data = type;type = "fx";setter--;}if(arguments.length < setter){return jQuery.queue(this[0], type);}return data === undefined?this:this.each(function(){var queue=jQuery.queue(this, type, data);jQuery._queueHooks(this, type);if(type === "fx" && queue[0] !== "inprogress"){jQuery.dequeue(this, type);}});}, dequeue:function dequeue(type){return this.each(function(){jQuery.dequeue(this, type);});}, clearQueue:function clearQueue(type){return this.queue(type || "fx", []);}, promise:function promise(type, obj){var tmp, count=1, defer=jQuery.Deferred(), elements=this, i=this.length, resolve=function resolve(){if(! --count){defer.resolveWith(elements, [elements]);}};if(typeof type !== "string"){obj = type;type = undefined;}type = type || "fx";while(i--) {tmp = data_priv.get(elements[i], type + "queueHooks");if(tmp && tmp.empty){count++;tmp.empty.add(resolve);}}resolve();return defer.promise(obj);}});var pnum=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;var cssExpand=["Top", "Right", "Bottom", "Left"];var isHidden=function isHidden(elem, el){elem = el || elem;return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);};var rcheckableType=/^(?:checkbox|radio)$/i;(function(){var fragment=document.createDocumentFragment(), div=fragment.appendChild(document.createElement("div")), input=document.createElement("input");input.setAttribute("type", "radio");input.setAttribute("checked", "checked");input.setAttribute("name", "t");div.appendChild(input);support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;div.innerHTML = "<textarea>x</textarea>";support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;})();var strundefined=typeof undefined;support.focusinBubbles = "onfocusin" in window;var rkeyEvent=/^key/, rmouseEvent=/^(?:mouse|pointer|contextmenu)|click/, rfocusMorph=/^(?:focusinfocus|focusoutblur)$/, rtypenamespace=/^([^.]*)(?:\.(.+)|)$/;function returnTrue(){return true;}function returnFalse(){return false;}function safeActiveElement(){try{return document.activeElement;}catch(err) {}}jQuery.event = {global:{}, add:function add(elem, types, handler, data, selector){var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData=data_priv.get(elem);if(!elemData){return;}if(handler.handler){handleObjIn = handler;handler = handleObjIn.handler;selector = handleObjIn.selector;}if(!handler.guid){handler.guid = jQuery.guid++;}if(!(events = elemData.events)){events = elemData.events = {};}if(!(eventHandle = elemData.handle)){eventHandle = elemData.handle = function(e){return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type?jQuery.event.dispatch.apply(elem, arguments):undefined;};}types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort();if(!type){continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;special = jQuery.event.special[type] || {};handleObj = jQuery.extend({type:type, origType:origType, data:data, handler:handler, guid:handler.guid, selector:selector, needsContext:selector && jQuery.expr.match.needsContext.test(selector), namespace:namespaces.join(".")}, handleObjIn);if(!(handlers = events[type])){handlers = events[type] = [];handlers.delegateCount = 0;if(!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false){if(elem.addEventListener){elem.addEventListener(type, eventHandle, false);}}}if(special.add){special.add.call(elem, handleObj);if(!handleObj.handler.guid){handleObj.handler.guid = handler.guid;}}if(selector){handlers.splice(handlers.delegateCount++, 0, handleObj);}else {handlers.push(handleObj);}jQuery.event.global[type] = true;}}, remove:function remove(elem, types, handler, selector, mappedTypes){var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData=data_priv.hasData(elem) && data_priv.get(elem);if(!elemData || !(events = elemData.events)){return;}types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort();if(!type){for(type in events) {jQuery.event.remove(elem, type + types[t], handler, selector, true);}continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;handlers = events[type] || [];tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");origCount = j = handlers.length;while(j--) {handleObj = handlers[j];if((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)){handlers.splice(j, 1);if(handleObj.selector){handlers.delegateCount--;}if(special.remove){special.remove.call(elem, handleObj);}}}if(origCount && !handlers.length){if(!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false){jQuery.removeEvent(elem, type, elemData.handle);}delete events[type];}}if(jQuery.isEmptyObject(events)){delete elemData.handle;data_priv.remove(elem, "events");}}, trigger:function trigger(event, data, elem, onlyHandlers){var i, cur, tmp, bubbleType, ontype, handle, special, eventPath=[elem || document], type=hasOwn.call(event, "type")?event.type:event, namespaces=hasOwn.call(event, "namespace")?event.namespace.split("."):[];cur = tmp = elem = elem || document;if(elem.nodeType === 3 || elem.nodeType === 8){return;}if(rfocusMorph.test(type + jQuery.event.triggered)){return;}if(type.indexOf(".") >= 0){namespaces = type.split(".");type = namespaces.shift();namespaces.sort();}ontype = type.indexOf(":") < 0 && "on" + type;event = event[jQuery.expando]?event:new jQuery.Event(type, typeof event === "object" && event);event.isTrigger = onlyHandlers?2:3;event.namespace = namespaces.join(".");event.namespace_re = event.namespace?new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"):null;event.result = undefined;if(!event.target){event.target = elem;}data = data == null?[event]:jQuery.makeArray(data, [event]);special = jQuery.event.special[type] || {};if(!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false){return;}if(!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)){bubbleType = special.delegateType || type;if(!rfocusMorph.test(bubbleType + type)){cur = cur.parentNode;}for(; cur; cur = cur.parentNode) {eventPath.push(cur);tmp = cur;}if(tmp === (elem.ownerDocument || document)){eventPath.push(tmp.defaultView || tmp.parentWindow || window);}}i = 0;while((cur = eventPath[i++]) && !event.isPropagationStopped()) {event.type = i > 1?bubbleType:special.bindType || type;handle = (data_priv.get(cur, "events") || {})[event.type] && data_priv.get(cur, "handle");if(handle){handle.apply(cur, data);}handle = ontype && cur[ontype];if(handle && handle.apply && jQuery.acceptData(cur)){event.result = handle.apply(cur, data);if(event.result === false){event.preventDefault();}}}event.type = type;if(!onlyHandlers && !event.isDefaultPrevented()){if((!special._default || special._default.apply(eventPath.pop(), data) === false) && jQuery.acceptData(elem)){if(ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)){tmp = elem[ontype];if(tmp){elem[ontype] = null;}jQuery.event.triggered = type;elem[type]();jQuery.event.triggered = undefined;if(tmp){elem[ontype] = tmp;}}}}return event.result;}, dispatch:function dispatch(event){event = jQuery.event.fix(event);var i, j, ret, matched, handleObj, handlerQueue=[], args=_slice.call(arguments), handlers=(data_priv.get(this, "events") || {})[event.type] || [], special=jQuery.event.special[event.type] || {};args[0] = event;event.delegateTarget = this;if(special.preDispatch && special.preDispatch.call(this, event) === false){return;}handlerQueue = jQuery.event.handlers.call(this, event, handlers);i = 0;while((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {event.currentTarget = matched.elem;j = 0;while((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {if(!event.namespace_re || event.namespace_re.test(handleObj.namespace)){event.handleObj = handleObj;event.data = handleObj.data;ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);if(ret !== undefined){if((event.result = ret) === false){event.preventDefault();event.stopPropagation();}}}}}if(special.postDispatch){special.postDispatch.call(this, event);}return event.result;}, handlers:function handlers(event, _handlers){var i, matches, sel, handleObj, handlerQueue=[], delegateCount=_handlers.delegateCount, cur=event.target;if(delegateCount && cur.nodeType && (!event.button || event.type !== "click")){for(; cur !== this; cur = cur.parentNode || this) {if(cur.disabled !== true || event.type !== "click"){matches = [];for(i = 0; i < delegateCount; i++) {handleObj = _handlers[i];sel = handleObj.selector + " ";if(matches[sel] === undefined){matches[sel] = handleObj.needsContext?jQuery(sel, this).index(cur) >= 0:jQuery.find(sel, this, null, [cur]).length;}if(matches[sel]){matches.push(handleObj);}}if(matches.length){handlerQueue.push({elem:cur, handlers:matches});}}}}if(delegateCount < _handlers.length){handlerQueue.push({elem:this, handlers:_handlers.slice(delegateCount)});}return handlerQueue;}, props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks:{}, keyHooks:{props:"char charCode key keyCode".split(" "), filter:function filter(event, original){if(event.which == null){event.which = original.charCode != null?original.charCode:original.keyCode;}return event;}}, mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter:function filter(event, original){var eventDoc, doc, body, button=original.button;if(event.pageX == null && original.clientX != null){eventDoc = event.target.ownerDocument || document;doc = eventDoc.documentElement;body = eventDoc.body;event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);}if(!event.which && button !== undefined){event.which = button & 1?1:button & 2?3:button & 4?2:0;}return event;}}, fix:function fix(event){if(event[jQuery.expando]){return event;}var i, prop, copy, type=event.type, originalEvent=event, fixHook=this.fixHooks[type];if(!fixHook){this.fixHooks[type] = fixHook = rmouseEvent.test(type)?this.mouseHooks:rkeyEvent.test(type)?this.keyHooks:{};}copy = fixHook.props?this.props.concat(fixHook.props):this.props;event = new jQuery.Event(originalEvent);i = copy.length;while(i--) {prop = copy[i];event[prop] = originalEvent[prop];}if(!event.target){event.target = document;}if(event.target.nodeType === 3){event.target = event.target.parentNode;}return fixHook.filter?fixHook.filter(event, originalEvent):event;}, special:{load:{noBubble:true}, focus:{trigger:function trigger(){if(this !== safeActiveElement() && this.focus){this.focus();return false;}}, delegateType:"focusin"}, blur:{trigger:function trigger(){if(this === safeActiveElement() && this.blur){this.blur();return false;}}, delegateType:"focusout"}, click:{trigger:function trigger(){if(this.type === "checkbox" && this.click && jQuery.nodeName(this, "input")){this.click();return false;}}, _default:function _default(event){return jQuery.nodeName(event.target, "a");}}, beforeunload:{postDispatch:function postDispatch(event){if(event.result !== undefined && event.originalEvent){event.originalEvent.returnValue = event.result;}}}}, simulate:function simulate(type, elem, event, bubble){var e=jQuery.extend(new jQuery.Event(), event, {type:type, isSimulated:true, originalEvent:{}});if(bubble){jQuery.event.trigger(e, null, elem);}else {jQuery.event.dispatch.call(elem, e);}if(e.isDefaultPrevented()){event.preventDefault();}}};jQuery.removeEvent = function(elem, type, handle){if(elem.removeEventListener){elem.removeEventListener(type, handle, false);}};jQuery.Event = function(src, props){if(!(this instanceof jQuery.Event)){return new jQuery.Event(src, props);}if(src && src.type){this.originalEvent = src;this.type = src.type;this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false?returnTrue:returnFalse;}else {this.type = src;}if(props){jQuery.extend(this, props);}this.timeStamp = src && src.timeStamp || jQuery.now();this[jQuery.expando] = true;};jQuery.Event.prototype = {isDefaultPrevented:returnFalse, isPropagationStopped:returnFalse, isImmediatePropagationStopped:returnFalse, preventDefault:function preventDefault(){var e=this.originalEvent;this.isDefaultPrevented = returnTrue;if(e && e.preventDefault){e.preventDefault();}}, stopPropagation:function stopPropagation(){var e=this.originalEvent;this.isPropagationStopped = returnTrue;if(e && e.stopPropagation){e.stopPropagation();}}, stopImmediatePropagation:function stopImmediatePropagation(){var e=this.originalEvent;this.isImmediatePropagationStopped = returnTrue;if(e && e.stopImmediatePropagation){e.stopImmediatePropagation();}this.stopPropagation();}};jQuery.each({mouseenter:"mouseover", mouseleave:"mouseout", pointerenter:"pointerover", pointerleave:"pointerout"}, function(orig, fix){jQuery.event.special[orig] = {delegateType:fix, bindType:fix, handle:function handle(event){var ret, target=this, related=event.relatedTarget, handleObj=event.handleObj;if(!related || related !== target && !jQuery.contains(target, related)){event.type = handleObj.origType;ret = handleObj.handler.apply(this, arguments);event.type = fix;}return ret;}};});if(!support.focusinBubbles){jQuery.each({focus:"focusin", blur:"focusout"}, function(orig, fix){var handler=function handler(event){jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), true);};jQuery.event.special[fix] = {setup:function setup(){var doc=this.ownerDocument || this, attaches=data_priv.access(doc, fix);if(!attaches){doc.addEventListener(orig, handler, true);}data_priv.access(doc, fix, (attaches || 0) + 1);}, teardown:function teardown(){var doc=this.ownerDocument || this, attaches=data_priv.access(doc, fix) - 1;if(!attaches){doc.removeEventListener(orig, handler, true);data_priv.remove(doc, fix);}else {data_priv.access(doc, fix, attaches);}}};});}jQuery.fn.extend({on:function on(types, selector, data, fn, one){var origFn, type;if(typeof types === "object"){if(typeof selector !== "string"){data = data || selector;selector = undefined;}for(type in types) {this.on(type, selector, data, types[type], one);}return this;}if(data == null && fn == null){fn = selector;data = selector = undefined;}else if(fn == null){if(typeof selector === "string"){fn = data;data = undefined;}else {fn = data;data = selector;selector = undefined;}}if(fn === false){fn = returnFalse;}else if(!fn){return this;}if(one === 1){origFn = fn;fn = function(event){jQuery().off(event);return origFn.apply(this, arguments);};fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);}return this.each(function(){jQuery.event.add(this, types, fn, data, selector);});}, one:function one(types, selector, data, fn){return this.on(types, selector, data, fn, 1);}, off:function off(types, selector, fn){var handleObj, type;if(types && types.preventDefault && types.handleObj){handleObj = types.handleObj;jQuery(types.delegateTarget).off(handleObj.namespace?handleObj.origType + "." + handleObj.namespace:handleObj.origType, handleObj.selector, handleObj.handler);return this;}if(typeof types === "object"){for(type in types) {this.off(type, selector, types[type]);}return this;}if(selector === false || typeof selector === "function"){fn = selector;selector = undefined;}if(fn === false){fn = returnFalse;}return this.each(function(){jQuery.event.remove(this, types, fn, selector);});}, trigger:function trigger(type, data){return this.each(function(){jQuery.event.trigger(type, data, this);});}, triggerHandler:function triggerHandler(type, data){var elem=this[0];if(elem){return jQuery.event.trigger(type, data, elem, true);}}});var rxhtmlTag=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, rtagName=/<([\w:]+)/, rhtml=/<|&#?\w+;/, rnoInnerhtml=/<(?:script|style|link)/i, rchecked=/checked\s*(?:[^=]|=\s*.checked.)/i, rscriptType=/^$|\/(?:java|ecma)script/i, rscriptTypeMasked=/^true\/(.*)/, rcleanScript=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, wrapMap={option:[1, "<select multiple='multiple'>", "</select>"], thead:[1, "<table>", "</table>"], col:[2, "<table><colgroup>", "</colgroup></table>"], tr:[2, "<table><tbody>", "</tbody></table>"], td:[3, "<table><tbody><tr>", "</tr></tbody></table>"], _default:[0, "", ""]};wrapMap.optgroup = wrapMap.option;wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;wrapMap.th = wrapMap.td;function manipulationTarget(elem, content){return jQuery.nodeName(elem, "table") && jQuery.nodeName(content.nodeType !== 11?content:content.firstChild, "tr")?elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")):elem;}function disableScript(elem){elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;return elem;}function restoreScript(elem){var match=rscriptTypeMasked.exec(elem.type);if(match){elem.type = match[1];}else {elem.removeAttribute("type");}return elem;}function setGlobalEval(elems, refElements){var i=0, l=elems.length;for(; i < l; i++) {data_priv.set(elems[i], "globalEval", !refElements || data_priv.get(refElements[i], "globalEval"));}}function cloneCopyEvent(src, dest){var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;if(dest.nodeType !== 1){return;}if(data_priv.hasData(src)){pdataOld = data_priv.access(src);pdataCur = data_priv.set(dest, pdataOld);events = pdataOld.events;if(events){delete pdataCur.handle;pdataCur.events = {};for(type in events) {for(i = 0, l = events[type].length; i < l; i++) {jQuery.event.add(dest, type, events[type][i]);}}}}if(data_user.hasData(src)){udataOld = data_user.access(src);udataCur = jQuery.extend({}, udataOld);data_user.set(dest, udataCur);}}function getAll(context, tag){var ret=context.getElementsByTagName?context.getElementsByTagName(tag || "*"):context.querySelectorAll?context.querySelectorAll(tag || "*"):[];return tag === undefined || tag && jQuery.nodeName(context, tag)?jQuery.merge([context], ret):ret;}function fixInput(src, dest){var nodeName=dest.nodeName.toLowerCase();if(nodeName === "input" && rcheckableType.test(src.type)){dest.checked = src.checked;}else if(nodeName === "input" || nodeName === "textarea"){dest.defaultValue = src.defaultValue;}}jQuery.extend({clone:function clone(elem, dataAndEvents, deepDataAndEvents){var i, l, srcElements, destElements, clone=elem.cloneNode(true), inPage=jQuery.contains(elem.ownerDocument, elem);if(!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)){destElements = getAll(clone);srcElements = getAll(elem);for(i = 0, l = srcElements.length; i < l; i++) {fixInput(srcElements[i], destElements[i]);}}if(dataAndEvents){if(deepDataAndEvents){srcElements = srcElements || getAll(elem);destElements = destElements || getAll(clone);for(i = 0, l = srcElements.length; i < l; i++) {cloneCopyEvent(srcElements[i], destElements[i]);}}else {cloneCopyEvent(elem, clone);}}destElements = getAll(clone, "script");if(destElements.length > 0){setGlobalEval(destElements, !inPage && getAll(elem, "script"));}return clone;}, buildFragment:function buildFragment(elems, context, scripts, selection){var elem, tmp, tag, wrap, contains, j, fragment=context.createDocumentFragment(), nodes=[], i=0, l=elems.length;for(; i < l; i++) {elem = elems[i];if(elem || elem === 0){if(jQuery.type(elem) === "object"){jQuery.merge(nodes, elem.nodeType?[elem]:elem);}else if(!rhtml.test(elem)){nodes.push(context.createTextNode(elem));}else {tmp = tmp || fragment.appendChild(context.createElement("div"));tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();wrap = wrapMap[tag] || wrapMap._default;tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2];j = wrap[0];while(j--) {tmp = tmp.lastChild;}jQuery.merge(nodes, tmp.childNodes);tmp = fragment.firstChild;tmp.textContent = "";}}}fragment.textContent = "";i = 0;while(elem = nodes[i++]) {if(selection && jQuery.inArray(elem, selection) !== -1){continue;}contains = jQuery.contains(elem.ownerDocument, elem);tmp = getAll(fragment.appendChild(elem), "script");if(contains){setGlobalEval(tmp);}if(scripts){j = 0;while(elem = tmp[j++]) {if(rscriptType.test(elem.type || "")){scripts.push(elem);}}}}return fragment;}, cleanData:function cleanData(elems){var data, elem, type, key, special=jQuery.event.special, i=0;for(; (elem = elems[i]) !== undefined; i++) {if(jQuery.acceptData(elem)){key = elem[data_priv.expando];if(key && (data = data_priv.cache[key])){if(data.events){for(type in data.events) {if(special[type]){jQuery.event.remove(elem, type);}else {jQuery.removeEvent(elem, type, data.handle);}}}if(data_priv.cache[key]){delete data_priv.cache[key];}}}delete data_user.cache[elem[data_user.expando]];}}});jQuery.fn.extend({text:function text(value){return access(this, function(value){return value === undefined?jQuery.text(this):this.empty().each(function(){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){this.textContent = value;}});}, null, value, arguments.length);}, append:function append(){return this.domManip(arguments, function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this, elem);target.appendChild(elem);}});}, prepend:function prepend(){return this.domManip(arguments, function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this, elem);target.insertBefore(elem, target.firstChild);}});}, before:function before(){return this.domManip(arguments, function(elem){if(this.parentNode){this.parentNode.insertBefore(elem, this);}});}, after:function after(){return this.domManip(arguments, function(elem){if(this.parentNode){this.parentNode.insertBefore(elem, this.nextSibling);}});}, remove:function remove(selector, keepData){var elem, elems=selector?jQuery.filter(selector, this):this, i=0;for(; (elem = elems[i]) != null; i++) {if(!keepData && elem.nodeType === 1){jQuery.cleanData(getAll(elem));}if(elem.parentNode){if(keepData && jQuery.contains(elem.ownerDocument, elem)){setGlobalEval(getAll(elem, "script"));}elem.parentNode.removeChild(elem);}}return this;}, empty:function empty(){var elem, i=0;for(; (elem = this[i]) != null; i++) {if(elem.nodeType === 1){jQuery.cleanData(getAll(elem, false));elem.textContent = "";}}return this;}, clone:function clone(dataAndEvents, deepDataAndEvents){dataAndEvents = dataAndEvents == null?false:dataAndEvents;deepDataAndEvents = deepDataAndEvents == null?dataAndEvents:deepDataAndEvents;return this.map(function(){return jQuery.clone(this, dataAndEvents, deepDataAndEvents);});}, html:function html(value){return access(this, function(value){var elem=this[0] || {}, i=0, l=this.length;if(value === undefined && elem.nodeType === 1){return elem.innerHTML;}if(typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]){value = value.replace(rxhtmlTag, "<$1></$2>");try{for(; i < l; i++) {elem = this[i] || {};if(elem.nodeType === 1){jQuery.cleanData(getAll(elem, false));elem.innerHTML = value;}}elem = 0;}catch(e) {}}if(elem){this.empty().append(value);}}, null, value, arguments.length);}, replaceWith:function replaceWith(){var arg=arguments[0];this.domManip(arguments, function(elem){arg = this.parentNode;jQuery.cleanData(getAll(this));if(arg){arg.replaceChild(elem, this);}});return arg && (arg.length || arg.nodeType)?this:this.remove();}, detach:function detach(selector){return this.remove(selector, true);}, domManip:function domManip(args, callback){args = concat.apply([], args);var fragment, first, scripts, hasScripts, node, doc, i=0, l=this.length, set=this, iNoClone=l - 1, value=args[0], isFunction=jQuery.isFunction(value);if(isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)){return this.each(function(index){var self=set.eq(index);if(isFunction){args[0] = value.call(this, index, self.html());}self.domManip(args, callback);});}if(l){fragment = jQuery.buildFragment(args, this[0].ownerDocument, false, this);first = fragment.firstChild;if(fragment.childNodes.length === 1){fragment = first;}if(first){scripts = jQuery.map(getAll(fragment, "script"), disableScript);hasScripts = scripts.length;for(; i < l; i++) {node = fragment;if(i !== iNoClone){node = jQuery.clone(node, true, true);if(hasScripts){jQuery.merge(scripts, getAll(node, "script"));}}callback.call(this[i], node, i);}if(hasScripts){doc = scripts[scripts.length - 1].ownerDocument;jQuery.map(scripts, restoreScript);for(i = 0; i < hasScripts; i++) {node = scripts[i];if(rscriptType.test(node.type || "") && !data_priv.access(node, "globalEval") && jQuery.contains(doc, node)){if(node.src){if(jQuery._evalUrl){jQuery._evalUrl(node.src);}}else {jQuery.globalEval(node.textContent.replace(rcleanScript, ""));}}}}}}return this;}});jQuery.each({appendTo:"append", prependTo:"prepend", insertBefore:"before", insertAfter:"after", replaceAll:"replaceWith"}, function(name, original){jQuery.fn[name] = function(selector){var elems, ret=[], insert=jQuery(selector), last=insert.length - 1, i=0;for(; i <= last; i++) {elems = i === last?this:this.clone(true);jQuery(insert[i])[original](elems);push.apply(ret, elems.get());}return this.pushStack(ret);};});var iframe, elemdisplay={};function actualDisplay(name, doc){var style, elem=jQuery(doc.createElement(name)).appendTo(doc.body), display=window.getDefaultComputedStyle && (style = window.getDefaultComputedStyle(elem[0]))?style.display:jQuery.css(elem[0], "display");elem.detach();return display;}function defaultDisplay(nodeName){var doc=document, display=elemdisplay[nodeName];if(!display){display = actualDisplay(nodeName, doc);if(display === "none" || !display){iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement);doc = iframe[0].contentDocument;doc.write();doc.close();display = actualDisplay(nodeName, doc);iframe.detach();}elemdisplay[nodeName] = display;}return display;}var rmargin=/^margin/;var rnumnonpx=new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");var getStyles=function getStyles(elem){if(elem.ownerDocument.defaultView.opener){return elem.ownerDocument.defaultView.getComputedStyle(elem, null);}return window.getComputedStyle(elem, null);};function curCSS(elem, name, computed){var width, minWidth, maxWidth, ret, style=elem.style;computed = computed || getStyles(elem);if(computed){ret = computed.getPropertyValue(name) || computed[name];}if(computed){if(ret === "" && !jQuery.contains(elem.ownerDocument, elem)){ret = jQuery.style(elem, name);}if(rnumnonpx.test(ret) && rmargin.test(name)){width = style.width;minWidth = style.minWidth;maxWidth = style.maxWidth;style.minWidth = style.maxWidth = style.width = ret;ret = computed.width;style.width = width;style.minWidth = minWidth;style.maxWidth = maxWidth;}}return ret !== undefined?ret + "":ret;}function addGetHookIf(conditionFn, hookFn){return {get:function get(){if(conditionFn()){delete this.get;return;}return (this.get = hookFn).apply(this, arguments);}};}(function(){var pixelPositionVal, boxSizingReliableVal, docElem=document.documentElement, container=document.createElement("div"), div=document.createElement("div");if(!div.style){return;}div.style.backgroundClip = "content-box";div.cloneNode(true).style.backgroundClip = "";support.clearCloneStyle = div.style.backgroundClip === "content-box";container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" + "position:absolute";container.appendChild(div);function computePixelPositionAndBoxSizingReliable(){div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" + "box-sizing:border-box;display:block;margin-top:1%;top:1%;" + "border:1px;padding:1px;width:4px;position:absolute";div.innerHTML = "";docElem.appendChild(container);var divStyle=window.getComputedStyle(div, null);pixelPositionVal = divStyle.top !== "1%";boxSizingReliableVal = divStyle.width === "4px";docElem.removeChild(container);}if(window.getComputedStyle){jQuery.extend(support, {pixelPosition:function pixelPosition(){computePixelPositionAndBoxSizingReliable();return pixelPositionVal;}, boxSizingReliable:function boxSizingReliable(){if(boxSizingReliableVal == null){computePixelPositionAndBoxSizingReliable();}return boxSizingReliableVal;}, reliableMarginRight:function reliableMarginRight(){var ret, marginDiv=div.appendChild(document.createElement("div"));marginDiv.style.cssText = div.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" + "box-sizing:content-box;display:block;margin:0;border:0;padding:0";marginDiv.style.marginRight = marginDiv.style.width = "0";div.style.width = "1px";docElem.appendChild(container);ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);docElem.removeChild(container);div.removeChild(marginDiv);return ret;}});}})();jQuery.swap = function(elem, options, callback, args){var ret, name, old={};for(name in options) {old[name] = elem.style[name];elem.style[name] = options[name];}ret = callback.apply(elem, args || []);for(name in options) {elem.style[name] = old[name];}return ret;};var rdisplayswap=/^(none|table(?!-c[ea]).+)/, rnumsplit=new RegExp("^(" + pnum + ")(.*)$", "i"), rrelNum=new RegExp("^([+-])=(" + pnum + ")", "i"), cssShow={position:"absolute", visibility:"hidden", display:"block"}, cssNormalTransform={letterSpacing:"0", fontWeight:"400"}, cssPrefixes=["Webkit", "O", "Moz", "ms"];function vendorPropName(style, name){if(name in style){return name;}var capName=name[0].toUpperCase() + name.slice(1), origName=name, i=cssPrefixes.length;while(i--) {name = cssPrefixes[i] + capName;if(name in style){return name;}}return origName;}function setPositiveNumber(elem, value, subtract){var matches=rnumsplit.exec(value);return matches?Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px"):value;}function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles){var i=extra === (isBorderBox?"border":"content")?4:name === "width"?1:0, val=0;for(; i < 4; i += 2) {if(extra === "margin"){val += jQuery.css(elem, extra + cssExpand[i], true, styles);}if(isBorderBox){if(extra === "content"){val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);}if(extra !== "margin"){val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);}}else {val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);if(extra !== "padding"){val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);}}}return val;}function getWidthOrHeight(elem, name, extra){var valueIsBorderBox=true, val=name === "width"?elem.offsetWidth:elem.offsetHeight, styles=getStyles(elem), isBorderBox=jQuery.css(elem, "boxSizing", false, styles) === "border-box";if(val <= 0 || val == null){val = curCSS(elem, name, styles);if(val < 0 || val == null){val = elem.style[name];}if(rnumnonpx.test(val)){return val;}valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);val = parseFloat(val) || 0;}return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox?"border":"content"), valueIsBorderBox, styles) + "px";}function showHide(elements, show){var display, elem, hidden, values=[], index=0, length=elements.length;for(; index < length; index++) {elem = elements[index];if(!elem.style){continue;}values[index] = data_priv.get(elem, "olddisplay");display = elem.style.display;if(show){if(!values[index] && display === "none"){elem.style.display = "";}if(elem.style.display === "" && isHidden(elem)){values[index] = data_priv.access(elem, "olddisplay", defaultDisplay(elem.nodeName));}}else {hidden = isHidden(elem);if(display !== "none" || !hidden){data_priv.set(elem, "olddisplay", hidden?display:jQuery.css(elem, "display"));}}}for(index = 0; index < length; index++) {elem = elements[index];if(!elem.style){continue;}if(!show || elem.style.display === "none" || elem.style.display === ""){elem.style.display = show?values[index] || "":"none";}}return elements;}jQuery.extend({cssHooks:{opacity:{get:function get(elem, computed){if(computed){var ret=curCSS(elem, "opacity");return ret === ""?"1":ret;}}}}, cssNumber:{"columnCount":true, "fillOpacity":true, "flexGrow":true, "flexShrink":true, "fontWeight":true, "lineHeight":true, "opacity":true, "order":true, "orphans":true, "widows":true, "zIndex":true, "zoom":true}, cssProps:{"float":"cssFloat"}, style:function style(elem, name, value, extra){if(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style){return;}var ret, type, hooks, origName=jQuery.camelCase(name), style=elem.style;name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName));hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];if(value !== undefined){type = typeof value;if(type === "string" && (ret = rrelNum.exec(value))){value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name));type = "number";}if(value == null || value !== value){return;}if(type === "number" && !jQuery.cssNumber[origName]){value += "px";}if(!support.clearCloneStyle && value === "" && name.indexOf("background") === 0){style[name] = "inherit";}if(!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined){style[name] = value;}}else {if(hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined){return ret;}return style[name];}}, css:function css(elem, name, extra, styles){var val, num, hooks, origName=jQuery.camelCase(name);name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName));hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];if(hooks && "get" in hooks){val = hooks.get(elem, true, extra);}if(val === undefined){val = curCSS(elem, name, styles);}if(val === "normal" && name in cssNormalTransform){val = cssNormalTransform[name];}if(extra === "" || extra){num = parseFloat(val);return extra === true || jQuery.isNumeric(num)?num || 0:val;}return val;}});jQuery.each(["height", "width"], function(i, name){jQuery.cssHooks[name] = {get:function get(elem, computed, extra){if(computed){return rdisplayswap.test(jQuery.css(elem, "display")) && elem.offsetWidth === 0?jQuery.swap(elem, cssShow, function(){return getWidthOrHeight(elem, name, extra);}):getWidthOrHeight(elem, name, extra);}}, set:function set(elem, value, extra){var styles=extra && getStyles(elem);return setPositiveNumber(elem, value, extra?augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles):0);}};});jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight, function(elem, computed){if(computed){return jQuery.swap(elem, {"display":"inline-block"}, curCSS, [elem, "marginRight"]);}});jQuery.each({margin:"", padding:"", border:"Width"}, function(prefix, suffix){jQuery.cssHooks[prefix + suffix] = {expand:function expand(value){var i=0, expanded={}, parts=typeof value === "string"?value.split(" "):[value];for(; i < 4; i++) {expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];}return expanded;}};if(!rmargin.test(prefix)){jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;}});jQuery.fn.extend({css:function css(name, value){return access(this, function(elem, name, value){var styles, len, map={}, i=0;if(jQuery.isArray(name)){styles = getStyles(elem);len = name.length;for(; i < len; i++) {map[name[i]] = jQuery.css(elem, name[i], false, styles);}return map;}return value !== undefined?jQuery.style(elem, name, value):jQuery.css(elem, name);}, name, value, arguments.length > 1);}, show:function show(){return showHide(this, true);}, hide:function hide(){return showHide(this);}, toggle:function toggle(state){if(typeof state === "boolean"){return state?this.show():this.hide();}return this.each(function(){if(isHidden(this)){jQuery(this).show();}else {jQuery(this).hide();}});}});function Tween(elem, options, prop, end, easing){return new Tween.prototype.init(elem, options, prop, end, easing);}jQuery.Tween = Tween;Tween.prototype = {constructor:Tween, init:function init(elem, options, prop, end, easing, unit){this.elem = elem;this.prop = prop;this.easing = easing || "swing";this.options = options;this.start = this.now = this.cur();this.end = end;this.unit = unit || (jQuery.cssNumber[prop]?"":"px");}, cur:function cur(){var hooks=Tween.propHooks[this.prop];return hooks && hooks.get?hooks.get(this):Tween.propHooks._default.get(this);}, run:function run(percent){var eased, hooks=Tween.propHooks[this.prop];if(this.options.duration){this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);}else {this.pos = eased = percent;}this.now = (this.end - this.start) * eased + this.start;if(this.options.step){this.options.step.call(this.elem, this.now, this);}if(hooks && hooks.set){hooks.set(this);}else {Tween.propHooks._default.set(this);}return this;}};Tween.prototype.init.prototype = Tween.prototype;Tween.propHooks = {_default:{get:function get(tween){var result;if(tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)){return tween.elem[tween.prop];}result = jQuery.css(tween.elem, tween.prop, "");return !result || result === "auto"?0:result;}, set:function set(tween){if(jQuery.fx.step[tween.prop]){jQuery.fx.step[tween.prop](tween);}else if(tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])){jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);}else {tween.elem[tween.prop] = tween.now;}}}};Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {set:function set(tween){if(tween.elem.nodeType && tween.elem.parentNode){tween.elem[tween.prop] = tween.now;}}};jQuery.easing = {linear:function linear(p){return p;}, swing:function swing(p){return 0.5 - Math.cos(p * Math.PI) / 2;}};jQuery.fx = Tween.prototype.init;jQuery.fx.step = {};var fxNow, timerId, rfxtypes=/^(?:toggle|show|hide)$/, rfxnum=new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i"), rrun=/queueHooks$/, animationPrefilters=[defaultPrefilter], tweeners={"*":[function(prop, value){var tween=this.createTween(prop, value), target=tween.cur(), parts=rfxnum.exec(value), unit=parts && parts[3] || (jQuery.cssNumber[prop]?"":"px"), start=(jQuery.cssNumber[prop] || unit !== "px" && +target) && rfxnum.exec(jQuery.css(tween.elem, prop)), scale=1, maxIterations=20;if(start && start[3] !== unit){unit = unit || start[3];parts = parts || [];start = +target || 1;do {scale = scale || ".5";start = start / scale;jQuery.style(tween.elem, prop, start + unit);}while(scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);}if(parts){start = tween.start = +start || +target || 0;tween.unit = unit;tween.end = parts[1]?start + (parts[1] + 1) * parts[2]:+parts[2];}return tween;}]};function createFxNow(){setTimeout(function(){fxNow = undefined;});return fxNow = jQuery.now();}function genFx(type, includeWidth){var which, i=0, attrs={height:type};includeWidth = includeWidth?1:0;for(; i < 4; i += 2 - includeWidth) {which = cssExpand[i];attrs["margin" + which] = attrs["padding" + which] = type;}if(includeWidth){attrs.opacity = attrs.width = type;}return attrs;}function createTween(value, prop, animation){var tween, collection=(tweeners[prop] || []).concat(tweeners["*"]), index=0, length=collection.length;for(; index < length; index++) {if(tween = collection[index].call(animation, prop, value)){return tween;}}}function defaultPrefilter(elem, props, opts){var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay, anim=this, orig={}, style=elem.style, hidden=elem.nodeType && isHidden(elem), dataShow=data_priv.get(elem, "fxshow");if(!opts.queue){hooks = jQuery._queueHooks(elem, "fx");if(hooks.unqueued == null){hooks.unqueued = 0;oldfire = hooks.empty.fire;hooks.empty.fire = function(){if(!hooks.unqueued){oldfire();}};}hooks.unqueued++;anim.always(function(){anim.always(function(){hooks.unqueued--;if(!jQuery.queue(elem, "fx").length){hooks.empty.fire();}});});}if(elem.nodeType === 1 && ("height" in props || "width" in props)){opts.overflow = [style.overflow, style.overflowX, style.overflowY];display = jQuery.css(elem, "display");checkDisplay = display === "none"?data_priv.get(elem, "olddisplay") || defaultDisplay(elem.nodeName):display;if(checkDisplay === "inline" && jQuery.css(elem, "float") === "none"){style.display = "inline-block";}}if(opts.overflow){style.overflow = "hidden";anim.always(function(){style.overflow = opts.overflow[0];style.overflowX = opts.overflow[1];style.overflowY = opts.overflow[2];});}for(prop in props) {value = props[prop];if(rfxtypes.exec(value)){delete props[prop];toggle = toggle || value === "toggle";if(value === (hidden?"hide":"show")){if(value === "show" && dataShow && dataShow[prop] !== undefined){hidden = true;}else {continue;}}orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);}else {display = undefined;}}if(!jQuery.isEmptyObject(orig)){if(dataShow){if("hidden" in dataShow){hidden = dataShow.hidden;}}else {dataShow = data_priv.access(elem, "fxshow", {});}if(toggle){dataShow.hidden = !hidden;}if(hidden){jQuery(elem).show();}else {anim.done(function(){jQuery(elem).hide();});}anim.done(function(){var prop;data_priv.remove(elem, "fxshow");for(prop in orig) {jQuery.style(elem, prop, orig[prop]);}});for(prop in orig) {tween = createTween(hidden?dataShow[prop]:0, prop, anim);if(!(prop in dataShow)){dataShow[prop] = tween.start;if(hidden){tween.end = tween.start;tween.start = prop === "width" || prop === "height"?1:0;}}}}else if((display === "none"?defaultDisplay(elem.nodeName):display) === "inline"){style.display = display;}}function propFilter(props, specialEasing){var index, name, easing, value, hooks;for(index in props) {name = jQuery.camelCase(index);easing = specialEasing[name];value = props[index];if(jQuery.isArray(value)){easing = value[1];value = props[index] = value[0];}if(index !== name){props[name] = value;delete props[index];}hooks = jQuery.cssHooks[name];if(hooks && "expand" in hooks){value = hooks.expand(value);delete props[name];for(index in value) {if(!(index in props)){props[index] = value[index];specialEasing[index] = easing;}}}else {specialEasing[name] = easing;}}}function Animation(elem, properties, options){var result, stopped, index=0, length=animationPrefilters.length, deferred=jQuery.Deferred().always(function(){delete tick.elem;}), tick=function tick(){if(stopped){return false;}var currentTime=fxNow || createFxNow(), remaining=Math.max(0, animation.startTime + animation.duration - currentTime), temp=remaining / animation.duration || 0, percent=1 - temp, index=0, length=animation.tweens.length;for(; index < length; index++) {animation.tweens[index].run(percent);}deferred.notifyWith(elem, [animation, percent, remaining]);if(percent < 1 && length){return remaining;}else {deferred.resolveWith(elem, [animation]);return false;}}, animation=deferred.promise({elem:elem, props:jQuery.extend({}, properties), opts:jQuery.extend(true, {specialEasing:{}}, options), originalProperties:properties, originalOptions:options, startTime:fxNow || createFxNow(), duration:options.duration, tweens:[], createTween:function createTween(prop, end){var tween=jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);animation.tweens.push(tween);return tween;}, stop:function stop(gotoEnd){var index=0, length=gotoEnd?animation.tweens.length:0;if(stopped){return this;}stopped = true;for(; index < length; index++) {animation.tweens[index].run(1);}if(gotoEnd){deferred.resolveWith(elem, [animation, gotoEnd]);}else {deferred.rejectWith(elem, [animation, gotoEnd]);}return this;}}), props=animation.props;propFilter(props, animation.opts.specialEasing);for(; index < length; index++) {result = animationPrefilters[index].call(animation, elem, props, animation.opts);if(result){return result;}}jQuery.map(props, createTween, animation);if(jQuery.isFunction(animation.opts.start)){animation.opts.start.call(elem, animation);}jQuery.fx.timer(jQuery.extend(tick, {elem:elem, anim:animation, queue:animation.opts.queue}));return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);}jQuery.Animation = jQuery.extend(Animation, {tweener:function tweener(props, callback){if(jQuery.isFunction(props)){callback = props;props = ["*"];}else {props = props.split(" ");}var prop, index=0, length=props.length;for(; index < length; index++) {prop = props[index];tweeners[prop] = tweeners[prop] || [];tweeners[prop].unshift(callback);}}, prefilter:function prefilter(callback, prepend){if(prepend){animationPrefilters.unshift(callback);}else {animationPrefilters.push(callback);}}});jQuery.speed = function(speed, easing, fn){var opt=speed && typeof speed === "object"?jQuery.extend({}, speed):{complete:fn || !fn && easing || jQuery.isFunction(speed) && speed, duration:speed, easing:fn && easing || easing && !jQuery.isFunction(easing) && easing};opt.duration = jQuery.fx.off?0:typeof opt.duration === "number"?opt.duration:opt.duration in jQuery.fx.speeds?jQuery.fx.speeds[opt.duration]:jQuery.fx.speeds._default;if(opt.queue == null || opt.queue === true){opt.queue = "fx";}opt.old = opt.complete;opt.complete = function(){if(jQuery.isFunction(opt.old)){opt.old.call(this);}if(opt.queue){jQuery.dequeue(this, opt.queue);}};return opt;};jQuery.fn.extend({fadeTo:function fadeTo(speed, to, easing, callback){return this.filter(isHidden).css("opacity", 0).show().end().animate({opacity:to}, speed, easing, callback);}, animate:function animate(prop, speed, easing, callback){var empty=jQuery.isEmptyObject(prop), optall=jQuery.speed(speed, easing, callback), doAnimation=function doAnimation(){var anim=Animation(this, jQuery.extend({}, prop), optall);if(empty || data_priv.get(this, "finish")){anim.stop(true);}};doAnimation.finish = doAnimation;return empty || optall.queue === false?this.each(doAnimation):this.queue(optall.queue, doAnimation);}, stop:function stop(type, clearQueue, gotoEnd){var stopQueue=function stopQueue(hooks){var stop=hooks.stop;delete hooks.stop;stop(gotoEnd);};if(typeof type !== "string"){gotoEnd = clearQueue;clearQueue = type;type = undefined;}if(clearQueue && type !== false){this.queue(type || "fx", []);}return this.each(function(){var dequeue=true, index=type != null && type + "queueHooks", timers=jQuery.timers, data=data_priv.get(this);if(index){if(data[index] && data[index].stop){stopQueue(data[index]);}}else {for(index in data) {if(data[index] && data[index].stop && rrun.test(index)){stopQueue(data[index]);}}}for(index = timers.length; index--;) {if(timers[index].elem === this && (type == null || timers[index].queue === type)){timers[index].anim.stop(gotoEnd);dequeue = false;timers.splice(index, 1);}}if(dequeue || !gotoEnd){jQuery.dequeue(this, type);}});}, finish:function finish(type){if(type !== false){type = type || "fx";}return this.each(function(){var index, data=data_priv.get(this), queue=data[type + "queue"], hooks=data[type + "queueHooks"], timers=jQuery.timers, length=queue?queue.length:0;data.finish = true;jQuery.queue(this, type, []);if(hooks && hooks.stop){hooks.stop.call(this, true);}for(index = timers.length; index--;) {if(timers[index].elem === this && timers[index].queue === type){timers[index].anim.stop(true);timers.splice(index, 1);}}for(index = 0; index < length; index++) {if(queue[index] && queue[index].finish){queue[index].finish.call(this);}}delete data.finish;});}});jQuery.each(["toggle", "show", "hide"], function(i, name){var cssFn=jQuery.fn[name];jQuery.fn[name] = function(speed, easing, callback){return speed == null || typeof speed === "boolean"?cssFn.apply(this, arguments):this.animate(genFx(name, true), speed, easing, callback);};});jQuery.each({slideDown:genFx("show"), slideUp:genFx("hide"), slideToggle:genFx("toggle"), fadeIn:{opacity:"show"}, fadeOut:{opacity:"hide"}, fadeToggle:{opacity:"toggle"}}, function(name, props){jQuery.fn[name] = function(speed, easing, callback){return this.animate(props, speed, easing, callback);};});jQuery.timers = [];jQuery.fx.tick = function(){var timer, i=0, timers=jQuery.timers;fxNow = jQuery.now();for(; i < timers.length; i++) {timer = timers[i];if(!timer() && timers[i] === timer){timers.splice(i--, 1);}}if(!timers.length){jQuery.fx.stop();}fxNow = undefined;};jQuery.fx.timer = function(timer){jQuery.timers.push(timer);if(timer()){jQuery.fx.start();}else {jQuery.timers.pop();}};jQuery.fx.interval = 13;jQuery.fx.start = function(){if(!timerId){timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);}};jQuery.fx.stop = function(){clearInterval(timerId);timerId = null;};jQuery.fx.speeds = {slow:600, fast:200, _default:400};jQuery.fn.delay = function(time, type){time = jQuery.fx?jQuery.fx.speeds[time] || time:time;type = type || "fx";return this.queue(type, function(next, hooks){var timeout=setTimeout(next, time);hooks.stop = function(){clearTimeout(timeout);};});};(function(){var input=document.createElement("input"), select=document.createElement("select"), opt=select.appendChild(document.createElement("option"));input.type = "checkbox";support.checkOn = input.value !== "";support.optSelected = opt.selected;select.disabled = true;support.optDisabled = !opt.disabled;input = document.createElement("input");input.value = "t";input.type = "radio";support.radioValue = input.value === "t";})();var nodeHook, boolHook, attrHandle=jQuery.expr.attrHandle;jQuery.fn.extend({attr:function attr(name, value){return access(this, jQuery.attr, name, value, arguments.length > 1);}, removeAttr:function removeAttr(name){return this.each(function(){jQuery.removeAttr(this, name);});}});jQuery.extend({attr:function attr(elem, name, value){var hooks, ret, nType=elem.nodeType;if(!elem || nType === 3 || nType === 8 || nType === 2){return;}if(typeof elem.getAttribute === strundefined){return jQuery.prop(elem, name, value);}if(nType !== 1 || !jQuery.isXMLDoc(elem)){name = name.toLowerCase();hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name)?boolHook:nodeHook);}if(value !== undefined){if(value === null){jQuery.removeAttr(elem, name);}else if(hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined){return ret;}else {elem.setAttribute(name, value + "");return value;}}else if(hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null){return ret;}else {ret = jQuery.find.attr(elem, name);return ret == null?undefined:ret;}}, removeAttr:function removeAttr(elem, value){var name, propName, i=0, attrNames=value && value.match(rnotwhite);if(attrNames && elem.nodeType === 1){while(name = attrNames[i++]) {propName = jQuery.propFix[name] || name;if(jQuery.expr.match.bool.test(name)){elem[propName] = false;}elem.removeAttribute(name);}}}, attrHooks:{type:{set:function set(elem, value){if(!support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")){var val=elem.value;elem.setAttribute("type", value);if(val){elem.value = val;}return value;}}}}});boolHook = {set:function set(elem, value, name){if(value === false){jQuery.removeAttr(elem, name);}else {elem.setAttribute(name, name);}return name;}};jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name){var getter=attrHandle[name] || jQuery.find.attr;attrHandle[name] = function(elem, name, isXML){var ret, handle;if(!isXML){handle = attrHandle[name];attrHandle[name] = ret;ret = getter(elem, name, isXML) != null?name.toLowerCase():null;attrHandle[name] = handle;}return ret;};});var rfocusable=/^(?:input|select|textarea|button)$/i;jQuery.fn.extend({prop:function prop(name, value){return access(this, jQuery.prop, name, value, arguments.length > 1);}, removeProp:function removeProp(name){return this.each(function(){delete this[jQuery.propFix[name] || name];});}});jQuery.extend({propFix:{"for":"htmlFor", "class":"className"}, prop:function prop(elem, name, value){var ret, hooks, notxml, nType=elem.nodeType;if(!elem || nType === 3 || nType === 8 || nType === 2){return;}notxml = nType !== 1 || !jQuery.isXMLDoc(elem);if(notxml){name = jQuery.propFix[name] || name;hooks = jQuery.propHooks[name];}if(value !== undefined){return hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined?ret:elem[name] = value;}else {return hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null?ret:elem[name];}}, propHooks:{tabIndex:{get:function get(elem){return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href?elem.tabIndex:-1;}}}});if(!support.optSelected){jQuery.propHooks.selected = {get:function get(elem){var parent=elem.parentNode;if(parent && parent.parentNode){parent.parentNode.selectedIndex;}return null;}};}jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function(){jQuery.propFix[this.toLowerCase()] = this;});var rclass=/[\t\r\n\f]/g;jQuery.fn.extend({addClass:function addClass(value){var classes, elem, cur, clazz, j, finalValue, proceed=typeof value === "string" && value, i=0, len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).addClass(value.call(this, j, this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(; i < len; i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass, " "):" ");if(cur){j = 0;while(clazz = classes[j++]) {if(cur.indexOf(" " + clazz + " ") < 0){cur += clazz + " ";}}finalValue = jQuery.trim(cur);if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;}, removeClass:function removeClass(value){var classes, elem, cur, clazz, j, finalValue, proceed=arguments.length === 0 || typeof value === "string" && value, i=0, len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).removeClass(value.call(this, j, this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(; i < len; i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass, " "):"");if(cur){j = 0;while(clazz = classes[j++]) {while(cur.indexOf(" " + clazz + " ") >= 0) {cur = cur.replace(" " + clazz + " ", " ");}}finalValue = value?jQuery.trim(cur):"";if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;}, toggleClass:function toggleClass(value, stateVal){var type=typeof value;if(typeof stateVal === "boolean" && type === "string"){return stateVal?this.addClass(value):this.removeClass(value);}if(jQuery.isFunction(value)){return this.each(function(i){jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);});}return this.each(function(){if(type === "string"){var className, i=0, self=jQuery(this), classNames=value.match(rnotwhite) || [];while(className = classNames[i++]) {if(self.hasClass(className)){self.removeClass(className);}else {self.addClass(className);}}}else if(type === strundefined || type === "boolean"){if(this.className){data_priv.set(this, "__className__", this.className);}this.className = this.className || value === false?"":data_priv.get(this, "__className__") || "";}});}, hasClass:function hasClass(selector){var className=" " + selector + " ", i=0, l=this.length;for(; i < l; i++) {if(this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0){return true;}}return false;}});var rreturn=/\r/g;jQuery.fn.extend({val:function val(value){var hooks, ret, isFunction, elem=this[0];if(!arguments.length){if(elem){hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];if(hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined){return ret;}ret = elem.value;return typeof ret === "string"?ret.replace(rreturn, ""):ret == null?"":ret;}return;}isFunction = jQuery.isFunction(value);return this.each(function(i){var val;if(this.nodeType !== 1){return;}if(isFunction){val = value.call(this, i, jQuery(this).val());}else {val = value;}if(val == null){val = "";}else if(typeof val === "number"){val += "";}else if(jQuery.isArray(val)){val = jQuery.map(val, function(value){return value == null?"":value + "";});}hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];if(!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined){this.value = val;}});}});jQuery.extend({valHooks:{option:{get:function get(elem){var val=jQuery.find.attr(elem, "value");return val != null?val:jQuery.trim(jQuery.text(elem));}}, select:{get:function get(elem){var value, option, options=elem.options, index=elem.selectedIndex, one=elem.type === "select-one" || index < 0, values=one?null:[], max=one?index + 1:options.length, i=index < 0?max:one?index:0;for(; i < max; i++) {option = options[i];if((option.selected || i === index) && (support.optDisabled?!option.disabled:option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))){value = jQuery(option).val();if(one){return value;}values.push(value);}}return values;}, set:function set(elem, value){var optionSet, option, options=elem.options, values=jQuery.makeArray(value), i=options.length;while(i--) {option = options[i];if(option.selected = jQuery.inArray(option.value, values) >= 0){optionSet = true;}}if(!optionSet){elem.selectedIndex = -1;}return values;}}}});jQuery.each(["radio", "checkbox"], function(){jQuery.valHooks[this] = {set:function set(elem, value){if(jQuery.isArray(value)){return elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0;}}};if(!support.checkOn){jQuery.valHooks[this].get = function(elem){return elem.getAttribute("value") === null?"on":elem.value;};}});jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, name){jQuery.fn[name] = function(data, fn){return arguments.length > 0?this.on(name, null, data, fn):this.trigger(name);};});jQuery.fn.extend({hover:function hover(fnOver, fnOut){return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);}, bind:function bind(types, data, fn){return this.on(types, null, data, fn);}, unbind:function unbind(types, fn){return this.off(types, null, fn);}, delegate:function delegate(selector, types, data, fn){return this.on(types, selector, data, fn);}, undelegate:function undelegate(selector, types, fn){return arguments.length === 1?this.off(selector, "**"):this.off(types, selector || "**", fn);}});var nonce=jQuery.now();var rquery=/\?/;jQuery.parseJSON = function(data){return JSON.parse(data + "");};jQuery.parseXML = function(data){var xml, tmp;if(!data || typeof data !== "string"){return null;}try{tmp = new DOMParser();xml = tmp.parseFromString(data, "text/xml");}catch(e) {xml = undefined;}if(!xml || xml.getElementsByTagName("parsererror").length){jQuery.error("Invalid XML: " + data);}return xml;};var rhash=/#.*$/, rts=/([?&])_=[^&]*/, rheaders=/^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent=/^(?:GET|HEAD)$/, rprotocol=/^\/\//, rurl=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, prefilters={}, transports={}, allTypes="*/".concat("*"), ajaxLocation=window.location.href, ajaxLocParts=rurl.exec(ajaxLocation.toLowerCase()) || [];function addToPrefiltersOrTransports(structure){return function(dataTypeExpression, func){if(typeof dataTypeExpression !== "string"){func = dataTypeExpression;dataTypeExpression = "*";}var dataType, i=0, dataTypes=dataTypeExpression.toLowerCase().match(rnotwhite) || [];if(jQuery.isFunction(func)){while(dataType = dataTypes[i++]) {if(dataType[0] === "+"){dataType = dataType.slice(1) || "*";(structure[dataType] = structure[dataType] || []).unshift(func);}else {(structure[dataType] = structure[dataType] || []).push(func);}}}};}function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR){var inspected={}, seekingTransport=structure === transports;function inspect(dataType){var selected;inspected[dataType] = true;jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory){var dataTypeOrTransport=prefilterOrFactory(options, originalOptions, jqXHR);if(typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]){options.dataTypes.unshift(dataTypeOrTransport);inspect(dataTypeOrTransport);return false;}else if(seekingTransport){return !(selected = dataTypeOrTransport);}});return selected;}return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");}function ajaxExtend(target, src){var key, deep, flatOptions=jQuery.ajaxSettings.flatOptions || {};for(key in src) {if(src[key] !== undefined){(flatOptions[key]?target:deep || (deep = {}))[key] = src[key];}}if(deep){jQuery.extend(true, target, deep);}return target;}function ajaxHandleResponses(s, jqXHR, responses){var ct, type, finalDataType, firstDataType, contents=s.contents, dataTypes=s.dataTypes;while(dataTypes[0] === "*") {dataTypes.shift();if(ct === undefined){ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");}}if(ct){for(type in contents) {if(contents[type] && contents[type].test(ct)){dataTypes.unshift(type);break;}}}if(dataTypes[0] in responses){finalDataType = dataTypes[0];}else {for(type in responses) {if(!dataTypes[0] || s.converters[type + " " + dataTypes[0]]){finalDataType = type;break;}if(!firstDataType){firstDataType = type;}}finalDataType = finalDataType || firstDataType;}if(finalDataType){if(finalDataType !== dataTypes[0]){dataTypes.unshift(finalDataType);}return responses[finalDataType];}}function ajaxConvert(s, response, jqXHR, isSuccess){var conv2, current, conv, tmp, prev, converters={}, dataTypes=s.dataTypes.slice();if(dataTypes[1]){for(conv in s.converters) {converters[conv.toLowerCase()] = s.converters[conv];}}current = dataTypes.shift();while(current) {if(s.responseFields[current]){jqXHR[s.responseFields[current]] = response;}if(!prev && isSuccess && s.dataFilter){response = s.dataFilter(response, s.dataType);}prev = current;current = dataTypes.shift();if(current){if(current === "*"){current = prev;}else if(prev !== "*" && prev !== current){conv = converters[prev + " " + current] || converters["* " + current];if(!conv){for(conv2 in converters) {tmp = conv2.split(" ");if(tmp[1] === current){conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];if(conv){if(conv === true){conv = converters[conv2];}else if(converters[conv2] !== true){current = tmp[0];dataTypes.unshift(tmp[1]);}break;}}}}if(conv !== true){if(conv && s["throws"]){response = conv(response);}else {try{response = conv(response);}catch(e) {return {state:"parsererror", error:conv?e:"No conversion from " + prev + " to " + current};}}}}}}return {state:"success", data:response};}jQuery.extend({active:0, lastModified:{}, etag:{}, ajaxSettings:{url:ajaxLocation, type:"GET", isLocal:rlocalProtocol.test(ajaxLocParts[1]), global:true, processData:true, async:true, contentType:"application/x-www-form-urlencoded; charset=UTF-8", accepts:{"*":allTypes, text:"text/plain", html:"text/html", xml:"application/xml, text/xml", json:"application/json, text/javascript"}, contents:{xml:/xml/, html:/html/, json:/json/}, responseFields:{xml:"responseXML", text:"responseText", json:"responseJSON"}, converters:{"* text":String, "text html":true, "text json":jQuery.parseJSON, "text xml":jQuery.parseXML}, flatOptions:{url:true, context:true}}, ajaxSetup:function ajaxSetup(target, settings){return settings?ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings):ajaxExtend(jQuery.ajaxSettings, target);}, ajaxPrefilter:addToPrefiltersOrTransports(prefilters), ajaxTransport:addToPrefiltersOrTransports(transports), ajax:function ajax(url, options){if(typeof url === "object"){options = url;url = undefined;}options = options || {};var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, parts, fireGlobals, i, s=jQuery.ajaxSetup({}, options), callbackContext=s.context || s, globalEventContext=s.context && (callbackContext.nodeType || callbackContext.jquery)?jQuery(callbackContext):jQuery.event, deferred=jQuery.Deferred(), completeDeferred=jQuery.Callbacks("once memory"), _statusCode=s.statusCode || {}, requestHeaders={}, requestHeadersNames={}, state=0, strAbort="canceled", jqXHR={readyState:0, getResponseHeader:function getResponseHeader(key){var match;if(state === 2){if(!responseHeaders){responseHeaders = {};while(match = rheaders.exec(responseHeadersString)) {responseHeaders[match[1].toLowerCase()] = match[2];}}match = responseHeaders[key.toLowerCase()];}return match == null?null:match;}, getAllResponseHeaders:function getAllResponseHeaders(){return state === 2?responseHeadersString:null;}, setRequestHeader:function setRequestHeader(name, value){var lname=name.toLowerCase();if(!state){name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;requestHeaders[name] = value;}return this;}, overrideMimeType:function overrideMimeType(type){if(!state){s.mimeType = type;}return this;}, statusCode:function statusCode(map){var code;if(map){if(state < 2){for(code in map) {_statusCode[code] = [_statusCode[code], map[code]];}}else {jqXHR.always(map[jqXHR.status]);}}return this;}, abort:function abort(statusText){var finalText=statusText || strAbort;if(transport){transport.abort(finalText);}done(0, finalText);return this;}};deferred.promise(jqXHR).complete = completeDeferred.add;jqXHR.success = jqXHR.done;jqXHR.error = jqXHR.fail;s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//");s.type = options.method || options.type || s.method || s.type;s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [""];if(s.crossDomain == null){parts = rurl.exec(s.url.toLowerCase());s.crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:"?"80":"443")) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:"?"80":"443"))));}if(s.data && s.processData && typeof s.data !== "string"){s.data = jQuery.param(s.data, s.traditional);}inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);if(state === 2){return jqXHR;}fireGlobals = jQuery.event && s.global;if(fireGlobals && jQuery.active++ === 0){jQuery.event.trigger("ajaxStart");}s.type = s.type.toUpperCase();s.hasContent = !rnoContent.test(s.type);cacheURL = s.url;if(!s.hasContent){if(s.data){cacheURL = s.url += (rquery.test(cacheURL)?"&":"?") + s.data;delete s.data;}if(s.cache === false){s.url = rts.test(cacheURL)?cacheURL.replace(rts, "$1_=" + nonce++):cacheURL + (rquery.test(cacheURL)?"&":"?") + "_=" + nonce++;}}if(s.ifModified){if(jQuery.lastModified[cacheURL]){jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);}if(jQuery.etag[cacheURL]){jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);}}if(s.data && s.hasContent && s.contentType !== false || options.contentType){jqXHR.setRequestHeader("Content-Type", s.contentType);}jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]]?s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*"?", " + allTypes + "; q=0.01":""):s.accepts["*"]);for(i in s.headers) {jqXHR.setRequestHeader(i, s.headers[i]);}if(s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)){return jqXHR.abort();}strAbort = "abort";for(i in {success:1, error:1, complete:1}) {jqXHR[i](s[i]);}transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);if(!transport){done(-1, "No Transport");}else {jqXHR.readyState = 1;if(fireGlobals){globalEventContext.trigger("ajaxSend", [jqXHR, s]);}if(s.async && s.timeout > 0){timeoutTimer = setTimeout(function(){jqXHR.abort("timeout");}, s.timeout);}try{state = 1;transport.send(requestHeaders, done);}catch(e) {if(state < 2){done(-1, e);}else {throw e;}}}function done(status, nativeStatusText, responses, headers){var isSuccess, success, error, response, modified, statusText=nativeStatusText;if(state === 2){return;}state = 2;if(timeoutTimer){clearTimeout(timeoutTimer);}transport = undefined;responseHeadersString = headers || "";jqXHR.readyState = status > 0?4:0;isSuccess = status >= 200 && status < 300 || status === 304;if(responses){response = ajaxHandleResponses(s, jqXHR, responses);}response = ajaxConvert(s, response, jqXHR, isSuccess);if(isSuccess){if(s.ifModified){modified = jqXHR.getResponseHeader("Last-Modified");if(modified){jQuery.lastModified[cacheURL] = modified;}modified = jqXHR.getResponseHeader("etag");if(modified){jQuery.etag[cacheURL] = modified;}}if(status === 204 || s.type === "HEAD"){statusText = "nocontent";}else if(status === 304){statusText = "notmodified";}else {statusText = response.state;success = response.data;error = response.error;isSuccess = !error;}}else {error = statusText;if(status || !statusText){statusText = "error";if(status < 0){status = 0;}}}jqXHR.status = status;jqXHR.statusText = (nativeStatusText || statusText) + "";if(isSuccess){deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);}else {deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);}jqXHR.statusCode(_statusCode);_statusCode = undefined;if(fireGlobals){globalEventContext.trigger(isSuccess?"ajaxSuccess":"ajaxError", [jqXHR, s, isSuccess?success:error]);}completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);if(fireGlobals){globalEventContext.trigger("ajaxComplete", [jqXHR, s]);if(! --jQuery.active){jQuery.event.trigger("ajaxStop");}}}return jqXHR;}, getJSON:function getJSON(url, data, callback){return jQuery.get(url, data, callback, "json");}, getScript:function getScript(url, callback){return jQuery.get(url, undefined, callback, "script");}});jQuery.each(["get", "post"], function(i, method){jQuery[method] = function(url, data, callback, type){if(jQuery.isFunction(data)){type = type || callback;callback = data;data = undefined;}return jQuery.ajax({url:url, type:method, dataType:type, data:data, success:callback});};});jQuery._evalUrl = function(url){return jQuery.ajax({url:url, type:"GET", dataType:"script", async:false, global:false, "throws":true});};jQuery.fn.extend({wrapAll:function wrapAll(html){var wrap;if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapAll(html.call(this, i));});}if(this[0]){wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){wrap.insertBefore(this[0]);}wrap.map(function(){var elem=this;while(elem.firstElementChild) {elem = elem.firstElementChild;}return elem;}).append(this);}return this;}, wrapInner:function wrapInner(html){if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapInner(html.call(this, i));});}return this.each(function(){var self=jQuery(this), contents=self.contents();if(contents.length){contents.wrapAll(html);}else {self.append(html);}});}, wrap:function wrap(html){var isFunction=jQuery.isFunction(html);return this.each(function(i){jQuery(this).wrapAll(isFunction?html.call(this, i):html);});}, unwrap:function unwrap(){return this.parent().each(function(){if(!jQuery.nodeName(this, "body")){jQuery(this).replaceWith(this.childNodes);}}).end();}});jQuery.expr.filters.hidden = function(elem){return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;};jQuery.expr.filters.visible = function(elem){return !jQuery.expr.filters.hidden(elem);};var r20=/%20/g, rbracket=/\[\]$/, rCRLF=/\r?\n/g, rsubmitterTypes=/^(?:submit|button|image|reset|file)$/i, rsubmittable=/^(?:input|select|textarea|keygen)/i;function buildParams(prefix, obj, traditional, add){var name;if(jQuery.isArray(obj)){jQuery.each(obj, function(i, v){if(traditional || rbracket.test(prefix)){add(prefix, v);}else {buildParams(prefix + "[" + (typeof v === "object"?i:"") + "]", v, traditional, add);}});}else if(!traditional && jQuery.type(obj) === "object"){for(name in obj) {buildParams(prefix + "[" + name + "]", obj[name], traditional, add);}}else {add(prefix, obj);}}jQuery.param = function(a, traditional){var prefix, s=[], add=function add(key, value){value = jQuery.isFunction(value)?value():value == null?"":value;s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);};if(traditional === undefined){traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;}if(jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)){jQuery.each(a, function(){add(this.name, this.value);});}else {for(prefix in a) {buildParams(prefix, a[prefix], traditional, add);}}return s.join("&").replace(r20, "+");};jQuery.fn.extend({serialize:function serialize(){return jQuery.param(this.serializeArray());}, serializeArray:function serializeArray(){return this.map(function(){var elements=jQuery.prop(this, "elements");return elements?jQuery.makeArray(elements):this;}).filter(function(){var type=this.type;return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));}).map(function(i, elem){var val=jQuery(this).val();return val == null?null:jQuery.isArray(val)?jQuery.map(val, function(val){return {name:elem.name, value:val.replace(rCRLF, "\r\n")};}):{name:elem.name, value:val.replace(rCRLF, "\r\n")};}).get();}});jQuery.ajaxSettings.xhr = function(){try{return new XMLHttpRequest();}catch(e) {}};var xhrId=0, xhrCallbacks={}, xhrSuccessStatus={0:200, 1223:204}, xhrSupported=jQuery.ajaxSettings.xhr();if(window.attachEvent){window.attachEvent("onunload", function(){for(var key in xhrCallbacks) {xhrCallbacks[key]();}});}support.cors = !!xhrSupported && "withCredentials" in xhrSupported;support.ajax = xhrSupported = !!xhrSupported;jQuery.ajaxTransport(function(options){var callback;if(support.cors || xhrSupported && !options.crossDomain){return {send:function send(headers, complete){var i, xhr=options.xhr(), id=++xhrId;xhr.open(options.type, options.url, options.async, options.username, options.password);if(options.xhrFields){for(i in options.xhrFields) {xhr[i] = options.xhrFields[i];}}if(options.mimeType && xhr.overrideMimeType){xhr.overrideMimeType(options.mimeType);}if(!options.crossDomain && !headers["X-Requested-With"]){headers["X-Requested-With"] = "XMLHttpRequest";}for(i in headers) {xhr.setRequestHeader(i, headers[i]);}callback = function(type){return function(){if(callback){delete xhrCallbacks[id];callback = xhr.onload = xhr.onerror = null;if(type === "abort"){xhr.abort();}else if(type === "error"){complete(xhr.status, xhr.statusText);}else {complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, typeof xhr.responseText === "string"?{text:xhr.responseText}:undefined, xhr.getAllResponseHeaders());}}};};xhr.onload = callback();xhr.onerror = callback("error");callback = xhrCallbacks[id] = callback("abort");try{xhr.send(options.hasContent && options.data || null);}catch(e) {if(callback){throw e;}}}, abort:function abort(){if(callback){callback();}}};}});jQuery.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"}, contents:{script:/(?:java|ecma)script/}, converters:{"text script":function textScript(text){jQuery.globalEval(text);return text;}}});jQuery.ajaxPrefilter("script", function(s){if(s.cache === undefined){s.cache = false;}if(s.crossDomain){s.type = "GET";}});jQuery.ajaxTransport("script", function(s){if(s.crossDomain){var script, callback;return {send:function send(_, complete){script = jQuery("<script>").prop({async:true, charset:s.scriptCharset, src:s.url}).on("load error", callback = function(evt){script.remove();callback = null;if(evt){complete(evt.type === "error"?404:200, evt.type);}});document.head.appendChild(script[0]);}, abort:function abort(){if(callback){callback();}}};}});var oldCallbacks=[], rjsonp=/(=)\?(?=&|$)|\?\?/;jQuery.ajaxSetup({jsonp:"callback", jsonpCallback:function jsonpCallback(){var callback=oldCallbacks.pop() || jQuery.expando + "_" + nonce++;this[callback] = true;return callback;}});jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR){var callbackName, overwritten, responseContainer, jsonProp=s.jsonp !== false && (rjsonp.test(s.url)?"url":typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data");if(jsonProp || s.dataTypes[0] === "jsonp"){callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback)?s.jsonpCallback():s.jsonpCallback;if(jsonProp){s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);}else if(s.jsonp !== false){s.url += (rquery.test(s.url)?"&":"?") + s.jsonp + "=" + callbackName;}s.converters["script json"] = function(){if(!responseContainer){jQuery.error(callbackName + " was not called");}return responseContainer[0];};s.dataTypes[0] = "json";overwritten = window[callbackName];window[callbackName] = function(){responseContainer = arguments;};jqXHR.always(function(){window[callbackName] = overwritten;if(s[callbackName]){s.jsonpCallback = originalSettings.jsonpCallback;oldCallbacks.push(callbackName);}if(responseContainer && jQuery.isFunction(overwritten)){overwritten(responseContainer[0]);}responseContainer = overwritten = undefined;});return "script";}});jQuery.parseHTML = function(data, context, keepScripts){if(!data || typeof data !== "string"){return null;}if(typeof context === "boolean"){keepScripts = context;context = false;}context = context || document;var parsed=rsingleTag.exec(data), scripts=!keepScripts && [];if(parsed){return [context.createElement(parsed[1])];}parsed = jQuery.buildFragment([data], context, scripts);if(scripts && scripts.length){jQuery(scripts).remove();}return jQuery.merge([], parsed.childNodes);};var _load=jQuery.fn.load;jQuery.fn.load = function(url, params, callback){if(typeof url !== "string" && _load){return _load.apply(this, arguments);}var selector, type, response, self=this, off=url.indexOf(" ");if(off >= 0){selector = jQuery.trim(url.slice(off));url = url.slice(0, off);}if(jQuery.isFunction(params)){callback = params;params = undefined;}else if(params && typeof params === "object"){type = "POST";}if(self.length > 0){jQuery.ajax({url:url, type:type, dataType:"html", data:params}).done(function(responseText){response = arguments;self.html(selector?jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector):responseText);}).complete(callback && function(jqXHR, status){self.each(callback, response || [jqXHR.responseText, status, jqXHR]);});}return this;};jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(i, type){jQuery.fn[type] = function(fn){return this.on(type, fn);};});jQuery.expr.filters.animated = function(elem){return jQuery.grep(jQuery.timers, function(fn){return elem === fn.elem;}).length;};var docElem=window.document.documentElement;function getWindow(elem){return jQuery.isWindow(elem)?elem:elem.nodeType === 9 && elem.defaultView;}jQuery.offset = {setOffset:function setOffset(elem, options, i){var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position=jQuery.css(elem, "position"), curElem=jQuery(elem), props={};if(position === "static"){elem.style.position = "relative";}curOffset = curElem.offset();curCSSTop = jQuery.css(elem, "top");curCSSLeft = jQuery.css(elem, "left");calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;if(calculatePosition){curPosition = curElem.position();curTop = curPosition.top;curLeft = curPosition.left;}else {curTop = parseFloat(curCSSTop) || 0;curLeft = parseFloat(curCSSLeft) || 0;}if(jQuery.isFunction(options)){options = options.call(elem, i, curOffset);}if(options.top != null){props.top = options.top - curOffset.top + curTop;}if(options.left != null){props.left = options.left - curOffset.left + curLeft;}if("using" in options){options.using.call(elem, props);}else {curElem.css(props);}}};jQuery.fn.extend({offset:function offset(options){if(arguments.length){return options === undefined?this:this.each(function(i){jQuery.offset.setOffset(this, options, i);});}var docElem, win, elem=this[0], box={top:0, left:0}, doc=elem && elem.ownerDocument;if(!doc){return;}docElem = doc.documentElement;if(!jQuery.contains(docElem, elem)){return box;}if(typeof elem.getBoundingClientRect !== strundefined){box = elem.getBoundingClientRect();}win = getWindow(doc);return {top:box.top + win.pageYOffset - docElem.clientTop, left:box.left + win.pageXOffset - docElem.clientLeft};}, position:function position(){if(!this[0]){return;}var offsetParent, offset, elem=this[0], parentOffset={top:0, left:0};if(jQuery.css(elem, "position") === "fixed"){offset = elem.getBoundingClientRect();}else {offsetParent = this.offsetParent();offset = this.offset();if(!jQuery.nodeName(offsetParent[0], "html")){parentOffset = offsetParent.offset();}parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", true);parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", true);}return {top:offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true), left:offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)};}, offsetParent:function offsetParent(){return this.map(function(){var offsetParent=this.offsetParent || docElem;while(offsetParent && (!jQuery.nodeName(offsetParent, "html") && jQuery.css(offsetParent, "position") === "static")) {offsetParent = offsetParent.offsetParent;}return offsetParent || docElem;});}});jQuery.each({scrollLeft:"pageXOffset", scrollTop:"pageYOffset"}, function(method, prop){var top="pageYOffset" === prop;jQuery.fn[method] = function(val){return access(this, function(elem, method, val){var win=getWindow(elem);if(val === undefined){return win?win[prop]:elem[method];}if(win){win.scrollTo(!top?val:window.pageXOffset, top?val:window.pageYOffset);}else {elem[method] = val;}}, method, val, arguments.length, null);};});jQuery.each(["top", "left"], function(i, prop){jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function(elem, computed){if(computed){computed = curCSS(elem, prop);return rnumnonpx.test(computed)?jQuery(elem).position()[prop] + "px":computed;}});});jQuery.each({Height:"height", Width:"width"}, function(name, type){jQuery.each({padding:"inner" + name, content:type, "":"outer" + name}, function(defaultExtra, funcName){jQuery.fn[funcName] = function(margin, value){var chainable=arguments.length && (defaultExtra || typeof margin !== "boolean"), extra=defaultExtra || (margin === true || value === true?"margin":"border");return access(this, function(elem, type, value){var doc;if(jQuery.isWindow(elem)){return elem.document.documentElement["client" + name];}if(elem.nodeType === 9){doc = elem.documentElement;return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);}return value === undefined?jQuery.css(elem, type, extra):jQuery.style(elem, type, value, extra);}, type, chainable?margin:undefined, chainable, null);};});});jQuery.fn.size = function(){return this.length;};jQuery.fn.andSelf = jQuery.fn.addBack;if(typeof define === "function" && define.amd){define("jquery", [], function(){return jQuery;});}var _jQuery=window.jQuery, _$=window.$;jQuery.noConflict = function(deep){if(window.$ === jQuery){window.$ = _$;}if(deep && window.jQuery === jQuery){window.jQuery = _jQuery;}return jQuery;};if(typeof noGlobal === strundefined){window.jQuery = window.$ = jQuery;}return jQuery;});
/*!
 * Outlayer v1.4.1
 * the brains and guts of a layout library
 * MIT license
 */

'use strict';

(function (window, factory) {
  'use strict';
  // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['eventie/eventie', 'eventEmitter/EventEmitter', 'get-size/get-size', 'fizzy-ui-utils/utils', './item'], function (eventie, EventEmitter, getSize, utils, Item) {
      return factory(window, eventie, EventEmitter, getSize, utils, Item);
    });
  } else if (typeof exports == 'object') {
    // CommonJS
    module.exports = factory(window, require('eventie'), require('wolfy87-eventemitter'), require('get-size'), require('fizzy-ui-utils'), require('./item'));
  } else {
    // browser global
    window.Outlayer = factory(window, window.eventie, window.EventEmitter, window.getSize, window.fizzyUIUtils, window.Outlayer.Item);
  }
})(window, function factory(window, eventie, EventEmitter, getSize, utils, Item) {
  'use strict';

  // ----- vars ----- //

  var console = window.console;
  var jQuery = window.jQuery;
  var noop = function noop() {};

  // -------------------------- Outlayer -------------------------- //

  // globally unique identifiers
  var GUID = 0;
  // internal store of all Outlayer intances
  var instances = {};

  /**
   * @param {Element, String} element
   * @param {Object} options
   * @constructor
   */
  function Outlayer(element, options) {
    var queryElement = utils.getQueryElement(element);
    if (!queryElement) {
      if (console) {
        console.error('Bad element for ' + this.constructor.namespace + ': ' + (queryElement || element));
      }
      return;
    }
    this.element = queryElement;
    // add jQuery
    if (jQuery) {
      this.$element = jQuery(this.element);
    }

    // options
    this.options = utils.extend({}, this.constructor.defaults);
    this.option(options);

    // add id for Outlayer.getFromElement
    var id = ++GUID;
    this.element.outlayerGUID = id; // expando
    instances[id] = this; // associate via id

    // kick it off
    this._create();

    if (this.options.isInitLayout) {
      this.layout();
    }
  }

  // settings are for internal use only
  Outlayer.namespace = 'outlayer';
  Outlayer.Item = Item;

  // default options
  Outlayer.defaults = {
    containerStyle: {
      position: 'relative'
    },
    isInitLayout: true,
    isOriginLeft: true,
    isOriginTop: true,
    isResizeBound: true,
    isResizingContainer: true,
    // item options
    transitionDuration: '0.4s',
    hiddenStyle: {
      opacity: 0,
      transform: 'scale(0.001)'
    },
    visibleStyle: {
      opacity: 1,
      transform: 'scale(1)'
    }
  };

  // inherit EventEmitter
  utils.extend(Outlayer.prototype, EventEmitter.prototype);

  /**
   * set options
   * @param {Object} opts
   */
  Outlayer.prototype.option = function (opts) {
    utils.extend(this.options, opts);
  };

  Outlayer.prototype._create = function () {
    // get items from children
    this.reloadItems();
    // elements that affect layout, but are not laid out
    this.stamps = [];
    this.stamp(this.options.stamp);
    // set container style
    utils.extend(this.element.style, this.options.containerStyle);

    // bind resize method
    if (this.options.isResizeBound) {
      this.bindResize();
    }
  };

  // goes through all children again and gets bricks in proper order
  Outlayer.prototype.reloadItems = function () {
    // collection of item elements
    this.items = this._itemize(this.element.children);
  };

  /**
   * turn elements into Outlayer.Items to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - collection of new Outlayer Items
   */
  Outlayer.prototype._itemize = function (elems) {

    var itemElems = this._filterFindItemElements(elems);
    var Item = this.constructor.Item;

    // create new Outlayer Items for collection
    var items = [];
    for (var i = 0, len = itemElems.length; i < len; i++) {
      var elem = itemElems[i];
      var item = new Item(elem, this);
      items.push(item);
    }

    return items;
  };

  /**
   * get item elements to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - item elements
   */
  Outlayer.prototype._filterFindItemElements = function (elems) {
    return utils.filterFindElements(elems, this.options.itemSelector);
  };

  /**
   * getter method for getting item elements
   * @returns {Array} elems - collection of item elements
   */
  Outlayer.prototype.getItemElements = function () {
    var elems = [];
    for (var i = 0, len = this.items.length; i < len; i++) {
      elems.push(this.items[i].element);
    }
    return elems;
  };

  // ----- init & layout ----- //

  /**
   * lays out all items
   */
  Outlayer.prototype.layout = function () {
    this._resetLayout();
    this._manageStamps();

    // don't animate first layout
    var isInstant = this.options.isLayoutInstant !== undefined ? this.options.isLayoutInstant : !this._isLayoutInited;
    this.layoutItems(this.items, isInstant);

    // flag for initalized
    this._isLayoutInited = true;
  };

  // _init is alias for layout
  Outlayer.prototype._init = Outlayer.prototype.layout;

  /**
   * logic before any new layout
   */
  Outlayer.prototype._resetLayout = function () {
    this.getSize();
  };

  Outlayer.prototype.getSize = function () {
    this.size = getSize(this.element);
  };

  /**
   * get measurement from option, for columnWidth, rowHeight, gutter
   * if option is String -> get element from selector string, & get size of element
   * if option is Element -> get size of element
   * else use option as a number
   *
   * @param {String} measurement
   * @param {String} size - width or height
   * @private
   */
  Outlayer.prototype._getMeasurement = function (measurement, size) {
    var option = this.options[measurement];
    var elem;
    if (!option) {
      // default to 0
      this[measurement] = 0;
    } else {
      // use option as an element
      if (typeof option === 'string') {
        elem = this.element.querySelector(option);
      } else if (utils.isElement(option)) {
        elem = option;
      }
      // use size of element, if element
      this[measurement] = elem ? getSize(elem)[size] : option;
    }
  };

  /**
   * layout a collection of item elements
   * @api public
   */
  Outlayer.prototype.layoutItems = function (items, isInstant) {
    items = this._getItemsForLayout(items);

    this._layoutItems(items, isInstant);

    this._postLayout();
  };

  /**
   * get the items to be laid out
   * you may want to skip over some items
   * @param {Array} items
   * @returns {Array} items
   */
  Outlayer.prototype._getItemsForLayout = function (items) {
    var layoutItems = [];
    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      if (!item.isIgnored) {
        layoutItems.push(item);
      }
    }
    return layoutItems;
  };

  /**
   * layout items
   * @param {Array} items
   * @param {Boolean} isInstant
   */
  Outlayer.prototype._layoutItems = function (items, isInstant) {
    this._emitCompleteOnItems('layout', items);

    if (!items || !items.length) {
      // no items, emit event with empty array
      return;
    }

    var queue = [];

    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      // get x/y object from method
      var position = this._getItemLayoutPosition(item);
      // enqueue
      position.item = item;
      position.isInstant = isInstant || item.isLayoutInstant;
      queue.push(position);
    }

    this._processLayoutQueue(queue);
  };

  /**
   * get item layout position
   * @param {Outlayer.Item} item
   * @returns {Object} x and y position
   */
  Outlayer.prototype._getItemLayoutPosition = function () {
    return {
      x: 0,
      y: 0
    };
  };

  /**
   * iterate over array and position each item
   * Reason being - separating this logic prevents 'layout invalidation'
   * thx @paul_irish
   * @param {Array} queue
   */
  Outlayer.prototype._processLayoutQueue = function (queue) {
    for (var i = 0, len = queue.length; i < len; i++) {
      var obj = queue[i];
      this._positionItem(obj.item, obj.x, obj.y, obj.isInstant);
    }
  };

  /**
   * Sets position of item in DOM
   * @param {Outlayer.Item} item
   * @param {Number} x - horizontal position
   * @param {Number} y - vertical position
   * @param {Boolean} isInstant - disables transitions
   */
  Outlayer.prototype._positionItem = function (item, x, y, isInstant) {
    if (isInstant) {
      // if not transition, just set CSS
      item.goTo(x, y);
    } else {
      item.moveTo(x, y);
    }
  };

  /**
   * Any logic you want to do after each layout,
   * i.e. size the container
   */
  Outlayer.prototype._postLayout = function () {
    this.resizeContainer();
  };

  Outlayer.prototype.resizeContainer = function () {
    if (!this.options.isResizingContainer) {
      return;
    }
    var size = this._getContainerSize();
    if (size) {
      this._setContainerMeasure(size.width, true);
      this._setContainerMeasure(size.height, false);
    }
  };

  /**
   * Sets width or height of container if returned
   * @returns {Object} size
   *   @param {Number} width
   *   @param {Number} height
   */
  Outlayer.prototype._getContainerSize = noop;

  /**
   * @param {Number} measure - size of width or height
   * @param {Boolean} isWidth
   */
  Outlayer.prototype._setContainerMeasure = function (measure, isWidth) {
    if (measure === undefined) {
      return;
    }

    var elemSize = this.size;
    // add padding and border width if border box
    if (elemSize.isBorderBox) {
      measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
    }

    measure = Math.max(measure, 0);
    this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
  };

  /**
   * emit eventComplete on a collection of items events
   * @param {String} eventName
   * @param {Array} items - Outlayer.Items
   */
  Outlayer.prototype._emitCompleteOnItems = function (eventName, items) {
    var _this = this;
    function onComplete() {
      _this.dispatchEvent(eventName + 'Complete', null, [items]);
    }

    var count = items.length;
    if (!items || !count) {
      onComplete();
      return;
    }

    var doneCount = 0;
    function tick() {
      doneCount++;
      if (doneCount === count) {
        onComplete();
      }
    }

    // bind callback
    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      item.once(eventName, tick);
    }
  };

  /**
   * emits events via eventEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */
  Outlayer.prototype.dispatchEvent = function (type, event, args) {
    // add original event to arguments
    var emitArgs = event ? [event].concat(args) : args;
    this.emitEvent(type, emitArgs);

    if (jQuery) {
      // set this.$element
      this.$element = this.$element || jQuery(this.element);
      if (event) {
        // create jQuery event
        var $event = jQuery.Event(event);
        $event.type = type;
        this.$element.trigger($event, args);
      } else {
        // just trigger with type if no event available
        this.$element.trigger(type, args);
      }
    }
  };

  // -------------------------- ignore & stamps -------------------------- //

  /**
   * keep item in collection, but do not lay it out
   * ignored items do not get skipped in layout
   * @param {Element} elem
   */
  Outlayer.prototype.ignore = function (elem) {
    var item = this.getItem(elem);
    if (item) {
      item.isIgnored = true;
    }
  };

  /**
   * return item to layout collection
   * @param {Element} elem
   */
  Outlayer.prototype.unignore = function (elem) {
    var item = this.getItem(elem);
    if (item) {
      delete item.isIgnored;
    }
  };

  /**
   * adds elements to stamps
   * @param {NodeList, Array, Element, or String} elems
   */
  Outlayer.prototype.stamp = function (elems) {
    elems = this._find(elems);
    if (!elems) {
      return;
    }

    this.stamps = this.stamps.concat(elems);
    // ignore
    for (var i = 0, len = elems.length; i < len; i++) {
      var elem = elems[i];
      this.ignore(elem);
    }
  };

  /**
   * removes elements to stamps
   * @param {NodeList, Array, or Element} elems
   */
  Outlayer.prototype.unstamp = function (elems) {
    elems = this._find(elems);
    if (!elems) {
      return;
    }

    for (var i = 0, len = elems.length; i < len; i++) {
      var elem = elems[i];
      // filter out removed stamp elements
      utils.removeFrom(this.stamps, elem);
      this.unignore(elem);
    }
  };

  /**
   * finds child elements
   * @param {NodeList, Array, Element, or String} elems
   * @returns {Array} elems
   */
  Outlayer.prototype._find = function (elems) {
    if (!elems) {
      return;
    }
    // if string, use argument as selector string
    if (typeof elems === 'string') {
      elems = this.element.querySelectorAll(elems);
    }
    elems = utils.makeArray(elems);
    return elems;
  };

  Outlayer.prototype._manageStamps = function () {
    if (!this.stamps || !this.stamps.length) {
      return;
    }

    this._getBoundingRect();

    for (var i = 0, len = this.stamps.length; i < len; i++) {
      var stamp = this.stamps[i];
      this._manageStamp(stamp);
    }
  };

  // update boundingLeft / Top
  Outlayer.prototype._getBoundingRect = function () {
    // get bounding rect for container element
    var boundingRect = this.element.getBoundingClientRect();
    var size = this.size;
    this._boundingRect = {
      left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
      top: boundingRect.top + size.paddingTop + size.borderTopWidth,
      right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
      bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
    };
  };

  /**
   * @param {Element} stamp
  **/
  Outlayer.prototype._manageStamp = noop;

  /**
   * get x/y position of element relative to container element
   * @param {Element} elem
   * @returns {Object} offset - has left, top, right, bottom
   */
  Outlayer.prototype._getElementOffset = function (elem) {
    var boundingRect = elem.getBoundingClientRect();
    var thisRect = this._boundingRect;
    var size = getSize(elem);
    var offset = {
      left: boundingRect.left - thisRect.left - size.marginLeft,
      top: boundingRect.top - thisRect.top - size.marginTop,
      right: thisRect.right - boundingRect.right - size.marginRight,
      bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
    };
    return offset;
  };

  // -------------------------- resize -------------------------- //

  // enable event handlers for listeners
  // i.e. resize -> onresize
  Outlayer.prototype.handleEvent = function (event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  /**
   * Bind layout to window resizing
   */
  Outlayer.prototype.bindResize = function () {
    // bind just one listener
    if (this.isResizeBound) {
      return;
    }
    eventie.bind(window, 'resize', this);
    this.isResizeBound = true;
  };

  /**
   * Unbind layout to window resizing
   */
  Outlayer.prototype.unbindResize = function () {
    if (this.isResizeBound) {
      eventie.unbind(window, 'resize', this);
    }
    this.isResizeBound = false;
  };

  // original debounce by John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/

  // this fires every resize
  Outlayer.prototype.onresize = function () {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    var _this = this;
    function delayed() {
      _this.resize();
      delete _this.resizeTimeout;
    }

    this.resizeTimeout = setTimeout(delayed, 100);
  };

  // debounced, layout on resize
  Outlayer.prototype.resize = function () {
    // don't trigger if size did not change
    // or if resize was unbound. See #9
    if (!this.isResizeBound || !this.needsResizeLayout()) {
      return;
    }

    this.layout();
  };

  /**
   * check if layout is needed post layout
   * @returns Boolean
   */
  Outlayer.prototype.needsResizeLayout = function () {
    var size = getSize(this.element);
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var hasSizes = this.size && size;
    return hasSizes && size.innerWidth !== this.size.innerWidth;
  };

  // -------------------------- methods -------------------------- //

  /**
   * add items to Outlayer instance
   * @param {Array or NodeList or Element} elems
   * @returns {Array} items - Outlayer.Items
  **/
  Outlayer.prototype.addItems = function (elems) {
    var items = this._itemize(elems);
    // add items to collection
    if (items.length) {
      this.items = this.items.concat(items);
    }
    return items;
  };

  /**
   * Layout newly-appended item elements
   * @param {Array or NodeList or Element} elems
   */
  Outlayer.prototype.appended = function (elems) {
    var items = this.addItems(elems);
    if (!items.length) {
      return;
    }
    // layout and reveal just the new items
    this.layoutItems(items, true);
    this.reveal(items);
  };

  /**
   * Layout prepended elements
   * @param {Array or NodeList or Element} elems
   */
  Outlayer.prototype.prepended = function (elems) {
    var items = this._itemize(elems);
    if (!items.length) {
      return;
    }
    // add items to beginning of collection
    var previousItems = this.items.slice(0);
    this.items = items.concat(previousItems);
    // start new layout
    this._resetLayout();
    this._manageStamps();
    // layout new stuff without transition
    this.layoutItems(items, true);
    this.reveal(items);
    // layout previous items
    this.layoutItems(previousItems);
  };

  /**
   * reveal a collection of items
   * @param {Array of Outlayer.Items} items
   */
  Outlayer.prototype.reveal = function (items) {
    this._emitCompleteOnItems('reveal', items);

    var len = items && items.length;
    for (var i = 0; len && i < len; i++) {
      var item = items[i];
      item.reveal();
    }
  };

  /**
   * hide a collection of items
   * @param {Array of Outlayer.Items} items
   */
  Outlayer.prototype.hide = function (items) {
    this._emitCompleteOnItems('hide', items);

    var len = items && items.length;
    for (var i = 0; len && i < len; i++) {
      var item = items[i];
      item.hide();
    }
  };

  /**
   * reveal item elements
   * @param {Array}, {Element}, {NodeList} items
   */
  Outlayer.prototype.revealItemElements = function (elems) {
    var items = this.getItems(elems);
    this.reveal(items);
  };

  /**
   * hide item elements
   * @param {Array}, {Element}, {NodeList} items
   */
  Outlayer.prototype.hideItemElements = function (elems) {
    var items = this.getItems(elems);
    this.hide(items);
  };

  /**
   * get Outlayer.Item, given an Element
   * @param {Element} elem
   * @param {Function} callback
   * @returns {Outlayer.Item} item
   */
  Outlayer.prototype.getItem = function (elem) {
    // loop through items to get the one that matches
    for (var i = 0, len = this.items.length; i < len; i++) {
      var item = this.items[i];
      if (item.element === elem) {
        // return item
        return item;
      }
    }
  };

  /**
   * get collection of Outlayer.Items, given Elements
   * @param {Array} elems
   * @returns {Array} items - Outlayer.Items
   */
  Outlayer.prototype.getItems = function (elems) {
    elems = utils.makeArray(elems);
    var items = [];
    for (var i = 0, len = elems.length; i < len; i++) {
      var elem = elems[i];
      var item = this.getItem(elem);
      if (item) {
        items.push(item);
      }
    }

    return items;
  };

  /**
   * remove element(s) from instance and DOM
   * @param {Array or NodeList or Element} elems
   */
  Outlayer.prototype.remove = function (elems) {
    var removeItems = this.getItems(elems);

    this._emitCompleteOnItems('remove', removeItems);

    // bail if no items to remove
    if (!removeItems || !removeItems.length) {
      return;
    }

    for (var i = 0, len = removeItems.length; i < len; i++) {
      var item = removeItems[i];
      item.remove();
      // remove item from collection
      utils.removeFrom(this.items, item);
    }
  };

  // ----- destroy ----- //

  // remove and disable Outlayer instance
  Outlayer.prototype.destroy = function () {
    // clean up dynamic styles
    var style = this.element.style;
    style.height = '';
    style.position = '';
    style.width = '';
    // destroy items
    for (var i = 0, len = this.items.length; i < len; i++) {
      var item = this.items[i];
      item.destroy();
    }

    this.unbindResize();

    var id = this.element.outlayerGUID;
    delete instances[id]; // remove reference to instance by id
    delete this.element.outlayerGUID;
    // remove data for jQuery
    if (jQuery) {
      jQuery.removeData(this.element, this.constructor.namespace);
    }
  };

  // -------------------------- data -------------------------- //

  /**
   * get Outlayer instance from element
   * @param {Element} elem
   * @returns {Outlayer}
   */
  Outlayer.data = function (elem) {
    elem = utils.getQueryElement(elem);
    var id = elem && elem.outlayerGUID;
    return id && instances[id];
  };

  // -------------------------- create Outlayer class -------------------------- //

  /**
   * create a layout class
   * @param {String} namespace
   */
  Outlayer.create = function (namespace, options) {
    // sub-class Outlayer
    function Layout() {
      Outlayer.apply(this, arguments);
    }
    // inherit Outlayer prototype, use Object.create if there
    if (Object.create) {
      Layout.prototype = Object.create(Outlayer.prototype);
    } else {
      utils.extend(Layout.prototype, Outlayer.prototype);
    }
    // set contructor, used for namespace and Item
    Layout.prototype.constructor = Layout;

    Layout.defaults = utils.extend({}, Outlayer.defaults);
    // apply new options
    utils.extend(Layout.defaults, options);
    // keep prototype.settings for backwards compatibility (Packery v1.2.0)
    Layout.prototype.settings = {};

    Layout.namespace = namespace;

    Layout.data = Outlayer.data;

    // sub-class Item
    Layout.Item = function LayoutItem() {
      Item.apply(this, arguments);
    };

    Layout.Item.prototype = new Item();

    // -------------------------- declarative -------------------------- //

    utils.htmlInit(Layout, namespace);

    // -------------------------- jQuery bridge -------------------------- //

    // make into jQuery plugin
    if (jQuery && jQuery.bridget) {
      jQuery.bridget(namespace, Layout);
    }

    return Layout;
  };

  // ----- fin ----- //

  // back in global
  Outlayer.Item = Item;

  return Outlayer;
});
/* item */
/*!
 * Bootstrap v3.3.5 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under the MIT license
 */

'use strict';

if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery');
}

+(function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.');
  if (version[0] < 2 && version[1] < 9 || version[0] == 1 && version[1] == 9 && version[2] < 1) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher');
  }
})(jQuery);

/* ========================================================================
 * Bootstrap: transition.js v3.3.5
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap');

    var transEndEventNames = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      OTransition: 'oTransitionEnd otransitionend',
      transition: 'transitionend'
    };

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }

    return false // explicit for ie8 (  ._.)
    ;
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false;
    var $el = this;
    $(this).one('bsTransitionEnd', function () {
      called = true;
    });
    var callback = function callback() {
      if (!called) $($el).trigger($.support.transition.end);
    };
    setTimeout(callback, duration);
    return this;
  };

  $(function () {
    $.support.transition = transitionEnd();

    if (!$.support.transition) return;

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function handle(e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments);
      }
    };
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.3.5
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]';
  var Alert = function Alert(el) {
    $(el).on('click', dismiss, this.close);
  };

  Alert.VERSION = '3.3.5';

  Alert.TRANSITION_DURATION = 150;

  Alert.prototype.close = function (e) {
    var $this = $(this);
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
      ;
    }

    var $parent = $(selector);

    if (e) e.preventDefault();

    if (!$parent.length) {
      $parent = $this.closest('.alert');
    }

    $parent.trigger(e = $.Event('close.bs.alert'));

    if (e.isDefaultPrevented()) return;

    $parent.removeClass('in');

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove();
    }

    $.support.transition && $parent.hasClass('fade') ? $parent.one('bsTransitionEnd', removeElement).emulateTransitionEnd(Alert.TRANSITION_DURATION) : removeElement();
  };

  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.alert');

      if (!data) $this.data('bs.alert', data = new Alert(this));
      if (typeof option == 'string') data[option].call($this);
    });
  }

  var old = $.fn.alert;

  $.fn.alert = Plugin;
  $.fn.alert.Constructor = Alert;

  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this;
  };

  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close);
})(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.3.5
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function Button(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Button.DEFAULTS, options);
    this.isLoading = false;
  };

  Button.VERSION = '3.3.5';

  Button.DEFAULTS = {
    loadingText: 'loading...'
  };

  Button.prototype.setState = function (state) {
    var d = 'disabled';
    var $el = this.$element;
    var val = $el.is('input') ? 'val' : 'html';
    var data = $el.data();

    state += 'Text';

    if (data.resetText == null) $el.data('resetText', $el[val]());

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state]);

      if (state == 'loadingText') {
        this.isLoading = true;
        $el.addClass(d).attr(d, d);
      } else if (this.isLoading) {
        this.isLoading = false;
        $el.removeClass(d).removeAttr(d);
      }
    }, this), 0);
  };

  Button.prototype.toggle = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find('input');
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) changed = false;
        $parent.find('.active').removeClass('active');
        this.$element.addClass('active');
      } else if ($input.prop('type') == 'checkbox') {
        if ($input.prop('checked') !== this.$element.hasClass('active')) changed = false;
        this.$element.toggleClass('active');
      }
      $input.prop('checked', this.$element.hasClass('active'));
      if (changed) $input.trigger('change');
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'));
      this.$element.toggleClass('active');
    }
  };

  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.button');
      var options = typeof option == 'object' && option;

      if (!data) $this.data('bs.button', data = new Button(this, options));

      if (option == 'toggle') data.toggle();else if (option) data.setState(option);
    });
  }

  var old = $.fn.button;

  $.fn.button = Plugin;
  $.fn.button.Constructor = Button;

  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  };

  // BUTTON DATA-API
  // ===============

  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target);
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn');
    Plugin.call($btn, 'toggle');
    if (!($(e.target).is('input[type="radio"]') || $(e.target).is('input[type="checkbox"]'))) e.preventDefault();
  }).on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.3.5
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function Carousel(element, options) {
    this.$element = $(element);
    this.$indicators = this.$element.find('.carousel-indicators');
    this.options = options;
    this.paused = null;
    this.sliding = null;
    this.interval = null;
    this.$active = null;
    this.$items = null;

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this));

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element.on('mouseenter.bs.carousel', $.proxy(this.pause, this)).on('mouseleave.bs.carousel', $.proxy(this.cycle, this));
  };

  Carousel.VERSION = '3.3.5';

  Carousel.TRANSITION_DURATION = 600;

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return;
    switch (e.which) {
      case 37:
        this.prev();break;
      case 39:
        this.next();break;
      default:
        return;
    }

    e.preventDefault();
  };

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false);

    this.interval && clearInterval(this.interval);

    this.options.interval && !this.paused && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));

    return this;
  };

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item');
    return this.$items.index(item || this.$active);
  };

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var willWrap = direction == 'prev' && activeIndex === 0 || direction == 'next' && activeIndex == this.$items.length - 1;
    if (willWrap && !this.options.wrap) return active;
    var delta = direction == 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta) % this.$items.length;
    return this.$items.eq(itemIndex);
  };

  Carousel.prototype.to = function (pos) {
    var that = this;
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'));

    if (pos > this.$items.length - 1 || pos < 0) return;

    if (this.sliding) return this.$element.one('slid.bs.carousel', function () {
      that.to(pos);
    }); // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle();

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos));
  };

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true);

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end);
      this.cycle(true);
    }

    this.interval = clearInterval(this.interval);

    return this;
  };

  Carousel.prototype.next = function () {
    if (this.sliding) return;
    return this.slide('next');
  };

  Carousel.prototype.prev = function () {
    if (this.sliding) return;
    return this.slide('prev');
  };

  Carousel.prototype.slide = function (type, next) {
    var $active = this.$element.find('.item.active');
    var $next = next || this.getItemForDirection(type, $active);
    var isCycling = this.interval;
    var direction = type == 'next' ? 'left' : 'right';
    var that = this;

    if ($next.hasClass('active')) return this.sliding = false;

    var relatedTarget = $next[0];
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    });
    this.$element.trigger(slideEvent);
    if (slideEvent.isDefaultPrevented()) return;

    this.sliding = true;

    isCycling && this.pause();

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active');
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)]);
      $nextIndicator && $nextIndicator.addClass('active');
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }); // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type);
      $next[0].offsetWidth; // force reflow
      $active.addClass(direction);
      $next.addClass(direction);
      $active.one('bsTransitionEnd', function () {
        $next.removeClass([type, direction].join(' ')).addClass('active');
        $active.removeClass(['active', direction].join(' '));
        that.sliding = false;
        setTimeout(function () {
          that.$element.trigger(slidEvent);
        }, 0);
      }).emulateTransitionEnd(Carousel.TRANSITION_DURATION);
    } else {
      $active.removeClass('active');
      $next.addClass('active');
      this.sliding = false;
      this.$element.trigger(slidEvent);
    }

    isCycling && this.cycle();

    return this;
  };

  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.carousel');
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
      var action = typeof option == 'string' ? option : options.slide;

      if (!data) $this.data('bs.carousel', data = new Carousel(this, options));
      if (typeof option == 'number') data.to(option);else if (action) data[action]();else if (options.interval) data.pause().cycle();
    });
  }

  var old = $.fn.carousel;

  $.fn.carousel = Plugin;
  $.fn.carousel.Constructor = Carousel;

  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old;
    return this;
  };

  // CAROUSEL DATA-API
  // =================

  var clickHandler = function clickHandler(e) {
    var href;
    var $this = $(this);
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
    if (!$target.hasClass('carousel')) return;
    var options = $.extend({}, $target.data(), $this.data());
    var slideIndex = $this.attr('data-slide-to');
    if (slideIndex) options.interval = false;

    Plugin.call($target, options);

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex);
    }

    e.preventDefault();
  };

  $(document).on('click.bs.carousel.data-api', '[data-slide]', clickHandler).on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler);

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this);
      Plugin.call($carousel, $carousel.data());
    });
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.3.5
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function Collapse(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' + '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }

    if (this.options.toggle) this.toggle();
  };

  Collapse.VERSION = '3.3.5';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height';
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return;

    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) return;
    }

    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    if (actives && actives.length) {
      Plugin.call(actives, 'hide');
      activesData || actives.data('bs.collapse', null);
    }

    var dimension = this.dimension();

    this.$element.removeClass('collapse').addClass('collapsing')[dimension](0).attr('aria-expanded', true);

    this.$trigger.removeClass('collapsed').attr('aria-expanded', true);

    this.transitioning = 1;

    var complete = function complete() {
      this.$element.removeClass('collapsing').addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element.trigger('shown.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    var scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element.one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return;

    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    var dimension = this.dimension();

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;

    this.$element.addClass('collapsing').removeClass('collapse in').attr('aria-expanded', false);

    this.$trigger.addClass('collapsed').attr('aria-expanded', false);

    this.transitioning = 1;

    var complete = function complete() {
      this.transitioning = 0;
      this.$element.removeClass('collapsing').addClass('collapse').trigger('hidden.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    this.$element[dimension](0).one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  Collapse.prototype.getParent = function () {
    return $(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each($.proxy(function (i, element) {
      var $element = $(element);
      this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
    }, this)).end();
  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');

    $element.attr('aria-expanded', isOpen);
    $trigger.toggleClass('collapsed', !isOpen).attr('aria-expanded', isOpen);
  };

  function getTargetFromTrigger($trigger) {
    var href;
    var target = $trigger.attr('data-target') || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

    return $(target);
  }

  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false;
      if (!data) $this.data('bs.collapse', data = new Collapse(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.collapse;

  $.fn.collapse = Plugin;
  $.fn.collapse.Constructor = Collapse;

  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this;
  };

  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);

    if (!$this.attr('data-target')) e.preventDefault();

    var $target = getTargetFromTrigger($this);
    var data = $target.data('bs.collapse');
    var option = data ? 'toggle' : $this.data();

    Plugin.call($target, option);
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.3.5
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop';
  var toggle = '[data-toggle="dropdown"]';
  var Dropdown = function Dropdown(element) {
    $(element).on('click.bs.dropdown', this.toggle);
  };

  Dropdown.VERSION = '3.3.5';

  function getParent($this) {
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
      ;
    }

    var $parent = selector && $(selector);

    return $parent && $parent.length ? $parent : $this.parent();
  }

  function clearMenus(e) {
    if (e && e.which === 3) return;
    $(backdrop).remove();
    $(toggle).each(function () {
      var $this = $(this);
      var $parent = getParent($this);
      var relatedTarget = { relatedTarget: this };

      if (!$parent.hasClass('open')) return;

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return;

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) return;

      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget);
    });
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this);

    if ($this.is('.disabled, :disabled')) return;

    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');

    clearMenus();

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div')).addClass('dropdown-backdrop').insertAfter($(this)).on('click', clearMenus);
      }

      var relatedTarget = { relatedTarget: this };
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) return;

      $this.trigger('focus').attr('aria-expanded', 'true');

      $parent.toggleClass('open').trigger('shown.bs.dropdown', relatedTarget);
    }

    return false;
  };

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

    var $this = $(this);

    e.preventDefault();
    e.stopPropagation();

    if ($this.is('.disabled, :disabled')) return;

    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus');
      return $this.trigger('click');
    }

    var desc = ' li:not(.disabled):visible a';
    var $items = $parent.find('.dropdown-menu' + desc);

    if (!$items.length) return;

    var index = $items.index(e.target);

    if (e.which == 38 && index > 0) index--; // up
    if (e.which == 40 && index < $items.length - 1) index++; // down
    if (! ~index) index = 0;

    $items.eq(index).trigger('focus');
  };

  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.dropdown');

      if (!data) $this.data('bs.dropdown', data = new Dropdown(this));
      if (typeof option == 'string') data[option].call($this);
    });
  }

  var old = $.fn.dropdown;

  $.fn.dropdown = Plugin;
  $.fn.dropdown.Constructor = Dropdown;

  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old;
    return this;
  };

  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document).on('click.bs.dropdown.data-api', clearMenus).on('click.bs.dropdown.data-api', '.dropdown form', function (e) {
    e.stopPropagation();
  }).on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle).on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown).on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown);
})(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.3.5
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function Modal(element, options) {
    this.options = options;
    this.$body = $(document.body);
    this.$element = $(element);
    this.$dialog = this.$element.find('.modal-dialog');
    this.$backdrop = null;
    this.isShown = null;
    this.originalBodyPad = null;
    this.scrollbarWidth = 0;
    this.ignoreBackdropClick = false;

    if (this.options.remote) {
      this.$element.find('.modal-content').load(this.options.remote, $.proxy(function () {
        this.$element.trigger('loaded.bs.modal');
      }, this));
    }
  };

  Modal.VERSION = '3.3.5';

  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget);
  };

  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) return;

    this.isShown = true;

    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');

    this.escape();
    this.resize();

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true;
      });
    });

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body);
      }

      that.$element.show().scrollTop(0);

      that.adjustDialog();

      if (transition) {
        that.$element[0].offsetWidth // force reflow
        ;
      }

      that.$element.addClass('in');

      that.enforceFocus();

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });

      transition ? that.$dialog // wait for modal to slide in
      .one('bsTransitionEnd', function () {
        that.$element.trigger('focus').trigger(e);
      }).emulateTransitionEnd(Modal.TRANSITION_DURATION) : that.$element.trigger('focus').trigger(e);
    });
  };

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault();

    e = $.Event('hide.bs.modal');

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) return;

    this.isShown = false;

    this.escape();
    this.resize();

    $(document).off('focusin.bs.modal');

    this.$element.removeClass('in').off('click.dismiss.bs.modal').off('mouseup.dismiss.bs.modal');

    this.$dialog.off('mousedown.dismiss.bs.modal');

    $.support.transition && this.$element.hasClass('fade') ? this.$element.one('bsTransitionEnd', $.proxy(this.hideModal, this)).emulateTransitionEnd(Modal.TRANSITION_DURATION) : this.hideModal();
  };

  Modal.prototype.enforceFocus = function () {
    $(document).off('focusin.bs.modal') // guard against infinite focus loop
    .on('focusin.bs.modal', $.proxy(function (e) {
      if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.trigger('focus');
      }
    }, this));
  };

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };

  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };

  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;

      this.$backdrop = $(document.createElement('div')).addClass('modal-backdrop ' + animate).appendTo(this.$body);

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false;
          return;
        }
        if (e.target !== e.currentTarget) return;
        this.options.backdrop == 'static' ? this.$element[0].focus() : this.hide();
      }, this));

      if (doAnimate) this.$backdrop[0].offsetWidth; // force reflow

      this.$backdrop.addClass('in');

      if (!callback) return;

      doAnimate ? this.$backdrop.one('bsTransitionEnd', callback).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callback();
    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');

      var callbackRemove = function callbackRemove() {
        that.removeBackdrop();
        callback && callback();
      };
      $.support.transition && this.$element.hasClass('fade') ? this.$backdrop.one('bsTransitionEnd', callbackRemove).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callbackRemove();
    } else if (callback) {
      callback();
    }
  };

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog();
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

    this.$element.css({
      paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) {
      // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt(this.$body.css('padding-right') || 0, 10);
    this.originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
  };

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad);
  };

  Modal.prototype.measureScrollbar = function () {
    // thx walsh
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth;
  };

  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data) $this.data('bs.modal', data = new Modal(this, options));
      if (typeof option == 'string') data[option](_relatedTarget);else if (options.show) data.show(_relatedTarget);
    });
  }

  var old = $.fn.modal;

  $.fn.modal = Plugin;
  $.fn.modal.Constructor = Modal;

  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };

  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this);
    var href = $this.attr('href');
    var $target = $($this.attr('data-target') || href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
    var option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return; // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.3.5
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function Tooltip(element, options) {
    this.type = null;
    this.options = null;
    this.enabled = null;
    this.timeout = null;
    this.hoverState = null;
    this.$element = null;
    this.inState = null;

    this.init('tooltip', element, options);
  };

  Tooltip.VERSION = '3.3.5';

  Tooltip.TRANSITION_DURATION = 150;

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  };

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled = true;
    this.type = type;
    this.$element = $(element);
    this.options = this.getOptions(options);
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport);
    this.inState = { click: false, hover: false, focus: false };

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!');
    }

    var triggers = this.options.trigger.split(' ');

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i];

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
      } else if (trigger != 'manual') {
        var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

        this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
      }
    }

    this.options.selector ? this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' }) : this.fixTitle();
  };

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS;
  };

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options);

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      };
    }

    return options;
  };

  Tooltip.prototype.getDelegateOptions = function () {
    var options = {};
    var defaults = this.getDefaults();

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value;
    });

    return options;
  };

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true;
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in';
      return;
    }

    clearTimeout(self.timeout);

    self.hoverState = 'in';

    if (!self.options.delay || !self.options.delay.show) return self.show();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show();
    }, self.options.delay.show);
  };

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true;
    }

    return false;
  };

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false;
    }

    if (self.isInStateTrue()) return;

    clearTimeout(self.timeout);

    self.hoverState = 'out';

    if (!self.options.delay || !self.options.delay.hide) return self.hide();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide();
    }, self.options.delay.hide);
  };

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type);

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e);

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
      if (e.isDefaultPrevented() || !inDom) return;
      var that = this;

      var $tip = this.tip();

      var tipId = this.getUID(this.type);

      this.setContent();
      $tip.attr('id', tipId);
      this.$element.attr('aria-describedby', tipId);

      if (this.options.animation) $tip.addClass('fade');

      var placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;

      var autoToken = /\s?auto?\s?/i;
      var autoPlace = autoToken.test(placement);
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

      $tip.detach().css({ top: 0, left: 0, display: 'block' }).addClass(placement).data('bs.' + this.type, this);

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
      this.$element.trigger('inserted.bs.' + this.type);

      var pos = this.getPosition();
      var actualWidth = $tip[0].offsetWidth;
      var actualHeight = $tip[0].offsetHeight;

      if (autoPlace) {
        var orgPlacement = placement;
        var viewportDim = this.getPosition(this.$viewport);

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top' : placement == 'top' && pos.top - actualHeight < viewportDim.top ? 'bottom' : placement == 'right' && pos.right + actualWidth > viewportDim.width ? 'left' : placement == 'left' && pos.left - actualWidth < viewportDim.left ? 'right' : placement;

        $tip.removeClass(orgPlacement).addClass(placement);
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

      this.applyPlacement(calculatedOffset, placement);

      var complete = function complete() {
        var prevHoverState = that.hoverState;
        that.$element.trigger('shown.bs.' + that.type);
        that.hoverState = null;

        if (prevHoverState == 'out') that.leave(that);
      };

      $.support.transition && this.$tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
    }
  };

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip = this.tip();
    var width = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop)) marginTop = 0;
    if (isNaN(marginLeft)) marginLeft = 0;

    offset.top += marginTop;
    offset.left += marginLeft;

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function using(props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        });
      }
    }, offset), 0);

    $tip.addClass('in');

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight;
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

    if (delta.left) offset.left += delta.left;else offset.top += delta.top;

    var isVertical = /top|bottom/.test(placement);
    var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

    $tip.offset(offset);
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
  };

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow().css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isVertical ? 'top' : 'left', '');
  };

  Tooltip.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title);
    $tip.removeClass('fade in top bottom left right');
  };

  Tooltip.prototype.hide = function (callback) {
    var that = this;
    var $tip = $(this.$tip);
    var e = $.Event('hide.bs.' + this.type);

    function complete() {
      if (that.hoverState != 'in') $tip.detach();
      that.$element.removeAttr('aria-describedby').trigger('hidden.bs.' + that.type);
      callback && callback();
    }

    this.$element.trigger(e);

    if (e.isDefaultPrevented()) return;

    $tip.removeClass('in');

    $.support.transition && $tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();

    this.hoverState = null;

    return this;
  };

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element;
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
    }
  };

  Tooltip.prototype.hasContent = function () {
    return this.getTitle();
  };

  Tooltip.prototype.getPosition = function ($element) {
    $element = $element || this.$element;

    var el = $element[0];
    var isBody = el.tagName == 'BODY';

    var elRect = el.getBoundingClientRect();
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top });
    }
    var elOffset = isBody ? { top: 0, left: 0 } : $element.offset();
    var scroll = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

    return $.extend({}, elRect, scroll, outerDims, elOffset);
  };

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'top' ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'left' ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
    /* placement == 'right' */{ top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width };
  };

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };
    if (!this.$viewport) return delta;

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);

    if (/right|left/.test(placement)) {
      var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
      if (topEdgeOffset < viewportDimensions.top) {
        // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset;
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
        // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset = pos.left - viewportPadding;
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
      if (leftEdgeOffset < viewportDimensions.left) {
        // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset;
      } else if (rightEdgeOffset > viewportDimensions.right) {
        // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
      }
    }

    return delta;
  };

  Tooltip.prototype.getTitle = function () {
    var title;
    var $e = this.$element;
    var o = this.options;

    title = $e.attr('data-original-title') || (typeof o.title == 'function' ? o.title.call($e[0]) : o.title);

    return title;
  };

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~ ~(Math.random() * 1000000); while (document.getElementById(prefix));
    return prefix;
  };

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template);
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!');
      }
    }
    return this.$tip;
  };

  Tooltip.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow');
  };

  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };

  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };

  Tooltip.prototype.toggle = function (e) {
    var self = this;
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type);
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions());
        $(e.currentTarget).data('bs.' + this.type, self);
      }
    }

    if (e) {
      self.inState.click = !self.inState.click;
      if (self.isInStateTrue()) self.enter(self);else self.leave(self);
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
    }
  };

  Tooltip.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type);
      if (that.$tip) {
        that.$tip.detach();
      }
      that.$tip = null;
      that.$arrow = null;
      that.$viewport = null;
    });
  };

  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tooltip');
      var options = typeof option == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.tooltip', data = new Tooltip(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tooltip;

  $.fn.tooltip = Plugin;
  $.fn.tooltip.Constructor = Tooltip;

  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this;
  };
})(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.3.5
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function Popover(element, options) {
    this.init('popover', element, options);
  };

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js');

  Popover.VERSION = '3.3.5';

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  });

  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

  Popover.prototype.constructor = Popover;

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS;
  };

  Popover.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();
    var content = this.getContent();

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title);
    $tip.find('.popover-content').children().detach().end()[// we use append for html objects to maintain js events
    this.options.html ? typeof content == 'string' ? 'html' : 'append' : 'text'](content);

    $tip.removeClass('fade top bottom left right in');

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide();
  };

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  };

  Popover.prototype.getContent = function () {
    var $e = this.$element;
    var o = this.options;

    return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
  };

  Popover.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.arrow');
  };

  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.popover');
      var options = typeof option == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.popover', data = new Popover(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.popover;

  $.fn.popover = Plugin;
  $.fn.popover.Constructor = Popover;

  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old;
    return this;
  };
})(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.5
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body = $(document.body);
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element);
    this.options = $.extend({}, ScrollSpy.DEFAULTS, options);
    this.selector = (this.options.target || '') + ' .nav li > a';
    this.offsets = [];
    this.targets = [];
    this.activeTarget = null;
    this.scrollHeight = 0;

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this));
    this.refresh();
    this.process();
  }

  ScrollSpy.VERSION = '3.3.5';

  ScrollSpy.DEFAULTS = {
    offset: 10
  };

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
  };

  ScrollSpy.prototype.refresh = function () {
    var that = this;
    var offsetMethod = 'offset';
    var offsetBase = 0;

    this.offsets = [];
    this.targets = [];
    this.scrollHeight = this.getScrollHeight();

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position';
      offsetBase = this.$scrollElement.scrollTop();
    }

    this.$body.find(this.selector).map(function () {
      var $el = $(this);
      var href = $el.data('target') || $el.attr('href');
      var $href = /^#./.test(href) && $(href);

      return $href && $href.length && $href.is(':visible') && [[$href[offsetMethod]().top + offsetBase, href]] || null;
    }).sort(function (a, b) {
      return a[0] - b[0];
    }).each(function () {
      that.offsets.push(this[0]);
      that.targets.push(this[1]);
    });
  };

  ScrollSpy.prototype.process = function () {
    var scrollTop = this.$scrollElement.scrollTop() + this.options.offset;
    var scrollHeight = this.getScrollHeight();
    var maxScroll = this.options.offset + scrollHeight - this.$scrollElement.height();
    var offsets = this.offsets;
    var targets = this.targets;
    var activeTarget = this.activeTarget;
    var i;

    if (this.scrollHeight != scrollHeight) {
      this.refresh();
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i);
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null;
      return this.clear();
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i] && scrollTop >= offsets[i] && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1]) && this.activate(targets[i]);
    }
  };

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target;

    this.clear();

    var selector = this.selector + '[data-target="' + target + '"],' + this.selector + '[href="' + target + '"]';

    var active = $(selector).parents('li').addClass('active');

    if (active.parent('.dropdown-menu').length) {
      active = active.closest('li.dropdown').addClass('active');
    }

    active.trigger('activate.bs.scrollspy');
  };

  ScrollSpy.prototype.clear = function () {
    $(this.selector).parentsUntil(this.options.target, '.active').removeClass('active');
  };

  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.scrollspy');
      var options = typeof option == 'object' && option;

      if (!data) $this.data('bs.scrollspy', data = new ScrollSpy(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.scrollspy;

  $.fn.scrollspy = Plugin;
  $.fn.scrollspy.Constructor = ScrollSpy;

  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old;
    return this;
  };

  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this);
      Plugin.call($spy, $spy.data());
    });
  });
})(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.3.5
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function Tab(element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element)
    // jscs:enable requireDollarBeforejQueryAssignment
    ;
  };

  Tab.VERSION = '3.3.5';

  Tab.TRANSITION_DURATION = 150;

  Tab.prototype.show = function () {
    var $this = this.element;
    var $ul = $this.closest('ul:not(.dropdown-menu)');
    var selector = $this.data('target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
      ;
    }

    if ($this.parent('li').hasClass('active')) return;

    var $previous = $ul.find('.active:last a');
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    });
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    });

    $previous.trigger(hideEvent);
    $this.trigger(showEvent);

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return;

    var $target = $(selector);

    this.activate($this.closest('li'), $ul);
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      });
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      });
    });
  };

  Tab.prototype.activate = function (element, container, callback) {
    var $active = container.find('> .active');
    var transition = callback && $.support.transition && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length);

    function next() {
      $active.removeClass('active').find('> .dropdown-menu > .active').removeClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', false);

      element.addClass('active').find('[data-toggle="tab"]').attr('aria-expanded', true);

      if (transition) {
        element[0].offsetWidth; // reflow for transition
        element.addClass('in');
      } else {
        element.removeClass('fade');
      }

      if (element.parent('.dropdown-menu').length) {
        element.closest('li.dropdown').addClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', true);
      }

      callback && callback();
    }

    $active.length && transition ? $active.one('bsTransitionEnd', next).emulateTransitionEnd(Tab.TRANSITION_DURATION) : next();

    $active.removeClass('in');
  };

  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tab');

      if (!data) $this.data('bs.tab', data = new Tab(this));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tab;

  $.fn.tab = Plugin;
  $.fn.tab.Constructor = Tab;

  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old;
    return this;
  };

  // TAB DATA-API
  // ============

  var clickHandler = function clickHandler(e) {
    e.preventDefault();
    Plugin.call($(this), 'show');
  };

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler).on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler);
})(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.3.5
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+(function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function Affix(element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options);

    this.$target = $(this.options.target).on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this)).on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this));

    this.$element = $(element);
    this.affixed = null;
    this.unpin = null;
    this.pinnedOffset = null;

    this.checkPosition();
  };

  Affix.VERSION = '3.3.5';

  Affix.RESET = 'affix affix-top affix-bottom';

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  };

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    var targetHeight = this.$target.height();

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false;

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return scrollTop + this.unpin <= position.top ? false : 'bottom';
      return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
    }

    var initializing = this.affixed == null;
    var colliderTop = initializing ? scrollTop : position.top;
    var colliderHeight = initializing ? targetHeight : height;

    if (offsetTop != null && scrollTop <= offsetTop) return 'top';
    if (offsetBottom != null && colliderTop + colliderHeight >= scrollHeight - offsetBottom) return 'bottom';

    return false;
  };

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset;
    this.$element.removeClass(Affix.RESET).addClass('affix');
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    return this.pinnedOffset = position.top - scrollTop;
  };

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1);
  };

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return;

    var height = this.$element.height();
    var offset = this.options.offset;
    var offsetTop = offset.top;
    var offsetBottom = offset.bottom;
    var scrollHeight = Math.max($(document).height(), $(document.body).height());

    if (typeof offset != 'object') offsetBottom = offsetTop = offset;
    if (typeof offsetTop == 'function') offsetTop = offset.top(this.$element);
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element);

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '');

      var affixType = 'affix' + (affix ? '-' + affix : '');
      var e = $.Event(affixType + '.bs.affix');

      this.$element.trigger(e);

      if (e.isDefaultPrevented()) return;

      this.affixed = affix;
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;

      this.$element.removeClass(Affix.RESET).addClass(affixType).trigger(affixType.replace('affix', 'affixed') + '.bs.affix');
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      });
    }
  };

  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.affix');
      var options = typeof option == 'object' && option;

      if (!data) $this.data('bs.affix', data = new Affix(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.affix;

  $.fn.affix = Plugin;
  $.fn.affix.Constructor = Affix;

  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old;
    return this;
  };

  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this);
      var data = $spy.data();

      data.offset = data.offset || {};

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom;
      if (data.offsetTop != null) data.offset.top = data.offsetTop;

      Plugin.call($spy, data);
    });
  });
})(jQuery);
// don't move modals dom position
/*!
 * Masonry v3.3.1
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

'use strict';

(function (window, factory) {
  'use strict';
  // universal module definition
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['outlayer/outlayer', 'get-size/get-size', 'fizzy-ui-utils/utils'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(require('outlayer'), require('get-size'), require('fizzy-ui-utils'));
  } else {
    // browser global
    window.Masonry = factory(window.Outlayer, window.getSize, window.fizzyUIUtils);
  }
})(window, function factory(Outlayer, getSize, utils) {

  'use strict';

  // -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  var Masonry = Outlayer.create('masonry');

  Masonry.prototype._resetLayout = function () {
    this.getSize();
    this._getMeasurement('columnWidth', 'outerWidth');
    this._getMeasurement('gutter', 'outerWidth');
    this.measureColumns();

    // reset column Y
    var i = this.cols;
    this.colYs = [];
    while (i--) {
      this.colYs.push(0);
    }

    this.maxY = 0;
  };

  Masonry.prototype.measureColumns = function () {
    this.getContainerWidth();
    // if columnWidth is 0, default to outerWidth of first item
    if (!this.columnWidth) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element;
      // columnWidth fall back to item of first element
      this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth ||
      // if first elem has no width, default to size of container
      this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter;

    // calculate columns
    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth;
    // fix rounding errors, typically with gutters
    var excess = columnWidth - containerWidth % columnWidth;
    // if overshoot is less than a pixel, round up, otherwise floor it
    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[mathMethod](cols);
    this.cols = Math.max(cols, 1);
  };

  Masonry.prototype.getContainerWidth = function () {
    // container is parent if fit width
    var container = this.options.isFitWidth ? this.element.parentNode : this.element;
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var size = getSize(container);
    this.containerWidth = size && size.innerWidth;
  };

  Masonry.prototype._getItemLayoutPosition = function (item) {
    item.getSize();
    // how many columns does this brick span
    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
    // round if off by 1 pixel, otherwise use ceil
    var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
    colSpan = Math.min(colSpan, this.cols);

    var colGroup = this._getColGroup(colSpan);
    // get the minimum Y value from the columns
    var minimumY = Math.min.apply(Math, colGroup);
    var shortColIndex = utils.indexOf(colGroup, minimumY);

    // position the brick
    var position = {
      x: this.columnWidth * shortColIndex,
      y: minimumY
    };

    // apply setHeight to necessary columns
    var setHeight = minimumY + item.size.outerHeight;
    var setSpan = this.cols + 1 - colGroup.length;
    for (var i = 0; i < setSpan; i++) {
      this.colYs[shortColIndex + i] = setHeight;
    }

    return position;
  };

  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */
  Masonry.prototype._getColGroup = function (colSpan) {
    if (colSpan < 2) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = [];
    // how many different places could this brick fit horizontally
    var groupCount = this.cols + 1 - colSpan;
    // for each group potential horizontal position
    for (var i = 0; i < groupCount; i++) {
      // make an array of colY values for that one group
      var groupColYs = this.colYs.slice(i, i + colSpan);
      // and get the max value of the array
      colGroup[i] = Math.max.apply(Math, groupColYs);
    }
    return colGroup;
  };

  Masonry.prototype._manageStamp = function (stamp) {
    var stampSize = getSize(stamp);
    var offset = this._getElementOffset(stamp);
    // get the columns that this stamp affects
    var firstX = this.options.isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor(firstX / this.columnWidth);
    firstCol = Math.max(0, firstCol);
    var lastCol = Math.floor(lastX / this.columnWidth);
    // lastCol should not go over if multiple of columnWidth #425
    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min(this.cols - 1, lastCol);
    // set colYs to bottom of the stamp
    var stampMaxY = (this.options.isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
    for (var i = firstCol; i <= lastCol; i++) {
      this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
    }
  };

  Masonry.prototype._getContainerSize = function () {
    this.maxY = Math.max.apply(Math, this.colYs);
    var size = {
      height: this.maxY
    };

    if (this.options.isFitWidth) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  Masonry.prototype._getContainerFitWidth = function () {
    var unusedCols = 0;
    // count unused columns
    var i = this.cols;
    while (--i) {
      if (this.colYs[i] !== 0) {
        break;
      }
      unusedCols++;
    }
    // fit container to columns that have been used
    return (this.cols - unusedCols) * this.columnWidth - this.gutter;
  };

  Masonry.prototype.needsResizeLayout = function () {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth !== this.containerWidth;
  };

  return Masonry;
});
'use strict';

(function ($, undefined) {

  /**
   * Unobtrusive scripting adapter for jQuery
   * https://github.com/rails/jquery-ujs
   *
   * Requires jQuery 1.8.0 or later.
   *
   * Released under the MIT license
   *
   */

  // Cut down on the number of issues from people inadvertently including jquery_ujs twice
  // by detecting and raising an error when it happens.
  if ($.rails !== undefined) {
    $.error('jquery-ujs has already been loaded!');
  }

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;
  var $document = $(document);

  $.rails = rails = {
    // Link elements bound by jquery-ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with], a[data-disable]',

    // Button elements bound by jquery-ujs
    buttonClickSelector: 'button[data-remote]:not(form button), button[data-confirm]:not(form button)',

    // Select elements bound by jquery-ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by jquery-ujs
    formSubmitSelector: 'form',

    // Form input elements bound by jquery-ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type]), input[type=submit][form], input[type=image][form], button[type=submit][form], button[form]:not([type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with]:enabled, button[data-disable-with]:enabled, textarea[data-disable-with]:enabled, input[data-disable]:enabled, button[data-disable]:enabled, textarea[data-disable]:enabled',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled, input[data-disable]:disabled, button[data-disable]:disabled, textarea[data-disable]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input[type=file]',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with], a[data-disable]',

    // Button onClick disable selector with possible reenable after remote submission
    buttonDisableSelector: 'button[data-remote][data-disable-with], button[data-remote][data-disable]',

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function CSRFProtection(xhr) {
      var token = $('meta[name="csrf-token"]').attr('content');
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // making sure that all forms have actual up-to-date token(cached forms contain old one)
    refreshCSRFTokens: function refreshCSRFTokens() {
      var csrfToken = $('meta[name=csrf-token]').attr('content');
      var csrfParam = $('meta[name=csrf-param]').attr('content');
      $('form input[name="' + csrfParam + '"]').val(csrfToken);
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function fire(obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in $.rails.confirm
    confirm: (function (_confirm) {
      function confirm(_x) {
        return _confirm.apply(this, arguments);
      }

      confirm.toString = function () {
        return _confirm.toString();
      };

      return confirm;
    })(function (message) {
      return confirm(message);
    }),

    // Default ajax function, may be overridden with custom function in $.rails.ajax
    ajax: function ajax(options) {
      return $.ajax(options);
    },

    // Default way to get an element's href. May be overridden at $.rails.href.
    href: function href(element) {
      return element.attr('href');
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function handleRemote(element) {
      var method, url, data, elCrossDomain, crossDomain, withCredentials, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        elCrossDomain = element.data('cross-domain');
        crossDomain = elCrossDomain === undefined ? null : elCrossDomain;
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || $.ajaxSettings && $.ajaxSettings.dataType;

        if (element.is('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = element.serializeArray();
          // memoized value from clicked submit button
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + '&' + element.data('params');
        } else if (element.is(rails.buttonClickSelector)) {
          method = element.data('method') || 'get';
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + '&' + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType,
          // stopping the "ajax:beforeSend" event will cancel the ajax request
          beforeSend: function beforeSend(xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            if (rails.fire(element, 'ajax:beforeSend', [xhr, settings])) {
              element.trigger('ajax:send', xhr);
            } else {
              return false;
            }
          },
          success: function success(data, status, xhr) {
            element.trigger('ajax:success', [data, status, xhr]);
          },
          complete: function complete(xhr, status) {
            element.trigger('ajax:complete', [xhr, status]);
          },
          error: function error(xhr, status, _error) {
            element.trigger('ajax:error', [xhr, status, _error]);
          },
          crossDomain: crossDomain
        };

        // There is no withCredentials for IE6-8 when
        // "Enable native XMLHTTP support" is disabled
        if (withCredentials) {
          options.xhrFields = {
            withCredentials: withCredentials
          };
        }

        // Only pass url to `ajax` options if not blank
        if (url) {
          options.url = url;
        }

        return rails.ajax(options);
      } else {
        return false;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function handleMethod(link) {
      var href = rails.href(link),
          method = link.data('method'),
          target = link.attr('target'),
          csrfToken = $('meta[name=csrf-token]').attr('content'),
          csrfParam = $('meta[name=csrf-param]').attr('content'),
          form = $('<form method="post" action="' + href + '"></form>'),
          metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrfParam !== undefined && csrfToken !== undefined) {
        metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
      }

      if (target) {
        form.attr('target', target);
      }

      form.hide().append(metadataInput).appendTo('body');
      form.submit();
    },

    // Helper function that returns form elements that match the specified CSS selector
    // If form is actually a "form" element this will return associated elements outside the from that have
    // the html form attribute set
    formElements: function formElements(form, selector) {
      return form.is('form') ? $(form[0].elements).filter(selector) : form.find(selector);
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function disableFormElements(form) {
      rails.formElements(form, rails.disableSelector).each(function () {
        rails.disableFormElement($(this));
      });
    },

    disableFormElement: function disableFormElement(element) {
      var method, replacement;

      method = element.is('button') ? 'html' : 'val';
      replacement = element.data('disable-with');

      element.data('ujs:enable-with', element[method]());
      if (replacement !== undefined) {
        element[method](replacement);
      }

      element.prop('disabled', true);
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function enableFormElements(form) {
      rails.formElements(form, rails.enableSelector).each(function () {
        rails.enableFormElement($(this));
      });
    },

    enableFormElement: function enableFormElement(element) {
      var method = element.is('button') ? 'html' : 'val';
      if (element.data('ujs:enable-with')) element[method](element.data('ujs:enable-with'));
      element.prop('disabled', false);
    },

    /* For 'data-confirm' attribute:
       - Fires `confirm` event
       - Shows the confirmation dialog
       - Fires the `confirm:complete` event
        Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
       Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
       Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
       return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
    */
    allowAction: function allowAction(element) {
      var message = element.data('confirm'),
          answer = false,
          callback;
      if (!message) {
        return true;
      }

      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function blankInputs(form, specifiedSelector, nonBlank) {
      var inputs = $(),
          input,
          valueToCheck,
          selector = specifiedSelector || 'input,textarea',
          allInputs = form.find(selector);

      allInputs.each(function () {
        input = $(this);
        valueToCheck = input.is('input[type=checkbox],input[type=radio]') ? input.is(':checked') : input.val();
        // If nonBlank and valueToCheck are both truthy, or nonBlank and valueToCheck are both falsey
        if (!valueToCheck === !nonBlank) {

          // Don't count unchecked required radio if other radio with same name is checked
          if (input.is('input[type=radio]') && allInputs.filter('input[type=radio]:checked[name="' + input.attr('name') + '"]').length) {
            return true; // Skip to next input
          }

          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function nonBlankInputs(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function stopEverything(e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },

    //  replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function disableElement(element) {
      var replacement = element.data('disable-with');

      element.data('ujs:enable-with', element.html()); // store enabled state
      if (replacement !== undefined) {
        element.html(replacement);
      }

      element.bind('click.railsDisable', function (e) {
        // prevent further clicking
        return rails.stopEverything(e);
      });
    },

    // restore element to its original state which was disabled by 'disableElement' above
    enableElement: function enableElement(element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with')); // set to old enabled state
        element.removeData('ujs:enable-with'); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
    }
  };

  if (rails.fire($document, 'rails:attachBindings')) {

    $.ajaxPrefilter(function (options, originalOptions, xhr) {
      if (!options.crossDomain) {
        rails.CSRFProtection(xhr);
      }
    });

    // This event works the same as the load event, except that it fires every
    // time the page is loaded.
    //
    // See https://github.com/rails/jquery-ujs/issues/357
    // See https://developer.mozilla.org/en-US/docs/Using_Firefox_1.5_caching
    $(window).on('pageshow.rails', function () {
      $($.rails.enableSelector).each(function () {
        var element = $(this);

        if (element.data('ujs:enable-with')) {
          $.rails.enableFormElement(element);
        }
      });

      $($.rails.linkDisableSelector).each(function () {
        var element = $(this);

        if (element.data('ujs:enable-with')) {
          $.rails.enableElement(element);
        }
      });
    });

    $document.delegate(rails.linkDisableSelector, 'ajax:complete', function () {
      rails.enableElement($(this));
    });

    $document.delegate(rails.buttonDisableSelector, 'ajax:complete', function () {
      rails.enableFormElement($(this));
    });

    $document.delegate(rails.linkClickSelector, 'click.rails', function (e) {
      var link = $(this),
          method = link.data('method'),
          data = link.data('params'),
          metaClick = e.metaKey || e.ctrlKey;
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      if (!metaClick && link.is(rails.linkDisableSelector)) rails.disableElement(link);

      if (link.data('remote') !== undefined) {
        if (metaClick && (!method || method === 'GET') && !data) {
          return true;
        }

        var handleRemote = rails.handleRemote(link);
        // response from rails.handleRemote() will either be false or a deferred object promise.
        if (handleRemote === false) {
          rails.enableElement(link);
        } else {
          handleRemote.fail(function () {
            rails.enableElement(link);
          });
        }
        return false;
      } else if (method) {
        rails.handleMethod(link);
        return false;
      }
    });

    $document.delegate(rails.buttonClickSelector, 'click.rails', function (e) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(e);

      if (button.is(rails.buttonDisableSelector)) rails.disableFormElement(button);

      var handleRemote = rails.handleRemote(button);
      // response from rails.handleRemote() will either be false or a deferred object promise.
      if (handleRemote === false) {
        rails.enableFormElement(button);
      } else {
        handleRemote.fail(function () {
          rails.enableFormElement(button);
        });
      }
      return false;
    });

    $document.delegate(rails.inputChangeSelector, 'change.rails', function (e) {
      var link = $(this);
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      rails.handleRemote(link);
      return false;
    });

    $document.delegate(rails.formSubmitSelector, 'submit.rails', function (e) {
      var form = $(this),
          remote = form.data('remote') !== undefined,
          blankRequiredInputs,
          nonBlankFileInputs;

      if (!rails.allowAction(form)) return rails.stopEverything(e);

      // skip other logic when required values are missing or file upload is present
      if (form.attr('novalidate') == undefined) {
        blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector);
        if (blankRequiredInputs && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
          return rails.stopEverything(e);
        }
      }

      if (remote) {
        nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);
        if (nonBlankFileInputs) {
          // slight timeout so that the submit button gets properly serialized
          // (make it easy for event handler to serialize form without disabled values)
          setTimeout(function () {
            rails.disableFormElements(form);
          }, 13);
          var aborted = rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);

          // re-enable form elements if event bindings return false (canceling normal form submission)
          if (!aborted) {
            setTimeout(function () {
              rails.enableFormElements(form);
            }, 13);
          }

          return aborted;
        }

        rails.handleRemote(form);
        return false;
      } else {
        // slight timeout so that the submit button gets properly serialized
        setTimeout(function () {
          rails.disableFormElements(form);
        }, 13);
      }
    });

    $document.delegate(rails.formInputClickSelector, 'click.rails', function (event) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(event);

      // register the pressed submit button
      var name = button.attr('name'),
          data = name ? { name: name, value: button.val() } : null;

      button.closest('form').data('ujs:submit-button', data);
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:send.rails', function (event) {
      if (this == event.target) rails.disableFormElements($(this));
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:complete.rails', function (event) {
      if (this == event.target) rails.enableFormElements($(this));
    });

    $(function () {
      rails.refreshCSRFTokens();
    });
  }
})(jQuery);
(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.define({'phoenix': function(exports, require, module){ "use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// Phoenix Channels JavaScript client
//
// ## Socket Connection
//
// A single connection is established to the server and
// channels are mulitplexed over the connection.
// Connect to the server using the `Socket` class:
//
//     let socket = new Socket("/ws")
//     socket.connect()
//
// The `Socket` constructor takes the mount point of the socket
// as well as options that can be found in the Socket docs,
// such as configuring the `LongPoller` transport, and heartbeat.
// Socket params can also be passed as an option for default, but
// overridable channel params to apply to all channels.
//
//
// ## Channels
//
// Channels are isolated, concurrent processes on the server that
// subscribe to topics and broker events between the client and server.
// To join a channel, you must provide the topic, and channel params for
// authorization. Here's an example chat room example where `"new_msg"`
// events are listened for, messages are pushed to the server, and
// the channel is joined with ok/error matches, and `after` hook:
//
//     let chan = socket.chan("rooms:123", {token: roomToken})
//     chan.on("new_msg", msg => console.log("Got message", msg) )
//     $input.onEnter( e => {
//       chan.push("new_msg", {body: e.target.val})
//           .receive("ok", (message) => console.log("created message", message) )
//           .receive("error", (reasons) => console.log("create failed", reasons) )
//           .after(10000, () => console.log("Networking issue. Still waiting...") )
//     })
//     chan.join()
//         .receive("ok", ({messages}) => console.log("catching up", messages) )
//         .receive("error", ({reason}) => console.log("failed join", reason) )
//         .after(10000, () => console.log("Networking issue. Still waiting...") )
//
//
// ## Joining
//
// Joining a channel with `chan.join(topic, params)`, binds the params to
// `chan.params`. Subsequent rejoins will send up the modified params for
// updating authorization params, or passing up last_message_id information.
// Successful joins receive an "ok" status, while unsuccessful joins
// receive "error".
//
//
// ## Pushing Messages
//
// From the previous example, we can see that pushing messages to the server
// can be done with `chan.push(eventName, payload)` and we can optionally
// receive responses from the push. Additionally, we can use
// `after(millsec, callback)` to abort waiting for our `receive` hooks and
// take action after some period of waiting.
//
//
// ## Socket Hooks
//
// Lifecycle events of the multiplexed connection can be hooked into via
// `socket.onError()` and `socket.onClose()` events, ie:
//
//     socket.onError( () => console.log("there was an error with the connection!") )
//     socket.onClose( () => console.log("the connection dropped") )
//
//
// ## Channel Hooks
//
// For each joined channel, you can bind to `onError` and `onClose` events
// to monitor the channel lifecycle, ie:
//
//     chan.onError( () => console.log("there was an error!") )
//     chan.onClose( () => console.log("the channel has gone away gracefully") )
//
// ### onError hooks
//
// `onError` hooks are invoked if the socket connection drops, or the channel
// crashes on the server. In either case, a channel rejoin is attemtped
// automatically in an exponential backoff manner.
//
// ### onClose hooks
//
// `onClose` hooks are invoked only in two cases. 1) the channel explicitly
// closed on the server, or 2). The client explicitly closed, by calling
// `chan.leave()`
//

var SOCKET_STATES = { connecting: 0, open: 1, closing: 2, closed: 3 };
var CHAN_STATES = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining" };
var CHAN_EVENTS = {
  close: "phx_close",
  error: "phx_error",
  join: "phx_join",
  reply: "phx_reply",
  leave: "phx_leave"
};

var Push = (function () {

  // Initializes the Push
  //
  // chan - The Channel
  // event - The event, ie `"phx_join"`
  // payload - The payload, ie `{user_id: 123}`
  //

  function Push(chan, event, payload) {
    _classCallCheck(this, Push);

    this.chan = chan;
    this.event = event;
    this.payload = payload || {};
    this.receivedResp = null;
    this.afterHook = null;
    this.recHooks = [];
    this.sent = false;
  }

  _prototypeProperties(Push, null, {
    send: {
      value: function send() {
        var _this = this;

        var ref = this.chan.socket.makeRef();
        this.refEvent = this.chan.replyEventName(ref);
        this.receivedResp = null;
        this.sent = false;

        this.chan.on(this.refEvent, function (payload) {
          _this.receivedResp = payload;
          _this.matchReceive(payload);
          _this.cancelRefEvent();
          _this.cancelAfter();
        });

        this.startAfter();
        this.sent = true;
        this.chan.socket.push({
          topic: this.chan.topic,
          event: this.event,
          payload: this.payload,
          ref: ref
        });
      },
      writable: true,
      configurable: true
    },
    receive: {
      value: function receive(status, callback) {
        if (this.receivedResp && this.receivedResp.status === status) {
          callback(this.receivedResp.response);
        }

        this.recHooks.push({ status: status, callback: callback });
        return this;
      },
      writable: true,
      configurable: true
    },
    after: {
      value: function after(ms, callback) {
        if (this.afterHook) {
          throw "only a single after hook can be applied to a push";
        }
        var timer = null;
        if (this.sent) {
          timer = setTimeout(callback, ms);
        }
        this.afterHook = { ms: ms, callback: callback, timer: timer };
        return this;
      },
      writable: true,
      configurable: true
    },
    matchReceive: {

      // private

      value: function matchReceive(_ref) {
        var status = _ref.status;
        var response = _ref.response;
        var ref = _ref.ref;

        this.recHooks.filter(function (h) {
          return h.status === status;
        }).forEach(function (h) {
          return h.callback(response);
        });
      },
      writable: true,
      configurable: true
    },
    cancelRefEvent: {
      value: function cancelRefEvent() {
        this.chan.off(this.refEvent);
      },
      writable: true,
      configurable: true
    },
    cancelAfter: {
      value: function cancelAfter() {
        if (!this.afterHook) {
          return;
        }
        clearTimeout(this.afterHook.timer);
        this.afterHook.timer = null;
      },
      writable: true,
      configurable: true
    },
    startAfter: {
      value: function startAfter() {
        var _this = this;

        if (!this.afterHook) {
          return;
        }
        var callback = function () {
          _this.cancelRefEvent();
          _this.afterHook.callback();
        };
        this.afterHook.timer = setTimeout(callback, this.afterHook.ms);
      },
      writable: true,
      configurable: true
    }
  });

  return Push;
})();

var Channel = exports.Channel = (function () {
  function Channel(topic, params, socket) {
    var _this = this;

    _classCallCheck(this, Channel);

    this.state = CHAN_STATES.closed;
    this.topic = topic;
    this.params = params || {};
    this.socket = socket;
    this.bindings = [];
    this.joinedOnce = false;
    this.joinPush = new Push(this, CHAN_EVENTS.join, this.params);
    this.pushBuffer = [];
    this.rejoinTimer = new Timer(function () {
      return _this.rejoinUntilConnected();
    }, this.socket.reconnectAfterMs);
    this.joinPush.receive("ok", function () {
      _this.state = CHAN_STATES.joined;
      _this.rejoinTimer.reset();
    });
    this.onClose(function () {
      _this.socket.log("channel", "close " + _this.topic);
      _this.state = CHAN_STATES.closed;
      _this.socket.remove(_this);
    });
    this.onError(function (reason) {
      _this.socket.log("channel", "error " + _this.topic, reason);
      _this.state = CHAN_STATES.errored;
      _this.rejoinTimer.setTimeout();
    });
    this.on(CHAN_EVENTS.reply, function (payload, ref) {
      _this.trigger(_this.replyEventName(ref), payload);
    });
  }

  _prototypeProperties(Channel, null, {
    rejoinUntilConnected: {
      value: function rejoinUntilConnected() {
        this.rejoinTimer.setTimeout();
        if (this.socket.isConnected()) {
          this.rejoin();
        }
      },
      writable: true,
      configurable: true
    },
    join: {
      value: function join() {
        if (this.joinedOnce) {
          throw "tried to join multiple times. 'join' can only be called a single time per channel instance";
        } else {
          this.joinedOnce = true;
        }
        this.sendJoin();
        return this.joinPush;
      },
      writable: true,
      configurable: true
    },
    onClose: {
      value: function onClose(callback) {
        this.on(CHAN_EVENTS.close, callback);
      },
      writable: true,
      configurable: true
    },
    onError: {
      value: function onError(callback) {
        this.on(CHAN_EVENTS.error, function (reason) {
          return callback(reason);
        });
      },
      writable: true,
      configurable: true
    },
    on: {
      value: function on(event, callback) {
        this.bindings.push({ event: event, callback: callback });
      },
      writable: true,
      configurable: true
    },
    off: {
      value: function off(event) {
        this.bindings = this.bindings.filter(function (bind) {
          return bind.event !== event;
        });
      },
      writable: true,
      configurable: true
    },
    canPush: {
      value: function canPush() {
        return this.socket.isConnected() && this.state === CHAN_STATES.joined;
      },
      writable: true,
      configurable: true
    },
    push: {
      value: function push(event, payload) {
        if (!this.joinedOnce) {
          throw "tried to push '" + event + "' to '" + this.topic + "' before joining. Use chan.join() before pushing events";
        }
        var pushEvent = new Push(this, event, payload);
        if (this.canPush()) {
          pushEvent.send();
        } else {
          this.pushBuffer.push(pushEvent);
        }

        return pushEvent;
      },
      writable: true,
      configurable: true
    },
    leave: {

      // Leaves the channel
      //
      // Unsubscribes from server events, and
      // instructs channel to terminate on server
      //
      // Triggers onClose() hooks
      //
      // To receive leave acknowledgements, use the a `receive`
      // hook to bind to the server ack, ie:
      //
      //     chan.leave().receive("ok", () => alert("left!") )
      //

      value: function leave() {
        var _this = this;

        return this.push(CHAN_EVENTS.leave).receive("ok", function () {
          _this.log("channel", "leave " + _this.topic);
          _this.trigger(CHAN_EVENTS.close, "leave");
        });
      },
      writable: true,
      configurable: true
    },
    onMessage: {

      // Overridable message hook
      //
      // Receives all events for specialized message handling

      value: function onMessage(event, payload, ref) {},
      writable: true,
      configurable: true
    },
    isMember: {

      // private

      value: function isMember(topic) {
        return this.topic === topic;
      },
      writable: true,
      configurable: true
    },
    sendJoin: {
      value: function sendJoin() {
        this.state = CHAN_STATES.joining;
        this.joinPush.send();
      },
      writable: true,
      configurable: true
    },
    rejoin: {
      value: function rejoin() {
        this.sendJoin();
        this.pushBuffer.forEach(function (pushEvent) {
          return pushEvent.send();
        });
        this.pushBuffer = [];
      },
      writable: true,
      configurable: true
    },
    trigger: {
      value: function trigger(triggerEvent, payload, ref) {
        this.onMessage(triggerEvent, payload, ref);
        this.bindings.filter(function (bind) {
          return bind.event === triggerEvent;
        }).map(function (bind) {
          return bind.callback(payload, ref);
        });
      },
      writable: true,
      configurable: true
    },
    replyEventName: {
      value: function replyEventName(ref) {
        return "chan_reply_" + ref;
      },
      writable: true,
      configurable: true
    }
  });

  return Channel;
})();

var Socket = exports.Socket = (function () {

  // Initializes the Socket
  //
  // endPoint - The string WebSocket endpoint, ie, "ws://example.com/ws",
  //                                               "wss://example.com"
  //                                               "/ws" (inherited host & protocol)
  // opts - Optional configuration
  //   transport - The Websocket Transport, ie WebSocket, Phoenix.LongPoller.
  //               Defaults to WebSocket with automatic LongPoller fallback.
  //   params - The defaults for all channel params, ie `{user_id: userToken}`
  //   heartbeatIntervalMs - The millisec interval to send a heartbeat message
  //   reconnectAfterMs - The optional function that returns the millsec
  //                      reconnect interval. Defaults to stepped backoff of:
  //
  //     function(tries){
  //       return [1000, 5000, 10000][tries - 1] || 10000
  //     }
  //
  //   logger - The optional function for specialized logging, ie:
  //     `logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
  //
  //   longpollerTimeout - The maximum timeout of a long poll AJAX request.
  //                        Defaults to 20s (double the server long poll timer).
  //
  // For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
  //

  function Socket(endPoint) {
    var _this = this;

    var opts = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Socket);

    this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] };
    this.channels = [];
    this.sendBuffer = [];
    this.ref = 0;
    this.transport = opts.transport || window.WebSocket || LongPoller;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000;
    this.reconnectAfterMs = opts.reconnectAfterMs || function (tries) {
      return [1000, 5000, 10000][tries - 1] || 10000;
    };
    this.reconnectTimer = new Timer(function () {
      return _this.connect();
    }, this.reconnectAfterMs);
    this.logger = opts.logger || function () {}; // noop
    this.longpollerTimeout = opts.longpollerTimeout || 20000;
    this.endPoint = this.expandEndpoint(endPoint);
    this.params = opts.params || {};
  }

  _prototypeProperties(Socket, null, {
    protocol: {
      value: function protocol() {
        return location.protocol.match(/^https/) ? "wss" : "ws";
      },
      writable: true,
      configurable: true
    },
    expandEndpoint: {
      value: function expandEndpoint(endPoint) {
        if (endPoint.charAt(0) !== "/") {
          return endPoint;
        }
        if (endPoint.charAt(1) === "/") {
          return "" + this.protocol() + ":" + endPoint;
        }

        return "" + this.protocol() + "://" + location.host + "" + endPoint;
      },
      writable: true,
      configurable: true
    },
    disconnect: {
      value: function disconnect(callback, code, reason) {
        if (this.conn) {
          this.conn.onclose = function () {}; // noop
          if (code) {
            this.conn.close(code, reason || "");
          } else {
            this.conn.close();
          }
          this.conn = null;
        }
        callback && callback();
      },
      writable: true,
      configurable: true
    },
    connect: {
      value: function connect() {
        var _this = this;

        this.disconnect(function () {
          _this.conn = new _this.transport(_this.endPoint);
          _this.conn.timeout = _this.longpollerTimeout;
          _this.conn.onopen = function () {
            return _this.onConnOpen();
          };
          _this.conn.onerror = function (error) {
            return _this.onConnError(error);
          };
          _this.conn.onmessage = function (event) {
            return _this.onConnMessage(event);
          };
          _this.conn.onclose = function (event) {
            return _this.onConnClose(event);
          };
        });
      },
      writable: true,
      configurable: true
    },
    log: {

      // Logs the message. Override `this.logger` for specialized logging. noops by default

      value: function log(kind, msg, data) {
        this.logger(kind, msg, data);
      },
      writable: true,
      configurable: true
    },
    onOpen: {

      // Registers callbacks for connection state change events
      //
      // Examples
      //
      //    socket.onError(function(error){ alert("An error occurred") })
      //

      value: function onOpen(callback) {
        this.stateChangeCallbacks.open.push(callback);
      },
      writable: true,
      configurable: true
    },
    onClose: {
      value: function onClose(callback) {
        this.stateChangeCallbacks.close.push(callback);
      },
      writable: true,
      configurable: true
    },
    onError: {
      value: function onError(callback) {
        this.stateChangeCallbacks.error.push(callback);
      },
      writable: true,
      configurable: true
    },
    onMessage: {
      value: function onMessage(callback) {
        this.stateChangeCallbacks.message.push(callback);
      },
      writable: true,
      configurable: true
    },
    onConnOpen: {
      value: function onConnOpen() {
        var _this = this;

        this.log("transport", "connected to " + this.endPoint, this.transport);
        this.flushSendBuffer();
        this.reconnectTimer.reset();
        if (!this.conn.skipHeartbeat) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = setInterval(function () {
            return _this.sendHeartbeat();
          }, this.heartbeatIntervalMs);
        }
        this.stateChangeCallbacks.open.forEach(function (callback) {
          return callback();
        });
      },
      writable: true,
      configurable: true
    },
    onConnClose: {
      value: function onConnClose(event) {
        this.log("transport", "close", event);
        this.triggerChanError();
        clearInterval(this.heartbeatTimer);
        this.reconnectTimer.setTimeout();
        this.stateChangeCallbacks.close.forEach(function (callback) {
          return callback(event);
        });
      },
      writable: true,
      configurable: true
    },
    onConnError: {
      value: function onConnError(error) {
        this.log("transport", error);
        this.triggerChanError();
        this.stateChangeCallbacks.error.forEach(function (callback) {
          return callback(error);
        });
      },
      writable: true,
      configurable: true
    },
    triggerChanError: {
      value: function triggerChanError() {
        this.channels.forEach(function (chan) {
          return chan.trigger(CHAN_EVENTS.error);
        });
      },
      writable: true,
      configurable: true
    },
    connectionState: {
      value: function connectionState() {
        switch (this.conn && this.conn.readyState) {
          case SOCKET_STATES.connecting:
            return "connecting";
          case SOCKET_STATES.open:
            return "open";
          case SOCKET_STATES.closing:
            return "closing";
          default:
            return "closed";
        }
      },
      writable: true,
      configurable: true
    },
    isConnected: {
      value: function isConnected() {
        return this.connectionState() === "open";
      },
      writable: true,
      configurable: true
    },
    remove: {
      value: function remove(chan) {
        this.channels = this.channels.filter(function (c) {
          return !c.isMember(chan.topic);
        });
      },
      writable: true,
      configurable: true
    },
    chan: {
      value: function chan(topic) {
        var chanParams = arguments[1] === undefined ? {} : arguments[1];

        var mergedParams = {};
        for (var key in this.params) {
          mergedParams[key] = this.params[key];
        }
        for (var key in chanParams) {
          mergedParams[key] = chanParams[key];
        }

        var chan = new Channel(topic, mergedParams, this);
        this.channels.push(chan);
        return chan;
      },
      writable: true,
      configurable: true
    },
    push: {
      value: function push(data) {
        var _this = this;

        var topic = data.topic;
        var event = data.event;
        var payload = data.payload;
        var ref = data.ref;

        var callback = function () {
          return _this.conn.send(JSON.stringify(data));
        };
        this.log("push", "" + topic + " " + event + " (" + ref + ")", payload);
        if (this.isConnected()) {
          callback();
        } else {
          this.sendBuffer.push(callback);
        }
      },
      writable: true,
      configurable: true
    },
    makeRef: {

      // Return the next message ref, accounting for overflows

      value: function makeRef() {
        var newRef = this.ref + 1;
        if (newRef === this.ref) {
          this.ref = 0;
        } else {
          this.ref = newRef;
        }

        return this.ref.toString();
      },
      writable: true,
      configurable: true
    },
    sendHeartbeat: {
      value: function sendHeartbeat() {
        this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.makeRef() });
      },
      writable: true,
      configurable: true
    },
    flushSendBuffer: {
      value: function flushSendBuffer() {
        if (this.isConnected() && this.sendBuffer.length > 0) {
          this.sendBuffer.forEach(function (callback) {
            return callback();
          });
          this.sendBuffer = [];
        }
      },
      writable: true,
      configurable: true
    },
    onConnMessage: {
      value: function onConnMessage(rawMessage) {
        var msg = JSON.parse(rawMessage.data);
        var topic = msg.topic;
        var event = msg.event;
        var payload = msg.payload;
        var ref = msg.ref;

        this.log("receive", "" + (payload.status || "") + " " + topic + " " + event + " " + (ref && "(" + ref + ")" || ""), payload);
        this.channels.filter(function (chan) {
          return chan.isMember(topic);
        }).forEach(function (chan) {
          return chan.trigger(event, payload, ref);
        });
        this.stateChangeCallbacks.message.forEach(function (callback) {
          return callback(msg);
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Socket;
})();

var LongPoller = exports.LongPoller = (function () {
  function LongPoller(endPoint) {
    _classCallCheck(this, LongPoller);

    this.endPoint = null;
    this.token = null;
    this.sig = null;
    this.skipHeartbeat = true;
    this.onopen = function () {}; // noop
    this.onerror = function () {}; // noop
    this.onmessage = function () {}; // noop
    this.onclose = function () {}; // noop
    this.upgradeEndpoint = this.normalizeEndpoint(endPoint);
    this.pollEndpoint = this.upgradeEndpoint + (/\/$/.test(endPoint) ? "poll" : "/poll");
    this.readyState = SOCKET_STATES.connecting;

    this.poll();
  }

  _prototypeProperties(LongPoller, null, {
    normalizeEndpoint: {
      value: function normalizeEndpoint(endPoint) {
        return endPoint.replace("ws://", "http://").replace("wss://", "https://");
      },
      writable: true,
      configurable: true
    },
    endpointURL: {
      value: function endpointURL() {
        return this.pollEndpoint + ("?token=" + encodeURIComponent(this.token) + "&sig=" + encodeURIComponent(this.sig) + "&format=json");
      },
      writable: true,
      configurable: true
    },
    closeAndRetry: {
      value: function closeAndRetry() {
        this.close();
        this.readyState = SOCKET_STATES.connecting;
      },
      writable: true,
      configurable: true
    },
    ontimeout: {
      value: function ontimeout() {
        this.onerror("timeout");
        this.closeAndRetry();
      },
      writable: true,
      configurable: true
    },
    poll: {
      value: function poll() {
        var _this = this;

        if (!(this.readyState === SOCKET_STATES.open || this.readyState === SOCKET_STATES.connecting)) {
          return;
        }

        Ajax.request("GET", this.endpointURL(), "application/json", null, this.timeout, this.ontimeout.bind(this), function (resp) {
          if (resp) {
            var status = resp.status;
            var token = resp.token;
            var sig = resp.sig;
            var messages = resp.messages;

            _this.token = token;
            _this.sig = sig;
          } else {
            var status = 0;
          }

          switch (status) {
            case 200:
              messages.forEach(function (msg) {
                return _this.onmessage({ data: JSON.stringify(msg) });
              });
              _this.poll();
              break;
            case 204:
              _this.poll();
              break;
            case 410:
              _this.readyState = SOCKET_STATES.open;
              _this.onopen();
              _this.poll();
              break;
            case 0:
            case 500:
              _this.onerror();
              _this.closeAndRetry();
              break;
            default:
              throw "unhandled poll status " + status;
          }
        });
      },
      writable: true,
      configurable: true
    },
    send: {
      value: function send(body) {
        var _this = this;

        Ajax.request("POST", this.endpointURL(), "application/json", body, this.timeout, this.onerror.bind(this, "timeout"), function (resp) {
          if (!resp || resp.status !== 200) {
            _this.onerror(status);
            _this.closeAndRetry();
          }
        });
      },
      writable: true,
      configurable: true
    },
    close: {
      value: function close(code, reason) {
        this.readyState = SOCKET_STATES.closed;
        this.onclose();
      },
      writable: true,
      configurable: true
    }
  });

  return LongPoller;
})();

var Ajax = exports.Ajax = (function () {
  function Ajax() {
    _classCallCheck(this, Ajax);
  }

  _prototypeProperties(Ajax, {
    request: {
      value: function request(method, endPoint, accept, body, timeout, ontimeout, callback) {
        if (window.XDomainRequest) {
          var req = new XDomainRequest(); // IE8, IE9
          this.xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback);
        } else {
          var req = window.XMLHttpRequest ? new XMLHttpRequest() : // IE7+, Firefox, Chrome, Opera, Safari
          new ActiveXObject("Microsoft.XMLHTTP"); // IE6, IE5
          this.xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback);
        }
      },
      writable: true,
      configurable: true
    },
    xdomainRequest: {
      value: function xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback) {
        var _this = this;

        req.timeout = timeout;
        req.open(method, endPoint);
        req.onload = function () {
          var response = _this.parseJSON(req.responseText);
          callback && callback(response);
        };
        if (ontimeout) {
          req.ontimeout = ontimeout;
        }

        // Work around bug in IE9 that requires an attached onprogress handler
        req.onprogress = function () {};

        req.send(body);
      },
      writable: true,
      configurable: true
    },
    xhrRequest: {
      value: function xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback) {
        var _this = this;

        req.timeout = timeout;
        req.open(method, endPoint, true);
        req.setRequestHeader("Content-Type", accept);
        req.onerror = function () {
          callback && callback(null);
        };
        req.onreadystatechange = function () {
          if (req.readyState === _this.states.complete && callback) {
            var response = _this.parseJSON(req.responseText);
            callback(response);
          }
        };
        if (ontimeout) {
          req.ontimeout = ontimeout;
        }

        req.send(body);
      },
      writable: true,
      configurable: true
    },
    parseJSON: {
      value: function parseJSON(resp) {
        return resp && resp !== "" ? JSON.parse(resp) : null;
      },
      writable: true,
      configurable: true
    }
  });

  return Ajax;
})();

Ajax.states = { complete: 4 };

// Creates a timer that accepts a `timerCalc` function to perform
// calculated timeout retries, such as exponential backoff.
//
// ## Examples
//
//    let reconnectTimer = new Timer(() => this.connect(), function(tries){
//      return [1000, 5000, 10000][tries - 1] || 10000
//    })
//    reconnectTimer.setTimeout() // fires after 1000
//    reconnectTimer.setTimeout() // fires after 5000
//    reconnectTimer.reset()
//    reconnectTimer.setTimeout() // fires after 1000
//

var Timer = (function () {
  function Timer(callback, timerCalc) {
    _classCallCheck(this, Timer);

    this.callback = callback;
    this.timerCalc = timerCalc;
    this.timer = null;
    this.tries = 0;
  }

  _prototypeProperties(Timer, null, {
    reset: {
      value: function reset() {
        this.tries = 0;
        clearTimeout(this.timer);
      },
      writable: true,
      configurable: true
    },
    setTimeout: {

      // Cancels any previous setTimeout and schedules callback

      value: (function (_setTimeout) {
        var _setTimeoutWrapper = function setTimeout() {
          return _setTimeout.apply(this, arguments);
        };

        _setTimeoutWrapper.toString = function () {
          return _setTimeout.toString();
        };

        return _setTimeoutWrapper;
      })(function () {
        var _this = this;

        clearTimeout(this.timer);

        this.timer = setTimeout(function () {
          _this.tries = _this.tries + 1;
          _this.callback();
        }, this.timerCalc(this.tries + 1));
      }),
      writable: true,
      configurable: true
    }
  });

  return Timer;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});
 }});
if(typeof(window) === 'object' && !window.Phoenix){ window.Phoenix = require('phoenix') };
require.register("web/static/js/aaa-image-picker", function(exports, require, module) {
"use strict";
});

;require.register("web/static/js/aaa-ziptastic", function(exports, require, module) {
'use strict';

(function ($) {
  var requests = {};
  var zipValid = {
    us: /[0-9]{5}(-[0-9]{4})?/
  };

  $.ziptastic = function (country, zip, callback) {
    // If only zip and callback are given default to US
    if (arguments.length == 2 && typeof arguments[1] == 'function') {
      callback = arguments[1];
      zip = arguments[0];
      country = 'US';
    }

    country = country.toUpperCase();
    // Only make unique requests
    if (!requests[country]) {
      requests[country] = {};
    }
    if (!requests[country][zip]) {
      requests[country][zip] = $.getJSON('https://zip.getziptastic.com/v2/' + country + '/' + zip);
    }

    // Bind to the finished request
    requests[country][zip].done(function (data) {
      if (typeof callback == 'function') {
        callback(data.country, data.state, data.state_short, data.city, zip);
      }
    });

    // Allow for binding to the deferred object
    return requests[country][zip];
  };

  $.fn.ziptastic = function (options) {
    return this.each(function () {
      var ele = $(this);

      ele.on('keyup', function () {
        var zip = ele.val();

        // TODO Non-US zip codes?
        if (zipValid.us.test(zip)) {
          $.ziptastic(zip, function (country, state, state_short, city) {
            // Trigger the updated information
            ele.trigger('zipChange', [country, state, state_short, city, zip]);
          });
        }
      });
    });
  };
})(jQuery);

$('#special').on('change', function (data) {
  var value = $('#special').val();
  console.log(value);
  var arr = value.split(', ');
  var city = arr[0];
  var state = arr[1];
  $('#user_address_city').val(city);
  $('#user_address_state').val(state);
});

// console.log("Hello");
$('#registration_address_zip').ziptastic().on('zipChange', function (evt, country, state, state_short, city, zip) {
  console.log(city + ', ' + state_short);
  if (city !== undefined && state_short !== undefined) {
    $('#special').val(city + ', ' + state_short);
    $('#registration_address_state').val(state_short);
    $('#registration_address_city').val(city);
  } else {
    if ($('#registration_address_zip').val().length !== 0) {
      $('#special').val('Zip code not found.');
    }
  }
});

function runner() {
  line_a = $('#registration_address_line_1').val();
  var home = line_a + ', ' + $('#registration_address_city').val() + ' ' + $('#registration_address_state').val() + ' ' + $('#registration_address_zip').val();
  $('#registration_home').val(home);
  console.log(home);
}
});

;require.register("web/static/js/app", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _phoenix = require("phoenix");

var App = (function () {
  function App() {
    _classCallCheck(this, App);
  }

  _createClass(App, null, [{
    key: "init",
    value: function init() {
      var socket = new _phoenix.Socket("/ws", {
        logger: function logger(kind, msg, data) {
          console.log("" + kind + ": " + msg, data);
        }
      });
      socket.connect();
      var current_user_id = parseInt($("user").attr("data-id"));
      var chan = socket.chan("notifs:" + current_user_id, {});

      chan.join().receive("ignore", function (e) {
        return console.log("received ignore on channel (auth error)");
      }).receive("ok", function (e) {
        return console.log("received ok on channel (join ok)");
      });

      chan.on("new_msg", function (payload) {
        console.log("Channel received new_msg, here is payload: \n" + payload.body);
        var oldval = $("#notifs").val();
        console.log(oldval);
        if (oldval == "") {
          oldval = 0;
        } else {
          oldval = parseInt(oldval) + 1;
        }
        console.log(oldval);
        $("#notifs").empty();
        $.ajax({
          type: "GET",
          url: "/unread/" + current_user_id,
          success: function success(data) {
            console.log("unread messages: " + data["unread"]);
            $("#notifs").append(data["unread"]);
          }
        });
      });

      var $button = $("#wsbutton");

      $button.on("click", function () {
        console.log("test click");
        chan.push("new_msg", { body: "HELLLLOOOO BUTTON" });
      });
    }
  }]);

  return App;
})();

$(function () {
  return App.init();
});

exports["default"] = App;
module.exports = exports["default"];
});

;
//# sourceMappingURL=app.js.map