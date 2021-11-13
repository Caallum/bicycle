import BicycleError from "../Bicycle.Error.js";
import BaseEvent from "../structures/BaseEvent.js";
import Bicycle from "../Bicycle.js";
import { ClientVoiceManager } from "discord.js";

export default class MessageCreateEvent extends BaseEvent {
    constructor() {
        super("messageCreate");
    }

    async run(client, message) {
        if(message.author.bot) return;         
       
        client.modmail.handleMessage(message);

    }
}