const YOUTUBE_API_KEY = "AIzaSyBp2qY_kbd4Gei70yoh3wVdycGUstSQCww"; 
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const DEFAULT_QUERIES = ["latest bollywood songs 2024", "punjabi hip hop", "lofi chill india"];

const FALLBACK_SONGS = [
    { id: "jfKfPfyJRdk", title: "Lofi Girl - chill beats", artist: "Lofi Girl", thumbnail: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg" },
    { id: "5qap5aO4i9A", title: "Lofi Hip Hop Mix", artist: "ChilledCow", thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg" },
    { id: "DWcJFNfaw9c", title: "Bollywood Lofi Mix", artist: "T-Series", thumbnail: "https://img.youtube.com/vi/DWcJFNfaw9c/hqdefault.jpg" },
    { id: "VAdGW7QDJiU", title: "Arijit Singh Mashup", artist: "Music Cafe", thumbnail: "https://img.youtube.com/vi/VAdGW7QDJiU/hqdefault.jpg" }
];

const AppState = {
    player: null, isPlaying: false, currentSong: null, 
    currentPlaylist: [], originalPlaylist: [], 
    currentIndex: 0, isPlayerReady: false, searchResults: [],
    favorites: [], recentlyPlayed: [],
    isShuffled: false, repeatMode: 0 
};

const DOM = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    loadFromStorage();
    setupEventListeners();
    loadTrendingSongs();
    updateLibraryUI();
    
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        if(splash) splash.style.opacity = '0';
        setTimeout(() => {
            if(splash) splash.style.display = 'none';
            if(app) { app.classList.remove('hidden'); app.style.display = 'block'; }
        }, 500);
    }, 1500);
});

window.onYouTubeIframeAPIReady = function() {
    AppState.player = new YT.Player('youtubePlayerContainer', {
        height: '1', width: '1', videoId: '',
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, origin: window.location.origin },
        events: {
            onReady: () => { AppState.isPlayerReady = true; },
            onStateChange: onPlayerStateChange,
            onError: (e) => {
                setTimeout(() => playNext(), 1500);
            }
        }
    });
};

function cacheDOMElements() {
    DOM.navItems = document.querySelectorAll('.bottom-nav .nav-item');
    DOM.pages = document.querySelectorAll('.page');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.searchClear = document.getElementById('searchClear');
    DOM.searchResults = document.getElementById('searchResults');
    DOM.trendingSongs = document.getElementById('trendingSongs');
    
    DOM.miniPlayer = document.getElementById('miniPlayer');
    DOM.fullscreenPlayer = document.getElementById('fullscreenPlayer');
    DOM.playPauseBtn = document.getElementById('playPauseBtn');
    DOM.miniPlayBtn = document.getElementById('miniPlayBtn');
    
    DOM.playerProgressContainer = document.getElementById('playerProgressContainer');
    DOM.miniProgressContainer = document.getElementById('miniProgressContainer');
    DOM.playerProgressBar = document.getElementById('playerProgressFill');
    DOM.miniProgressBar = document.getElementById('miniProgressFill');
    DOM.currentTime = document.getElementById('currentTime');
    DOM.totalTime = document.getElementById('totalTime');
    
    DOM.profileBtn = document.getElementById('profileBtn');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarOverlay = document.getElementById('sidebarOverlay');
    DOM.sidebarClose = document.getElementById('sidebarClose');
    
    DOM.favoritesList = document.getElementById('favoritesList');
    DOM.recentlyPlayed = document.getElementById('recentlyPlayed');
    DOM.miniFavoriteBtn = document.getElementById('miniFavoriteBtn');
    DOM.playerFavoriteBtn = document.getElementById('playerFavoriteBtn');
    
    DOM.shuffleBtn = document.getElementById('shuffleBtn');
    DOM.repeatBtn = document.getElementById('repeatBtn');

    DOM.menuSettings = document.getElementById('menuSettings');
    DOM.menuTheme = document.getElementById('menuTheme');
    DOM.menuEqualizer = document.getElementById('menuEqualizer');
    DOM.menuAbout = document.getElementById('menuAbout');
    DOM.playerOptionsBtn = document.getElementById('playerOptionsBtn');
}

