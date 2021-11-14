import BicycleError from "../../Bicycle.Error.js";
import sendEmbedToUser from "../../functions/sendEmbedToUser.js";
import BaseCommand from "../../structures/BaseCommand.js";
import config from "../../config.js";

export default class CloseCommand extends BaseCommand {
    constructor() {
        super(
            'close',
            'Close a modmail ticket',
            ['cl'],
            'Modmail',
            true
        )
    }

    async run(client, message, args) {
        if(!message.member.roles.cache.has(config.modmail.staffID)) return sendEmbed(message.channel, "Permission Error", "You do not have permission to do that!");
        if(message.channel.parentId != config.modmail.categoryID) return sendEembed(message.channel, "Permission Error", "You cannot do that command here!");

        const information = await client.db.get(`modmail.channel-${message.channel.id}`);
        if(!information) return 

        const user = await client.users.fetch(information.id);
        if(!user) return client.modmail.closeTicket(message, 'No user found!');
        
        return client.modmail.closeTicket(message, `Closed by ${message.author.tag}`);
    }
}