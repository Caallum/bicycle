import BicycleError from "../Bicycle.Error.js";
import BaseEvent from "../structures/BaseEvent.js";
import Bicycle from "../Bicycle.js";
import { ClientVoiceManager } from "discord.js";
import config from "../config.js";
import sendEmbed from "../functions/sendEmbed.js";

export default class MessageCreateEvent extends BaseEvent {
    constructor() {
        super("messageCreate");
    }

    async run(client, message) {
        if(message.author.bot) return;         
        client.modmail.handleMessage(message);

        if(message.channel.type != "GUILD_TEXT") return;
        if(!message.content.startsWith(config.prefix)) return;
        
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const cmdName = args.shift().toLowerCase();
        const command = client.commands.get(cmdName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

        if(!command) return;

        if(command.testing && !message.member.roles.cache.has(config.developerID)) return sendEmbed(message.channel, "Command Error", "This command is currently in the testing phrase!")

        command.run(client, message, args);
    }
}