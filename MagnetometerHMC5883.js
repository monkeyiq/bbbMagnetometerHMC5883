var i2c = require('i2c');
var async = require('async');
var b = require('bonescript');

var SENSORS_GAUSS_TO_MICROTESLA = 100;
var _hmc5883_Gauss_LSB_XY = 1100.0; // Varies with gain
var _hmc5883_Gauss_LSB_Z  = 980.0;  // Varies with gain
var HMC5883_REGISTER_MAG_CRB_REG_M = 0x01;
var HMC5883_REGISTER_MAG_MR_REG_M  = 0x02;
var HMC5883_REGISTER_MAG_OUT_X_H_M = 0x03;
var HMC5883_MAGGAIN_1_3 = 0x20; // +/- 1.3
var HMC5883_MAGGAIN_1_9 = 0x40; // +/- 1.9
var HMC5883_MAGGAIN_2_5 = 0x60; // +/- 2.5
var HMC5883_MAGGAIN_4_0 = 0x80; // +/- 4.0
var HMC5883_MAGGAIN_4_7 = 0xA0; // +/- 4.7
var HMC5883_MAGGAIN_5_6 = 0xC0; // +/- 5.6
var HMC5883_MAGGAIN_8_1 = 0xE0; // +/- 8.1

function MagnetometerHMC5883( i2caddr, deviceName, declinationAngle, callback )
{
    console.log("MagnetometerHMC5883(1)");

    this.i2caddr = i2caddr;
    this.declinationAngle = declinationAngle;
    this.magx = 0.0;
    this.magy = 0.0;
    this.magz = 0.0;
    this.headingR = 0;
    this.headingD = 0;
    this.wire = new i2c( i2caddr, { device : deviceName });
    var self = this;

    async.waterfall([
	function(cb) {
	    self.wire.writeBytes( HMC5883_REGISTER_MAG_MR_REG_M, [ 0x0 ], function(err) {
		cb(err);
	    });
	},
	function(cb) {
	    self.wire.writeBytes( HMC5883_REGISTER_MAG_CRB_REG_M, [ HMC5883_MAGGAIN_1_3 ], function(err) {
		cb(err);
	    });
	}], function(err) {
	    if (!err) {
		setTimeout(function() {
		    callback(null);
		}, 1000);

	    } else {
		callback(err);
	    }
	});

}


MagnetometerHMC5883.prototype.measure = function(callback) {
    var self = this;
    var BUFFER_SIZE = 6;

    self.wire.readBytes( HMC5883_REGISTER_MAG_OUT_X_H_M, BUFFER_SIZE, function(err, res) {
	if (!err) {
	    
//	    console.log("have some values! self.i2caddr:" + self.i2caddr );
//	    console.log("res[0] " + res[0]);
//	    console.log("res[1] " + res[1]);

//	    self.magx = (res[0] << 8 | res[1]) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
//	    self.magy = (res[4] << 8 | res[5]) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;

	    self.magx = res.readInt16BE(0 * 2) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
	    self.magz = res.readInt16BE(1 * 2) * 1.0 / _hmc5883_Gauss_LSB_Z  * SENSORS_GAUSS_TO_MICROTESLA;
	    self.magy = res.readInt16BE(2 * 2) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
//	    console.log("have magx: " + self.magx );
	    var heading = Math.atan2( self.magx, self.magy );
//	    console.log("h1: " + heading );
	    heading -= self.declinationAngle;
	    heading -= Math.PI + Math.PI / 3;
	    while( heading < 0 )
		heading += 2*Math.PI;
	    while( heading > 2*Math.PI )
		heading -= 2*Math.PI;

	    // upside down, make 90 be east
//	    heading = 2*Math.PI - heading;
	    
	    // convert to degrees also
	    self.headingR = heading;
	    self.headingD = heading * 180/Math.PI;

	    self.wire.writeBytes( HMC5883_REGISTER_MAG_OUT_X_H_M, [0x0], function(err) {
		if( !err ) {
		    callback(null);
		}
	    });
	}
    });

	// },
	// function(cb) {

	//     var BUFFER_SIZE = 6;
	//     self.wire.readBytes( this.i2caddr, BUFFER_SIZE, function(err, res) {
	// 	if (!err) {
		    
	// 	    console.log("have some values!");
	// 	    self.magx = res.readInt16BE(0 * 2) / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
	// 	    self.magy = res.readInt16BE(1 * 2) / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
	// 	    self.magz = res.readInt16BE(2 * 2) / _hmc5883_Gauss_LSB_Z  * SENSORS_GAUSS_TO_MICROTESLA;
	// 	    console.log("have magx: " + self.magx );
		    
	// 	    var heading = Math.atan2( self.magx, self.magy );
	// 	    heading -= self.declinationAngle;
	// 	    while( heading < 0 )
	// 		heading += 2*Math.PI;
	// 	    while( heading > 2*Math.PI )
	// 		heading -= 2*Math.PI;

	// 	    // upside down, make 90 be east
	// 	    heading = 2*Math.PI - heading;
		    
	// 	    // convert to degrees also
	// 	    self.headingR = heading;
	// 	    self.headingD = heading * 180/Math.PI;

	// 	    callback(null);
	// 	} else {
	// 	    cb(err);
	// 	}
	//     });
	// }], function(err) {
	//     if (!err) {
	// 	setTimeout(function() {
	// 	    callback(null);
	// 	}, 1000);

	//     } else {
	// 	callback(err);
	//     }
	// });

}

MagnetometerHMC5883.errorHandler = function (error) 
{
    console.log('Error: ' + error.message);
};
module.exports = MagnetometerHMC5883;
