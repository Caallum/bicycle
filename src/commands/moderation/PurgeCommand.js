import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";
import config from "../../config.js";

export default class Command extends BaseCommand {
    constructor() {
        super(
            'purge',
            'Delete a specified amount of messages',
            ['clear', 'delete', 'p'],
            'Moderation',
            true
        )
    }

    async run(client, message, args) {
        
    }
}