function loadFromStorage() {
    try {
        if(localStorage.getItem('playbyujjwal_fav')) AppState.favorites = JSON.parse(localStorage.getItem('playbyujjwal_fav'));
        if(localStorage.getItem('playbyujjwal_rec')) AppState.recentlyPlayed = JSON.parse(localStorage.getItem('playbyujjwal_rec'));
    } catch (e) {}
}

function saveToStorage() {
    localStorage.setItem('playbyujjwal_fav', JSON.stringify(AppState.favorites));
    localStorage.setItem('playbyujjwal_rec', JSON.stringify(AppState.recentlyPlayed.slice(0, 20)));
}

// FIXED: Theme Switcher uses the new CSS classes to protect the design
let isLightMode = false;
function toggleTheme() {
    isLightMode = !isLightMode;
    const themeBtn = document.getElementById('menuTheme');

    if(isLightMode) {
        document.body.classList.add('light-mode');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Theme (Active)';
        themeBtn.classList.add('active-toggle');
    } else {
        document.body.classList.remove('light-mode');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Theme (Active)';
        themeBtn.classList.remove('active-toggle');
    }
}

function setupEventListeners() {
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            DOM.navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            DOM.pages.forEach(p => p.classList.remove('active'));
            const page = document.getElementById(item.dataset.page + 'Page');
            if (page) page.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if(item.dataset.page === 'playlists') updateLibraryUI();
        });
    });

    DOM.profileBtn?.addEventListener('click', () => {
        DOM.sidebar.classList.add('active');
        DOM.sidebarOverlay.classList.add('active');
    });
    const closeSidebar = () => {
        DOM.sidebar.classList.remove('active');
        DOM.sidebarOverlay.classList.remove('active');
    };
    DOM.sidebarClose?.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay?.addEventListener('click', closeSidebar);

    DOM.menuSettings?.addEventListener('click', () => alert("⚙️ Settings coming soon!"));
    DOM.menuTheme?.addEventListener('click', toggleTheme);
    DOM.menuEqualizer?.addEventListener('click', () => alert("🎚️ Equalizer in next update!"));
    DOM.menuAbout?.addEventListener('click', () => alert("🎧 PlayByUjjwal\nCreated by Ujjwal Sharma (@StackByUjjwal)\nVersion: 1.0.2"));

    document.getElementById('miniSongInfo')?.addEventListener('click', () => DOM.fullscreenPlayer?.classList.add('active'));
    document.getElementById('collapsePlayerBtn')?.addEventListener('click', () => DOM.fullscreenPlayer?.classList.remove('active'));

    DOM.playerOptionsBtn?.addEventListener('click', () => {
        if(!AppState.currentSong) return;
        const link = `https://youtube.com/watch?v=${AppState.currentSong.id}`;
        navigator.clipboard.writeText(link).then(() => {
            alert("🔗 Song ka YouTube Link Copy ho gaya!\n" + link);
        });
    });

    DOM.playPauseBtn?.addEventListener('click', togglePlayPause);
    DOM.miniPlayBtn?.addEventListener('click', togglePlayPause);
    document.getElementById('nextBtn')?.addEventListener('click', playNext);
    document.getElementById('prevBtn')?.addEventListener('click', playPrevious);
    
    DOM.miniFavoriteBtn?.addEventListener('click', toggleFavorite);
    DOM.playerFavoriteBtn?.addEventListener('click', toggleFavorite);

    DOM.shuffleBtn?.addEventListener('click', toggleShuffle);
    DOM.repeatBtn?.addEventListener('click', toggleRepeat);

    DOM.playerProgressContainer?.addEventListener('click', handleSeek);
    DOM.miniProgressContainer?.addEventListener('click', handleSeek);

    let searchTimeout;
    DOM.searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (DOM.searchClear) DOM.searchClear.style.display = query ? 'block' : 'none';
        if(query) searchTimeout = setTimeout(() => executeSearch(query), 800);
    });
    
    DOM.searchClear?.addEventListener('click', () => {
        DOM.searchInput.value = ''; 
        DOM.searchClear.style.display = 'none';
        if (DOM.searchResults) DOM.searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-search empty-icon"></i><p>Search something new...</p></div>';
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        AppState.isPlaying = true;
        updatePlayIcons('fa-pause');
        updateMediaSessionState('playing');
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
        AppState.isPlaying = false;
        updatePlayIcons('fa-play');
        updateMediaSessionState('paused');
    } else if (event.data === YT.PlayerState.ENDED) {
        handleSongEnd();
    }
}

