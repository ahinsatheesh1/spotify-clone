// Initialize audio player and global state
const initAudioPlayer = () => {
    if (!document.querySelector('audio')) {
        const audio = document.createElement('audio');
        audio.id = 'audio-player';
        document.body.appendChild(audio);
    }
    return document.getElementById('audio-player');
};

// Global state variables
const state = {
    audioPlayer: initAudioPlayer(),
    currentPlaylist: null,
    currentSongIndex: -1,
    isShuffled: false,
    repeatMode: 'none', // none, one, all
    lastVolume: 1 // Store the last volume level before muting
};

// Initialize UI elements after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Authentication Elements
    const authElements = {
        loginModal: document.getElementById('loginModal'),
        signupModal: document.getElementById('signupModal'),
        loginForm: document.getElementById('loginForm'),
        signupForm: document.getElementById('signupForm'),
        loginBtn: document.querySelector('.loginbtn'),
        signupBtn: document.querySelector('.signupbtn'),
        showLoginBtn: document.getElementById('showLogin'),
        showSignupBtn: document.getElementById('showSignup'),
        closeButtons: document.querySelectorAll('.close-modal')
    };

    // User state
    let currentUser = null;

    // Authentication Functions
    function showModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function hideAllModals() {
        authElements.loginModal.classList.remove('active');
        authElements.signupModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateUIForAuthState() {
        const authButtons = document.querySelector('.buttons');
        if (currentUser) {
            authButtons.innerHTML = `
                <button class="signupbtn" id="profileBtn">${currentUser.name}</button>
                <button class="loginbtn" id="logoutBtn">Log out</button>
            `;
            // Add event listener for logout
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        } else {
            authButtons.innerHTML = `
                <button class="signupbtn">Sign up</button>
                <button class="loginbtn">Log in</button>
            `;
            // Reattach event listeners
            attachAuthButtonListeners();
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Here you would typically validate against a backend
        // For demo purposes, we'll just simulate a successful login
        currentUser = {
            email: email,
            name: email.split('@')[0] // Use part of email as name for demo
        };

        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update UI
        updateUIForAuthState();
        hideAllModals();

        // Clear form
        e.target.reset();
    }

    function handleSignup(e) {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const name = document.getElementById('signupName').value;

        // Here you would typically send this to a backend
        // For demo purposes, we'll just simulate a successful signup
        currentUser = {
            email: email,
            name: name
        };

        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update UI
        updateUIForAuthState();
        hideAllModals();

        // Clear form
        e.target.reset();
    }

    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForAuthState();
    }

    function attachAuthButtonListeners() {
        const loginBtn = document.querySelector('.loginbtn');
        const signupBtn = document.querySelector('.signupbtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => showModal(authElements.loginModal));
        }
        if (signupBtn) {
            signupBtn.addEventListener('click', () => showModal(authElements.signupModal));
        }
    }

    // Event Listeners for Authentication
    authElements.loginForm.addEventListener('submit', handleLogin);
    authElements.signupForm.addEventListener('submit', handleSignup);
    authElements.showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(authElements.signupModal);
        showModal(authElements.loginModal);
    });
    authElements.showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(authElements.loginModal);
        showModal(authElements.signupModal);
    });
    authElements.closeButtons.forEach(button => {
        button.addEventListener('click', () => hideAllModals());
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('auth-modal')) {
            hideAllModals();
        }
    });

    // Check for existing user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForAuthState();
    }

    // Initial auth button listeners
    attachAuthButtonListeners();

    // UI Elements
    const elements = {
        playPauseButton: document.getElementById('playPause'),
        progressBar: document.getElementById('progress-bar'),
        currentTimeDisplay: document.getElementById('current-time'),
        durationDisplay: document.getElementById('duration'),
        songTitleDisplay: document.getElementById('song-title'),
        artistNameDisplay: document.getElementById('artist-name'),
        currentSongImage: document.getElementById('current-song-image'),
        volumeControl: document.getElementById('volume'),
        volumeIcon: document.querySelector('.volume-icon'),
        shuffleButton: document.getElementById('shuffle'),
        repeatButton: document.getElementById('repeat'),
        prevButton: document.getElementById('prev'),
        nextButton: document.getElementById('next')
    };

    // Helper Functions
