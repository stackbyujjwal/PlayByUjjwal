/* ============================================
   PLAYBYUJJWAL - MAIN JAVASCRIPT
   Complete Music Player Logic
   ============================================ */

const YOUTUBE_API_KEY = "AIzaSyBp2qY_kbd4Gei70yoh3wVdycGUstSQCww";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const DEFAULT_QUERIES = ["trending music 2024", "popular songs", "top hits", "viral music"];

const AppState = {
    player: null, isPlaying: false, currentSong: null, currentPlaylist: [], 
    currentIndex: 0, isShuffled: false, repeatMode: 0, volume: 70, isMuted: false,
    currentPage: 'home', sidebarOpen: false, fullscreenPlayer: false, lyricsOpen: false,
    searchQuery: '', searchResults: [], isSearching: false,
    favorites: [], playlists: [], recentlyPlayed: [], theme: 'dark'
};

const DOM = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    loadFromStorage();
    initializeApp();
    setupEventListeners();
    loadTrendingSongs();
    setTimeout(hideSplashScreen, 2500);
});

function cacheDOMElements() {
    DOM.splashScreen = document.getElementById('splash-screen');
    DOM.app = document.getElementById('app');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarClose = document.getElementById('sidebarClose');
    DOM.sidebarOverlay = document.getElementById('sidebarOverlay');
    DOM.menuToggle = document.getElementById('menuToggle');
    DOM.navItems = document.querySelectorAll('.nav-item');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.searchClear = document.getElementById('searchClear');
    DOM.pages = document.querySelectorAll('.page');
    DOM.pageContent = document.getElementById('pageContent');
    DOM.trendingSongs = document.getElementById('trendingSongs');
    DOM.popularAlbums = document.getElementById('popularAlbums');
    DOM.userPlaylists = document.getElementById('userPlaylists');
    DOM.recentlyPlayed = document.getElementById('recentlyPlayed');
    DOM.searchResults = document.getElementById('searchResults');
    DOM.favoritesList = document.getElementById('favoritesList');
    DOM.allPlaylists = document.getElementById('allPlaylists');
    DOM.allRecentlyPlayed = document.getElementById('allRecentlyPlayed');
    DOM.miniPlayer = document.getElementById('miniPlayer');
    DOM.miniThumbnail = document.getElementById('miniThumbnail');
    DOM.miniTitle = document.getElementById('miniTitle');
    DOM.miniArtist = document.getElementById('miniArtist');
    DOM.miniPlayBtn = document.getElementById('miniPlayBtn');
    DOM.miniPrevBtn = document.getElementById('miniPrevBtn');
    DOM.miniNextBtn = document.getElementById('miniNextBtn');
    DOM.miniFavoriteBtn = document.getElementById('miniFavoriteBtn');
    DOM.miniProgressBar = document.getElementById('miniProgressBar');
    DOM.miniProgressFill = document.getElementById('miniProgressFill');
    DOM.expandPlayerBtn = document.getElementById('expandPlayerBtn');
    DOM.miniSongInfo = document.getElementById('miniSongInfo');
    DOM.fullscreenPlayer = document.getElementById('fullscreenPlayer');
    DOM.collapsePlayerBtn = document.getElementById('collapsePlayerBtn');
    DOM.albumArtImg = document.getElementById('albumArtImg');
    DOM.playerTitle = document.getElementById('playerTitle');
    DOM.playerArtist = document.getElementById('playerArtist');
    DOM.playPauseBtn = document.getElementById('playPauseBtn');
    DOM.prevBtn = document.getElementById('prevBtn');
    DOM.nextBtn = document.getElementById('nextBtn');
    DOM.shuffleBtn = document.getElementById('shuffleBtn');
    DOM.repeatBtn = document.getElementById('repeatBtn');
    DOM.playerProgressBar = document.getElementById('playerProgressBar');
    DOM.playerProgressFill = document.getElementById('playerProgressFill');
    DOM.currentTime = document.getElementById('currentTime');
    DOM.totalTime = document.getElementById('totalTime');
    DOM.muteBtn = document.getElementById('muteBtn');
    DOM.volumeSlider = document.getElementById('volumeSlider');
    DOM.volumeFill = document.getElementById('volumeFill');
    DOM.lyricsBtn = document.getElementById('lyricsBtn');
    DOM.lyricsPanel = document.getElementById('lyricsPanel');
    DOM.closeLyrics = document.getElementById('closeLyrics');
    DOM.lyricsContent = document.getElementById('lyricsContent');
    DOM.playerFavoriteBtn = document.getElementById('playerFavoriteBtn');
    DOM.bgBlur = document.querySelector('.bg-blur');
    DOM.visualizerCanvas = document.getElementById('visualizerCanvas');
    DOM.playlistModal = document.getElementById('playlistModal');
    DOM.closePlaylistModal = document.getElementById('closePlaylistModal');
    DOM.playlistNameInput = document.getElementById('playlistNameInput');
    DOM.playlistDescInput = document.getElementById('playlistDescInput');
    DOM.savePlaylistBtn = document.getElementById('savePlaylistBtn');
    DOM.cancelPlaylistBtn = document.getElementById('cancelPlaylistBtn');
    DOM.createPlaylistBtn = document.getElementById('createPlaylistBtn');
    DOM.createPlaylistCard = document.getElementById('createPlaylistCard');
    DOM.newPlaylistBtn = document.getElementById('newPlaylistBtn');
    DOM.playlistDetailModal = document.getElementById('playlistDetailModal');
    DOM.closePlaylistDetail = document.getElementById('closePlaylistDetail');
    DOM.playlistDetailTitle = document.getElementById('playlistDetailTitle');
    DOM.playlistSongs = document.getElementById('playlistSongs');
    DOM.renamePlaylistBtn = document.getElementById('renamePlaylistBtn');
    DOM.deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
    DOM.toastContainer = document.getElementById('toastContainer');
    DOM.youtubePlayerContainer = document.getElementById('youtubePlayerContainer');
    DOM.exploreBtn = document.getElementById('exploreBtn');
}

