import discord, { Client, Intents, Collection } from 'discord.js';
import BaseEvent from './structures/BaseEvent.js';
import BaseCommand from './structures/BaseCommand.js';
import { readdir, readdirSync } from 'fs';
import config from './config.js';
import BicycleError from './Bicycle.Error.js';
import BicycleModmail from './Bicycle.ModMail.js';
import BicycleDatabase from './Bicycle.Database.js';

import dotenv from 'dotenv'
dotenv.config();

class Bicycle { 
    constructor() { 
        this.config = config;
        this.checkReplit()

        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES ], partials: ["CHANNEL"]});

        this.init();
        this.client.commands = new Collection();
        this.token = this.config.token;
        this.mongoURI = this.config.mongoURI;
    }

    async init() {
        this.client.login(this.token);

        await this.registerEvents();
        await this.registerDatabase();
        await this.registerModmail();
        await this.registerCommands();
    }

    async registerModmail() {
        this.client.modmail = new BicycleModmail(this.client);
    }ks

    async registerDatabase() {
        this.client.db = new BicycleDatabase(this.mongoURI, {
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

    async registerCommands() {
        readdirSync("./src/commands").forEach(async (dir) => {
            const commandFiles = readdirSync(`./src/commands/${dir}`).filter(file => file.endsWith('.js'));
            for(const file of commandFiles) {
                const Command = await import(`./commands/${dir}/${file}`);
                if(Command.default.prototype instanceof BaseCommand) {
                    const command = new Command.default();
                    this.client.commands.set(command.name, command);
                }
            }
        });
    }

    async checkReplit() {
        if (typeof config.replit == "boolean" && config.replit == true) {
            this.token = process.env.token;
            this.mongoURI = process.env.mongoURI;
        }
    }
}

export default new Bicycle();