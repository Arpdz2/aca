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