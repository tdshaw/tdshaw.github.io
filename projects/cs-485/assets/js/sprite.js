/********************* GLOBAL FUNCTIONS *****************************************/

/**************************************************************
 * Generates a random number between a min and max (exclusive)
**************************************************************/
function randomNum(min, max) {
    return Math.random() * (max - min) + min; // Return a random number
}

/********************* CLASS DEFINITIONS *****************************************/

/******************************************************
 * Parent class for penguin sprites
 * This class contains:
    * x,y positions on canvas
    * Height and width of sprite
    * A container for the animation frames
    * A container for the animation image
    * A counter for current animation frame
    * A container for background canvas image
    * A container for the context of the canvas
    * A tracker for the previous animation time
    * A container for the worldview for each sprite
    * A container for the number of frames per animation
 *******************************************************/
class Sprite {
    constructor(context) {
        this.frames = [];                       // Container for JSON data
        this.img = null;                        // Container for the animation frames
        this.cur_frame = -1;                    // Counter for current animation frame
        this.bk_img = null;                     // Container for background canvas
        this.context = context;                 // Container for the context of the canvas
        this.prev_time = new Date().getTime();  // Tracks the last animation frame time
        this.worldview = [];                    // Container for all other sprites on canvas
        this.num_frames = 0;                    // Container for the number of frames in an animation
    }

    /*******************************************************************
     Returns the background image data for clearing the previous image
    *******************************************************************/
    get_bk_img(x, y, w, h) {
        this.bk_img = this.context.getImageData(x, y, w, h);
    }

    /******************************************************************************
     Places the background image data onto the canvas to clear the previous image
    ******************************************************************************/
    put_bk_img(x, y) {
        this.context.putImageData(this.bk_img, x, y);
    }

    /*******************************************************
     Draws the current image for the sprite onto the canvas
    *******************************************************/
    drawFrame(x, y, w, h) {
        this.context.drawImage(this.img, x, y, w, h);
    }
}

/*******************************************************
 * NPCPenguin class for the sprites
 * It will access the Sprite class properties for
    * Canvas context
 * Class adds:
    * The buffer canvas and context for the sprite
    * The name of the penguin sprite
    * The x,y,w,h for the sprite image
    * The idle animation time
    * The walking animation time
    * The time alloted for random animation changes
    * The amount of time spent in current animation
    * The time delta for the animation speeds (t_delta)
        * Adds deltas for different states  
    * The state of the penguin's animation
    * The flag for state changes
    * The movement distance for walking animations
 *******************************************************/
class NPCPenguin extends Sprite {
    constructor(context) {
        super(context);
        this.canvas = document.createElement('canvas');     // Each penguin gets its own buffer canvas
        this.buffer = this.canvas.getContext('2d', 
            { willReadFrequently: true });                  // Each penguin gets its own context to draw with
        this.name = "Buddy";                                // Name of the penguin
        this.x = randomNum(window.innerWidth*0.1, 
        window.innerWidth*0.8);                             // x coordinate of penguin
        this.y = randomNum(window.innerHeight/2, 
        window.innerHeight*0.8);                            // y coordinate of penguin
        this.h = 0;                                         // height of penguin
        this.w = 0;                                         // width of penguin
        this.idle_time = 75;                                // Time delta for idling
        this.walk_time = 150;                               // Time delta for walking
        this.change_time = Math.floor(randomNum(40, 110));  // Random amount of time before animation changes
        this.cur_time = 0;                                  // Amount of time animation has been running
        this.t_delta = this.idle_time;                      // Overall time delta for animation speeds (default is idling)
        this.state = "idle";                                // Default animation for NPC penguin
        this.state_change = "none";                         // Flag for state changes
        this.move_dist = 20;                                // Distance NPC will move in animations
        this.img = new Image();                             // Animation image for the Penguin
    }

    /**********************************************************
     Determines animation frames for penguin sprite and draws
     the frames on each loop for a specified time delta
    **********************************************************/
    draw() {
        if((this.t_delta + this.prev_time) > new Date().getTime()) // Check if animation is going slower than frames
            return;

        this.prev_time = new Date().getTime();	// Get next animation time limit

        // Check if this is the first loop
        if(this.bk_img != null) {
            this.put_bk_img(this.x, this.y); // Replace previous image's background
            this.cur_time++; // Update current amount of time in animation
        }

        this.animate(); // Animate the current frame
    }

