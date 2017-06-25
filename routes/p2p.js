/**
 * Created by xuan on 17-5-15.
 */
"use strict";

const Crawler = require("crawler");
const express = require("express");
const router = express.Router();
module.exports = router;

const crawler = new Crawler({
    jQuery: true,
    maxConnections: 10
});
function LuP2PList() {
    return new Promise((onAccept, onReject) => {
        crawler.queue({
            uri: "https://my.lu.com/my/investment-all-v2?assetType=PEER2PEER",
            gzip: true,
            headers: {
                Cookie: '_lufaxSID="45e48f57-8d27-465d-8cf6-375c8a235190,Lbo3IVv60bHwmVPthisjApisrBOaLrwrongYtT/opsecretqYkeyXI1D5sUDuh58P/2j9cl0Tpej5ZEG7DgDfQ=="',
                "User-Agent": "LuSpider/0.1"
            },
            callback: function (error, res, done) {
                if (error) {
                    onReject(error);
                } else {
                    let robj = {};
                    let $ = res.$;
                    let all_invests = $("tr[data-invest!=0]");
                    for (let i = 0; i < all_invests.length; i++) {

                        let jquery_wrapper = $(all_invests[i]);
                        let id = jquery_wrapper.data('invest');
                        if (id === undefined) continue;
                        let el_link = jquery_wrapper.find('.product-name-link');
                        let text;
                        if (el_link.length === 0) {
                            text = "(Unknown)"
                        } else {
                            text = el_link.text().trim();
                        }
                        robj[id] = text;
                    }
                    onAccept(robj);
                }
                done();
            }
        });
    })
}
router.get('/list', function (req, res) {
    LuP2PList().then(
        (data) => {
            res.send({
                data: data
            });
        },
        (err) => {
            res.status(503)
                .send({
                    error: err
                });
        })
});

