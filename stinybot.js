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
    this.attack = function() {
        if( this.targetXY[0] && this.targetXY[0] != -1 ) {
            var xdiff = this.targetXY[0] - this.xloc;
            var ydiff = this.targetXY[1] - this.yloc;
            var corrective = 0;
            if( xdiff < 0 ) {
                corrective = 180;
            }
            if( ydiff == 0 ) {
                ydiff = 0.0001; // avoid divide-by-zero NaN
            }
            this.scanDirection = Math.round(Math.atan(xdiff/ydiff) * 180/Math.PI + corrective);
        }
        var targetRange = this.scan( this.scanDirection, 10 );
        if( targetRange ) {
            if( targetRange <= 350 ) {
                this.cannon( this.scanDirection, targetRange );
            }
            // TODO: break out into separate function?
            this.targetXY[0] = Math.cos(this.scanDirection * (Math.PI/180)) * targetRange - this.xloc;
            this.targetXY[1] = Math.sin(this.scanDirection * (Math.PI/180)) * targetRange - this.yloc;

        } else {
            this.scanDirection += 10;
            this.targetXY = [-1,-1];
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
    this.locate();
    this.scanDirection = this.findPath();
    this.currentHeading = this.findPath();
    this.targetXY = [-1,-1];

    this.initialized = 1;
}

//this.currentSpeed = this.speed();
this.locate();
this.attack();
if( this.speed() == 0 && this.haveDriven != 0 ) {
    // to work around the quick getaway bug, let's cheat.
    this.drive(this.currentHeading, 0);
    this.drive(this.currentHeading, this.drivePower);
} else {
    this.moveAround();
}

/* 
MATH NOTES HERE

0,0 and 50,0, 90 degrees, 50 range -- do we special-case %90==0?
0,0 and 12,12, 45 degrees, 17 range

sqrt(50*50+0*0)
angle A + hypotenuse H given 
cos A = X/H 
sin A = Y/H
tan A = X/Y (or Y/X?)
target_x = cos(angle)* range - loc_x
target_y = sin(angle)* range - loc_y
A = atan(X/Y), if X < 0, add 180?
http://www.w3schools.com/jsref/jsref_obj_math.asp
radians = degrees * (pi/180)
*/

