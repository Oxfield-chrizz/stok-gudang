// Data
let items = [];
let history = [];
let currentFilter = "all";

const STORAGE_KEY = "warehouse_stock_app";
const HISTORY_KEY = "warehouse_history";

// DOM Elements
const namaInput = document.getElementById('namaBarang');
const kodeInput = document.getElementById('kodeBarang');
const jumlahInput = document.getElementById('jumlahBarang');
const asalInput = document.getElementById('asalBarang');
const tanggalInput = document.getElementById('tanggalDatang');
const btnTambah = document.getElementById('btnTambahDatang');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const btnHapusSemua = document.getElementById('btnHapusSemua');
const totalItemsSpan = document.getElementById('totalItemsCount');
const totalJumlahSemuaSpan = document.getElementById('totalJumlahSemua');
const totalUnitCountSpan = document.getElementById('totalUnitCount');

// In/Out Elements
const selectBarangInOut = document.getElementById('selectBarangInOut');
const currentStockInput = document.getElementById('currentStock');
const jumlahMasuk = document.getElementById('jumlahMasuk');
const jumlahKeluar = document.getElementById('jumlahKeluar');
const keteranganInOut = document.getElementById('keteranganInOut');
const btnTambahStok = document.getElementById('btnTambahStok');
const btnKurangStok = document.getElementById('btnKurangStok');

// History Elements
const historyBody = document.getElementById('historyBody');
const searchHistory = document.getElementById('searchHistory');
const btnClearHistory = document.getElementById('btnClearHistory');

// Counter Elements
const countDatangSpan = document.getElementById('countDatang');
const countGudangSpan = document.getElementById('countGudang');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Filter buttons
const filterBtns = document.querySelectorAll('.filter-btn');

// Helper Functions
function setDefaultDate() {
    if (!tanggalInput.value) {
        const today = new Date();
        tanggalInput.value = today.toISOString().split('T')[0];
    }
}

function saveToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    updateStats();
    updateCounters();
    updateSelectBarang();
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        items = JSON.parse(stored);
    } else {
        items = [
            { id: Date.now() + 1, nama: "Mouse Wireless", kode: "MW-101", jumlah: 15, supplier: "Tech Distributor", tanggalDatang: "2025-03-10", status: "gudang" },
            { id: Date.now() + 2, nama: "Keyboard Mechanical", kode: "KM-202", jumlah: 8, supplier: "LogiStore", tanggalDatang: "2025-03-12", status: "gudang" },
            { id: Date.now() + 3, nama: "Monitor 24 Inch", kode: "MN-24F", jumlah: 5, supplier: "ScreenPlus", tanggalDatang: "2025-03-05", status: "gudang" },
            { id: Date.now() + 4, nama: "USB Hub 4 Port", kode: "UH-04", jumlah: 25, supplier: "Acessory World", tanggalDatang: "2025-03-15", status: "datang" }
        ];
    }
    
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    } else {
        history = [];
    }
    
    updateCounters();
    renderTable();
    updateStats();
    updateSelectBarang();
    renderHistory();
}

function updateStats() {
    totalItemsSpan.innerText = items.length;
    const totalUnit = items.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    totalJumlahSemuaSpan.innerText = totalUnit;
    totalUnitCountSpan.innerText = totalUnit;
}

function updateCounters() {
    const jumlahDatang = items.filter(item => item.status === 'datang').length;
    const jumlahGudang = items.filter(item => item.status === 'gudang').length;
    countDatangSpan.textContent = jumlahDatang;
    countGudangSpan.textContent = jumlahGudang;
}

function updateSelectBarang() {
    const gudangItems = items.filter(item => item.status === 'gudang');
    selectBarangInOut.innerHTML = '<option value="">-- Pilih barang di gudang --</option>' +
        gudangItems.map(item => `<option value="${item.id}" data-jumlah="${item.jumlah}">${item.nama} (${item.kode || '-'}) - Stok: ${item.jumlah}</option>`).join('');
    
    selectBarangInOut.onchange = function() {
        const selected = selectBarangInOut.selectedOptions[0];
        if (selected && selected.value) {
            const item = items.find(i => i.id == selected.value);
            if (item) currentStockInput.value = item.jumlah;
        } else {
            currentStockInput.value = '';
        }
    };
}

