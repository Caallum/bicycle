import BicycleError from "../../Bicycle.Error.js";
import BaseCommand from "../../structures/BaseCommand.js";
import Bicycle from "../../Bicycle.js";
import Discord from 'discord.js';
import config from "../../config.js";

export default class TranscriptCommand extends BaseCommand {
    constructor() {
        super(
            'transcript',
            'Get all messages sent in the modmail ticket',
            ['ts'],
            'Modmail',
            true
        )
    }

    async run(client, message, args) {
        if(!message.member.roles.cache.some(role => config.modmail.staffID.includes(role.id))) return sendEmbed(message.channel, "Permission Error", "You do not have permission to do that!");
        if(message.channel.parentId != config.modmail.categoryID) return sendEembed(message.channel, "Permission Error", "You cannot do that command here!");

        let msglimit = 1000
        let messageCollection = new Discord.Collection(); //make a new collection
        let channelMessages = await message.channel.messages.fetch({ //fetch the last 100 messages
            limit: 100
        }).catch(err => console.log(err)); //catch any error
        messageCollection = messageCollection.concat(channelMessages); //add them to the Collection
        let tomanymsgs = 1; //some calculation for the messagelimit
        if (Number(msglimit) === 0) msglimit = 100; //if its 0 set it to 100
        let messagelimit = Number(msglimit) / 100; //devide it by 100 to get a counter
        if (messagelimit < 1) messagelimit = 1; //set the counter to 1 if its under 1
        while (channelMessages.size === 100) { //make a loop if there are more then 100 messages in this channel to fetch
            if (tomanymsgs === messagelimit) break; //if the counter equals to the limit stop the loop
            tomanymsgs += 1; //add 1 to the counter
            let lastMessageId = channelMessages.lastKey(); //get key of the already fetched messages above
            channelMessages = await message.channel.messages.fetch({
                limit: 100,
                before: lastMessageId
            }).catch(err => console.log(err)); //Fetch again, 100 messages above the already fetched messages
            if (channelMessages) //if its true
                messageCollection = messageCollection.concat(channelMessages); //add them to the collection
        }

        let attachments = []

        attachments = [await client.modmail.createTranscriptBuffer([...messageCollection.values()], message.channel, message.guild)]
        message.channel.send({
            files: attachments,
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle('Here is the transcript')
                    .setColor('YELLOW')
                    .setFooter("Bicycle", Bicycle.client.user.avatarURL({ dynamic: true, format: "png" }))
            ]
        })
    }
}