var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var employeeSchema = mongoose.Schema({
        agentid: String,
        employerid: String,
        email: String,
        password: String,
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
        ss: String
});

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