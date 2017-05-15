/**
 * Created by xuan on 17-5-13.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require('vm');

const LuWenYingAnE = require('lu').LuWenYingAnE;

let start_date = new Date();
let end_date = new Date();
start_date.setFullYear(2017, 5 - 1, 12);
end_date.setFullYear(2020, 5 - 1, 12);
let e = new LuWenYingAnE(10000, 8.4, 0.035, start_date, end_date);
for (let now = start_date; now <= end_date; now = e.repayment_period.nextDate(now)) {
    let sched = e.getSchedule(now);

    console.log("[%s]本金：%d，当日还款：%d，利息：%d，服务费：%d，实际到账：%d",
        now.toLocaleDateString(),
        sched.principal, sched.repaid, sched.interest, sched.service_fee, sched.actual_arrial);
}