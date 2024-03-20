/********************* GLOBAL FUNCTIONS *****************************************/

/**************************************************************
 * Generates a random number between a min and max (exclusive)
**************************************************************/
function randomNum(min, max) {
    return Math.random() * (max - min) + min; // Return a random number
}

/********************* CLASS DEFINITIONS *****************************************/

/*************************************************
 * Parent class for all sprites
 * This class contains:
    * A container for the animation frames
    * A container for the animation image
    * A counter for current animation frame
    * A container for background canvas image
    * A container for the context of the canvas
    * A tracker for the previous animation time
    * A variable for the animation speed
 *************************************************/
class Sprite {
    constructor(context) {
        this.frames = [];                       // Container for JSON data
        this.img = null;                        // Container for the animation frames
        this.frame_idx = -1;                    // Counter for current animation frame
        this.bk_img = null;                     // Container for background canvas
        this.ctx = context;                     // Container for the context of the canvas
        this.prev_time = new Date().getTime();  // Tracks the last animation frame time
        this.t_delta = 0;                       // Animation speed
    }

    /*******************************************************************
     Returns the background image data for clearing the previous image
    *******************************************************************/
    get_bk_img(x, y, w, h) {
        this.bk_img = this.ctx.getImageData(x, y, w, h);
    }

    /******************************************************************************
     Places the background image data onto the canvas to clear the previous image
    ******************************************************************************/
    put_bk_img(x, y) {
        this.ctx.putImageData(this.bk_img, x, y);
    }

    /*******************************************************
     Draws the current image for the sprite onto the canvas
    *******************************************************/
    drawFrame(x, y, w, h) {
        this.ctx.drawImage(this.img, x, y, w, h);
    }
}

/************************************************************************
 * Boids class for the sprites
 * It will access the Sprite class properties for
    * canvas context
 * Class adds:
    * The separate buffer canvas for each boid
    * The separate buffer context for each boid 
    * The position vector of the boids
    * The width and height of the boids
    * The velocity of the boids
    * The acceleration of the boids
    * The perception radius of the boids
    * The maximum velocity the boids can acheive
    * The maximum acceleration force the boids can acheive
    * The scaling factor for the width and height of the boids
    * The worldview array (the flock array from Flock class)
    * The properties array (changes made from sliders on html page)
 ************************************************************************/
class Boid extends Sprite {
    constructor(context) {
        super(context);
        this.canvas = document.createElement('canvas');         // Each boid gets its own buffer canvas
        this.buffer = this.canvas.getContext('2d', 
            { willReadFrequently: true });                      // Each boid gets its own context to draw with
        this.position = 
            new Vector_2D(randomNum(0, window.innerWidth*0.8), 
            randomNum(0, window.innerHeight*0.8));              // Coordinate position of boids on canvas
        this.w_h = [0, 0];                                          // Width and height of boids
        this.velocity = new Vector_2D(randomNum(0, 2), 
            randomNum(0, 4));                                   // Velocity of boids
        this.acceleration = new Vector_2D();                    // Acceleration of boids (Zero vector by default)
        this.vis_rad = 50;                                      // Visual radius for boids interaction 
        this.maxVelocity = 6;                                   // Maximum velocity boids may acheive
        this.maxAcceleration = 1;                               // Maximum acceleration boids may acheive
        this.scale = 0.05;                                      // Scaling factor for sprite size (0.2 maximum for now)
        this.worldview = [];                                    // Container for the other_boids in the flock
        this.properties = [];                                   // Container for the properties from sliders in flock

        // Control default behavior of boids
        this.velocity.setMagnitude(randomNum(0, 2));            // Set random magnitude for boid's velocity
        this.velocity.setDirection(randomNum(0, 6));            // Set random direction for boid's velocity

        // Parent class member modifications
        this.img = new Image();                                 // Create a new image for the boids
        this.img.src = "images/Polluted_Fish.png";              // TEMPORARY: set source of the sprite image

        this.scaleHeightWidth();                                // Set height and width to scaled factor of image

        /* 
        To Do: 
            Add more graphical elements such as more sliders for different properties
                visual radius, maxVelocity (maximum speed), maxAcceleration (maximum Force), scaling factor
                change number of sprites being drawn?
            Add more versions of these images to simulate changing directions 
                Maybe find an actual sprite set that I can use
            Clean up code organization and optimize what I can
        */
    }

