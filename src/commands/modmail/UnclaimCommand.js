import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";
import config from '../../config.js';
import sendEmbed from "../../functions/sendEmbed.js";
import sendEmbedToUser from "../../functions/sendEmbedToUser.js";

export default class ClaimCommand extends BaseCommand {
    constructor() {
        super(
            'unclaim',
            'Unclaim a modmail ticket',
            ['uclm', 'ucl'],
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

        if(information.claimed == 'x') return sendEmbed(message.channel, "Unclaimed Ticket", `This ticket has not been claimed yet! Do \`${config.prefix}claim\` to claim it!`);
        if(information.claimed.id != message.author.id) return sendEmbed(message.channel, "Ticket Error", `You cannot unclaim a ticket that you never claimed in the first place!`);

        let newInformation = {
            id: information.id,
            reason: information.reason,
            claimed: 'x',
            date: information.date
        };

        await client.db.set(`modmail.channel-${message.channel.id}`, newInformation);
        sendEmbedToUser(user, "Support Team", "Your ticket has been put into the pending phrase again! Please be patient.")
        return sendEmbed(message.channel, "Unclaimed Ticket", "Successfully unclaimed this ticket!")
    } 
}