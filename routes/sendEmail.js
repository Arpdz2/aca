var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var employee = require('./employee.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

exports.passwordReset = function(req, callback) {

    employee.findOne({ 'email' : req.body.email }, function(err, user) {
            if (err) {
                console.log(err);
                callback("Invalid Email: No recovery Email sent.");
            } else if (user && user != null) {
                callback("Email Sent!");
                var password = Math.random().toString(36).slice(-8);
                var mongo = new employee();
                user.password = mongo.generateHash(password);
                user.passwordIsExpired = "TRUE";
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                
                var transport = nodemailer.createTransport(mandrillTransport({
                    auth: {
                        apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                    }
                }));
                
                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your temporary password for ACA Insurance is below. Your username will be sent in a separate email. Please use the link below to login.<br/><b>Password: </b>' + password + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });

                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your username for ACA Insurance is below. Your temporary password will be sent in a separate email. Please use the link below to login.<br/><b>Username: </b>' + user.email + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
                console.log("Password reset sent to " + user.email);
            }
        else {
                callback("Invalid Email: No recovery Email sent.");
            }

        });
};

exports.forgotEmail = function(req, callback) {

    employee.findOne({ 'ss' : req.body.ss }, function(err, user) {
        if (err) {
            console.log(err);
            callback("No account was created with this SSN.");
        } else if (user && user != null) {
            callback("Your Email is " + user.email);
        }
        else {
            callback("No account was created with this SSN.");
        }

    });
};

