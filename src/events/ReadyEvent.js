import BicycleError from "../Bicycle.Error.js";
import BaseEvent from "../structures/BaseEvent.js";

export default class ReadyEvent extends BaseEvent {
    constructor() {
        super('ready');
    }

    async run(client) {
        console.log(`${client.user.tag} is ONLINE`);
        client.user.setActivity(`for Bread!`, { type: 'WATCHING' });
    }
}