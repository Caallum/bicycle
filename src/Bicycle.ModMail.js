import Bicycle from "./Bicycle.js";
import BicycleError from "./Bicycle.Error.js";
import sendEmbed from "./functions/sendEmbed.js";
import date from "./functions/date.js";
import sendEmbedToUser from "./functions/sendEmbedToUser.js";
import { Permissions } from "discord.js";
import config from "./config.js";
import moment from "moment";
import fs from "fs";

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

        return;
    }

    async initializeModmail(message) {
        const blacklist = await this.client.db.get(`modmail.blacklist-${message.author.id}`)

        if(blacklist) {
            return sendEmbed(message.channel, 'Modmail Blacklist', `You have been blacklisted from making a ModMail ticket!\n\n**Moderator:** ${blacklist.moderator}\n**Reason:** ${blacklist.reason}\n**Date:** ${blacklist.date}`);
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
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }
            ]
        });

        config?.roles?.staffID.forEach(id => {
          channel.permissionOverwrites.create(id, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true
          })
        })

        const informationObject = {
            channel: channel.id,
            reason: message.content,
            date: date()
        };

        const channelObject = {
            id: message.author.id,
            reason: message.content,
            claimed: 'x',
            date: date(),
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
            date: date()
        }
        await this.client.db.set(`modmail.blacklist-${user.id}`, blacklistObject)
    }

    async sendToChannel(message) {
        const information = await this.client.db.get(`modmail-${message.author.id}`);
        const blacklist = await this.client.db.get(`modmail.blacklist-${message.author.id}`)

        if(blacklist) {
            return sendEmbed(message.channel, 'Modmail Blacklist', `You have been blacklisted from making a ModMail ticket!\n\n**Moderator:** ${blacklist.moderator}\n**Reason:** ${blacklist.reason}\n**Date:** ${blacklist.date}`);
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

    async closeTicket(message, reason) {
        const user = await this.client.db.get(`modmail.channel-${message.channel.id}`);
        let discUser = user ? await this.client.users.fetch(user.id) : undefined;
        await this.client.db.delete(`modmail.channel-${message.channel}`)
        await this.client.db.delete(`modmail-${user.id}`);
        sendEmbed(message.channel, "Closing in", `10 seconds\n\n${reason}`)

        setTimeout(() => {
            setTimeout(() => {
                sendEmbed(message.channel, "Closing in", "5 seconds\n\n" + reason);
                setTimeout(() => {
                    sendEmbed(message.channel, "Closing in", "4 seconds\n\n" + reason);
                    setTimeout(() => {
                        sendEmbed(message.channel, "Closing in", "3 seconds\n\n" + reason);
                        setTimeout(() => {
                            sendEmbed(message.channel, "Closing in", "2 seconds\n\n" + reason);
                            setTimeout(() => {
                                sendEmbed(message.channel, "Closing in", "1 second\n\n" + reason);
                                setTimeout(async () => {
                                    if(discUser) await sendEmbedToUser(discUser, "Ticket Closed", "Thank yoy for contacting support. Your ticket has been closed!\n\n" + reason)
                                    await sendEmbed(message.channel, "Closing Channel", "This channel will be deleted\n\n" + reason);
                                    message.channel.delete();
                                }, 1000);
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000)
        }, 6000)
    }

    async sendToUser(message) {


        const user = await this.client.db.get(`modmail.channel-${message.channel.id}`);

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

        if(message.content.startsWith(config.prefix)) return;

        if(user.claimed == 'x') {
            return sendEmbed(message.channel, "Error Occured", "This channel has not been claimed! Use the command `" + prefix  + "claim` to claim it");
        }

        sendEmbedToUser(discUser, `Support Team`, message.content);
        return message.react(`✔️`);
    }

    async createTranscriptBuffer(Messages, Channel, Guild) {

        return new Promise(async (resolve, reject) => {
            try{
              let baseHTML = `<!DOCTYPE html>` + 
              `<html lang="en">` + 
              `<head>` + 
              `<title>${Channel.name}</title>` + 
              `<meta charset="utf-8" />` + 
              `<meta name="viewport" content="width=device-width" />` + 
              `<style>mark{background-color: #202225;color:#F3F3F3;}@font-face{font-family:Whitney;src:url(https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/whitney-300.woff);font-weight:300}@font-face{font-family:Whitney;src:url(https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/whitney-400.woff);font-weight:400}@font-face{font-family:Whitney;src:url(https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/whitney-500.woff);font-weight:500}@font-face{font-family:Whitney;src:url(https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/whitney-600.woff);font-weight:600}@font-face{font-family:Whitney;src:url(https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/whitney-700.woff);font-weight:700}body{font-family:Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:17px}a{text-decoration:none}a:hover{text-decoration:underline}img{object-fit:contain}.markdown{max-width:100%;line-height:1.3;overflow-wrap:break-word}.preserve-whitespace{white-space:pre-wrap}.spoiler{display:inline-block}.spoiler--hidden{cursor:pointer}.spoiler-text{border-radius:3px}.spoiler--hidden .spoiler-text{color:transparent}.spoiler--hidden .spoiler-text::selection{color:transparent}.spoiler-image{position:relative;overflow:hidden;border-radius:3px}.spoiler--hidden .spoiler-image{box-shadow:0 0 1px 1px rgba(0,0,0,.1)}.spoiler--hidden .spoiler-image *{filter:blur(44px)}.spoiler--hidden .spoiler-image:after{content:"SPOILER";color:#dcddde;background-color:rgba(0,0,0,.6);position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-weight:600;padding:100%;border-radius:20px;letter-spacing:.05em;font-size:.9em}.spoiler--hidden:hover .spoiler-image:after{color:#fff;background-color:rgba(0,0,0,.9)}blockquote{margin:.1em 0;padding-left:.6em;border-left:4px solid;border-radius:3px}.pre{font-family:Consolas,"Courier New",Courier,monospace}.pre--multiline{margin-top:.25em;padding:.5em;border:2px solid;border-radius:5px}.pre--inline{padding:2px;border-radius:3px;font-size:.85em}.mention{border-radius:3px;padding:0 2px;color:#dee0fc;background:rgba(88,101,242,.3);font-weight:500}.mention:hover{background:rgba(88,101,242,.6)}.emoji{width:1.25em;height:1.25em;margin:0 .06em;vertical-align:-.4em}.emoji--small{width:1em;height:1em}.emoji--large{width:2.8em;height:2.8em}.chatlog{max-width:100%}.message-group{display:grid;margin:0 .6em;padding:.9em 0;border-top:1px solid;grid-template-columns:auto 1fr}.reference-symbol{grid-column:1;border-style:solid;border-width:2px 0 0 2px;border-radius:8px 0 0 0;margin-left:16px;margin-top:8px}.attachment-icon{float:left;height:100%;margin-right:10px}.reference{display:flex;grid-column:2;margin-left:1.2em;margin-bottom:.25em;font-size:.875em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-items:center}.reference-av{border-radius:50%;height:16px;width:16px;margin-right:.25em}.reference-name{margin-right:.25em;font-weight:600}.reference-link{flex-grow:1;overflow:hidden;text-overflow:ellipsis}.reference-link:hover{text-decoration:none}.reference-content>*{display:inline}.reference-edited-tst{margin-left:.25em;font-size:.8em}.ath-av-container{grid-column:1;width:40px;height:40px}.ath-av{border-radius:50%;height:40px;width:40px}.messages{grid-column:2;margin-left:1.2em;min-width:50%}.messages .bot-tag{top:-.2em}.ath-name{font-weight:500}.tst{margin-left:.3em;font-size:.75em}.message{padding:.1em .3em;margin:0 -.3em;background-color:transparent;transition:background-color 1s ease}.content{font-size:.95em;word-wrap:break-word}.edited-tst{margin-left:.15em;font-size:.8em}.attachment{margin-top:.3em}.attachment-thumbnail{vertical-align:top;max-width:45vw;max-height:225px;border-radius:3px}.attachment-container{height:40px;width:100%;max-width:520px;padding:10px;border:1px solid;border-radius:3px;overflow:hidden;background-color:#2f3136;border-color:#292b2f}.attachment-icon{float:left;height:100%;margin-right:10px}.attachment-filesize{color:#72767d;font-size:12px}.attachment-filename{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.embed{display:flex;margin-top:.3em;max-width:520px}.embed-color-pill{flex-shrink:0;width:.25em;border-top-left-radius:3px;border-bottom-left-radius:3px}.embed-content-container{display:flex;flex-direction:column;padding:.5em .6em;border:1px solid;border-top-right-radius:3px;border-bottom-right-radius:3px}.embed-content{display:flex;width:100%}.embed-text{flex:1}.embed-ath{display:flex;margin-bottom:.3em;align-items:center}.embed-ath-icon{margin-right:.5em;width:20px;height:20px;border-radius:50%}.embed-ath-name{font-size:.875em;font-weight:600}.embed-title{margin-bottom:.2em;font-size:.875em;font-weight:600}.embed-description{font-weight:500;font-size:.85em}.embed-fields{display:flex;flex-wrap:wrap}.embed-field{flex:0;min-width:100%;max-width:506px;padding-top:.6em;font-size:.875em}.embed-field--inline{flex:1;flex-basis:auto;min-width:150px}.embed-field-name{margin-bottom:.2em;font-weight:600}.embed-field-value{font-weight:500}.embed-thumbnail{flex:0;margin-left:1.2em;max-width:80px;max-height:80px;border-radius:3px}.embed-image-container{margin-top:.6em}.embed-image{max-width:500px;max-height:400px;border-radius:3px}.embed-footer{margin-top:.6em}.embed-footer-icon{margin-right:.2em;width:20px;height:20px;border-radius:50%;vertical-align:middle}.embed-footer-text{display:inline;font-size:.75em;font-weight:500}.reactions{display:flex}.reaction{display:flex;align-items:center;margin:.35em .1em .1em .1em;padding:.2em .35em;border-radius:8px}.reaction-count{min-width:9px;margin-left:.35em;font-size:.875em}.bot-tag{position:relative;margin-left:.3em;margin-right:.3em;padding:.05em .3em;border-radius:3px;vertical-align:middle;line-height:1.3;background:#7289da;color:#fff;font-size:.625em;font-weight:500}.postamble{margin:1.4em .3em .6em .3em;padding:1em;border-top:1px solid}body{background-color:#36393e;color:#dcddde}a{color:#0096cf}.spoiler-text{background-color:rgba(255,255,255,.1)}.spoiler--hidden .spoiler-text{background-color:#202225}.spoiler--hidden:hover .spoiler-text{background-color:rgba(32,34,37,.8)}.quote{border-color:#4f545c}.pre{background-color:#2f3136!important}.pre--multiline{border-color:#282b30!important;color:#b9bbbe!important}.preamble__entry{color:#fff}.message-group{border-color:rgba(255,255,255,.1)}.reference-symbol{border-color:#4f545c}.reference-icon{width:20px;display:inline-block;vertical-align:bottom}.reference{color:#b5b6b8}.reference-link{color:#b5b6b8}.reference-link:hover{color:#fff}.reference-edited-tst{color:rgba(255,255,255,.2)}.ath-name{color:#fff}.tst{color:rgba(255,255,255,.2)}.message--highlighted{background-color:rgba(114,137,218,.2)!important}.message--pinned{background-color:rgba(249,168,37,.05)}.edited-tst{color:rgba(255,255,255,.2)}.embed-color-pill--default{background-color:#4f545c}.embed-content-container{background-color:rgba(46,48,54,.3);border-color:rgba(46,48,54,.6)}.embed-ath-name{color:#fff}.embed-ath-name-link{color:#fff}.embed-title{color:#fff}.embed-description{color:rgba(255,255,255,.6)}.embed-field-name{color:#fff}.embed-field-value{color:rgba(255,255,255,.6)}.embed-footer{color:rgba(255,255,255,.6)}.reaction{background-color:rgba(255,255,255,.05)}.reaction-count{color:rgba(255,255,255,.3)}.info{display:flex;max-width:100%;margin:0 5px 10px 5px}.guild-icon-container{flex:0}.guild-icon{max-width:88px;max-height:88px}.metadata{flex:1;margin-left:10px}.guild-name{font-size:1.2em}.channel-name{font-size:1em}.channel-topic{margin-top:2px}.channel-message-count{margin-top:2px}.channel-timezone{margin-top:2px;font-size:.9em}.channel-date-range{margin-top:2px}</style>` +
              `<script>function scrollToMessage(e,t){var o=document.getElementById("message-"+t);null!=o&&(e.preventDefault(),o.classList.add("message--highlighted"),window.scrollTo({top:o.getBoundingClientRect().top-document.body.getBoundingClientRect().top-window.innerHeight/2,behavior:"smooth"}),window.setTimeout(function(){o.classList.remove("message--highlighted")},2e3))}function scrollToMessage(e,t){var o=document.getElementById("message-"+t);o&&(e.preventDefault(),o.classList.add("message--highlighted"),window.scrollTo({top:o.getBoundingClientRect().top-document.body.getBoundingClientRect().top-window.innerHeight/2,behavior:"smooth"}),window.setTimeout(function(){o.classList.remove("message--highlighted")},2e3))}function showSpoiler(e,t){t&&t.classList.contains("spoiler--hidden")&&(e.preventDefault(),t.classList.remove("spoiler--hidden"))}</script>` + 
              `<script>document.addEventListener('DOMContentLoaded', () => {document.querySelectorAll('.pre--multiline').forEach((block) => {hljs.highlightBlock(block);});});</script>` + 
              `</head>`;
              let messagesArray = []
              let messagescount = Messages.length;
              let msgs = Messages.reverse(); //reverse the array to have it listed like the discord chat
              //now for every message in the array make a new paragraph!
              await msgs.forEach(async msg => {
                  //Aug 02, 2021 12:20 AM
                  if(msg.type == "DEFAULT"){
                    let time = moment(msg.createdTimestamp).format("MMM DD, YYYY HH:MM:ss")
                    let subcontent = `<div class="message-group">` + 
                    `<div class="ath-av-container"><img class="ath-av"src="${msg.author.displayAvatarURL({dynamic: true})}" /></div>` + 
                    `<div class="messages">` + 
                    `<span class="ath-name" title="${msg.author.username}" style="color: ${msg.member.roles.highest.hexColor};">${msg.author.tag}</span>`;
                    if(msg.author.bot) subcontent += `<span class="bot-tag">BOT</span>`;
                    subcontent += `<span class="tst">ID: ${msg.author.id} | </span>` + 
                    `<span class="tst">${time} ${msg.editedTimestamp ? `(edited)` : msg.editedAt ? `(edited)` : ""}</span>` + 
                    `<div class="message">`;
                    if (msg.content) {
                      subcontent += `<div class="content"><div class="markdown"><span class="preserve-whitespace">${markdowntohtml(String(msg.cleanContent ? msg.cleanContent : msg.content).replace(/\n/ig, "<br/>"))}</div></div>` 
                    } 
                    if (msg.embeds[0]){
                        subcontent += `<div class="embed"><div class=embed-color-pill style=background-color:"${msg.embeds[0].color ? msg.embeds[0].color : "transparent"}"></div><div class=embed-content-container><div class=embed-content><div class=embed-text>` 
                        
                        if(msg.embeds[0].author){
                          subcontent += `<div class="embed-ath">`;
                          if(msg.embeds[0].author.iconURL){
                            subcontent += `<img class="embed-ath-icon" src="${msg.embeds[0].author.iconURL}">`
                          }
                          if(msg.embeds[0].author.name){
                            subcontent += `<div class="embed-ath-name"><span class="markdown">${markdowntohtml(String(msg.embeds[0].author.name).replace(/\n/ig, "<br/>"))}</span></div>`
                          }
                          subcontent += `</div>`
                        }if(msg.embeds[0].title){
                          subcontent += `<div class="embed-title"><span class="markdown">${markdowntohtml(String(msg.embeds[0].title).replace(/\n/ig, "<br/>"))}</span></div>`;
                        }
                        if(msg.embeds[0].description){
                          subcontent += `<div class="embed-description preserve-whitespace"><span class="markdown" style="color: rgba(255,255,255,.6) !important;">${markdowntohtml(String(msg.embeds[0].description).replace(/\n/ig, "<br/>"))}</span></div>`;
                        }
                        if(msg.embeds[0].image){
                          subcontent += `<div class="embed-image-container"><img class="embed-footer-image" src="${msg.embeds[0].image.url}"></div>`
                        }
                        if(msg.embeds[0].fields && msg.embeds[0].fields.length > 0){
                          subcontent += `<div class="embed-fields">`
                          for(let i = 0; i < msg.embeds[0].fields.length; i++){
                              subcontent += `<div class="embed-field ${msg.embeds[0].fields[i].inline ? `embed-field--inline` : ``}">`
                              const field = msg.embeds[0].fields[i]
                              if(field.key){
                                subcontent += `<div class="embed-field-name">${markdowntohtml(String(field.key).replace(/\n/ig, "<br/>"))}</div>`;
                              }
                              if(field.value){
                                subcontent += `<div class="embed-field-value">${markdowntohtml(String(field.value).replace(/\n/ig, "<br/>"))}</div>`;
                              }
                              subcontent += `</div>`
                          }
                          subcontent += `</div>`;
                        }
                        if(msg.embeds[0].footer){
                          subcontent += `<div class="embed-footer">`;
                          if(msg.embeds[0].footer.iconURL){
                            subcontent += `<img class="embed-footer-icon" src="${msg.embeds[0].footer.iconURL}">`
                          }
                          if(msg.embeds[0].footer.text){
                            subcontent += `<div class="embed-footer-text"><span class="markdown">${markdowntohtml(String(msg.embeds[0].footer.text).replace(/\n/ig, "<br/>"))}</span></div>`
                          }
                          subcontent += `</div>`
                        }
                        subcontent += `</div>`;
                        if(msg.embeds[0].thumbnail && msg.embeds[0].thumbnail.url){
                          subcontent += `<img class="embed-thumbnail" src="${msg.embeds[0].thumbnail.url}">`;
                        }
                        subcontent += `</div></div></div>`;
                    }
                    if (msg.reactions && msg.reactions.cache.size > 0){
                      subcontent += `<div class="reactions">`
                      for(const reaction of [...msg.reactions.cache.values()]){                      
                        subcontent += `<div class=reaction>${reaction.emoji.url ? `<img class="emoji emoji--small" src="${reaction.emoji.url}" alt="${"<" + reaction.emoji.animated ? "a" : "" + ":" + reaction.emoji.name + ":" + reaction.emoji.id + ">"}">` : reaction.emoji.name.toString()}<span class="reaction-count">${reaction.count}</span></div>`
                      }
                      subcontent += `</div>`
                    }
                    subcontent += `</div></div></div>`
                    messagesArray.push(subcontent);
                  }
                  if(msg.type == "PINS_ADD"){
                    let time = moment(msg.createdTimestamp).format("MMM DD, YYYY HH:MM:ss")
                    let subcontent = `<div class="message-group">` + 
                    `<div class="ath-av-container"><img class="ath-av"src="https://cdn-0.emojis.wiki/emoji-pics/twitter/pushpin-twitter.png" style="background-color: #000;filter: alpha(opacity=40);opacity: 0.4;" /></div>` + 
                    `<div class="messages">` + 
                    `<span class="ath-name" title="${msg.author.username}" style="color: ${msg.member.roles.highest.hexColor};">${msg.author.tag}</span>`;
                    if(msg.author.bot) subcontent += `<span class="bot-tag">BOT</span>`;
                    subcontent += `<span class="tst" style="font-weight:500;color:#848484;font-size: 14px;">pinned a message to this channel.</span><span class="tst">${time}</span></div></div></div>`;
                  messagesArray.push(subcontent);
                  }
              });
              baseHTML += `<body><div class="info"><div class="guild-icon-container"> <img class="guild-icon" src="${Guild.iconURL({dynamic:true})}" />` +
                `</div><div class="metadata">` +
                `<div class="guild-name"><strong>Guild:</strong> ${Guild.name}</div>` +
                `<div class="channel-name"><strong>Channel:</strong> ${Channel.name}</mark></div>` +
                `<div class="channel-message-count"><mark>${messagescount} Messages</mark></div>` +
                `<div class="channel-timezone"><strong>Timezone-Log-Created:</strong> <mark>${moment(Date.now()).format("MMM DD, YYYY HH:MM")}</mark> | <em>[MEZ] Europe/London</em></div>` +
                `</div></div>` +
                `<div class="chatlog">`;
                baseHTML += messagesArray.join("\n");
                baseHTML += `<div class="message-group"><div class="ath-av-container"><img class="ath-av"src="https://logosmarken.com/wp-content/uploads/2020/12/Discord-Logo.png" /></div><div class="messages"><span class="ath-name" style="color: #ff5151;">TICKET LOG INFORMATION</span><span class="bot-tag">✓ SYSTEM</span><span class="timestamp">Mind this Information</span><div class="message " ><div class="content"><div class="markdown"><span class="preserve-whitespace"><i><blockquote>If there are Files, Attachments, Vidoes or Images, they won't always be displayed cause they will be unknown and we don't want to spam an API like IMGUR!</blockquote></i></span></div></div></div></div></div></div></body></html>`;
              fs.writeFileSync(`${process.cwd()}/${Channel.name}.html`, baseHTML); //write everything in the docx file
              resolve(`${process.cwd()}/${Channel.name}.html`);
              return;
              function markdowntohtml(tomarkdown){
                mentionReplace(tomarkdown.split(" "));
                function mentionReplace(splitted){
                  for(let arg of splitted){
                    const memberatches = arg.match(/<@!?(\d+)>/);
                    const rolematches = arg.match(/<@&(\d+)>/);
                    const channelmatches = arg.match(/<#(\d+)>/);
                    if (rolematches) {
                      let role = Guild.roles.cache.get(rolematches[1])
                      if(role){
                        let torpleace = new RegExp(rolematches[0], "g")
                        tomarkdown = tomarkdown.replace(torpleace, `<span title="${role.id}" style="color: ${role.hexColor};">@${role.name}</span>`);
                      }
                    }
                    if(memberatches){
                      let member = Guild.members.cache.get(memberatches[1])
                      if(member){
                        let torpleace = new RegExp(memberatches[0], "g")
                        tomarkdown = tomarkdown.replace(torpleace, `<span class="mention" title="${member.id}">@${member.user.username}</span>`);
                      }
                    }
                    if(channelmatches){
                      let channel = Guild.channels.cache.get(channelmatches[1])
                      if(channel){
                        let torpleace = new RegExp(channelmatches[0], "g")
                        tomarkdown = tomarkdown.replace(torpleace, `<span class="mention" title="${channel.id}">@${channel.name}</span>`);
                      }
                    }
                  }
                }
                var output = "";
                var BLOCK = "block";
                var INLINE = "inline";
                var parseMap = [
                  {
                    // <p>
                    pattern: /\n(?!<\/?\w+>|\s?\*|\s?[0-9]+|>|\&gt;|-{5,})([^\n]+)/g,
                    replace: "$1<br/>",
                    type: BLOCK,
                  },
                  {
                    // <blockquote>
                    pattern: /\n(?:&gt;|\>)\W*(.*)/g,
                    replace: "<blockquote><p>$1</p></blockquote>",
                    type: BLOCK,
                  },
                  {
                    // <ul>
                    pattern: /\n\s?\*\s*(.*)/g,
                    replace: "<ul>\n\t<li>$1</li>\n</ul>",
                    type: BLOCK,
                  },
                  {
                    // <ol>
                    pattern: /\n\s?[0-9]+\.\s*(.*)/g,
                    replace: "<ol>\n\t<li>$1</li>\n</ol>",
                    type: BLOCK,
                  },
                  {
                    // <strong>
                    pattern: /(\*\*|__)(.*?)\1/g,
                    replace: "<strong>$2</strong>",
                    type: INLINE,
                  },
                  {
                    // <em>
                    pattern: /(\*)(.*?)\1/g,
                    replace: "<em>$2</em>",
                    type: INLINE,
                  },
                  {
                    // <a>
                    pattern: /([^!])\[([^\[]+)\]\(([^\)]+)\)/g,
                    replace: "$1<a href=\"$3\">$2</a>",
                    type: INLINE,
                  },
                  {
                    // <img>
                    pattern: /!\[([^\[]+)\]\(([^\)]+)\)/g,
                    replace: "<img src=\"$2\" alt=\"$1\" />",
                    type: INLINE,
                  },
                  {
                    // <code>
                    pattern: /`(.*?)`/g,
                    replace: "<mark>$1</mark>",
                    type: INLINE,
                  },
                ];
                function parse(string) {
                  output = "\n" + string + "\n";
                  parseMap.forEach(function(p) {
                    output = output.replace(p.pattern, function() {
                      return replace.call(this, arguments, p.replace, p.type);
                    });
                  });
                  output = clean(output);
                  output = output.trim();
                  output = output.replace(/[\n]{1,}/g, "\n");
                  return output;
                }
                function replace(matchList, replacement, type) {
                  var i, $$;
                  for(i in matchList) {
                    if(!matchList.hasOwnProperty(i)) {
                      continue;
                    }
                    replacement = replacement.split("$" + i).join(matchList[i]);
                    replacement = replacement.split("$L" + i).join(matchList[i].length);
                  }
                  if(type === BLOCK) {
                    replacement = replacement.trim() + "\n";
                  }
                  return replacement;
                }
                function clean(string) {
                  var cleaningRuleArray = [
                    {
                      match: /<\/([uo]l)>\s*<\1>/g,
                      replacement: "",
                    },
                    {
                      match: /(<\/\w+>)<\/(blockquote)>\s*<\2>/g,
                      replacement: "$1",
                    },
                  ];
                  cleaningRuleArray.forEach(function(rule) {
                    string = string.replace(rule.match, rule.replacement);
                  });
                  return string;
                }
                
                let output__ = parse(tomarkdown);
                return output__;
              }
            }catch (e){
              reject(e);
              return;
            }
          })          
      }
}