function loadFromStorage() {
    try {
        if(localStorage.getItem('playbyujjwal_favorites')) AppState.favorites = JSON.parse(localStorage.getItem('playbyujjwal_favorites'));
        if(localStorage.getItem('playbyujjwal_playlists')) AppState.playlists = JSON.parse(localStorage.getItem('playbyujjwal_playlists'));
        if(localStorage.getItem('playbyujjwal_recentlyPlayed')) AppState.recentlyPlayed = JSON.parse(localStorage.getItem('playbyujjwal_recentlyPlayed'));
        if(localStorage.getItem('playbyujjwal_theme')) AppState.theme = localStorage.getItem('playbyujjwal_theme');
        if(localStorage.getItem('playbyujjwal_volume')) AppState.volume = parseInt(localStorage.getItem('playbyujjwal_volume'));
    } catch (e) {}
}

function saveToStorage() {
    try {
        localStorage.setItem('playbyujjwal_favorites', JSON.stringify(AppState.favorites));
        localStorage.setItem('playbyujjwal_playlists', JSON.stringify(AppState.playlists));
        localStorage.setItem('playbyujjwal_recentlyPlayed', JSON.stringify(AppState.recentlyPlayed.slice(0, 50)));
        localStorage.setItem('playbyujjwal_theme', AppState.theme);
        localStorage.setItem('playbyujjwal_volume', AppState.volume.toString());
    } catch (e) {}
}

function initializeApp() {
    updatePlaylistsUI(); updateRecentlyPlayedUI(); updateFavoritesUI(); updateVolumeUI(); setupVisualizer();
}

function hideSplashScreen() {
    DOM.splashScreen.classList.add('fade-out');
    DOM.app.classList.remove('hidden');
    DOM.app.classList.add('visible');
    setTimeout(() => DOM.splashScreen.style.display = 'none', 500);
}

