import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";

export default class PingCommand extends BaseCommand {
    constructor() {
        super(
            'ping',
            'Shows the ping of the bot',
            ['pg'],
            'utils',
            true
        )
    }

    async run(client, message, args) {
        message.reply(`Pong! \`${client.ws.ping} MS\``)
    }
}