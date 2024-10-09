let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

function shortenSongName(song, wordLimit = 4) {
  // Define words to exclude
  const excludeWords = ["new", "video", "vid", "song"];

  // Remove unwanted patterns using regex

  const cleanedSong = song
    .replace(/_320\(PagalWorld\.com\.sb\)/i, '')
    .replace(/\(PagalWorld\)/gi, '')
    .replace(/\(Exclusive\)/gi, '')
    .replace(/%26/gi, '')
    .replace(/%2C.../gi, '')
    .replace(/Full Song/gi, '')
    .replace(/Full Video_/gi, '')
    .replace(/bollywood_/gi, '')
    .replace(/\(Full Video\)/gi, '')
    .replace(/\(Music Video\)/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .trim();
  // Split the cleaned song name into words, excluding unwanted words and empty strings
  let words = cleanedSong.split(" ")
    .filter(word => word.trim() !== "" && !excludeWords.includes(word.toLowerCase()));

  // Limit to the specified number of words
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(" "); // Append "..." to indicate truncation
  }
  return words.join(" ");
}

async function getSongs(folder) {
  currFolder = folder;

  try {
    let response = await fetch(`${folder}/`);
    let text = await response.text();

    let div = document.createElement('div');
    div.innerHTML = text;
    let as = div.getElementsByTagName('a');
    songs = [];

    for (let element of as) {
      if (element.href.endsWith('.mp3')) {
        songs.push(element.href.split(`/${folder}/`)[1]);
      }
    }

    // Show all the songs in the playlist 
    let songUl = document.querySelector('.songList').getElementsByTagName('ul')[0];
    songUl.innerHTML = ""; // Clear previous song list
    for (const song of songs) {
      let decodedSongName = decodeURIComponent(song.replaceAll("%20", " "));

      let shortenedSongName = shortenSongName(decodedSongName, 4); // Limit to 4 words

      songUl.innerHTML += `
        <li>
          <img class="invert" src="img/music.svg" alt="">
          <div class="info">
            <div>${shortenedSongName}</div>
            <div></div>
          </div>
          <div class="playnow">
            <span>Play NOW</span>
            <img class="invert play-icon" src="img/play.svg" alt="">
              <img class="invert song-playing-gif" src="gif/player.gif" alt="Playing GIF" style="display:none;">
          </div>
        </li>`;
    }
    // Attach an event listener to each song 
    Array.from(document.querySelector('.songList').getElementsByTagName('li')).forEach(e => {
      e.addEventListener('click', () => {
        const fullSongName = e.querySelector('.info').firstElementChild.innerHTML.trim();
        const originalSongName = songs.find(song =>
          shortenSongName(decodeURIComponent(song.replaceAll("%20", " ")), 4) === fullSongName
        );
        playMusic(originalSongName);
      });
    });
  } catch (error) {
    console.error("Error fetching songs:", error);

  }
}
const playMusic = (track, pause = false) => {

  // If the song is new (different track), load it, otherwise continue where paused
  if (currentSong.src.split('/').pop() !== track) {
    currentSong.src = `/${currFolder}/` + track;
    currentSong.currentTime = 0; // Reset time only for new songs
  }

  const songListItems = Array.from(document.querySelectorAll('.songList li'));

  // Reset all song list items (hide GIF, show play icon)
  songListItems.forEach(item => {
    const gif = item.querySelector('.song-playing-gif');
    const playIcon = item.querySelector('.play-icon');

    if (gif) gif.style.display = 'none';
    if (playIcon) playIcon.style.display = 'block';
  });

  if (!pause) {
    currentSong.play();
    play.src = 'img/pause.svg';

    // Find the correct list item for the current track
    const songListItem = songListItems.find(e =>
      shortenSongName(decodeURIComponent(e.querySelector('.info').firstElementChild.innerHTML.trim()), 4) === shortenSongName(decodeURIComponent(track), 4)
    );

    // Show the GIF and hide the play icon for the currently playing song
    const gif = songListItem.querySelector('.song-playing-gif');
    const playIcon = songListItem.querySelector('.play-icon');

    if (gif) gif.style.display = 'block';
    if (playIcon) playIcon.style.display = 'none';
  } else {
    currentSong.pause();
    play.src = 'img/play.svg';

    // Reset all (hide GIF, show play icon)
    const songListItem = songListItems.find(e =>
      shortenSongName(decodeURIComponent(e.querySelector('.info').firstElementChild.innerHTML.trim()), 4) === shortenSongName(decodeURIComponent(track), 4)
    );

    // Show play icon and hide the GIF
    const gif = songListItem.querySelector('.song-playing-gif');
    const playIcon = songListItem.querySelector('.play-icon');

    if (gif) gif.style.display = 'none';
    if (playIcon) playIcon.style.display = 'block';
  }

  currentSong.onended = () => {
    let index = songs.indexOf(track); // Get the current song's index
    if (index + 1 < songs.length) {
      // Play the next song if there is one
      playMusic(songs[index + 1]);
    } else {
      // If it's the last song, loop back to the first song or stop
      playMusic(songs[0], false);
    }
  };

  document.querySelector('.songinfo').innerHTML = shortenSongName(decodeURI(track), 4); // Show shortened song name
  document.querySelector('.songtime').innerHTML = "00:00 / 00:00";
};