function setupEventListeners() {
    DOM.menuToggle.addEventListener('click', toggleSidebar);
    DOM.sidebarClose.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebar);
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => { navigateToPage(item.dataset.page); closeSidebar(); });
    });
    DOM.searchInput.addEventListener('input', debounce(handleSearch, 500));
    DOM.searchInput.addEventListener('focus', () => navigateToPage('search'));
    DOM.searchClear.addEventListener('click', clearSearch);
    DOM.miniPlayBtn.addEventListener('click', togglePlayPause);
    DOM.miniPrevBtn.addEventListener('click', playPrevious);
    DOM.miniNextBtn.addEventListener('click', playNext);
    DOM.miniFavoriteBtn.addEventListener('click', () => toggleFavorite());
    DOM.expandPlayerBtn.addEventListener('click', openFullscreenPlayer);
    DOM.miniSongInfo.addEventListener('click', openFullscreenPlayer);
    DOM.collapsePlayerBtn.addEventListener('click', closeFullscreenPlayer);
    DOM.playPauseBtn.addEventListener('click', togglePlayPause);
    DOM.prevBtn.addEventListener('click', playPrevious);
    DOM.nextBtn.addEventListener('click', playNext);
    DOM.shuffleBtn.addEventListener('click', toggleShuffle);
    DOM.repeatBtn.addEventListener('click', toggleRepeat);
    DOM.muteBtn.addEventListener('click', toggleMute);
    DOM.lyricsBtn.addEventListener('click', toggleLyrics);
    DOM.closeLyrics.addEventListener('click', toggleLyrics);
    DOM.playerFavoriteBtn.addEventListener('click', () => toggleFavorite());
    DOM.playerProgressBar.addEventListener('click', seekTo);
    DOM.miniProgressBar.addEventListener('click', seekTo);
    DOM.volumeSlider.addEventListener('click', setVolume);
    DOM.createPlaylistBtn.addEventListener('click', openPlaylistModal);
    DOM.createPlaylistCard.addEventListener('click', openPlaylistModal);
    DOM.newPlaylistBtn.addEventListener('click', openPlaylistModal);
    DOM.closePlaylistModal.addEventListener('click', closePlaylistModal);
    DOM.cancelPlaylistBtn.addEventListener('click', closePlaylistModal);
    DOM.savePlaylistBtn.addEventListener('click', createPlaylist);
    DOM.playlistModal.addEventListener('click', (e) => { if(e.target === DOM.playlistModal) closePlaylistModal(); });
    DOM.closePlaylistDetail.addEventListener('click', closePlaylistDetailModal);
    DOM.playlistDetailModal.addEventListener('click', (e) => { if (e.target === DOM.playlistDetailModal) closePlaylistDetailModal(); });
    DOM.deletePlaylistBtn.addEventListener('click', deleteCurrentPlaylist);
    DOM.renamePlaylistBtn.addEventListener('click', renameCurrentPlaylist);
    DOM.exploreBtn.addEventListener('click', () => DOM.searchInput.focus());
    document.addEventListener('keydown', handleKeyboard);
}

function navigateToPage(pageName) {
    DOM.navItems.forEach(item => { item.classList.remove('active'); if (item.dataset.page === pageName) item.classList.add('active'); });
    DOM.pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageName + 'Page')?.classList.add('active');
    AppState.currentPage = pageName;
    if (pageName === 'favorites') updateFavoritesUI();
    else if (pageName === 'playlists') updateAllPlaylistsUI();
    else if (pageName === 'recently-played') updateAllRecentlyPlayedUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar() { DOM.sidebar.classList.toggle('active'); DOM.sidebarOverlay.classList.toggle('active'); AppState.sidebarOpen = !AppState.sidebarOpen; }
function closeSidebar() { DOM.sidebar.classList.remove('active'); DOM.sidebarOverlay.classList.remove('active'); AppState.sidebarOpen = false; }

async function loadTrendingSongs() {
    try {
        const query = DEFAULT_QUERIES[0];
        const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=12&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url); const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const songs = data.items.map(item => ({
            id: item.id.videoId, title: item.snippet.title, artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
        }));
        renderSongsGrid(DOM.trendingSongs, songs);
        renderAlbumsGrid(DOM.popularAlbums, songs.slice(0, 8));
        AppState.currentPlaylist = songs;
    } catch (e) {
        DOM.trendingSongs.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Failed to load songs</p></div>`;
    }
}

async function handleSearch() {
    const query = DOM.searchInput.value.trim();
    if (!query) return DOM.searchClear.classList.remove('visible');
    DOM.searchClear.classList.add('visible');
    navigateToPage('search');
    try {
        const res = await fetch(`${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query + ' music')}&maxResults=20&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const songs = data.items.map(item => ({
            id: item.id.videoId, title: item.snippet.title, artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
        }));
        AppState.searchResults = songs;
        renderSongsGrid(DOM.searchResults, songs);
    } catch (e) {
        DOM.searchResults.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Search failed.</p></div>`;
    }
}

function clearSearch() { DOM.searchInput.value = ''; DOM.searchClear.classList.remove('visible'); }

function renderSongsGrid(container, songs) {
    if (!songs.length) return container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No songs found</p></div>`;
    container.innerHTML = songs.map((song, i) => `
        <div class="song-card" data-id="${song.id}" data-index="${i}">
            <div class="song-thumbnail">
                <img src="${song.thumbnail}" alt="${escapeHtml(song.title)}" loading="lazy">
                <div class="song-overlay"><button class="play-overlay-btn" onclick="playSong('${song.id}')"><i class="fas fa-play"></i></button></div>
            </div>
            <div class="song-info"><p class="song-title">${escapeHtml(song.title)}</p><p class="song-artist">${escapeHtml(song.artist)}</p></div>
            <div class="song-actions"><button class="favorite-btn ${isFavorite(song.id) ? 'active' : ''}" onclick="toggleFavorite('${song.id}')" data-id="${song.id}"><i class="${isFavorite(song.id) ? 'fas' : 'far'} fa-heart"></i></button></div>
        </div>
    `).join('');
    container.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn') && !e.target.closest('.play-overlay-btn')) playSong(card.dataset.id);
        });
    });
}