    /**************************************
     Checks the sprite's current state
     Calls appropriate animation function 
    **************************************/
    animate() {
        this.update_frame(); // Update animation data (counter, img.src, h, w)

        this.getBufferImage(); // Get image data from buffer canvas

        // Check if sprite is currently moving
        if(this.state != "idle") {
            this.checkBoundary(); // Stop sprite from moving off the screen

            if(this.state != "idleLayDown")
                this.checkCollision(); // Stop sprite from hitting other sprites
        }

        this.updateFrameData(); // Update animation frame data

        this.drawFrame(this.x, this.y, this.w, this.h); // Draw the image
    }

    /******************************************************************
     Checks sprite's current state and updates number of frames and
     the time delta for the animation
    ******************************************************************/
    updateFrameData() {
        switch(this.state) {
            case "idle": 
                this.num_frames = 11; 
                this.t_delta = this.idle_time;
                break;
            case "idleLayDown": 
                this.num_frames = 31; 
                this.t_delta = this.idle_time;
                break;
            default: 
                this.num_frames = 3; 
                this.t_delta = this.walk_time;
                break;
        }

        // Check if counter is out of range
        if(this.cur_frame == this.num_frames) {
            this.cur_frame = -1;   // Reset counter
        }
    }

    /******************************************************************
     Checks sprites movement animation and updates the x,y coordinates
     If sprite is idling there will be no change
    ******************************************************************/
    update_position() {
        switch(this.state) {
            case "walk_N":                  // North
                this.y -= this.move_dist;
                break;
            case "walk_W":                  // West
                this.x -= this.move_dist;
                break;
            case "walk_S":                  // South
                this.y += this.move_dist;
                break;    
            case "walk_E":                  // East
                this.x += this.move_dist;  
                break;   
            case "walk_NW":                 // North West
                this.x -= this.move_dist;
                this.y -= this.move_dist;
                break;
            case "walk_NE":                 // North East
                this.x += this.move_dist;
                this.y -= this.move_dist;
                break;
            case "walk_SW":                 // South West
                this.x -= this.move_dist;
                this.y += this.move_dist;
                break;
            case "walk_SE":                 // South East
                this.x += this.move_dist;
                this.y += this.move_dist;
                break;
            default: break;                 // Idling (no movement)
        }
    }

    /*************************************************************
     Updates the current image being drawn on the canvas
     Also changes the height and width for the current frame
    *************************************************************/
    update_frame() {
        this.cur_frame++; // Update animation frame counter

        // Get frame index as string using the frame counter
        var frame_idx = String(this.cur_frame);

        // Set the image source at current frame
        this.img.src = "images/penguin/" + this.name + '/' + this.state + '/' + frame_idx + ".png"; 

        // Update the height and width of sprite using JSON data
        this.h = this.frames[this.name][this.state][frame_idx]["h"];
        this.w = this.frames[this.name][this.state][frame_idx]["w"];

        if(this.cur_time > this.change_time) // Check if time for animation change
            this.getRandomAnimation(); // Get a new animation for the sprite

        // Check if there has been a state change
        if(this.state_change != "none") {
            this.cur_frame = -1;            // Reset the frame counter
            this.state = this.state_change; // Set the new state
            this.state_change = "none";     // Reset the state change
        }
        else
            this.update_position(); // Update x,y coordinates based on current state
    }

    /********************************************************************
     Checks if the sprite is going to move off of the edge of the screen
    ********************************************************************/
     checkBoundary() {
        var change = false;

        // Check if at TOP or BOTTOM of the screen
        if(this.y - this.h/7 < window.innerHeight/3) { // Walking towards TOP of screen and hitting it
            if(this.state == "walk_NW" || this.state == "walk_N" || this.state == "walk_NE")
                change = true;
        }
        else if(this.y + 1.3*this.h > window.innerHeight) { // Walking towards BOTTOM of screen and hitting it
            if(this.state == "walk_SW" || this.state == "walk_S" || this.state == "walk_SE")
                change = true;
        }
        
        // Check if at LEFT or RIGHT of the screen
        if(this.x - this.w/6.5 < 0) { // Walking towards the LEFT of the screen and hitting it
            if(this.state == "walk_W" || this.state == "walk_NW" || this.state == "walk_SW")
                change = true;   
        }
        else if(this.x + 1.75*this.w > window.innerWidth) { // Walking towards the RIGHT of the screen and hitting it
            if(this.state == "walk_E" || this.state == "walk_NE" || this.state == "walk_SE")
                change = true;
        }

        if(change)  {        // Check if flag was set
            this.state_change = "idle"; // Reset flag
            this.getRandomAnimation();  // Get a random animation (except for idling)
        }
    }

