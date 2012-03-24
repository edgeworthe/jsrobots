/*
http://jsrobots.com/info
Drive around randomly in the middle and shoot at what you 
can find.
*/

if( ! this.initialized ) {
    this.locate = function() {
        this.xloc = this.loc_x();
        this.yloc = this.loc_y();
    };
    this.findPath = function() {
        // TODO: better mathy way to do this?
        // 0-499, 249 = center
        var randomVal = rand(90);
        if( this.xloc < 250 ) {
            if( this.yloc < 250 ) {
                return randomVal + 90;
            } else {
                return randomVal;
            }
        } else {
            if( this.yloc < 250 ) {
                return randomVal + 180;
            } else {
                return randomVal + 270;
            }
        }
    };
    this.wildfire = function() {
        // Always Be Firing
        // Downside: Sometimes Be Reloading at inopportune moments
        if( ! this.targetXY[0] || this.targetXY[0] == -1 )
            this.cannon( this.currentHeading + 135 + rand(90), 100 );
    };
    this.attack = function() {
        // TODO: stop firing in your own path, dimwit
        var haveFired = 0;
        if( this.targetXY[0] && this.targetXY[0] != -1 ) {
            var xdiff = this.targetXY[0] - this.xloc;
            var ydiff = this.yloc - this.targetXY[1];
            // see http://www.mathsisfun.com/polar-cartesian-coordinates.html
            var corrective = 0;
            if( ydiff < 0 ) {
                corrective = 180;
            }
            if( ydiff == 0 ) {
                ydiff = 0.000001; // avoid divide-by-zero NaN
            }
            this.scanDirection = Math.round(Math.atan(xdiff/ydiff) * 180/Math.PI + corrective);
        }
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            if( targetRange <= 350 ) {
                haveFired = this.cannon( this.scanDirection, targetRange );
            } 
            // TODO: break out into separate function?
            /* 
            By moving origin to Y axis, you're 
            essentially flipping the plane over and rotating counter-
            clockwise by 90 degrees, so can we just swap X and Y coords?

            major epiphany: 0,0 is NW corner, 499,499 SE, which is
            direct opposite what I was modelling.  D'oh!  X axis is
            okay to model same way, but Y axis we have to subtract
            rather than add current location, then take absolute value.

            TODO: fix divide-by-zero at modulus 90
            */
            scanRadians = this.scanDirection * (Math.PI/180);
            this.targetXY[0] = Math.round(Math.sin(scanRadians) * targetRange + this.xloc);
            this.targetXY[1] = Math.abs(Math.round(Math.cos(scanRadians) * targetRange - this.yloc));
            this.targetFound = 2;
            if( !this.alerted ) {
                //alert( ["FOUND TARGET: targetX,Y, scandir, range, mylocx,y: ", this.targetXY, this.scanDirection, targetRange, this.xloc, this.yloc ] );
                this.alerted = 1;
            }
        } else {
            if( this.alerted ) {
                // TODO: we tend to lose target immediately,
                // with scanDirection being wrong.  fix atan above?
                //alert( ["LOST TARGET: targetX,Y, scandir, range, mylocx,y: ", this.targetXY, this.scanDirection, targetRange, this.xloc, this.yloc ] );
                this.alerted = 0;
            }
            if( ! this.targetFound ) {
                // TODO: adjust scanDirection based on our 
                // current heading
                this.scanDirection += 10;
                // sometimes targeting is weird if > 360?
                while( this.scanDirection >= 360 ) 
                    this.scanDirection -= 360;
                this.targetXY = [-1,-1];
            } else {
                this.targetFound -= 1;
            }
        }
        /* if( ! haveFired )
            this.wildfire(); */
    };
    this.moveAround = function() {
        // TODO: Consider more logic for avoiding other bots;
        // we lose a lot of battles just from running into/over
        // others.
        if( this.haveDriven == 0 ) {
            this.currentHeading = this.findPath();
            this.drive(this.currentHeading, this.drivePower);
            this.haveDriven = rand(15) + 15;
        } else if( this.haveDriven == 1 ) {
            this.drive( this.currentHeading, 0 );
            this.haveDriven -= 1;
        } else {
            this.haveDriven -= 1;
            this.drive(this.currentHeading,this.drivePower);
        }
        // wall check
        if( this.xloc > 450 || this.xloc < 50 ||
            this.yloc > 450 || this.yloc < 50 ) {
            this.haveDriven = 1;
        }

    };


    this.drivePower = 100;
    this.haveDriven = 0;
    this.locate();
    this.scanDirection = this.findPath();
    this.currentHeading = this.findPath();
    this.targetXY = [-1,-1];
    this.targetFound = 0;

    this.initialized = 1;
}

//this.currentSpeed = this.speed();
this.locate();
this.attack();
if( this.speed() == 0 && this.haveDriven != 0 ) {
    // to work around the quick getaway bug, let's cheat
    // by driving twice in a single iteration.
    // TODO: figure out some way to stop cheating that
    // still prevents getting trampled by Mosquito
    // TODO: sometimes get hung up after collision with
    // tower in center due to moveAround logic--instead
    // flee to corner?
    this.haveDriven = 0;
    this.drive(this.currentHeading, 0);
} 
this.moveAround();

