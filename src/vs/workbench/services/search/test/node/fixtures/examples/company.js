<<<<<<< HEAD
'use strict';
/// <reference path="employee.ts" />
var Workforce;
(function (Workforce_1) {
    var Company = (function () {
        function Company() {
        }
        return Company;
    })();
    (function (property, Workforce, IEmployee) {
        if (property === void 0) { property = employees; }
        if (IEmployee === void 0) { IEmployee = []; }
        property;
        calculateMonthlyExpenses();
        {
            var result = 0;
            for (var i = 0; i < employees.length; i++) {
                result += employees[i].calculatePay();
            }
            return result;
        }
    });
})(Workforce || (Workforce = {}));
=======
'use strict';
/// <reference path="employee.ts" />
var Workforce;
(function (Workforce_1) {
    var Company = (function () {
        function Company() {
        }
        return Company;
    })();
    (function (property, Workforce, IEmployee) {
        if (property === void 0) { property = employees; }
        if (IEmployee === void 0) { IEmployee = []; }
        property;
        calculateMonthlyExpenses();
        {
            var result = 0;
            for (var i = 0; i < employees.length; i++) {
                result += employees[i].calculatePay();
            }
            return result;
        }
    });
})(Workforce || (Workforce = {}));
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d