    /********************************************************************
     Checks if the sprite is going to hit another sprite on the canvas
    ********************************************************************/
    checkCollision() {
        var change = false; // Set flags for x and y collisions

        // Check if any point on the sprite's outer edge facing the other sprite is colliding
        if(this.y + this.h >= this.worldview[0].y && this.y <= this.worldview[0].y + this.worldview[0].h)
            if(this.x + this.w >= this.worldview[0].x && this.x <= this.worldview[0].x + this.worldview[0].w)
                change = true;

        // If there was a collision, set the sprite to desired animation
        if(change) {
            this.state_change = "idleLayDown";
            alert("Man i'm dead.");
        }
    }

    /*********************************************************************
     Set a random animation for the NPC sprite to simulate random pathing
    *********************************************************************/
    getRandomAnimation() {
        this.change_time = Math.floor(randomNum(40,110));   // Reset random animation time
        this.cur_time = 0;                                  // Reset the current time
        var state_num;                                      // Stores the random change number

        // Check if at a boundary
        if(this.state_change == "none")
            state_num = Math.floor(randomNum(-1, 9)); // Get any random animation
        else
            state_num = Math.floor(randomNum(0, 9)); // Get any random animation except for idle


        // Each animation corresponds to #0-8
        switch(state_num) {
            case 0: this.state_change = "idle"; break;
            case 1: this.state_change = "walk_N"; break;
            case 2: this.state_change = "walk_W"; break;
            case 3: this.state_change = "walk_S"; break;
            case 4: this.state_change = "walk_E"; break;
            case 5: this.state_change = "walk_NW"; break;
            case 6: this.state_change = "walk_NE"; break;
            case 7: this.state_change = "walk_SW"; break;
            case 8: this.state_change = "walk_SE"; break;
            default: break;
        }
    }

    /************************************************************
     * Stores the background image data from the buffer context
       of each penguin to avoid the seaweed effect
    ************************************************************/
       getBufferImage() {
        this.bk_img = this.buffer.getImageData(this.x, this.y, this.w + 3, this.h + 3);
    }
}

/************************************************************************
 * Player class for the sprites
 * It will access the Sprite class properties for
    * Canvas context
 * Class adds:
    * The current state of the sprite
    * A flag for when the state of the sprite is changed
    * The distance sprite will move in a given direction
        * N, W, S, E, NW, NE, SW, SE
        * Adds walking distance and other distances can be added here
 ************************************************************************/
class Player extends Sprite {
    constructor(context) {
        super(context);
        this.state = "idle";                // Current state of Sprite (default is idling)
        this.state_change = "none";         // Container for state change (default is none)
        this.walk_dist = 20;                // Walking distance
        this.move_dist = this.walk_dist;    // Movement distance (default walking distance)

        // Event listeners for animation movements
        document.addEventListener("keydown", this.moveSprite.bind(this));   // User presses key
        document.addEventListener("click", this.moveSprite.bind(this));     // User clicks mouse
    }

