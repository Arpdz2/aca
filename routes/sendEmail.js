var express = require('express');
var router = express.Router();
var nodemailer = require("nodemailer");

exports.sendQuote = function(firstName, lastName, streetAddress, city, state, zipCode, phoneNumber, emailAddress, comments, onResult) {
    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: '',
            pass: ''
        }
    });

    // NB! No need to recreate the transporter object. You can use
    // the same transporter object for all e-mails

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'Brenden McKamey <brenden.mckamey@gmail.com>', // sender address
        to: 'brenden.mckamey@gmail.com', // list of receivers
        subject: '', // Subject line
        text: 'First Name: ' + firstName + '\n' + 'Last Name: ' + lastName + '\n' + 'Street Address: ' + streetAddress + '\n' + 'City: ' + city + '\n' + 'State: ' + state + '\n' + 'Zip Code: ' + zipCode + '\n' + 'Phone Number: ' + phoneNumber + '\n' + 'Email Address: ' + emailAddress + '\n' + 'Comments: ' + comments, // plaintext body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);

    });
};