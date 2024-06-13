document.addEventListener('DOMContentLoaded', () => {
    let currentSong = new Audio(); // Create an audio object to play one song at a time
    const playButton = document.querySelector('#playsong');
    const prevButton = document.querySelector('#prevsong');
    const nextButton = document.querySelector('#nextsong');
    let songTimeDisplay = document.querySelector('.songTime');
    let seekbarFill = document.querySelector('.seekbarFill');
    let seekbar = document.querySelector('.seekbar');
    const hamburgerMenu = document.querySelector('.hamburger');
    const closeButton = document.querySelector(".close");
    let songs = [];
    let volumeControl = document.querySelector('.range').getElementsByTagName('input')[0];
    let muteButton = document.getElementById('mute');
    let folder = "Diljit";
    let cardContainer = document.querySelector('.cardContainer');

    async function getSongs() {
        try {
            let response = await fetch(`/songs/${folder}/`);
            let htmlContent = await response.text();

            let div = document.createElement('div');
            div.innerHTML = htmlContent;
            let anchorTags = div.getElementsByTagName('a');
            songs = [];

            for (let index = 0; index < anchorTags.length; index++) {
                let element = anchorTags[index];
                if (element.href.endsWith('.opus')) {
                    let songName = decodeURIComponent(element.href.split(`/songs/${folder}/`)[1]).replace('.opus', '');
                    songs.push(songName);
                }
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
        }
    }

    function playMusic(songName, pause = false) {
        currentSong.pause();
        if (!songName) {
            console.error('Song name is undefined');
            return;
        }

        const audioSrc = `/songs/${folder}/${encodeURIComponent(songName)}.opus`;
        currentSong.src = audioSrc;
        if (!pause) {
            currentSong.play();
        }

        document.querySelector('.songInfo').innerHTML = songName;
        songTimeDisplay.innerHTML = `00:00/00:00`;
    }

    async function displayAlbums() {
        try {
            let response = await fetch(`/songs`);
            let htmlContent = await response.text();

            let div = document.createElement('div');
            div.innerHTML = htmlContent;

            let links = div.querySelectorAll('a');
            cardContainer.innerHTML = ''; // Clear the card container

            for (const link of links) {
                if (link.href.includes('/songs')) {
                    let albumFolder = link.href.split('/').slice(-2, -1)[0];

                    try {
                        let metaDataResponse = await fetch(`/songs/${albumFolder}/info.json`);
                        if (!metaDataResponse.ok) {
                            throw new Error(`Failed to fetch metadata for ${albumFolder}: ${metaDataResponse.statusText}`);
                        }

                        let metaData = await metaDataResponse.json();
                        let cardHTML = `
                            <div data-folder="${albumFolder}" class="card curve">
                                <div class="play">
                                    <img class="play-green" src="/images/play-button-green-icon.svg" alt="play">
                                </div>
                                <img class="background-image" src="/songs/${albumFolder}/cover.jpg" alt="${metaData.title}">
                                <h2>${metaData.title}</h2>
                                <p>${metaData.description}</p>
                            </div>
                        `;
                        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
                    } catch (error) {
                        console.error('Error fetching metadata:', error);
                    }
                }
            }

            attachCardEventListeners(); // Attach event listeners to cards
        } catch (error) {
            console.error('Error displaying albums:', error);
        }
    }

    function updateSongListUI() {
        let songsList = document.querySelector('.listItems');
        songsList.innerHTML = "";

        function addSongList(songName) {
            const li = document.createElement('li');
            li.innerHTML = `
                <img class="invert" src="/images/music.svg" alt="icon">
                <div class="info">
                    <div>${songName}</div>
                    <div>${folder}</div>
                </div>
                <div class="playnow">
                    <img class="invert" src="/images/play.svg" alt="play">
                </div>
            `;
            songsList.appendChild(li);
        }

        songs.forEach(song => addSongList(song));
        attachSongListEventListeners(); // Attach event listeners to the song list
    }

    function attachSongListEventListeners() {
        Array.from(document.querySelector('.listItems').getElementsByTagName('li')).forEach(element => {
            element.addEventListener('click', () => {
                let songName = element.querySelector('.info').firstElementChild.innerHTML.trim();
                playMusic(songName);
            });
        });
    }

    function attachCardEventListeners() {
        Array.from(document.querySelectorAll('.card')).forEach((card) => {
            card.addEventListener('click', async () => {
                folder = card.dataset.folder;
                await getSongs();
                updateSongListUI(); // Update the UI with new songs
                if (songs.length > 0) {
                    playMusic(songs[0], true);
                }
            });
        });
    }

    async function main() {
        await getSongs();
        await displayAlbums();
        updateSongListUI();

        if (currentSong.src === '') {
            playButton.src = '/images/play.svg';
            playMusic(songs[2], true);
        } else {
            playButton.src = '/images/pause.svg';
        }

        //------------------------------------Events---------------------------------------------

        currentSong.addEventListener('play', function () {
            playButton.src = '/images/pause.svg';
        });

        currentSong.addEventListener('pause', function () {
            playButton.src = '/images/play.svg';
        });

        playButton.addEventListener('click', function () {
            if (currentSong.paused) {
                currentSong.play();
                playButton.src = '/images/pause.svg';
            } else {
                currentSong.pause();
                playButton.src = '/images/play.svg';
            }
        });

        function secondsToMinutesSeconds(totalSeconds) {
            if (isNaN(totalSeconds) || totalSeconds < 0) {
                console.error('Invalid song duration');
                return '00:00';
            }
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = Math.floor(totalSeconds % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        currentSong.addEventListener('timeupdate', function () {
            songTimeDisplay.innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
            seekbarFill.style.left = (currentSong.currentTime / currentSong.duration) * 100 + '%';
        });

        seekbar.addEventListener('click', (e) => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            seekbarFill.style.left = percent + '%';
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });

        hamburgerMenu.addEventListener('click', () => {
            const leftElement = document.querySelector('.left');
            leftElement.style.left = '0%';
        });

        closeButton.addEventListener('click', () => {
            const leftElement = document.querySelector('.left');
            leftElement.style.left = '-100%';
        });

        prevButton.addEventListener('click', () => {
            let currentSongFilename = decodeURIComponent(currentSong.src.split('/').pop()).replace('.opus', '');
            let index = songs.indexOf(currentSongFilename);
            if (index > 0) {
                playMusic(songs[index - 1]);
            }
        });

        nextButton.addEventListener('click', () => {
            let currentSongFilename = decodeURIComponent(currentSong.src.split('/').pop()).replace('.opus', '');
            let index = songs.indexOf(currentSongFilename);
            if (index !== -1 && index < songs.length - 1) {
                playMusic(songs[index + 1]);
            } else if (index === songs.length - 1) {
                playMusic(songs[0]);
            }
        });

        volumeControl.addEventListener('change', (e) => {
            currentSong.volume = e.target.value / 100;
            muteButton.src = currentSong.volume === 0 ? "/images/mute.svg" : "/images/volume.svg";
        });

        muteButton.addEventListener('click', (e) => {
            if (currentSong.volume !== 0) {
                currentSong.volume = 0;
                e.target.src = '/images/mute.svg';
            } else {
                currentSong.volume = volumeControl.value / 100;
                e.target.src = '/images/volume.svg';
            }
        });
    }

    main();
});
