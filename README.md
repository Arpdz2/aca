# ACA

A Node.js app built specifically for [ACA Insurance Group](http://acainsuresme.com/).

This application uses [Express 4](http://expressjs.com/en/index.html), [MongoDB](https://www.mongodb.org/), [Mandrill](http://www.mandrill.com/), and [passport-local](https://github.com/jaredhanson/passport-local) to deliver a robust set of features hosted on a flexible [Heroku](https://www.heroku.com/) platform.

## Running Locally

Make sure you have [Node.js](https://nodejs.org/en/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone https://github.com/bsmckamey/aca.git # or clone your own fork
$ cd aca
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Application Structure

```sh
- public
------ common-files                     <!-- startup framework kit -->
------ flat-ui                          <!-- flat-ui kit -->
------ img                              <!-- custom images -->
------ js                               <!-- custom js -->
------ less                             <!-- custom less -->
------ pdf                              <!-- default pdfs -->
------ stylesheets                      <!-- custom css -->
------ video                            <!-- custom videos -->
- routes
------ admin.js                         <!-- admin model -->
------ captcha.js                       <!-- captcha settings -->
------ db.js                            <!-- database connection settings -->
------ employee.js                      <!-- employee model -->
------ fdfdata.js                       <!-- forms data format (fdf) model -->
------ passport.js                      <!-- local strategies for passport -->
------ sendEmail.js                     <!-- reusable passwordReset and forgotEmail functions -->
------ udpdateEmail.js                  <!-- reusable update function for data change notices -->
------ user.js                          <!-- user model -->
------ userFunctions.js                 <!-- holds mongodb functions for user collection -->
------ utility.js                       <!-- random utilities stored here -->
- views
------ pages
------------ adminDashboard.ejs         <!-- show admin dashboard -->
------------ adminEmployee.ejs          <!-- show admin editing employee -->
------------ adminEmployer.ejs          <!-- show admin editing employer -->
------------ agentDashboard.ejs         <!-- show agent dashboard -->
------------ case.ejs                   <!-- create new employer case -->
------------ confirm.ejs                <!-- confirm changes -->
------------ contact.ejs                <!-- show contact us page -->
------------ db.ejs                     <!-- show database results -->
------------ employee.ejs               <!-- show employee created page -->
------------ employer.ejs               <!-- show employer case -->
------------ healthplan.ejs             <!-- show healthplan page -->
------------ index.ejs                  <!-- show home page -->
------------ information.ejs            <!-- show employee their information -->
------------ login.ejs                  <!-- employee login -->
------------ login2.ejs                 <!-- agent/admin login -->
------------ passwordExpired.ejs        <!-- password has expired, prompt for new one -->
------------ quote.ejs                  <!-- get a quote -->
------------ recovery.ejs               <!-- account recovery -->
------------ search.ejs                 <!-- agent search functionality -->
------------ signup.ejs                 <!-- employee signup -->
------------ signup2.ejs                <!-- agent/admin signup -->
------------ smallbusiness.ejs          <!-- show small business page -->
------------ success.ejs                <!-- show email has been sent -->
------ partials
------------ footer.ejs                 <!-- footer partial -->
------------ header.ejs                 <!-- header partial -->
------------ nav.ejs                    <!-- navigation partial -->
- app.json                              <!-- application info for web -->
- index.js                              <!-- application guts -->
- package.json                          <!-- handle npm packages -->
- Procfile                              <!-- tell heroku how to launch app -->
- README.md                             <!-- application info for reader -->
```

## Application

### Packages

#### package.json

```sh
{
  "name": "aca",
  "version": "0.1.4",
  "description": "Affordable Care Act Insurance Group",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "bcrypt-nodejs": "0.0.3",
    "body-parser": "*",
    "connect-flash": "^0.1.1",
    "cookie-parser": "^1.4.0",
    "ejs": "^2.3.1",
    "express": "~4.9.x",
    "express-session": "^1.11.3",
    "express-sslify": "^1.0.1",
    "fdf": "*",
    "fs": "*",
    "https": "^1.0.0",
    "method-override": "^2.3.5",
    "mongoose": "^4.1.8",
    "morgan": "^1.6.1",
    "nodemailer": "*",
    "nodemailer-mandrill-transport": "*",
    "passport": "^0.3.0",
    "passport-local": "^1.0.0",
    "path": "*",
    "pdfkit": "^0.7.1",
    "random-js": "^1.0.6",
    "util": "^0.10.3"
  },
  "engines": {
    "node": "0.12.2"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/bsmckamey/aca"
  },
  "keywords": [
    "ACA",
    "ACA Insurance Group",
    "Affordable Care Act"
  ],
  "license": "MIT"
}
```

### Application Setup

#### index.js

```sh
var express = require('express'),
    sendEmail = require('./routes/sendEmail.js'),
    passwordExpired = require('./routes/passwordExpired.js'),
    bodyParser = require('body-parser'),
    app = express(),
    dbConfig = require('./routes/db.js'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    random = require("random-js"),
    user = require('./routes/user.js'),
    employee = require('./routes/employee.js'),
    userFunctions = require('./routes/userFunctions.js'),
    nodemailer = require('nodemailer'),
    mandrillTransport = require('nodemailer-mandrill-transport'),
    fdf = require('fdf'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    util = require('util'),
    PDFDocument = require ('pdfkit'),
    enforce = require('express-sslify'),
    utility = require('./routes/utility.js'),
    fdfgenerator = require('./routes/fdfdata.js'),
    updateEmail = require('./routes/updateEmail.js');


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

mongoose.connect(dbConfig.url);

require('./routes/passport')(passport);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// required for passport
app.use(session({ secret: 'qwdqwdqwdqwdrfergwefdwcwcqcqwdlkqwjmqwdi' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


/*used to enforce https on get requests
app.use('*', function(req,res,next){
    var requestedurl = req.protocol + '://' + req.get('Host') + req.url;
    if (requestedurl.indexOf('localhost') != -1){
        console.log("no https enforced");
        next();
        //dont enforce https
    }
    else {
        app.use(enforce.HTTPS({ trustProtoHeader: true }));
        console.log("https enforced");
        next();
    }
});
*/


//app.use(enforce.HTTPS({ trustProtoHeader: true })); //*****Enable for production to force https******

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/employee/pdf/generator/:employeeid', isLoggedIn, function(req, res)
{
    employee.findOne({_id: req.params.employeeid}, function (err, result) {
        if (result.signature) {
            var img = result.signature;
            // strip off the data: url prefix to get just the base64-encoded bytes
            var data = img.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer(data, 'base64');
            fs.writeFile(result._id + '.png', buf, function (err) {
                console.log("image produced");
                var doc = new PDFDocument;
                var writeStream = fs.createWriteStream(result._id + 'stamp.pdf');
                doc.pipe(writeStream);
                doc.image(result._id + '.png', 60, 432, {width: 160, height: 12});
                doc.end();
                writeStream.on('finish', function () {
                console.log("stamp pdf");
                    var stamped = spawn('cpdf', ['-stamp-on', result._id + 'stamp.pdf', './public/pdf/combinedpdf.pdf', '2', '-o', result._id + '.pdf']);
                    stamped.on('close', function(code){
                    console.log("stamped pdf");
                        fdfgenerator.generate(result, function(fdfdata){
                        var data = fdfdata;
                        fs.writeFile(result._id + '.fdf', data, function (err) {
                        console.log("fdf");
                            var final = spawn('pdftk', [result._id + '.pdf', 'fill_form', result._id + ".fdf", 'output', result._id + 'final.pdf', 'flatten']);
                            final.on('close', function(code){
                                console.log("final pdf");
                                    res.redirect('/pdf/' + result.id + "/employee.pdf");
                                    console.log("redirect");
                            });
                        });
                    });
                });
            });
        });
    }
        else {
        res.redirect(req.get('referer'));
        }
    });
});

app.get('/pdf/:employeeid/employee.pdf', isLoggedIn, function(request, response){
    var emp = request.params.employeeid;
    var tempFile= request.params.employeeid + "final.pdf";
    fs.readFile(tempFile, function (err,data){
        response.contentType("application/pdf");
        response.send(data);
        console.log("pdf load")
        response.on('finish', function() {
        fs.unlink(emp + '.fdf', function(err) {
            fs.unlink(emp + '.pdf', function(err) {
                fs.unlink(emp + '.png', function(err) {
                    fs.unlink(emp + 'stamp.pdf', function(err) {
                        fs.unlink(emp + 'final.pdf', function(err) {
                            console.log("All files successfully removed");
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/passwordExpired', function(req, res){
    console.log(req.session.email);
    emailAddress = req.session.email;
    res.render('pages/passwordExpired', {emailAddress : emailAddress, message : ''});
});

app.post('/passwordExpired', function(req, res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/passwordExpired', {emailAddress : emailAddress, message : "Passwords are not the same" });
        }
        else
        {
            employee.findOne({_id: req.session.employee}, function (err, result) {
                var mongo = new employee();
                result.password = mongo.generateHash(req.body.password);
                result.passwordIsExpired = "FALSE";
                result.save(function (err) {
                    res.redirect('/information');
                });
            });
        }  
    });
});

app.get('/quote', function(request, response) {
  response.render('pages/quote');
});

app.post('/submitContactForm', function(request, response) {
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var companyName = request.body.companyName
    var emailAddress = request.body.emailAddress
    var phoneNumber = request.body.phoneNumber
    var comments = request.body.comments
    
//    sendEmail.sendQuote(firstName, lastName, streetAddress, city, state, zipCode, phoneNumber, emailAddress, comments, function(statusCode, result) {
//        console.log("Email sent...");
//    })
    response.render('pages/success');
});


app.get('/success', function(request, response) {
  response.render('pages/success');
});

app.get('/smallbusiness', function(request, response) {
    response.render('pages/smallbusiness');
    console.log("Rendering small business tab");
});

app.get('/healthplan', function(request, response) {
    response.render('pages/healthplan');
    console.log("Rendering health plan tab");
});

app.get('/contact', function(request, response) {
    response.render('pages/contact');
    console.log("Rendering contact us tab");
});

app.get('/agentLogin', function(req, res) {
    res.render('pages/login',{ message: req.flash('loginMessage') });
    console.log("Rendering login tab");
});

app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('pages/signup', { message: req.flash('signupMessage') });
});

app.get('/agentDashboard', isLoggedIn, function(req, res) {
    res.render('pages/agentDashboard', {
        user : req.user // get the user out of session and pass to template
    });
});

app.get('/adminDashboard', isLoggedIn, function(req, res) {
    userFunctions.list(function (err, data) {
        res.render('pages/adminDashboard', {
            user : req.user, // get the user out of session and pass to template
            users : data
        });
    });
});

app.post('/search', isLoggedIn, function(req, res) {
    console.log(req.body.search);
    employee.find(
        { $text : { $search : req.body.search } },
        { score : { $meta: "textScore" } }
    )
        .sort({ score : { $meta : 'textScore' } })
        .exec(function(err, results) {
            if (err) {
                res.redirect('/agentDashboard');
            }
            else if (results) {
                res.render('pages/search', {
                    user: req.user, search: results // get the user out of session and pass to template
                });
            }
            else {
                res.redirect('/agentDashboard');
            }
    });
});


app.get('/logout', function(req, res) {
    req.logout();
    req.session.employee = null;
    res.redirect('/');
});


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
    if (req.isAuthenticated()) {
        // if user is authenticated in the session, carry on
        return next();
    } else {
        // if they aren't redirect them to the home page
        res.redirect('/');
    }
}

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/agentDashboard', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.post('/agentLogin',
         passport.authenticate('local-login', { failureRedirect : '/agentLogin', failureFlash : true }),
        function(req, res) {
            console.log(req.user.local.role);
            if (req.user.local.role == "agent") {
                res.redirect('/agentDashboard');
            } else if (req.user.local.role == "admin") {
                res.redirect('/adminDashboard');
            }
        }
);

//add a new case
app.get('/profile/case', isLoggedIn, function(req, res)
{
    res.render('pages/case', {
        user : req.user // get the user out of session and pass to template
    });
});

//post employer info and ref it to corresponding agent
app.post('/profile/case', isLoggedIn,function (req, res, next){
    var a = req.user;
    user.findByIdAndUpdate(
        a._id,
        {$push: {"employer": {  empname: req.body.empname,
                                streetaddress: req.body.streetaddress,
                                city: req.body.city,
                                state: req.body.state,
                                zipcode: req.body.zipcode,
                                phonenumber: req.body.phonenumber,
                                email: req.body.email,
                                contact: req.body.contact,
                                altemail: req.body.altemail,
                                altcontact: req.body.altcontact,
                                comments: req.body.comments,
                                payroll: req.body.payroll,
                                dental: req.body.dental,
                                cashadvantage: req.body.cashadvantage,
                                vision: req.body.vision
        }}},
        {safe: true, upsert: true, new : true},
        function(err, model)
        {
            console.log(err);
            return res.redirect('/agentDashboard');
        }
    );
});

app.get('/:employer/sendemail/:id/:eid/:employeremail/:altemail', isLoggedIn, function(req, res) {
    var agentEmail = req.user.local.email;
    var transport = nodemailer.createTransport(mandrillTransport({
        auth: {
            apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
        }
    }));
    transport.sendMail({
        from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
        to: req.params.employeremail,
        cc: req.params.altemail + ", " + agentEmail,
        subject: 'ACA Insurance Employee Registration Link',
        html: '<p>Dear ' + req.params.employer + ',</p><p>Please forward the below link to your employees in order to register for ACA coverage:</p><p>' + req.protocol + '://' + req.get("host") + '/signup/' + req.params.id + '/' + req.params.eid + '</p><br/><p>Thank you,</p><p>ACA Insurance Group</p>'
    }, function(err, info) {
        if (err) {
            console.error(err);
        } else {
            console.log('Message sent: ' + info.response);
            res.redirect('/agentDashboard');
        }
    });
});


app.get('/:id/:eid', isLoggedIn, function(req, res)
{
    //var a = req.user;
    var signupUrl = req.protocol + '://' + req.get('host') + '/signup'  + req.originalUrl;
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    user.findOne({'_id' : req.params.id }, function (err, user) {
        if (err) {
            throw(err);
        }
        console.log("User:" + user);
        employee.find({}, function(err, docs){
            if(err) {
                throw(err);
            }
            res.render('pages/employer', {user : user, page : eid, emp : docs, url: signupUrl/*, title: post.title, url: post.URL */});
        });
    });
});

app.get('/:id/:eid/:firstName/:lastName', isLoggedIn, function(req, res)
{
    var url = req.originalUrl;
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    employee.find({}, function(err, docs){
        if(err) {
            res.json(err);
        }
        res.render('pages/adminEmployee');
    });
});


app.get('/delete', isLoggedIn, function(req, res) {
    var a = req.user;
    //var url = req.originalUrl;
    //var eid = url.substr(url.lastIndexOf('/')+1);
    var eid = req.session.empid;
    console.log(eid);
    console.log(mongoose.Types.ObjectId.isValid(eid));
    var isvalid = mongoose.Types.ObjectId.isValid(eid)
    if (isvalid === true) {
        employee.remove({employerid: eid}, function (err) {
            if (!err) {
                console.log("Successfully removed corresponding employee accounts");
            }
        });
        a.employer.pull(eid)
            a.save(function (err) {
                req.session.empid = null;
                res.redirect('/agentDashboard');
            });
    }
});

app.post('/update/:id/:employerid', isLoggedIn, function(req, res){
    //var a = req.user;
    var a = req.params.id;
    var id = req.params.employerid;
    //user.update({"_id" : a._id, "employer._id" : id},{$set : {
    user.update({"employer._id" : id},{$set : {
        "employer.$.empname": req.body.empname,
        "employer.$.contact": req.body.contact,
        "employer.$.altemail": req.body.altemail,
        "employer.$.altcontact": req.body.altcontact,
        "employer.$.streetaddress": req.body.streetaddress,
        "employer.$.city": req.body.city,
        "employer.$.state": req.body.state,
        "employer.$.zipcode": req.body.zipcode,
        "employer.$.phonenumber": req.body.phonenumber,
        "employer.$.email": req.body.email,
        "employer.$.comments": req.body.comments
    }}, function(err, docs) {
        if (err) console.log(err);
        else if (docs) console.log(docs);
        else console.log("failure");
    });
    //res.redirect('/' + a._id + '/' + id);
    res.redirect('/' + a + '/' + id);
});

app.get('/signup/:agentid/:employerid', function(req,res){
    req.session.agentid = req.params.agentid;
    req.session.employerid = req.params.employerid;
    user.findOne({'_id' : req.params.agentid }, function(err, docs) {
        if (err) res.redirect('/');
        else if(docs == null) res.redirect('/');
        else {
            user.find({
                '_id': { $in: [
                    req.params.employerid
                ]}
            }, function(err, docs){
                console.log(docs);
                if (docs != undefined)
                res.render('pages/signup2', {message: ""});
                else res.redirect('/');
            });
        }
    });
});

app.post('/signup2', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (user) {
            res.render('pages/signup2', {message : "Email already taken" });
        }
        else if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/signup2', {message : "Passwords are not the same" });
        }
        else
        {
            var newuser = new employee();
            newuser.email = req.body.email;
            newuser.password = newuser.generateHash(req.body.password);
            newuser.agentid = req.session.agentid;
            newuser.employerid = req.session.employerid;
            newuser.save(function (err) {
                req.session.employee = newuser._id;
                res.redirect('/information');
            });
        }
    });
});

app.get('/login', function(req,res){
    res.render('pages/login2', {message : "" });
});

app.post('/login', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log(err);
        // if no user is found, return the message
        } else if (!user) {
            res.render('pages/login2', {message : "No user exists" });
        // if the user is found but the password is wrong
        } else if (!user.validPassword(req.body.password)) {
            res.render('pages/login2', {message : "Invalid Password" });
        // if the user's password is expired
        } else if (user.passwordIsExpired == "TRUE") {
            console.log("Password is expired.")
            req.session.email = req.body.email;
            req.session.employee = user._id
            res.redirect('/passwordExpired');
        // all is well, return successful user
        } else {
            req.session.employee = user._id;
            res.redirect('/information');
        }
    });
});

app.get('/recovery', function(req, res){
    res.render('pages/recovery');
});

app.post('/recovery', function(req, res){
    
    var optionsRadios = req.body.optionsRadios;
    
    if (optionsRadios == 'option1') {
        sendEmail.passwordReset(req, function(string){
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option2') {
        sendEmail.forgotEmail(req, res, function(string) {
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option3') {
        console.log("option3 not setup.");
    }
    

});

app.get('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            var agentid = result.agentid;
            var employerid = result.employerid;
            user.findOne({'_id': agentid}, function (err, docs) {
                res.render('pages/information', {employee: result, user: docs, employerid: employerid});
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.post('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            updateEmail.update(req, result, function(message) {
                console.log(message);
                if (req.body.signatureid) {
                    result.signature = req.body.signatureid;
                }
                result.firstname = req.body.FirstName;
                result.lastname = req.body.LastName;
                result.maritalstatus = req.body.MaritalStatus;
                result.spousefirstname = req.body.SpouseFirstName;
                result.spouselastname = req.body.SpouseLastName;
                result.phonenumber = req.body.PhoneNumber;
                result.altphonenumber = req.body.AlternatePhoneNumber;
                result.address = req.body.Address;
                result.city = req.body.City;
                result.state = req.body.State;
                result.zip = req.body.Zip;
                result.email = req.body.Email;
                result.birthdate = req.body.BirthDate;
                result.coveragenumber = req.body.NumberofPeopleThatNeedCoverage;
                result.ss = req.body.PrimarySocialSecurity;
                result.gender = req.body.Gender;
                result.d1firstname = req.body.Dependent1FirstName;
                result.d1lastname = req.body.Dependent1LastName;
                result.d1birthdate = req.body.Dependent1BirthDate;
                result.d1ss = req.body.Dependent1SocialSecurity;
                result.d1gender = req.body.Dependent1Gender;
                result.d1coverage = req.body.Dependent1NeedsCoverage;
                result.d2firstname = req.body.Dependent2FirstName;
                result.d2lastname = req.body.Dependent2LastName;
                result.d2birthdate = req.body.Dependent2BirthDate;
                result.d2ss = req.body.Dependent2SocialSecurity;
                result.d2gender = req.body.Dependent2Gender;
                result.d2coverage = req.body.Dependent2NeedsCoverage;
                result.d3firstname = req.body.Dependent3FirstName;
                result.d3lastname = req.body.Dependent3LastName;
                result.d3birthdate = req.body.Dependent3BirthDate;
                result.d3ss = req.body.Dependent3SocialSecurity;
                result.d3gender = req.body.Dependent3Gender;
                result.d3coverage = req.body.Dependent3NeedsCoverage;
                result.d4firstname = req.body.Dependent4FirstName;
                result.d4lastname = req.body.Dependent4LastName;
                result.d4birthdate = req.body.Dependent4BirthDate;
                result.d4ss = req.body.Dependent4SocialSecurity;
                result.d4gender = req.body.Dependent4Gender;
                result.d4coverage = req.body.Dependent4NeedsCoverage;
                result.employername = req.body.employer;
                result.employerphone = req.body.employerphone;
                result.income = req.body.income;
                result.physician = req.body.physician;
                result.physicianspecialty = req.body.physicianspecialty;
                result.ailment1 = req.body.ailment1;
                result.ailment2 = req.body.ailment2;
                result.ailment3 = req.body.ailment3;
                result.prescription1 = req.body.prescription1;
                result.prescription2 = req.body.prescription2;
                result.prescription3 = req.body.prescription3;
                result.dosage1 = req.body.dosage1;
                result.dosage2 = req.body.dosage2;
                result.dosage3 = req.body.dosage3;
                result.save(function (err) {
                    res.redirect('/information?=saved');
                });
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
```

### Database Config

#### db.js

```sh
module.exports = {
    'url' : process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://heroku_1f0cf70q:kc3p5id312rg7abe74gt7f8ola@ds051953.mongolab.com:51953/heroku_1f0cf70q'
}
```

### Routes

#### captcha.js

```sh
var https = require('https');

exports.verifyRecaptcha = function(key, callback) {
    var SECRET = "6LdUuRATAAAAADwh_LDpYuzexNtNtNm0qXKY4G9l";
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}
```

#### fdfdata.js

```sh
var fdf = require('fdf')
utility = require('./utility.js');

exports.generate = function(result, callback) {
    var single = "Off";
    var married = "Off";
    var spousefirst = result.spousefirstname;
    var spouselast = result.spouselastname;
    var datetime = new Date().toDateString();
    if (result.maritalstatus == 'Single') {single = "Yes"; spousefirst = ""; spouselast = "";}
    if (result.maritalstatus == 'Married') {married = "Yes";}
    var data = fdf.generate({
        "first name": result.firstname,
        "last name": result.lastname,
        "agent_id": result.agentid,
        "Agent Date": datetime,
        "single" : single,
        "married" : married,
        "spousefirstname" : spousefirst,
        "spouselastname" : spouselast,
        "Phone" : result.phonenumber,
        "ALT" : result.altphonenumber,
        "Address" : result.address,
        "City" : result.city,
        "State" : result.state,
        "Zip" : result.zip,
        "Email" : result.email,
        "Birth date" : utility.convertDate(result.birthdate),
        "Number of People" : result.coveragenumber,
        "Primary Social Security" : result.ss,
        "d1firstname" : result.d1firstname,
        "d1lastname" : result.d1lastname,
        "d1birthdate" : utility.convertDate(result.d1birthdate),
        "d1ss" : result.d1ss,
        "d1gender" : result.d1gender,
        "d1gendercigna" : result.d1gender,
        "d1coverage" : result.d1coverage,
        "d2firstname" : result.d2firstname,
        "d2lastname" : result.d2lastname,
        "d2birthdate" : utility.convertDate(result.d2birthdate),
        "d2ss" : result.d2ss,
        "d2gender" : result.d2gender,
        "d2gendercigna" : result.d2gender,
        "d2coverage" : result.d2coverage,
        "d3firstname" : result.d3firstname,
        "d3lastname" : result.d3lastname,
        "d3birthdate" : utility.convertDate(result.d3birthdate),
        "d3ss" : result.d3ss,
        "d3gender" : result.d3gender,
        "d3gendercigna" : result.d3gender,
        "d3coverage" : result.d3coverage,
        "d4firstname" : result.d4firstname,
        "d4lastname" : result.d4lastname,
        "d4birthdate" : utility.convertDate(result.d4birthdate),
        "d4ss" : result.d4ss,
        "d4gender" : result.d4gender,
        "d4gendercigna" : result.d4gender,
        "d4coverage" : result.d4coverage,
        "employername" : result.employername,
        "employerphone" : result.employerphone,
        "income" : result.income,
        "physician" : result.physician,
        "specialty" : result.physicianspecialty,
        "ailment1" : result.ailment1,
        "ailment2" : result.ailment2,
        "ailment3" : result.ailment3,
        "prescription1" : result.prescription1,
        "prescription2" : result.prescription2,
        "prescription3" : result.prescription3,
        "dosage1" : result.dosage1,
        "dosage2" : result.dosage2,
        "dosage3" : result.dosage2,
        "gender" : result.gender
    });
    callback(data);
}
```

#### passport.js

```sh
// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
// load up the user model
var User = require('../routes/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    }
                    else if (req.body.password != req.body.passwordverify) {
                            return done(null, false, req.flash('signupMessage', 'Passwords are not the same'));
                    } else {
                        if (req.body.agentcode == 'nathantoal56712') //check to make sure they know agent code
                        {
                            // if there is no user with that email
                            // create the user
                            var newUser = new User();

                            // set the user's local credentials
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.firstName = req.body.firstname;
                            newUser.local.lastName = req.body.lastname;
                            newUser.local.role = "agent";
                            // save the user
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        } else if (req.body.agentcode == 'V,sG#g5[{]`*vBn^') {
                            
                            var newUser = new User();
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.firstName = req.body.firstname;
                            newUser.local.lastName = req.body.lastname;
                            newUser.local.role = "admin";
                            
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                        else
                            return done(null, false, req.flash('signupMessage', 'Invalid Agent Code.'));
                    }

                });

            });

        }));



// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            
            console.log(user.local.role);
            if (user.local.role == undefined)
                return done(null, false, req.flash('loginMessage', 'No role defined for this user.'));

            // all is well, return successful user
            return done(null, user);
        });

    }));

};
```

#### sendEmail.js

```sh
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var employee = require('./employee.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
var captcha = require('./captcha.js');


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

exports.forgotEmail = function(req, res, callback) {
captcha.verifyRecaptcha(req.body["g-recaptcha-response"], function(success) {
    if (success) {
        console.log(success);
        employee.findOne({'ss': req.body.ss}, function (err, user) {
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
    }
    else {
        console.log("Captcha failed");
        res.redirect('/recovery');
    }
    });
};
```

#### udpdateEmail.js

```sh
var express = require('express');
var user = require('./user.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

exports.update = function(req, result, callback) {
    user.findOne({_id: result.agentid}, function (err, doc) {
        if (doc) {
            var update = ["<table style='width:100%'>", "<tr><td><b>Field</b></td><td><b>New</b></td><td><b>Old</b></td><tr>"];
            if (result.firstname != req.body.FirstName)                                 {update.push("<tr><td>First Name</td><td>" +  req.body.FirstName + "</td><td>" + result.firstname + "</td>")};
            if (result.lastname != req.body.LastName)                                   {update.push("<tr><td>Last Name</td><td>" +  req.body.LastName + "</td><td>" + result.lastname + "</td>")};
            if (result.maritalstatus != req.body.MaritalStatus)                         {update.push("<tr><td>Marital Status</td><td>" +  req.body.MaritalStatus + "</td><td>" + result.maritalstatus + "</td>")};
            if (result.spousefirstname != req.body.SpouseFirstName)                     {update.push("<tr><td>Spouse First Name</td><td>" +  req.body.SpouseFirstName + "</td><td>" + result.spousefirstname + "</td>")};
            if (result.spouselastname != req.body.SpouseLastName)                       {update.push("<tr><td>Spouse Last Name</td><td>" +  req.body.SpouseLastName + "</td><td>" + result.spouselastname + "</td>")};
            if (result.phonenumber != req.body.PhoneNumber)                             {update.push("<tr><td>Phone Number</td><td>" +  req.body.PhoneNumber + "</td><td>" + result.phonenumber + "</td>")};
            if (result.altphonenumber != req.body.AlternatePhoneNumber)                 {update.push("<tr><td>Alternate Phone Number</td><td>" +  req.body.AlternatePhoneNumber + "</td><td>" + result.altphonenumber + "</td>")};
            if (result.address != req.body.Address)                                     {update.push("<tr><td>Address</td><td>" +  req.body.Address + "</td><td>" + result.address + "</td>")};
            if (result.city != req.body.City)                                           {update.push("<tr><td>City</td><td>" +  req.body.City + "</td><td>" + result.city + "</td>")};
            if (result.state != req.body.State)                                         {update.push("<tr><td>State</td><td>" +  req.body.State + "</td><td>" + result.state + "</td>")};
            if (result.zip != req.body.Zip)                                             {update.push("<tr><td>Zip Code</td><td>" +  req.body.Zip + "</td><td>" + result.zip + "</td>")};
            if (result.email != req.body.Email)                                         {update.push("<tr><td>Email</td><td>" +  req.body.Email + "</td><td>" + result.email + "</td>")};
            if (result.birthdate != req.body.BirthDate)                                 {update.push("<tr><td>Birth Date</td><td>" +  req.body.BirthDate + "</td><td>" + result.birthdate + "</td>")};
            if (result.coveragenumber != req.body.NumberofPeopleThatNeedCoverage)       {update.push("<tr><td># of people receiving coverage</td><td>" +  req.body.NumberofPeopleThatNeedCoverage + "</td><td>" + result.coveragenumber + "</td>")};
            if (result.ss != req.body.PrimarySocialSecurity)                            {update.push("<tr><td>SSN</td><td>" +  req.body.PrimarySocialSecurity + "</td><td>" + result.ss + "</td>")};
            if (result.gender != req.body.Gender)                                       {update.push("<tr><td>Gender</td><td>" +  req.body.Gender + "</td><td>" + result.gender + "</td>")};
            if (result.d1firstname != req.body.Dependent1FirstName)                     {update.push("<tr><td>Dependent 1 First Name</td><td>" +  req.body.Dependent1FirstName + "</td><td>" + result.d1firstname + "</td>")};
            if (result.d1lastname != req.body.Dependent1LastName)                       {update.push("<tr><td>Dependent 1 Last Name</td><td>" +  req.body.Dependent1LastName + "</td><td>" + result.d1lastname + "</td>")};
            if (result.d1birthdate != req.body.Dependent1BirthDate)                     {update.push("<tr><td>Dependent 1 Birth Date</td><td>" +  req.body.Dependent1BirthDate + "</td><td>" + result.d1birthdate + "</td>")};
            if (result.d1ss != req.body.Dependent1SocialSecurity)                       {update.push("<tr><td>Dependent 1 Social Security</td><td>" +  req.body.Dependent1SocialSecurity + "</td><td>" + result.d1ss + "</td>")};
            if (result.d1gender != req.body.Dependent1Gender)                           {update.push("<tr><td>Dependent 1 Gender</td><td>" +  req.body.Dependent1Gender + "</td><td>" + result.d1gender + "</td>")};
            if (result.d1coverage != req.body.Dependent1NeedsCoverage)                  {update.push("<tr><td>Dependent 1 Coverage</td><td>" +  req.body.Dependent1NeedsCoverage + "</td><td>" + result.d1coverage + "</td>")};
            if (result.d2firstname != req.body.Dependent2FirstName)                     {update.push("<tr><td>Dependent 2 First Name</td><td>" +  req.body.Dependent2FirstName + "</td><td>" + result.d2firstname + "</td>")};
            if (result.d2lastname != req.body.Dependent2LastName)                       {update.push("<tr><td>Dependent 2 Last Name</td><td>" +  req.body.Dependent2LastName + "</td><td>" + result.d2lastname + "</td>")};
            if (result.d2birthdate != req.body.Dependent2BirthDate)                     {update.push("<tr><td>Dependent 2 Birth Date</td><td>" +  req.body.Dependent2BirthDate + "</td><td>" + result.d2birthdate + "</td>")};
            if (result.d2ss != req.body.Dependent2SocialSecurity)                       {update.push("<tr><td>Dependent 2 Social Security</td><td>" +  req.body.Dependent2SocialSecurity + "</td><td>" + result.d2ss + "</td>")};
            if (result.d2gender != req.body.Dependent2Gender)                           {update.push("<tr><td>Dependent 2 Gender</td><td>" +  req.body.Dependent2Gender + "</td><td>" + result.d2gender + "</td>")};
            if (result.d2coverage != req.body.Dependent2NeedsCoverage)                  {update.push("<tr><td>Dependent 2 Coverage</td><td>" +  req.body.Dependent2NeedsCoverage + "</td><td>" + result.d2coverage + "</td>")};
            if (result.d3firstname != req.body.Dependent3FirstName)                     {update.push("<tr><td>Dependent 3 First Name</td><td>" +  req.body.Dependent3FirstName + "</td><td>" + result.d3firstname + "</td>")};
            if (result.d3lastname != req.body.Dependent3LastName)                       {update.push("<tr><td>Dependent 3 Last Name</td><td>" +  req.body.Dependent3LastName + "</td><td>" + result.d3lastname + "</td>")};
            if (result.d3birthdate != req.body.Dependent3BirthDate)                     {update.push("<tr><td>Dependent 3 Birth Date</td><td>" +  req.body.Dependent3BirthDate + "</td><td>" + result.d3birthdate + "</td>")};
            if (result.d3ss != req.body.Dependent3SocialSecurity)                       {update.push("<tr><td>Dependent 3 Social Security</td><td>" +  req.body.Dependent3SocialSecurity + "</td><td>" + result.d3ss + "</td>")};
            if (result.d3gender != req.body.Dependent3Gender)                           {update.push("<tr><td>Dependent 3 Gender</td><td>" +  req.body.Dependent3Gender + "</td><td>" + result.d3gender + "</td>")};
            if (result.d3coverage != req.body.Dependent3NeedsCoverage)                  {update.push("<tr><td>Dependent 3 Coverage</td><td>" +  req.body.Dependent3NeedsCoverage + "</td><td>" + result.d3coverage + "</td>")};
            if (result.d4firstname != req.body.Dependent4FirstName)                     {update.push("<tr><td>Dependent 4 First Name</td><td>" +  req.body.Dependent4FirstName + "</td><td>" + result.d4firstname + "</td>")};
            if (result.d4lastname != req.body.Dependent4LastName)                       {update.push("<tr><td>Dependent 4 Last Name</td><td>" +  req.body.Dependent4LastName + "</td><td>" + result.d4lastname + "</td>")};
            if (result.d4birthdate != req.body.Dependent4BirthDate)                     {update.push("<tr><td>Dependent 4 Birth Date</td><td>" +  req.body.Dependent4BirthDate + "</td><td>" + result.d4birthdate + "</td>")};
            if (result.d4ss != req.body.Dependent4SocialSecurity)                       {update.push("<tr><td>Dependent 4 Social Security</td><td>" +  req.body.Dependent4SocialSecurity + "</td><td>" + result.d4ss + "</td>")};
            if (result.d4gender != req.body.Dependent4Gender)                           {update.push("<tr><td>Dependent 4 Gender</td><td>" +  req.body.Dependent4Gender + "</td><td>" + result.d4gender + "</td>")};
            if (result.d4coverage != req.body.Dependent4NeedsCoverage)                  {update.push("<tr><td>Dependent 4 Coverage</td><td>" +  req.body.Dependent4NeedsCoverage + "</td><td>" + result.d4coverage + "</td>")};
            if (result.employername != req.body.employer)                               {update.push("<tr><td>Employer Name</td><td>" +  req.body.employer + "</td><td>" + result.employername + "</td>")};
            if (result.employerphone != req.body.employerphone)                         {update.push("<tr><td>Employer Phone</td><td>" +  req.body.employerphone + "</td><td>" + result.employerphone + "</td>")};
            if (result.income != req.body.income)                                       {update.push("<tr><td>Household Income</td><td>" +  req.body.income + "</td><td>" + result.income + "</td>")};
            if (result.physician != req.body.physician)                                 {update.push("<tr><td>Physician</td><td>" +  req.body.physician + "</td><td>" + result.physician + "</td>")};
            if (result.physicianspecialty != req.body.physicianspecialty)               {update.push("<tr><td>Physician Specialty</td><td>" +  req.body.physicianspecialty + "</td><td>" + result.physicianspecialty + "</td>")};
            if (result.ailment1 != req.body.ailment1)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment1 + "</td><td>" + result.ailment1 + "</td>")};
            if (result.ailment2 != req.body.ailment2)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment2 + "</td><td>" + result.ailment2 + "</td>")};
            if (result.ailment3 != req.body.ailment3)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment3 + "</td><td>" + result.ailment3 + "</td>")};
            if (result.prescription1 != req.body.prescription1)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription1 + "</td><td>" + result.prescription1 + "</td>")};
            if (result.prescription2 != req.body.prescription2)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription2 + "</td><td>" + result.prescription2 + "</td>")};
            if (result.prescription3 != req.body.prescription3)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription3 + "</td><td>" + result.prescription3 + "</td>")};
            if (result.dosage1 != req.body.dosage1)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage1 + "</td><td>" + result.dosage1 + "</td>")};
            if (result.dosage2 != req.body.dosage2)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage2 + "</td><td>" + result.dosage2 + "</td>")};
            if (result.dosage3 != req.body.dosage3)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage3 + "</td><td>" + result.dosage3 + "</td>")};
            update.push("</table>");

            if (update.length > 3) {
                var data = "";
                for (var i = 0; i < update.length; i++) {
                    data += update[i];
                }
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                }
            }));

            transport.sendMail({
                from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                to: doc.local.email,
                subject: 'ACA Employee Updated Information',
                html: result.firstname + ' ' + result.lastname + ' employed at ' + result.employername  + ' has changed their information:<br><br>'
                + data
                ,
            }, function(err, info) {
                if (err) {
                    console.error(err);
                } else {
                    callback("email sent");
                }
            });
                }
            else {callback("no update");}
            }
    });
}
```

#### userFunctions.js

```sh
var express = require('express');
var user = require('../routes/user.js');

