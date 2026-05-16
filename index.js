require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    Routes,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

const WELCOME_CHANNEL = '1504526271521226783';
const TICKET_CHANNEL = '1504539078379438222';

const ADMIN_ROLE = '1504541142061023503';

const giveaways = new Map();

function parseTime(time) {

    const num = parseInt(time);

    if (time.endsWith('s')) return num * 1000;
    if (time.endsWith('m')) return num * 60000;
    if (time.endsWith('h')) return num * 3600000;
    if (time.endsWith('d')) return num * 86400000;

    return null;
}

  const commands = [

    new SlashCommandBuilder()
        .setName('konkurs')
        .setDescription('Tworzy konkurs')

        .addStringOption(option =>
            option.setName('nagroda')
                .setDescription('Nagroda')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('czas')
                .setDescription('Np 1m 1h 1d')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option.setName('wygrani')
                .setDescription('Ilość wygranych')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('wymagania')
                .setDescription('Wymagania')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Sprawdza ilość zaproszeń')
        .addUserOption(option =>
            option
                .setName('osoba')
                .setDescription('Osoba')
                .setRequired(true)
        )

].map(cmd => cmd.toJSON());


client.once('ready', async () => {

    console.log(`${client.user.tag} ONLINE`);

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Komendy załadowane');

    } catch (err) {
        console.log(err);
    }

    client.guilds.cache.forEach(async guild => {

        const channel = guild.channels.cache.get(TICKET_CHANNEL);

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('KLAN BURG1 - TICKETY')
            .setDescription('Wybierz temat ticketu');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket-menu')
            .setPlaceholder('Wybierz temat')
            .addOptions([
                {
                    label: '🆘 POMOC',
                    description: 'Potrzebujesz pomocy lub masz pytanie? Kliknij tutaj',
                    value: 'pomoc'
                },
                {
                    label: '⚔️ DOŁĄCZ DO KLANU',
                    description: 'Chcesz dołączyć do klanu BURG1? Kliknij tu',
                    value: 'klan'
                },
                {
                    label: '🆘 INNE',
                    description: 'Inne sprawy',
                    value: 'inne'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        channel.send({
            embeds: [embed],
            components: [row]
        }).catch(() => {});
    });
});

client.on('guildMemberAdd', member => {

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('WITAMY')
        .setDescription(
`${member}

Cieszymy się że dołączasz na naszego discorda w naszym klanie podbijesz z nami anarchie 🥳`
        );

    channel.send({
        embeds: [embed]
    });
});

client.on('interactionCreate', async interaction => {

   if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'invites') {

        const user = interaction.options.getUser('osoba');

        const invites = await interaction.guild.invites.fetch();

        let total = 0;

        invites.forEach(invite => {

            if (
                invite.inviter &&
                invite.inviter.id === user.id
            ) {
                total += invite.uses;
            }
        });

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('📨 Zaproszenia')
            .setDescription(
`${user} zaprosił **${total}** osób na serwer.`
            );

        return interaction.reply({
            embeds: [embed]
        });
    }

    if (interaction.commandName === 'konkurs') {

            const user = interaction.options.getUser('osoba');

            const invites = await interaction.guild.invites.fetch();

            let total = 0;

            invites.forEach(invite => {

                if (
                    invite.inviter &&
                    invite.inviter.id === user.id
                ) {
                    total += invite.uses;
                }
            });

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('📨 Zaproszenia')
                .setDescription(
`${user} zaprosił **${total}** osób na serwer.`
                );

            return interaction.reply({
                embeds: [embed]
            });
        }

            if (
                !interaction.member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {
                return interaction.reply({
                    content: 'Nie masz permisji!',
                    ephemeral: true
                });
            }

            const nagroda = interaction.options.getString('nagroda');
            const czas = interaction.options.getString('czas');
            const wygrani = interaction.options.getInteger('wygrani');
            const wymagania = interaction.options.getString('wymagania');

            const ms = parseTime(czas);

            if (!ms) {
                return interaction.reply({
                    content: 'Zły format czasu!',
                    ephemeral: true
                });
            }

            const endTime = Date.now() + ms;

            const embed = new EmbedBuilder()
                .setColor('Purple')
                .setTitle(`${nagroda}`)
                .setDescription(
`Konkurs 🎉

Wymagania:
${wymagania}

Ends: <t:${Math.floor(endTime / 1000)}:R>

Hosted by: ${interaction.user}

Entries: 0
Winners: ${wygrani}`
                );

            const button = new ButtonBuilder()
                .setCustomId(`giveaway_${Date.now()}`)
                .setLabel('🎉 Dołącz')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const msg = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            giveaways.set(msg.id, []);

            setTimeout(async () => {

                const users = giveaways.get(msg.id) || [];

                const disabledButton = new ButtonBuilder()
                    .setCustomId('ended')
                    .setLabel('Konkurs zakończony')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const disabledRow = new ActionRowBuilder()
                    .addComponents(disabledButton);

                await msg.edit({
                    components: [disabledRow]
                });

                if (users.length === 0) {

                    msg.channel.send('Nikt nie dołączył do konkursu.');
                    return;
                }

                const winners = [];

                for (let i = 0; i < wygrani; i++) {

                    const random =
                        users[Math.floor(Math.random() * users.length)];

                    if (!winners.includes(random)) {
                        winners.push(random);
                    }
                }

                winners.forEach(userId => {

                    msg.channel.send(
`🎉 Gratulacje <@${userId}> wygrałeś **${nagroda}**

Zgłoś się na ticket INNE`
                    );
                });

            }, ms);
        }
    }

    if (interaction.isButton()) {

        if (interaction.customId.startsWith('giveaway_')) {

            const users = giveaways.get(interaction.message.id);

            if (!users) return;

            if (users.includes(interaction.user.id)) {

                giveaways.set(
                    interaction.message.id,
                    users.filter(u => u !== interaction.user.id)
                );

                return interaction.reply({
                    content: 'Wyszedłeś z konkursu!',
                    ephemeral: true
                });
            }

            users.push(interaction.user.id);

            interaction.reply({
                content: 'Dołączyłeś do konkursu!',
                ephemeral: true
            });

            const embed = EmbedBuilder.from(
                interaction.message.embeds[0]
            );

            const desc = embed.data.description.replace(
                /Entries: \d+/,
                `Entries: ${users.length}`
            );

            embed.setDescription(desc);

            interaction.message.edit({
                embeds: [embed]
            });
        }

        if (interaction.customId.startsWith('close_')) {

            const channel = interaction.channel;

            await interaction.reply({
                content: 'Ticket zamknięty.'
            });

            setTimeout(async () => {

                const parent = channel.parent;

                await channel.delete().catch(() => {});

                if (parent) {

                    const channels = parent.children.cache.size;

                    if (channels <= 0) {
                        parent.delete().catch(() => {});
                    }
                }

            }, 2000);
        }
    }

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== 'ticket-menu') return;

        const type = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`ticketmodal_${type}`)
            .setTitle('Powód ticketu');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Po co tworzysz ticket?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(row);

        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {

        if (!interaction.customId.startsWith('ticketmodal_')) return;

        const type = interaction.customId.split('_')[1];

        const guild = interaction.guild;

        const reason = interaction.fields.getTextInputValue('reason');

        let categoryName = '';
        let channelName = '';

        if (type === 'pomoc') {

            categoryName = 'POMOC';
            channelName = `pomoc-${interaction.user.username}`;
        }

        if (type === 'klan') {

            categoryName = 'DOŁĄCZANIE';
            channelName = `klan-${interaction.user.username}`;
        }

        if (type === 'inne') {

            categoryName = 'INNE';
            channelName = `inne-${interaction.user.username}`;
        }

        let category = guild.channels.cache.find(
            c =>
                c.type === ChannelType.GuildCategory &&
                c.name === categoryName
        );

        if (!category) {

            category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory
            });
        }

        const existing = guild.channels.cache.find(
            c => c.name === channelName
        );

        if (existing) {

            return interaction.reply({
                content: 'Masz już ticket!',
                ephemeral: true
            });
        }

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,

            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },

                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                },

                {
                    id: ADMIN_ROLE,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                }
            ]
        });

        const closeButton = new ButtonBuilder()
            .setCustomId(`close_${channel.id}`)
            .setLabel('Zamknij ticket')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(
                type === 'pomoc'
                    ? 'POMOC'
                    : type === 'klan'
                    ? 'DOŁĄCZANIE'
                    : 'INNE'
            )
            .setDescription(
`${interaction.user}
<@&${ADMIN_ROLE}>

📌 Powód:
${reason}`
            );

        await channel.send({
            embeds: [embed],	
            components: [row]
        });

        interaction.reply({
            content: `Ticket utworzony: ${channel}`,
            ephemeral: true
        });
    }
});

client.login(TOKEN);