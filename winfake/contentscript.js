// Modify window.navigator
var actualCode =  '(' + function() {
    'use strict';
    var navigator = window.navigator;
    var modifiedNavigator;
    if ('userAgent' in Navigator.prototype) {
        // Chrome 43+ moved all properties from navigator to the prototype,
        // so we have to modify the prototype instead of navigator.
        modifiedNavigator = Navigator.prototype;

    } else {
        // Chrome 42- defined the property on navigator.
        modifiedNavigator = Object.create(navigator);
        Object.defineProperty(window, 'navigator', {
            value: modifiedNavigator,
            configurable: false,
            enumerable: false,
            writable: false
        });
    }
    var ChromeV = '130';
    // Pretend to be Windows 10
    var uadata_base = {"brands":[{"brand":" Not A;Brand","version":ChromeV},
	    {"brand":"Chromium","version":ChromeV},
	    {"brand":"Google Chrome","version":ChromeV}],
	    "mobile":false,
	    "platform":"Windows",
	    "platformVersion":"10.0.0"
    };
    var uadata = Object.assign({}, uadata_base);
    uadata["getHighEntropyValues"] = async function(xs){return uadata_base};
    function rTMPL(o){
        return {
            value: o,
            configurable: false,
            enumerable: true,
            writable: false
        }
    }
 
    Object.defineProperties(modifiedNavigator, {
        userAgent: rTMPL(navigator.userAgent.replace(/\([^)]+\)/, 'Windows NT 10.0')),
        userAgentData: rTMPL(uadata),
        appVersion: rTMPL(navigator.appVersion.replace(/\([^)]+\)/, 'Windows NT 10.0')),
        platform: rTMPL('Win32'),
    });
} + ')();';

document.documentElement.setAttribute('onreset', actualCode);
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');
