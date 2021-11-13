export default class BicycleError { 
    constructor(message, location, exit = false) {
        this.message = message;
        this.location = location;

        console.log(`[BicycleError] ${this.message}: ${this.location}`);

        if(exit) {
            process.exit();
        }
    }
}