function renderAlbumsGrid(container, albums) {
    if (!albums.length) return;
    container.innerHTML = albums.map(album => `
        <div class="album-card" data-id="${album.id}" onclick="playSong('${album.id}')">
            <div class="album-thumbnail"><img src="${album.thumbnail}" alt="${escapeHtml(album.title)}" loading="lazy"></div>
            <p class="album-name">${escapeHtml(album.title)}</p><p class="album-artist">${escapeHtml(album.artist)}</p>
        </div>
    `).join('');
}

function renderSongsList(container, songs, showNumbers = true) {
    if (!songs.length) return container.innerHTML = `<div class="empty-state"><p>No songs yet</p></div>`;
    container.innerHTML = songs.map((song, i) => `
        <div class="song-list-item ${AppState.currentSong?.id === song.id ? 'playing' : ''}" data-id="${song.id}">
            ${showNumbers ? `<span class="song-list-number">${i + 1}</span>` : ''}
            <div class="song-list-thumbnail"><img src="${song.thumbnail}" alt="${escapeHtml(song.title)}" loading="lazy"></div>
            <div class="song-list-info"><p class="song-list-title">${escapeHtml(song.title)}</p><p class="song-list-artist">${escapeHtml(song.artist)}</p></div>
            <div class="song-list-actions">
                <button class="favorite-btn ${isFavorite(song.id) ? 'active' : ''}" onclick="toggleFavorite('${song.id}')" data-id="${song.id}"><i class="${isFavorite(song.id) ? 'fas' : 'far'} fa-heart"></i></button>
                <button onclick="playSong('${song.id}')"><i class="fas fa-play"></i></button>
            </div>
        </div>
    `).join('');
}

function updatePlaylistsUI() {
    const playlistsContainer = DOM.userPlaylists;
    const createCard = playlistsContainer.querySelector('.create-new');
    playlistsContainer.innerHTML = ''; playlistsContainer.appendChild(createCard);
    AppState.playlists.forEach(playlist => {
        const card = document.createElement('div'); card.className = 'playlist-card glass-card';
        card.innerHTML = `<div class="playlist-icon"><i class="fas fa-music"></i></div><p class="playlist-name">${escapeHtml(playlist.name)}</p><p class="playlist-count">${playlist.songs.length} songs</p>`;
        card.addEventListener('click', () => openPlaylistDetail(playlist.id));
        playlistsContainer.appendChild(card);
    });
}
function updateAllPlaylistsUI() {
    DOM.allPlaylists.innerHTML = AppState.playlists.map(p => `
        <div class="playlist-card glass-card" onclick="openPlaylistDetail('${p.id}')">
            <div class="playlist-icon"><i class="fas fa-music"></i></div><p class="playlist-name">${escapeHtml(p.name)}</p><p class="playlist-count">${p.songs.length} songs</p>
        </div>`).join('');
}
function updateRecentlyPlayedUI() { renderSongsList(DOM.recentlyPlayed, AppState.recentlyPlayed.slice(0, 5), false); }
function updateAllRecentlyPlayedUI() { renderSongsList(DOM.allRecentlyPlayed, AppState.recentlyPlayed, true); }
function updateFavoritesUI() {
    const favoriteSongs = AppState.favorites.map(id => AppState.recentlyPlayed.find(s => s.id === id) || AppState.currentPlaylist.find(s => s.id === id) || {id, title:'Unknown Song', artist:'Unknown', thumbnail:''});
    renderSongsList(DOM.favoritesList, favoriteSongs, true);
}

