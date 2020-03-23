<<<<<<< HEAD
'use strict';
var M;
(function (M) {
    var C = (function () {
        function C() {
        }
        return C;
    })();
    (function (x, property, number) {
        if (property === void 0) { property = w; }
        var local = 1;
        // unresolved symbol because x is local
        //self.x++; 
        self.w--; // ok because w is a property
        property;
        f = function (y) {
            return y + x + local + w + self.w;
        };
        function sum(z) {
            return z + f(z) + w + self.w;
        }
    });
})(M || (M = {}));
var c = new M.C(12, 5);
=======
'use strict';
var M;
(function (M) {
    var C = (function () {
        function C() {
        }
        return C;
    })();
    (function (x, property, number) {
        if (property === void 0) { property = w; }
        var local = 1;
        // unresolved symbol because x is local
        //self.x++; 
        self.w--; // ok because w is a property
        property;
        f = function (y) {
            return y + x + local + w + self.w;
        };
        function sum(z) {
            return z + f(z) + w + self.w;
        }
    });
})(M || (M = {}));
var c = new M.C(12, 5);
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d
