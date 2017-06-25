/**
 * Created by xuan on 17-5-13.
 */
"use strict";
let TIME_OF_ONE_DAY = 24 * 60 * 60 * 1000;
function nextDay(today) {
    let d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
}
function dateRemoveTime(date) {
    let d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
exports.RepaymentMethod = class RepaymentMethod {
    constructor(principal, interest, period_count) {
        this.principal = principal;
        this.interest = interest;
        this.period_count = period_count;
    }

    getPrincipal(period_index) {
        throw Error("Not implement");
    }

    getRepaid(period_index) {
        throw Error("Not implement");
    }

    getInterest(period_index) {
        throw Error("Not implement");
    }

    getTotalRepaid(period_index) {
        let repaid = 0;
        for (let i = 0; i <= period_index; i++) {
            repaid += this.getRepaid(period_index);
        }
        return repaid;
    }
};
RepaymentMethod.EqualPrincipalAndInterest = class EqualPrincipalAndInterest extends RepaymentMethod {

    constructor(principal, interest, period_count) {
        super(principal, interest, period_count);

        this.repayment_schedue = [{
            interest: 0,
            repaid: 0,
            principal: principal
        }];

        //TODO 由于公式中的数字是无限精确，而实际上每月还款数额会“四舍五入”等方法精确到1分钱，所以以下计算方法有误差，需要改进。
        let repaid_per_period = principal * (interest * Math.pow(1 + interest, period_count)) / (Math.pow(1 + interest, period_count) - 1);
        let last_principal = principal;

        for (let period_index = 1; period_index <= period_count; period_index++) {
            let current_interest = last_principal * interest;
            let current_principal = last_principal * (1 + interest) - repaid_per_period;

            this.repayment_schedue[period_index] = {
                interest: current_interest,
                repaid: repaid_per_period,
                principal: current_principal
            };
            last_principal = current_principal;
        }
    }

    getPrincipal(period_index) {
        if (period_index < 0 || period_index > this.period_count) {
            throw RangeError("The period is out of range.")
        }
        return this.repayment_schedue[period_index].principal;
    }

    getRepaid(period_index) {
        if (period_index < 0 || period_index > this.period_count) {
            throw RangeError("The period is out of range.")
        }
        return this.repayment_schedue[period_index].repaid;
    }

    getInterest(period_index) {
        if (period_index < 0 || period_index > this.period_count) {
            throw RangeError("The period is out of range.")
        }
        return this.repayment_schedue[period_index].interest;
    }
};

exports.RepaymentPeriod = class RepaymentPeriod {
    constructor(start_date, end_date, multiple = 1) {
        if (start_date.getTimezoneOffset() !== end_date.getTimezoneOffset()) {
            throw Error("The start_date and end_date are not in same timezone.")
        }
        this.start_date = dateRemoveTime(start_date);
        this.end_date = dateRemoveTime(end_date);
        this.multiple = multiple;


        if (!this.isRepaymentDate(this.end_date)) {
            throw Error("The end_date is not a repayment day.")
        }

        this.total_period_count = this.getPeriodIndex(this.end_date);
    }

    isRepaymentDate(date) {
        let current_date = dateRemoveTime(date);
        if (current_date < this.start_date || current_date > this.end_date) {
            throw RangeError("The date is out of range")
        }

        let d;
        for (d = this.start_date; d < current_date; d = this.nextDate(d)) {
        }
        return d.valueOf() === current_date.valueOf();
    }

    getPeriodIndex(date) {
        let current_date = dateRemoveTime(date);
        if (current_date < this.start_date || current_date > this.end_date) {
            throw RangeError("The date is out of range")
        }

        let count = -1;
        for (let d = this.start_date; d <= current_date; d = this.nextDate(d)) {
            count++;
        }
        return count;
    }

    nextDate(date) {
        throw Error("Not implement")
    }
};

RepaymentPeriod.CalendarMonth = class CalendarMonth extends RepaymentPeriod {
    /**
     * return the next date in this period.
     * @param date
     */
    nextDate(date) {
        let d = new Date(date);
        let current_month = d.getMonth();
        current_month += this.multiple;
        d.setMonth(current_month);
        return d;
    }
};

class LuInvestment {
    /**
     *
     * @param {Number} principal
     * @param {Number} interest the interest per period
     * @param {Date} start_date
     * @param {Date} end_date
     * @param {RepaymentMethod} repayment_method
     * @param {RepaymentPeriod} repayment_period
     */
    constructor(principal, interest, start_date, end_date, repayment_method, repayment_period) {
        this.principal = principal;
        this.interest = interest;
        this.start_date = dateRemoveTime(start_date);
        this.end_date = dateRemoveTime(end_date);

        this.repayment_method = repayment_method;
        this.repayment_period = repayment_period;
    }
}

exports.LuWenYingAnE = class LuWenYingAnE extends LuInvestment {
    /**
     *
     * @param {Number} principal
     * @param {Number} interest_per_year
     * @param {Number} service_fee_per_month
     * @param {Date} start_date
     * @param {Date} end_date
     */
    constructor(principal, interest_per_year, service_fee_per_month, start_date, end_date) {
        let period = new RepaymentPeriod.CalendarMonth(start_date, end_date, 1);
        let interest = interest_per_year / 100 / 12;
        let method = new RepaymentMethod.EqualPrincipalAndInterest(principal, interest, period.total_period_count);

        super(principal, interest, start_date, end_date, method, period);

        this.service_fee = service_fee_per_month / 100;

        this.schedule = [];
        this.refreshSchedule();
    }

    refreshSchedule() {
        let next_date = this.repayment_period.nextDate(this.start_date);

        for (let current_date = this.start_date; current_date < next_date; current_date = nextDay(current_date)) {
            let day_index = (current_date.getTime() - this.start_date.getTime()) / TIME_OF_ONE_DAY;
            this.schedule[day_index] = {
                principal: this.principal,
                interest: 0,
                service_fee: 0,
                repaid: 0,
                actual_arrial: 0
            }
        }

        let period_index = 0;
        for (let current_date = next_date; current_date <= this.end_date; current_date = next_date) {
            next_date = this.repayment_period.nextDate(current_date);
            period_index++;

            let day_index = (current_date.getTime() - this.start_date.getTime()) / TIME_OF_ONE_DAY;

            let principal = this.repayment_method.getPrincipal(period_index);
            let repaid = this.repayment_method.getRepaid(period_index);
            let interest = this.repayment_method.getInterest(period_index);
            let service_fee = this.repayment_method.getPrincipal(period_index - 1) * this.service_fee;

            this.schedule[day_index] = {
                principal: principal,
                repaid: repaid,
                interest: interest,
                service_fee: service_fee,
                actual_arrial: repaid - service_fee
            };

            for (current_date = nextDay(current_date); current_date < next_date; current_date = nextDay(current_date)) {
                day_index = (current_date.getTime() - this.start_date.getTime()) / TIME_OF_ONE_DAY;
                this.schedule[day_index] = {
                    principal: principal,
                    repaid: 0,
                    interest: 0,
                    service_fee: 0,
                    actual_arrial: 0
                }
            }


        }
    }

    /**
     * get total repaid
     *
     * @param {Date} date
     */
    getSchedule(date) {
        let current_date = dateRemoveTime(date);
        let day_index = (current_date.getTime() - this.start_date.getTime()) / TIME_OF_ONE_DAY;

        return this.schedule[day_index];
    }
};
