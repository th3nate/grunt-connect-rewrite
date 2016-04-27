/*
 * grunt-connect-rewrite
 * https://github.com/viart/grunt-connect-rewrite
 *
 * Copyright (c) 2013 Artem Vitiuk
 * Licensed under the MIT license.
 */

'use strict';

var Cookies = require("../../cookies"),
    utils = module.exports,
    rules = [];
utils.registerRule = function (rule) {

    if (!rule || !rule.from || !rule.to ||
        !(rule.from = rule.from.trim()) ||
        !(rule.to = rule.to.trim())) {
        return false;
    }

    if (rule.redirect) {
        rule.redirect = rule.redirect === 'permanent' ? 301 : 302;
    }

    rules.push({
        from: new RegExp(rule.from),
        to: rule.to,
        redirect: rule.redirect
    });

    return utils.getTextByType(rule) + rule.from + ' -> ' + rule.to;
};

utils.resetRules = function () {
    rules = [];
};

utils.rules = function () {
    return rules;
};

utils.getTextByType = function (rule) {
    return (rule.redirect ? 'redirect ' + rule.redirect : 'rewrite').toUpperCase() + ': ';
};

// stub
utils.log = {
    verbose: {
        writeln: function (str) {
            return str;
        }
    }
};

utils.dispatcher = function (req, res, next) {
    return function (rule) {
        var toUrl;
        var cookies = new Cookies(req, res);
        if (rule.from.test(req.url)) {
            toUrl = req.url.replace(rule.from, rule.to);
            if (!rule.redirect) {
                req.url = toUrl;
                // Write cookie to read in app load for enabling outside access
                // or straight access to different routes in application.
                cookies.set('currentStateName', req.originalUrl, { httpOnly: false });
                next();
            } else {
                res.statusCode = rule.redirect;
                res.setHeader('Location', toUrl);
                res.end();
            }
            utils.log.writeln(utils.getTextByType(rule) + req.originalUrl + ' : ' + rule.from + ' -> ' + toUrl);
            return true;
        }
    };
};

utils.rewriteRequest = function (req, res, next) {
    if (!rules.length || !rules.some(utils.dispatcher(req, res, next))) {
        next();
    }
};
