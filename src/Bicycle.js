import discord, { Client, Intents } from 'discord.js';
import BaseEvent from './structures/BaseEvent.js';
import { readdir, readdirSync } from 'fs';
import config from './config.js';
import BicycleError from './Bicycle.Error.js';
import BicycleModmail from './Bicycle.ModMail.js';
import BicycleDatabase from './Bicycle.Database.js';

class Bicycle { 
    constructor() { 
        this.config = config;
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES ], partials: ["CHANNEL"]});

        this.init();
    }

    async init() {
        this.client.login(this.config.token);

        await this.registerEvents();
        await this.registerDatabase();
        await this.registerModmail();
    }

    async registerModmail() {
        this.client.modmail = new BicycleModmail(this.client);
    }

    async registerDatabase() {
        this.client.db = new BicycleDatabase(config.mongoURI, {
            name: 'BicycleDBV2'
        });
        this.client.db
            .on("connected", (info) => {
                console.log(info);
            })
            .on("error", (err) => {
                console.log(err);
            })
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