    /*************************************************************
     Checks when user presses down a key to change animations
     It also checks for mouse clicks
    *************************************************************/
     moveSprite(key) {
                                                        // ARROW KEYS OR SPACEBAR
        if(key.type == "keydown") {
            switch(key.keyCode) {
                case 32:                                // Spacebar -> stop
                    this.state_change = "idle";         // Stop the sprite and return to idling
                    break;
                case 37:                                // Left -> Walk_W
                    this.state_change = "walk_W";
                    break;
                case 38:                                // Up -> Walk_N
                    this.state_change = "walk_N";
                    break;
                case 39:                                // Right -> Walk_E
                    this.state_change = "walk_E";
                    break;
                case 40:                                // Down -> Walk_S
                    this.state_change = "walk_S";
                    break;
                default: return;
            }
            key.preventDefault();                       //Prevents default arrow keypress behavior
        }                                               
        else if(key.type == "click") {                  // MOUSE CLICK
            if(key.clientX < this.x) {                  // LEFT SECTION
                if(key.clientY < this.y)                // Click is in top left of screen
                    this.state_change = "walk_NW";
                else if(key.clientY > this.y + this.h)  // Click is in bottom left of screen
                    this.state_change = "walk_SW";
                else
                    this.state_change = "walk_W";       // Click is to left of the screen
            }
            else if(key.clientX > this.x + this.w) {    // RIGHT SECTION
                if(key.clientY < this.y)                // Click is to top right of screen
                    this.state_change = "walk_NE";
                else if(key.clientY > this.y + this.h)  // Click is to bottom right of screen
                    this.state_change = "walk_SE";
                else   
                    this.state_change = "walk_E";       // Click is to right of screen
            }
            else {                                      // MIDDLE SECTION
                if(key.clientY < this.y)                // Click is to top of screen
                    this.state_change = "walk_N";
                else if(key.clientY > this.y + this.h)  // Click is to bottom of screen
                    this.state_change = "walk_S"
                else {
                    this.state_change = "idle";         // User clicked the sprite (stops it moving)
                }
            }
        }
        this.move_dist = this.walk_dist;                // Set walking distance
    }
}

/**************************************************
 * UserPenguin class for the sprites
 * It will access the Player class properties for
    * Canvas context
 * Class adds:
    * The buffer canvas and context for the sprite
    * The x,y,w,h for the sprite image
    * The idle animation time
    * The walking animation time
    * The time delta for the animation speeds (t_delta)
        * Adds deltas for different states  
 *************************************************/
class UserPenguin extends Player {
    constructor(context) {
        super(context);
        this.canvas = document.createElement('canvas');     // Each penguin gets its own buffer canvas
        this.buffer = this.canvas.getContext('2d', 
            { willReadFrequently: true });                  // Each penguin gets its own context to draw with
            this.name = "Buddy";                                // Name of the penguin
        this.x = 0;                                         // x coordinate of penguin
        this.y = 0;                                         // y coordinate of penguin
        this.h = 0;                                         // height of penguin
        this.w = 0;                                         // width of penguin
        this.idle_time = 75;                                // Time delta for idling
        this.walk_time = 150;                               // Time delta for walking
        this.t_delta = this.idle_time;                      // Overall time delta for animation speeds (default is idling)
        this.img = new Image();                             // Animation image for the Penguin
    }

    /**********************************************************
     Determines animation frames for penguin sprite and draws
     the frames on each loop for a specified time delta
    **********************************************************/
    draw() {
        if((this.t_delta + this.prev_time) > new Date().getTime()) // Check if animation is going slower than frames
            return;

        this.prev_time = new Date().getTime();	// Get next animation time limit

        // Check if this is the first loop
        if(this.bk_img != null) {
            this.put_bk_img(this.x, this.y); // Replace previous image's background
        }

        this.animate(); // Animate the current frame
    }

    /**************************************
     Checks the sprite's current state
     Calls appropriate animation function 
    **************************************/
    animate() {
        this.update_frame(); // Update animation data (counter, img.src, h, w)

        this.getBufferImage(); // Get image data from buffer canvas

        // Check if sprite is currently moving
        if(this.state != "idle") {
            this.checkBoundary(); // Stop sprite from moving off the screen

            if(this.worldview[0].state != "idleLayDown")
                this.checkCollision(); // Stop sprite from colliding with other sprites
        }

        this.updateFrameData(); // Update animation frame data

        this.drawFrame(this.x, this.y, this.w, this.h); // Draw the image
    }

    /******************************************************************
     Checks sprite's current state and updates number of frames and
     the time delta for the animation
    ******************************************************************/
     updateFrameData() {
        switch(this.state) {
            case "idle": 
                this.num_frames = 11; 
                this.t_delta = this.idle_time;
                break;
            default: 
                this.num_frames = 3; 
                this.t_delta = this.walk_time;
                break;
        }

        // Check if counter is out of range
        if(this.cur_frame == this.num_frames) {
            this.cur_frame = -1;   // Reset counter
        }
    }

