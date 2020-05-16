const fs = require('fs');
const codexFiles = fs
	.readdirSync('./Data/Codex')
	.filter((file) => file.endsWith('.pdf'));
const codices = [];

for (const file of codexFiles) {
	const name = file.replace('.pdf', '');
	codices.push(name);
}

module.exports = {
	name: 'codex',
	description:
		'Returns the codex entry for the specific character from the Campaign',
	usage: `<character name>\nThe following names are usable:\n${codices.join(
		', ',
	)}`,
	args: true,
	execute: function(message, args) {
		if (codices.includes(args[0])) {
			const bpnEmbed = {
				color: 0x0000ff,
				title: `Codex: ${args[0]}`,
				image: {
					url: `./Data/Codex/${args[0]}.pdf`,
				},
			};
			message.channel.send({ embed: bpnEmbed });
		}
		else {
			message.channel.send('Henrik, nej!');
		}
	},
};
