 // URL API
const SURAH_LIST_API = "https://api.alquran.cloud/v1/surah";
// API Baru: Mengambil edisi Arab dan Indonesia secara terpisah (lebih stabil untuk pemrosesan)
const SURAH_DETAIL_API_ARAB = (surahNumber) => `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`;
const SURAH_DETAIL_API_ID = (surahNumber) => `https://api.alquran.cloud/v1/surah/${surahNumber}/id.indonesian`;


// Elemen-elemen DOM (DIHAPUS untuk ringkasan, tapi harus ada di kode Anda)
const homeSection = document.getElementById('home-section');
const surahSection = document.getElementById('surah-section');
const surahList = document.getElementById('surah-list');
const searchInput = document.getElementById('search-surah');
const darkToggleBtn = document.getElementById('dark-toggle');
const menuHome = document.getElementById('menu-home');
const menuSurah = document.getElementById('menu-surah');
const goToSurahBtn = document.getElementById('go-to-surah');
const appLogo = document.getElementById('app-logo');
const initialPlaceholder = document.getElementById('initial-placeholder');
const loadingSpinner = document.getElementById('loading-spinner');
const detailHeader = document.getElementById('detail-header');
const detailSurahName = document.getElementById('detail-surah-name');
const detailSurahInfo = document.getElementById('detail-surah-info');
const ayatContainer = document.getElementById('ayat-container');
const bismillahText = document.getElementById('bismillah-text');

let allSurahs = []; 
let currentActiveSurah = null; 

// --- FUNGSI NAVIGASI DAN TAMPILAN ---
// (Fungsi showSection tetap sama)
function showSection(sectionToShow) {
    homeSection.classList.add('d-none');
    surahSection.classList.add('d-none');
    sectionToShow.classList.remove('d-none');
    menuHome.classList.remove('active');
    menuSurah.classList.remove('active');
    
    if (sectionToShow === homeSection) {
        menuHome.classList.add('active');
    } else if (sectionToShow === surahSection) {
        menuSurah.classList.add('active');
        if (allSurahs.length === 0) {
            fetchSurahList();
        }
    }
}
// (Event Listeners Navigasi tetap sama)
menuHome.addEventListener('click', (e) => { e.preventDefault(); showSection(homeSection); });
menuSurah.addEventListener('click', (e) => { e.preventDefault(); showSection(surahSection); });
goToSurahBtn.addEventListener('click', () => showSection(surahSection));
appLogo.addEventListener('click', (e) => { e.preventDefault(); showSection(homeSection); });
showSection(homeSection);

// --- DAFTAR SURAH (Fungsi renderSurahList, fetchSurahList, dan Pencarian tetap sama) ---

