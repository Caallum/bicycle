import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";
import config from '../../config.js';
import sendEmbed from "../../functions/sendEmbed.js";
import sendEmbedToUser from "../../functions/sendEmbedToUser.js";

export default class ClaimCommand extends BaseCommand {
    constructor() {
        super(
            'claim',
            'Claim a modmail ticket',
            ['clm'],
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

        if(information.claimed != 'x') return sendEmbed(message.channel, "Claimed Ticket", "This ticket has already been claimed by " +  information.claimed.tag);

        let newInformation = {
            id: information.id,
            reason: information.reason,
            claimed: {
                id: message.author.id,
                tag: message.author.tag
            },
            date: information.date
        };

        await client.db.set(`modmail.channel-${message.channel.id}`, newInformation);
        sendEmbedToUser(user, "Support Team", "Your ticket is now conncted to a support team member!")
        return sendEmbed(message.channel, "Claimed Ticket", "Successfully claimed this ticket!")
    } 
}