function addHistory(barangId, barangNama, jenis, jumlah, stokAkhir, keterangan) {
    const newHistory = {
        id: Date.now(),
        tanggal: new Date().toLocaleString('id-ID'),
        barangId: barangId,
        barangNama: barangNama,
        jenis: jenis,
        jumlah: jumlah,
        stokAkhir: stokAkhir,
        keterangan: keterangan || '-'
    };
    history.unshift(newHistory);
    if (history.length > 200) history = history.slice(0, 200);
    saveToLocal();
    renderHistory();
}

function renderHistory() {
    const searchTerm = searchHistory.value.toLowerCase().trim();
    let filtered = history;
    if (searchTerm) {
        filtered = history.filter(h => h.barangNama.toLowerCase().includes(searchTerm) || h.keterangan.toLowerCase().includes(searchTerm));
    }
    
    if (filtered.length === 0) {
        historyBody.innerHTML = '<tr class="empty-row"><td colspan="6">Belum ada riwayat transaksi</td></tr>';
        return;
    }
    
    historyBody.innerHTML = filtered.map(h => `
        <tr>
            <td>${h.tanggal}</td>
            <td><strong>${escapeHtml(h.barangNama)}</strong></td>
            <td><span style="background:${h.jenis === 'IN' ? '#dcfce7' : '#fee2e2'}; padding:4px 10px; border-radius:20px;">${h.jenis === 'IN' ? '➕ Masuk' : '➖ Keluar'}</span></td>
            <td>${h.jumlah}</td>
            <td>${h.stokAkhir}</td>
            <td>${escapeHtml(h.keterangan)}</td>
        </tr>
    `).join('');
}

function clearHistory() {
    if (confirm('Hapus semua riwayat transaksi?')) {
        history = [];
        saveToLocal();
        renderHistory();
        showToast('Riwayat berhasil dihapus', '#475569');
    }
}

// In/Out Functions
function tambahStok() {
    const selectedId = selectBarangInOut.value;
    if (!selectedId) {
        showToast('Pilih barang terlebih dahulu', '#b91c1c');
        return;
    }
    const jumlah = parseInt(jumlahMasuk.value);
    if (isNaN(jumlah) || jumlah <= 0) {
        showToast('Jumlah masuk harus lebih dari 0', '#b91c1c');
        return;
    }
    
    const item = items.find(i => i.id == selectedId);
    if (!item) return;
    
    item.jumlah += jumlah;
    const keterangan = keteranganInOut.value.trim() || 'Tambah stok';
    addHistory(item.id, item.nama, 'IN', jumlah, item.jumlah, keterangan);
    
    saveToLocal();
    renderTable();
    updateSelectBarang();
    jumlahMasuk.value = '0';
    keteranganInOut.value = '';
    showToast(`✅ Stok ${item.nama} bertambah ${jumlah} unit`, '#15803d');
}

function kurangStok() {
    const selectedId = selectBarangInOut.value;
    if (!selectedId) {
        showToast('Pilih barang terlebih dahulu', '#b91c1c');
        return;
    }
    const jumlah = parseInt(jumlahKeluar.value);
    if (isNaN(jumlah) || jumlah <= 0) {
        showToast('Jumlah keluar harus lebih dari 0', '#b91c1c');
        return;
    }
    
    const item = items.find(i => i.id == selectedId);
    if (!item) return;
    
    if (item.jumlah < jumlah) {
        showToast(`Stok tidak mencukupi! Stok saat ini: ${item.jumlah}`, '#b91c1c');
        return;
    }
    
    item.jumlah -= jumlah;
    const keterangan = keteranganInOut.value.trim() || 'Pengeluaran stok';
    addHistory(item.id, item.nama, 'OUT', jumlah, item.jumlah, keterangan);
    
    saveToLocal();
    renderTable();
    updateSelectBarang();
    jumlahKeluar.value = '0';
    keteranganInOut.value = '';
    showToast(`✅ Stok ${item.nama} berkurang ${jumlah} unit`, '#eab308');
}

