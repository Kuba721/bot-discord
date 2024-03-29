const { Client, Intents, MessageEmbed } = require('discord.js');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MEMBERS
    ],
    partials: ["MESSAGE"]
});

const token = 'MTE3MzM0NjM5MzEwOTMxMTQ5OA.Gwf2iI.PMeU_ByQmcwVI6u4KDdk_DFGMh0FF0Tzl4HvDA';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Mapa przechowująca liczbę boostów dla każdego użytkownika
const boostsByUser = new Map();

client.on('messageCreate', async message => {
    if (message.content === '`lboost') {
        const server = message.guild;
        const allMembers = await server.members.fetch();
        const boostRole = server.roles.cache.find(role => role.name === "Server Booster"); // Dodana linijka
        const boosters = allMembers.filter(member => member.roles.cache.has(boostRole.id)); // Zmieniona linijka

        const embed = new MessageEmbed()
            .setTitle("Lista użytkowników, którzy boostują serwer")
            .setColor("#ff0000");

        let totalBoosts = 0;

        // Iteracja po boostujących użytkownikach
        boosters.forEach(booster => {
            const user = booster.user;
            const boostCount = boostsByUser.get(user.id) || 0;

            // Dodanie boostującego użytkownika do mapy
            boostsByUser.set(user.id, boostCount + 1);

            embed.addFields(
                { name: `${user.tag}`, value: `ID: ${user.id}\nIlość boostów: ${boostCount + 1}`, inline: false }
            );
            totalBoosts++;
        });

        embed.addField('\u200b', `Łącznie użytkowników boostujących: ${totalBoosts}`);

        const msg = await message.channel.send({ embeds: [embed] });

        // Reakcja na zdarzenie aktualizacji roli boostujących
        client.on('guildMemberUpdate', (oldMember, newMember) => {
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            // Sprawdzenie, czy użytkownik otrzymał rolę boostującą
            if (!oldRoles.has(boostRole.id) && newRoles.has(boostRole.id)) {
                const user = newMember.user;
                const boostCount = boostsByUser.get(user.id) || 0;
                boostsByUser.set(user.id, boostCount + 1);
            } 
            // Obsługa, gdy użytkownik traci rolę boostującą
            else if (oldRoles.has(boostRole.id) && !newRoles.has(boostRole.id)) {
                const user = oldMember.user;
                const boostCount = boostsByUser.get(user.id);
                if (boostCount === 1) {
                    boostsByUser.delete(user.id);
                } else {
                    boostsByUser.set(user.id, boostCount - 1);
                }
            }

            // Aktualizacja embeda
            updateEmbed(embed);

            // Aktualizacja wiadomości
            msg.edit({ embeds: [embed] });
        });
    }
});

function updateEmbed(embed) {
    embed.fields.forEach(field => {
        const userId = field.name.split('#')[1];
        const boostCount = boostsByUser.get(userId);
        if (boostCount !== undefined) {
            field.value = `ID: ${userId}\nIlość boostów: ${boostCount}`;
        }
    });
}

client.login(token);