    /**************************************************************
     * Allows the boids to be drawn onto the canvas at a specified
       velocity and acceleration
    **************************************************************/
    draw() {
        // Check if this is the first loop
        if(this.bk_img != null) {
            this.put_bk_img(this.position.x, this.position.y); // Replace previous image's background
        }

        this.alignment(); // Steer current boid towards average velocity of boids in visual radius

        this.cohesion(); // Steer current boid towards average position of boids in visual radius
            
        this.separation(); // Steer current boid away from boids in visual radius

        this.update(); // Set the next movement of the boids

        this.getBufferImage(); // Get background image data from the buffer canvas

        this.drawFrame(this.position.x, this.position.y, this.w_h[0], this.w_h[1]); // Draw the current frame
    }

    /************************************************************
     * Adds to the position and velocity vectors of the boids to 
       simulate their changing movements
    ************************************************************/
    update() {
        var change = false;                             // Create a flag for velocity change

        this.position.add(this.velocity);               // Add velocity to position
        this.velocity.add(this.acceleration);           // Add acceleration to velocity
        this.velocity.limitVector(this.maxVelocity);    // Limit velocity to the maximum speed
        this.acceleration.multiply(0);                  // Reset acceleration to zero vector
        change = this.checkBoundary();                  // Check if the boid is in bounds of the canvas
        
        if(change) // Velocity change
            this.position.add(this.velocity);           // Add new velocity to position
    }

    /********************************************************
     * Checks the visual radius around the current boid to 
       determine the average velocity of the boids around it
     * Updates the current acceleration with that average
    ********************************************************/
    alignment() {
        var steering = new Vector_2D();     // Average velocities of boids in radius (zero vector default)
        var total = 0;                      // Total number of boids in radius
        var distance = 0;                   // Distance of other boids from current boid

        for(var i = 0; i < this.worldview.length; i++) {  // Iterate through the flock
            distance = this.getDistance(i);    // Get the distance between the boids

            if(this.worldview[i] != this && distance < this.vis_rad) {     // Check if boid is in visual radius
                steering.add(this.worldview[i].velocity);     // Update the steering velocity

                total++; // Update the total
            }
        }

        if(total > 0) { // Check if there were any boids in the radius
            steering.divide(total); // Divide by the total

            steering.setMagnitude(this.maxVelocity); // Set the magnitude to maximum speed

            steering.sub(this.velocity); // Subtract the current velocity
        
            steering.limitVector(this.maxAcceleration); // Limit the steering vector to maximum Acceleration
        }

        steering.multiply(this.properties[0]);

        this.acceleration.add(steering); // Update the acceleration
    }

    /*********************************************************
     * Checks the visual radius around the current boid to 
       determine the average position of the boids around it
     * Updates the current acceleration with that average
    *********************************************************/
    cohesion() {
        var steering = new Vector_2D();     // Average velocities of boids in radius (zero vector default)
        var total = 0;                      // Total number of boids in radius
        var distance = 0;                   // Distance of other boids from current boid

        for(var i = 0; i < this.worldview.length; i++) {  // Iterate through the flock
            distance = this.getDistance(i);    // Get the distance between the boids

            // Check if boid is in visual radius (not current boid and distance not zero)
            if(this.worldview[i] != this && distance < this.vis_rad) { 
                steering.add(this.worldview[i].position);     // Update the steering position

                total++; // Update the total
            }
        }

        if(total > 0) { // Check if there were any boids in the radius
            steering.divide(total); // Divide by the total

            steering.sub(this.position); // Subtract the current position

            steering.setMagnitude(this.maxVelocity); // Set the magnitude to maximum speed

            steering.sub(this.velocity); // Subtract the current velocity
        
            steering.limitVector(this.maxAcceleration); // Limit the steering vector to maximum Acceleration
        }

        steering.multiply(this.properties[1]);

        this.acceleration.add(steering); // Update the acceleration
    }

    /******************************************************
     * Checks the visual radius around the current boid to 
       determine how many boids it now needs to avoid
    ******************************************************/
    separation() {
        var steering = new Vector_2D();     // Average velocities of boids in radius (zero vector default)
        var difference;                     // Container for the difference between positions of boids
        var total = 0;                      // Total number of boids in radius
        var distance = 0;                   // Distance of other boids from current boid

        for(var i = 0; i < this.worldview.length; i++) {  // Iterate through the flock
            distance = this.getDistance(i);    // Get the distance between the boids

            if(this.worldview[i] != this && distance < this.vis_rad) {     // Check if boid is in visual radius
                difference = this.diffVectors(this.position, this.worldview[i].position); // Get the difference in position

                difference.divide(distance); // Set difference to be inversely proportional to distance

                steering.add(difference); // Update the steering vector

                total++; // Update the total
            }
        }

        if(total > 0) { // Check if there were any boids in the radius
            steering.divide(total); // Divide by the total

            steering.setMagnitude(this.maxVelocity); // Set the magnitude to maximum speed

            steering.sub(this.velocity); // Subtract the current velocity
        
            steering.limitVector(this.maxAcceleration); // Limit the steering vector to maximum Acceleration
        }

        steering.multiply(this.properties[2]);

        this.acceleration.add(steering); // Update the acceleration
    }

