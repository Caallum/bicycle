import BicycleError from "../Bicycle.Error.js";
import BaseEvent from "../structures/BaseEvent.js";

export default class MessageCreateEvent extends BaseEvent {
    constructor() {
        super("messageCreate");
    }

    async run(client, message) {
        if(message.author.bot) return;         
       
        if(message.channel.type == "DM") {
            return message.channel.send({ content: "Modmail coming soon..." })
        }

    }
}