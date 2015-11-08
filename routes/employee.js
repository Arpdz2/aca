var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var employeeSchema = mongoose.Schema({
        agentid: String,
        employerid: String,
        employername: String,
        employerphone: String,
        email: String,
        password: String,
        passwordIsExpired: String,
        firstname: String,
        lastname: String,
        maritalstatus: String,
        spousefirstname: String,
        spouselastname: String,
        phonenumber: String,
        altphonenumber: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        birthdate: String,
        coveragenumber: String,
        ss: String,
        signature: String,
        gender: String,
        d1firstname: String,
        d1lastname: String,
        d1birthdate: String,
        d1ss: String,
        d1gender: String,
        d1coverage: String,
        d2firstname: String,
        d2lastname: String,
        d2birthdate: String,
        d2ss: String,
        d2gender: String,
        d2coverage: String,
        d3firstname: String,
        d3lastname: String,
        d3birthdate: String,
        d3ss: String,
        d3gender: String,
        d3coverage: String,
        d4firstname: String,
        d4lastname: String,
        d4birthdate: String,
        d4ss: String,
        d4gender: String,
        d4coverage: String,
        income: String,
        physician: String,
        physicianspecialty: String,
        ailment1: String,
        ailment2: String,
        ailment3: String,
        prescription1: String,
        prescription2: String,
        prescription3: String,
        dosage1: String,
        dosage2: String,
        dosage3: String
});

employeeSchema.index(
    { "$**": "text" },
    { name: "textScore" }
);

// methods ======================
// generating a hash
employeeSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
employeeSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
};

// create the model for employees and expose it to our app
module.exports = mongoose.model('Employee', employeeSchema);