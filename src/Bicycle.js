import discord, { Client, Intents } from 'discord.js';
import BaseEvent from './structures/BaseEvent.js';
import { readdir, readdirSync } from 'fs';
import config from './config.js';
import BicycleError from './Bicycle.Error.js';

class Bicycle { 
    constructor() {
        this.config = config;
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES ], partials: ["CHANNEL"]});


        this.init();
    }

    async init() {
        this.client.login(this.config.token);

        await this.registerEvents();
    }

    async registerEvents() {
        const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));
        for(const file of eventFiles) {
            const Event = await import(`./events/${file}`);
            if(Event.default.prototype instanceof BaseEvent) {
                const event = new Event.default();
                this.client.on(event.eventName, event.run.bind(null, this.client));
            }
        }
    }
}

export default new Bicycle();