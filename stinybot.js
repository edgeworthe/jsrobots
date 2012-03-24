/*
http://jsrobots.com/info
stinybot!
Drive around randomly in the middle and shoot at what you 
can find.
*/

if( ! this.initialized ) {
    this.alertsOK = 0;
    this.locateSelf = function() {
        this.xloc = this.loc_x();
        this.yloc = this.loc_y();
    };
    this.pathFromClosestCorner = function() {
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
    this.cart2polar = function( myX, myY, targetX, targetY ) {
        /* Given Cartesian coords return polar adapted
        for the arena coords, relative to current position */
        var xdiff = targetX - myX;
        var ydiff = myY - targetY;
        // see http://www.mathsisfun.com/polar-cartesian-coordinates.html
        var corrective = 0;
        if( ydiff < 0 ) {
            corrective = 180;
        }
        if( ydiff == 0 ) {
            ydiff = 0.000001; // avoid divide-by-zero NaN
        }
        // TODO: return range as well? we can get that from scan, tho
        return( Math.round(Math.atan(xdiff/ydiff) 
            * 180/Math.PI + corrective));
    };
    this.polar2cart = function( myX, myY, angle, range ) {
        /* Given polar coords relative to current position,
        return likely location of target */
        // TODO: fix divide-by-zero at modulus 90 (still an issue?)
        var scanRadians = angle * (Math.PI/180);
        var targetX = Math.round(Math.sin(scanRadians) * range + myX);
        var targetY = 
            Math.abs(Math.round(Math.cos(scanRadians) * range - myY));
        return( [ targetX, targetY ] );
    };
    this.nearWall = function( x, y ) {
        /* Return 1 if we're within 50 of wall, 0 otherwise */
        var retVal = 0;
        // TODO: closer ok?
        if( x > 450 || x < 50 || y > 450 || y < 50 ) {
            retVal = 1;
        }
        return( retVal );
    };

    this.attackSomething = function() {
        // TODO: stop firing in your own path, dimwit
        var haveFired = 0;
        if( this.targetXY[0] && this.targetXY[0] != -1 ) {
            this.scanDirection = this.cart2polar( this.xloc, this.yloc,
                this.targetXY[0], this.targetXY[1] );
        }
        // TODO: adjust resolution if we have a known target?
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            // TODO: adjust range outward slightly to accommodate
            // blast radius, target movement, and scan inaccuracy?
            if( targetRange <= 350 ) {
                haveFired = this.cannon( this.scanDirection, targetRange );
            } 
            this.targetXY = this.polar2cart( this.xloc, this.yloc,
                this.scanDirection, targetRange );
            // TODO: if values are outside the walls, adjust inward
            this.targetFound = 2;
            if( this.alertsOK && !this.alerted ) {
                alert( ["FOUND TARGET: targetX,Y, scandir, range, mylocx,y: ",
                    this.targetXY, this.scanDirection, targetRange,
                    this.xloc, this.yloc ] );
                this.alerted = 1;
            }
        } else {
            if( this.alertsOK && this.alerted ) {
                alert( ["LOST TARGET: targetX,Y, scandir, range, mylocx,y: ", 
                    this.targetXY, this.scanDirection, targetRange, 
                    this.xloc, this.yloc ] );
                this.alerted = 0;
            }
            if( ! this.targetFound ) {
                // TODO: adjust scanDirection based on our 
                // current heading?  Probably want to pick
                // a direction that grabs us the widest
                // swath of the playing field, yet not ignore
                // corners, either.
                this.scanDirection += 10;
                while( this.scanDirection >= 360 )
                    this.scanDirection -= 360;
                this.targetXY = [-1,-1];
            } else {
                this.targetFound -= 1;
            }
        }
        if( ! haveFired )
            this.wildfire();
    };

    this.moveAround = function() {
        // TODO: Consider more logic for avoiding other bots;
        // we lose a lot of battles just from running into/over
        // others.
        // TODO: consider retreating to corner when dmg reaches
        // certain point to avoid Mosquitoes
        if( this.haveDriven == 0 ) {
            this.currentHeading = this.pathFromClosestCorner();
            this.drive(this.currentHeading, this.drivePower);
            this.haveDriven = rand(15) + 15;
        } else if( this.haveDriven == 1 ) {
            this.drive( this.currentHeading, 0 );
            this.haveDriven -= 1;
        } else {
            this.haveDriven -= 1;
            this.drive(this.currentHeading,this.drivePower);
        }
        if( this.nearWall( this.xloc, this.yloc ) )
            this.haveDriven = 1;

    };


    this.locateSelf();

    this.drivePower = 100;
    this.haveDriven = 0; // incrementing boolean. hacky.
    this.targetXY = [-1,-1];
    this.targetFound = 0;

    this.scanDirection = this.pathFromClosestCorner();
    this.currentHeading = this.pathFromClosestCorner();

    this.initialized = 1;
}

this.locateSelf();
this.attackSomething();
if( this.speed() == 0 && this.haveDriven != 0 ) {
    // CHEAT: to work around the quick getaway bug, let's
    // drive twice in a single iteration like all the
    // sample bots do.
    // TODO: figure out some way to stop cheating that
    // still prevents getting trampled by Mosquito
    // TODO: sometimes get hung up after collision with
    // tower in center due to moveAround logic--instead
    // flee to corner?
    this.haveDriven = 0;
    this.drive(this.currentHeading, 0);
}
this.moveAround();

