import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";
import config from "../../config.js";
import sendEmbed from "../../functions/sendEmbed.js";
import getUserFromMention from "../../functions/getUserFromMention.js";
import getUserFromId from "../../functions/getUserFromId.js";
import date from "../../functions/date.js";
import sendEmbedToUser from "../../functions/sendEmbedToUser.js";
import Bicycle from "../../Bicycle.js";

export default class BlacklistCommand extends BaseCommand {
    constructor() {
        super(
            'blacklist',
            'Blacklist a user from the Modmail',
            ['black', 'bl'],
            'Modmail',
            false
        )
    }

    async run(client, message, args) {

        if(!message.member.roles.cache.has(config.modmail.staffID)) return sendEmbed(message.channel, "Permission Error", "You do not have permission to do that!");
        
        if(!args[0]) return sendEmbed(message.channel, "User not found", "I cannot find that user, please try again!");

        let user = await getUserFromMention(args[0]) || await getUserFromId(args[0]); 
        if(!user) return sendEmbed(message.channel, "User not found", "I cannot find that user, please try again!");

        if(await client.db.get(`modmail.blacklist-${user.id}`)) {    
            await client.db.delete(`modmail.blacklist-${user.id}`);
            sendEmbed(message.channel, "Successfully removed blacklist", `I have removed ${user.tag} from the modmail blacklist.`);
            return sendEmbedToUser(user, "Unblacklisted", "Your Modmail blacklist has been removed.")
        }

        let reason = args[2] ? args.slice(1).join(' ') : "Unspecified Reason";

        client.modmail.blacklist(user, reason, message.author.tag);
        sendEmbed(message.channel, "Successfully added blacklist", `I have added ${user.tag} to the modmail blacklist`);
        return sendEmbedToUser(user, "Modmail Blacklisted", `You have beena added to the modmail blacklist!\n\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}\n**Date:** ${date}`);
    }
}