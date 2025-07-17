let currentSong = new Audio();
let songs = [];
let currFolder;
let currentIndex = 0;

// Get button elements
let playBtnn = document.querySelector(".playbar-play");
let previousBtn = document.querySelector(".playbar-previous");
let nextBtn = document.querySelector(".playbar-next");
let time = document.querySelector(".time");
let seekbar = document.querySelector(".seekbar");
let circle = document.querySelector(".circle");
let volumeSeekbar = document.querySelector(".volume-seekbar");
let volumeCircle = document.querySelector(".volume-circle");

// Volume control
volumeSeekbar.addEventListener("click", (e) => {
  let percent = e.offsetX / volumeSeekbar.clientWidth;
  currentSong.volume = percent;
  volumeCircle.style.left = `${percent * 100}%`;
});

// Time display
function showTime(track) {
  track.addEventListener("timeupdate", function () {
    let s = Math.floor(track.currentTime % 60)
      .toString()
      .padStart(2, "0");
    let m = Math.floor(track.currentTime / 60)
      .toString()
      .padStart(2, "0");
    let totals = Math.floor(track.duration % 60)
      .toString()
      .padStart(2, "0");
    let totalm = Math.floor(track.duration / 60)
      .toString()
      .padStart(2, "0");
    time.innerText = `${m}:${s}/${totalm}:${totals}`;
  });
}

// Seekbar update
function updateSeekbar() {
  currentSong.addEventListener("timeupdate", () => {
    let progress = (currentSong.currentTime / currentSong.duration) * 100;
    circle.style.left = `${progress}%`;
  });
}

// Seekbar click
seekbar.addEventListener("click", (e) => {
  let percent = e.offsetX / seekbar.clientWidth;
  currentSong.currentTime = percent * currentSong.duration;
  circle.style.left = `${percent * 100}%`;
});

// Play/pause
playBtnn.addEventListener("click", function () {
  if (currentSong.paused) {
    currentSong.play();
    playBtnn.src = "pause.svg";
  } else {
    currentSong.pause();
    playBtnn.src = "play.svg";
  }
});

// Previous button
previousBtn.addEventListener("click", function () {
  if (currentIndex > 0) {
    currentIndex--;
    playMusicByIndex(currentIndex);
  }
});

// Next button
nextBtn.addEventListener("click", function () {
  if (currentIndex < songs.length - 1) {
    currentIndex++;
    playMusicByIndex(currentIndex);
  }
});

// Fetch songs from selected folder
async function getSongs(folder) {
  currFolder = folder;
  console.log("➡️ getSongs() called for folder:", folder);

  try {
    let response = await fetch(`/songs/${encodeURIComponent(folder)}/`);
    let data = await response.text();

    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = data;

    let anchors = tempDiv.getElementsByTagName("a");
    let tempSongs = [];

    for (let i = 0; i < anchors.length; i++) {
      let link = anchors[i].href;
      if (link.endsWith(".mp3")) {
        console.log("🎵 Found MP3:", link);
        tempSongs.push(link.split(`/${folder}/`)[1]);
      }
    }

    songs = tempSongs;
    console.log("✅ Total Songs Found:", songs.length);

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    songs.forEach((songURL, index) => {
      let songName = songURL.replace(".mp3", "");
      songUL.innerHTML += `
        <li data-index="${index}">
          <img src="music.svg" alt="" class="invert">
          <div class="info">
            <div>${songName}</div>
            <div>Tera Bhai</div>
          </div>
          <div class="playnow">
            <span>Play now</span>
            <img src="play.svg" alt="" class="invert">
          </div>
        </li>`;
    });

    document.querySelectorAll(".songList li").forEach((item) => {
      item.addEventListener("click", () => {
        currentIndex = parseInt(item.getAttribute("data-index"));
        playMusicByIndex(currentIndex);
      });
    });
  } catch (err) {
    console.error("❌ Error fetching songs:", err);
  }
}

// Play a song
function playMusicByIndex(index) {
  if (index >= 0 && index < songs.length) {
    let songPath = `/songs/${encodeURIComponent(
      currFolder
    )}/${encodeURIComponent(songs[index])}`;
    console.log("▶️ Playing song:", songPath);

    currentSong.src = songPath;
    currentSong.play();

    let songName = songs[index].replace(".mp3", "");
    document.querySelector(".title").innerText = songName;
    document.querySelector(".artist").innerText = "LALU badmash";

    showTime(currentSong);
    updateSeekbar();

    currentSong.onended = () => {
      if (currentIndex < songs.length - 1) {
        currentIndex++;
        playMusicByIndex(currentIndex);
      }
    };

    playBtnn.src = "pause.svg";
  }
}

// Display album cards
async function displayAlbums() {
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let array = Array.from(anchors);

  for (let i = 0; i < array.length; i++) {
    const e = array[i];

    if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
      let folder = e.href.split("/").filter(Boolean).pop();

      if (folder.toLowerCase() === "songs") continue;

      try {
        let res = await fetch(`/songs/${encodeURIComponent(folder)}/info.json`);
        let meta = await res.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                      stroke-linejoin="round" />
              </svg>
            </div>
            <img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="">
            <h2>${meta.title}</h2>
            <p>${meta.description}</p>
          </div>`;

        // Add click to ALL cards after they've been created
        document.querySelectorAll(".card").forEach((card) => {
          card.addEventListener("click", async () => {
            let folderName = card.getAttribute("data-folder");
            console.log("🟢 Clicked folder:", folderName);

            await getSongs(folderName);
            currentIndex = 0;
            playMusicByIndex(currentIndex);
          });
        });
      } catch (err) {
        console.warn(`⚠️ No info.json found for /songs/${folder}`);
      }
    }
  }
}

// Main entry
async function main() {
  await displayAlbums();
}

main();
