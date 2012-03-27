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
    this.checkDamage = function() {
        // potential bug: if run this twice, might get misleading
        // results
        this.currentDamage = this.damage();
        if( this.currentDamage != this.previousDamage )
            this.underAttack = 1;
        else
            this.underAttack = 0;
        this.previousDamage = this.currentDamage;
    };
    this.pathFromClosestCorner = function() {
        // TODO: better mathy way to do this?
        // 0-499, 249 = center
        // TODO: prevent getting hung up in middle
        var angle = rand(90);
        var midpoint = 250;
        if( this.xloc < midpoint ) {
            if( this.yloc > midpoint ) {
                angle += 0;
            } else {
                angle += 90;
            }
        } else {
            if( this.yloc < midpoint ) {
                angle += 180;
            } else {
                angle += 270;
            }
        }
        return angle;
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
        /* Return 1 if we're within close to wall, 0 otherwise */
        var retVal = 0;
        // TODO: closer ok?
        if( x > 492 || x < 7 || y > 492 || y < 7 ) {
            retVal = 1;
        }
        return( retVal );
    };
    this.nearMiddle = function( x, y ) {
        var retVal = 0;
        if( x < 300 && x > 200 && y < 300 && y > 200 )
            retVal = 1;
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

    this.moveAroundRandomly = function() {
        // TODO: Consider more logic for avoiding other bots;
        // we lose a lot of battles just from running into/over
        // others.
        // TODO: consider retreating to corner when dmg reaches
        // certain point to avoid Mosquitoes
        if( this.haveDriven == 1 && this.nearWall( this.xloc, this.yloc ) ) {
            this.currentHeading = this.pathFromClosestCorner();
            this.drive( this.currentHeading, 0 );
            this.haveDriven = 0;
        } else {
            this.drive(this.currentHeading, this.drivePower);
            this.haveDriven = 1;
        }
    };
    this.moveSpiral = function() {
        /* move in spiral shape */
        // TODO: move to corner upon initialization/spiral finish
        // TODO: randomly determine spiraling direction
        // TODO: once get close to middle, reset to random corner
        // and start over
    };
    this.moveCircle = function() {
        /* trace a circle within bounds of arena */
        // TODO: move in a circle and change circle size after a
        // certain number of revolutions.
    };
    this.yellowWallpaper = function() {
        /* move around perimeter, very close to walls */
        if( ! this.nearWall( this.xloc, this.yloc ) ) {
            // TODO: move to a wall
        } 
        // TODO: move along walls
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

// TODO: add logic for switching "modes"--e.g.:
// - if we keep losing targets or too much time elapses, assume
// they're moving really fast and switch to pursuit mode to close
// distance.
// - if the target shows up at the same spot each time, assume
// it's stationary and circle it
// - differentiate between collision damage and cannon damage?

this.locateSelf();
// TODO: no dmg check presently?
this.checkDamage();
this.attackSomething();
if( this.speed() == 0 && this.haveDriven != 0 ) {
    // CHEAT: to work around the quick getaway bug, let's
    // drive twice in a single iteration like all the
    // sample bots do.
    // TODO: figure out some way to stop cheating that
    // still prevents getting trampled by Mosquito
    // TODO: sometimes get hung up after collision with
    // tower/twin in center due to moveAroundRandomly logic--instead
    // flee to corner?
    this.drive(this.currentHeading, 0);
}
this.moveAroundRandomly();

