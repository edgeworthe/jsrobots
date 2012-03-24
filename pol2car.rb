#!/usr/bin/ruby
# given polar coords and starting cartesian coords,
# calculate target cartesian coords

def relative_cartesian( angle, range )
    # x = r * cos( angle )
    # y = r * sin( angle )
    radians = angle * Math::PI/180
    return [range * Math.cos( radians ), 
            range * Math.sin( radians )]
end

# same as above, except north = 0 & clockwise angles
def target( badx, bady, angle, range, myx, myy )
    # y = r * cos( angle )
    # x = r * sin( angle )
    while( angle > 360 )
        angle -= 360
    end
    radians = angle * Math::PI/180
    relative_xy = [(range * Math.sin( radians )).to_i, 
            (range * Math.cos( radians )).to_i]
    puts "relative: "+ relative_xy.inspect
    puts "calc'd:   [%d,%d]" % [ relative_xy[0] + myx, (relative_xy[1] - myy).abs ]
    # this.scanDirection = Math.round(Math.atan(xdiff/ydiff) * 180/Math.PI + corrective);
    if( relative_xy[1] == 0 ) 
        relative_xy[1] = 0.0000000000001 # no divide-by-zero
    end
    # everything from 90 to 270 seems to fail!
    # thanks to http://www.mathsisfun.com/polar-cartesian-coordinates.html
    correction = 0
    if( relative_xy[1] < 0 )
        correction = 180
    end
    newangle = Math.atan(relative_xy[0]/relative_xy[1]) * 180/Math::PI + correction
    if( newangle < 0 ) 
        puts "negative angle, adjusting"
        newangle += 360
    end
    puts "%d == %d" % [ newangle, angle ]
    puts
end

[ [0,20], [45,28.28], [90,20], [135,28.28],
  [180,20], [225,28.28], [270,20], [315,28.28] ].each do |ang_rng|
    # assume we're at 0,0
    relative_xy = relative_cartesian( ang_rng[0], ang_rng[1] )
    target( relative_xy[0], relative_xy[1], ang_rng[0], ang_rng[1], 0,0 )
end

puts "\n"
# having problems with stinybot.js target locks,
# so doing some modelling to get an idea where
# I'm going wrong.
# targetX,Y, scandir, range, mylocx,y: 
# 107,94,260,356,458,156
puts "was at 105,202"
target( 107,94,260,356,458,156 )

puts "was at 66,350"
target( 94,53,159,155,38,198 )

puts "was at 150,100"
target( 151,87,263,100,250,99 )

puts "was at 204,178"
target( 189,366,317,121,272,278 )

puts "was at 150,393"
target( 207,437,212,396,417,101 )

puts "was at 289,421"
target( 285,440,279,110,394,457 )
