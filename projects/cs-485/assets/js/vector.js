/******************************************************
 * Vector class to be used for the Boids in sprite.js
 * This class contains:
    * The x component of the vector
    * The y component of the vector
******************************************************/
class Vector_2D {    // Exporting this class for use in sprite.js
    constructor(x = 0, y = 0) { // Zero vector if no values specified
        this.x = x;     // X component
        this.y = y;     // Y component
    }

    /*************************************************
     * Limits a vector's force to a specified maximum 
    *************************************************/
     limitVector(max) {
        var newVector = new Vector_2D();        // Create a container for new vector components
        var magnitude = this.getMagnitude();    // Get the current magnitude
        var min;                                // Container for the minimum between magnitude and maximum

        if(magnitude != 0) {                    // Check if vector is zero vector (can return NaN)
            min = Math.min(magnitude, max);     // Get the minimum between magnitude and maximum

            newVector = this.getUnitVector();   // Get the unit vector
            
            newVector.multiply(min);            // Multiply by the minimum
        }
        else 
            newVector.setComponents(0, 0);      // Set the new vector components to 0
        
        this.setVector(newVector);              // Give new vector components
    }

    /************************************************
     * Returns the unit vector of the current vector
    ************************************************/
    getUnitVector() {
        var unit = new Vector_2D();             // Create a container for the unit vector
        unit.setVector(this);                   // Set the unit vector to the current vector
        var magnitude = this.getMagnitude();    // Get the current magnitude
        unit.divide(magnitude);                 // Calculate the unit vector
        return unit;                            // Return the unit vector
    }

    /**********************************************************
     * Returns the angle of direction of the vector in radians
    **********************************************************/
    getDirection() {
        return Math.atan2(this.x, this.y); // Get the angle of the vector in radians
    }

    /**************************************
     * Returns the magnitude of the vector
    **************************************/
     getMagnitude() {
        return Math.sqrt(this.x*this.x + this.y*this.y); // Calculate current magnitude
    }

    /**************************************************************
     * Sets the direction of the vector based on current magnitude
    **************************************************************/
    setDirection(angle) {
        var magnitude = this.getMagnitude(); // Get the current magnitude of the boid

        // Update the boid's velocity vector to point in new direction
        this.x = Math.cos(angle) * magnitude;
        this.y = Math.sin(angle) * magnitude;
    }

    /**************************************************************
     * Sets the magnitude of the vector based on current direction
    **************************************************************/
    setMagnitude(magnitude) {
        var unit_vector = this.getUnitVector(); // Get the unit vector
        unit_vector.multiply(magnitude);        // Get the new vector components
        this.setVector(unit_vector);            // Set the new vector components
    }

    /****************************************************
     * Adds vector2's components to vector1's components
    ****************************************************/
    add(vector) {
        this.x += vector.x; // Update component 1
        this.y += vector.y; // Update component 2
    }

    /*********************************************************
     * Subtracts vector2's components to vector1's components
    *********************************************************/
     sub(vector) {
        this.x -= vector.x; // Update component 1
        this.y -= vector.y; // Update component 2
    }

    /*********************************************
     * Divides a number from vector1's components
    *********************************************/
     divide(num) {
        this.x /= num;  // Update component 1
        this.y /= num;  // Update component 2
    }

    /**********************************************
     * Multiplies vector1's components by a number
    **********************************************/
     multiply(num) {
        this.x *= num;  // Update component 1
        this.y *= num;  // Update component 2
    }

    /************************************************
     * Set a vector's components to a new components
    ************************************************/
    setComponents(x, y) {
        this.x = x; // Set x component
        this.y = y; // Set y component
    }

    /*********************************************************
     * Set a vector's components to a new vector's components
    *********************************************************/
    setVector(vector) {
        this.x = vector.x; // Set the x component
        this.y = vector.y; // Set the y component
    }
}