exports.list = function(onResult) {
    user.find({}, function(err, users) {
        if (err) {
            onResult(err, null);
        } else {
            onResult(null, users);
        }
    });
};
```

#### utility.js

```sh
exports.convertDate = function(string) {
    if (string.indexOf("-") > -1) {
        var birthdate = string.split("-");
        var finalbirthdate = birthdate[1] + "/" + birthdate[2] + "/" + birthdate[0];
        return finalbirthdate;
    }
    else {return string};
}
```

### Views

#### adminDashboard.ejs

```sh
<!-- views/profile.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="/js/setloginsession.js"> </script>
<style>
    iframe {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        width: 100%;
    }
</style>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">

            <div class="page-header text-center">
                <h1><span class="glyphicon glyphicon-home" aria-hidden="true"></span> Admin Dashboard</h1>
            </div>
            <div class="row">
                <!-- LOCAL INFORMATION -->
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="fa fa-user"></span> Your Info</h3>
                        <p>
                            <strong>Admin ID</strong>: <%= user._id %><br>
                            <strong>Name</strong>: <%= user.local.firstName %> <%= user.local.lastName %><br>
                            <strong>E-mail</strong>: <%= user.local.email %>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> Your Cases</h3>
                        <p>
                        <% user.employer.forEach(function(employer) { %>
                        <a href="/<%= user._id %>/<%= employer._id %>"><%= employer.empname %></a>   <br>
                        <% }); %>
                        </p>
                        <p>
                            <a href="/profile/case" class="btn btn-default"> Add New Case</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span> Calendar</h3>
                        <p>
                            <iframe src="https://calendar.google.com/calendar/embed?src=acainsuresme%40gmail.com&ctz=America/Chicago" style="border: 0" frameborder="0" scrolling="yes"></iframe>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> All Cases</h3>
                        <p>
                        <% users.forEach(function(users) { %>
                            <% users.employer.forEach(function(employers) { %>
                            <a href="/<%= users._id %>/<%= employers._id %>"><%= employers.empname %></a>   <br>
                            <% }); %>
                        <% }); %>
                        </p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-search" aria-hidden="true"></span>Employee Search</h3>
                        <p>
                        <form class="form-inline" action="/search" method="post">
                            <div class="form-group">
                                <input type="search" name="search" class="form-control" id="search">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-default">Search</button>
                            </div>
                        </form>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> All Agents</h3>
                        <p>
                        <% users.forEach(function(users) { %>
                        <!--
                        <a href="/<%= user._id %>/<%= users._id %>/<%= users.local.firstName %>/<%= users.local.lastName %>"><%= users.local.firstName + " " + users.local.lastName %></a> <br>
                        -->
                        <p><%= users.local.firstName + " " + users.local.lastName %></p>
                        <% }); %>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>