function handleSongEnd() {
    if(AppState.repeatMode === 2) {
        AppState.player.seekTo(0);
        AppState.player.playVideo();
    } else {
        playNext();
    }
}

function togglePlayPause() {
    if (!AppState.player || !AppState.currentSong) return;
    AppState.isPlaying ? AppState.player.pauseVideo() : AppState.player.playVideo();
}

// FIXED: Next button completely synced with current playlist array
function playNext() {
    if (!AppState.currentPlaylist || AppState.currentPlaylist.length === 0) return;
    
    AppState.currentIndex++;
    if (AppState.currentIndex >= AppState.currentPlaylist.length) {
        AppState.currentIndex = 0; // Seamless looping
    }
    
    let nextSong = AppState.currentPlaylist[AppState.currentIndex];
    if (nextSong) playSong(nextSong.id, false); 
}

// FIXED: Previous button logic synced
function playPrevious() {
    if (!AppState.currentPlaylist || AppState.currentPlaylist.length === 0) return;
    
    if(AppState.player && typeof AppState.player.getCurrentTime === 'function' && AppState.player.getCurrentTime() > 3) {
        AppState.player.seekTo(0);
        return;
    }
    
    AppState.currentIndex--;
    if (AppState.currentIndex < 0) {
        AppState.currentIndex = AppState.currentPlaylist.length - 1; 
    }
    
    let prevSong = AppState.currentPlaylist[AppState.currentIndex];
    if(prevSong) playSong(prevSong.id, false);
}

function toggleShuffle() {
    AppState.isShuffled = !AppState.isShuffled;
    DOM.shuffleBtn.classList.toggle('active', AppState.isShuffled);
    if (AppState.isShuffled) {
        AppState.originalPlaylist = [...AppState.currentPlaylist];
        const currentSong = AppState.currentPlaylist[AppState.currentIndex];
        let remaining = AppState.currentPlaylist.filter(s => s.id !== currentSong.id);
        remaining = remaining.sort(() => Math.random() - 0.5);
        AppState.currentPlaylist = [currentSong, ...remaining];
        AppState.currentIndex = 0;
    } else {
        const currentSong = AppState.currentPlaylist[AppState.currentIndex];
        AppState.currentPlaylist = [...AppState.originalPlaylist];
        AppState.currentIndex = AppState.currentPlaylist.findIndex(s => s.id === currentSong.id);
    }
}

function toggleRepeat() {
    AppState.repeatMode = (AppState.repeatMode + 1) % 3;
    DOM.repeatBtn.classList.toggle('active', AppState.repeatMode > 0);
    if (AppState.repeatMode === 2) {
        DOM.repeatBtn.innerHTML = `<i class="fas fa-redo-alt"></i><span style="font-size:8px; position:absolute; top:12px;">1</span>`;
    } else {
        DOM.repeatBtn.innerHTML = `<i class="fas fa-redo"></i>`;
    }
}

