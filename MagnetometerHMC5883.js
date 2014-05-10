/******************************************************************************
*******************************************************************************
*******************************************************************************

    Copyright (C) 2014 Ben Martin

    libferris is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    libferris is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with libferris.  If not, see <http://www.gnu.org/licenses/>.

    For more details see the COPYING file in the root directory of this
    distribution.

    $Id: MagnetometerHMC5883.js,v 1.70 2011/07/31 21:30:49 ben Exp $

*******************************************************************************
*******************************************************************************
******************************************************************************/

var i2c = require('i2c');
var async = require('async');
var b = require('bonescript');

// constants
var SENSORS_GAUSS_TO_MICROTESLA = 100;
var _hmc5883_Gauss_LSB_XY = 1100.0; // Varies with gain
var _hmc5883_Gauss_LSB_Z  = 980.0;  // Varies with gain

// registers of interest
var HMC5883_REGISTER_MAG_CRB_REG_M = 0x01;
var HMC5883_REGISTER_MAG_MR_REG_M  = 0x02;
var HMC5883_REGISTER_MAG_OUT_X_H_M = 0x03;

// gain values
var HMC5883_MAGGAIN_1_3 = 0x20; // +/- 1.3
var HMC5883_MAGGAIN_1_9 = 0x40; // +/- 1.9
var HMC5883_MAGGAIN_2_5 = 0x60; // +/- 2.5
var HMC5883_MAGGAIN_4_0 = 0x80; // +/- 4.0
var HMC5883_MAGGAIN_4_7 = 0xA0; // +/- 4.7
var HMC5883_MAGGAIN_5_6 = 0xC0; // +/- 5.6
var HMC5883_MAGGAIN_8_1 = 0xE0; // +/- 8.1

function MagnetometerHMC5883( i2caddr, deviceName, declinationAngle, callback )
{
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
	    
	    self.magx = res.readInt16BE(0 * 2) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
	    self.magz = res.readInt16BE(1 * 2) * 1.0 / _hmc5883_Gauss_LSB_Z  * SENSORS_GAUSS_TO_MICROTESLA;
	    self.magy = res.readInt16BE(2 * 2) * 1.0 / _hmc5883_Gauss_LSB_XY * SENSORS_GAUSS_TO_MICROTESLA;
	    var heading = Math.atan2( self.magx, self.magy );
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
}

MagnetometerHMC5883.errorHandler = function (error) 
{
    console.log('Error: ' + error.message);
};
module.exports = MagnetometerHMC5883;
