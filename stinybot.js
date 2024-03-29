/*
http://jsrobots.com/info
stinybot!
Drive around randomly in the middle and shoot at what you 
can find.
*/

if( ! this.iterations ) {
    this.alertsOK = 0; // sometimes alert() helps debugging

    this.locateSelf = function() {
        /* record our x,y location to avoid multiple calls to
           loc_x() and loc_y() in a single iteration */
        this.xloc = this.loc_x();
        this.yloc = this.loc_y();
    };

    // TODO: keep track of where targets are showing up over time
    // in order to have intelligence regarding number of
    // opponents (if we see them moving more quickly than they
    // should be able to) and/or movement strategies (always in
    // same places, etc.)
    this.resetTarget = function() {
        /* place target outside arena walls to represent our lack
           of target lock */
        this.targetXY = [-1,-1];
    };

    this.haveTargetLock = function() {
        /* Whether we've recorded our target's x,y coords
           recently; see also this.resetTarget() */
        return this.targetXY[0] != -1;
    };

    this.checkDamage = function() {
        /* Keep track of last-reported damage level and set
           this.underAttack if it's changed since last iteration */
        // avoid running more than once per iteration
        if( this.checkDamageIteration != this.iterations ) {
            this.currentDamage = this.damage();
            if( this.currentDamage != this.previousDamage )
                this.underAttack = 10;
            else if( this.underAttack > 0 )
                this.underAttack -= 1;
            this.previousDamage = this.currentDamage;
            this.checkDamageIteration = this.iterations;
        }
    };

    this.whichQuadrant = function( x, y ) {
        /* given x,y coords, return which quadrant those coords
        are in, where the quadrants are set up as: 4 1
                                                   3 2 */
        var midpoint = 250;
        var quadrant = 0;
        if( x > midpoint ) {
            if( y < midpoint ) { quadrant = 1; }
            else { quadrant = 2; }
        } else {
            if( y > midpoint ) { quadrant = 3; }
            else { quadrant = 4; }
        }
        return( quadrant );
        
    };
    this.pathFromClosestCorner = function() {
        // TODO: better mathy way to do this?
        // 0-499, 249 = center
        var angle = rand(90);
        switch( this.whichQuadrant( this.xloc, this.yloc ) ) {
            case 1:
            angle += 180; break;
            case 2:
            angle += 270; break;
            case 3:
            angle += 0; break;
            case 4:
            angle += 90; break;
            default:
            alert( "Bad quadrant value:", 
                    this.whichQuadrant( this.xloc, this.yloc ) );
            break;
        }
        return angle;
    };
    this.isOutsideArena = function( x, y ) {
        /* given x,y coords, return boolean whether it's outside
           (or at) the arena walls */
        // TODO: why does y<=0 here cause us to run against wall?
        return( x <= 0 || x >= 499 || y <= 10 || y >= 499 );
    };

    this.wildfire = function() {
        /* Always Be Firing */
        // Downside: Sometimes Be Reloading at inopportune moments
        var minXY = 10;
        var maxXY = 499 - minXY;
        angle = this.currentHeading + 135 + rand(90);
        range = 100;
        xy = this.polar2cart( this.xloc, this.yloc, angle, range );
        if( xy[0] < minXY || xy[1] < minXY || 
            xy[0] > maxXY || xy[1] > maxXY ) {
            // outside of arena, might hit self in blowback
            return;
        }
        if( ! this.haveTargetLock()
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
        var dist = 18;
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

    this.trackAndAttackTarget = function( angle, range ) {
        /* logic for firing on and recording target position */
        // TODO: adjust range outward slightly to accommodate
        // blast radius, target movement, and scan inaccuracy?
        var haveFired = 0;
        var minRange = 250 - this.iterations/100;
        if( minRange < 50 )
            minRange = 50;
        if( range <= 350 ) {
            haveFired = this.cannon( angle, range );
        } 
        // based on range to target, run perpendicular to them
        // with adjustments to close or increase distance as
        // appropriate.
        if( range <= 25 ) {
            this.circleHeading = this.circleHeading < 0 ? -135 : 135;
        } else if( range <= minRange ) {
            this.circleHeading = this.circleHeading < 0 ? -90 : 90;
        } else {
            this.circleHeading = this.circleHeading < 0 ? -45 : 45;
        }
        this.targetXY = 
            this.polar2cart( this.xloc, this.yloc, angle, range );
        if( this.alertsOK && !this.alerted ) {
            alert( ["FOUND TARGET: targetX,Y, scandir, range, mylocx,y: ",
                this.targetXY, angle, range, this.xloc, this.yloc ] );
            this.alerted = 1;
        }
        return haveFired;
    };

    this.adjustScan = function() {
        /* adjust this.scanDirection based on target status */
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
        /* find a target or shoot wildly */
        var haveFired = 0;
        if( this.targetXY[0] && this.haveTargetLock() ) {
            this.scanDirection = this.cart2polar( this.xloc, this.yloc,
                this.targetXY[0], this.targetXY[1] );
        }
        // TODO: adjust resolution if we have a known target?
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            haveFired = 
                this.trackAndAttackTarget( this.scanDirection, targetRange );
            // TODO: adjust the targetFound logic--might be
            // causing us to miss fast-moving targets presently.
            this.targetFound = 2;
        } else {
            this.adjustScan();
        }
        if( ! haveFired )
            this.wildfire();
    };

    this.keepOnTrucking = function() {
        /* Pretty much all movement logic herein.  Basically:
           keep moving to a different quadrant until you find a
           target; once you find a target, circle them. */
        // TODO: consider retreating to corner when dmg reaches
        // certain point to avoid Mosquitoes?
        var initialHeading = this.currentHeading;
        if( this.haveTargetLock() && ! this.underAttack ) {
            var circlingTarget = this.scanDirection + this.circleHeading;
            if( Math.abs(circlingTarget - this.currentHeading) > 10 )
                this.currentHeading = circlingTarget;
        } 
        // TODO: how far do we travel in one iteration at 100%
        // drive?
        var destination = this.polar2cart( this.xloc, this.yloc, 
            this.currentHeading, 25 );
        if( this.isOutsideArena( destination[0], destination[1] ) ) {
            this.currentHeading = this.pathFromClosestCorner();
            this.circleHeading *= -1;
        } 
        if( initialHeading == this.currentHeading ) {
            this.drive(this.currentHeading, this.drivePower);
        } else {
            this.drive(this.currentHeading, 49);
        }
    };

    this.locateSelf();

    this.drivePower = 100;
    this.resetTarget();
    this.targetFound = 0;

    this.scanDirection = this.pathFromClosestCorner();
    this.currentHeading = this.pathFromClosestCorner();
    this.circleHeading = 90;
    this.iterations = 0;
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
// TODO: Seems we do okay against 1-2 of any other built-in bots,
// but when we get to 3 the perimeter guard or mosquito bot kills
// me well because it's often in my path and does poorly killing
// itself.  Any way to handle that? 

this.iterations += 1;
if( this.iterations > 1 )
    this.locateSelf();
this.checkDamage();
this.attackSomething();
if( this.speed() == 0 ) {
    // CHEAT: to work around the quick getaway bug, let's drive
    // twice in a single iteration like all the sample bots do.
    // TODO: figure out some way to stop cheating that still
    // prevents getting trampled by Mosquito
    this.drive(this.currentHeading, 0);
}
this.keepOnTrucking();

