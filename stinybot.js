/*
http://jsrobots.com/info
Drive around randomly in the middle and shoot at what you 
can find.
*/

if( ! this.initialized ) {
    this.findPath = function() {
        // 0-499, 249 = center
        var xloc = this.loc_x();
        var yloc = this.loc_y();
        // TODO: better mathy way to do this?
        var randomVal = rand(90);
        if( xloc < 250 ) {
            if( yloc < 250 ) {
                return randomVal + 90;
            } else {
                return randomVal;
            }
        } else {
            if( yloc < 250 ) {
                return randomVal + 180;
            } else {
                return randomVal + 270;
            }
        }
    };
    this.attack = function() {
        // NOTE: Is it cheating to call loc_x() twice?
        var xloc = this.loc_x();
        var yloc = this.loc_y();
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            // TODO: calculate location, FIRE
            this.cannon( this.scanDirection, targetRange );
        } else {
            this.scanDirection += 10;
        }
    };
    this.moveAround = function() {
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
    };


    this.drivePower = 100;
    this.haveDriven = 0;
    this.scanDirection = 0;
    //this.targetXY = [0,0];
    this.initialized = 1;
}

//this.currentSpeed = this.speed();
this.attack();
if( this.speed() == 0 && this.haveDriven != 0 ) {
    // to work around the quick getaway bug, let's cheat.
    this.drive(this.currentHeading, 0);
    this.drive(this.currentHeading, this.drivePower);
} else {
    this.moveAround();
}

/* 
0,0 and 50,0, 90 degrees, 50 range -- do we special-case %90==0?
0,0 and 12,12, 45 degrees, 17 range

sqrt(50*50+0*0)
angle A + hypotenuse H given 
cos A = X/H 
sin A = Y/H
target_x = cos(angle)* range - loc_x
target_y = sin(angle)* range - loc_y
http://www.w3schools.com/jsref/jsref_obj_math.asp
radians = degrees * (pi/180)
*/