window.playSong = function(songId, defineNewPlaylist = true) {
    let song;
    
    if (defineNewPlaylist) {
        const searchSource = AppState.searchResults;
        const trendingSource = document.getElementById('homePage').classList.contains('active') ? AppState.originalPlaylist : [];
        const favSource = AppState.favorites;
        const recSource = AppState.recentlyPlayed;
        
        let allSongs = [...trendingSource, ...searchSource, ...favSource, ...recSource, ...AppState.currentPlaylist, ...AppState.originalPlaylist];
        song = allSongs.find(s => s.id === songId);
        
        if(!song) return;

        if(AppState.searchResults.some(s => s.id === songId)) AppState.currentPlaylist = [...AppState.searchResults];
        else if(AppState.favorites.some(s => s.id === songId)) AppState.currentPlaylist = [...AppState.favorites];
        else if(AppState.recentlyPlayed.some(s => s.id === songId)) AppState.currentPlaylist = [...AppState.recentlyPlayed];
        else AppState.currentPlaylist = [...AppState.originalPlaylist];
        
        AppState.originalPlaylist = [...AppState.currentPlaylist];
        AppState.currentIndex = AppState.currentPlaylist.findIndex(s => s.id === songId);
        if(AppState.currentIndex === -1) AppState.currentIndex = 0;
        
        if(AppState.isShuffled) {
            let remaining = AppState.currentPlaylist.filter(s => s.id !== song.id).sort(() => Math.random() - 0.5);
            AppState.currentPlaylist = [song, ...remaining];
            AppState.currentIndex = 0;
        }
    } else {
        song = AppState.currentPlaylist.find(s => s.id === songId) || AppState.currentPlaylist[AppState.currentIndex];
        if(!song) return;
    }
    
    AppState.currentSong = song;
    AppState.recentlyPlayed = [song, ...AppState.recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 20);
    saveToStorage();
    
    if(AppState.isPlayerReady && AppState.player.loadVideoById) {
        AppState.player.loadVideoById(songId);
        AppState.player.playVideo();
    } else {
        setTimeout(() => playSong(songId, false), 500);
    }
    
    if (DOM.miniPlayer) DOM.miniPlayer.classList.add('visible');
    
    document.getElementById('playerTitle').textContent = song.title;
    document.getElementById('playerArtist').textContent = song.artist;
    document.getElementById('miniTitle').textContent = song.title;
    document.getElementById('miniArtist').textContent = song.artist;
    if(song.thumbnail) {
        document.getElementById('albumArtImg').src = song.thumbnail;
        const miniThumb = document.getElementById('miniThumbnail');
        if (miniThumb) miniThumb.innerHTML = `<img src="${song.thumbnail}">`;
        const blurBg = document.getElementById('bgBlur');
        if (blurBg) blurBg.style.backgroundImage = `url(${song.thumbnail})`;
    }
    updateFavoriteIcons();
    updateLibraryUI();
    setupMediaSession(song);
}

function handleSeek(e) {
    if (!AppState.player || typeof AppState.player.getDuration !== 'function') return;
    const clickX = e.offsetX; 
    const width = e.currentTarget.offsetWidth;
    let percentage = Math.max(0, Math.min(1, clickX / width));
    const duration = AppState.player.getDuration() || 0;
    if(duration > 0) AppState.player.seekTo(duration * percentage, true);
}

setInterval(() => {
    if (AppState.player && AppState.player.getCurrentTime && typeof AppState.player.getCurrentTime === 'function') {
        try {
            const current = AppState.player.getCurrentTime() || 0;
            const duration = AppState.player.getDuration() || 0;
            if (duration > 0) {
                const pct = (current / duration) * 100;
                if(DOM.miniProgressBar) DOM.miniProgressBar.style.width = pct + '%';
                if(DOM.playerProgressBar) DOM.playerProgressBar.style.width = pct + '%';
                if(DOM.currentTime) DOM.currentTime.textContent = formatTime(current);
                if(DOM.totalTime) DOM.totalTime.textContent = formatTime(duration);
            }
        } catch(e) {}
    }
}, 500);