function onYouTubeIframeAPIReady() {}

function createYouTubePlayer(videoId) {
    if (AppState.player) AppState.player.destroy();
    AppState.player = new YT.Player('youtubePlayerContainer', {
        height: '0', width: '0', videoId: videoId,
        playerVars: { autoplay: 1, controls: 0 },
        events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange, onError: onPlayerError }
    });
}

function onPlayerReady() {
    AppState.player.setVolume(AppState.volume);
    startProgressTracking(); updatePlayerUI();
}
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) { AppState.isPlaying = true; updatePlayButtonUI(); startVisualizer(); }
    else if (event.data === YT.PlayerState.PAUSED) { AppState.isPlaying = false; updatePlayButtonUI(); stopVisualizer(); }
    else if (event.data === YT.PlayerState.ENDED) handleSongEnd();
}
function onPlayerError() { showToast('Error playing song', 'error'); setTimeout(playNext, 1000); }

function playSong(songId) {
    let song = AppState.currentPlaylist.find(s => s.id === songId) || AppState.searchResults.find(s => s.id === songId) || AppState.recentlyPlayed.find(s => s.id === songId) || {id: songId, title: 'Loading...', artist: 'Unknown', thumbnail: ''};
    AppState.currentSong = song;
    AppState.currentIndex = Math.max(0, AppState.currentPlaylist.findIndex(s => s.id === songId));
    addToRecentlyPlayed(song);
    createYouTubePlayer(songId);
    DOM.miniPlayer.classList.add('visible');
    updatePlayerUI(); updateMiniPlayerUI(); updateRecentlyPlayedUI();
}

function togglePlayPause() {
    if (!AppState.player) return playSong(AppState.currentPlaylist[0]?.id);
    AppState.isPlaying ? AppState.player.pauseVideo() : AppState.player.playVideo();
}
function playNext() {
    if (!AppState.currentPlaylist.length) return;
    AppState.currentIndex = AppState.isShuffled ? Math.floor(Math.random() * AppState.currentPlaylist.length) : (AppState.currentIndex + 1) % AppState.currentPlaylist.length;
    playSong(AppState.currentPlaylist[AppState.currentIndex].id);
}
function playPrevious() {
    if (!AppState.currentPlaylist.length) return;
    AppState.currentIndex = (AppState.currentIndex - 1 + AppState.currentPlaylist.length) % AppState.currentPlaylist.length;
    playSong(AppState.currentPlaylist[AppState.currentIndex].id);
}
function handleSongEnd() { AppState.repeatMode === 2 ? (AppState.player.seekTo(0), AppState.player.playVideo()) : playNext(); }
function toggleShuffle() { AppState.isShuffled = !AppState.isShuffled; DOM.shuffleBtn.classList.toggle('active', AppState.isShuffled); }
function toggleRepeat() {
    AppState.repeatMode = (AppState.repeatMode + 1) % 3;
    DOM.repeatBtn.classList.toggle('active', AppState.repeatMode > 0);
}
function toggleMute() {
    AppState.isMuted = !AppState.isMuted;
    AppState.isMuted ? AppState.player.mute() : AppState.player.unMute();
}
function setVolume(e) {
    const rect = DOM.volumeSlider.getBoundingClientRect();
    AppState.volume = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    AppState.player?.setVolume(AppState.volume);
    updateVolumeUI(); saveToStorage();
}
function updateVolumeUI() { DOM.volumeFill.style.width = AppState.volume + '%'; }

let progressInterval;
function startProgressTracking() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => { if (AppState.player && AppState.isPlaying) updateProgressUI(); }, 1000);
}
function updateProgressUI() {
    if (!AppState.player) return;
    const current = AppState.player.getCurrentTime() || 0, duration = AppState.player.getDuration() || 0;
    if (duration > 0) {
        const pct = (current / duration) * 100;
        DOM.miniProgressFill.style.width = pct + '%';
        DOM.playerProgressFill.style.width = pct + '%';
        DOM.currentTime.textContent = formatTime(current); DOM.totalTime.textContent = formatTime(duration);
    }
}
function formatTime(s) { const m = Math.floor(s/60); return `${m}:${Math.floor(s%60).toString().padStart(2,'0')}`; }

