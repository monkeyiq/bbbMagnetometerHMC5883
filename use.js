var b         = require('bonescript');
var Magneto   = require('./MagnetometerHMC5883.js');

var magneto = new Magneto( 0x1E, '/dev/i2c-1', 0.192, function(err) {
    if (!err) {
	console.log("Magneto came up...");
	magneto_readValues();
    }
    else 
    {
	console.log("FAILED: finding magneto...");
	console.log(err);
    }
});


function magneto_readValues() {
    setInterval(function() {

	magneto.measure(function(err) {
	    if (!err) {
		console.log("x:" + magneto.magx + " y:" + magneto.magy + " heading: " + magneto.headingD );
	    } else {
		console.log(err);
	    }
});
    }, 100 );
}

