import { MessageEmbed } from "discord.js";
import BicycleError from "../Bicycle.Error.js";
import Bicycle from "../Bicycle.js";

export default function sendEmbedToUser(user, title, description, footer = {}) {

    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor('YELLOW')
        .setFooter(footer.text ?? "Bicycle", footer.icon ?? Bicycle.client.user.avatarURL({ dynamic: true, format: "png" }));
    return user.send({ embeds: [embed] }).catch(() => { });
}