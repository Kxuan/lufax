"use strict";
const querystring = require("querystring");
const util = require("util");
const mysql = require("mysql");
const Crawler = require("crawler");
const gmailSend = require("gmail-send")(global.config.email);

const db = mysql.createPool(global.config.mysql);
const crawler = new Crawler({
    jQuery: true,
    maxConnections: 1,
    rateLimit: 1000
});

class R030Request {
    constructor(params) {
        let defaultQueryString = {
            minMoney: "",
            maxMoney: "",
            minDays: "",
            maxDays: "",
            minRate: "",
            maxRate: "",
            mode: "",
            subType: "",
            instId: "",
            haitongGrade: "",
            fundGroupId: "",
            searchWord: "",
            trade: "",
            isCx: "",
            currentPage: 1,
            orderType: "",
            orderAsc: "",
            notHasBuyFeeRate: "",
            rootProductCategoryEnum: ""
        };
        this.options = Object.assign({__proto__: null}, defaultQueryString, params);

    }

    queue() {
        let qs = querystring.encode(this.options);

        crawler.queue({
            url: "https://list.lu.com/list/r030?" + qs,
            callback: this.callbackR030.bind(this)
        })
    }

    notifyFail(error, moreInformation) {
        gmailSend({
            subject: "爬虫遇到错误",
            text: util.format("E享计划爬取遇到错误。\n时间：%s\n错误原因：%s\n请求参数：%s\n\n其他信息：\n%s\n",
                (new Date()).toString(),
                error.toString(),
                util.inspect(this.options),
                moreInformation
            )
        });

    }

    callbackR030(error, res, done) {
        if (error) {
            this.notifyFail(error,
                util.format("res对象：%s",
                    util.inspect(res, {
                        showHidden: true,
                        depth: 6,
                        maxArrayLength: null
                    })
                )
            );
            return done();
        }


        let $ = res.$;
        let products = $(".product-list");
        if (products.length === 0) {
            //TODO 是不是需要发个邮件？
            console.warn("No product received. " + JSON.stringify(this.options));
            return done();
        }
        products.each((i, p) => {
            let el = $(p);
            let href = el.find(".product-name a").attr('href');
            let priceText = el.find(".product-amount .num-style").text();
            let rate = parseFloat(el.find(".interest-rate .num-style").text());
            let r030id;
            let price = NaN;

            if (typeof priceText === "string") {
                price = parseFloat(priceText.replace(/[,\s]/, ''));
            }
            let m = href.match(/productId=(\d+)/);
            if (m) {
                r030id = parseInt(m[1]);
            }

            if (!r030id || !price || !priceText || !rate) {
                this.notifyFail(new Error("格式不正确"),
                    util.format(
                        "爬取时遇到格式不正确\n" +
                        "html:%s\n" +
                        "href:%s\n" +
                        "priceText:%s\n" +
                        "rate:%s\n" +
                        "r030id:%s\n" +
                        "price:%s\n",
                        el.html(),
                        href,
                        priceText,
                        rate,
                        r030id,
                        price
                    )
                );
                return done();
            }


            this.saveResult(r030id, price, rate);
        });
        done()
    }

    saveResult(r030id, price, rate) {
        let q = db.query(
            "INSERT INTO r030(`r030id`,`time`,`price`,`rate`) VALUES (?, ?, ?, ?);",
            [r030id, (new Date()).getTime() / 1000, price, rate],
            (err, results) => {
                if (!err)
                    return;

                this.notifyFail(err, "MySQL数据添加失败\nquery:\n" + util.inspect(q,
                        {
                            showHidden: true,
                            depth: 4,
                            maxArrayLength: null
                        }
                    )
                )

            });
    }
}

class Spider {
    constructor() {
        this.interval_handler = setInterval(this.requestNewData.bind(this), 300000);
        this.requestNewData();
    }

    requestNewData() {
        this.requestRangeR030(0, 10000, 1000);
        this.requestRangeR030(10001, 100000, 10000);
    }

    requestRangeR030(minMoney, maxMoney, step) {
        for (let i = minMoney; i <= maxMoney; i += step) {
            this.requestR030({
                minMoney: i,
                maxMoney: i + step
            })
        }
    }

    requestR030(params) {
        (new R030Request(params)).queue();
    }

}
module.exports = Spider;