import { CategoryChannel } from "discord.js";

export default class BaseCommand {
    constructor(name, description, aliases, category, test) {
        this.name = name;
        this.description = description;
        this.aliases = aliases;
        this.category = category;
        this.test = test;
    }
}