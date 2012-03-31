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

    this.resetTarget = function() {
        this.targetXY = [-1,-1];
    };

    this.noTargetLock = function() {
        return this.targetXY[0] == -1;
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
        angle = this.currentHeading + 135 + rand(90);
        range = 100;
        xy = this.polar2cart( this.xloc, this.yloc, angle, range );
        if( xy[0] < 0 || xy[1] < 0 || xy[0] > 499 || xy[1] > 499 ) {
            // outside of arena, might hit self in blowback
            return;
        }
        if( this.noTargetLock()
            && ! this.nearWall( this.xloc, this.yloc ) )
            this.cannon( angle, range );
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
        var scanRadians = angle * (Math.PI/180);
        var targetX = Math.round(Math.sin(scanRadians) * range + myX);
        var targetY = 
            Math.abs(Math.round(Math.cos(scanRadians) * range - myY));
        // TODO: mathier way of doing this?
        if( targetX < 0 ) { targetX = 0; }
        if( targetX > 499 ) { targetX = 499; }
        if( targetY < 0 ) { targetY = 0; }
        if( targetY > 499 ) { targetY = 499; }
        return( [ targetX, targetY ] );
    };

    this.nearWall = function( x, y ) {
        /* Return 1 if we're close to wall, 0 otherwise */
        var retVal = 0;
        var dist = 8;
        // TODO: need to determine distance to point on the wall
        // where we'll strike it; right now we just use the
        // maximum dist to prevent colliding with wall when
        // roughly perpendicular path, and also causes us to
        // recalculate travel when we're actually headed *away*
        // from wall, which could potentially get us killed.
        if( x > 499-dist || x < dist || y > 499-dist || y < dist ) {
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

    this.trackAndAttackTarget = function( angle, range ) {
        // TODO: adjust range outward slightly to accommodate
        // blast radius, target movement, and scan inaccuracy?
        // TODO: consider altering this.currentHeading such
        // that we're travelling at 90 degrees to the target,
        // effectively circling them at range.  Problems with
        // this: 1) might end up hitting wall, 2) need to
        // stop and then take new heading, else we just grind
        // to a halt.
        var haveFired = 0;
        if( range <= 350 ) {
            haveFired = this.cannon( angle, range );
        } 
        this.targetXY = this.polar2cart( this.xloc, this.yloc,
            angle, range );
        this.targetFound = 2;
        if( this.alertsOK && !this.alerted ) {
            alert( ["FOUND TARGET: targetX,Y, scandir, range, mylocx,y: ",
                this.targetXY, angle, range, this.xloc, this.yloc ] );
            this.alerted = 1;
        }
        return haveFired;
    };

    this.adjustScan = function() {
        if( this.alertsOK && this.alerted ) {
            alert( ["LOST TARGET: targetX,Y, scandir, range, mylocx,y: ", 
                this.targetXY, this.scanDirection, targetRange, 
                this.xloc, this.yloc ] );
            this.alerted = 0;
        }
        if( ! this.targetFound ) {
            // TODO: adjust scanDirection based on our
            // current heading?  Probably want to pick a
            // direction that grabs us the widest swath of
            // the playing field, yet not ignore corners,
            // either.
            this.scanDirection += 10;
            while( this.scanDirection >= 360 )
                this.scanDirection -= 360;
            this.resetTarget();
        } else {
            this.targetFound -= 1;
        }
    };

    this.attackSomething = function() {
        // TODO: stop firing in your own path, dimwit
        // TODO: long function, consider breaking up into smaller
        // chunks, e.g. scan/fire/alert
        var haveFired = 0;
        if( this.targetXY[0] && ! this.noTargetLock() ) {
            this.scanDirection = this.cart2polar( this.xloc, this.yloc,
                this.targetXY[0], this.targetXY[1] );
        }
        // TODO: adjust resolution if we have a known target?
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            haveFired = 
                this.trackAndAttackTarget( this.scanDirection, targetRange );
        } else {
            this.adjustScan();
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


    // TODO: stop calling multiple times on first iteration?
    this.locateSelf();

    this.drivePower = 100;
    this.haveDriven = 0; // incrementing boolean. hacky.
    this.resetTarget();
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
// TODO: consider adding an arena object for methods like
// nearWall, nearCenter, outsideWalls, etc.
// TODO: a lot of dmg taken from robot collisions; consider
// hugging walls until take damage, then move to another wall.
// TODO: Seems we do okay against 1-2 of any other built-in bots,
// but when we get to 3 the perimeter guard or mosquito bot kills
// me well because it's often in my path and does poorly killing
// itself.  Any way to handle that?  (One way: stop shooting
// yourself at walls!)

this.locateSelf();
this.checkDamage();
this.attackSomething();
if( this.speed() == 0 && this.haveDriven != 0 || this.underAttack ) {
    // CHEAT: to work around the quick getaway bug, let's
    // drive twice in a single iteration like all the
    // sample bots do.
    // TODO: figure out some way to stop cheating that
    // still prevents getting trampled by Mosquito
    // TODO: sometimes get hung up after collision with
    // tower/twin in center due to moveAroundRandomly logic--instead
    // flee to corner?
    // TODO: potential bug where we get hung up on bot if collide
    // near wall?  Hard to replicate, unfortunately.
    this.drive(this.currentHeading, 0);
}
this.moveAroundRandomly();