async function displayAlbums() {
  let response = await fetch(`song/`);
  let text = await response.text();
  let div = document.createElement('div');
  div.innerHTML = text;
  let anchors = div.getElementsByTagName('a');
  let cardContainer = document.querySelector('.cardContainer');

  for (let e of anchors) {
    if (e.href.includes("/song/") && !e.href.includes("htaccess")) {
      let folder = (e.href.split('/').slice(-2)[1]);

      // Get the metadata of the folder 
      let metaResponse = await fetch(`song/${folder}/info.json`);
      let responseData = await metaResponse.json();

      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <img src="img/play.svg" alt="" />
          </div>
          <img src="/song/${folder}/cover.jpg" alt="">
          <h2>${responseData.title}</h2>
          <p>${responseData.description}</p>
        </div>`;
    }
  }

  // Load the playlist whenever a card is clicked 

  Array.from(document.getElementsByClassName('card')).forEach(e => {
    e.addEventListener("click", async () => {
      await getSongs(`song/${e.dataset.folder}`);
    });
  });
}

async function main() {
  await getSongs("song/quran");  // Load initial songs
  playMusic(songs[0], true);    // Play the first song

  displayAlbums();  // Display all albums

  // Attach event listeners for play, next, and previous

  play.addEventListener('click', () => {
    if (currentSong.paused) {
      playMusic(currentSong.src.split('/').pop());
    } else {
      playMusic(currentSong.src.split('/').pop(), true);
    }
  });


  //   // Space bar event for play/pause
  // document.addEventListener('keydown', (event) => {
  //   if (event.code === 'Space' || event.code==='keyK') {
  //     event.preventDefault();
  //     if (currentSong.paused) {
  //       playMusic(currentSong.src.split('/').pop());
  //     } else {
  //       playMusic(currentSong.src.split('/').pop(), true);
  //     }
  //   }
  // });

  // Add an event listener for the space bar and keyk to play/pause the music key down and keyup to updatye the volume 

  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        event.preventDefault(); // Prevent the default space bar scroll behavior
        play.click(); // Simulate a click on the play button
        break;
      case 'ArrowRight':
        event.preventDefault();
        currentSong.currentTime = Math.min(currentSong.currentTime + 10, currentSong.duration); // Move forward 10 seconds
        break;
      case 'ArrowLeft':
        event.preventDefault();
        currentSong.currentTime = Math.max(currentSong.currentTime - 10, 0); // Move backward 10 seconds
        break;
      case 'ArrowUp':
        event.preventDefault();
        currentSong.volume = Math.min(currentSong.volume + 0.05, 1); // Increase volume by 0.05 (5%)
        document.querySelector('.range').getElementsByTagName('input')[0].value = Math.round(currentSong.volume * 100); // Update volume slider
        if (currentSong.volume > 0.0) {
          document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        currentSong.volume = Math.max(currentSong.volume - 0.10, 0); // Decrease volume by 0.10 (10%)
        document.querySelector('.range').getElementsByTagName('input')[0].value = Math.round(currentSong.volume * 100); // Update volume slider
        if (currentSong.volume === 0) {
          document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg");
        }
        break;

      case 'KeyK':
        event.preventDefault();
        event.preventDefault(); // Prevent the default space bar scroll behavior
        play.click(); // Simulate a click on the play button
        break;
    }
  });

  // Listen for timeupdate event 

  currentSong.addEventListener('timeupdate', () => {
    document.querySelector('.songtime').innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector('.circle').style.left = (currentSong.currentTime / currentSong.duration) * 100 + '%';
  });

  // Add an event listener to the seek bar 
  document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener to hamburger
  document.querySelector('.hamburger').addEventListener('click', () => {
    document.querySelector('.left').style.left = '0';
  });

  // Add an event listener to close
  document.querySelector('.close').addEventListener('click', () => {
    document.querySelector('.left').style.left = '-130%';
  });

  // Add an event listener to previous 
  previous.addEventListener('click', () => {
    let index = songs.indexOf(currentSong.src.split('/').slice(-1)[0]);
    if ((index - 1) >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener to next 
  next.addEventListener('click', () => {
    let index = songs.indexOf(currentSong.src.split('/').slice(-1)[0]);
    if ((index + 1) < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event listener to volume 
  document.querySelector('.range').getElementsByTagName('input')[0].addEventListener('change', (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
      document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
    }
    else {
      document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg");

    }
  });

  // Add event listener to mute the track

  document.querySelector(".volume>img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = .10; // Set to a reasonable default
      document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }
  });
}

main();
