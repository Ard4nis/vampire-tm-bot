const Youtube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
// const { youtubeAPI } = require('../config.json');
const youtubeAPI = process.env.YOUTUBE_API;
const youtube = new Youtube(youtubeAPI);

const commands = ['play', 'skip', 'stop', 'playlist', 'start', 'pause']

module.exports = {
    name: 'mood',
    description:
        'The music playing command',
    usage: `<command> <song> To use this command you need to add the <command> needed to apply to the music and if play you need to include a link to the youtube song. The following commands are implemented: 
    ${commands.join(', ')}.`,
    args: true,
    execute: async function (message, args) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return message.channel.send(
                'You need to be in a voice channel to control the music!'
            )
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);

        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send(
                'I need the permissions to join and play in your voice channel!'
            )
        }

        const command = args[0]
        const songLink = args[1]

        if (command === 'play') {
            const songInfo = await ytdl.getInfo(songLink);
            const song = {
                title: songInfo.title,
                url: songInfo.video_url
            };

            if (!serverQueue) {

                const contract = createQueue(message, voiceChannel)
                contract.playing = true;
                contract.songs.push(song);

                try {
                    let connection = await voiceChannel.join();
                    contract.connection = connection;
                    play(message.guild, contract.songs[0])
                } catch (error) {
                    console.log(error);
                    queue.delete(message.guild.id);
                    return message.channel.send(error);
                }
            } else {
                serverQueue.songs.push(song);
                return message.channel.send(`${song.title} has been added to the queue!`);
            }
        } else if (command === 'playlist') {
            if (
                songLink.match(
                    /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/
                )
            ) {
                try {
                    const playlist = await youtube.getPlaylist(songLink);
                    const youtubeSongs = await playlist.getVideos();

                    youtubeSongs.forEach((ytSong) => {
                        const url = `https://www.youtube.com/watch?v=${ytSong.id}`;
                        const title = ytSong.raw.snippet.title;
                        const localServerQueue = queue.get(message.guild.id)
                        const song = {
                            title: title,
                            url: url
                        }

                        if (!localServerQueue) {
                            const contract = createQueue(message, voiceChannel);
                            contract.songs.push(song)
                        } else {
                            localServerQueue.songs.push(song)
                        }
                    })
                    return message.channel.send(`Playlist - :musical_note: ${playlist.title} :musical_note: has been added to the queue.`)
                } catch (error) {
                    console.error(error);
                    return message.channel.send('Playlist is either private or it does not exist');
                }
            }
        } else if (command === 'pause') {
            if (!serverQueue)
                return message.channel.send('There is no song playing right now!');

            serverQueue.connection.dispatcher.pause();

            return message.channel.send('Song paused :pause_button:');
        } else if (command === 'start') {
            if (!serverQueue)
                return message.channel.send('There is no song playing right now!');

            if (serverQueue.playing) {
                serverQueue.connection.dispatcher.resume()
                return message.channel.send('Song resumed :arrow_forward:');
            } else {
                try {
                    let connection = await voiceChannel.join();
                    serverQueue.connection = connection;
                    serverQueue.playing = true;
                    play(message.guild, serverQueue.songs[0])
                } catch (error) {
                    console.log(error);
                    queue.delete(message.guild.id);
                    return message.channel.send(error);
                }
            }
        } else if (command === 'skip') {
            if (!serverQueue)
                return message.channel.send('There is no song that I could skip!');

            const title = serverQueue.songs[0].title
            serverQueue.connection.dispatcher.end();

            return message.channel.send(`${title} was skipped!`)
        } else if (command === 'stop') {
            const amount = serverQueue.songs.length;
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();

            return message.channel.send(`${amount} songs were skipped and remove and I have stopped playback.`)
        } else {
            return message.channel.send('Henrik, nej!');
        }
    },
};

function play(guild, song) {

    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on('finish', () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error)
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0])
        });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Start playing: **${song.title}**`);

}

function createQueue(message, voiceChannel) {
    const queueContract = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 0.5,
        playing: false
    };

    queue.set(message.guild.id, queueContract);

    return queueContract;
}