    /******************************************************************************
     * Checks for boids moving off of the screen and updates velocity if necessary
    ******************************************************************************/
    checkBoundary() {
        var onXEdge = false, onYEdge = false; // Create flags for out of boundary

        // Check if the boid is at a boundary and set the appropriate flag
        if(this.position.x + this.w_h[0] > window.innerWidth * 0.97) {   // Boid moving too far right
            onXEdge = true;
        }
        else if(this.position.x < 0) {   // Boid moving too far left
            onXEdge = true;
        }
        if(this.position.y + this.w_h[1] > window.innerHeight * 0.97) {  // Boid moving too far down
            onYEdge = true;
        }
        else if(this.position.y < 0) {   // Boid moving too far up
            onYEdge = true;
        }

        // Check if either flag was set and inverse the velocity component
        if(onXEdge)
            this.velocity.x *= -1;
        if(onYEdge)
            this.velocity.y *= -1;

        if(onXEdge || onYEdge) // Return true if either flag was set
            return true;
        
        return false; // No change was made
    }

    /************************************************************
     * Stores the background image data from the buffer context
       of each boid to avoid the seaweed effect
    ************************************************************/
       getBufferImage() {
        this.bk_img = this.buffer.getImageData(this.position.x, this.position.y, this.w_h[0] + 3, this.w_h[1] + 3);
    }

    /*********************************************
     * Calculates the distance between two boids
    *********************************************/
    getDistance(idx) {
        var dx = this.worldview[idx].position.x - this.position.x;  // Calculate delta x
        var dy = this.worldview[idx].position.y - this.position.y;  // Calculate delta y
      
        return Math.sqrt((dx*dx) + (dy*dy)); // Get the distance -> sqrt(dx^2 + dy^2)
    }

    /**************************************************************
     * Sets the height and width to the size of the sprite image
       multiplied by some scaling factor
    **************************************************************/
       scaleHeightWidth() {
        this.w_h[0] = this.img.width * this.scale;
        this.w_h[1] = this.img.height * this.scale;
    }

    /****************************************************************
     * Returns the difference between two vectors as a single vector
    ****************************************************************/
    diffVectors(vector1, vector2) {
        var newVector = new Vector_2D();    // Create a new vector to store the difference
        newVector.setVector(vector1);       // Set that vector to first vector's values
        newVector.sub(vector2);             // Get the difference
        return newVector;                   // Return the difference
    }
} 

/*******************************************************
 * Flock class for the sprites
 * It will access the Boid class properties for
    * canvas context
 * Class adds:
    * An array of boids to create the animations
    * A variable for the flock size
    * An array of integers to store input element values
        * Alignment, Cohesion, and Separation 
 *******************************************************/
class Flock extends Boid {
    constructor(context) {
        super(context);
        this.flock = [];                // Container for flock of boids
        this.flock_size = 200;          // Controls the amount of boids created
        this.inputs = [0, 0, 0];        // Container for input element values
    }

    /************************************************************
     * Starts the animation process for each boid in the flock
    ************************************************************/
    drawFlock() {
        for(var i = 0; i < this.flock.length; i++) { // Iterate through the flock
            this.flock[i].draw();  // Draw each boid
        }
    }

    /********************************************************
     * Fills the flock array with boid sprites for animating
       in the draw loop
    ********************************************************/
    createFlock() {
        for(var i = 0; i < this.flock_size; i++) {     // Loop for as many boids as desired
            this.flock.push(new Boid(this.ctx));    // Fill the flock array
        }

        this.fillReferenceArrays();                    // Fill each boids worldview array
    }

    /************************************************************
     * Fills the boids worldview array and properties array with 
       shallow references to the corresponding flock properties
    ************************************************************/
    fillReferenceArrays() {
        for(var i = 0; i < this.flock_size; i++) {
            this.flock[i].worldview = this.flock;       // Each boid has a shallow reference to flock
            this.flock[i].properties = this.inputs;    // Each boid also has shallow reference to sliders
        }
    }

    /*********************************************
     * Updates the value of the alginment slider
    *********************************************/
    getAlignment(alignment) {
        this.inputs[0] = alignment.value;
    }

    /*********************************************
     * Updates the value of the cohesion slider
    *********************************************/
    getCohesion(cohesion) {
        this.inputs[1] = cohesion.value;
    }

    /*********************************************
     * Updates the value of the separation slider
    *********************************************/
    getSeparation(separation) {
        this.inputs[2] = separation.value;
    }
}