// Item Management
function addNewItem() {
    const nama = namaInput.value.trim();
    if (!nama) {
        showToast('Nama barang wajib diisi!', '#b91c1c');
        return;
    }
    let jumlah = parseInt(jumlahInput.value);
    if (isNaN(jumlah) || jumlah <= 0) {
        showToast('Jumlah harus lebih dari 0', '#b91c1c');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        nama: nama,
        kode: kodeInput.value.trim() || '',
        jumlah: jumlah,
        supplier: asalInput.value.trim() || '-',
        tanggalDatang: tanggalInput.value || new Date().toISOString().split('T')[0],
        status: 'datang'
    };
    items.unshift(newItem);
    
    saveToLocal();
    renderTable();
    updateSelectBarang();
    
    namaInput.value = '';
    kodeInput.value = '';
    jumlahInput.value = '1';
    asalInput.value = '';
    setDefaultDate();
    showToast(`✅ "${nama}" dicatat sebagai BARANG DATANG`, '#15803d');
}

function moveToWarehouse(id) {
    const item = items.find(i => i.id === id);
    if (item && item.status === 'datang') {
        item.status = 'gudang';
        saveToLocal();
        renderTable();
        updateSelectBarang();
        showToast(`✅ "${item.nama}" dipindahkan ke GUDANG`, '#15803d');
    }
}

function deleteItem(id) {
    if (confirm('Hapus item ini?')) {
        items = items.filter(i => i.id !== id);
        saveToLocal();
        renderTable();
        updateSelectBarang();
        showToast('Item dihapus', '#475569');
    }
}

function deleteAllItems() {
    if (items.length === 0) return;
    if (confirm('Hapus SEMUA data stok?')) {
        items = [];
        history = [];
        saveToLocal();
        renderTable();
        updateSelectBarang();
        renderHistory();
        showToast('Semua data dihapus', '#1e3c72');
    }
}

function renderTable() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filtered = [...items];
    
    if (currentFilter === 'datang') filtered = filtered.filter(i => i.status === 'datang');
    else if (currentFilter === 'gudang') filtered = filtered.filter(i => i.status === 'gudang');
    else if (currentFilter === 'lowstock') filtered = filtered.filter(i => i.status === 'gudang' && i.jumlah <= 5);
    
    if (searchTerm) {
        filtered = filtered.filter(i => i.nama.toLowerCase().includes(searchTerm) || 
            (i.kode && i.kode.toLowerCase().includes(searchTerm)) ||
            (i.supplier && i.supplier.toLowerCase().includes(searchTerm)));
    }
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Tidak ada data</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filtered.map(item => {
        const isLowStock = item.status === 'gudang' && item.jumlah <= 5;
        const statusClass = item.status === 'gudang' ? 'gudang' : '';
        const statusLabel = item.status === 'gudang' ? (isLowStock ? '⚠️ Stok Menipis' : '✅ Di Gudang') : '🚚 Barang Datang';
        
        return `
            <tr>
                <td><strong>${escapeHtml(item.nama)}</strong></td>
                <td>${escapeHtml(item.kode || '-')}</td>
                <td style="${isLowStock ? 'color:#c2410c; font-weight:bold;' : ''}">${item.jumlah} unit</td>
                <td>${escapeHtml(item.supplier || '-')}</td>
                <td>${item.tanggalDatang || '-'}</td>
                <td><span class="status-badge ${statusClass} ${isLowStock ? 'lowstock' : ''}">${statusLabel}</span></td>
                <td class="action-icons">
                    ${item.status === 'datang' ? `<i class="fas fa-archive" onclick="moveToWarehouse(${item.id})" title="Pindah ke Gudang"></i>` : ''}
                    <i class="fas fa-trash-alt" onclick="deleteItem(${item.id})" title="Hapus"></i>
                </td>
            </tr>
        `;
    }).join('');
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    renderTable();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, bgColor) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `background:${bgColor};color:white;padding:12px 20px;border-radius:40px;font-size:0.85rem;font-weight:500;box-shadow:0 8px 20px rgba(0,0,0,0.1);`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => container.removeChild(toast), 300);
    }, 2500);
}

// Tab Function
function initTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Event Listeners
searchInput.addEventListener('input', () => renderTable());
searchHistory.addEventListener('input', () => renderHistory());
btnTambah.addEventListener('click', addNewItem);
btnHapusSemua.addEventListener('click', deleteAllItems);
btnTambahStok.addEventListener('click', tambahStok);
btnKurangStok.addEventListener('click', kurangStok);
btnClearHistory.addEventListener('click', clearHistory);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Initialize
setDefaultDate();
initTabs();
loadData();