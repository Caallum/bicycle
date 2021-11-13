import Bicycle from "./Bicycle.js";
import BicycleError from "./Bicycle.Error.js";
import sendEmbed from "./functions/sendEmbed.js";
import date from "./functions/date.js";
import sendEmbedToUser from "./functions/sendEmbedToUser.js";
import { Permissions } from "discord.js";
import config from "./config.js";

let prefix = config.prefix;

export default class BicycleModmail {
    constructor(client) {
        this.client = client;
    }

    async handleMessage(message) {
        if(message.author.bot) return;

        if(await this.client.db.get(`modmail-${message.author.id}`) && message.channel.type == "DM") {
            return await this.sendToChannel(message);
        } ;

        if(message.channel.type == "DM") {
            return await this.initializeModmail(message);
        }

        if(message.channel.parentId == config?.modmail?.categoryID) {
            return await this.sendToUser(message);
        } 
    }

    async initializeModmail(message) {
        const blacklist = await this.client.db.get(`modmail.blacklist-${message.author.id}`)

        if(blacklist) {
            return sendEmbed(message.channel, 'Modmail Blacklist', `You have been blacklisted from making a ModMail ticket!\n\n**Moderator:** ${blacklist.moderator}\n**Reason:** ${blacklist.reason}\n**Date: ${blacklist.date}`);
        }

        const guild = await this.client.guilds.fetch(config?.modmail?.guildID);
        if(!guild) {
            new BicycleError("Guild not found", )
            return sendEmbed(message.channel, "Error has occured", "Please try again later");
        }

        const channel = await guild.channels.create(`${message.author.username}${message.author.discriminator}`, {
            parent: config?.modmail?.categoryID,
            reason: "New modmail ticket opened",
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: config?.modmail?.staffID,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                },
                {
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }
            ]
        });

        const informationObject = {
            channel: channel.id,
            reason: message.content,
            date: date
        };

        const channelObject = {
            id: message.author.id,
            reason: message.content,
            claimed: 'x',
            date: date,
        }

        await this.client.db.set(`modmail-${message.author.id}`, informationObject);
        await this.client.db.set(`modmail.channel-${channel.id}`, channelObject);

        sendEmbed(channel, "Ticket Opened", `**${message.author.tag}:** \`\`\`${message.content}\`\`\``);
        return sendEmbed(message.channel, 'Ticket Opened', 'You have successfully opened a ticket, anything you now say will be transmitted to staff!');
    }

    async blacklist(user, reason, moderator) {
        let blacklistObject = {
            moderator: moderator,
            reason: reason,
            date: date
        }
        await this.client.db.set(`modmail.blacklist-${user.id}`, blacklistObject)
    }

    async sendToChannel(message) {
        const information = await this.client.db.get(`modmail-${message.author.id}`);
        const blacklist = await this.client.db.get(`modmail.blacklist-${message.author.id}`)

        if(blacklist) {
            return sendEmbed(message.channel, 'Modmail Blacklist', `You have been blacklisted from making a ModMail ticket!\n\n**Moderator:** ${blacklist.moderator}\n**Reason:** ${blacklist.reason}\n**Date: ${blacklist.date}`);
        }
        
        const channel = await this.client.channels.fetch(information.channel).catch(() => {
            return message.react(`❌`);
        })

        if(!channel) {
            message.react(`❌`);
            new BicycleError(`ModMail channel not found for user ${message.author.tag} (${message.author.id})`, 'Bicycle.ModMail: 44');
            return sendEmbed(message.channel, `An error has occured!`, `I cannot find your modmail channel, please try again later.`)
        }
        
        sendEmbed(channel, message.author.tag, message.content);
        return message.react(`✔️`);
    }

    async sendToUser(message) {


        const user = this.client.db.get(`modmail.channel-${message.channel}`);

        if(!user) return;

        const discUser = await this.client.users.fetch(user.id).catch(() => { });

        if(!discUser) {
            sendEmbed(message.channel, "User not found", 'I cannot find the user attached to this modmail channel, deleting in 10 seconds...');
            await this.client.db.delete(`modmail.channel-${message.channel}`)
            await this.client.db.delete(`modmail-${user.id}`);

            setTimeout(() => {
                setTimeout(() => {
                    sendEmbed(message.channel, "Closing in", "5 seconds");
                    setTimeout(() => {
                        sendEmbed(message.channel, "Closing in", "4 seconds");
                        setTimeout(() => {
                            sendEmbed(message.channel, "Closing in", "3 seconds");
                            setTimeout(() => {
                                sendEmbed(message.channel, "Closing in", "2 seconds");
                                setTimeout(() => {
                                    sendEmbed(message.channel, "Closing in", "1 second");
                                    setTimeout(async () => {
                                        await sendEmbed(message.channel, "Closing Channel", "This channel will be deleted");
                                        message.channel.delete();
                                    }, 1000);
                                }, 1000);
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000)
            }, 6000)

            return;
        }

        if(!user.claimed) {
            return sendEmbed(message.channel, "Error Occured", "This channel has not been claimed! Use the command `" + prefix  + "claim` to claim it");
        }

        sendEmbedToUser(discUser, `Support Team`, message.content);
        return message.react(`✔️`);
    }
}