import Bicycle from "../Bicycle.js";

export default async function getUserFromId(id) {
    if(!id) return false;

    return await Bicycle.client.users.fetch(id);
}