</body>
</html>
```

#### adminEmployee.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<body>
    <div class="page-wrapper-index">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-10">
                        <h1>Admin Employee</h1>
                    </div>
                </div>
            </div>
        </section>
    </div>
    
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>
</body>
</html>
```

#### adminEmployer.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<body>
    <div class="page-wrapper-index">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-10">
                        <h1>Admin Employer</h1>
                    </div>
                </div>
            </div>
        </section>
    </div>
    
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>
</body>
</html>
```

#### agentDashboard.ejs

```sh
```

#### case.ejs

```sh
```

#### confirm.ejs

```sh
```

#### contact.ejs

```sh
```

#### db.ejs

```sh
```

#### employee.ejs

```sh
```

#### employer.ejs

```sh
```

#### healthplan.ejs

```sh
```

#### index.ejs

```sh
```

#### information.ejs

```sh
```

#### login.ejs

```sh
```

#### login2.ejs

```sh
```

#### passwordExpired.ejs

```sh
```

#### quote.ejs

```sh
```

#### recovery.ejs

```sh
```

#### search.ejs

```sh
```

#### signup.ejs

```sh
```

#### signup2.ejs

```sh
```

#### smallbusiness.ejs

```sh
```

#### success.ejs

```sh
```

### Models

#### admin.js

```sh
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var adminSchema = mongoose.Schema({
        agentid: String,
        employerid: String,
        email: String,
        password: String
});

// methods ======================
// generating a hash
adminSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
adminSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
};

// create the model for employees and expose it to our app
module.exports = mongoose.model('Admin', adminSchema);
```

#### employee.js

```sh
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
```

#### user.js

```sh
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        role: String
    },
    employer     : [{
        empname: String,
        streetaddress: String,
        city: String,
        state: String,
        zipcode: String,
        phonenumber: String,
        email: String,
        contact: String,
        altemail: String,
        altcontact: String,
        comments: String,
        payroll: String,
        dental: String,
        cashadvantage: String,
        vision: String
        }]
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
```

## Credits

  - [Austin Paul](https://github.com/Arpdz2)
  - [Brenden McKamey](http://brendenmckamey.com/)

## License

Copyright (c) 2015 Austin Paul <[https://github.com/Arpdz2](https://github.com/Arpdz2) & Brenden McKamey <[http://brendenmckamey.com/](http://brendenmckamey.com/)>