function renderSurahList(surahs) {
    surahList.innerHTML = '';
    if (surahs.length === 0) {
        surahList.innerHTML = '<li class="list-group-item text-center text-muted">Surah tidak ditemukan.</li>';
        return;
    }
    surahs.forEach(surah => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="badge bg-success me-3">${surah.number}</span>
                <div>
                    <strong class="text-success">${surah.englishName}</strong> 
                    <span class="text-muted small">(${surah.name})</span>
                    <br>
                    <span class="text-muted small">${surah.englishNameTranslation}</span>
                </div>
            </div>
            <span class="text-success fw-bold ar-font small">${surah.name}</span>
        `;
        if (currentActiveSurah === surah.number) {
            li.classList.add('active');
        }
        li.addEventListener('click', () => {
            fetchSurahDetail(surah.number);
            document.querySelectorAll('#surah-list li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            currentActiveSurah = surah.number;
        });
        surahList.appendChild(li);
    });
}
async function fetchSurahList() {
    surahList.innerHTML = '<li class="list-group-item text-center text-info"><div class="spinner-border spinner-border-sm text-success me-2"></div> Mengambil daftar surah...</li>';
    try {
        const response = await fetch(SURAH_LIST_API);
        const data = await response.json();
        if (data.data) {
            allSurahs = data.data; 
            renderSurahList(allSurahs);
        } else {
            surahList.innerHTML = '<li class="list-group-item text-center text-danger">Gagal memuat data surah.</li>';
        }
    } catch (error) {
        console.error("Error fetching surah list:", error);
        surahList.innerHTML = '<li class="list-group-item text-center text-danger">Terjadi kesalahan koneksi.</li>';
    }
}
searchInput.addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (allSurahs.length > 0) {
        const filteredSurahs = allSurahs.filter(surah => 
            surah.englishName.toLowerCase().includes(searchTerm) ||
            surah.name.toLowerCase().includes(searchTerm) ||
            surah.englishNameTranslation.toLowerCase().includes(searchTerm)
        );
        renderSurahList(filteredSurahs);
    }
});


// --- DETAIL SURAH DAN AYAT (Diperbarui dengan Promise.all) ---

/**
 * Mengambil detail surah dan ayat-ayatnya menggunakan 2 permintaan API paralel.
 */
async function fetchSurahDetail(surahNumber) {
    initialPlaceholder.classList.add('d-none');
    detailHeader.classList.add('d-none');
    ayatContainer.innerHTML = '';
    loadingSpinner.classList.remove('d-none'); 

    try {
        // Lakukan 2 permintaan secara paralel
        const [responseArab, responseIndonesia] = await Promise.all([
            fetch(SURAH_DETAIL_API_ARAB(surahNumber)),
            fetch(SURAH_DETAIL_API_ID(surahNumber))
        ]);
        
        // Cek status HTTP dari kedua respons
        if (!responseArab.ok || !responseIndonesia.ok) {
            throw new Error(`Gagal memuat detail surah. Status HTTP: Arab=${responseArab.status}, Indo=${responseIndonesia.status}`);
        }

        const [dataArab, dataIndonesia] = await Promise.all([
            responseArab.json(),
            responseIndonesia.json()
        ]);
        
        loadingSpinner.classList.add('d-none'); 
        
        if (dataArab.data && dataIndonesia.data) {
            renderSurahDetail(dataArab.data, dataIndonesia.data);
        } else {
            ayatContainer.innerHTML = '<p class="text-danger text-center">Data surah tidak lengkap dari API. Coba lagi.</p>';
        }

    } catch (error) {
        console.error("Error fetching surah detail:", error);
        loadingSpinner.classList.add('d-none'); 
        ayatContainer.innerHTML = `<p class="text-danger text-center">Terjadi kesalahan saat mengambil data ayat. (${error.message || 'Gagal terhubung ke server API'})</p>`;
    }
}

/**
 * Menampilkan detail surah dan ayat-ayatnya ke DOM
 */
function renderSurahDetail(arSurah, idSurah) {
    // 1. Update Header
    detailSurahName.textContent = `${arSurah.englishName} (${arSurah.name})`;
    detailSurahInfo.textContent = `Diturunkan di ${arSurah.revelationType} | ${arSurah.numberOfAyahs} Ayat | Terjemahan: ${arSurah.englishNameTranslation}`;
    
    // Tampilkan header
    detailHeader.classList.remove('d-none');

    // Tampilkan Basmalah kecuali untuk Surah Al-Fatihah (nomor 1) dan At-Taubah (nomor 9)
    if (arSurah.number !== 1 && arSurah.number !== 9) {
        bismillahText.classList.remove('d-none');
    } else {
        bismillahText.classList.add('d-none');
    }
    
    // 2. Render Ayat
    const totalAyat = arSurah.numberOfAyahs;
    let htmlContent = '';
    
    for (let i = 0; i < totalAyat; i++) {
        const ayatArab = arSurah.ayahs[i].text;
        // Pastikan terjemahan tersedia dan cocok dengan indeks ayat Arab
        const ayatTerjemahan = idSurah.ayahs[i] ? idSurah.ayahs[i].text : 'Terjemahan tidak tersedia.';
        const ayatNumber = arSurah.ayahs[i].numberInSurah;

        htmlContent += `
            <div class="ayat-item">
                <p class="text-end ar-font">
                    ${ayatArab} 
                    <sup class="ayat-number">(${ayatNumber})</sup>
                </p>
                <p class="text-muted small">
                    <span class="fw-bold text-success">${ayatNumber}.</span> 
                    ${ayatTerjemahan}
                </p>
            </div>
        `;
    }

    ayatContainer.innerHTML = htmlContent;
}


// --- DARK MODE (Tetap sama) ---

const prefersDark = localStorage.getItem('darkMode') === 'true';
if (prefersDark) {
    document.body.classList.add('dark-mode');
    darkToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i> Mode Terang';
}

darkToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    localStorage.setItem('darkMode', isDarkMode);

    if (isDarkMode) {
        darkToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i> Mode Terang';
    } else {
        darkToggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i> Mode Gelap';
    }
});