function updatePlayerUI() {
    if (!AppState.currentSong) return;
    const song = AppState.currentSong, isFav = isFavorite(song.id);
    DOM.playerTitle.textContent = song.title; DOM.playerArtist.textContent = song.artist;
    if (song.thumbnail) { DOM.albumArtImg.src = song.thumbnail; DOM.albumArtImg.classList.add('loaded'); DOM.bgBlur.style.backgroundImage = `url(${song.thumbnail})`; }
    DOM.playerFavoriteBtn.classList.toggle('active', isFav); DOM.miniFavoriteBtn.classList.toggle('active', isFav);
}
function updateMiniPlayerUI() {
    if (!AppState.currentSong) return;
    DOM.miniTitle.textContent = AppState.currentSong.title; DOM.miniArtist.textContent = AppState.currentSong.artist;
    if (AppState.currentSong.thumbnail) DOM.miniThumbnail.innerHTML = `<img src="${AppState.currentSong.thumbnail}">`;
}
function updatePlayButtonUI() {
    const icon = AppState.isPlaying ? 'fa-pause' : 'fa-play';
    DOM.miniPlayBtn.innerHTML = `<i class="fas ${icon}"></i>`; DOM.playPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
}
function openFullscreenPlayer() { if(AppState.currentSong) DOM.fullscreenPlayer.classList.add('active'); }
function closeFullscreenPlayer() { DOM.fullscreenPlayer.classList.remove('active'); }

function toggleFavorite(id = AppState.currentSong?.id) {
    if (!id) return;
    const idx = AppState.favorites.indexOf(id);
    idx > -1 ? AppState.favorites.splice(idx, 1) : AppState.favorites.push(id);
    saveToStorage(); updatePlayerUI(); updateFavoritesUI();
}
function isFavorite(id) { return AppState.favorites.includes(id); }
function addToRecentlyPlayed(song) {
    AppState.recentlyPlayed = [song, ...AppState.recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 50);
    saveToStorage();
}

function openPlaylistModal() { DOM.playlistModal.classList.add('active'); }
function closePlaylistModal() { DOM.playlistModal.classList.remove('active'); }
function createPlaylist() {
    const name = DOM.playlistNameInput.value.trim();
    if (!name) return;
    AppState.playlists.push({ id: 'playlist_' + Date.now(), name, songs: [] });
    saveToStorage(); updatePlaylistsUI(); updateAllPlaylistsUI(); closePlaylistModal();
}

let currentPlaylistId = null;
function openPlaylistDetail(id) {
    const p = AppState.playlists.find(x => x.id === id);
    if (!p) return;
    currentPlaylistId = id; DOM.playlistDetailTitle.textContent = p.name;
    renderSongsList(DOM.playlistSongs, p.songs, true);
    DOM.playlistDetailModal.classList.add('active');
}
function closePlaylistDetailModal() { DOM.playlistDetailModal.classList.remove('active'); }
function deleteCurrentPlaylist() {
    AppState.playlists = AppState.playlists.filter(p => p.id !== currentPlaylistId);
    saveToStorage(); updatePlaylistsUI(); updateAllPlaylistsUI(); closePlaylistDetailModal();
}
function renameCurrentPlaylist() {}

function seekTo(e) {
    if (!AppState.player) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekTime = ((e.clientX - rect.left) / rect.width) * AppState.player.getDuration();
    AppState.player.seekTo(seekTime, true);
}

function toggleLyrics() {
    AppState.lyricsOpen = !AppState.lyricsOpen;
    DOM.lyricsPanel.classList.toggle('active', AppState.lyricsOpen);
}

let visualizerInterval;
function setupVisualizer() { DOM.visualizerCanvas.width = 200; DOM.visualizerCanvas.height = 60; }
function startVisualizer() {
    const ctx = DOM.visualizerCanvas.getContext('2d');
    clearInterval(visualizerInterval);
    visualizerInterval = setInterval(() => {
        ctx.clearRect(0, 0, 200, 60);
        for(let i=0; i<30; i++) {
            const h = Math.random() * 48, x = i * (200/30), y = 60 - h;
            ctx.fillStyle = '#00d4ff'; ctx.fillRect(x, y, 5, h);
        }
    }, 100);
}
function stopVisualizer() { clearInterval(visualizerInterval); }

function showToast(msg) { console.log(msg); }
function handleKeyboard(e) {}
function debounce(func, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => func(...args), wait); }; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
console.log('%c🎵 PlayByUjjwal Ready', 'color: #00d4ff; font-size: 20px;');