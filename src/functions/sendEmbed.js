import { MessageEmbed } from "discord.js"
import Bicycle from "../Bicycle.js"
import BicycleError from "../Bicycle.Error.js";

export default async function sendEmbed(channel, title, description, footer = {}) {

    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setFooter(footer.text ?? "Bicycle", footer.icon ?? Bicycle.client.user.avatarURL({ dynamic: true, format: "png" }));
    return channel.send({ embeds: [embed] });
}