function updatePlayIcons(iconClass) {
    if (DOM.playPauseBtn) DOM.playPauseBtn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    if (DOM.miniPlayBtn) DOM.miniPlayBtn.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

function formatTime(s) {
    const m = Math.floor(s/60);
    return `${m}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

function toggleFavorite(e) {
    if(e) e.stopPropagation();
    if (!AppState.currentSong) return;
    const song = AppState.currentSong;
    const exists = AppState.favorites.some(s => s.id === song.id);
    if (exists) AppState.favorites = AppState.favorites.filter(s => s.id !== song.id);
    else AppState.favorites.unshift(song);
    saveToStorage(); updateFavoriteIcons(); updateLibraryUI();
}

function updateFavoriteIcons() {
    if (!AppState.currentSong) return;
    const exists = AppState.favorites.some(s => s.id === AppState.currentSong.id);
    const iconClass = exists ? 'fas fa-heart' : 'far fa-heart';
    if(DOM.miniFavoriteBtn) {
        DOM.miniFavoriteBtn.innerHTML = `<i class="${iconClass}"></i>`;
        DOM.miniFavoriteBtn.style.color = exists ? 'var(--accent-secondary)' : '';
    }
    if(DOM.playerFavoriteBtn) {
        DOM.playerFavoriteBtn.innerHTML = `<i class="${iconClass}"></i>`;
        DOM.playerFavoriteBtn.style.color = exists ? 'var(--accent-secondary)' : '';
    }
}

async function loadTrendingSongs() {
    if (!DOM.trendingSongs) return;
    DOM.trendingSongs.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin empty-icon"></i></div>';
    try {
        const query = DEFAULT_QUERIES[Math.floor(Math.random()*DEFAULT_QUERIES.length)];
        const res = await fetch(`${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=10&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        
        if(data.error) throw new Error("API limits");
        
        const songs = data.items.map(item => ({
            id: item.id.videoId, title: decodeHtml(item.snippet.title), artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
        }));
        AppState.currentPlaylist = songs;
        AppState.originalPlaylist = [...songs];
        renderCards(DOM.trendingSongs, songs);
    } catch (e) {
        AppState.currentPlaylist = [...FALLBACK_SONGS];
        AppState.originalPlaylist = [...FALLBACK_SONGS];
        renderCards(DOM.trendingSongs, FALLBACK_SONGS);
    }
}

async function executeSearch(query) {
    if (!DOM.searchResults) return;
    DOM.searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin empty-icon"></i></div>';
    try {
        const res = await fetch(`${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query + ' audio')}&maxResults=15&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        
        if(data.error) throw new Error("API limits");
        
        const songs = data.items.map(item => ({
            id: item.id.videoId, title: decodeHtml(item.snippet.title), artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
        }));
        AppState.searchResults = songs;
        renderCards(DOM.searchResults, songs);
    } catch (e) {
        DOM.searchResults.innerHTML = `<p style="color:var(--accent-secondary); text-align:center;">API Limits Exhausted. Search unavailable.</p>`;
    }
}

function renderCards(container, songs) {
    if (!songs || songs.length === 0) {
        container.innerHTML = '<p class="empty-state">No songs found.</p>';
        return;
    }
    container.innerHTML = songs.map((song) => `
        <div class="song-card" onclick="playSong('${song.id}')">
            <div class="song-thumbnail"><img src="${song.thumbnail}" alt="art" loading="lazy"></div>
            <div class="song-info">
                <p class="song-title">${escapeHtml(song.title)}</p>
                <p class="song-artist">${escapeHtml(song.artist)}</p>
            </div>
        </div>
    `).join('');
}

function updateLibraryUI() {
    if(DOM.favoritesList) renderList(DOM.favoritesList, AppState.favorites, "Tap the heart on a song to add it here.");
    if(DOM.recentlyPlayed) renderList(DOM.recentlyPlayed, AppState.recentlyPlayed, "Start listening to see history here.");
}

function renderList(container, array, emptyMsg) {
    if(array.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding: 20px 0;"><p>${emptyMsg}</p></div>`;
        return;
    }
    container.innerHTML = array.map(song => `
        <div class="list-style" onclick="playSong('${song.id}')">
            <div class="list-thumb"><img src="${song.thumbnail}" loading="lazy"></div>
            <div class="list-details">
                <p class="song-title">${escapeHtml(song.title)}</p>
                <p class="song-artist">${escapeHtml(song.artist)}</p>
            </div>
            <button class="icon-btn" onclick="event.stopPropagation(); playSong('${song.id}')"><i class="fas fa-play" style="font-size: 0.9rem; color: var(--accent-secondary);"></i></button>
        </div>
    `).join('');
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function decodeHtml(html) { const txt = document.createElement("textarea"); txt.innerHTML = html; return txt.value; }

function setupMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            artwork: [
                { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
                { src: song.thumbnail.replace('hqdefault', 'mqdefault'), sizes: '320x180', type: 'image/jpeg' }
            ]
        });
        setupMediaSessionHandlers();
    }
}

function setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;
    
    const actionHandlers = [
        ['play', togglePlayPause],
        ['pause', togglePlayPause],
        ['previoustrack', playPrevious],
        ['nexttrack', playNext]
    ];

    for (const [action, handler] of actionHandlers) {
        try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) { }
    }
}

function updateMediaSessionState(state) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = state;
    }
}