function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    if (secs < 10) secs = '0' + secs;
    return `${minutes}:${secs}`;
}

    function updatePlayPauseButton() {
        if (elements.playPauseButton) {
            elements.playPauseButton.innerHTML = state.audioPlayer.paused ? 
                '<img src="images/play.svg" alt="Play">' : 
                '<img src="images/pause.svg" alt="Pause">';
        }
    }

    function updateVolumeIcon(volume) {
        if (!elements.volumeIcon) return;
        
        if (volume === 0) {
            elements.volumeIcon.src = 'images/volume-mute.svg';
        } else if (volume < 0.3) {
            elements.volumeIcon.src = 'images/volume-low.svg';
        } else if (volume < 0.7) {
            elements.volumeIcon.src = 'images/volume.svg';
        } else {
            elements.volumeIcon.src = 'images/volume-full.svg';
        }
    }

    function updateVolumeSlider(volume) {
        if (elements.volumeControl) {
            const percentage = volume * 100;
            elements.volumeControl.style.setProperty('--volume-percentage', `${percentage}%`);
        }
    }

    // Playback Functions
    async function loadPlaylistToLibrary(folder) {
        try {
            const response = await fetch(`songs/${folder}/info.json`);
            const data = await response.json();
            state.currentPlaylist = {...data, folder}; // Store folder name with playlist data
            
            // Update library section with playlist info
            const songList = document.querySelector('.song-list ul');
            songList.innerHTML = ''; // Clear current songs
            
            // Add playlist title to library header
            const libraryTitle = document.querySelector('.library-left h2');
            libraryTitle.textContent = data.title || folder;

            // Add songs to library
            if (data.songs && Array.isArray(data.songs)) {
                data.songs.forEach((song, index) => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <img src="songs/${folder}/${song.cover}" alt="${song.title}">
                        <div class="song-info">
                            <div class="song-title">${song.title}</div>
                            <div class="artist-name">${song.artist}</div>
                        </div>
                        <div class="song-duration">${song.duration}</div>
                    `;
                    li.setAttribute('data-index', index);
                    li.addEventListener('click', () => playSelectedSong(index));
                    songList.appendChild(li);
                });

                // Auto-play first song if no song is currently playing
                if (state.currentSongIndex === -1) {
                    playSelectedSong(0);
                }
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
        }
    }

    function playSelectedSong(index) {
        if (!state.currentPlaylist || !state.currentPlaylist.songs) return;
        
        state.currentSongIndex = index;
        const song = state.currentPlaylist.songs[index];
        
        // Update audio source
        state.audioPlayer.src = `songs/${state.currentPlaylist.folder}/${song.filename}`;
        
        // Update UI
        if (elements.songTitleDisplay) elements.songTitleDisplay.textContent = song.title;
        if (elements.artistNameDisplay) elements.artistNameDisplay.textContent = song.artist;
        if (elements.currentSongImage) {
            elements.currentSongImage.src = `songs/${state.currentPlaylist.folder}/${song.cover}`;
        }
        
        // Start playback
        state.audioPlayer.play()
            .then(() => updatePlayPauseButton())
            .catch(error => console.error('Playback failed:', error));
    }

    function playNext() {
        if (!state.currentPlaylist || !state.currentPlaylist.songs) return;
        
        let nextIndex;
        if (state.isShuffled) {
            nextIndex = Math.floor(Math.random() * state.currentPlaylist.songs.length);
        } else {
            nextIndex = (state.currentSongIndex + 1) % state.currentPlaylist.songs.length;
        }
        
        playSelectedSong(nextIndex);
    }

    function playPrevious() {
        if (!state.currentPlaylist || !state.currentPlaylist.songs) return;
        
        let prevIndex = (state.currentSongIndex - 1 + state.currentPlaylist.songs.length) % state.currentPlaylist.songs.length;
        playSelectedSong(prevIndex);
    }

    // Event Handlers
    function togglePlay() {
        if (state.audioPlayer.paused) {
            state.audioPlayer.play();
        } else {
            state.audioPlayer.pause();
        }
        updatePlayPauseButton();
    }

    function toggleShuffle() {
        state.isShuffled = !state.isShuffled;
        if (elements.shuffleButton) {
            elements.shuffleButton.classList.toggle('active');
        }
        if (state.isShuffled && elements.repeatButton) {
            elements.repeatButton.classList.remove('active');
            state.repeatMode = 'none';
        }
    }

    function toggleRepeat() {
        switch(state.repeatMode) {
            case 'none':
                state.repeatMode = 'one';
                if (elements.repeatButton) elements.repeatButton.classList.add('active');
                break;
            case 'one':
                state.repeatMode = 'all';
                if (elements.repeatButton) elements.repeatButton.classList.add('active');
                break;
            case 'all':
                state.repeatMode = 'none';
                if (elements.repeatButton) elements.repeatButton.classList.remove('active');
                break;
        }
    }

    function toggleMute() {
        if (state.audioPlayer.volume > 0) {
            state.lastVolume = state.audioPlayer.volume;
            state.audioPlayer.volume = 0;
            if (elements.volumeControl) elements.volumeControl.value = 0;
        } else {
            state.audioPlayer.volume = state.lastVolume;
            if (elements.volumeControl) elements.volumeControl.value = state.lastVolume * 100;
        }
        updateVolumeIcon(state.audioPlayer.volume);
        updateVolumeSlider(state.audioPlayer.volume);
    }

    // Event Listeners
    state.audioPlayer.addEventListener('timeupdate', () => {
        if (!elements.progressBar || !elements.currentTimeDisplay || !elements.durationDisplay) return;
        
        let currentTime = state.audioPlayer.currentTime;
        let duration = state.audioPlayer.duration;
        elements.progressBar.max = duration;
        elements.progressBar.value = currentTime;
        elements.currentTimeDisplay.textContent = formatTime(currentTime);
        elements.durationDisplay.textContent = formatTime(duration);
    });

    state.audioPlayer.addEventListener('ended', () => {
        if (state.repeatMode === 'one') {
            state.audioPlayer.currentTime = 0;
            state.audioPlayer.play();
        } else if (state.repeatMode === 'all' || state.isShuffled) {
            playNext();
        } else {
            playNext();
        }
    });

    if (elements.progressBar) {
        elements.progressBar.addEventListener('input', () => {
            state.audioPlayer.currentTime = elements.progressBar.value;
        });
    }

    if (elements.volumeControl) {
        elements.volumeControl.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            state.audioPlayer.volume = volume;
            updateVolumeIcon(volume);
            updateVolumeSlider(volume);
        });
    }

    if (elements.playPauseButton) {
        elements.playPauseButton.addEventListener('click', togglePlay);
    }

    if (elements.shuffleButton) {
        elements.shuffleButton.addEventListener('click', toggleShuffle);
    }

    if (elements.repeatButton) {
        elements.repeatButton.addEventListener('click', toggleRepeat);
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', playNext);
    }

    if (elements.prevButton) {
        elements.prevButton.addEventListener('click', playPrevious);
    }

    if (elements.volumeIcon) {
        elements.volumeIcon.addEventListener('click', toggleMute);
    }

    // Initialize volume controls
    updateVolumeIcon(state.audioPlayer.volume);
    updateVolumeSlider(state.audioPlayer.volume);

    // Set up playlist card click handlers
    document.querySelectorAll('.playlist-card, .quick-play-card').forEach(card => {
        const folder = card.getAttribute('data-folder');
        if (!folder) return;

        // Click handler for the entire card
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking the play button
            if (!e.target.closest('.play-button')) {
                loadPlaylistToLibrary(folder);
            }
        });

        // Click handler for the play button
        const playButton = card.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                loadPlaylistToLibrary(folder);
            });
        }
    });

    // Show All functionality
    document.querySelectorAll('.show-all').forEach((button, index) => {
        button.addEventListener('click', () => {
            const section = button.closest('.section');
            const sectionTitle = section.querySelector('h2').textContent;
            const fullPageView = sectionTitle === 'Jump back in' ? 
                document.getElementById('jumpBackFullView') : 
                document.getElementById('moreFullView');
            
            // Clone all playlist cards from the section
            const playlistGrid = fullPageView.querySelector('.full-page-grid');
            playlistGrid.innerHTML = ''; // Clear existing content
            
            const originalCards = section.querySelectorAll('.playlist-card');
            originalCards.forEach(card => {
                const clone = card.cloneNode(true);
                playlistGrid.appendChild(clone);
                
                // Reattach event listeners to cloned elements
                const playButton = clone.querySelector('.play-button');
                const folder = clone.dataset.folder;
                playButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadPlaylistToLibrary(folder);
                });
                
                clone.addEventListener('click', () => {
                    loadPlaylistToLibrary(folder);
                });
            });
            
            // Show the full page view
            fullPageView.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Back button functionality
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            const fullPageView = button.closest('.full-page-view');
            fullPageView.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close full page view when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.full-page-view').forEach(view => {
                view.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });

    // Update playbar UI with song information
    function updatePlaybarUI(song = null) {
        const songInfo = document.querySelector('.songinfo');
        const songTitle = document.getElementById('song-title');
        const artistName = document.getElementById('artist-name');
        const albumArt = document.getElementById('current-song-image');
        const progressBar = document.getElementById('progress-bar');
        const volumeControl = document.querySelector('.volume-control input[type="range"]');

        if (song) {
            songInfo.classList.remove('no-song');
            songTitle.textContent = song.title;
            artistName.textContent = song.artist;
            albumArt.src = song.coverUrl;
            progressBar.disabled = false;
            volumeControl.disabled = false;
        } else {
            songInfo.classList.add('no-song');
            songTitle.textContent = 'Choose a song';
            artistName.textContent = 'Select from your library';
            albumArt.src = 'images/default-album.svg';
            progressBar.disabled = true;
            volumeControl.disabled = true;
        }
        updatePlayPauseButton();
    }
});