    /******************************************************************
     Checks sprites movement animation and updates the x,y coordinates
     If sprite is idling there will be no change
    ******************************************************************/
    update_position() {
        switch(this.state) {
            case "walk_N":                  // North
                this.y -= this.move_dist;
                break;
            case "walk_W":                  // West
                this.x -= this.move_dist;
                break;
            case "walk_S":                  // South
                this.y += this.move_dist;
                break;    
            case "walk_E":                  // East
                this.x += this.move_dist;  
                break;   
            case "walk_NW":                 // North West
                this.x -= this.move_dist;
                this.y -= this.move_dist;
                break;
            case "walk_NE":                 // North East
                this.x += this.move_dist;
                this.y -= this.move_dist;
                break;
            case "walk_SW":                 // South West
                this.x -= this.move_dist;
                this.y += this.move_dist;
                break;
            case "walk_SE":                 // South East
                this.x += this.move_dist;
                this.y += this.move_dist;
                break;
            default: break;                 // Idling (no movement)
        }
    }

    /*************************************************************
     Updates the current image being drawn on the canvas
     Also changes the height and width for the current frame
    *************************************************************/
    update_frame() {
        this.cur_frame++; // Update animation frame counter

        // Get frame index as string using the frame counter
        var frame_idx = String(this.cur_frame);

        // Set the image source at current frame
        this.img.src = "images/penguin/" + this.name + '/' + this.state + '/' + frame_idx + ".png"; 

        // Update the height and width of sprite using JSON data
        this.h = this.frames[this.name][this.state][frame_idx]["h"];
        this.w = this.frames[this.name][this.state][frame_idx]["w"];

        // Check if first loop and set x,y position to center of screen
        if(this.bk_img == null) {
            this.x = window.innerWidth/2 - this.w/2;
            this.y = window.innerHeight/2 - this.h/2;
        }

        // Check if there has been a state change
        if(this.state_change != "none") {
            this.cur_frame = -1;            // Reset the frame counter
            this.state = this.state_change; // Set the new state
            this.state_change = "none";     // Reset the state change
        }
        else
            this.update_position(); // Update x,y coordinates based on current state
    }

    /********************************************************************
     Checks if the sprite is going to move off of the edge of the screen
    ********************************************************************/
     checkBoundary() {
        var change = false;

        // Check if at TOP or BOTTOM of the screen
        if(this.y - this.h/7 < window.innerHeight/3) { // Walking towards TOP of screen and hitting it
            if(this.state == "walk_NW" || this.state == "walk_N" || this.state == "walk_NE")
                change = true;
        }
        else if(this.y + 1.3*this.h > window.innerHeight) { // Walking towards BOTTOM of screen and hitting it
            if(this.state == "walk_SW" || this.state == "walk_S" || this.state == "walk_SE")
                change = true;
        }
        
        // Check if at LEFT or RIGHT of the screen
        if(this.x - this.w/6.5 < 0) { // Walking towards the LEFT of the screen and hitting it
            if(this.state == "walk_W" || this.state == "walk_NW" || this.state == "walk_SW")
                change = true;   
        }
        else if(this.x + 1.75*this.w > window.innerWidth) { // Walking towards the RIGHT of the screen and hitting it
            if(this.state == "walk_E" || this.state == "walk_NE" || this.state == "walk_SE")
                change = true;
        }

        if(change)  {        // Check if flag was set
            this.state_change = "idle";  // Reset flag
        }
    }

    /********************************************************************
     Checks if the sprite is going to hit another sprite on the canvas
    ********************************************************************/
     checkCollision() {
        var change = false; // Set flags for x and y collisions

        // Check if any point on the sprite's outer edge facing the other sprite is colliding
        if(this.y + this.h >= this.worldview[0].y && this.y <= this.worldview[0].y + this.worldview[0].h)
            if(this.x + this.w >= this.worldview[0].x && this.x <= this.worldview[0].x + this.worldview[0].w)
                change = true;

        // If there was a collision, set the sprite to desired animation
        if(change) {
            this.state_change = "idle";
        }
    }

    /************************************************************
     * Stores the background image data from the buffer context
       of each penguin to avoid the seaweed effect
    ************************************************************/
       getBufferImage() {
        this.bk_img = this.buffer.getImageData(this.x, this.y, this.w + 3, this.h + 3);
    }
}