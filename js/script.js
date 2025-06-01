// ===== LOCALSTORAGE DATA MANAGEMENT =====
const STORAGE_KEYS = {
    employees: 'mp_employees',
    endContracts: 'mp_end_contracts',
    recruitment: 'mp_recruitment',
    education: 'mp_education',
    settings: 'mp_settings',
    skillMatrix: 'skillMatrix',
    overtime: 'mp_overtime'
};

// Register Chart.js plugins
// if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
//     Chart.register(ChartDataLabels);
// }

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Inisialisasi mode skill matrix
    initializeSkillMatrixMode();
});

// ===== SEARCHABLE DROPDOWN FUNCTIONALITY =====
function createSearchableDropdown(selectId, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Buat container untuk searchable dropdown
    const container = document.createElement('div');
    container.className = 'searchable-dropdown';
    
    // Buat input search
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'searchable-input';
    searchInput.placeholder = placeholder;
    searchInput.autocomplete = 'off';
    
    // Buat dropdown list
    const dropdownList = document.createElement('div');
    dropdownList.className = 'dropdown-list';
    dropdownList.style.display = 'none';
    
    // Simpan options asli
    const originalOptions = Array.from(select.options).map(option => ({
        value: option.value,
        text: option.textContent,
        selected: option.selected
    }));
    
    // Function untuk populate dropdown list
    function populateDropdownList(options) {
        dropdownList.innerHTML = '';
        options.forEach(option => {
            if (option.value === '') return; // Skip empty option
            
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = option.text;
            item.dataset.value = option.value;
            
            item.addEventListener('click', () => {
                searchInput.value = option.text;
                select.value = option.value;
                dropdownList.style.display = 'none';
                
                // Trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                select.dispatchEvent(changeEvent);
            });
            
            dropdownList.appendChild(item);
        });
    }
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredOptions = originalOptions.filter(option => 
            option.text.toLowerCase().includes(searchTerm)
        );
        populateDropdownList(filteredOptions);
        dropdownList.style.display = filteredOptions.length > 0 ? 'block' : 'none';
    });
    
    searchInput.addEventListener('focus', () => {
        populateDropdownList(originalOptions);
        dropdownList.style.display = 'block';
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdownList.style.display = 'none';
        }
    });
    
    // Replace original select
    select.style.display = 'none';
    container.appendChild(searchInput);
    container.appendChild(dropdownList);
    select.parentNode.insertBefore(container, select);
    
    return {
        updateOptions: (newOptions) => {
            originalOptions.length = 0;
            originalOptions.push(...newOptions);
            searchInput.value = '';
            dropdownList.style.display = 'none';
        },
        setValue: (value, text) => {
            searchInput.value = text || '';
            select.value = value || '';
        },
        clear: () => {
            searchInput.value = '';
            select.value = '';
        }
    };
}

function initializeApp() {
    console.log('Initializing MP Development System...');
    
    // Initialize localStorage first
    initializeLocalStorage();
    
    // Initialize UI components
    initializeNavigation();
    initializeSearch();
    initializeModal();
    initializeClock();
    initializeAutoNPK();
    
    // Load all data
    loadAllData();
    
    // Update dashboard stats after data is loaded
    setTimeout(() => {
        updateDashboardStats();
    }, 100);
    
    // Pisahkan chart initialization dengan delay lebih lama
    setTimeout(() => {
        try {
            initializeCharts();
            updateCharts();
        } catch (error) {
            console.error('Chart initialization failed:', error);
            // Retry setelah delay
            setTimeout(() => {
                try {
                    initializeCharts();
                    updateCharts();
                } catch (retryError) {
                    console.error('Chart retry failed:', retryError);
                }
            }, 1000);
        }
    }, 500); // Delay lebih lama
    
    // Initialize skill matrix filters after DOM is fully loaded
    setTimeout(() => {
        initializeSkillMatrixFilters();
    }, 600);
    
    // Update storage info tanpa notifikasi saat initialization
    updateStorageInfo(true); // silent mode
    
    console.log('MP Development System initialized successfully!');
}

// ===== LOCALSTORAGE FUNCTIONS =====
function initializeLocalStorage() {
    // Initialize empty arrays if localStorage is empty
    Object.values(STORAGE_KEYS).forEach(key => {
        if (!localStorage.getItem(key)) {
            saveToLocalStorage(key, []);
        }
    });
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showNotification('Error menyimpan data ke localStorage', 'error');
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showNotification('Error memuat data dari localStorage', 'error');
        return [];
    }
}

function generateId(data) {
    if (data.length === 0) return 1;
    return Math.max(...data.map(item => item.id || 0)) + 1;
}

// ===== LOAD ALL DATA FUNCTIONS =====
function loadAllData() {
    loadEmployeeData();
    loadEndContractData();
    loadRecruitmentData();
    loadEducationData();
}

// Variabel global untuk pagination
let currentPage = 1;
let itemsPerPage = 10;
let allEmployees = [];
let filteredEmployees = [];
let sortDirection = 'asc'; // 'asc' atau 'desc'

// Variabel global untuk End Contract pagination
let currentEndContractPage = 1;
let endContractItemsPerPage = 10;
let allEndContracts = [];
let filteredEndContracts = [];
let endContractSortDirection = 'asc';

// Variabel untuk skill matrix sorting
let skillMatrixSortDirection = 'asc';

// Variabel global untuk Recruitment pagination
let currentRecruitmentPage = 1;
let recruitmentItemsPerPage = 10;
let filteredRecruitmentData = [];
let recruitmentSortDirection = 'asc';

// ===== EMPLOYEE FUNCTIONS =====
function loadEmployeeData() {
    allEmployees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    // Urutkan berdasarkan NPK sesuai direction
    sortEmployeesByNPK();
    
    filteredEmployees = [...allEmployees];
    currentPage = 1;
    displayEmployeeData();
    createPagination();
}

// Fungsi untuk sorting NPK
function sortEmployeesByNPK() {
    allEmployees.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        
        if (sortDirection === 'asc') {
            return npkA - npkB;
        } else {
            return npkB - npkA;
        }
    });
}

// Fungsi untuk toggle sorting NPK
function toggleNPKSort() {
    // Toggle direction
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    
    // Update indicator
    const indicator = document.getElementById('sort-indicator');
    if (indicator) {
        indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
    }
    
    // Sort ulang data
    sortEmployeesByNPK();
    
    // Update filtered data juga
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        // Jika ada pencarian aktif, filter ulang dengan urutan baru
        filteredEmployees = allEmployees.filter(employee => {
            return Object.values(employee).some(value => 
                value.toString().toLowerCase().includes(searchTerm)
            );
        });
    } else {
        filteredEmployees = [...allEmployees];
    }
    
    // Reset ke halaman pertama dan tampilkan data
    currentPage = 1;
    displayEmployeeData();
    createPagination();
}

// Fungsi untuk menampilkan data dengan pagination
function displayEmployeeData() {
    const tableBody = document.getElementById('employeeTableBody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (filteredEmployees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <i style="font-size: 48px; margin-bottom: 10px; display: block;">👥</i>
                        ${allEmployees.length === 0 ? 'Belum ada data karyawan. Klik "Tambah Karyawan" untuk memulai.' : 'Tidak ada data yang sesuai dengan pencarian.'}
                    </td>
                </tr>
            `;
            return;
        }
        
        // Hitung data untuk halaman saat ini
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = filteredEmployees.slice(startIndex, endIndex);
        
        currentPageData.forEach(employee => {
            const row = createEmployeeRow(employee);
            tableBody.appendChild(row);
        });
        
        updatePaginationInfo();
    }
}

// Fungsi untuk membuat pagination
function createPagination() {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container') || createPaginationContainer();
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Tombol Previous
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayEmployeeData();
            createPagination();
        }
    };
    paginationContainer.appendChild(prevBtn);
    
    // Nomor halaman
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const firstBtn = createPageButton(1);
        paginationContainer.appendChild(firstBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i);
        paginationContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        const lastBtn = createPageButton(totalPages);
        paginationContainer.appendChild(lastBtn);
    }
    
    // Tombol Next
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayEmployeeData();
            createPagination();
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Fungsi untuk membuat tombol halaman
function createPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNum === currentPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.onclick = () => {
        currentPage = pageNum;
        displayEmployeeData();
        createPagination();
    };
    return btn;
}

// Fungsi untuk membuat container pagination
function createPaginationContainer() {
    const container = document.createElement('div');
    container.id = 'pagination-container';
    container.className = 'pagination-container';
    
    const tableContainer = document.querySelector('#database-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(container);
    }
    
    return container;
}

// Fungsi untuk update info pagination
function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info') || createPaginationInfo();
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredEmployees.length);
    const total = filteredEmployees.length;
    
    paginationInfo.textContent = `Showing ${start}-${end} of ${total} data`;
}

// Fungsi untuk membuat info pagination
function createPaginationInfo() {
    const info = document.createElement('div');
    info.id = 'pagination-info';
    info.className = 'pagination-info';
    
    const tableContainer = document.querySelector('#database-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(info);
    }
    
    return info;
}

function createEmployeeRow(employee) {
    const row = document.createElement('tr');
    row.dataset.id = employee.id;
    
    const statusClass = getStatusClass(employee.status);
    const typeClass = employee.employeeType === 'Tetap' ? 'status-active' : 'status-warning';
    
    row.innerHTML = `
        <td>${employee.npk}</td>
        <td>${employee.nama}</td>
        <td>${employee.gender}</td>
        <td>${employee.section}</td>
        <td>${employee.line}</td>
        <td>${employee.leader}</td>
        <td>${formatDate(employee.dateIn)}</td>
        <td><span class="status-badge ${statusClass}">${employee.status}</span></td>
        <td><span class="status-badge ${typeClass}">${employee.employeeType || 'N/A'}</span></td>
        <td>${employee.function || 'N/A'}</td>
        <td>
            <button class="btn btn-warning btn-sm" onclick="editEmployee(this)">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEmployee(this)">Delete</button>
        </td>
    `;
    
    return row;
}

// ===== END CONTRACT FUNCTIONS =====
function loadEndContractData() {
    try {
        allEndContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
        
        // Check if required elements exist
        const tableBody = document.getElementById('endContractTableBody');
        if (!tableBody) {
            console.error('End Contract table body not found');
            return;
        }
        
        // Generate opsi filter bulan-tahun
        generateEndContractMonthYearOptions();
        
        // Generate opsi filter tahun
        generateEndContractYearOptions();
        
        // Urutkan berdasarkan NPK sesuai direction
        sortEndContractsByNPK();
        
        filteredEndContracts = [...allEndContracts];
        currentEndContractPage = 1;
        displayEndContractData();
        createEndContractPagination();
        initializeEndContractSearch();
    } catch (error) {
        console.error('Error loading End Contract data:', error);
        showNotification('Gagal memuat data End Contract', 'error');
    }
}

// Fungsi untuk sorting NPK End Contract
function sortEndContractsByNPK() {
    allEndContracts.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        
        if (endContractSortDirection === 'asc') {
            return npkA - npkB;
        } else {
            return npkB - npkA;
        }
    });
}

// Fungsi untuk toggle sorting NPK End Contract
function toggleEndContractNPKSort() {
    // Toggle direction
    endContractSortDirection = endContractSortDirection === 'asc' ? 'desc' : 'asc';
    
    // Update indicator
    const indicator = document.getElementById('end-contract-sort-indicator');
    if (indicator) {
        indicator.textContent = endContractSortDirection === 'asc' ? '↑' : '↓';
    }
    
    // Sort ulang data
    sortEndContractsByNPK();
    
    // Update filtered data juga
        const searchTerm = document.getElementById('endContractSearchInput')?.value.toLowerCase() || '';
        const monthFilter = document.getElementById('endContractMonthFilter')?.value || '';
        const yearFilter = document.getElementById('endContractYearFilter')?.value || '';
        
        applyEndContractFilters(searchTerm, monthFilter, yearFilter);
    
    // Reset ke halaman pertama dan tampilkan data
    currentEndContractPage = 1;
    displayEndContractData();
    createEndContractPagination();
}

// Fungsi untuk menampilkan data End Contract dengan pagination
function displayEndContractData() {
    const tableBody = document.getElementById('endContractTableBody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (filteredEndContracts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <i style="font-size: 48px; margin-bottom: 10px; display: block;">📋</i>
                        ${allEndContracts.length === 0 ? 'Belum ada data end contract. Klik "Tambah End Contract" untuk memulai.' : 'Tidak ada data yang sesuai dengan pencarian atau filter.'}
                    </td>
                </tr>
            `;
            updateEndContractPaginationInfo();
            return;
        }
        
        // Hitung data untuk halaman saat ini
        const startIndex = (currentEndContractPage - 1) * endContractItemsPerPage;
        const endIndex = startIndex + endContractItemsPerPage;
        const currentPageData = filteredEndContracts.slice(startIndex, endIndex);
        
        currentPageData.forEach(contract => {
            const row = createEndContractRow(contract);
            tableBody.appendChild(row);
        });
        
        updateEndContractPaginationInfo();
    }
}

// Fungsi untuk membuat pagination End Contract
function createEndContractPagination() {
    const totalPages = Math.ceil(filteredEndContracts.length / endContractItemsPerPage);
    const paginationContainer = document.getElementById('end-contract-pagination-container') || createEndContractPaginationContainer();
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Tombol Previous
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '← Previous';
    prevBtn.disabled = currentEndContractPage === 1;
    prevBtn.onclick = () => {
        if (currentEndContractPage > 1) {
            currentEndContractPage--;
            displayEndContractData();
            createEndContractPagination();
        }
    };
    paginationContainer.appendChild(prevBtn);
    
    // Nomor halaman
    const startPage = Math.max(1, currentEndContractPage - 2);
    const endPage = Math.min(totalPages, currentEndContractPage + 2);
    
    if (startPage > 1) {
        const firstBtn = createEndContractPageButton(1);
        paginationContainer.appendChild(firstBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createEndContractPageButton(i);
        paginationContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        const lastBtn = createEndContractPageButton(totalPages);
        paginationContainer.appendChild(lastBtn);
    }
    
    // Tombol Next
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Next →';
    nextBtn.disabled = currentEndContractPage === totalPages;
    nextBtn.onclick = () => {
        if (currentEndContractPage < totalPages) {
            currentEndContractPage++;
            displayEndContractData();
            createEndContractPagination();
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Fungsi untuk membuat tombol halaman End Contract
function createEndContractPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNum === currentEndContractPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.onclick = () => {
        currentEndContractPage = pageNum;
        displayEndContractData();
        createEndContractPagination();
    };
    return btn;
}

// Fungsi untuk membuat container pagination End Contract
function createEndContractPaginationContainer() {
    const container = document.createElement('div');
    container.id = 'end-contract-pagination-container';
    container.className = 'pagination-container';
    
    const tableContainer = document.querySelector('#end-contract-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(container);
    }
    
    return container;
}

// Fungsi untuk update info pagination End Contract
function updateEndContractPaginationInfo() {
    const paginationInfo = document.getElementById('end-contract-pagination-info') || createEndContractPaginationInfo();
    const start = (currentEndContractPage - 1) * endContractItemsPerPage + 1;
    const end = Math.min(currentEndContractPage * endContractItemsPerPage, filteredEndContracts.length);
    const total = filteredEndContracts.length;
    
    if (total > 0) {
        paginationInfo.textContent = `Showing ${start}-${end} of ${total} data`;
    } else {
        paginationInfo.textContent = 'No data to display';
    }
}

// Fungsi untuk membuat info pagination End Contract
function createEndContractPaginationInfo() {
    const info = document.createElement('div');
    info.id = 'end-contract-pagination-info';
    info.className = 'pagination-info';
    
    const tableContainer = document.querySelector('#end-contract-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(info);
    }
    
    return info;
}

// Fungsi untuk inisialisasi search End Contract
function initializeEndContractSearch() {
    const searchInput = document.getElementById('endContractSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const monthFilter = document.getElementById('endContractMonthFilter')?.value || '';
            const yearFilter = document.getElementById('endContractYearFilter')?.value || '';
            
            applyEndContractFilters(searchTerm, monthFilter, yearFilter);
            
            currentEndContractPage = 1;
            displayEndContractData();
            createEndContractPagination();
        });
    }
}

// Fungsi untuk generate opsi filter bulan-tahun
function generateEndContractMonthYearOptions() {
    const monthFilter = document.getElementById('endContractMonthFilter');
    if (!monthFilter) return;
    
    // Ambil semua bulan yang unik (tanpa tahun)
    const uniqueMonths = new Set();
    
    allEndContracts.forEach(contract => {
        if (contract.dateOut) {
            const date = new Date(contract.dateOut);
            const month = date.getMonth() + 1; // getMonth() returns 0-11
            uniqueMonths.add(month);
        }
    });
    
    // Convert ke array dan sort
    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => a - b);
    
    // Clear existing options kecuali yang pertama
    monthFilter.innerHTML = '<option value="">Semua Bulan</option>';
    
    // Tambahkan opsi bulan saja
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    sortedMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month.toString().padStart(2, '0'); // Format: "01", "02", etc.
        option.textContent = monthNames[month - 1]; // Hanya nama bulan
        monthFilter.appendChild(option);
    });
}

// Fungsi untuk generate opsi filter tahun
function generateEndContractYearOptions() {
    const yearFilter = document.getElementById('endContractYearFilter');
    if (!yearFilter) return;
    
    // Ambil semua tahun yang unik dari dateOut
    const uniqueYears = new Set();
    
    allEndContracts.forEach(contract => {
        if (contract.dateOut) {
            const date = new Date(contract.dateOut);
            const year = date.getFullYear();
            uniqueYears.add(year);
        }
    });
    
    // Convert ke array dan sort (terbaru di atas)
    const sortedYears = Array.from(uniqueYears).sort().reverse();
    
    // Clear existing options kecuali yang pertama
    yearFilter.innerHTML = '<option value="">Semua Tahun</option>';
    
    // Tambahkan opsi tahun
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Fungsi untuk filter berdasarkan bulan
function filterEndContractByMonth() {
    const monthFilter = document.getElementById('endContractMonthFilter')?.value || '';
    const yearFilter = document.getElementById('endContractYearFilter')?.value || '';
    const searchTerm = document.getElementById('endContractSearchInput')?.value.toLowerCase() || '';
    
    applyEndContractFilters(searchTerm, monthFilter, yearFilter);
    
    currentEndContractPage = 1;
    displayEndContractData();
    createEndContractPagination();
}

// Fungsi untuk menerapkan filter search dan bulan
function applyEndContractFilters(searchTerm, monthFilter, yearFilter) {
    filteredEndContracts = allEndContracts.filter(contract => {
        // Filter berdasarkan search term
        const matchesSearch = !searchTerm || Object.values(contract).some(value => 
            value.toString().toLowerCase().includes(searchTerm)
        );
        
        // Filter berdasarkan bulan dan tahun (dari dateOut)
        let matchesMonth = true;
        let matchesYear = true;
        
        if (contract.dateOut) {
            const date = new Date(contract.dateOut);
            const contractYear = date.getFullYear();
            const contractMonth = (date.getMonth() + 1).toString().padStart(2, '0');
            
            if (monthFilter) {
                matchesMonth = contractMonth === monthFilter;
            }
            
            if (yearFilter) {
                matchesYear = contractYear.toString() === yearFilter;
            }
        } else {
            // Jika tidak ada dateOut, tidak cocok dengan filter bulan/tahun
            if (monthFilter || yearFilter) {
                matchesMonth = false;
                matchesYear = false;
            }
        }
        
        return matchesSearch && matchesMonth && matchesYear;
    });
}

function createEndContractRow(contract) {
    const row = document.createElement('tr');
    row.dataset.id = contract.id;
    
    const statusClass = contract.status === 'Selesai' ? 'status-active' : 'status-pending';
    
    row.innerHTML = `
        <td>${contract.npk}</td>
        <td>${contract.nama}</td>
        <td>${contract.gender}</td>
        <td>${contract.section}</td>
        <td>${contract.line}</td>
        <td>${contract.leader}</td>
        <td>${formatDate(contract.dateIn)}</td>
        <td>${contract.contractDuration}</td>
        <td>${formatDate(contract.dateOut)}</td>
        <td>${contract.reason}</td>
        <td><span class="status-badge ${statusClass}">${contract.status}</span></td>
        <td>
            <button class="btn btn-warning btn-sm" onclick="editEndContract(this)">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEndContract(this)">Delete</button>
        </td>
    `;
    
    return row;
}

function saveEndContract(formData) {
    const contracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    
    const contractData = {
        npk: formData.get('npk'),
        nama: formData.get('nama'),
        gender: formData.get('gender'),
        section: formData.get('section'),
        line: formData.get('line'),
        leader: formData.get('leader'),
        dateIn: formData.get('dateIn'),
        contractDuration: formData.get('contractDuration'), // Numeric value only (e.g., "24")
        dateOut: formData.get('dateOut'),
        reason: formData.get('reason'),
        status: formData.get('status')
    };
    
    // Validate required fields
    const requiredFields = ['npk', 'nama', 'gender', 'section', 'line', 'leader', 'dateIn', 'contractDuration', 'reason', 'status'];
    const missingFields = requiredFields.filter(field => !contractData[field]);
    
    if (missingFields.length > 0) {
        showNotification('Mohon pilih karyawan kontrak dan lengkapi semua field!', 'error');
        return;
    }
    
    if (window.editingRow) {
        // Update existing
        const contractId = parseInt(window.editingRow.dataset.id);
        const contractIndex = contracts.findIndex(c => c.id === contractId);
        
        if (contractIndex !== -1) {
            contracts[contractIndex] = {
                ...contracts[contractIndex],
                ...contractData,
                updatedAt: new Date().toISOString()
            };
            
            saveToLocalStorage(STORAGE_KEYS.endContracts, contracts);
            loadEndContractData();
            showNotification('Data end contract berhasil diupdate!', 'success');
        }
    } else {
        // Add new
        const newContract = {
            id: generateId(contracts),
            ...contractData,
            createdAt: new Date().toISOString()
        };
        
        contracts.push(newContract);
        saveToLocalStorage(STORAGE_KEYS.endContracts, contracts);
        loadEndContractData();
        showNotification('Data end contract berhasil ditambahkan!', 'success');
    }
    
    updateDashboardStats();
    updateCharts();
}

function editEndContract(button) {
    const row = button.closest('tr');
    const contractId = parseInt(row.dataset.id);
    const contracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    const contract = contracts.find(c => c.id === contractId);
    
    if (contract) {
        window.editingRow = row;
        window.currentModule = 'endContract';
        openModal('end-contract');
        
        // Fill form after modal opens
        setTimeout(() => {
            // Find and select the employee in dropdown
            const employeeSelect = document.getElementById('modal-employeeSelect');
            for (let option of employeeSelect.options) {
                if (option.value === contract.npk) {
                    option.selected = true;
                    break;
                }
            }
            
            // Fill other fields
            document.getElementById('modal-npk').value = contract.npk;
            document.getElementById('modal-nama').value = contract.nama;
            document.getElementById('modal-gender').value = contract.gender;
            document.getElementById('modal-section').value = contract.section;
            document.getElementById('modal-line').value = contract.line;
            document.getElementById('modal-leader').value = contract.leader;
            document.getElementById('modal-dateIn').value = contract.dateIn;
            document.getElementById('modal-contractDuration').value = contract.contractDuration;
            document.getElementById('modal-dateOut').value = contract.dateOut;
            document.getElementById('modal-reason').value = contract.reason;
            document.getElementById('modal-status').value = contract.status;
        }, 100);
    }
}

function deleteEndContract(button) {
    const row = button.closest('tr');
    const contractId = parseInt(row.dataset.id);
    const contracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    const contract = contracts.find(c => c.id === contractId);
    
    if (contract && confirm(`Yakin ingin menghapus data end contract "${contract.nama}"?`)) {
        const updatedContracts = contracts.filter(c => c.id !== contractId);
        saveToLocalStorage(STORAGE_KEYS.endContracts, updatedContracts);
        
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            loadEndContractData();
            updateDashboardStats();
            updateCharts();
            showNotification('Data end contract berhasil dihapus!', 'success');
        }, 300);
    }
}

// ===== RECRUITMENT FUNCTIONS =====
function loadRecruitmentData() {
    const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
    
    // Sort endContracts by NPK (ascending)
    endContracts.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        return npkA - npkB;
    });
    
    // Populate year filter
    populateRecruitmentYearFilter(endContracts);
    
    // Store original data for filtering
    window.recruitmentData = endContracts.map(endContract => {
        const existingRecruitment = recruitment.find(r => r.npkEnd === endContract.npk);
        
        return {
            id: existingRecruitment?.id || generateId(recruitment),
            // Data dari MP End (otomatis)
            npkEnd: endContract.npk,
            namaEnd: endContract.nama,
            dateOut: endContract.dateOut,
            sectionEnd: endContract.section,
            // Data dari Database MP (manual)
            npkDb: existingRecruitment?.npkDb || '',
            namaDb: existingRecruitment?.namaDb || '',
            genderDb: existingRecruitment?.genderDb || '',
            sectionDb: existingRecruitment?.sectionDb || '',
            lineDb: existingRecruitment?.lineDb || '',
            leaderDb: existingRecruitment?.leaderDb || '',
            dateInDb: existingRecruitment?.dateInDb || '',
            rekomendasi: existingRecruitment?.rekomendasi || ''
        };
    });
    
    // Reset pagination
    currentRecruitmentPage = 1;
    
    // Apply current filters
    filterRecruitmentData();
}

function populateRecruitmentYearFilter(endContracts) {
    const yearFilter = document.getElementById('recruitmentYearFilter');
    if (!yearFilter) return;
    
    // Get unique years from dateOut
    const years = [...new Set(endContracts
        .filter(ec => ec.dateOut)
        .map(ec => new Date(ec.dateOut).getFullYear())
        .filter(year => !isNaN(year))
    )].sort((a, b) => b - a); // Descending order
    
    // Clear existing options except "Semua Tahun"
    yearFilter.innerHTML = '<option value="all">Semua Tahun</option>';
    
    // Add year options
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function filterRecruitmentData() {
    const monthFilter = document.getElementById('recruitmentMonthFilter')?.value || 'all';
    const yearFilter = document.getElementById('recruitmentYearFilter')?.value || 'all';
    const searchTerm = document.getElementById('recruitmentSearch')?.value.toLowerCase() || '';
    
    if (!window.recruitmentData) {
        console.warn('Recruitment data not loaded yet');
        return;
    }
    
    let filteredData = window.recruitmentData.filter(recruit => {
        // Filter by month and year (based on dateOut)
        if (recruit.dateOut && (monthFilter !== 'all' || yearFilter !== 'all')) {
            const dateOut = new Date(recruit.dateOut);
            const month = String(dateOut.getMonth() + 1).padStart(2, '0');
            const year = dateOut.getFullYear();
            
            if (monthFilter !== 'all' && month !== monthFilter) return false;
            if (yearFilter !== 'all' && year !== parseInt(yearFilter)) return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const searchFields = [
                recruit.npkEnd, recruit.namaEnd, recruit.sectionEnd,
                recruit.npkDb, recruit.namaDb, recruit.sectionDb, 
                recruit.lineDb, recruit.leaderDb, recruit.rekomendasi
            ].filter(field => field).join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) return false;
        }
        
        return true;
    });
    
    // Sort by NPK
    sortRecruitmentByNPK(filteredData);
    
    // Reset to first page when filtering
    currentRecruitmentPage = 1;
    
    // Render filtered data
    renderRecruitmentTable(filteredData);
}

// Function to sort recruitment by NPK
function sortRecruitmentByNPK(data) {
    data.sort((a, b) => {
        const npkA = parseInt(a.npkEnd) || 0;
        const npkB = parseInt(b.npkEnd) || 0;
        
        if (recruitmentSortDirection === 'asc') {
            return npkA - npkB;
        } else {
            return npkB - npkA;
        }
    });
}

// Function to toggle NPK sort direction
function toggleRecruitmentNPKSort() {
    recruitmentSortDirection = recruitmentSortDirection === 'asc' ? 'desc' : 'asc';
    
    const indicator = document.getElementById('recruitment-sort-indicator');
    if (indicator) {
        indicator.textContent = recruitmentSortDirection === 'asc' ? '↑' : '↓';
    }
    
    // Re-apply current filters with new sort
    filterRecruitmentData();
}

// Function to create recruitment pagination
function createRecruitmentPagination() {
    const totalPages = Math.ceil(filteredRecruitmentData.length / recruitmentItemsPerPage);
    const paginationContainer = document.getElementById('recruitment-pagination-container') || createRecruitmentPaginationContainer();
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '← Previous';
    prevBtn.disabled = currentRecruitmentPage === 1;
    prevBtn.onclick = () => {
        if (currentRecruitmentPage > 1) {
            currentRecruitmentPage--;
            renderRecruitmentTable(filteredRecruitmentData);
        }
    };
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentRecruitmentPage - 2);
    const endPage = Math.min(totalPages, currentRecruitmentPage + 2);
    
    if (startPage > 1) {
        const firstBtn = createRecruitmentPageButton(1);
        paginationContainer.appendChild(firstBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createRecruitmentPageButton(i);
        paginationContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        const lastBtn = createRecruitmentPageButton(totalPages);
        paginationContainer.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Next →';
    nextBtn.disabled = currentRecruitmentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentRecruitmentPage < totalPages) {
            currentRecruitmentPage++;
            renderRecruitmentTable(filteredRecruitmentData);
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Function to create recruitment page button
function createRecruitmentPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNum === currentRecruitmentPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.onclick = () => {
        currentRecruitmentPage = pageNum;
        renderRecruitmentTable(filteredRecruitmentData);
        createRecruitmentPagination();
    };
    return btn;
}

// Function to create recruitment pagination container
function createRecruitmentPaginationContainer() {
    const container = document.createElement('div');
    container.id = 'recruitment-pagination-container';
    container.className = 'pagination-container';
    
    const tableContainer = document.querySelector('#recruitment-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(container);
    }
    
    return container;
}

// Function to update recruitment pagination info
function updateRecruitmentPaginationInfo() {
    const paginationInfo = document.getElementById('recruitment-pagination-info') || createRecruitmentPaginationInfo();
    
    if (filteredRecruitmentData.length === 0) {
        paginationInfo.textContent = 'No data to display';
        return;
    }
    
    const start = (currentRecruitmentPage - 1) * recruitmentItemsPerPage + 1;
    const end = Math.min(currentRecruitmentPage * recruitmentItemsPerPage, filteredRecruitmentData.length);
    const total = filteredRecruitmentData.length;
    
    paginationInfo.textContent = `Showing ${start}-${end} of ${total} data`;
}

// Function to create recruitment pagination info
function createRecruitmentPaginationInfo() {
    const info = document.createElement('div');
    info.id = 'recruitment-pagination-info';
    info.className = 'pagination-info';
    
    const tableContainer = document.querySelector('#recruitment-section .table-container');
    if (tableContainer) {
        tableContainer.appendChild(info);
    }
    
    return info;
}

// Function to change recruitment page
function changeRecruitmentPage(page) {
    currentRecruitmentPage = page;
    renderRecruitmentTable(filteredRecruitmentData);
    createRecruitmentPagination();
}

function renderRecruitmentTable(data) {
    const tableBody = document.getElementById('recruitmentTableBody');
    
    if (!tableBody) {
        console.error('Recruitment table body not found');
        return;
    }
    
    // Store filtered data globally
    filteredRecruitmentData = data;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center" style="padding: 40px; color: #666;">
                    <div style="font-size: 18px; margin-bottom: 10px;">📋</div>
                    Tidak ada data yang sesuai dengan filter.
                </td>
            </tr>
        `;
        updateRecruitmentPaginationInfo();
        return;
    }
    
    // Calculate data for current page
    const startIndex = (currentRecruitmentPage - 1) * recruitmentItemsPerPage;
    const endIndex = startIndex + recruitmentItemsPerPage;
    const currentPageData = data.slice(startIndex, endIndex);
    
    currentPageData.forEach(recruit => {
        const row = createRecruitmentRow(recruit);
        tableBody.appendChild(row);
    });
    
    // Update pagination
    createRecruitmentPagination();
    updateRecruitmentPaginationInfo();
}

function createRecruitmentRow(recruit) {
    const row = document.createElement('tr');
    row.dataset.id = recruit.id;
    row.dataset.npkEnd = recruit.npkEnd;
    
    row.innerHTML = `
        <!-- Data dari MP End (Otomatis) -->
        <td style="background-color: #fff8dc;">${recruit.npkEnd || '-'}</td>
        <td style="background-color: #fff8dc;">${recruit.namaEnd || '-'}</td>
        <td style="background-color: #fff8dc;">${recruit.dateOut ? formatDate(recruit.dateOut) : '-'}</td>
        <!-- Data dari Database MP (Manual) -->
        <td style="background-color: #f0f8ff;">${recruit.npkDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.namaDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.genderDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.sectionDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.lineDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.leaderDb || '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.dateInDb ? formatDate(recruit.dateInDb) : '-'}</td>
        <td style="background-color: #f0f8ff;">${recruit.rekomendasi || '-'}</td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="editRecruitment(this)" title="Edit Data Database MP">
                <i>✏️</i> Edit
            </button>
        </td>
    `;
    
    return row;
}

function saveRecruitment(formData) {
    const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
    const npkEnd = formData.get('npkEnd');
    
    const recruitData = {
        // Data dari MP End (otomatis - tidak berubah)
        npkEnd: formData.get('npkEnd'),
        namaEnd: formData.get('namaEnd'),
        dateOut: formData.get('dateOut'),
        
        // Data dari Database MP (manual)
        npkDb: formData.get('npkDb'),
        namaDb: formData.get('namaDb'),
        genderDb: formData.get('genderDb'),
        sectionDb: formData.get('sectionDb'),
        lineDb: formData.get('lineDb'),
        leaderDb: formData.get('leaderDb'),
        dateInDb: formData.get('dateInDb'),
        rekomendasi: formData.get('rekomendasi'),
        
        dateUpdated: new Date().toISOString()
    };
    
    // Find existing recruitment by npkEnd
    const existingIndex = recruitment.findIndex(r => r.npkEnd === npkEnd);
    
    if (existingIndex !== -1) {
        // Update existing
        recruitment[existingIndex] = {
            ...recruitment[existingIndex],
            ...recruitData
        };
        showNotification('Data recruitment berhasil diupdate!', 'success');
    } else {
        // Add new
        const newRecruit = {
            id: generateId(recruitment),
            ...recruitData,
            dateCreated: new Date().toISOString()
        };
        recruitment.push(newRecruit);
        showNotification('Data recruitment berhasil ditambahkan!', 'success');
    }
    
    saveToLocalStorage(STORAGE_KEYS.recruitment, recruitment);
    loadRecruitmentData(); // Reload with current filters
    closeModal();
}

function editRecruitment(button) {
    const row = button.closest('tr');
    const npkEnd = row.dataset.npkEnd;
    
    const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
    const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    
    const endContract = endContracts.find(ec => ec.npk === npkEnd);
    const existingRecruitment = recruitment.find(r => r.npkEnd === npkEnd);
    
    window.editingRow = row;
    window.currentModule = 'recruitment';
    
    // Update modal title
    const modalTitle = document.querySelector('#dataModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Edit Data Recruitment - ${endContract?.nama || npkEnd}`;
    }
    
    openModal('recruitment');
    
    // Fill data MP End (read-only)
    document.getElementById('modal-npk-end').value = endContract?.npk || '';
    document.getElementById('modal-nama-end').value = endContract?.nama || '';
    document.getElementById('modal-dateOut').value = endContract?.dateOut || '';
    
    // Fill data Database MP (editable)
    if (existingRecruitment) {
        document.getElementById('modal-npk-db').value = existingRecruitment.npkDb || '';
        document.getElementById('modal-nama-db').value = existingRecruitment.namaDb || '';
        document.getElementById('modal-gender-db').value = existingRecruitment.genderDb || '';
        document.getElementById('modal-section-db').value = existingRecruitment.sectionDb || '';
        document.getElementById('modal-line-db').value = existingRecruitment.lineDb || '';
        document.getElementById('modal-leader-db').value = existingRecruitment.leaderDb || '';
        document.getElementById('modal-dateIn-db').value = existingRecruitment.dateInDb || '';
        document.getElementById('modal-rekomendasi').value = existingRecruitment.rekomendasi || '';
    } else {
        // Clear form for new entry
        ['modal-npk-db', 'modal-nama-db', 'modal-gender-db', 'modal-section-db', 
         'modal-line-db', 'modal-leader-db', 'modal-dateIn-db', 'modal-rekomendasi'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    }
}

function deleteRecruitment(button) {
    const row = button.closest('tr');
    const recruitId = parseInt(row.dataset.id);
    const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
    const recruit = recruitment.find(r => r.id === recruitId);
    
    if (recruit && confirm(`Yakin ingin menghapus data recruitment "${recruit.nama}"?`)) {
        const updatedRecruitment = recruitment.filter(r => r.id !== recruitId);
        saveToLocalStorage(STORAGE_KEYS.recruitment, updatedRecruitment);
        
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            loadRecruitmentData();
            updateDashboardStats();
            updateCharts();
            showNotification('Data recruitment berhasil dihapus!', 'success');
        }, 300);
    }
}

// ===== SKILL MATRIX FUNCTIONS =====
let allSkillMatrix = [];

function loadSkillMatrixData() {
    try {
        allSkillMatrix = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
        
        // Check if required elements exist
        const tableBody = document.getElementById('skillMatrixTableBody');
        if (!tableBody) {
            console.error('Skill Matrix table body not found');
            return;
        }
        
        generateSkillMatrixSectionFilter();
        displaySkillMatrixData();
        
        // Update counter setelah load data
        updateSearchResultCounter();
        
        // Populate line filter options
        populateLineFilter();
    } catch (error) {
        console.error('Error loading Skill Matrix data:', error);
        showNotification('Gagal memuat data Skill Matrix', 'error');
    }
}

// Fungsi untuk populate line filter berdasarkan data yang ada
function populateLineFilter() {
    const lineFilter = document.getElementById('skillMatrixLineFilter');
    const sectionFilter = document.getElementById('skillMatrixSectionFilter');
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    const skillMatrixData = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
    
    if (!lineFilter) return;
    
    // Filter data berdasarkan mode dan section
    let filteredData = skillMatrixData.filter(data => {
        const dataMode = data.evaluationMode || 'comp-assy';
        return dataMode === currentMode;
    });
    
    // Further filter by section if selected
    const selectedSection = sectionFilter?.value;
    if (selectedSection && selectedSection !== 'all') {
        filteredData = filteredData.filter(data => data.section === selectedSection);
    }
    
    // Ambil unique lines
    const uniqueLines = [...new Set(filteredData.map(data => data.line))]
        .filter(line => line) // Remove empty lines
        .sort();
    
    // Clear existing options (except "Semua Line")
    lineFilter.innerHTML = '<option value="all">Semua Line</option>';
    
    // Tambahkan line options
    uniqueLines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        lineFilter.appendChild(option);
    });
}

function generateSkillMatrixSectionFilter() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees) || [];
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    
    // Filter sections based on selected mode
    let relevantSections = [];
    if (currentMode === 'comp-assy') {
        relevantSections = ['Comp Assy'];
    } else if (currentMode === 'comp-wclutch') {
        relevantSections = ['Comp WClutch'];
    }
    
    // Get sections that exist in employee data and match the mode
    const existingSections = [...new Set(employees.map(emp => emp.section))]
        .filter(section => relevantSections.includes(section))
        .sort();
    
    const sectionFilter = document.getElementById('skillMatrixSectionFilter');
    if (sectionFilter) {
        // Simpan nilai yang dipilih sebelumnya
        const currentValue = sectionFilter.value;
        
        sectionFilter.innerHTML = '<option value="all">Semua Section</option>';
        
        existingSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionFilter.appendChild(option);
        });
        
        // Restore nilai yang dipilih sebelumnya jika masih ada
        if (currentValue && existingSections.includes(currentValue)) {
            sectionFilter.value = currentValue;
        } else if (existingSections.length === 1) {
            // Auto-select if only one section available
            sectionFilter.value = existingSections[0];
        }
    }
    
    // Update line filter berdasarkan section yang dipilih
    updateSkillMatrixLineFilterOptions();
}

function populateEmployeeDropdown() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees) || [];
    
    // Populate Section dropdown
    const sectionSelect = document.getElementById('skillMatrixSectionSelect');
    if (sectionSelect) {
        const sections = [...new Set(employees.map(emp => emp.section))].sort();
        sectionSelect.innerHTML = '<option value="">-- Pilih Section --</option>';
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
    }
    
    // Clear other dropdowns
    const lineSelect = document.getElementById('skillMatrixLineSelect');
    const employeeSelect = document.getElementById('employeeSelect');
    
    if (lineSelect) {
        lineSelect.innerHTML = '<option value="">-- Pilih Line --</option>';
        lineSelect.disabled = true;
    }
    
    if (employeeSelect) {
        employeeSelect.innerHTML = '<option value="">-- Pilih Karyawan --</option>';
        employeeSelect.disabled = true;
    }
}

function displaySkillMatrixData() {
    const tableBody = document.getElementById('skillMatrixTableBody');
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    const modeConfig = evaluationModeSkills[currentMode];
    
    if (!tableBody) {
        console.error('Skill Matrix table body tidak ditemukan');
        return;
    }
    
    // Clear previous highlighting
    clearSkillMatrixHeaderHighlight();
    
    tableBody.innerHTML = '';
    
    const sectionFilter = document.getElementById('skillMatrixSectionFilter')?.value || 'all';
    const lineFilter = document.getElementById('skillMatrixLineFilter')?.value || 'all';
    const searchTerm = document.getElementById('skillMatrixSearch')?.value.toLowerCase() || '';
    
    let filteredData = allSkillMatrix;
    
    // Filter data berdasarkan mode yang dipilih
    filteredData = filteredData.filter(data => {
        // Jika data tidak memiliki evaluationMode, tentukan berdasarkan section
        if (!data.evaluationMode) {
            // Assign evaluationMode berdasarkan section untuk backward compatibility
            if (data.section && data.section.toLowerCase().includes('wclutch')) {
                data.evaluationMode = 'comp-wclutch';
            } else {
                data.evaluationMode = 'comp-assy';
            }
        }
        return data.evaluationMode === currentMode;
    });
    
    // Apply filters
    if (sectionFilter !== 'all') {
        filteredData = filteredData.filter(item => item.section === sectionFilter);
    }
    
    if (lineFilter !== 'all') {
        filteredData = filteredData.filter(item => item.line === lineFilter);
    }
    
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.nama.toLowerCase().includes(searchTerm) ||
            item.npk.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by NPK
    filteredData.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        return skillMatrixSortDirection === 'asc' ? npkA - npkB : npkB - npkA;
    });
    
    // Display data
    if (filteredData.length === 0) {
        const colspan = 5 + (modeConfig ? modeConfig.totalSkills : 47) + 1; // NPK, Nama, Section, Line, Pos + skills + Action
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 20px; color: #6c757d;">Tidak ada data skill matrix untuk mode ${modeConfig ? modeConfig.name : 'ini'}</td></tr>`;
        return;
    }
    
    // Highlight header columns based on current positions
    highlightSkillMatrixHeaders(filteredData);
    
    filteredData.forEach(item => {
        const row = createSkillMatrixRowForMode(item, modeConfig);
        tableBody.appendChild(row);
    });
}

function createSkillMatrixRow(skillData) {
    const row = document.createElement('tr');
    row.dataset.id = skillData.id;
    
    const positionMap = {
        'mizusumashi-towing': 'Mizusumashi Towing',
        'mizusumashi-shaft': 'Mizusumashi Shaft',
        'pre-check': 'Pre Check',
        'part-washing-big-part-in': 'Part Washing Big Part (IN)',
        'part-washing-inner-part-in': 'Part Washing Inner Part (IN)',
        'pass-room-prepare-piston': 'Pass Room (Prepare Piston)',
        'pass-room-prepare-gasket': 'Pass Room (Prepare Gasket)',
        'prepare-thrust-bearing': 'Prepare Thrust Bearing',
        'prepare-oring-prv': 'Prepare Oring PRV',
        'bearing-assy': 'Bearing Assy',
        'bushing-assy': 'Bushing Assy',
        'mizusumashi-assy': 'Mizusumashi Assy',
        'part-washing-inner-part-out-lip-seal': 'Part Washing Inner Part (OUT) LIP Seal Assy',
        'part-washing-inner-part-out': 'Part Washing Inner Part (OUT)',
        'prv-assy': 'PRV Assy',
        'piston-swash': 'Piston & Swash Measuring',
        'shoe-selecting': 'Shoe Selecting',
        'cylinder-block': 'Cylinder Block Assy',
        'shoe-clearance-muffler-bolt': 'Shoe Clearance & Muffler Bolt',
        'qr-code-label-press-pin': 'QR Code Label Assy & Press Pin',
        'front-side-assy': 'Front Side Assy',
        'front-housing-assy': 'Front Housing Assy',
        'rear-housing-assy': 'Rear Housing Assy',
        'housing-bolt': 'Housing Bolt',
        'bolt-tightening': 'Bolt Tightening',
        'concentricity-torque-check': 'Concentricity Check & Torque Check',
        'empty-weight-dummy-assy': 'Empty Weight & Dummy Assy',
        'vacuum-gas-charging': 'Vacuum & Gas Charging',
        'helium-leak-test': 'Helium Leak Test',
        'high-pressure-check': 'High Pressure Check',
        'performance-test': 'Performance Test',
        'release-dummy': 'Release Dummy',
        'pre-oil-oil-filling': 'Pre Oil & Oil Filling',
        'seal-cap-assy': 'Seal Cap Assy',
        'flange-assy': 'Flange Assy',
        'air-leak-test': 'Air Leak Test',
        'gas-release': 'Gas Release',
        'seal-cap-assy-2': 'Seal Cap Assy 2',
        'final-washing': 'Final Washing',
        'name-plate-assy': 'Name Plate Assy',
        'thermal-sensor': 'Thermal Sensor',
        'felt-assy': 'Felt Assy',
        'foot-boshi-check': 'Foot & Boshi Check',
        'robot-final-check': 'Robot Final Check',
        'taking-laser-name-plate': 'Taking & Laser Name Plate',
        'repair-shoe-clearance': 'Repair Shoe Clearance',
        'repair-dipping': 'Repair Dipping'
    };
    const positionDisplay = positionMap[skillData.position] || skillData.position || '-';
    
    // Map semua posisi ke skill column index (1-based)
    const positionToSkillMap = {
        'mizusumashi-towing': 1,
        'mizusumashi-shaft': 2,
        'pre-check': 3,
        'part-washing-big-part-in': 4,
        'part-washing-inner-part-in': 5,
        'pass-room-prepare-piston': 6,
        'pass-room-prepare-gasket': 7,
        'prepare-thrust-bearing': 8,
        'prepare-oring-prv': 9,
        'bearing-assy': 10,
        'bushing-assy': 11,
        'mizusumashi-assy': 12,
        'part-washing-inner-part-out-lip-seal': 13,
        'part-washing-inner-part-out': 14,
        'prv-assy': 15,
        'piston-swash': 16,
        'shoe-selecting': 17,
        'cylinder-block': 18,
        'shoe-clearance-muffler-bolt': 19,
        'qr-code-label-press-pin': 20,
        'front-side-assy': 21,
        'front-housing-assy': 22,
        'rear-housing-assy': 23,
        'housing-bolt': 24,
        'bolt-tightening': 25,
        'concentricity-torque-check': 26,
        'empty-weight-dummy-assy': 27,
        'vacuum-gas-charging': 28,
        'helium-leak-test': 29,
        'high-pressure-check': 30,
        'performance-test': 31,
        'release-dummy': 32,
        'pre-oil-oil-filling': 33,
        'seal-cap-assy': 34,
        'flange-assy': 35,
        'air-leak-test': 36,
        'gas-release': 37,
        'seal-cap-assy-2': 38,
        'final-washing': 39,
        'name-plate-assy': 40,
        'thermal-sensor': 41,
        'felt-assy': 42,
        'foot-boshi-check': 43,
        'robot-final-check': 44,
        'taking-laser-name-plate': 45,
        'repair-shoe-clearance': 46,
        'repair-dipping': 47
    };
    
    // Generate skill columns dynamically
    let skillColumns = '';
    for (let i = 1; i <= 47; i++) {
        const skillValue = skillData.skills[`skill${i}`] || 0;
        const currentPositionSkill = positionToSkillMap[skillData.position];
        const isCurrentPosition = (i === currentPositionSkill);
        
        skillColumns += `<td class="${isCurrentPosition ? 'current-position-skill' : ''}">${createSkillRatingHTML(skillValue, isCurrentPosition)}</td>`;
    }
    
    row.innerHTML = `
        <td>${skillData.npk}</td>
        <td>${skillData.nama}</td>
        <td>${skillData.section}</td>
        <td>${skillData.line}</td>
        <td class="position-cell" data-position="${skillData.position}" style="cursor: pointer; color: #007bff; text-decoration: underline;" onclick="scrollToPositionColumn('${skillData.position}')">${positionDisplay}</td>
        ${skillColumns}
        <td>
            <button class="btn btn-warning btn-sm" onclick="editSkillMatrix(this)">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSkillMatrix(this)">Delete</button>
        </td>
    `;
    
    return row;
}

// New function to create skill matrix row based on mode
function createSkillMatrixRowForMode(skillData, modeConfig) {
    const row = document.createElement('tr');
    row.dataset.id = skillData.id;
    
    const positionMap = {
        'mizusumashi-towing': 'Mizusumashi Towing',
        'mizusumashi-shaft': 'Mizusumashi Shaft',
        'pre-check': 'Pre Check',
        'part-washing-big-part-in': 'Part Washing Big Part (IN)',
        'part-washing-inner-part-in': 'Part Washing Inner Part (IN)',
        'pass-room-prepare-piston': 'Pass Room (Prepare Piston)',
        'pass-room-prepare-gasket': 'Pass Room (Prepare Gasket)',
        'prepare-thrust-bearing': 'Prepare Thrust Bearing',
        'prepare-oring-prv': 'Prepare Oring PRV',
        'bearing-assy': 'Bearing Assy',
        'bushing-assy': 'Bushing Assy',
        'mizusumashi-assy': 'Mizusumashi Assy',
        'part-washing-inner-part-out-lip-seal': 'Part Washing Inner Part (OUT) LIP Seal Assy',
        'part-washing-inner-part-out': 'Part Washing Inner Part (OUT)',
        'prv-assy': 'PRV Assy',
        'piston-swash': 'Piston & Swash Measuring',
        'shoe-selecting': 'Shoe Selecting',
        'cylinder-block': 'Cylinder Block Assy',
        'shoe-clearance-muffler-bolt': 'Shoe Clearance & Muffler Bolt',
        'qr-code-label-press-pin': 'QR Code Label Assy & Press Pin',
        'front-side-assy': 'Front Side Assy',
        'front-housing-assy': 'Front Housing Assy',
        'rear-housing-assy': 'Rear Housing Assy',
        'housing-bolt': 'Housing Bolt',
        'bolt-tightening': 'Bolt Tightening',
        'concentricity-torque-check': 'Concentricity Check & Torque Check',
        'empty-weight-dummy-assy': 'Empty Weight & Dummy Assy',
        'vacuum-gas-charging': 'Vacuum & Gas Charging',
        'helium-leak-test': 'Helium Leak Test',
        'high-pressure-check': 'High Pressure Check',
        'performance-test': 'Performance Test',
        'release-dummy': 'Release Dummy',
        'pre-oil-oil-filling': 'Pre Oil & Oil Filling',
        'seal-cap-assy': 'Seal Cap Assy',
        'flange-assy': 'Flange Assy',
        'air-leak-test': 'Air Leak Test',
        'gas-release': 'Gas Release',
        'seal-cap-assy-2': 'Seal Cap Assy 2',
        'final-washing': 'Final Washing',
        'name-plate-assy': 'Name Plate Assy',
        'thermal-sensor': 'Thermal Sensor',
        'felt-assy': 'Felt Assy',
        'foot-boshi-check': 'Foot & Boshi Check',
        'robot-final-check': 'Robot Final Check',
        'taking-laser-name-plate': 'Taking & Laser Name Plate',
        'repair-shoe-clearance': 'Repair Shoe Clearance',
        'repair-dipping': 'Repair Dipping'
    };
    const positionDisplay = positionMap[skillData.position] || skillData.position || '-';
    
    // Map posisi ke skill column index (1-based)
    const positionToSkillMap = {
        'mizusumashi-towing': 1,
        'mizusumashi-shaft': 2,
        'pre-check': 3,
        'part-washing-big-part-in': 4,
        'part-washing-inner-part-in': 5,
        'pass-room-prepare-piston': 6,
        'pass-room-prepare-gasket': 7,
        'prepare-thrust-bearing': 8,
        'prepare-oring-prv': 9,
        'bearing-assy': 10,
        'bushing-assy': 11,
        'mizusumashi-assy': 12,
        'part-washing-inner-part-out-lip-seal': 13,
        'part-washing-inner-part-out': 14,
        'prv-assy': 15,
        'piston-swash': 16,
        'shoe-selecting': 17,
        'cylinder-block': 18,
        'shoe-clearance-muffler-bolt': 19,
        'qr-code-label-press-pin': 20,
        'front-side-assy': 21,
        'front-housing-assy': 22,
        'rear-housing-assy': 23,
        'housing-bolt': 24,
        'bolt-tightening': 25,
        'concentricity-torque-check': 26,
        'empty-weight-dummy-assy': 27,
        'vacuum-gas-charging': 28,
        'helium-leak-test': 29,
        'high-pressure-check': 30,
        'performance-test': 31,
        'release-dummy': 32,
        'pre-oil-oil-filling': 33,
        'seal-cap-assy': 34,
        'flange-assy': 35,
        'air-leak-test': 36,
        'gas-release': 37,
        'seal-cap-assy-2': 38,
        'final-washing': 39,
        'name-plate-assy': 40,
        'thermal-sensor': 41,
        'felt-assy': 42,
        'foot-boshi-check': 43,
        'robot-final-check': 44,
        'taking-laser-name-plate': 45,
        'repair-shoe-clearance': 46,
        'repair-dipping': 47
    };
    
    // Generate skill columns based on mode configuration
    let skillColumns = '';
    if (modeConfig && modeConfig.skills) {
        modeConfig.skills.forEach(skillIndex => {
            const skillValue = skillData.skills && skillData.skills[`skill${skillIndex}`] ? skillData.skills[`skill${skillIndex}`] : 0;
            
            // Check if this skill is the current position
            const currentPositionSkill = positionToSkillMap[skillData.position];
            const isCurrentPosition = (skillIndex === currentPositionSkill);
            
            skillColumns += `<td class="${isCurrentPosition ? 'current-position-skill' : ''}">${createSkillRatingHTML(skillValue, isCurrentPosition)}</td>`;
        });
    } else {
        // Fallback untuk backward compatibility
        for (let i = 1; i <= 47; i++) {
            const skillValue = skillData.skills && skillData.skills[`skill${i}`] ? skillData.skills[`skill${i}`] : 0;
            
            // Check if this skill is the current position
            const currentPositionSkill = positionToSkillMap[skillData.position];
            const isCurrentPosition = (i === currentPositionSkill);
            
            skillColumns += `<td class="${isCurrentPosition ? 'current-position-skill' : ''}">${createSkillRatingHTML(skillValue, isCurrentPosition)}</td>`;
        }
    }
    
    row.innerHTML = `
        <td>${skillData.npk}</td>
        <td>${skillData.nama}</td>
        <td>${skillData.section}</td>
        <td>${skillData.line}</td>
        <td class="position-cell" data-position="${skillData.position}" style="cursor: pointer; color: #007bff; text-decoration: underline;" onclick="scrollToPositionColumn('${skillData.position}')">${positionDisplay}</td>
        ${skillColumns}
        <td>
            <button class="btn btn-warning btn-sm" onclick="editSkillMatrix(this)">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSkillMatrix(this)">Delete</button>
        </td>
    `;
    
    return row;
}

function createSkillRatingHTML(rating, isCurrentPosition = false) {
    // Ensure rating is between 0 and 4
    const normalizedRating = Math.max(0, Math.min(4, Math.round(rating)));
    
    const currentPositionClass = isCurrentPosition ? ' current-position' : '';
    
    return `
        <div class="skill-rating${currentPositionClass}">
            <span class="skill-circle level-${normalizedRating}"></span>
        </div>
    `;
}

// function calculateOverallRating(skills) {
//     const total = skills.skill1 + skills.skill2 + skills.skill3 + skills.skill4 + skills.skill5;
//     const average = total / 5;
//     return Math.round(average * 10) / 10; // Round to 1 decimal place
// }

// function getOverallRatingClass(rating) {
//     if (rating >= 4.5) return 'excellent';
//     if (rating >= 3.5) return 'good';
//     if (rating >= 2.5) return 'average';
//     return 'poor';
// }

// Function to generate skill inputs for a range
function generateSkillInputs(start, end) {
    // Determine which skill names to use based on evaluation mode
    const evaluationMode = document.getElementById('evaluationMode')?.value;
    let currentSkillNames = evaluationModeSkills['comp-assy'].skillNames; // Default to Comp Assy
    
    // Use the consistent evaluationModeSkills configuration
    if (evaluationMode && evaluationModeSkills[evaluationMode]) {
        currentSkillNames = evaluationModeSkills[evaluationMode].skillNames;
    }
    
    let skillInputs = '';
    for (let i = start; i <= end; i++) {
        const skillName = currentSkillNames[i-1] || `Skill ${i}`;
        skillInputs += `
            <div class="form-group">
                <label for="skill${i}">${skillName} *</label>
                <div class="skill-input-container">
                    <input type="number" id="skill${i}" name="skill${i}" min="0" max="4" value="0" required>
                    <div class="skill-preview" id="skill${i}-preview"></div>
                </div>
            </div>`;
    }
    return skillInputs;
}

// Function to show skill tab
function showSkillTab(tabNumber) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.skill-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab and button
    document.querySelector(`.tab-btn:nth-child(${tabNumber})`).classList.add('active');
    document.getElementById(`skill-tab-${tabNumber}`).classList.add('active');
}

function getSkillMatrixForm() {
    // Generate skill tabs
    const skillTabs = `
        <div class="skill-tabs">
            <div class="tab-buttons">
                <button type="button" class="tab-btn active" onclick="showSkillTab(1)">Skill 1-15</button>
                <button type="button" class="tab-btn" onclick="showSkillTab(2)">Skill 16-30</button>
                <button type="button" class="tab-btn" onclick="showSkillTab(3)" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; transition: all 0.3s ease;">Skill 31-47 ⭐</button>
            </div>
            <div class="tab-content">
                <div id="skill-tab-1" class="skill-tab active">
                    ${generateSkillInputs(1, 15)}
                </div>
                <div id="skill-tab-2" class="skill-tab">
                    ${generateSkillInputs(16, 30)}
                </div>
                <div id="skill-tab-3" class="skill-tab">
                    ${generateSkillInputs(31, 47)}
                </div>
            </div>
        </div>
    `
    
    return `
        <form id="dataForm" class="form-grid">
            <!-- Kolom Kiri: Informasi Dasar -->
            <div class="form-basic-info">
                <div class="form-group">
                    <label for="skillMatrixSectionSelect">Pilih Section *</label>
                    <select id="skillMatrixSectionSelect" onchange="updateSkillMatrixLineFilter()" required>
                        <option value="">-- Pilih Section --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="skillMatrixLineSelect">Pilih Line *</label>
                    <select id="skillMatrixLineSelect" onchange="updateSkillMatrixEmployeeFilter()" required disabled>
                        <option value="">-- Pilih Line --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="employeeSelect">Pilih Karyawan *</label>
                    <select id="employeeSelect" name="employeeId" onchange="autoFillEmployeeSkillMatrix()" required disabled>
                        <option value="">-- Pilih Karyawan --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modal-npk">NPK</label>
                    <input type="text" id="modal-npk" readonly>
                </div>
                
                <div class="form-group">
                    <label for="modal-nama">Nama Lengkap</label>
                    <input type="text" id="modal-nama" readonly>
                </div>
                
                <div class="form-group">
                    <label for="modal-section">Section</label>
                    <input type="text" id="modal-section" readonly>
                </div>
                
                <div class="form-group">
                    <label for="modal-line">Line</label>
                    <input type="text" id="modal-line" readonly>
                </div>
                
                <div class="form-group">
                    <label for="evaluationDate">Tanggal Evaluasi *</label>
                    <input type="date" id="evaluationDate" name="evaluationDate" required>
                </div>
                
                <div class="form-group">
                    <label for="evaluationMode">Mode Evaluasi *</label>
                    <select id="evaluationMode" name="evaluationMode" required onchange="handleEvaluationModeChange()">
                        <option value="">-- Pilih Mode Evaluasi --</option>
                        <option value="comp-assy">Comp Assy (47 Skill)</option>
                        <option value="comp-wclutch">Comp Wclutch (12 Skill)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="position">Pos Saat Ini *</label>
                    <select id="position" name="position" required onchange="handlePositionChange()">
                        <option value="">-- Pilih Pos --</option>
                        <option value="mizusumashi-towing">Mizusumashi Towing</option>
                        <option value="mizusumashi-shaft">Mizusumashi Shaft</option>
                        <option value="pre-check">Pre Check</option>
                        <option value="part-washing-big-part-in">Part Washing Big Part (IN)</option>
                        <option value="part-washing-inner-part-in">Part Washing Inner Part (IN)</option>
                        <option value="pass-room-prepare-piston">Pass Room (Prepare Piston)</option>
                        <option value="pass-room-prepare-gasket">Pass Room (Prepare Gasket)</option>
                        <option value="prepare-thrust-bearing">Prepare Thrust Bearing</option>
                        <option value="prepare-oring-prv">Prepare Oring PRV</option>
                        <option value="bearing-assy">Bearing Assy</option>
                        <option value="bushing-assy">Bushing Assy</option>
                        <option value="mizusumashi-assy">Mizusumashi Assy</option>
                        <option value="part-washing-inner-part-out-lip-seal">Part Washing Inner Part (OUT) LIP Seal Assy</option>
                        <option value="part-washing-inner-part-out">Part Washing Inner Part (OUT)</option>
                        <option value="prv-assy">PRV Assy</option>
                        <option value="piston-swash">Piston & Swash Measuring</option>
                        <option value="shoe-selecting">Shoe Selecting</option>
                        <option value="cylinder-block">Cylinder Block Assy</option>
                        <option value="shoe-clearance-muffler-bolt">Shoe Clearance & Muffler Bolt</option>
                        <option value="qr-code-label-press-pin">QR Code Label Assy & Press Pin</option>
                        <option value="front-side-assy">Front Side Assy</option>
                        <option value="front-housing-assy">Front Housing Assy</option>
                        <option value="rear-housing-assy">Rear Housing Assy</option>
                        <option value="housing-bolt">Housing Bolt</option>
                        <option value="bolt-tightening">Bolt Tightening</option>
                        <option value="concentricity-torque-check">Concentricity Check & Torque Check</option>
                        <option value="empty-weight-dummy-assy">Empty Weight & Dummy Assy</option>
                        <option value="vacuum-gas-charging">Vacuum & Gas Charging</option>
                        <option value="helium-leak-test">Helium Leak Test</option>
                        <option value="high-pressure-check">High Pressure Check</option>
                        <option value="performance-test">Performance Test</option>
                        <option value="release-dummy">Release Dummy</option>
                        <option value="pre-oil-oil-filling">Pre Oil & Oil Filling</option>
                        <option value="seal-cap-assy">Seal Cap Assy</option>
                        <option value="flange-assy">Flange Assy</option>
                        <option value="air-leak-test">Air Leak Test</option>
                        <option value="gas-release">Gas Release</option>
                        <option value="seal-cap-assy-2">Seal Cap Assy 2</option>
                        <option value="final-washing">Final Washing</option>
                        <option value="name-plate-assy">Name Plate Assy</option>
                        <option value="thermal-sensor">Thermal Sensor</option>
                        <option value="felt-assy">Felt Assy</option>
                        <option value="foot-boshi-check">Foot & Boshi Check</option>
                        <option value="robot-final-check">Robot Final Check</option>
                        <option value="taking-laser-name-plate">Taking & Laser Name Plate</option>
                        <option value="repair-shoe-clearance">Repair Shoe Clearance</option>
                        <option value="repair-dipping">Repair Dipping</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="notes">Catatan Evaluasi</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Tambahkan catatan atau komentar evaluasi..."></textarea>
                </div>
            </div>
            
            <!-- Kolom Kanan: Evaluasi Skill -->
            <div class="skill-evaluation-section">
                <h4>📊 Evaluasi Skill (0-4)</h4>
                <div class="skill-legend">
                    <span class="legend-item"><span class="skill-circle level-0"></span> 0 = Tidak Bisa</span>
                    <span class="legend-item"><span class="skill-circle level-1"></span> 1 = Pemula</span>
                    <span class="legend-item"><span class="skill-circle level-2"></span> 2 = Cukup</span>
                    <span class="legend-item"><span class="skill-circle level-3"></span> 3 = Baik</span>
                    <span class="legend-item"><span class="skill-circle level-4"></span> 4 = Ahli</span>
                </div>
                
                <div id="skillEvaluationContainer">
                    ${window.editingSkillMatrix ? 
                        generateSkillTabsForMode(evaluationModeSkills['comp-assy']) : 
                        '<p class="text-muted">Pilih mode evaluasi terlebih dahulu untuk menampilkan skill yang relevan</p>'
                    }
                </div>
            </div>
        </form>
        
        <script>
            // Initialize all skill number inputs
            document.querySelectorAll('input[type="number"]').forEach(input => {
                input.addEventListener('input', function() {
                    const value = parseInt(this.value) || 0;
                    const preview = this.parentElement.querySelector('.skill-preview');
                    
                    // Ensure value is within range
                    if (value < 0) this.value = 0;
                    if (value > 4) this.value = 4;
                    
                    preview.innerHTML = createSkillRatingHTML(parseInt(this.value));
                });
                
                // Trigger initial update
                input.dispatchEvent(new Event('input'));
            });
            
            // Set default date to today
            document.getElementById('evaluationDate').value = new Date().toISOString().split('T')[0];
        </script>
    `;
}

function saveSkillMatrix(formData) {
    const skillMatrixData = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
    const employeeSelect = document.getElementById('employeeSelect');
    const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
    
    const evaluationMode = formData.get('evaluationMode');
    const modeConfig = evaluationModeSkills[evaluationMode];
    
    // Create skills object berdasarkan mode yang dipilih
    const skills = {};
    if (modeConfig) {
        for (let i = 1; i <= modeConfig.totalSkills; i++) {
            skills[`skill${i}`] = parseInt(formData.get(`skill${i}`)) || 0;
        }
    } else {
        // Fallback untuk backward compatibility
        for (let i = 1; i <= 47; i++) {
            skills[`skill${i}`] = parseInt(formData.get(`skill${i}`)) || 0;
        }
    }
    
    const skillData = {
        id: window.editingSkillMatrix ? window.editingSkillMatrix.id : generateId(skillMatrixData),
        employeeId: formData.get('employeeId'),
        npk: selectedOption.dataset.npk,
        nama: selectedOption.dataset.nama,
        section: selectedOption.dataset.section,
        line: selectedOption.dataset.line,
        evaluationDate: formData.get('evaluationDate'),
        evaluationMode: evaluationMode,
        totalSkills: modeConfig ? modeConfig.totalSkills : 47,
        position: formData.get('position'),
        skills: skills,
        notes: formData.get('notes') || '',
        createdAt: new Date().toISOString()
    };
    
    if (window.editingSkillMatrix) {
        // Update existing record
        const index = skillMatrixData.findIndex(item => item.id === window.editingSkillMatrix.id);
        if (index !== -1) {
            skillMatrixData[index] = { ...skillMatrixData[index], ...skillData };
            showNotification('Data skill matrix berhasil diupdate!', 'success');
        }
    } else {
        // Add new record
        skillMatrixData.push(skillData);
        showNotification('Data skill matrix berhasil ditambahkan!', 'success');
    }
    
    saveToLocalStorage(STORAGE_KEYS.skillMatrix, skillMatrixData);
    loadSkillMatrixData();
    
    // Reset editing state
    window.editingSkillMatrix = null;
}

function editSkillMatrix(button) {
    const row = button.closest('tr');
    const id = parseInt(row.dataset.id);
    const skillMatrixData = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
    const skillData = skillMatrixData.find(item => item.id === id);
    
    if (skillData) {
        window.editingSkillMatrix = skillData;
        openSkillMatrixModal();
        
        // Populate form with existing data
        setTimeout(() => {
            // Isi section dan line terlebih dahulu
            const sectionSelect = document.getElementById('skillMatrixSectionSelect');
            const lineSelect = document.getElementById('skillMatrixLineSelect');
            const employeeSelect = document.getElementById('employeeSelect');
            const evaluationModeSelect = document.getElementById('evaluationMode');
            
            if (sectionSelect) {
                sectionSelect.value = skillData.section;
                // Trigger change event untuk update line options
                sectionSelect.dispatchEvent(new Event('change'));
            }
            
            // PENTING: Isi evaluationMode terlebih dahulu
            if (evaluationModeSelect) {
                const dataMode = skillData.evaluationMode || 'comp-assy'; // Default untuk data lama
                evaluationModeSelect.value = dataMode;
                // Trigger change event untuk generate skill tabs
                evaluationModeSelect.dispatchEvent(new Event('change'));
            }
            
            // Tunggu sebentar untuk line options ter-update
            setTimeout(() => {
                if (lineSelect) {
                    lineSelect.value = skillData.line;
                    // Trigger change event untuk update employee options
                    lineSelect.dispatchEvent(new Event('change'));
                }
                
                // Tunggu sebentar untuk employee options ter-update
                setTimeout(() => {
                    if (employeeSelect) {
                        employeeSelect.value = skillData.employeeId;
                        // Trigger change event untuk auto-fill employee data
                        employeeSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Isi field lainnya
                    document.getElementById('evaluationDate').value = skillData.evaluationDate;
                    document.getElementById('position').value = skillData.position || '';
                    document.getElementById('notes').value = skillData.notes || '';
                    
                    // Tunggu skill tabs ter-generate, kemudian isi skill values
                    setTimeout(() => {
                        const modeConfig = evaluationModeSkills[skillData.evaluationMode || 'comp-assy'];
                        const maxSkills = modeConfig ? modeConfig.totalSkills : 47;
                        
                        // Populate skills berdasarkan mode
                        for (let i = 1; i <= maxSkills; i++) {
                            const skillField = document.getElementById(`skill${i}`);
                            if (skillField && skillData.skills[`skill${i}`] !== undefined) {
                                skillField.value = skillData.skills[`skill${i}`];
                                // Trigger input event untuk update preview
                                skillField.dispatchEvent(new Event('input'));
                            }
                        }
                    }, 200);
                }, 150);
            }, 100);
        }, 100);
    }
}

function deleteSkillMatrix(button) {
    if (confirm('Apakah Anda yakin ingin menghapus data skill matrix ini?')) {
        const row = button.closest('tr');
        const id = parseInt(row.dataset.id);
        const skillMatrixData = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
        
        const updatedData = skillMatrixData.filter(item => item.id !== id);
        saveToLocalStorage(STORAGE_KEYS.skillMatrix, updatedData);
        
        showNotification('Data skill matrix berhasil dihapus!', 'success');
        loadSkillMatrixData();
    }
}

// Fungsi untuk toggle sorting NPK skill matrix
function toggleSkillMatrixNPKSort() {
    // Toggle direction
    skillMatrixSortDirection = skillMatrixSortDirection === 'asc' ? 'desc' : 'asc';
    
    // Update indicator
    const indicator = document.getElementById('skill-matrix-sort-indicator');
    if (indicator) {
        indicator.textContent = skillMatrixSortDirection === 'asc' ? '↑' : '↓';
    }
    
    // Sort ulang data
    displaySkillMatrixData();
}

// ===== MAPPING MP FUNCTIONS =====
let currentMappingPage = 1;
let mappingItemsPerPage = 10;
let allMappingData = [];
let filteredMappingData = [];
let mappingSortDirection = 'asc';

// Load and generate mapping data
function loadMappingData() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    
    // Filter only active employees
    const activeEmployees = employees.filter(emp => emp.status === 'Aktif');
    
    // Generate mapping data
    allMappingData = activeEmployees.map(employee => {
        // Get all education records for this employee
        const employeeEducations = educationData.filter(edu => edu.npk === employee.npk);
        
        // Get unique processes this employee has been educated on
        const processes = [...new Set(employeeEducations.map(edu => edu.proses))].filter(Boolean);
        
        // Calculate report based on education completion
        let report = 'Belum Ada Edukasi';
        if (employeeEducations.length > 0) {
            const completedEducations = employeeEducations.filter(edu => edu.status === 'Selesai');
            const completionRate = Math.round((completedEducations.length / employeeEducations.length) * 100);
            report = `${completionRate}% (${completedEducations.length}/${employeeEducations.length})`;
        }
        
        return {
            npk: employee.npk,
            nama: employee.nama,
            section: employee.section,
            line: employee.line,
            leader: employee.leader,
            proses: processes.length > 0 ? processes.join(', ') : 'Belum Ada',
            raport: report,
            processCount: processes.length,
            educationCount: employeeEducations.length
        };
    });
    
    // Sort by NPK
    sortMappingByNPK();
    
    filteredMappingData = [...allMappingData];
    currentMappingPage = 1;
    
    generateMappingFilters();
    displayMappingData();
    createMappingPagination();
    
    // Initialize charts
    initMappingCompAssyChart();
    initMappingCompWClutchChart();
    updateMappingCharts();
}

// Sort mapping by NPK
function sortMappingByNPK() {
    allMappingData.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        
        if (mappingSortDirection === 'asc') {
            return npkA - npkB;
        } else {
            return npkB - npkA;
        }
    });
}

// Toggle NPK sort direction
function toggleMappingNPKSort() {
    mappingSortDirection = mappingSortDirection === 'asc' ? 'desc' : 'asc';
    
    const indicator = document.getElementById('mapping-sort-indicator');
    if (indicator) {
        indicator.textContent = mappingSortDirection === 'asc' ? '↑' : '↓';
    }
    
    sortMappingByNPK();
    filteredMappingData = [...allMappingData];
    filterMappingData(); // Re-apply current filters
}

// Tambahkan fungsi openEndContractModal yang hilang
function openEndContractModal() {
    openModal('end-contract');
}

// Perbaiki fungsi openSkillMatrixModal yang sudah ada (ganti yang lama)
function openSkillMatrixModal() {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    // Reset dan tambahkan class khusus untuk skill matrix
    modalContent.classList.remove('medium-modal', 'small-modal');
    modalContent.classList.add('skill-matrix-modal');
    
    modalTitle.textContent = window.editingSkillMatrix ? 'Edit Skill Matrix' : 'Tambah Evaluasi Skill';
    modalBody.innerHTML = getSkillMatrixForm();
    window.currentModule = 'skillMatrix';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        populateSkillMatrixSectionDropdown();
    }, 100);
}

// Pastikan fungsi tersedia secara global
window.openEndContractModal = openEndContractModal;
window.openSkillMatrixModal = openSkillMatrixModal;

// Tambahkan variabel global untuk charts
let mappingCompAssyChart = null;
let mappingCompWClutchChart = null;

// Update line filter based on selected section
function updateMappingLineFilter() {
    const sectionFilter = document.getElementById('mappingSectionFilter');
    const lineFilter = document.getElementById('mappingLineFilter');
    
    if (!sectionFilter || !lineFilter) return;
    
    const selectedSection = sectionFilter.value;
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    // Clear current line options
    lineFilter.innerHTML = '<option value="">Semua Line</option>';
    
    if (selectedSection) {
        // Get lines only from selected section
        const sectionLines = [...new Set(
            employees
                .filter(emp => emp.section === selectedSection)
                .map(emp => emp.line)
                .filter(Boolean)
        )].sort();
        
        sectionLines.forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineFilter.appendChild(option);
        });
    } else {
        // Show all lines if no section selected
        const allLines = [...new Set(
            employees
                .map(emp => emp.line)
                .filter(Boolean)
        )].sort();
        
        allLines.forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineFilter.appendChild(option);
        });
    }
    
    // Reset line filter value
    lineFilter.value = '';
}

// Generate filter options
function generateMappingFilters() {
    const sectionFilter = document.getElementById('mappingSectionFilter');
    const lineFilter = document.getElementById('mappingLineFilter');
    
    if (!sectionFilter || !lineFilter) return;
    
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const sections = [...new Set(employees.map(emp => emp.section).filter(Boolean))].sort();
    const lines = [...new Set(employees.map(emp => emp.line).filter(Boolean))].sort();
    
    // Populate section filter
    sectionFilter.innerHTML = '<option value="">Semua Section</option>';
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionFilter.appendChild(option);
    });
    
    // Populate line filter with all lines initially
    lineFilter.innerHTML = '<option value="">Semua Line</option>';
    lines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        lineFilter.appendChild(option);
    });
}

// Filter mapping data
function filterMappingData() {
    const sectionFilter = document.getElementById('mappingSectionFilter')?.value || '';
    const lineFilter = document.getElementById('mappingLineFilter')?.value || '';
    const searchInput = document.getElementById('mappingSearchInput')?.value.toLowerCase() || '';
    
    filteredMappingData = allMappingData.filter(item => {
        const matchesSection = !sectionFilter || item.section === sectionFilter;
        const matchesLine = !lineFilter || item.line === lineFilter;
        const matchesSearch = !searchInput || 
            Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(searchInput)
            );
        
        return matchesSection && matchesLine && matchesSearch;
    });
    
    currentMappingPage = 1;
    displayMappingData();
    createMappingPagination();
    updateMappingCharts(); // Update charts when filter changes
}

// Display mapping data
function displayMappingData() {
    const tableBody = document.getElementById('mappingTableBody');
    if (!tableBody) return;
    
    const startIndex = (currentMappingPage - 1) * mappingItemsPerPage;
    const endIndex = startIndex + mappingItemsPerPage;
    const pageData = filteredMappingData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    ${allMappingData.length === 0 ? 'Belum ada data karyawan aktif.' : 'Tidak ada data yang sesuai dengan filter.'}
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = pageData.map((item, index) => {
        const rowNumber = startIndex + index + 1;
        return createMappingRow(item, rowNumber);
    }).join('');
}

// Create mapping table row
function createMappingRow(item, rowNumber) {
    return `
        <tr>
            <td>${rowNumber}</td>
            <td>${item.npk}</td>
            <td>${item.nama}</td>
            <td>${item.section}</td>
            <td>${item.line}</td>
            <td>${item.leader}</td>
            <td>${item.proses}</td>
            <td>${item.raport}</td>
        </tr>
    `;
}

// Create mapping pagination
function createMappingPagination() {
    const paginationContainer = document.getElementById('mappingPagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredMappingData.length / mappingItemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentMappingPage > 1) {
        paginationHTML += `<button onclick="changeMappingPage(${currentMappingPage - 1})" class="pagination-btn">‹ Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentMappingPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changeMappingPage(${i})" class="pagination-btn">${i}</button>`;
        }
    }
    
    // Next button
    if (currentMappingPage < totalPages) {
        paginationHTML += `<button onclick="changeMappingPage(${currentMappingPage + 1})" class="pagination-btn">Next ›</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change mapping page
function changeMappingPage(page) {
    currentMappingPage = page;
    displayMappingData();
    createMappingPagination();
}

// Function untuk inisialisasi chart Comp Assy
function initMappingCompAssyChart() {
    const ctx = document.getElementById('mappingCompAssyChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (mappingCompAssyChart) {
        mappingCompAssyChart.destroy();
        mappingCompAssyChart = null;
    }
    
    mappingCompAssyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '👨 Karyawan Tetap',
                data: [],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(102, 126, 234, 0.9)',
                hoverBorderColor: 'rgba(102, 126, 234, 1)',
                hoverBorderWidth: 3
            }, {
                label: '📋 Karyawan Kontrak',
                data: [],
                backgroundColor: 'rgba(240, 147, 251, 0.8)',
                borderColor: 'rgba(240, 147, 251, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(240, 147, 251, 0.9)',
                hoverBorderColor: 'rgba(240, 147, 251, 1)',
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '🏭 Comp Assy Section',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2c3e50',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                // datalabels: {
                //     display: true,
                //     color: '#000',
                //     font: {
                //         weight: 'bold',
                //         size: 10
                //     },
                //     anchor: 'end',
                //     align: 'top',
                //     formatter: function(value, context) {
                //         return value > 0 ? value : '';
                //     }
                // },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return 'Line: ' + context[0].label;
                        },
                        afterBody: function(context) {
                            let total = 0;
                            context.forEach(item => total += item.parsed.y);
                            return 'Total: ' + total + ' orang';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#666'
                    },
                    title: {
                        display: true,
                        text: 'Production Line',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        padding: {
                            top: 10
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 40,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#666',
                        stepSize: 5
                    },
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Function untuk inisialisasi chart Comp W/Clutch
function initMappingCompWClutchChart() {
    const ctx = document.getElementById('mappingCompWClutchChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (mappingCompWClutchChart) {
        mappingCompWClutchChart.destroy();
        mappingCompWClutchChart = null;
    }
    
    mappingCompWClutchChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '👨 Karyawan Tetap',
                data: [],
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(52, 152, 219, 0.9)',
                hoverBorderColor: 'rgba(52, 152, 219, 1)',
                hoverBorderWidth: 3
            }, {
                label: '📋 Karyawan Kontrak',
                data: [],
                backgroundColor: 'rgba(230, 126, 34, 0.8)',
                borderColor: 'rgba(230, 126, 34, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(230, 126, 34, 0.9)',
                hoverBorderColor: 'rgba(230, 126, 34, 1)',
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '⚙️ Comp WClutch Section',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2c3e50',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                // datalabels: {
                //     display: true,
                //     color: '#000',
                //     font: {
                //         weight: 'bold',
                //         size: 10
                //     },
                //     anchor: 'end',
                //     align: 'top',
                //     formatter: function(value, context) {
                //         return value > 0 ? value : '';
                //     }
                // },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return 'Line: ' + context[0].label;
                        },
                        afterBody: function(context) {
                            let total = 0;
                            context.forEach(item => total += item.parsed.y);
                            return 'Total: ' + total + ' orang';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#666'
                    },
                    title: {
                        display: true,
                        text: 'Production Line',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#2c3e50',
                        padding: {
                            top: 10
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 40,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#666',
                        stepSize: 5
                    },

                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Function untuk update data charts
function updateMappingCharts() {
    updateMappingCompAssyChart();
    updateMappingCompWClutchChart();
}

// Function untuk update chart Comp Assy
function updateMappingCompAssyChart() {
    if (!mappingCompAssyChart) {
        console.warn('Chart mappingCompAssyChart belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('mappingCompAssyChart');
    if (!canvas) {
        console.warn('Canvas element mappingCompAssyChart not found');
        return;
    }
    
    try {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const compAssyEmployees = employees.filter(emp => 
            emp.section === 'Comp Assy' && emp.status === 'Aktif'
        );
        
        // Group by line
        const lineData = {};
        compAssyEmployees.forEach(emp => {
            if (!lineData[emp.line]) {
                lineData[emp.line] = { kartap: 0, kontrak: 0 };
            }
            
            if (emp.employeeType === 'Tetap') {
                lineData[emp.line].kartap++;
            } else if (emp.employeeType === 'Kontrak') {
                lineData[emp.line].kontrak++;
            }
        });
        
        const lines = Object.keys(lineData).sort();
        const kartapData = lines.map(line => lineData[line].kartap);
        const kontrakData = lines.map(line => lineData[line].kontrak);
        
        mappingCompAssyChart.data.labels = lines;
        mappingCompAssyChart.data.datasets[0].data = kartapData;
        mappingCompAssyChart.data.datasets[1].data = kontrakData;
        mappingCompAssyChart.update();
        
        console.log('Chart mappingCompAssyChart updated successfully');
    } catch (error) {
        console.error('Error updating mappingCompAssyChart:', error);
    }
}

// Function untuk update chart Comp WClutch
function updateMappingCompWClutchChart() {
    if (!mappingCompWClutchChart) {
        console.warn('Chart mappingCompWClutchChart belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('mappingCompWClutchChart');
    if (!canvas) {
        console.warn('Canvas element mappingCompWClutchChart not found');
        return;
    }
    
    try {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const compWClutchEmployees = employees.filter(emp => 
            emp.section === 'Comp WClutch' && emp.status === 'Aktif'
        );
        
        // Group by line
        const lineData = {};
        compWClutchEmployees.forEach(emp => {
            if (!lineData[emp.line]) {
                lineData[emp.line] = { kartap: 0, kontrak: 0 };
            }
            
            if (emp.employeeType === 'Tetap') {
                lineData[emp.line].kartap++;
            } else if (emp.employeeType === 'Kontrak') {
                lineData[emp.line].kontrak++;
            }
        });
        
        const lines = Object.keys(lineData).sort();
        const kartapData = lines.map(line => lineData[line].kartap);
        const kontrakData = lines.map(line => lineData[line].kontrak);
        
        mappingCompWClutchChart.data.labels = lines;
        mappingCompWClutchChart.data.datasets[0].data = kartapData;
        mappingCompWClutchChart.data.datasets[1].data = kontrakData;
        mappingCompWClutchChart.update();
        
        console.log('Chart mappingCompWClutchChart updated successfully');
    } catch (error) {
        console.error('Error updating mappingCompWClutchChart:', error);
    }
}

// Export mapping to CSV
function exportMappingToCSV() {
    if (filteredMappingData.length === 0) {
        showNotification('Tidak ada data untuk diekspor!', 'error');
        return;
    }
    
    const headers = ['No', 'NPK', 'Name', 'Section', 'Line', 'Leader', 'Proses', 'Raport'];
    const csvContent = [headers.join(',')];
    
    filteredMappingData.forEach((item, index) => {
        const row = [
            index + 1,
            item.npk,
            `"${item.nama}"`,
            `"${item.section}"`,
            `"${item.line}"`,
            `"${item.leader}"`,
            `"${item.proses}"`,
            `"${item.raport}"`
        ];
        csvContent.push(row.join(','));
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mapping_mp_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data mapping berhasil diekspor!', 'success');
}

// ===== EDUCATION FUNCTIONS =====
function loadEducationData() {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const tableBody = document.getElementById('educationTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (educationData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="13" class="text-center">Belum ada data program edukasi</td></tr>';
        return;
    }
    
    educationData.forEach((item, index) => {
        const row = createEducationRow(item, index + 1);
        tableBody.appendChild(row);
    });
    
    // Populate month-year filter after loading data
    populateEducationMonthYearFilter();
}

// Function to populate month-year filter for education
function populateEducationMonthYearFilter() {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const monthYearFilter = document.getElementById('educationMonthYearFilter');
    
    if (!monthYearFilter) return;
    
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    // Get unique month-year combinations from education data
    const monthYears = [...new Set(educationData.map(item => {
        if (!item.dateEdukasi) return null;
        const date = new Date(item.dateEdukasi);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `${month}-${year}`;
    }).filter(Boolean))].sort((a, b) => {
        // Sort by year then month
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        if (yearA !== yearB) return yearB.localeCompare(yearA);
        return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });
    
    // Clear existing options
    monthYearFilter.innerHTML = '<option value="all">Semua Periode</option>';
    
    // Add month-year options
    monthYears.forEach(monthYear => {
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = monthYear;
        monthYearFilter.appendChild(option);
    });
}

function createEducationRow(edu, number) {
    const row = document.createElement('tr');
    row.dataset.id = edu.id;
    
    const statusClass = edu.status === 'Selesai' ? 'status-active' : 
                       edu.status === 'Berlangsung' ? 'status-pending' : 'status-warning';
    
    // PDF file indicator
    const pdfIndicator = edu.pdfFile ? 
        `<span class="status-badge status-active pdf-indicator" onclick="viewEducationPdf(${edu.id})">📄 PDF</span>` : 
        `<span class="status-badge status-inactive">No File</span>`;
    
    // Handle backward compatibility for old education records
    const npk = edu.npk || 'N/A';
    const nama = edu.nama || edu.peserta || 'N/A'; // fallback to old peserta field
    const section = edu.section || 'N/A';
    const line = edu.line || '-';
    const leader = edu.leader || '-';
    const namaPos = positionDisplayNames[edu.namaPos] || edu.namaPos || '-';
    const program = edu.program || 'N/A';
    const dateEdukasi = formatDate(edu.dateEdukasi) || formatDate(edu.startDate) || 'N/A'; // fallback to old startDate
    const datePlanning = formatDate(edu.datePlanning) || 'N/A';
    
    row.innerHTML = `
        <td>${number}</td>
        <td>${npk}</td>
        <td>${nama}</td>
        <td>${section}</td>
        <td>${line}</td>
        <td>${leader}</td>
        <td>${namaPos}</td>
        <td>${program}</td>
        <td>${dateEdukasi}</td>
        <td>${datePlanning}</td>
        <td>${pdfIndicator}</td>
        <td><span class="status-badge ${statusClass}">${edu.status}</span></td>
        <td>
            <button class="btn btn-warning btn-sm" onclick="editEducation(this)">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEducation(this)">Delete</button>
        </td>
    `;
    
    return row;
}

// View PDF file for education
function viewEducationPdf(eduId) {
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const edu = education.find(e => e.id === eduId);
    
    if (edu && edu.pdfFile && edu.pdfFile.data) {
        try {
            // Create a blob from base64 data
            const byteCharacters = atob(edu.pdfFile.data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            // Create URL and open in new tab
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // Clean up URL after some time
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Error viewing PDF:', error);
            showNotification('Error membuka file PDF!', 'error');
        }
    } else {
        showNotification('File PDF tidak ditemukan!', 'error');
    }
}

async function saveEducation(formData) {
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    
    const eduData = {
        npk: formData.get('npk'),
        nama: formData.get('nama'),
        gender: formData.get('gender'),
        section: formData.get('section'),
        line: formData.get('line'),
        leader: formData.get('leader'),
        namaPos: formData.get('namaPos'),
        program: formData.get('program'),
        dateEdukasi: formData.get('dateEdukasi'),
        datePlanning: formData.get('datePlanning'),
        status: formData.get('status')
    };
    
    // Validate required fields
    const requiredFields = ['npk', 'nama', 'gender', 'section', 'line', 'leader', 'namaPos', 'program', 'dateEdukasi', 'status'];
    const missingFields = requiredFields.filter(field => !eduData[field]);
    
    if (missingFields.length > 0) {
        showNotification('Mohon pilih karyawan dan lengkapi semua field yang wajib diisi!', 'error');
        return;
    }
    
    // Handle PDF file upload
    const pdfFileInput = document.getElementById('modal-pdfFile');
    const pdfFile = pdfFileInput.files[0];
    
    try {
        if (pdfFile) {
            showNotification('Uploading PDF file...', 'info');
            eduData.pdfFile = await handlePdfUpload(pdfFile);
        } else if (window.editingRow) {
            // Keep existing PDF file if no new file uploaded during edit
            const eduId = parseInt(window.editingRow.dataset.id);
            const existingEdu = education.find(e => e.id === eduId);
            if (existingEdu && existingEdu.pdfFile) {
                eduData.pdfFile = existingEdu.pdfFile;
            }
        }
        
        if (window.editingRow) {
            // Update existing
            const eduId = parseInt(window.editingRow.dataset.id);
            const eduIndex = education.findIndex(e => e.id === eduId);
            
            if (eduIndex !== -1) {
                education[eduIndex] = {
                    ...education[eduIndex],
                    ...eduData,
                    updatedAt: new Date().toISOString()
                };
                
                saveToLocalStorage(STORAGE_KEYS.education, education);
                loadEducationData();
                showNotification('Data edukasi berhasil diupdate!', 'success');
            }
        } else {
            // Add new
            const newEdu = {
                id: generateId(education),
                ...eduData,
                createdAt: new Date().toISOString()
            };
            
            education.push(newEdu);
            saveToLocalStorage(STORAGE_KEYS.education, education);
            loadEducationData();
            showNotification('Data edukasi berhasil ditambahkan!', 'success');
        }
        
        updateDashboardStats();
        updateCharts();
        
    } catch (error) {
        console.error('Error saving education:', error);
        showNotification('Error saat menyimpan data: ' + error, 'error');
        return;
    }
}

function editEducation(button) {
    const row = button.closest('tr');
    const eduId = parseInt(row.dataset.id);
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const edu = education.find(e => e.id === eduId);
    
    if (edu) {
        window.editingRow = row;
        window.currentModule = 'education';
        openModal('education');
        
        // Fill form after modal opens
        setTimeout(() => {
            // First, set the section filter
            const sectionFilter = document.getElementById('modal-sectionFilter');
            if (sectionFilter) {
                sectionFilter.value = edu.section;
                updateEducationLineFilter();
                
                // Then set the line filter
                setTimeout(() => {
                    const lineFilter = document.getElementById('modal-lineFilter');
                    if (lineFilter) {
                        lineFilter.value = edu.line;
                        updateEducationEmployeeFilter();
                        
                        // Finally, set the employee
                        setTimeout(() => {
                            const employeeSelect = document.getElementById('modal-employeeSelect');
                            if (employeeSelect) {
                                for (let option of employeeSelect.options) {
                                    if (option.value === edu.npk) {
                                        option.selected = true;
                                        break;
                                    }
                                }
                            }
                        }, 50);
                    }
                }, 50);
            }
            
            // Fill all fields
            document.getElementById('modal-npk').value = edu.npk;
            document.getElementById('modal-nama').value = edu.nama;
            document.getElementById('modal-gender').value = edu.gender;
            document.getElementById('modal-section').value = edu.section;
            document.getElementById('modal-line').value = edu.line;
            document.getElementById('modal-leader').value = edu.leader;
            
            // Update nama pos options and set value
            updateNamaPosOptions(edu.section);
            setTimeout(() => {
                document.getElementById('modal-namaPos').value = edu.namaPos || '';
            }, 50);
            
            document.getElementById('modal-program').value = edu.program;
            document.getElementById('modal-proses').value = edu.proses;
            document.getElementById('modal-dateEdukasi').value = edu.dateEdukasi;
            document.getElementById('modal-datePlanning').value = edu.datePlanning;
            document.getElementById('modal-status').value = edu.status;
            
            // Handle current PDF file display
            const currentPdfDisplay = document.getElementById('currentPdfDisplay');
            const currentPdfName = document.getElementById('currentPdfName');
            const viewPdfBtn = document.getElementById('viewPdfBtn');
            
            if (edu.pdfFile) {
                currentPdfDisplay.style.display = 'block';
                currentPdfName.textContent = edu.pdfFile.name;
                viewPdfBtn.style.display = 'inline-block';
            } else {
                currentPdfDisplay.style.display = 'block';
                currentPdfName.textContent = 'Tidak ada file';
                viewPdfBtn.style.display = 'none';
            }
        }, 100);
    }
}

function deleteEducation(button) {
    const row = button.closest('tr');
    const eduId = parseInt(row.dataset.id);
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const edu = education.find(e => e.id === eduId);
    
    if (edu && confirm(`Yakin ingin menghapus program edukasi "${edu.program}"?`)) {
        const updatedEducation = education.filter(e => e.id !== eduId);
        saveToLocalStorage(STORAGE_KEYS.education, updatedEducation);
        
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            loadEducationData();
            updateDashboardStats();
            updateCharts();
            showNotification('Data edukasi berhasil dihapus!', 'success');
        }, 300);
    }
}

// ===== UPDATE DASHBOARD STATS =====
function updateDashboardStats() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
    const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 1. Total MP Aktif (karyawan aktif tetap + kontrak)
    const totalActiveEmployees = employees.filter(emp => emp.status === 'Aktif').length;
    
    // 2. MP End Contract (total bulan berjalan)
    const currentMonthEndContracts = endContracts.filter(contract => {
        if (contract.dateOut) {
            const endDate = new Date(contract.dateOut);
            return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
        }
        return false;
    }).length;
    
    // 3. MP Recruitment (total bulan berjalan)
    const currentMonthRecruitment = recruitment.filter(recruit => {
        if (recruit.dateCreated) {
            const recruitDate = new Date(recruit.dateCreated);
            return recruitDate.getMonth() === currentMonth && recruitDate.getFullYear() === currentYear;
        }
        return false;
    }).length;
    
    // 4. MP Edukasi (total bulan berjalan)
    const currentMonthEducation = education.filter(edu => {
        if (edu.dateEdukasi) {
            const eduDate = new Date(edu.dateEdukasi);
            return eduDate.getMonth() === currentMonth && eduDate.getFullYear() === currentYear;
        }
        return false;
    }).length;
    
    // Update dashboard cards
    updateStatCard(0, totalActiveEmployees, totalActiveEmployees > 0 ? 'Karyawan Aktif' : 'Belum ada data');
    updateStatCard(1, currentMonthEndContracts, 'Bulan Ini');
    updateStatCard(2, currentMonthRecruitment, 'Bulan Ini');
    updateStatCard(3, currentMonthEducation, 'Bulan Ini');

    // Update charts
    updateCharts();
}

function updateStatCard(index, number, change) {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards[index]) {
        const numberElement = statCards[index].querySelector('.number');
        const changeElement = statCards[index].querySelector('.change');
        
        if (numberElement) numberElement.textContent = number.toLocaleString();
        if (changeElement) changeElement.textContent = change;
    }
}

// ===== CHARTS FUNCTIONALITY =====
let charts = {
    endContractCompAssy: null,
    endContractCompWClutch: null,
    educationCompAssy: null,
    educationCompWClutch: null,
    attendance: null
};

function initializeCharts() {
    console.log('Initializing charts...');
    
    // Cek apakah semua canvas element sudah ada
    const requiredCanvases = [
        'endContractCompAssyChart',
        'endContractCompWClutchChart', 
        'educationCompAssyChart',
        'educationCompWClutchChart',
        'attendanceChart'
    ];
    
    const missingCanvases = requiredCanvases.filter(id => !document.getElementById(id));
    
    if (missingCanvases.length > 0) {
        console.warn('Missing canvas elements:', missingCanvases);
        // Retry setelah delay
        setTimeout(() => {
            initializeCharts();
        }, 500);
        return;
    }
    
    // Initialize charts dengan error handling individual
    try {
        initEndContractCompAssyChart();
    } catch (error) {
        console.error('Failed to init endContractCompAssy chart:', error);
    }
    
    try {
        initEndContractCompWClutchChart();
    } catch (error) {
        console.error('Failed to init endContractCompWClutch chart:', error);
    }
    
    try {
        initEducationCompAssyChart();
    } catch (error) {
        console.error('Failed to init educationCompAssy chart:', error);
    }
    
    try {
        initEducationCompWClutchChart();
    } catch (error) {
        console.error('Failed to init educationCompWClutch chart:', error);
    }
    
    try {
        initAttendanceChart();
    } catch (error) {
        console.error('Failed to init attendance chart:', error);
    }
    
    // Populate year filters
    try {
        populateYearFilters();
    } catch (error) {
        console.error('Failed to populate year filters:', error);
    }
    
    // Update all charts setelah initialization
    setTimeout(() => {
        updateChartsWithErrorHandling();
    }, 200);
}

function updateCharts() {
    console.log('Updating all charts...');
    
    try {
        // Update semua grafik dengan error handling individual
        if (charts.endContractCompAssy) {
            try {
                updateEndContractCompAssyChart();
            } catch (error) {
                console.warn('Error updating endContractCompAssy chart:', error);
            }
        }
        
        if (charts.endContractCompWClutch) {
            try {
                updateEndContractCompWClutchChart();
            } catch (error) {
                console.warn('Error updating endContractCompWClutch chart:', error);
            }
        }
        
        if (charts.educationCompAssy) {
            try {
                updateEducationCompAssyChart();
            } catch (error) {
                console.warn('Error updating educationCompAssy chart:', error);
            }
        }
        
        if (charts.educationCompWClutch) {
            try {
                updateEducationCompWClutchChart();
            } catch (error) {
                console.warn('Error updating educationCompWClutch chart:', error);
            }
        }
        
        if (charts.attendance) {
            try {
                updateAttendanceChart();
            } catch (error) {
                console.warn('Error updating attendance chart:', error);
            }
        }
        
        try {
            updateEducationStats();
        } catch (error) {
            console.warn('Error updating education stats:', error);
        }
        
        console.log('Charts updated successfully');
    } catch (error) {
        console.error('Error in updateCharts:', error);
        // Jangan tampilkan notifikasi error untuk menghindari double notification
    }
}

// Fungsi baru untuk update charts dengan error handling yang lebih baik
function updateChartsWithErrorHandling() {
    console.log('Updating all charts...');
    
    try {
        // Update semua grafik dengan error handling individual
        if (charts.endContractCompAssy) {
            try {
                updateEndContractCompAssyChart();
            } catch (error) {
                console.warn('Error updating endContractCompAssy chart:', error);
            }
        }
        
        if (charts.endContractCompWClutch) {
            try {
                updateEndContractCompWClutchChart();
            } catch (error) {
                console.warn('Error updating endContractCompWClutch chart:', error);
            }
        }
        
        if (charts.educationCompAssy) {
            try {
                updateEducationCompAssyChart();
            } catch (error) {
                console.warn('Error updating educationCompAssy chart:', error);
            }
        }
        
        if (charts.educationCompWClutch) {
            try {
                updateEducationCompWClutchChart();
            } catch (error) {
                console.warn('Error updating educationCompWClutch chart:', error);
            }
        }
        
        if (charts.attendance) {
            try {
                updateAttendanceChart();
            } catch (error) {
                console.warn('Error updating attendance chart:', error);
            }
        }
        
        try {
            updateEducationStats();
        } catch (error) {
            console.warn('Error updating education stats:', error);
        }
        
        console.log('Charts updated successfully');
    } catch (error) {
        console.error('Error in updateChartsWithErrorHandling:', error);
        // Jangan tampilkan notifikasi error untuk menghindari double notification
    }
}

// Simplified filter function for Education data (without program and status filters)
function filterEducationData() {
    const dateFilter = document.getElementById('educationDateFilter')?.value;
    const monthYearFilter = document.getElementById('educationMonthYearFilter')?.value;
    
    const tableBody = document.getElementById('educationTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const dateCell = cells[8]; // Date Education column
            
            let showRow = true;
            
            // Filter by date
            if (dateFilter && dateCell) {
                const cellDate = dateCell.textContent.trim();
                if (cellDate !== '-') {
                    const formattedCellDate = new Date(cellDate).toISOString().split('T')[0];
                    if (formattedCellDate !== dateFilter) {
                        showRow = false;
                    }
                }
            }
            
            // Filter by month-year
            if (monthYearFilter !== 'all' && !dateFilter && dateCell) {
                const cellDate = dateCell.textContent.trim();
                if (cellDate !== '-') {
                    const date = new Date(cellDate);
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    const cellMonthYear = monthNames[date.getMonth()] + '-' + date.getFullYear().toString().slice(-2);
                    if (cellMonthYear !== monthYearFilter) {
                        showRow = false;
                    }
                }
            }
            
            rows[i].style.display = showRow ? '' : 'none';
        }
    }
    
    updateEducationStats();
}



// Function untuk update stats di dashboard
function updateEducationStats() {
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter education data untuk bulan berjalan
    const currentMonthEducation = education.filter(edu => {
        if (edu.dateEdukasi) {
            const eduDate = new Date(edu.dateEdukasi);
            return eduDate.getMonth() === currentMonth && eduDate.getFullYear() === currentYear;
        }
        return false;
    });
    
    // Update dashboard stat card
    const educationStatNumber = document.getElementById('educationStatNumber');
    const educationStatChange = document.getElementById('educationStatChange');
    
    if (educationStatNumber) {
        educationStatNumber.textContent = currentMonthEducation.length;
    }
    
    if (educationStatChange) {
        educationStatChange.textContent = 'Bulan Ini';
    }
    
    // Update chart data jika ada
    if (charts.educationMonthly) {
        updateEducationMonthlyChart();
    }
}

// function initSectionChart() {
//     const ctx = document.getElementById('sectionChart');
//     if (!ctx) return;

//     charts.section = new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//             labels: [],
//             datasets: [{
//                 data: [],
//                 backgroundColor: [
//                     '#667eea',
//                     '#764ba2', 
//                     '#f093fb',
//                     '#f5576c',
//                     '#4facfe',
//                     '#00f2fe'
//                 ],
//                 borderWidth: 2,
//                 borderColor: '#fff'
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'bottom',
//                     labels: {
//                         usePointStyle: true,
//                         padding: 15,
//                         font: {
//                             size: 12
//                         }
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: 'Distribusi Karyawan per Section',
//                     font: {
//                         size: 14,
//                         weight: 'bold'
//                     }
//                 }
//             }
//         }
//     });
// }

// function updateSectionChart() {
//     if (!charts.section) return;
    
//     const employees = getFromLocalStorage(STORAGE_KEYS.employees);
//     const sectionCount = employees.reduce((acc, emp) => {
//         acc[emp.section] = (acc[emp.section] || 0) + 1;
//         return acc;
//     }, {});

//     charts.section.data.labels = Object.keys(sectionCount);
//     charts.section.data.datasets[0].data = Object.values(sectionCount);
//     charts.section.update();
// }

// function initStatusChart() {
//     const ctx = document.getElementById('statusChart');
//     if (!ctx) return;

//     charts.status = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: ['Aktif', 'Non-Aktif'],
//             datasets: [{
//                 label: 'Jumlah Karyawan',
//                 data: [0, 0, 0],
//                 backgroundColor: [
//                     '#27ae60',
//                     '#e74c3c', 
//                     '#f39c12'
//                 ],
//                 borderRadius: 8,
//                 borderSkipped: false
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     display: false
//                 },
//                 title: {
//                     display: true,
//                     text: 'Status Karyawan',
//                     font: {
//                         size: 14,
//                         weight: 'bold'
//                     }
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         stepSize: 1
//                     }
//                 }
//             }
//         }
//     });
// }

// function updateStatusChart() {
//     if (!charts.status) return;
    
//     const employees = getFromLocalStorage(STORAGE_KEYS.employees);
//     const statusCount = {
//         'Aktif': 0,
//         'Non-Aktif': 0,
//     };

//     employees.forEach(emp => {
//         if (statusCount.hasOwnProperty(emp.status)) {
//             statusCount[emp.status]++;
//         }
//     });

//     charts.status.data.datasets[0].data = Object.values(statusCount);
//     charts.status.update();
// }

// function initGenderChart() {
//     const ctx = document.getElementById('genderChart');
//     if (!ctx) return;

//     charts.gender = new Chart(ctx, {
//         type: 'pie',
//         data: {
//             labels: ['Laki-laki', 'Perempuan'],
//             datasets: [{
//                 data: [0, 0],
//                 backgroundColor: [
//                     '#3498db',
//                     '#e91e63'
//                 ],
//                 borderWidth: 2,
//                 borderColor: '#fff'
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'bottom',
//                     labels: {
//                         usePointStyle: true,
//                         padding: 15,
//                         font: {
//                             size: 12
//                         }
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: 'Distribusi Gender',
//                     font: {
//                         size: 14,
//                         weight: 'bold'
//                     }
//                 }
//             }
//         }
//     });
// }

// function updateGenderChart() {
//     if (!charts.gender) return;
    
//     const employees = getFromLocalStorage(STORAGE_KEYS.employees);
//     const genderCount = {
//         'Laki-laki': 0,
//         'Perempuan': 0
//     };

//     employees.forEach(emp => {
//         if (genderCount.hasOwnProperty(emp.gender)) {
//             genderCount[emp.gender]++;
//         }
//     });

//     charts.gender.data.datasets[0].data = Object.values(genderCount);
//     charts.gender.update();
// }

// function initEmployeeTypeChart() {
//     const ctx = document.getElementById('recruitmentChart'); // Reuse canvas element
//     if (!ctx) return;

//     charts.employeeType = new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//             labels: ['Karyawan Tetap', 'Karyawan Kontrak'],
//             datasets: [{
//                 data: [0, 0],
//                 backgroundColor: [
//                     '#27ae60',
//                     '#f39c12'
//                 ],
//                 borderWidth: 2,
//                 borderColor: '#fff'
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'bottom',
//                     labels: {
//                         usePointStyle: true,
//                         padding: 15,
//                         font: {
//                             size: 12
//                         }
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: 'Tipe Karyawan (Tetap vs Kontrak)',
//                     font: {
//                         size: 14,
//                         weight: 'bold'
//                     }
//                 }
//             }
//         }
//     });
// }

// function updateEmployeeTypeChart() {
//     if (!charts.employeeType) return;
    
//     const employees = getFromLocalStorage(STORAGE_KEYS.employees);
//     const typeCount = {
//         'Tetap': 0,
//         'Kontrak': 0
//     };

//     employees.forEach(emp => {
//         if (emp.employeeType && typeCount.hasOwnProperty(emp.employeeType)) {
//             typeCount[emp.employeeType]++;
//         }
//     });

//     charts.employeeType.data.datasets[0].data = Object.values(typeCount);
//     charts.employeeType.update();
// }

// Function to populate year filter options
function populateYearFilters() {
    populateAllYearFilters();
    populateAttendanceFilters();
    
    // Add event listeners for year filter synchronization
    const filterIds = [
        'endContractCompAssyYearFilter',
        'endContractCompWClutchYearFilter', 
        'educationCompAssyYearFilter',
        'educationCompWClutchYearFilter'
    ];
    
    filterIds.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            // Add event listener for year filter synchronization
            filter.addEventListener('change', function() {
                syncAllYearFilters(parseInt(this.value));
            });
        }
    });
}

// Fungsi untuk populate semua filter tahun dengan data yang konsisten
function populateAllYearFilters() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Generate tahun dari 2020 sampai 3 tahun ke depan
    for (let year = 2020; year <= currentYear + 3; year++) {
        years.push(year);
    }
    
    const filterIds = [
        'endContractCompAssyYearFilter',
        'endContractCompWClutchYearFilter',
        'educationCompAssyYearFilter', 
        'educationCompWClutchYearFilter'
    ];
    
    filterIds.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            // Clear existing options
            filterElement.innerHTML = '';
            
            // Add year options
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) {
                    option.selected = true;
                }
                filterElement.appendChild(option);
            });
        }
    });
}

// Tambahkan fungsi untuk sinkronisasi semua filter tahun
function syncAllYearFilters(selectedYear) {
    const filterIds = [
        'endContractCompAssyYearFilter',
        'endContractCompWClutchYearFilter', 
        'educationCompAssyYearFilter',
        'educationCompWClutchYearFilter'
    ];
    
    // Show loading state
    filterIds.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            filterElement.style.opacity = '0.7';
            filterElement.disabled = true;
        }
    });
    
    // Update semua dropdown filter tahun
    filterIds.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement && filterElement.value !== selectedYear.toString()) {
            filterElement.value = selectedYear.toString();
            filterElement.classList.add('synced');
        }
    });
    
    // Update semua chart dengan delay untuk smooth transition
    setTimeout(() => {
        updateAllCharts();
        
        // Restore normal state
        filterIds.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.style.opacity = '1';
                filterElement.disabled = false;
                
                // Remove synced class after animation
                setTimeout(() => {
                    filterElement.classList.remove('synced');
                }, 1000);
            }
        });
        
        // Show notification
        showNotification(`📊 Semua grafik berhasil disinkronkan ke tahun ${selectedYear}`, 'success');
    }, 300);
}

// Fungsi untuk update semua chart sekaligus
function updateAllCharts() {
    updateEndContractCompAssyChart();
    updateEndContractCompWClutchChart();
    updateEducationCompAssyChart();
    updateEducationCompWClutchChart();
}

// ===== GRAFIK BARU: MONITORING KEHADIRAN EDUKASI HARIAN =====
function initAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) {
        console.warn('Element attendanceChart tidak ditemukan');
        return;
    }

    try {
        // Destroy existing chart if it exists
        if (charts.attendance) {
            charts.attendance.destroy();
            charts.attendance = null;
        }
        
        charts.attendance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '📋 Plan Edukasi',
                        data: [],
                        type: 'line',
                        borderColor: modernColors.attendance.plan.solid,
                        backgroundColor: 'rgba(168, 237, 234, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: modernColors.attendance.plan.solid,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointStyle: 'circle',
                        yAxisID: 'y'
                    },
                    {
                        label: '✅ Hadir',
                        data: [],
                        backgroundColor: modernColors.education.refreshMP.solid,
                        borderColor: modernColors.education.refreshMP.border,
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: '❌ Tidak Hadir',
                        data: [],
                        backgroundColor: modernColors.primary.female.solid,
                        borderColor: modernColors.primary.female.border,
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                return 'Tanggal: ' + context[0].label;
                            },
                            label: function(context) {
                                if (context.dataset.label === '📋 Plan Edukasi') {
                                    return context.dataset.label + ': ' + context.parsed.y + ' sesi';
                                } else {
                                    return context.dataset.label + ': ' + context.parsed.y + ' orang';
                                }
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 10
                        },
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value, context) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        stacked: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#5a6c7d',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        display: true,
                        stacked: true,
                        beginAtZero: true,
                        max: 10,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#5a6c7d',
                            font: {
                                size: 12
                            },
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        updateAttendanceChart();
    } catch (error) {
        console.error('Error creating attendance chart:', error);
    }
}

function updateAttendanceChart() {
    try {
        if (!charts.attendance) {
            console.warn('Chart attendance belum diinisialisasi');
            return;
        }
        
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) {
            console.warn('Canvas element attendanceChart not found');
            return;
        }
        
        showChartLoading('attendanceChart');
        
        setTimeout(() => {
            try {
                const education = getFromLocalStorage(STORAGE_KEYS.education) || [];
                const monthFilter = document.getElementById('attendanceMonthFilter');
                const yearFilter = document.getElementById('attendanceYearFilter');
                const sectionFilter = document.getElementById('attendanceSectionFilter');
                
                const selectedMonth = monthFilter ? parseInt(monthFilter.value) : new Date().getMonth();
                const selectedYear = yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear();
                const selectedSection = sectionFilter ? sectionFilter.value : 'all';
                
                // Get days in selected month
                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                const labels = [];
                const planData = new Array(daysInMonth).fill(0);
                const hadirData = new Array(daysInMonth).fill(0);
                const tidakHadirData = new Array(daysInMonth).fill(0);
                
                // Generate labels for each day
                for (let day = 1; day <= daysInMonth; day++) {
                    labels.push(day.toString());
                }
                
                // Process education data
                education.forEach(edu => {
                    if (edu.dateEdukasi) {
                        const date = new Date(edu.dateEdukasi);
                        const year = date.getFullYear();
                        const month = date.getMonth();
                        const day = date.getDate();
                        
                        // Filter by date and section
                        const matchesDate = year === selectedYear && month === selectedMonth;
                        const matchesSection = selectedSection === 'all' || edu.section === selectedSection;
                        
                        if (matchesDate && matchesSection) {
                            const dayIndex = day - 1;
                            if (dayIndex >= 0 && dayIndex < daysInMonth) {
                                // Count planned sessions (dots)
                                planData[dayIndex]++;
                                
                                // Count attendance (bars)
                                if (edu.attendanceStatus === 'Hadir') {
                                    hadirData[dayIndex]++;
                                } else if (edu.attendanceStatus === 'Tidak Hadir') {
                                    tidakHadirData[dayIndex]++;
                                } else {
                                    // If no attendance status, assume planned but not executed yet
                                    // Keep as plan only
                                }
                            }
                        }
                    }
                });
                
                // Update chart data
                charts.attendance.data.labels = labels;
                charts.attendance.data.datasets[0].data = planData; // Plan (line with dots)
                charts.attendance.data.datasets[1].data = hadirData; // Hadir (green bars)
                charts.attendance.data.datasets[2].data = tidakHadirData; // Tidak Hadir (red bars)
                
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                
                // Update chart title based on section filter
                let titleText = `Monitoring Jadwal & Kehadiran Edukasi Harian - ${monthNames[selectedMonth]} ${selectedYear}`;
                if (selectedSection !== 'all') {
                    titleText += ` (${selectedSection})`;
                }
                charts.attendance.options.plugins.title.text = titleText;
                
                charts.attendance.update();
                
                console.log('Chart attendance updated successfully');
            } catch (error) {
                console.error('Error updating attendance chart data:', error);
            }
        }, 500);
    } catch (error) {
        console.error('Error updating attendance chart:', error);
    }
}

function populateAttendanceFilters() {
    try {
        const monthFilter = document.getElementById('attendanceMonthFilter');
        const yearFilter = document.getElementById('attendanceYearFilter');
        
        if (monthFilter) {
            const currentMonth = new Date().getMonth();
            monthFilter.value = currentMonth;
        }
        
        if (yearFilter) {
            const currentYear = new Date().getFullYear();
            const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
            
            yearFilter.innerHTML = '';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) option.selected = true;
                yearFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating attendance filters:', error);
    }
}

// Tambahkan konfigurasi yang lebih presisi untuk semua grafik
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2, // Untuk ketajaman yang lebih baik
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 15,
                font: {
                    size: 13,
                    weight: '600',
                    family: 'Segoe UI, sans-serif'
                },
                color: '#2c3e50'
            }
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(44, 62, 80, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3498db',
            borderWidth: 1,
            cornerRadius: 8,
            titleFont: {
                size: 14,
                weight: 'bold'
            },
            bodyFont: {
                size: 13
            },
            padding: 12,
            displayColors: true
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                lineWidth: 1,
                drawBorder: false
            },
            ticks: {
                color: '#7f8c8d',
                font: {
                    size: 12,
                    weight: '500'
                },
                padding: 8
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#7f8c8d',
                font: {
                    size: 12,
                    weight: '500'
                },
                maxRotation: 0,
                minRotation: 0
            }
        }
    }
};

// Update color palette dengan gradient yang lebih modern
const modernColors = {
    primary: {
        male: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '#667eea',
            solid: '#667eea'
        },
        female: {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: '#f093fb',
            solid: '#f093fb'
        }
    },
    education: {
        newMP: {
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: '#4facfe',
            solid: '#4facfe'
        },
        refreshMP: {
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            border: '#43e97b',
            solid: '#43e97b'
        },
        skillUpMP: {
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            border: '#fa709a',
            solid: '#fa709a'
        }
    },
    attendance: {
        plan: {
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            border: '#a8edea',
            solid: '#a8edea'
        },
        actual: {
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            border: '#ffecd2',
            solid: '#ffecd2'
        }
    }
};

// Fungsi untuk membuat gradient
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

// ===== GRAFIK 1: MONITORING MP END CONTRACT - COMP ASSY =====
function initEndContractCompAssyChart() {
    const ctx = document.getElementById('endContractCompAssyChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.endContractCompAssy) {
        charts.endContractCompAssy.destroy();
        charts.endContractCompAssy = null;
    }
    
    charts.endContractCompAssy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [{
                label: '👨 Pria',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#667eea',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }, {
                label: '👩 Wanita',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#f093fb',
                borderColor: '#f093fb',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    anchor: 'center',
                    align: 'center',
                    formatter: function(value, context) {
                        return value > 0 ? value : '';
                    }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        title: function(context) {
                            return '📅 ' + context[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' orang';
                        }
                    }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    stacked: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        stepSize: 5
                    },

                },
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true,

                }
            }
        }
    });
}

// Tambahkan loading animation
function showChartLoading(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.warn(`Canvas element with id '${chartId}' not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw loading animation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#667eea';
    ctx.font = '16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('📊 Memuat data...', centerX, centerY);
}

function updateEndContractCompAssyChart() {
    if (!charts.endContractCompAssy) {
        console.warn('Chart endContractCompAssy belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('endContractCompAssyChart');
    if (!canvas) {
        console.warn('Canvas element endContractCompAssyChart not found');
        return;
    }
    
    showChartLoading('endContractCompAssyChart');
    
    setTimeout(() => {
        try {
            const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
            const yearFilter = document.getElementById('endContractCompAssyYearFilter');
            const selectedYear = yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear();
            
            const compAssyPria = new Array(12).fill(0);
            const compAssyWanita = new Array(12).fill(0);
            
            endContracts.forEach(ec => {
                if (ec.dateOut && ec.section === 'Comp Assy' && ec.gender) {
                    const date = new Date(ec.dateOut);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    
                    if ((year === selectedYear && month >= 3) || (year === selectedYear + 1 && month <= 2)) {
                        const index = month >= 3 ? month - 3 : month + 9;
                        
                        if (ec.gender === 'Laki-laki') {
                            compAssyPria[index]++;
                        } else if (ec.gender === 'Perempuan') {
                            compAssyWanita[index]++;
                        }
                    }
                }
            });
            
            charts.endContractCompAssy.data.datasets[0].data = compAssyPria;
            charts.endContractCompAssy.data.datasets[1].data = compAssyWanita;
            charts.endContractCompAssy.update();
            
            console.log('Chart endContractCompAssy updated successfully');
        } catch (error) {
            console.error('Error updating endContractCompAssy chart:', error);
        }
    }, 500);
}

// ===== GRAFIK 2: MONITORING MP END CONTRACT - COMP WCLUTCH =====
function initEndContractCompWClutchChart() {
    const ctx = document.getElementById('endContractCompWClutchChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts.endContractCompWClutch) {
        charts.endContractCompWClutch.destroy();
        charts.endContractCompWClutch = null;
    }

    charts.endContractCompWClutch = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: '👨 Pria',
                    data: [],
                    backgroundColor: modernColors.primary.male.solid,
                    borderColor: modernColors.primary.male.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '👩 Wanita',
                    data: [],
                    backgroundColor: modernColors.primary.female.solid,
                    borderColor: modernColors.primary.female.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    anchor: 'center',
                    align: 'center',
                    formatter: function(value, context) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    max: 50,
                    stacked: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        stepSize: 5
                    },

                },
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true,

                }
            }
        }
    });
}

function updateEndContractCompWClutchChart() {
    if (!charts.endContractCompWClutch) {
        console.warn('Chart endContractCompWClutch belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('endContractCompWClutchChart');
    if (!canvas) {
        console.warn('Canvas element endContractCompWClutchChart not found');
        return;
    }
    
    showChartLoading('endContractCompWClutchChart');
    
    setTimeout(() => {
        try {
            const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
            const yearFilter = document.getElementById('endContractCompWClutchYearFilter');
            const selectedYear = yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear();
            
            const compWClutchPria = new Array(12).fill(0);
            const compWClutchWanita = new Array(12).fill(0);
            
            endContracts.forEach(ec => {
                if (ec.dateOut && ec.section === 'Comp WClutch' && ec.gender) {
                    const date = new Date(ec.dateOut);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    
                    if ((year === selectedYear && month >= 3) || (year === selectedYear + 1 && month <= 2)) {
                        const index = month >= 3 ? month - 3 : month + 9;
                        
                        if (ec.gender === 'Laki-laki') {
                            compWClutchPria[index]++;
                        } else if (ec.gender === 'Perempuan') {
                            compWClutchWanita[index]++;
                        }
                    }
                }
            });
            
            charts.endContractCompWClutch.data.datasets[0].data = compWClutchPria;
            charts.endContractCompWClutch.data.datasets[1].data = compWClutchWanita;
            charts.endContractCompWClutch.options.plugins.title.text = `Monitoring MP End Contract - Comp WClutch (Apr ${selectedYear} - Mar ${selectedYear + 1})`;
            charts.endContractCompWClutch.update();
            
            console.log('Chart endContractCompWClutch updated successfully');
        } catch (error) {
            console.error('Error updating endContractCompWClutch chart:', error);
        }
    }, 500);
}

// ===== GRAFIK 3: MONITORING MP EDUKASI - COMP ASSY =====
function initEducationCompAssyChart() {
    const ctx = document.getElementById('educationCompAssyChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts.educationCompAssy) {
        charts.educationCompAssy.destroy();
        charts.educationCompAssy = null;
    }

    charts.educationCompAssy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: '🆕 New MP',
                    data: [],
                    backgroundColor: modernColors.education.newMP.solid,
                    borderColor: modernColors.education.newMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '🔄 Refresh MP',
                    data: [],
                    backgroundColor: modernColors.education.refreshMP.solid,
                    borderColor: modernColors.education.refreshMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '⬆️ Skill Up MP',
                    data: [],
                    backgroundColor: modernColors.education.skillUpMP.solid,
                    borderColor: modernColors.education.skillUpMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    anchor: 'center',
                    align: 'center',
                    formatter: function(value, context) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    max: 100,
                    stacked: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        stepSize: 10
                    },

                },
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true,

                }
            }
        }
    });
}

function updateEducationCompAssyChart() {
    if (!charts.educationCompAssy) {
        console.warn('Chart educationCompAssy belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('educationCompAssyChart');
    if (!canvas) {
        console.warn('Canvas element educationCompAssyChart not found');
        return;
    }
    
    showChartLoading('educationCompAssyChart');
    
    setTimeout(() => {
        try {
            const education = getFromLocalStorage(STORAGE_KEYS.education);
            const yearFilter = document.getElementById('educationCompAssyYearFilter');
            const selectedYear = yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear();
            
            const newMPData = new Array(12).fill(0);
            const refreshMPData = new Array(12).fill(0);
            const skillUpMPData = new Array(12).fill(0);
            
            education.forEach(edu => {
                if (edu.dateEdukasi && edu.program && edu.section === 'Comp Assy') {
                    const date = new Date(edu.dateEdukasi);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    
                    if ((year === selectedYear && month >= 3) || (year === selectedYear + 1 && month <= 2)) {
                        const index = month >= 3 ? month - 3 : month + 9;
                        
                        const programLower = edu.program.toLowerCase();
                        if (programLower.includes('new mp')) {
                            newMPData[index]++;
                        } else if (programLower.includes('refresh mp')) {
                            refreshMPData[index]++;
                        } else if (programLower.includes('skill up mp')) {
                            skillUpMPData[index]++;
                        }
                    }
                }
            });
            
            charts.educationCompAssy.data.datasets[0].data = newMPData;
            charts.educationCompAssy.data.datasets[1].data = refreshMPData;
            charts.educationCompAssy.data.datasets[2].data = skillUpMPData;
            charts.educationCompAssy.options.plugins.title.text = `Monitoring MP Edukasi - Comp Assy (Apr ${selectedYear} - Mar ${selectedYear + 1})`;
            charts.educationCompAssy.update();
            
            console.log('Chart educationCompAssy updated successfully');
        } catch (error) {
            console.error('Error updating educationCompAssy chart:', error);
        }
    }, 500);
}

// ===== GRAFIK 4: MONITORING MP EDUKASI - COMP WCLUTCH =====
function initEducationCompWClutchChart() {
    const ctx = document.getElementById('educationCompWClutchChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts.educationCompWClutch) {
        charts.educationCompWClutch.destroy();
        charts.educationCompWClutch = null;
    }

    charts.educationCompWClutch = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: '🆕 New MP',
                    data: [],
                    backgroundColor: modernColors.education.newMP.solid,
                    borderColor: modernColors.education.newMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '🔄 Refresh MP',
                    data: [],
                    backgroundColor: modernColors.education.refreshMP.solid,
                    borderColor: modernColors.education.refreshMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '⬆️ Skill Up MP',
                    data: [],
                    backgroundColor: modernColors.education.skillUpMP.solid,
                    borderColor: modernColors.education.skillUpMP.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    anchor: 'center',
                    align: 'center',
                    formatter: function(value, context) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    max: 100,
                    stacked: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        stepSize: 10
                    },

                },
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true,

                }
            }
        }
    });
}

function updateEducationCompWClutchChart() {
    if (!charts.educationCompWClutch) {
        console.warn('Chart educationCompWClutch belum diinisialisasi');
        return;
    }
    
    const canvas = document.getElementById('educationCompWClutchChart');
    if (!canvas) {
        console.warn('Canvas element educationCompWClutchChart not found');
        return;
    }
    
    showChartLoading('educationCompWClutchChart');
    
    setTimeout(() => {
        try {
            const education = getFromLocalStorage(STORAGE_KEYS.education);
            const yearFilter = document.getElementById('educationCompWClutchYearFilter');
            const selectedYear = yearFilter ? parseInt(yearFilter.value) : new Date().getFullYear();
            
            const newMPData = new Array(12).fill(0);
            const refreshMPData = new Array(12).fill(0);
            const skillUpMPData = new Array(12).fill(0);
            
            education.forEach(edu => {
                if (edu.dateEdukasi && edu.program && edu.section === 'Comp WClutch') {
                    const date = new Date(edu.dateEdukasi);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    
                    if ((year === selectedYear && month >= 3) || (year === selectedYear + 1 && month <= 2)) {
                        const index = month >= 3 ? month - 3 : month + 9;
                        
                        const programLower = edu.program.toLowerCase();
                        if (programLower.includes('new mp')) {
                            newMPData[index]++;
                        } else if (programLower.includes('refresh mp')) {
                            refreshMPData[index]++;
                        } else if (programLower.includes('skill up mp')) {
                            skillUpMPData[index]++;
                        }
                    }
                }
            });
            
            charts.educationCompWClutch.data.datasets[0].data = newMPData;
            charts.educationCompWClutch.data.datasets[1].data = refreshMPData;
            charts.educationCompWClutch.data.datasets[2].data = skillUpMPData;
            charts.educationCompWClutch.options.plugins.title.text = `Monitoring MP Edukasi - Comp WClutch (Apr ${selectedYear} - Mar ${selectedYear + 1})`;
            charts.educationCompWClutch.update();
            
            console.log('Chart educationCompWClutch updated successfully');
        } catch (error) {
            console.error('Error updating educationCompWClutch chart:', error);
        }
    }, 500);
}

// ===== GRAFIK 3: TOTAL KARYAWAN COMP ASSY & WITH CLUTCH (PRIA DAN WANITA) =====
// function initTotalEmployeeChart() {
//     const ctx = document.getElementById('totalEmployeeChart');
//     if (!ctx) return;

//     charts.totalEmployee = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: ['Comp Assy', 'Comp WClutch'],
//             datasets: [
//                 {
//                     label: 'Pria Tetap',
//                     data: [],
//                     backgroundColor: '#3498db',
//                     borderColor: '#2980b9',
//                     borderWidth: 1
//                 },
//                 {
//                     label: 'Wanita Tetap',
//                     data: [],
//                     backgroundColor: '#e91e63',
//                     borderColor: '#c2185b',
//                     borderWidth: 1
//                 },
//                 {
//                     label: 'Pria Kontrak',
//                     data: [],
//                     backgroundColor: '#9b59b6',
//                     borderColor: '#8e44ad',
//                     borderWidth: 1
//                 },
//                 {
//                     label: 'Wanita Kontrak',
//                     data: [],
//                     backgroundColor: '#f39c12',
//                     borderColor: '#e67e22',
//                     borderWidth: 1
//                 }
//             ]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'top',
//                     labels: {
//                         usePointStyle: true,
//                         padding: 15
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: 'Total Karyawan per Section (Gender & Tipe)',
//                     font: {
//                         size: 14,
//                         weight: 'bold'
//                     }
//                 }
//             },
//             scales: {
//                 x: {
//                     stacked: false
//                 },
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         stepSize: 1
//                     }
//                 }
//             }
//         }
//     });
// }

// function updateTotalEmployeeChart() {
//     if (!charts.totalEmployee) return;
    
//     const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
//     // Filter hanya Comp Assy dan Comp WClutch
//     const sections = ['Comp Assy', 'Comp WClutch'];
//     const data = {
//         'Pria Tetap': [0, 0],
//         'Wanita Tetap': [0, 0],
//         'Pria Kontrak': [0, 0],
//         'Wanita Kontrak': [0, 0]
//     };
    
//     employees.forEach(emp => {
//         if (sections.includes(emp.section) && emp.status === 'Aktif') {
//             const sectionIndex = sections.indexOf(emp.section);
//             const key = `${emp.gender} ${emp.employeeType}`;
//             if (data[key]) {
//                 data[key][sectionIndex]++;
//             }
//         }
//     });
    
//     charts.totalEmployee.data.datasets[0].data = data['Laki-laki Tetap'];
//     charts.totalEmployee.data.datasets[1].data = data['Perempuan Tetap'];
//     charts.totalEmployee.data.datasets[2].data = data['Laki-laki Kontrak'];
//     charts.totalEmployee.data.datasets[3].data = data['Perempuan Kontrak'];
//     charts.totalEmployee.update();
// }

// ===== NAVIGATION FUNCTIONALITY =====
function initializeNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionName = this.dataset.section;
            
            // Use showSection function for consistency
            showSection(sectionName);
        });
    });
    
    // Initialize with dashboard section on page load
    setTimeout(() => {
        showSection('dashboard');
    }, 100);
}

function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'database':
            loadEmployeeData();
            break;
        case 'end-contract':
            loadEndContractData();
            break;
        case 'recruitment':
            loadRecruitmentData();
            break;
        case 'education':
            loadEducationData();
            break;
        case 'education-schedule':
            loadEducationScheduleData();
            break;
        case 'overtime':
            loadOvertimeData();
            initializeOvertimeFilters();
            break;
        case 'mapping':
            loadMappingData();
            break;
        case 'skill-matrix':
            loadSkillMatrixData();
            break;
        case 'settings':
            updateStorageInfo();
            break;
    }
}

// Update di bagian showSection function
function showSection(sectionName) {
    // Hide all sections - HANYA gunakan classList untuk konsistensi
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section - HANYA gunakan classList
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'database': 'Database MP',
        'end-contract': 'End Contract',
        'recruitment': 'Recruitment',
        'education': 'Edukasi',
        'education-schedule': 'Jadwal Edukasi',
        'overtime': 'Kontrol Overtime',
        'mapping': 'Mapping MP',
        'skill-matrix': 'Skill Matrix',
        'settings': 'Settings'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
    }
    
    // Load data for specific sections
    if (sectionName === 'mapping') {
        loadMappingData();
    } else if (sectionName === 'skill-matrix') {
        loadSkillMatrixData();
    } else if (sectionName === 'database') {
        loadEmployeeData();
    } else if (sectionName === 'end-contract') {
        loadEndContractData();
    } else if (sectionName === 'recruitment') {
        loadRecruitmentData();
    } else if (sectionName === 'education') {
        loadEducationData();
    } else if (sectionName === 'education-schedule') {
        loadEducationScheduleData();
    } else if (sectionName === 'overtime') {
        loadOvertimeData();
        initializeOvertimeFilters();
    } else if (sectionName === 'dashboard') {
        updateDashboardStats();
        updateCharts();
    }
}

// Enhanced Load Education Schedule Data with Today's Highlight
function loadEducationScheduleData() {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const tableBody = document.getElementById('educationScheduleTableBody');
    
    if (!tableBody) return;
    
    // Sort by date edukasi (ascending)
    const sortedData = educationData.sort((a, b) => new Date(a.dateEdukasi) - new Date(b.dateEdukasi));
    
    tableBody.innerHTML = '';
    
    if (sortedData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="12" class="text-center">Belum ada data jadwal edukasi</td></tr>';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    sortedData.forEach((item, index) => {
        const row = document.createElement('tr');
        const attendanceStatus = item.attendanceStatus || '';
        const note = item.note || '';
        const jamSesi = item.jamSesi || 'Sesi 1'; // Default ke Sesi 1 jika belum ada
        const itemDate = new Date(item.dateEdukasi).toISOString().split('T')[0];
        
        // Highlight today's schedule
        if (itemDate === today) {
            row.classList.add('today-schedule');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.npk}</td>
            <td>${item.nama}</td>
            <td>${item.section}</td>
            <td>${item.line || '-'}</td>
            <td>${item.leader || '-'}</td>
            <td>${item.program}</td>
            <td>${positionDisplayNames[item.namaPos] || item.namaPos || '-'}</td>
            <td>
                ${itemDate === today ? '🔥 ' : ''}${formatDate(item.dateEdukasi)}
                ${itemDate === today ? ' (Hari Ini)' : ''}
            </td>
            <td>
                <select class="session-dropdown" onchange="updateSessionTime('${item.npk}', '${item.dateEdukasi}', this.value)">
                    <option value="Sesi 1" ${jamSesi === 'Sesi 1' ? 'selected' : ''}>08:00-11:45</option>
                    <option value="Sesi 2" ${jamSesi === 'Sesi 2' ? 'selected' : ''}>13:00-16:30</option>
                    <option value="Sesi 3" ${jamSesi === 'Sesi 3' ? 'selected' : ''}>16:40-20:00</option>
                </select>
            </td>
            <td>
                <select class="status-dropdown" onchange="updateAttendanceStatus('${item.npk}', '${item.dateEdukasi}', this.value)">
                    <option value="">Pilih Status</option>
                    <option value="Hadir" ${attendanceStatus === 'Hadir' ? 'selected' : ''}>Hadir</option>
                    <option value="Tidak Hadir" ${attendanceStatus === 'Tidak Hadir' ? 'selected' : ''}>Tidak Hadir</option>
                </select>
            </td>
            <td>
                <input type="text" class="note-input" value="${note}" placeholder="Tambah catatan..." onblur="updateNote('${item.npk}', '${item.dateEdukasi}', this.value)">
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Initialize month-year filter
    initializeScheduleMonthYearFilter(sortedData);
    
    // Show today's schedule count
    const todaySchedules = sortedData.filter(item => {
        const itemDate = new Date(item.dateEdukasi).toISOString().split('T')[0];
        return itemDate === today;
    });
    
    if (todaySchedules.length > 0) {
        showNotification(`📅 Ada ${todaySchedules.length} jadwal edukasi hari ini!`, 'info');
    }
}

// Initialize Schedule Month-Year Filter (Revised)
function initializeScheduleMonthYearFilter(data) {
    const filter = document.getElementById('scheduleMonthYearFilter');
    if (!filter) return;
    
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    // Get unique month-year combinations
    const monthYears = [...new Set(data.map(item => {
        const date = new Date(item.dateEdukasi);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `${month}-${year}`;
    }))].sort((a, b) => {
        // Sort by year then month
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        if (yearA !== yearB) return yearB.localeCompare(yearA);
        return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });
    
    filter.innerHTML = '<option value="all">Semua Periode</option>';
    monthYears.forEach(monthYear => {
        filter.innerHTML += `<option value="${monthYear}">${monthYear}</option>`;
    });
}

// Filter Education Schedule by Date (New Function)
function filterEducationScheduleByDate() {
    const dateFilter = document.getElementById('scheduleDateFilter').value;
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    
    let filteredData = educationData;
    
    // Filter by specific date
    if (dateFilter) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.dateEdukasi).toISOString().split('T')[0];
            return itemDate === dateFilter;
        });
        
        // Clear month-year filter when date filter is used
        document.getElementById('scheduleMonthYearFilter').value = 'all';
    }
    
    // Sort by NPK first, then by date
    filteredData.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        if (npkA !== npkB) {
            return npkA - npkB;
        }
        return new Date(a.dateEdukasi) - new Date(b.dateEdukasi);
    });
    
    // Update table
    displayFilteredScheduleData(filteredData);
    
    // Show filter info
    if (dateFilter && filteredData.length > 0) {
        showNotification(`Menampilkan ${filteredData.length} jadwal untuk tanggal ${formatDate(dateFilter)}`, 'info');
    } else if (dateFilter && filteredData.length === 0) {
        showNotification(`Tidak ada jadwal untuk tanggal ${formatDate(dateFilter)}`, 'warning');
    }
}

// Clear Date Filter (New Function)
function clearDateFilter() {
    document.getElementById('scheduleDateFilter').value = '';
    document.getElementById('scheduleMonthYearFilter').value = 'all';
    loadEducationScheduleData();
    showNotification('Filter tanggal dibersihkan', 'info');
}

// Update existing Filter Education Schedule function
function filterEducationSchedule() {
    const monthYearFilter = document.getElementById('scheduleMonthYearFilter').value;
    const dateFilter = document.getElementById('scheduleDateFilter').value;
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    
    let filteredData = educationData;
    
    // If date filter is active, prioritize it
    if (dateFilter) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.dateEdukasi).toISOString().split('T')[0];
            return itemDate === dateFilter;
        });
    }
    // Otherwise use month-year filter
    else if (monthYearFilter !== 'all') {
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        
        const [filterMonth, filterYear] = monthYearFilter.split('-');
        const filterMonthIndex = monthNames.indexOf(filterMonth);
        const fullYear = parseInt('20' + filterYear);
        
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.dateEdukasi);
            const itemMonth = itemDate.getMonth();
            const itemYear = itemDate.getFullYear();
            return itemMonth === filterMonthIndex && itemYear === fullYear;
        });
        
        // Clear date filter when month-year filter is used
        document.getElementById('scheduleDateFilter').value = '';
    }
    
    // Sort by NPK first, then by date
    filteredData.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        if (npkA !== npkB) {
            return npkA - npkB;
        }
        return new Date(a.dateEdukasi) - new Date(b.dateEdukasi);
    });
    
    // Update table
    displayFilteredScheduleData(filteredData);
    
    // Show filter info for month-year filter
    if (monthYearFilter !== 'all' && !dateFilter) {
        if (filteredData.length > 0) {
            showNotification(`Menampilkan ${filteredData.length} jadwal untuk periode ${monthYearFilter}`, 'info');
        } else {
            showNotification(`Tidak ada jadwal untuk periode ${monthYearFilter}`, 'warning');
        }
    }
}

// Display Filtered Schedule Data (Revised)
function displayFilteredScheduleData(data) {
    const tableBody = document.getElementById('educationScheduleTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="12" class="text-center">Tidak ada data untuk filter yang dipilih</td></tr>';
        return;
    }
    
    // Sort by date edukasi (ascending)
    const sortedData = data.sort((a, b) => new Date(a.dateEdukasi) - new Date(b.dateEdukasi));
    
    sortedData.forEach((item, index) => {
        const row = document.createElement('tr');
        const attendanceStatus = item.attendanceStatus || '';
        const note = item.note || '';
        const jamSesi = item.jamSesi || 'Sesi 1'; // Default ke Sesi 1 jika belum ada
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.npk}</td>
            <td>${item.nama}</td>
            <td>${item.section}</td>
            <td>${item.line || '-'}</td>
            <td>${item.leader || '-'}</td>
            <td>${item.program}</td>
            <td>${positionDisplayNames[item.namaPos] || item.namaPos || '-'}</td>
            <td>${formatDate(item.dateEdukasi)}</td>
            <td>
                <select class="session-dropdown" onchange="updateSessionTime('${item.npk}', '${item.dateEdukasi}', this.value)">
                    <option value="Sesi 1" ${jamSesi === 'Sesi 1' ? 'selected' : ''}>08:00-11:45</option>
                    <option value="Sesi 2" ${jamSesi === 'Sesi 2' ? 'selected' : ''}>13:00-16:30</option>
                    <option value="Sesi 3" ${jamSesi === 'Sesi 3' ? 'selected' : ''}>16:40-20:00</option>
                </select>
            </td>
            <td>
                <select class="status-dropdown" onchange="updateAttendanceStatus('${item.npk}', '${item.dateEdukasi}', this.value)">
                    <option value="">Pilih Status</option>
                    <option value="Hadir" ${attendanceStatus === 'Hadir' ? 'selected' : ''}>Hadir</option>
                    <option value="Tidak Hadir" ${attendanceStatus === 'Tidak Hadir' ? 'selected' : ''}>Tidak Hadir</option>
                </select>
            </td>
            <td>
                <input type="text" class="note-input" value="${note}" placeholder="Tambah catatan..." onblur="updateNote('${item.npk}', '${item.dateEdukasi}', this.value)">
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update Attendance Status (New Function)
function updateAttendanceStatus(npk, dateEdukasi, status) {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const item = educationData.find(edu => edu.npk === npk && edu.dateEdukasi === dateEdukasi);
    
    if (!item) {
        showNotification('Data tidak ditemukan', 'error');
        return;
    }
    
    // Update attendance status
    item.attendanceStatus = status;
    
    // Save to localStorage
    saveToLocalStorage(STORAGE_KEYS.education, educationData);
    
    if (status) {
        showNotification(`Status kehadiran diupdate: ${status}`, 'success');
    }
}

// Update Session Time (New Function)
function updateSessionTime(npk, dateEdukasi, sessionTime) {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const updatedData = educationData.map(item => {
        if (item.npk === npk && item.dateEdukasi === dateEdukasi) {
            return { ...item, jamSesi: sessionTime };
        }
        return item;
    });
    
    saveToLocalStorage(STORAGE_KEYS.education, updatedData);
    showNotification(`✅ Jam sesi untuk ${npk} berhasil diupdate ke ${sessionTime}`, 'success');
}

// Update Note (New Function)
function updateNote(npk, dateEdukasi, note) {
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    const item = educationData.find(edu => edu.npk === npk && edu.dateEdukasi === dateEdukasi);
    
    if (!item) {
        showNotification('Data tidak ditemukan', 'error');
        return;
    }
    
    // Update note
    item.note = note;
    
    // Save to localStorage
    saveToLocalStorage(STORAGE_KEYS.education, educationData);
    
    if (note.trim()) {
        showNotification('Catatan berhasil disimpan', 'success');
    }
}

// Search Education Schedule (Revised)
function searchEducationSchedule() {
    const searchTerm = document.getElementById('scheduleSearchInput').value.toLowerCase();
    const educationData = getFromLocalStorage(STORAGE_KEYS.education);
    
    const filteredData = educationData.filter(item => {
        return item.npk.toLowerCase().includes(searchTerm) ||
               item.nama.toLowerCase().includes(searchTerm) ||
               item.section.toLowerCase().includes(searchTerm) ||
               (item.line && item.line.toLowerCase().includes(searchTerm)) ||
               (item.leader && item.leader.toLowerCase().includes(searchTerm)) ||
               item.program.toLowerCase().includes(searchTerm) ||
               item.proses.toLowerCase().includes(searchTerm);
    });
    
    displayFilteredScheduleData(filteredData);
}

// Format Date Helper Function
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format date and time helper function
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== MODAL FUNCTIONALITY =====
function initializeModal() {
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function openModal(type) {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    // PENTING: Reset semua class modal sebelum menambahkan yang baru
    modalContent.classList.remove('skill-matrix-modal', 'medium-modal', 'small-modal');
    
    // Clear previous form
    modalBody.innerHTML = '';
    
    switch(type) {
        case 'add':
            modalTitle.textContent = 'Tambah Karyawan Baru';
            modalBody.innerHTML = getEmployeeForm();
            modalContent.classList.add('medium-modal'); // Tambahkan class ukuran
            window.currentModule = 'employee';
            // NPK manual input - no auto-generate
            break;
        case 'edit':
            modalTitle.textContent = 'Edit Data Karyawan';
            modalBody.innerHTML = getEmployeeForm();
            modalContent.classList.add('medium-modal'); // Tambahkan class ukuran
            window.currentModule = 'employee';
            break;
        case 'end-contract':
            modalTitle.textContent = window.editingRow ? 'Edit End Contract' : 'Tambah Data End Contract';
            modalBody.innerHTML = getEndContractForm();
            modalContent.classList.add('medium-modal'); // Tambahkan class ukuran
            window.currentModule = 'endContract';
            break;
        case 'recruitment':
            window.currentModule = 'recruitment';
            // Don't set title here for recruitment - it will be set in editRecruitment function
            if (!window.editingRow) {
                modalTitle.textContent = 'Tambah Kandidat Recruitment';
            }
            modalBody.innerHTML = getRecruitmentForm();
            modalContent.classList.add('medium-modal'); // Tambahkan class ukuran
            break;
        case 'education':
            modalTitle.textContent = window.editingRow ? 'Edit Program Edukasi' : 'Tambah Program Edukasi';
            modalBody.innerHTML = getEducationForm();
            modalContent.classList.add('medium-modal'); // Tambahkan class ukuran
            window.currentModule = 'education';
            break;
        case 'overtime':
            modalTitle.textContent = window.editingRow ? 'Edit Data Overtime' : 'Input Data Overtime';
            modalBody.innerHTML = getOvertimeForm();
            modalContent.classList.add('medium-modal');
            
            // Initialize filters after modal opens
            setTimeout(() => {
                initializeOvertimeFilters();
            }, 100);
            break;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Reset semua class modal saat menutup
    modalContent.classList.remove('skill-matrix-modal', 'medium-modal', 'small-modal');
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearForm();
    
    // Reset modal title to default
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Modal';
    }
}

function clearForm() {
    window.editingRow = null;
    window.currentModule = null;
}

// ===== FORM TEMPLATES =====
function getEmployeeForm() {
    return `
        <form id="dataForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="npk">NPK</label>
                    <input type="text" id="npk" name="npk" required placeholder="001, 002, 003, dst.">
                    <small>Masukkan NPK angka saja (001, 002, 003)</small>
                </div>
                <div class="form-group">
                    <label for="nama">Nama Lengkap</label>
                    <input type="text" id="nama" name="nama" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender" required>
                        <option value="">Pilih Gender</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="section">Section</label>
                    <select id="section" name="section" required>
                        <option value="">Pilih Section</option>
                        <option value="Comp Assy">Comp Assy</option>
                        <option value="Comp WClutch">Comp WClutch</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="line">Line</label>
                    <input type="text" id="line" name="line" required placeholder="Contoh: Line A, Line B">
                </div>
                <div class="form-group">
                    <label for="leader">Leader</label>
                    <input type="text" id="leader" name="leader" required placeholder="Nama Leader/Supervisor">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="function">Function</label>
                    <select id="function" name="function" required>
                        <option value="">Pilih Function</option>
                        <option value="GM">GM</option>
                        <option value="AGM">AGM</option>
                        <option value="DM">DM</option>
                        <option value="SM">SM</option>
                        <option value="ASM">ASM</option>
                        <option value="SPV">SPV</option>
                        <option value="Senior Technician">Senior Technician</option>
                        <option value="Foreman">Foreman</option>
                        <option value="Leader">Leader</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Operator">Operator</option>
                        <option value="Mizusumashi">Mizusumashi</option>
                        <option value="Repairman">Repairman</option>
                        <option value="Ingot Charging">Ingot Charging</option>
                        <option value="Dandoriman">Dandoriman</option>
                        <option value="Einstaller">Einstaller</option>
                        <option value="Quality Supporting">Quality Supporting</option>
                        <option value="Measuring Center">Measuring Center</option>
                        <option value="Admin">Admin</option>
                        <option value="MP Development">MP Development</option>
                        <option value="Other (Support PE)">Other (Support PE)</option>
                        <option value="Commite">Commite</option>
                        <option value="Buffer MP">Buffer MP</option>
                        <option value="Sickness / Pregnance">Sickness / Pregnance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="dateIn">Date In</label>
                    <input type="date" id="dateIn" name="dateIn" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="employeeType">Tipe Karyawan</label>
                    <select id="employeeType" name="employeeType" required onchange="toggleContractDuration()">
                        <option value="">Pilih Tipe</option>
                        <option value="Tetap">Karyawan Tetap</option>
                        <option value="Kontrak">Karyawan Kontrak</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status" required>
                        <option value="">Pilih Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Non-Aktif">Non-Aktif</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" id="contractDurationGroup" style="display: none;">
                    <label for="contractDuration">Durasi Kontrak (Bulan)</label>
                    <select id="contractDuration" name="contractDuration">
                        <option value="">Pilih Durasi</option>
                        <option value="12">12 Bulan</option>
                        <option value="24">24 Bulan</option>
                        <option value="36">36 Bulan</option>
                        <option value="48">48 Bulan</option>
                        <option value="60">60 Bulan</option>
                    </select>
                </div>
            </div>
        </form>
    `;
}

// Global function untuk toggle contract duration
function toggleContractDuration() {
    const employeeType = document.getElementById('employeeType').value;
    const contractGroup = document.getElementById('contractDurationGroup');
    const contractDuration = document.getElementById('contractDuration');
    
    if (employeeType === 'Kontrak') {
        contractGroup.style.display = 'block';
        contractDuration.required = true;
    } else {
        contractGroup.style.display = 'none';
        contractDuration.required = false;
        contractDuration.value = '';
    }
}

function getEndContractForm() {
    // Get contract employees for dropdown
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const contractEmployees = employees.filter(emp => emp.employeeType === 'Kontrak' && emp.status === 'Aktif');
    
    // Sort contract employees by NPK from highest to lowest (descending)
    contractEmployees.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        return npkB - npkA; // Descending order (tertinggi ke terendah)
    });
    
    let employeeOptions = '<option value="">Pilih Karyawan Kontrak</option>';
    contractEmployees.forEach(emp => {
        employeeOptions += `<option value="${emp.npk}" data-employee='${JSON.stringify(emp)}'>${emp.npk} - ${emp.nama}</option>`;
    });
    
    return `
        <form id="dataForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-employeeSelect">Pilih Karyawan Kontrak</label>
                    <select id="modal-employeeSelect" onchange="autoFillEmployee()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                        ${employeeOptions}
                    </select>
                    <small>Pilih dari karyawan kontrak yang sudah terdaftar</small>
                </div>
                <div class="form-group">
                    <label for="modal-npk">NPK</label>
                    <input type="text" id="modal-npk" name="npk" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-nama">Nama Lengkap</label>
                    <input type="text" id="modal-nama" name="nama" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-gender">Gender</label>
                    <input type="text" id="modal-gender" name="gender" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-section">Section</label>
                    <input type="text" id="modal-section" name="section" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-line">Line</label>
                    <input type="text" id="modal-line" name="line" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-leader">Leader</label>
                    <input type="text" id="modal-leader" name="leader" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-dateIn">Date In</label>
                    <input type="date" id="modal-dateIn" name="dateIn" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-contractDuration">Durasi Kontrak (Bulan)</label>
                    <input type="text" id="modal-contractDuration" name="contractDuration" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-dateOut">Date Out (Otomatis)</label>
                    <input type="date" id="modal-dateOut" name="dateOut" readonly style="background-color: #f8f9fa;">
                    <small>Dihitung otomatis dari Date In + Durasi Kontrak</small>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-reason">Alasan</label>
                    <select id="modal-reason" name="reason" required>
                        <option value="">Pilih Alasan</option>
                        <option value="Kontrak Habis">Kontrak Habis</option>
                        <option value="Resign">Resign</option>
                        <option value="Terminasi">Terminasi</option>
                        <option value="Pensiun">Pensiun</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal-status">Status</label>
                    <select id="modal-status" name="status" required>
                        <option value="">Pilih Status</option>
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                </div>
            </div>
        </form>
    `;
}

// Auto-fill employee data when selected from dropdown
function autoFillEmployee() {
    const select = document.getElementById('modal-employeeSelect');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const employee = JSON.parse(selectedOption.dataset.employee);
        
        // Fill all fields
        document.getElementById('modal-npk').value = employee.npk;
        document.getElementById('modal-nama').value = employee.nama;
        document.getElementById('modal-gender').value = employee.gender;
        document.getElementById('modal-section').value = employee.section;
        document.getElementById('modal-line').value = employee.line;
        document.getElementById('modal-leader').value = employee.leader;
        document.getElementById('modal-dateIn').value = employee.dateIn;
        document.getElementById('modal-contractDuration').value = employee.contractDuration;
        
        // Calculate and set date out
        if (employee.contractEndDate) {
            document.getElementById('modal-dateOut').value = employee.contractEndDate;
        } else {
            // Calculate if not already calculated
            const startDate = new Date(employee.dateIn);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + parseInt(employee.contractDuration));
            document.getElementById('modal-dateOut').value = endDate.toISOString().split('T')[0];
        }
        
        showNotification('Data karyawan berhasil dimuat!', 'success');
    } else {
        // Clear all fields if no selection
        clearEndContractForm();
    }
}

function clearEndContractForm() {
    document.getElementById('modal-npk').value = '';
    document.getElementById('modal-nama').value = '';
    document.getElementById('modal-gender').value = '';
    document.getElementById('modal-section').value = '';
    document.getElementById('modal-line').value = '';
    document.getElementById('modal-leader').value = '';
    document.getElementById('modal-dateIn').value = '';
    document.getElementById('modal-contractDuration').value = '';
    document.getElementById('modal-dateOut').value = '';
}

function getRecruitmentForm() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    // Sort employees by NPK from highest to lowest (descending)
    employees.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        return npkB - npkA; // Descending order (tertinggi ke terendah)
    });
    
    let employeeOptions = '<option value="">Pilih dari Database MP</option>';
    employees.forEach(emp => {
        employeeOptions += `<option value="${emp.npk}" data-employee='${JSON.stringify(emp)}'>${emp.npk} - ${emp.nama} (${emp.section})</option>`;
    });
    
    return `
        <form id="dataForm">
            <h4 style="color: #e67e22; margin-bottom: 15px;">📋 Data dari MP End (Read-Only)</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-npk-end">NPK (MP End)</label>
                    <input type="text" id="modal-npk-end" name="npkEnd" readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-nama-end">Nama (MP End)</label>
                    <input type="text" id="modal-nama-end" name="namaEnd" readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-dateOut">Date Out</label>
                    <input type="date" id="modal-dateOut" name="dateOut" readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            
            <h4 style="color: #3498db; margin: 20px 0 15px 0;">📊 Data dari Database MP (Edit Manual)</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-employeeSelect">Auto-fill dari Database MP</label>
                    <select id="modal-employeeSelect" onchange="autoFillFromEmployee()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                        ${employeeOptions}
                    </select>
                    <small>Opsional: Pilih karyawan untuk auto-fill, atau isi manual</small>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-npk-db">NPK (Database MP)</label>
                    <input type="text" id="modal-npk-db" name="npkDb" placeholder="Masukkan NPK">
                </div>
                <div class="form-group">
                    <label for="modal-nama-db">Nama (Database MP)</label>
                    <input type="text" id="modal-nama-db" name="namaDb" placeholder="Masukkan nama">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-gender-db">Gender</label>
                    <select id="modal-gender-db" name="genderDb">
                        <option value="">Pilih Gender</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal-section-db">Section</label>
                    <input type="text" id="modal-section-db" name="sectionDb" placeholder="Masukkan section">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-line-db">Line</label>
                    <input type="text" id="modal-line-db" name="lineDb" placeholder="Masukkan line">
                </div>
                <div class="form-group">
                    <label for="modal-leader-db">Leader</label>
                    <input type="text" id="modal-leader-db" name="leaderDb" placeholder="Masukkan leader">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-dateIn-db">Date In</label>
                    <input type="date" id="modal-dateIn-db" name="dateInDb">
                </div>
                <div class="form-group">
                    <label for="modal-rekomendasi">Rekomendasi</label>
                    <input type="text" id="modal-rekomendasi" name="rekomendasi" placeholder="Masukkan rekomendasi">
                </div>
            </div>
        </form>
    `;
}

// Auto-fill functions
function autoFillFromEmployee() {
    const select = document.getElementById('modal-employeeSelect');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const employee = JSON.parse(selectedOption.dataset.employee);
        
        // Auto-fill semua field Database MP kecuali Rekomendasi
        document.getElementById('modal-npk-db').value = employee.npk || '';
        document.getElementById('modal-nama-db').value = employee.nama || '';
        document.getElementById('modal-gender-db').value = employee.gender || '';
        document.getElementById('modal-section-db').value = employee.section || '';
        document.getElementById('modal-line-db').value = employee.line || '';
        document.getElementById('modal-leader-db').value = employee.leader || '';
        document.getElementById('modal-dateIn-db').value = employee.dateIn || '';
        // Rekomendasi tetap kosong untuk input manual
    } else {
        // Clear semua field Database MP
        document.getElementById('modal-npk-db').value = '';
        document.getElementById('modal-nama-db').value = '';
        document.getElementById('modal-gender-db').value = '';
        document.getElementById('modal-section-db').value = '';
        document.getElementById('modal-line-db').value = '';
        document.getElementById('modal-leader-db').value = '';
        document.getElementById('modal-dateIn-db').value = '';
    }
}

function autoFillFromEndContract() {
    const select = document.getElementById('modal-endContractSelect');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const endContract = JSON.parse(selectedOption.dataset.endcontract);
        
        // Auto-fill semua field MP End
        document.getElementById('modal-npk-end').value = endContract.npk || '';
        document.getElementById('modal-nama-end').value = endContract.nama || '';
        document.getElementById('modal-dateOut').value = endContract.dateOut || '';
    } else {
        // Clear semua field MP End
        document.getElementById('modal-npk-end').value = '';
        document.getElementById('modal-nama-end').value = '';
        document.getElementById('modal-dateOut').value = '';
    }
}

function getEducationForm() {
    // Get all active employees for filters
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const activeEmployees = employees.filter(emp => emp.status === 'Aktif');
    
    // Get unique sections
    const sections = [...new Set(activeEmployees.map(emp => emp.section))].sort();
    
    let sectionOptions = '<option value="">Pilih Section</option>';
    sections.forEach(section => {
        sectionOptions += `<option value="${section}">${section}</option>`;
    });

    return `
        <form id="dataForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-sectionFilter">🏭 Filter Section</label>
                    <select id="modal-sectionFilter" onchange="updateEducationLineFilter()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                        ${sectionOptions}
                    </select>
                    <small>Pilih section terlebih dahulu</small>
                </div>
                <div class="form-group">
                    <label for="modal-lineFilter">🔧 Filter Line</label>
                    <select id="modal-lineFilter" onchange="updateEducationEmployeeFilter()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" disabled>
                        <option value="">Pilih Line</option>
                    </select>
                    <small>Pilih line setelah memilih section</small>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-employeeSelect">👤 Pilih Karyawan</label>
                    <select id="modal-employeeSelect" onchange="autoFillEmployeeEducation()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" disabled>
                        <option value="">Pilih Karyawan</option>
                    </select>
                    <small>Pilih karyawan setelah memilih section dan line</small>
                </div>
                <div class="form-group">
                    <label for="modal-npk">NPK</label>
                    <input type="text" id="modal-npk" name="npk" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-nama">Nama Lengkap</label>
                    <input type="text" id="modal-nama" name="nama" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-gender">Gender</label>
                    <input type="text" id="modal-gender" name="gender" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-section">Section</label>
                    <input type="text" id="modal-section" name="section" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-line">Line</label>
                    <input type="text" id="modal-line" name="line" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-leader">Leader</label>
                    <input type="text" id="modal-leader" name="leader" required readonly style="background-color: #f8f9fa;">
                </div>
                <div class="form-group">
                    <label for="modal-namaPos">🎯 Nama Pos</label>
                    <select id="modal-namaPos" name="namaPos" required style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" disabled>
                        <option value="">Pilih Nama Pos</option>
                    </select>
                    <small>Posisi akan muncul sesuai section yang dipilih</small>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-program">Program Edukasi</label>
                    <select id="modal-program" name="program" required style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                        <option value="">Pilih Program Edukasi</option>
                        <option value="New MP">New MP</option>
                        <option value="Refresh MP">Refresh MP</option>
                        <option value="Skill Up MP">Skill Up MP</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal-dateEdukasi">Date Edukasi</label>
                    <input type="date" id="modal-dateEdukasi" name="dateEdukasi" required onchange="calculateDatePlanning()">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-datePlanning">Date Planning (Otomatis)</label>
                    <input type="date" id="modal-datePlanning" name="datePlanning" readonly style="background-color: #f8f9fa;">
                    <small>Dihitung otomatis: Date Edukasi + 6 bulan</small>
                </div>
                <div class="form-group">
                    <label for="modal-pdfFile">PDF Raport</label>
                    <input type="file" id="modal-pdfFile" name="pdfFile" accept=".pdf" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                    <small>Upload file PDF raport edukasi (opsional)</small>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="modal-status">Status</label>
                    <select id="modal-status" name="status" required>
                        <option value="">Pilih Status</option>
                        <option value="Planned">Planned</option>
                        <option value="Berlangsung">Berlangsung</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                </div>
                <div class="form-group" id="currentPdfDisplay" style="display: none;">
                    <label>PDF Raport Saat Ini</label>
                    <div id="currentPdfInfo" style="padding: 10px; background: #f8f9fa; border-radius: 5px; border: 1px solid #e0e6ed;">
                        <span id="currentPdfName">Tidak ada file</span>
                        <button type="button" class="btn btn-sm" id="viewPdfBtn" style="margin-left: 10px; display: none;" onclick="viewCurrentPdf()">
                            <span>👁️</span> Lihat PDF
                        </button>
                    </div>
                </div>
            </div>
        </form>
    `;
}

// ===== OVERTIME FORM =====
function getOvertimeForm() {
    // Get all active employees for filters
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const activeEmployees = employees.filter(emp => emp.status === 'Aktif');
    
    // Get unique sections
    const sections = [...new Set(activeEmployees.map(emp => emp.section))].sort();
    
    let sectionOptions = '<option value="">Pilih Section</option>';
    sections.forEach(section => {
        sectionOptions += `<option value="${section}">${section}</option>`;
    });

    return `
        <form id="dataForm">
            <div class="form-section">
                <h4>📋 Filter & Auto-fill</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-sectionFilter">🏭 Filter Section</label>
                        <select id="modal-sectionFilter" onchange="updateOvertimeLineFilter()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                            ${sectionOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="modal-lineFilter">🔧 Filter Line</label>
                        <select id="modal-lineFilter" onchange="updateOvertimeEmployeeFilter()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" disabled>
                            <option value="">Pilih Line</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="modal-employeeSelect">👤 Pilih Karyawan</label>
                    <select id="modal-employeeSelect" onchange="autoFillEmployeeOvertime()" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" disabled>
                        <option value="">Pilih Karyawan</option>
                    </select>
                </div>
            </div>

            <div class="form-section">
                <h4>👤 Data Karyawan</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-npk">NPK</label>
                        <input type="text" id="modal-npk" name="npk" required readonly style="background-color: #f8f9fa;">
                    </div>
                    <div class="form-group">
                        <label for="modal-nama">Nama Lengkap</label>
                        <input type="text" id="modal-nama" name="nama" required readonly style="background-color: #f8f9fa;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-section">Section</label>
                        <input type="text" id="modal-section" name="section" required readonly style="background-color: #f8f9fa;">
                    </div>
                    <div class="form-group">
                        <label for="modal-line">Line</label>
                        <input type="text" id="modal-line" name="line" required readonly style="background-color: #f8f9fa;">
                    </div>
                </div>
                <div class="form-group">
                    <label for="modal-leader">Leader</label>
                    <input type="text" id="modal-leader" name="leader" required readonly style="background-color: #f8f9fa;">
                </div>
            </div>

            <div class="form-section">
                <h4>⏰ Data Overtime</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-tanggal">📅 Tanggal</label>
                        <input type="date" id="modal-tanggal" name="tanggal" required onchange="calculateOvertimeHours()">
                    </div>
                    <div class="form-group">
                        <label for="modal-shift">🔄 Shift</label>
                        <select id="modal-shift" name="shift" required>
                            <option value="">Pilih Shift</option>
                            <option value="Shift 1">Shift 1 (07:00-15:00)</option>
                            <option value="Shift 2">Shift 2 (15:00-23:00)</option>
                            <option value="Shift 3">Shift 3 (23:00-07:00)</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-jamMulai">🕐 Jam Mulai Overtime</label>
                        <input type="time" id="modal-jamMulai" name="jamMulai" required onchange="calculateOvertimeHours()">
                    </div>
                    <div class="form-group">
                        <label for="modal-jamSelesai">🕐 Jam Selesai Overtime</label>
                        <input type="time" id="modal-jamSelesai" name="jamSelesai" required onchange="calculateOvertimeHours()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-totalJam">⏱️ Total Jam Overtime</label>
                        <input type="number" id="modal-totalJam" name="totalJam" step="0.5" min="0" readonly style="background-color: #f8f9fa;">
                    </div>
                    <div class="form-group">
                        <label for="modal-jenisOvertime">📝 Jenis Overtime</label>
                        <select id="modal-jenisOvertime" name="jenisOvertime" required>
                            <option value="">Pilih Jenis</option>
                            <option value="Normal">Normal</option>
                            <option value="Weekend">Weekend</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="modal-keterangan">📄 Keterangan/Alasan</label>
                    <textarea id="modal-keterangan" name="keterangan" rows="3" style="width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;" placeholder="Masukkan alasan atau keterangan overtime"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-approvedBy">✅ Disetujui Oleh</label>
                        <input type="text" id="modal-approvedBy" name="approvedBy" placeholder="Nama yang menyetujui">
                    </div>
                    <div class="form-group">
                        <label for="modal-status">📊 Status</label>
                        <select id="modal-status" name="status" required>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>
        </form>
    `;
}

// Auto-fill employee data for education
function autoFillEmployeeEducation() {
    const select = document.getElementById('modal-employeeSelect');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const employee = JSON.parse(selectedOption.dataset.employee);
        
        document.getElementById('modal-npk').value = employee.npk;
        document.getElementById('modal-nama').value = employee.nama;
        document.getElementById('modal-gender').value = employee.gender;
        document.getElementById('modal-section').value = employee.section;
        document.getElementById('modal-line').value = employee.line;
        document.getElementById('modal-leader').value = employee.leader;
        
        // Update Nama Pos dropdown based on section
        updateEducationNamaPosFilter();
    } else {
        // Clear form fields if no employee selected
        clearEducationFormFields();
    }
}

function clearEducationForm() {
    document.getElementById('modal-npk').value = '';
    document.getElementById('modal-nama').value = '';
    document.getElementById('modal-gender').value = '';
    document.getElementById('modal-section').value = '';
    document.getElementById('modal-line').value = '';
    document.getElementById('modal-leader').value = '';
    document.getElementById('modal-namaPos').value = '';
    document.getElementById('modal-program').value = '';
    document.getElementById('modal-dateEdukasi').value = '';
    document.getElementById('modal-datePlanning').value = '';
    document.getElementById('modal-status').value = '';
    
    // Reset file input
    const fileInput = document.getElementById('modal-pdfFile');
    if (fileInput) fileInput.value = '';
    
    // Hide current PDF display
    document.getElementById('currentPdfDisplay').style.display = 'none';
}

// Calculate date planning (6 months after education date)
function calculateDatePlanning() {
    const dateEdukasi = document.getElementById('modal-dateEdukasi').value;
    const datePlanningField = document.getElementById('modal-datePlanning');
    
    if (dateEdukasi) {
        const eduDate = new Date(dateEdukasi);
        const planningDate = new Date(eduDate);
        planningDate.setMonth(planningDate.getMonth() + 6);
        
        // Format to YYYY-MM-DD
        const formattedDate = planningDate.toISOString().split('T')[0];
        datePlanningField.value = formattedDate;
    } else {
        datePlanningField.value = '';
    }
}

// Handle PDF file upload and convert to base64
async function handlePdfUpload(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        // Validate file type
        if (file.type !== 'application/pdf') {
            showNotification('File harus berformat PDF!', 'error');
            reject('Invalid file type');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File PDF maksimal 5MB!', 'error');
            reject('File too large');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result, // base64 string
                uploadDate: new Date().toISOString()
            });
        };
        reader.onerror = function() {
            reject('Error reading file');
        };
        reader.readAsDataURL(file);
    });
}

// View current PDF file
function viewCurrentPdf() {
    const eduId = window.editingRow ? parseInt(window.editingRow.dataset.id) : null;
    if (!eduId) return;
    
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const edu = education.find(e => e.id === eduId);
    
    if (edu && edu.pdfFile && edu.pdfFile.data) {
        // Create a blob from base64 data
        const byteCharacters = atob(edu.pdfFile.data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create URL and open in new tab
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up URL after some time
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
        showNotification('File PDF tidak ditemukan!', 'error');
    }
}

// ===== SAVE FUNCTION (UNIVERSAL) =====
async function saveData() {
    const form = document.getElementById('dataForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        showNotification('Mohon lengkapi semua field yang wajib diisi!', 'error');
        return;
    }
    
    try {
        switch(window.currentModule) {
            case 'employee':
                saveEmployee(formData);
                break;
            case 'endContract':
                saveEndContract(formData);
                break;
            case 'recruitment':
                saveRecruitment(formData);
                break;
            case 'education':
                await saveEducation(formData);
                break;
            case 'skillMatrix':
                saveSkillMatrix(formData);
                break;
            case 'overtime':
                saveOvertime(formData);
                break;
        }
        
        closeModal();
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saat menyimpan data!', 'error');
    }
}

// ===== EMPLOYEE SPECIFIC FUNCTIONS =====
function saveEmployee(formData) {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    const employeeData = {
        npk: formData.get('npk'),
        nama: formData.get('nama'),
        gender: formData.get('gender'),
        section: formData.get('section'),
        line: formData.get('line'),
        leader: formData.get('leader'),
        dateIn: formData.get('dateIn'),
        employeeType: formData.get('employeeType'),
        status: formData.get('status'),
        function: formData.get('function')
    };

    // Add contract duration for contract employees
    if (employeeData.employeeType === 'Kontrak') {
        employeeData.contractDuration = formData.get('contractDuration');
        
        // Calculate contract end date
        if (employeeData.dateIn && employeeData.contractDuration) {
            const startDate = new Date(employeeData.dateIn);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + parseInt(employeeData.contractDuration));
            employeeData.contractEndDate = endDate.toISOString().split('T')[0];
        }
    }
    
    // Validate data
    const validationErrors = validateEmployeeData(employeeData);
    if (validationErrors.length > 0) {
        showNotification(validationErrors[0], 'error');
        return;
    }
    
    if (window.editingRow) {
        // Update existing employee
        const employeeId = parseInt(window.editingRow.dataset.id);
        const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
        
        if (employeeIndex !== -1) {
            employees[employeeIndex] = {
                ...employees[employeeIndex],
                ...employeeData,
                updatedAt: new Date().toISOString()
            };
            
            saveToLocalStorage(STORAGE_KEYS.employees, employees);
            loadEmployeeData();
            showNotification('Data karyawan berhasil diupdate!', 'success');
        }
    } else {
        // Add new employee
        const newEmployee = {
            id: generateId(employees),
            ...employeeData,
            createdAt: new Date().toISOString()
        };
        
        employees.push(newEmployee);
        saveToLocalStorage(STORAGE_KEYS.employees, employees);
        loadEmployeeData();
        showNotification('Data karyawan berhasil ditambahkan!', 'success');
    }
    
    updateDashboardStats();
    updateCharts();
}

function editEmployee(button) {
    const row = button.closest('tr');
    const employeeId = parseInt(row.dataset.id);
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
        window.editingRow = row;
        window.currentModule = 'employee';
        openModal('edit');
        
        // Fill form after modal opens
        setTimeout(() => {
            document.getElementById('npk').value = employee.npk;
            document.getElementById('nama').value = employee.nama;
            document.getElementById('gender').value = employee.gender;
            document.getElementById('section').value = employee.section;
            document.getElementById('line').value = employee.line;
            document.getElementById('leader').value = employee.leader;
            document.getElementById('function').value = employee.function || '';
            document.getElementById('dateIn').value = employee.dateIn;
            document.getElementById('employeeType').value = employee.employeeType || '';
            document.getElementById('status').value = employee.status;
            
            // Handle contract duration for contract employees
            if (employee.employeeType === 'Kontrak') {
                toggleContractDuration(); // Call to show duration field
                if (employee.contractDuration) {
                    document.getElementById('contractDuration').value = employee.contractDuration;
                }
            }
        }, 100);
    }
}

function deleteEmployee(button) {
    const row = button.closest('tr');
    const employeeId = parseInt(row.dataset.id);
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee && confirm(`Yakin ingin menghapus data karyawan "${employee.nama}"?`)) {
        const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
        saveToLocalStorage(STORAGE_KEYS.employees, updatedEmployees);
        
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            loadEmployeeData();
            updateDashboardStats();
            updateCharts();
            showNotification('Data karyawan berhasil dihapus!', 'success');
        }, 300);
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'Aktif':
        case 'Selesai':
        case 'Diterima':
            return 'status-active';
        case 'Non-Aktif':
        case 'Ditolak':
            return 'status-inactive';
        case 'Proses':
        case 'Interview':
        case 'Planned':
        case 'Berlangsung':
            return 'status-pending';
        default:
            return 'status-pending';
    }
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            if (searchTerm === '') {
                // Jika pencarian kosong, tampilkan semua data
                filteredEmployees = [...allEmployees];
            } else {
                // Filter data berdasarkan pencarian
                filteredEmployees = allEmployees.filter(employee => {
                    return employee.npk.toLowerCase().includes(searchTerm) ||
                           employee.nama.toLowerCase().includes(searchTerm) ||
                           employee.gender.toLowerCase().includes(searchTerm) ||
                           employee.section.toLowerCase().includes(searchTerm) ||
                           (employee.line && employee.line.toLowerCase().includes(searchTerm)) ||
                           (employee.leader && employee.leader.toLowerCase().includes(searchTerm)) ||
                           (employee.function && employee.function.toLowerCase().includes(searchTerm)) ||
                           employee.dateIn.toLowerCase().includes(searchTerm) ||
                           employee.status.toLowerCase().includes(searchTerm) ||
                           (employee.employeeType && employee.employeeType.toLowerCase().includes(searchTerm));
                });
            }
            
            currentPage = 1; // Reset ke halaman pertama setelah pencarian
            displayEmployeeData();
            createPagination();
        });
    }
}

// Tambahkan fungsi ini setelah fungsi initializeSearch() yang sudah ada
function initializeSkillMatrixFilters() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupSkillMatrixEventListeners();
        });
    } else {
        setupSkillMatrixEventListeners();
    }
}

function setupSkillMatrixEventListeners() {
    try {
        const sectionFilter = document.getElementById('skillMatrixSectionFilter');
        const lineFilter = document.getElementById('skillMatrixLineFilter');
        const searchInput = document.getElementById('skillMatrixSearch');
        
        if (sectionFilter) {
            sectionFilter.addEventListener('change', updateSkillMatrixSectionFilter);
        } else {
            console.warn('skillMatrixSectionFilter element not found');
        }
        
        if (lineFilter) {
            lineFilter.addEventListener('change', filterSkillMatrix);
        } else {
            console.warn('skillMatrixLineFilter element not found');
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', filterSkillMatrix);
        } else {
            console.warn('skillMatrixSearch element not found');
        }
    } catch (error) {
        console.error('Error setting up skill matrix event listeners:', error);
    }
}

// Fungsi untuk update line filter berdasarkan section yang dipilih
function updateSkillMatrixLineFilterOptions() {
    const sectionFilter = document.getElementById('skillMatrixSectionFilter');
    const lineFilter = document.getElementById('skillMatrixLineFilter');
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    
    if (!sectionFilter || !lineFilter) return;
    
    const selectedSection = sectionFilter.value;
    const employees = getFromLocalStorage(STORAGE_KEYS.employees) || [];
    
    // Filter employees based on mode and section
    let relevantEmployees = employees;
    
    // Filter by mode-appropriate sections
    if (currentMode === 'comp-assy') {
        relevantEmployees = relevantEmployees.filter(emp => emp.section === 'Comp Assy');
    } else if (currentMode === 'comp-wclutch') {
        relevantEmployees = relevantEmployees.filter(emp => emp.section === 'Comp WClutch');
    }
    
    // Further filter by selected section
    if (selectedSection && selectedSection !== 'all') {
        relevantEmployees = relevantEmployees.filter(emp => emp.section === selectedSection);
    }
    
    // Get unique lines
    const lines = [...new Set(relevantEmployees.map(emp => emp.line))]
        .filter(line => line)
        .sort();
    
    // Update line filter
    const currentLineValue = lineFilter.value;
    lineFilter.innerHTML = '<option value="all">Semua Line</option>';
    
    lines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        lineFilter.appendChild(option);
    });
    
    // Restore previous selection if still valid
    if (currentLineValue && lines.includes(currentLineValue)) {
        lineFilter.value = currentLineValue;
    }
}

function updateSearchResults(count) {
    const tableBody = document.getElementById('employeeTableBody');
    const existingNoResults = document.getElementById('no-results-row');
    
    if (count === 0) {
        if (!existingNoResults) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.id = 'no-results-row';
            noResultsRow.innerHTML = `
                <td colspan="10" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i style="font-size: 48px; margin-bottom: 10px; display: block;">🔍</i>
                    Data tidak ditemukan
                </td>
            `;
            tableBody.appendChild(noResultsRow);
        }
    } else {
        if (existingNoResults) {
            existingNoResults.remove();
        }
    }
}

// ===== AUTO-GENERATE NPK (REMOVED) =====
function initializeAutoNPK() {
    // NPK manual input - no auto-generation
}

// Helper function for NPK validation (kept for reference)
function validateNPKFormat(npk) {
    return npk && npk.match(/^\d{3,}$/); // Format: 001, 002, 003, etc.
}

// ===== DATA VALIDATION =====
function validateEmployeeData(data) {
    const errors = [];
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    if (!validateNPKFormat(data.npk)) {
        errors.push('Format NPK harus angka 3 digit: 001, 002, 003, dst.');
    }
    
    if (data.nama.length < 3) {
        errors.push('Nama minimal 3 karakter.');
    }
    
    if (!data.gender) {
        errors.push('Gender wajib dipilih.');
    }
    
    if (!data.section) {
        errors.push('Section wajib dipilih.');
    }
    
    if (!data.employeeType) {
        errors.push('Tipe karyawan wajib dipilih.');
    }
    
    // Validate contract duration for contract employees
    if (data.employeeType === 'Kontrak' && !data.contractDuration) {
        errors.push('Durasi kontrak wajib diisi untuk karyawan kontrak.');
    }
    
    if (!data.dateIn) {
        errors.push('Tanggal masuk wajib diisi.');
    }
    
    // Check for duplicate NPK (for both new and edit)
    const existingNPKs = employees
        .filter(emp => window.editingRow ? emp.id !== parseInt(window.editingRow.dataset.id) : true)
        .map(emp => emp.npk);
    
    if (existingNPKs.includes(data.npk)) {
        errors.push('NPK sudah ada dalam database.');
    }
    
    return errors;
}

// ===== DATA BACKUP & RESTORE =====
function exportAllData() {
    const allData = {
        employees: getFromLocalStorage(STORAGE_KEYS.employees),
        endContracts: getFromLocalStorage(STORAGE_KEYS.endContracts),
        recruitment: getFromLocalStorage(STORAGE_KEYS.recruitment),
        education: getFromLocalStorage(STORAGE_KEYS.education),
        skillMatrix: getFromLocalStorage(STORAGE_KEYS.skillMatrix),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataBlob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `mp_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadLink.click();
    
    URL.revokeObjectURL(url);
    showNotification('Backup data berhasil didownload!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm('Import data akan mengganti semua data yang ada. Lanjutkan?')) {
                // Backup current data first
                const backupData = {
                    employees: getFromLocalStorage(STORAGE_KEYS.employees),
                    endContracts: getFromLocalStorage(STORAGE_KEYS.endContracts),
                    recruitment: getFromLocalStorage(STORAGE_KEYS.recruitment),
                    education: getFromLocalStorage(STORAGE_KEYS.education),
                    backupDate: new Date().toISOString()
                };
                
                localStorage.setItem('mp_backup_before_import', JSON.stringify(backupData));
                
                // Import new data
                saveToLocalStorage(STORAGE_KEYS.employees, importedData.employees || []);
                saveToLocalStorage(STORAGE_KEYS.endContracts, importedData.endContracts || []);
                saveToLocalStorage(STORAGE_KEYS.recruitment, importedData.recruitment || []);
                saveToLocalStorage(STORAGE_KEYS.education, importedData.education || []);
                saveToLocalStorage(STORAGE_KEYS.skillMatrix, importedData.skillMatrix || []);
                // Reload all data
                loadAllData();
                updateDashboardStats();
                updateCharts();
                updateStorageInfo();
                
                showNotification('Data berhasil diimport!', 'success');
            }
        } catch (error) {
            showNotification('Error: File backup tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearAllData() {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA data! Lanjutkan?')) {
        if (confirm('Yakin? Data yang dihapus tidak bisa dikembalikan!')) {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reinitialize with empty data
            initializeLocalStorage();
            loadAllData();
            updateDashboardStats();
            updateCharts();
            updateStorageInfo();
            
            showNotification('Semua data berhasil dihapus dan direset!', 'success');
        }
    }
}

// ===== EXPORT TO CSV =====
function exportToCSV() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    
    if (employees.length === 0) {
        showNotification('Tidak ada data karyawan untuk diexport!', 'warning');
        return;
    }
    
    const csvHeader = ['NPK', 'Nama', 'Gender', 'Section', 'Line', 'Leader', 'Function', 'Date In', 'Status'];
    const csvRows = [csvHeader.join(',')];
    
    employees.forEach(emp => {
        const row = [
            emp.npk,
            `"${emp.nama}"`,
            emp.gender,
            emp.section,
            emp.line,
            `"${emp.leader}"`,
            `"${emp.function || 'N/A'}"`,
            emp.dateIn,
            emp.status
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = csvUrl;
    downloadLink.download = `mp_employees_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.click();
    
    URL.revokeObjectURL(csvUrl);
    showNotification('Data karyawan berhasil diexport ke CSV!', 'success');
}

// ===== STORAGE INFO =====
function getStorageInfo() {
    try {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const endContracts = getFromLocalStorage(STORAGE_KEYS.endContracts);
        const recruitment = getFromLocalStorage(STORAGE_KEYS.recruitment);
        const education = getFromLocalStorage(STORAGE_KEYS.education);
        const skillMatrix = getFromLocalStorage(STORAGE_KEYS.skillMatrix);
        
        const storageInfo = {
            employees: employees.length,
            endContracts: endContracts.length,
            recruitment: recruitment.length,
            education: education.length,
            skillMatrix: skillMatrix.length,
            totalRecords: employees.length + endContracts.length + recruitment.length + education.length + skillMatrix.length,
            storageUsed: JSON.stringify({
                employees, endContracts, recruitment, education, skillMatrix
            }).length,
            lastUpdate: new Date().toISOString()
        };
        
        console.log('Storage Info:', storageInfo);
        return storageInfo;
    } catch (error) {
        console.error('Error getting storage info:', error);
        return null;
    }
}

function updateStorageInfo(silent = false) {
    const info = getStorageInfo();
    if (info) {
        const totalEmployeesEl = document.getElementById('total-employees');
        const totalRecordsEl = document.getElementById('total-records');
        const storageUsedEl = document.getElementById('storage-used');
        
        if (totalEmployeesEl) totalEmployeesEl.textContent = info.employees;
        if (totalRecordsEl) totalRecordsEl.textContent = info.totalRecords;
        if (storageUsedEl) {
            const sizeInKB = (info.storageUsed / 1024).toFixed(2);
            storageUsedEl.textContent = `${sizeInKB} KB`;
        }
        
        // Hanya tampilkan notifikasi jika tidak dalam mode silent
        if (!silent) {
            showNotification('Storage info berhasil diperbarui!', 'success');
        }
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Track waktu success notification
    if (type === 'success') {
        window.lastSuccessNotification = Date.now();
    }
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification-popup notification-${type}`;
    
    // Icon berdasarkan type
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    const icon = icons[type] || icons['info'];
    
    // Styling dengan background yang sesuai dengan tipe notifikasi
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 320px;
        max-width: 400px;
        background: linear-gradient(135deg, ${getTypeBackgroundColor(type)} 0%, ${getTypeBackgroundColorSecondary(type)} 100%);
        color: #ffffff;
        border: 1px solid ${getTypeBorderColor(type)};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px ${getTypeShadowColor(type)}, 0 2px 8px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateX(100%) scale(0.8);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        backdrop-filter: blur(10px);
        border-left: 4px solid ${getTypeColor(type)};
    `;
    
    // Konten notifikasi
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 18px; flex-shrink: 0; margin-top: 1px;">${icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px; color: #ffffff;">
                    ${getTypeTitle(type)}
                </div>
                <div style="color: #f0f0f0; word-wrap: break-word;">
                    ${message}
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; 
                           font-size: 18px; padding: 0; margin-left: 8px; line-height: 1;
                           transition: color 0.2s ease;" 
                    onmouseover="this.style.color='#fff'" 
                    onmouseout="this.style.color='rgba(255,255,255,0.7)'">×</button>
        </div>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(notification);
    
    // Animasi muncul
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) scale(1)';
    }, 100);
    
    // Auto remove setelah 5 detik (lebih lama untuk membaca)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }, 5000);
    
    // Hover effect untuk pause auto-remove
    let autoRemoveTimeout;
    notification.addEventListener('mouseenter', () => {
        clearTimeout(autoRemoveTimeout);
    });
    
    notification.addEventListener('mouseleave', () => {
        autoRemoveTimeout = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%) scale(0.8)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }
        }, 2000);
    });
}

// Helper functions untuk styling
function getTypeColor(type) {
    const colors = {
        'success': '#4ade80',
        'error': '#f87171',
        'warning': '#fbbf24',
        'info': '#60a5fa'
    };
    return colors[type] || colors['info'];
}

// Fungsi baru untuk background color primer
function getTypeBackgroundColor(type) {
    const colors = {
        'success': '#065f46', // Dark green
        'error': '#7f1d1d',   // Dark red
        'warning': '#78350f', // Dark amber
        'info': '#1e3a8a'     // Dark blue
    };
    return colors[type] || colors['info'];
}

// Fungsi baru untuk background color sekunder (gradient)
function getTypeBackgroundColorSecondary(type) {
    const colors = {
        'success': '#047857', // Slightly lighter dark green
        'error': '#991b1b',   // Slightly lighter dark red
        'warning': '#92400e', // Slightly lighter dark amber
        'info': '#1e40af'     // Slightly lighter dark blue
    };
    return colors[type] || colors['info'];
}

// Fungsi baru untuk border color
function getTypeBorderColor(type) {
    const colors = {
        'success': '#10b981', // Medium green
        'error': '#ef4444',   // Medium red
        'warning': '#f59e0b', // Medium amber
        'info': '#3b82f6'     // Medium blue
    };
    return colors[type] || colors['info'];
}

// Fungsi baru untuk shadow color
function getTypeShadowColor(type) {
    const colors = {
        'success': 'rgba(16, 185, 129, 0.3)', // Green shadow
        'error': 'rgba(239, 68, 68, 0.3)',   // Red shadow
        'warning': 'rgba(245, 158, 11, 0.3)', // Amber shadow
        'info': 'rgba(59, 130, 246, 0.3)'     // Blue shadow
    };
    return colors[type] || colors['info'];
}

function getTypeTitle(type) {
    const titles = {
        'success': 'Berhasil',
        'error': 'Error',
        'warning': 'Peringatan',
        'info': 'Informasi'
    };
    return titles[type] || titles['info'];
}



// ===== CLOCK FUNCTIONALITY =====
function initializeClock() {
    updateClock();
    setInterval(updateClock, 60000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    console.log('Current time:', timeString);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!document.getElementById('database-section').classList.contains('hidden')) {
            openModal('add');
        }
    }
    
    if (e.key === 'Escape') {
        closeModal();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.getElementById('modal');
        if (modal.style.display === 'block') {
            e.preventDefault();
            saveData();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToCSV();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        exportAllData();
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(event) {
    // Cek apakah baru saja ada success notification (dalam 3 detik terakhir)
    const timeSinceLastSuccess = window.lastSuccessNotification ? 
        Date.now() - window.lastSuccessNotification : Infinity;
    
    // Filter error yang terkait dengan chart initialization
    const isChartError = event.error && (
        event.error.message.includes('chart') ||
        event.error.message.includes('Chart') ||
        event.error.message.includes('canvas') ||
        event.error.message.includes('getContext') ||
        event.error.message.includes('Cannot read properties') ||
        event.filename && event.filename.includes('chart')
    );
    
    // Filter error yang terkait dengan DOM element yang belum ready
    const isDOMError = event.error && (
        event.error.message.includes('getElementById') ||
        event.error.message.includes('null') && event.error.message.includes('property')
    );
    
    // Jangan tampilkan notifikasi error jika:
    // 1. Baru saja ada success notification (< 3 detik)
    // 2. Error terkait chart initialization
    // 3. Error terkait DOM yang belum ready
    if (timeSinceLastSuccess < 3000 || isChartError || isDOMError) {
        console.warn('Suppressed error:', event.error?.message || event.message);
        return;
    }
    
    // Tampilkan notifikasi error untuk error lainnya
    showNotification('Terjadi kesalahan pada aplikasi', 'error');
    console.error('Application error:', event.error);
});

// ===== ADD CSS ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// Add a function to refresh all data connections
function refreshAllConnections() {
    console.log('Refreshing all data connections...');
    
    // Reload all data
    loadAllData();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Update all charts
    updateCharts();
    
    // Show success notification
    showNotification('Semua koneksi data berhasil di-refresh!', 'success');
}

// ===== GLOBAL FUNCTIONS FOR CONSOLE =====
window.mpSystem = {
    exportAllData,
    importData,
    clearAllData,
    exportToCSV,
    getStorageInfo,
    updateStorageInfo,
    showNotification,
    loadAllData,
    updateDashboardStats,
    updateCharts,
    loadEmployeeData,
    loadEndContractData,
    loadRecruitmentData,
    loadEducationData,
    refreshAllConnections,
    charts
};

// Function to update line filter based on selected section for education
function updateEducationLineFilter() {
    const sectionFilter = document.getElementById('modal-sectionFilter');
    const lineFilter = document.getElementById('modal-lineFilter');
    const employeeSelect = document.getElementById('modal-employeeSelect');
    
    if (!sectionFilter || !lineFilter || !employeeSelect) return;
    
    const selectedSection = sectionFilter.value;
    
    // Clear current line options
    lineFilter.innerHTML = '<option value="">Pilih Line</option>';
    
    // Reset employee dropdown
    employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
    employeeSelect.disabled = true;
    
    // Clear form fields
    clearEducationFormFields();
    
    if (selectedSection) {
        // Enable line filter
        lineFilter.disabled = false;
        
        // Get employees from localStorage
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const activeEmployees = employees.filter(emp => emp.status === 'Aktif');
        
        // Get lines only from selected section
        const sectionLines = [...new Set(
            activeEmployees
                .filter(emp => emp.section === selectedSection)
                .map(emp => emp.line)
                .filter(line => line)
        )].sort();
        
        sectionLines.forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineFilter.appendChild(option);
        });
    } else {
        // Disable line filter if no section selected
        lineFilter.disabled = true;
    }
}

// Function to update employee filter based on selected section and line
function updateEducationEmployeeFilter() {
    const sectionFilter = document.getElementById('modal-sectionFilter');
    const lineFilter = document.getElementById('modal-lineFilter');
    const employeeSelect = document.getElementById('modal-employeeSelect');
    const namaPosSelect = document.getElementById('modal-namaPos');
    
    if (!sectionFilter || !lineFilter || !employeeSelect) return;
    
    const selectedSection = sectionFilter.value;
    const selectedLine = lineFilter.value;
    
    // Clear current employee options
    employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
    
    // Clear form fields
    clearEducationFormFields();
    
    // Update nama pos options based on section
    updateNamaPosOptions(selectedSection);
    
    if (selectedSection && selectedLine) {
        // Enable employee select
        employeeSelect.disabled = false;
        
        // Get employees from localStorage
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const activeEmployees = employees.filter(emp => 
            emp.status === 'Aktif' && 
            emp.section === selectedSection && 
            emp.line === selectedLine
        );
        
        // Sort employees by NPK from highest to lowest (descending)
        activeEmployees.sort((a, b) => {
            const npkA = parseInt(a.npk) || 0;
            const npkB = parseInt(b.npk) || 0;
            return npkB - npkA; // Descending order (tertinggi ke terendah)
        });
        
        activeEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.npk;
            option.dataset.employee = JSON.stringify(emp);
            option.textContent = `${emp.npk} - ${emp.nama}`;
            employeeSelect.appendChild(option);
        });
    } else {
        // Disable employee select if section or line not selected
        employeeSelect.disabled = true;
    }
}

// Function to clear education form fields
function clearEducationFormFields() {
    const fields = ['modal-npk', 'modal-nama', 'modal-gender', 'modal-section', 'modal-line', 'modal-leader'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

// Function to update nama pos options based on section
function updateNamaPosOptions(selectedSection) {
    const namaPosSelect = document.getElementById('modal-namaPos');
    if (!namaPosSelect) return;
    
    // Clear current options
    namaPosSelect.innerHTML = '<option value="">Pilih Nama Pos</option>';
    
    // Define positions for each section
    const sectionPositions = {
        'Comp Assy': [
            'Mizusumashi Towing',
            'Mizusumashi Shaft',
            'Pre Check',
            'Part Washing Big Part (IN)',
            'Part Washing Inner Part (IN)',
            'Pass Room (Prepare Piston)',
            'Pass Room (Prepare Gasket)',
            'Prepare Thrust Bearing',
            'Prepare Oring PRV',
            'Bearing Assy',
            'Bushing Assy',
            'Mizusumashi Assy',
            'Part Washing Inner Part (OUT) LIP Seal Assy',
            'Part Washing Inner Part (OUT)',
            'PRV Assy',
            'Piston & Swash Measuring',
            'Shoe Selecting',
            'Cylinder Block Assy',
            'Shoe Clearance & Muffler Bolt',
            'QR Code Label Assy & Press Pin',
            'Front Side Assy',
            'Front Housing Assy',
            'Rear Housing Assy',
            'Housing Bolt',
            'Bolt Tightening',
            'Concentricity Check & Torque Check',
            'Empty Weight & Dummy Assy',
            'Vacuum & Gas Charging',
            'Helium Leak Test',
            'High Pressure Check',
            'Performance Test',
            'Release Dummy',
            'Pre Oil & Oil Filling',
            'Seal Cap Assy',
            'Flange Assy',
            'Air Leak Test',
            'Gas Release',
            'Seal Cap Assy 2',
            'Final Washing',
            'Name Plate Assy',
            'Thermal Sensor',
            'Felt Assy',
            'Foot & Boshi Check',
            'Robot Final Check',
            'Taking & Laser Name Plate',
            'Repair Shoe Clearance',
            'Repair Dipping'
        ],
        'Comp WClutch': [
            'Pre Stator',
            'Stator Assy',
            'Rotor Assy',
            'Washer Selection',
            'Bracket Assy',
            'Final Check WClutch',
            'Packaging',
            'Mizusumashi WClutch',
            'Repair Man WClutch',
            'Performance Test',
            'Packaging',
            'Final Inspection'
        ]
    };
    
    if (selectedSection && sectionPositions[selectedSection]) {
        // Enable nama pos select
        namaPosSelect.disabled = false;
        
        // Add position options
        sectionPositions[selectedSection].forEach(position => {
            const option = document.createElement('option');
            option.value = position;
            option.textContent = position;
            namaPosSelect.appendChild(option);
        });
    } else {
        // Disable nama pos select if no section selected
        namaPosSelect.disabled = true;
    }
}

// Function to update Nama Pos dropdown based on section
function updateEducationNamaPosFilter() {
    const sectionInput = document.getElementById('modal-section');
    const namaPosSelect = document.getElementById('modal-namaPos');
    
    if (!sectionInput || !namaPosSelect) return;
    
    const selectedSection = sectionInput.value;
    
    // Clear previous options
    namaPosSelect.innerHTML = '<option value="">Pilih Nama Pos</option>';
    
    if (!selectedSection) {
        namaPosSelect.disabled = true;
        return;
    }
    
    // Determine mode based on section
    let mode = '';
    if (selectedSection === 'Comp Assy') {
        mode = 'comp-assy';
    } else if (selectedSection === 'Comp WClutch') {
        mode = 'comp-wclutch';
    }
    
    if (mode && modePositions[mode]) {
        // Enable dropdown and populate with positions
        namaPosSelect.disabled = false;
        
        modePositions[mode].forEach(position => {
            const option = document.createElement('option');
            option.value = position;
            option.textContent = positionDisplayNames[position] || position;
            namaPosSelect.appendChild(option);
        });
    } else {
        namaPosSelect.disabled = true;
    }
}

// Global functions for modal forms
window.toggleContractDuration = toggleContractDuration;
window.autoFillEmployee = autoFillEmployee;
window.clearEndContractForm = clearEndContractForm;
window.autoFillEmployeeEducation = autoFillEmployeeEducation;
window.clearEducationForm = clearEducationForm;
window.calculateDatePlanning = calculateDatePlanning;
window.viewCurrentPdf = viewCurrentPdf;
window.viewEducationPdf = viewEducationPdf;
window.autoFillFromEmployee = autoFillFromEmployee;
window.autoFillFromEndContract = autoFillFromEndContract;
window.updateEducationLineFilter = updateEducationLineFilter;
window.updateEducationEmployeeFilter = updateEducationEmployeeFilter;
window.clearEducationFormFields = clearEducationFormFields;
window.updateNamaPosOptions = updateNamaPosOptions;
window.updateEducationNamaPosFilter = updateEducationNamaPosFilter;
window.filterEducationData = filterEducationData;
window.filterEducationByDate = filterEducationByDate;
window.filterEducationByMonth = filterEducationByMonth;
window.clearEducationDateFilter = clearEducationDateFilter;
window.populateEducationMonthYearFilter = populateEducationMonthYearFilter;
window.updateEducationStats = updateEducationStats;
window.filterEducationSchedule = filterEducationSchedule;
window.filterEducationScheduleByDate = filterEducationScheduleByDate;
window.clearDateFilter = clearDateFilter;
window.setQuickDateFilter = setQuickDateFilter;
window.searchEducationSchedule = searchEducationSchedule;
window.updateAttendanceStatus = updateAttendanceStatus;
window.updateSessionTime = updateSessionTime;
window.updateNote = updateNote;
window.toggleNPKSort = toggleNPKSort;
window.toggleEndContractNPKSort = toggleEndContractNPKSort;
window.filterEndContractByMonth = filterEndContractByMonth;
window.generateEndContractYearOptions = generateEndContractYearOptions;
window.filterRecruitmentData = filterRecruitmentData;
window.createRecruitmentPagination = createRecruitmentPagination;
window.updateRecruitmentPaginationInfo = updateRecruitmentPaginationInfo;
window.changeRecruitmentPage = changeRecruitmentPage;
window.toggleRecruitmentNPKSort = toggleRecruitmentNPKSort;
window.filterMappingData = filterMappingData;
window.changeMappingPage = changeMappingPage;
window.toggleMappingNPKSort = toggleMappingNPKSort;
window.exportMappingToCSV = exportMappingToCSV;
window.exportSkillMatrixToCSV = exportSkillMatrixToCSV;
window.updateMappingLineFilter = updateMappingLineFilter;
window.showSection = showSection;
window.openSkillMatrixModal = openSkillMatrixModal;
window.editSkillMatrix = editSkillMatrix;
window.deleteSkillMatrix = deleteSkillMatrix;
window.loadSkillMatrixData = loadSkillMatrixData;
window.displaySkillMatrixData = displaySkillMatrixData;
window.toggleSkillMatrixNPKSort = toggleSkillMatrixNPKSort;
window.updateAttendanceChart = updateAttendanceChart;
window.updateAllCharts = updateAllCharts;
window.syncAllYearFilters = syncAllYearFilters;
window.updateEndContractCompAssyChart = updateEndContractCompAssyChart;
window.updateEndContractCompWClutchChart = updateEndContractCompWClutchChart;
window.updateEducationCompAssyChart = updateEducationCompAssyChart;
window.updateEducationCompWClutchChart = updateEducationCompWClutchChart;
window.updateMappingCharts = updateMappingCharts;
window.updateMappingCompAssyChart = updateMappingCompAssyChart;
window.updateMappingCompWClutchChart = updateMappingCompWClutchChart;
window.updateSkillMatrixLineFilter = updateSkillMatrixLineFilter;
window.updateSkillMatrixEmployeeFilter = updateSkillMatrixEmployeeFilter;
window.autoFillEmployeeSkillMatrix = autoFillEmployeeSkillMatrix;
window.populateSkillMatrixSectionDropdown = populateSkillMatrixSectionDropdown;
window.initializeSkillMatrixFilters = initializeSkillMatrixFilters;
window.updateSkillMatrixLineFilterOptions = updateSkillMatrixLineFilterOptions;
window.generateSkillInputs = generateSkillInputs;
window.showSkillTab = showSkillTab;

// Function to populate section dropdown for skill matrix
function populateSkillMatrixSectionDropdown() {
    const employees = getFromLocalStorage(STORAGE_KEYS.employees);
    const activeEmployees = employees.filter(emp => emp.status === 'Aktif');
    const sections = [...new Set(activeEmployees.map(emp => emp.section))].sort();
    
    const sectionSelect = document.getElementById('skillMatrixSectionSelect');
    if (!sectionSelect) return;
    
    sectionSelect.innerHTML = '<option value="">-- Pilih Section --</option>';
    
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionSelect.appendChild(option);
    });
}

// Function to update line filter for skill matrix
function updateSkillMatrixLineFilter() {
    const sectionSelect = document.getElementById('skillMatrixSectionSelect');
    const lineSelect = document.getElementById('skillMatrixLineSelect');
    const employeeSelect = document.getElementById('employeeSelect');
    
    if (!sectionSelect || !lineSelect || !employeeSelect) return;
    
    const selectedSection = sectionSelect.value;
    
    // Clear dan reset Line dan Employee dropdowns
    lineSelect.innerHTML = '<option value="">-- Pilih Line --</option>';
    employeeSelect.innerHTML = '<option value="">-- Pilih Karyawan --</option>';
    lineSelect.disabled = true;
    employeeSelect.disabled = true;
    
    // Clear form fields
    clearSkillMatrixFormFields();
    
    if (selectedSection) {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees) || [];
        const filteredEmployees = employees.filter(emp => emp.section === selectedSection);
        const lines = [...new Set(filteredEmployees.map(emp => emp.line))].sort();
        
        lines.forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineSelect.appendChild(option);
        });
        
        lineSelect.disabled = false;
    }
}

// Function to update employee filter for skill matrix
function updateSkillMatrixEmployeeFilter() {
    const sectionSelect = document.getElementById('skillMatrixSectionSelect');
    const lineSelect = document.getElementById('skillMatrixLineSelect');
    const employeeSelect = document.getElementById('employeeSelect');
    
    if (!sectionSelect || !lineSelect || !employeeSelect) return;
    
    const selectedSection = sectionSelect.value;
    const selectedLine = lineSelect.value;
    
    // Clear Employee dropdown
    employeeSelect.innerHTML = '<option value="">-- Pilih Karyawan --</option>';
    employeeSelect.disabled = true;
    
    // Clear form fields
    clearSkillMatrixFormFields();
    
    if (selectedSection && selectedLine) {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees) || [];
        const filteredEmployees = employees.filter(emp => 
            emp.section === selectedSection && emp.line === selectedLine
        );
        
        // Sort employees by NPK from highest to lowest (descending)
        filteredEmployees.sort((a, b) => {
            const npkA = parseInt(a.npk) || 0;
            const npkB = parseInt(b.npk) || 0;
            return npkB - npkA; // Descending order (tertinggi ke terendah)
        });
        
        filteredEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.npk} - ${emp.nama}`;
            option.dataset.npk = emp.npk;
            option.dataset.nama = emp.nama;
            option.dataset.section = emp.section;
            option.dataset.line = emp.line;
            employeeSelect.appendChild(option);
        });
        
        employeeSelect.disabled = false;
    }
}

// Function to auto-fill employee data for skill matrix
function autoFillEmployeeSkillMatrix() {
    const employeeSelect = document.getElementById('employeeSelect');
    if (!employeeSelect || !employeeSelect.value) {
        clearSkillMatrixFormFields();
        return;
    }
    
    const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
    
    // Fill employee data fields
    const npkField = document.getElementById('modal-npk');
    const namaField = document.getElementById('modal-nama');
    const sectionField = document.getElementById('modal-section');
    const lineField = document.getElementById('modal-line');
    
    if (npkField) npkField.value = selectedOption.dataset.npk || '';
    if (namaField) namaField.value = selectedOption.dataset.nama || '';
    if (sectionField) sectionField.value = selectedOption.dataset.section || '';
    if (lineField) lineField.value = selectedOption.dataset.line || '';
}

// Function to clear skill matrix form fields
function clearSkillMatrixFormFields() {
    const fields = ['modal-npk', 'modal-nama', 'modal-section', 'modal-line'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

console.log('Full LocalStorage MP Development System with Charts loaded!');
console.log('Available commands:');
console.log('- mpSystem.exportAllData() - Backup semua data');
console.log('- mpSystem.exportToCSV() - Export karyawan ke CSV');
console.log('- mpSystem.getStorageInfo() - Info storage');
console.log('- mpSystem.updateStorageInfo() - Update storage info UI');
console.log('- mpSystem.clearAllData() - Reset semua data');
console.log('- mpSystem.loadAllData() - Reload semua data');
console.log('- mpSystem.updateCharts() - Refresh all charts');
console.log('- mpSystem.charts - Access chart instances');
console.log('- mpSystem.loadEmployeeData() - Reload employee table');
console.log('- mpSystem.loadEndContractData() - Reload end contract table');
console.log('- mpSystem.loadRecruitmentData() - Reload recruitment table');
console.log('- mpSystem.loadEducationData() - Reload education table');
console.log('- mpSystem.loadEducationScheduleData() - Reload education schedule table');

// Quick Filter Buttons (New Function)
function setQuickDateFilter(days) {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);
    
    const dateString = targetDate.toISOString().split('T')[0];
    document.getElementById('scheduleDateFilter').value = dateString;
    filterEducationScheduleByDate();
}
// Pastikan filter skill matrix terinisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Delay sedikit untuk memastikan semua elemen sudah dimuat
    setTimeout(() => {
        initializeSkillMatrixFilters();
    }, 300);
});

function highlightSkillMatrixHeaders(data) {
    const positionColumnMap = {
        'mizusumashi-towing': 6,
        'mizusumashi-shaft': 7,
        'pre-check': 8,
        'part-washing-big-part-in': 9,
        'part-washing-inner-part-in': 10,
        'pass-room-prepare-piston': 11,
        'pass-room-prepare-gasket': 12,
        'prepare-thrust-bearing': 13,
        'prepare-oring-prv': 14,
        'bearing-assy': 15,
        'bushing-assy': 16,
        'mizusumashi-assy': 17,
        'part-washing-inner-part-out-lip-seal': 18,
        'part-washing-inner-part-out': 19,
        'prv-assy': 20,
        'piston-swash': 21,
        'shoe-selecting': 22,
        'cylinder-block': 23,
        'shoe-clearance-muffler-bolt': 24,
        'qr-code-label-press-pin': 25,
        'front-side-assy': 26,
        'front-housing-assy': 27,
        'rear-housing-assy': 28,
        'housing-bolt': 29,
        'bolt-tightening': 30,
        'concentricity-torque-check': 31,
        'empty-weight-dummy-assy': 32,
        'vacuum-gas-charging': 33,
        'helium-leak-test': 34,
        'high-pressure-check': 35,
        'performance-test': 36,
        'release-dummy': 37,
        'pre-oil-oil-filling': 38,
        'seal-cap-assy': 39,
        'flange-assy': 40,
        'air-leak-test': 41,
        'gas-release': 42,
        'seal-cap-assy-2': 43,
        'final-washing': 44,
        'name-plate-assy': 45,
        'thermal-sensor': 46,
        'felt-assy': 47,
        'foot-boshi-check': 48,
        'robot-final-check': 49,
        'taking-laser-name-plate': 50,
        'repair-shoe-clearance': 51,
        'repair-dipping': 52
    };
    
    // Get unique positions from current data
    const currentPositions = [...new Set(data.map(item => item.position).filter(pos => pos))];
    
    // Highlight headers for current positions
    currentPositions.forEach(position => {
        const columnIndex = positionColumnMap[position];
        if (columnIndex) {
            const header = document.querySelector(`#skillMatrixTable thead th:nth-child(${columnIndex})`);
            if (header) {
                header.classList.add('current-position-header');
            }
        }
    });
}

function clearSkillMatrixHeaderHighlight() {
    const headers = document.querySelectorAll('#skillMatrixTable thead th.current-position-header');
    headers.forEach(header => {
        header.classList.remove('current-position-header');
    });
}

// Pastikan semua fungsi ini terdefinisi di window object
window.filterEndContractByMonth = filterEndContractByMonth;
window.toggleEndContractNPKSort = toggleEndContractNPKSort;
window.updateSkillMatrixSectionFilter = updateSkillMatrixSectionFilter;
window.updateSkillMatrixLineFilter = updateSkillMatrixLineFilter;
window.filterSkillMatrix = filterSkillMatrix;
window.smartSearchMP = smartSearchMP;
window.filterSkillMatrixData = filterSkillMatrixData;
window.updateSearchResultCounter = updateSearchResultCounter;
window.populateLineFilter = populateLineFilter;

// End Contract Functions
function filterEndContractByMonth() {
    const monthFilter = document.getElementById('endContractMonthFilter')?.value || '';
    const yearFilter = document.getElementById('endContractYearFilter')?.value || '';
    const searchTerm = document.getElementById('endContractSearchInput')?.value.toLowerCase() || '';
    
    filteredEndContracts = allEndContracts.filter(contract => {
        const matchesMonth = !monthFilter || contract.dateOut?.includes(monthFilter);
        const matchesYear = !yearFilter || contract.dateOut?.includes(yearFilter);
        const matchesSearch = !searchTerm || 
            contract.nama?.toLowerCase().includes(searchTerm) ||
            contract.npk?.toLowerCase().includes(searchTerm);
        
        return matchesMonth && matchesYear && matchesSearch;
    });
    
    currentEndContractPage = 1;
    displayEndContractData();
    createEndContractPagination();
}

// Skill Matrix Functions
function updateSkillMatrixSectionFilter() {
    updateSkillMatrixLineFilterOptions();
    filterSkillMatrix();
}

function filterSkillMatrix() {
    const sectionFilter = document.getElementById('skillMatrixSectionFilter')?.value || 'all';
    const lineFilter = document.getElementById('skillMatrixLineFilter')?.value || 'all';
    const searchTerm = document.getElementById('skillMatrixSearch')?.value.toLowerCase() || '';
    
    // Apply filters and display data
    displaySkillMatrixData();
}

// Tambahkan fungsi smart search yang otomatis detect mode
function smartSearchMP() {
    const searchInput = document.getElementById('skillMatrixSearch');
    const modeSelect = document.getElementById('skillMatrixModeSelect');
    const searchTerm = searchInput.value.toLowerCase();
    
    // Auto detect mode berdasarkan kata kunci pencarian
    if (searchTerm.includes('assy') || searchTerm.includes('assembly')) {
        // Jika mencari MP Assy, switch ke mode Comp Assy (47 skill)
        if (modeSelect.value !== 'comp-assy') {
            modeSelect.value = 'comp-assy';
            handleSkillMatrixModeChange();
        }
    } else if (searchTerm.includes('wclutch') || searchTerm.includes('clutch')) {
        // Jika mencari MP WClutch, switch ke mode Comp WClutch (12 skill)
        if (modeSelect.value !== 'comp-wclutch') {
            modeSelect.value = 'comp-wclutch';
            handleSkillMatrixModeChange();
        }
    }
    
    // Lakukan pencarian normal
    filterSkillMatrixData();
}

// Update fungsi filter untuk mendukung pencarian yang lebih baik
function filterSkillMatrixData() {
    const searchTerm = document.getElementById('skillMatrixSearch').value.toLowerCase();
    const lineFilter = document.getElementById('skillMatrixLineFilter').value;
    const currentMode = document.getElementById('skillMatrixModeSelect').value;
    
    const tableBody = document.getElementById('skillMatrixTableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        const npk = cells[0].textContent.toLowerCase();
        const nama = cells[1].textContent.toLowerCase();
        const section = cells[2].textContent.toLowerCase();
        const line = cells[3].textContent.toLowerCase();
        const position = cells[4].textContent.toLowerCase();
        
        // Filter berdasarkan pencarian (NPK, Nama, Section, Position)
        const matchesSearch = searchTerm === '' || 
            npk.includes(searchTerm) || 
            nama.includes(searchTerm) || 
            section.includes(searchTerm) || 
            position.includes(searchTerm);
        
        // Filter berdasarkan line
        const matchesLine = lineFilter === 'all' || line.includes(lineFilter.toLowerCase());
        
        // Tampilkan/sembunyikan row
        if (matchesSearch && matchesLine) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update counter hasil pencarian
    updateSearchResultCounter();
}

// Fungsi untuk menampilkan counter hasil pencarian
function updateSearchResultCounter() {
    const tableBody = document.getElementById('skillMatrixTableBody');
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    
    if (!tableBody) {
        console.warn('skillMatrixTableBody element not found');
        return;
    }
    
    // Get all skill matrix data and filter by current mode
    const allData = getFromLocalStorage(STORAGE_KEYS.skillMatrix) || [];
    const modeFilteredData = allData.filter(data => 
        data.evaluationMode === currentMode || !data.evaluationMode // backward compatibility
    );
    
    const visibleRows = tableBody.querySelectorAll('tr:not([style*="display: none"])');
    const totalRows = modeFilteredData.length; // Use filtered data count instead
    
    // Tambahkan atau update info counter
    let counterElement = document.getElementById('searchResultCounter');
    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.id = 'searchResultCounter';
        counterElement.className = 'search-result-counter';
        
        const skillMatrixContainer = document.querySelector('.skill-matrix-container');
        if (skillMatrixContainer) {
            skillMatrixContainer.insertBefore(counterElement, skillMatrixContainer.firstChild);
        } else {
            // Fallback: insert before the table if container not found
            const skillMatrixTable = document.getElementById('skillMatrixTable');
            if (skillMatrixTable && skillMatrixTable.parentNode) {
                skillMatrixTable.parentNode.insertBefore(counterElement, skillMatrixTable);
            }
        }
    }
    
    const modeName = currentMode === 'comp-assy' ? 'Comp Assy (47 Skill)' : 'Comp WClutch (12 Skill)';
    
    counterElement.innerHTML = `
        <span class="mode-indicator">Mode: ${modeName}</span> | 
        <span class="result-count">Menampilkan ${visibleRows.length} dari ${totalRows} data</span>
    `;
}

// Fungsi untuk scroll ke kolom posisi tertentu
function scrollToPositionColumn(position) {
    if (!position) return;
    
    // Map posisi ke column index (sesuai dengan positionToSkillMap + offset untuk kolom awal)
    const positionToColumnMap = {
        'mizusumashi-towing': 6,      // kolom ke-6 (NPK, Nama, Section, Line, Pos Saat Ini, skill1)
        'mizusumashi-shaft': 7,
        'pre-check': 8,
        'part-washing-big-part-in': 9,
        'part-washing-inner-part-in': 10,
        'pass-room-prepare-piston': 11,
        'pass-room-prepare-gasket': 12,
        'prepare-thrust-bearing': 13,
        'prepare-oring-prv': 14,
        'bearing-assy': 15,
        'bushing-assy': 16,
        'mizusumashi-assy': 17,
        'part-washing-inner-part-out-lip-seal': 18,
        'part-washing-inner-part-out': 19,
        'prv-assy': 20,
        'piston-swash': 21,
        'shoe-selecting': 22,
        'cylinder-block': 23,
        'shoe-clearance-muffler-bolt': 24,
        'qr-code-label-press-pin': 25,
        'front-side-assy': 26,
        'front-housing-assy': 27,
        'rear-housing-assy': 28,
        'housing-bolt': 29,
        'bolt-tightening': 30,
        'concentricity-torque-check': 31,
        'empty-weight-dummy-assy': 32,
        'vacuum-gas-charging': 33,
        'helium-leak-test': 34,
        'high-pressure-check': 35,
        'performance-test': 36,
        'release-dummy': 37,
        'pre-oil-oil-filling': 38,
        'seal-cap-assy': 39,
        'flange-assy': 40,
        'air-leak-test': 41,
        'gas-release': 42,
        'seal-cap-assy-2': 43,
        'final-washing': 44,
        'name-plate-assy': 45,
        'thermal-sensor': 46,
        'felt-assy': 47,
        'foot-boshi-check': 48,
        'robot-final-check': 49,
        'taking-laser-name-plate': 50,
        'repair-shoe-clearance': 51,
        'repair-dipping': 52
    };
    
    const columnIndex = positionToColumnMap[position];
    if (columnIndex) {
        // Cari header kolom yang sesuai
        const targetHeader = document.querySelector(`#skillMatrixTable thead th:nth-child(${columnIndex})`);
        if (targetHeader) {
            // Scroll ke kolom tersebut dengan smooth animation
            targetHeader.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
            
            // Tambahkan efek highlight sementara
            targetHeader.style.backgroundColor = '#ffeb3b';
            targetHeader.style.transition = 'background-color 0.3s ease';
            setTimeout(() => {
                targetHeader.style.backgroundColor = '';
            }, 1500);
        }
    }
}

// Tambahkan ke window object agar bisa diakses dari onclick
window.scrollToPositionColumn = scrollToPositionColumn;

// Mapping posisi ke skill yang relevan
const positionSkillMapping = {
    // Comp Assy positions
    'mizusumashi-towing': [1],
    'mizusumashi-shaft': [2],
    'pre-check': [3],
    'part-washing-big-part-in': [4],
    'part-washing-inner-part-in': [5],
    'pass-room-prepare-piston': [6],
    'pass-room-prepare-gasket': [7],
    'prepare-thrust-bearing': [8],
    'prepare-oring-prv': [9],
    'bearing-assy': [10],
    'bushing-assy': [11],
    'mizusumashi-assy': [12],
    'part-washing-inner-part-out-lip-seal': [13],
    'part-washing-inner-part-out': [14],
    'prv-assy': [15],
    'piston-swash': [16],
    'shoe-selecting': [17],
    'cylinder-block': [18],
    'shoe-clearance-muffler-bolt': [19],
    'qr-code-label-press-pin': [20],
    'front-side-assy': [21],
    'front-housing-assy': [22],
    'rear-housing-assy': [23],
    'housing-bolt': [24],
    'bolt-tightening': [25],
    'concentricity-torque-check': [26],
    'empty-weight-dummy-assy': [27],
    'vacuum-gas-charging': [28],
    'helium-leak-test': [29],
    'high-pressure-check': [30],
    'performance-test': [31],
    'release-dummy': [32],
    'pre-oil-oil-filling': [33],
    'seal-cap-assy': [34],
    'flange-assy': [35],
    'air-leak-test': [36],
    'gas-release': [37],
    'seal-cap-assy-2': [38],
    'final-washing': [39],
    'name-plate-assy': [40],
    'thermal-sensor': [41],
    'felt-assy': [42],
    'foot-boshi-check': [43],
    'robot-final-check': [44],
    'taking-laser-name-plate': [45],
    'repair-shoe-clearance': [46],
    'repair-dipping': [47],
    // Comp WClutch positions
    'pre-stator': [1],
    'stator-assy': [2],
    'rotor-assy': [3],
    'housing-preparation': [4],
    'bearing-installation': [5],
    'coil-winding': [6],
    'electrical-testing': [7],
    'quality-check': [8],
    'final-assembly': [9],
    'performance-test-wclutch': [10],
    'packaging': [11],
    'final-inspection': [12]
};

// Mapping mode evaluasi ke skill yang relevan
const evaluationModeSkills = {
    'comp-assy': {
        name: 'Comp Assy',
        totalSkills: 47,
        skills: Array.from({length: 47}, (_, i) => i + 1), // [1,2,3...47]
        skillNames: [
            'Mizusumashi Towing',
            'Mizusumashi Shaft', 
            'Pre Check',
            'Part Washing Big Part (IN)',
            'Part Washing Inner Part (IN)',
            'Pass Room (Prepare Piston)',
            'Pass Room (Prepare Gasket)',
            'Prepare Thrust Bearing',
            'Prepare Oring PRV',
            'Bearing Assy',
            'Bushing Assy',
            'Mizusumashi Assy',
            'Part Washing Inner Part (OUT) LIP Seal Assy',
            'Part Washing Inner Part (OUT)',
            'PRV Assy',
            'Piston & Swash Measuring',
            'Shoe Selecting',
            'Cylinder Block Assy',
            'Shoe Clearance & Muffler Bolt',
            'QR Code Label Assy & Press Pin',
            'Front Side Assy',
            'Front Housing Assy',
            'Rear Housing Assy',
            'Housing Bolt',
            'Bolt Tightening',
            'Concentricity Check & Torque Check',
            'Empty Weight & Dummy Assy',
            'Vacuum & Gas Charging',
            'Helium Leak Test',
            'High Pressure Check',
            'Performance Test',
            'Release Dummy',
            'Pre Oil & Oil Filling',
            'Seal Cap Assy',
            'Flange Assy',
            'Air Leak Test',
            'Gas Release',
            'Seal Cap Assy 2',
            'Final Washing',
            'Name Plate Assy',
            'Thermal Sensor',
            'Felt Assy',
            'Foot & Boshi Check',
            'Robot Final Check',
            'Taking & Laser Name Plate',
            'Repair Shoe Clearance',
            'Repair Dipping'
        ]
    },
    'comp-wclutch': {
        name: 'Comp Wclutch', 
        totalSkills: 12,
        skills: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        skillNames: [
            'Pre Stator',
            'Stator Assy',
            'Rotor Assy', 
            'Washer Selection',
            'Bracket Assy',
            'Final Check WClutch',
            'Packaging',
            'Mizusumashi WClutch',
            'Repair Man WClutch',
            'Performance Test',
            'Packaging',
            'Final Inspection'
        ]
    }
};

// Tambahkan mapping posisi untuk setiap mode
const modePositions = {
    'comp-assy': [
        'mizusumashi-towing',
        'mizusumashi-shaft', 
        'pre-check',
        'part-washing-big-part-in',
        'part-washing-inner-part-in',
        'pass-room-prepare-piston',
        'pass-room-prepare-gasket',
        'prepare-thrust-bearing',
        'prepare-oring-prv',
        'bearing-assy',
        'bushing-assy',
        'mizusumashi-assy',
        'part-washing-inner-part-out-lip-seal',
        'part-washing-inner-part-out',
        'prv-assy',
        'piston-swash',
        'shoe-selecting',
        'cylinder-block',
        'shoe-clearance-muffler-bolt',
        'qr-code-label-press-pin',
        'front-side-assy',
        'front-housing-assy',
        'rear-housing-assy',
        'housing-bolt',
        'bolt-tightening',
        'concentricity-torque-check',
        'empty-weight-dummy-assy',
        'vacuum-gas-charging',
        'helium-leak-test',
        'high-pressure-check',
        'performance-test',
        'release-dummy',
        'pre-oil-oil-filling',
        'seal-cap-assy',
        'flange-assy',
        'air-leak-test',
        'gas-release',
        'seal-cap-assy-2',
        'final-washing',
        'name-plate-assy',
        'thermal-sensor',
        'felt-assy',
        'foot-boshi-check',
        'robot-final-check',
        'taking-laser-name-plate',
        'repair-shoe-clearance',
        'repair-dipping'
    ],
    'comp-wclutch': [
        'pre-stator',
        'stator-assy',
        'rotor-assy',
        'housing-preparation',
        'bearing-installation',
        'coil-winding',
        'electrical-testing',
        'quality-check',
        'final-assembly',
        'performance-test-wclutch',
        'packaging',
        'final-inspection'
    ]
};

// Mapping display name untuk posisi
const positionDisplayNames = {
    // Comp Assy positions
    'mizusumashi-towing': 'Mizusumashi Towing',
    'mizusumashi-shaft': 'Mizusumashi Shaft',
    'pre-check': 'Pre Check',
    'part-washing-big-part-in': 'Part Washing Big Part (IN)',
    'part-washing-inner-part-in': 'Part Washing Inner Part (IN)',
    'pass-room-prepare-piston': 'Pass Room (Prepare Piston)',
    'pass-room-prepare-gasket': 'Pass Room (Prepare Gasket)',
    'prepare-thrust-bearing': 'Prepare Thrust Bearing',
    'prepare-oring-prv': 'Prepare Oring PRV',
    'bearing-assy': 'Bearing Assy',
    'bushing-assy': 'Bushing Assy',
    'mizusumashi-assy': 'Mizusumashi Assy',
    'part-washing-inner-part-out-lip-seal': 'Part Washing Inner Part (OUT) LIP Seal Assy',
    'part-washing-inner-part-out': 'Part Washing Inner Part (OUT)',
    'prv-assy': 'PRV Assy',
    'piston-swash': 'Piston & Swash Measuring',
    'shoe-selecting': 'Shoe Selecting',
    'cylinder-block': 'Cylinder Block Assy',
    'shoe-clearance-muffler-bolt': 'Shoe Clearance & Muffler Bolt',
    'qr-code-label-press-pin': 'QR Code Label Assy & Press Pin',
    'front-side-assy': 'Front Side Assy',
    'front-housing-assy': 'Front Housing Assy',
    'rear-housing-assy': 'Rear Housing Assy',
    'housing-bolt': 'Housing Bolt',
    'bolt-tightening': 'Bolt Tightening',
    'concentricity-torque-check': 'Concentricity Check & Torque Check',
    'empty-weight-dummy-assy': 'Empty Weight & Dummy Assy',
    'vacuum-gas-charging': 'Vacuum & Gas Charging',
    'helium-leak-test': 'Helium Leak Test',
    'high-pressure-check': 'High Pressure Check',
    'performance-test': 'Performance Test',
    'release-dummy': 'Release Dummy',
    'pre-oil-oil-filling': 'Pre Oil & Oil Filling',
    'seal-cap-assy': 'Seal Cap Assy',
    'flange-assy': 'Flange Assy',
    'air-leak-test': 'Air Leak Test',
    'gas-release': 'Gas Release',
    'seal-cap-assy-2': 'Seal Cap Assy 2',
    'final-washing': 'Final Washing',
    'name-plate-assy': 'Name Plate Assy',
    'thermal-sensor': 'Thermal Sensor',
    'felt-assy': 'Felt Assy',
    'foot-boshi-check': 'Foot & Boshi Check',
    'robot-final-check': 'Robot Final Check',
    'taking-laser-name-plate': 'Taking & Laser Name Plate',
    'repair-shoe-clearance': 'Repair Shoe Clearance',
    'repair-dipping': 'Repair Dipping',
    // Comp WClutch positions
    'pre-stator': 'Pre Stator',
    'stator-assy': 'Stator Assy',
    'rotor-assy': 'Rotor Assy',
    'housing-preparation': 'Housing Preparation',
    'bearing-installation': 'Bearing Installation',
    'coil-winding': 'Coil Winding',
    'electrical-testing': 'Electrical Testing',
    'quality-check': 'Quality Check',
    'final-assembly': 'Final Assembly',
    'performance-test-wclutch': 'Performance Test',
    'packaging': 'Packaging',
    'final-inspection': 'Final Inspection'
};

// Tambahkan fungsi baru setelah evaluationModeSkills
function updateSkillMatrixHeaders(mode) {
    const table = document.getElementById('skillMatrixTable');
    const thead = table.querySelector('thead tr');
    const modeConfig = evaluationModeSkills[mode];
    
    if (!modeConfig) return;
    
    // Hapus header skill yang lama (mulai dari kolom ke-6, sebelum Action)
    const existingHeaders = thead.querySelectorAll('th');
    for (let i = existingHeaders.length - 2; i >= 5; i--) {
        existingHeaders[i].remove();
    }
    
    // Tambahkan header skill baru
    const actionHeader = thead.querySelector('th:last-child'); // Kolom Action
    modeConfig.skillNames.forEach(skillName => {
        const th = document.createElement('th');
        th.textContent = skillName;
        th.style.backgroundColor = '#4a90e2'; // Warna biru untuk header skill
        th.style.color = 'white';
        thead.insertBefore(th, actionHeader);
    });
}

// Fungsi untuk handle perubahan mode di halaman skill matrix
function handleSkillMatrixModeChange() {
    const modeSelect = document.getElementById('skillMatrixModeSelect');
    const selectedMode = modeSelect.value;
    
    if (selectedMode) {
        updateSkillMatrixHeaders(selectedMode);
        
        // Regenerate section filter based on new mode
        generateSkillMatrixSectionFilter();
        
        // Update data tabel berdasarkan mode yang dipilih
        loadSkillMatrixData();
        
        // Simpan mode yang dipilih ke localStorage
        localStorage.setItem('selectedSkillMatrixMode', selectedMode);
    }
}

// Fungsi untuk load mode yang tersimpan saat halaman dimuat
function initializeSkillMatrixMode() {
    const savedMode = localStorage.getItem('selectedSkillMatrixMode') || 'comp-assy';
    const modeSelect = document.getElementById('skillMatrixModeSelect');
    
    if (modeSelect) {
        modeSelect.value = savedMode;
        updateSkillMatrixHeaders(savedMode);
    }
}

// Tambahkan ke window object agar bisa diakses dari HTML
window.handleSkillMatrixModeChange = handleSkillMatrixModeChange;
window.initializeSkillMatrixMode = initializeSkillMatrixMode;

function handleEvaluationModeChange() {
    const modeSelect = document.getElementById('evaluationMode');
    const positionSelect = document.getElementById('position');
    const skillContainer = document.getElementById('skillEvaluationContainer');
    const selectedMode = modeSelect.value;
    
    // Jangan reset position dropdown saat edit
    if (!window.editingSkillMatrix) {
        // Reset position dropdown hanya untuk tambah baru
        positionSelect.innerHTML = '<option value="">-- Pilih Pos --</option>';
    }
    
    // Reset skill container
    skillContainer.innerHTML = '<p class="text-muted">Pilih mode dan posisi terlebih dahulu</p>';
    
    if (!selectedMode) {
        return;
    }
    
    // Populate position dropdown based on selected mode (hanya untuk tambah baru)
    if (!window.editingSkillMatrix) {
        const availablePositions = modePositions[selectedMode] || [];
        availablePositions.forEach(positionValue => {
            const option = document.createElement('option');
            option.value = positionValue;
            option.textContent = positionDisplayNames[positionValue] || positionValue;
            positionSelect.appendChild(option);
        });
    }
    
    const modeConfig = evaluationModeSkills[selectedMode];
    if (!modeConfig) return;
    
    // Generate skill tabs berdasarkan mode
    const skillTabs = generateSkillTabsForMode(modeConfig);
    skillContainer.innerHTML = skillTabs;
    
    // Re-initialize event listeners
    initializeSkillInputs();
}

function generateSkillTabsForMode(modeConfig) {
    const { totalSkills, name } = modeConfig;
    
    if (totalSkills <= 15) {
        // Untuk Comp Wclutch (12 skill) - hanya 1 tab
        return `
            <div class="skill-tabs">
                <div class="tab-buttons">
                    <button type="button" class="tab-btn active" onclick="showSkillTab(1)">${name} - Skill 1-${totalSkills}</button>
                </div>
                <div class="tab-content">
                    <div id="skill-tab-1" class="skill-tab active">
                        ${generateSkillInputsForMode(1, totalSkills, modeConfig)}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Untuk Comp Assy (47 skill) - 3 tab seperti sekarang
        return `
            <div class="skill-tabs">
                <div class="tab-buttons">
                    <button type="button" class="tab-btn active" onclick="showSkillTab(1)">Skill 1-15</button>
                    <button type="button" class="tab-btn" onclick="showSkillTab(2)">Skill 16-30</button>
                    <button type="button" class="tab-btn" onclick="showSkillTab(3)" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; transition: all 0.3s ease;">Skill 31-47 ⭐</button>
                </div>
                <div class="tab-content">
                    <div id="skill-tab-1" class="skill-tab active">
                        ${generateSkillInputsForMode(1, 15, modeConfig)}
                    </div>
                    <div id="skill-tab-2" class="skill-tab">
                        ${generateSkillInputsForMode(16, 30, modeConfig)}
                    </div>
                    <div id="skill-tab-3" class="skill-tab">
                        ${generateSkillInputsForMode(31, 47, modeConfig)}
                    </div>
                </div>
            </div>
        `;
    }
}

// New function to generate skill inputs with specific mode configuration
function generateSkillInputsForMode(start, end, modeConfig) {
    const { skillNames } = modeConfig;
    
    let skillInputs = '';
    for (let i = start; i <= end; i++) {
        const skillName = skillNames[i-1] || `Skill ${i}`;
        skillInputs += `
            <div class="form-group">
                <label for="skill${i}">${skillName} *</label>
                <div class="skill-input-container">
                    <input type="number" id="skill${i}" name="skill${i}" min="0" max="4" value="0" required>
                    <div class="skill-preview" id="skill${i}-preview"></div>
                </div>
            </div>`;
    }
    return skillInputs;
}

function initializeSkillInputs() {
    // Initialize all skill number inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            const value = parseInt(this.value) || 0;
            const preview = this.parentElement.querySelector('.skill-preview');
            
            // Ensure value is within range
            if (value < 0) this.value = 0;
            if (value > 4) this.value = 4;
            
            if (preview) {
                preview.innerHTML = createSkillRatingHTML(parseInt(this.value));
            }
        });
        
        // Trigger initial update
        input.dispatchEvent(new Event('input'));
    });
}



// Function untuk filter skill berdasarkan posisi (hanya untuk tambah baru)
function filterSkillsByPosition() {
    const positionSelect = document.getElementById('position');
    const modeSelect = document.getElementById('evaluationMode');
    const selectedPosition = positionSelect.value;
    const selectedMode = modeSelect.value;
    const skillContainer = document.getElementById('skillEvaluationContainer');
    
    if (!selectedPosition || !selectedMode) {
        skillContainer.innerHTML = '<p class="text-muted">Pilih mode dan posisi terlebih dahulu</p>';
        return;
    }
    
    // Use the mode configuration for skill names
    const modeConfig = evaluationModeSkills[selectedMode];
    if (!modeConfig) return;
    
    const relevantSkills = positionSkillMapping[selectedPosition] || [];
    
    if (relevantSkills.length === 0) {
        skillContainer.innerHTML = '<p class="text-muted">Tidak ada skill khusus untuk posisi ini</p>';
        return;
    }
    
    // Generate skill inputs using the correct skill names for the mode
    let skillInputsHTML = '<div class="relevant-skills">';
    skillInputsHTML += `<h5>Skill untuk posisi: ${positionSelect.options[positionSelect.selectedIndex].text}</h5>`;
    
    relevantSkills.forEach(skillIndex => {
        const skillName = modeConfig.skillNames[skillIndex-1] || `Skill ${skillIndex}`;
        skillInputsHTML += `
            <div class="form-group">
                <label for="skill${skillIndex}">${skillName} *</label>
                <div class="skill-input-container">
                    <input type="number" id="skill${skillIndex}" name="skill${skillIndex}" min="0" max="4" value="0" required>
                    <div class="skill-preview" id="skill${skillIndex}-preview"></div>
                </div>
            </div>`;
    });
    
    skillInputsHTML += '</div>';
    skillContainer.innerHTML = skillInputsHTML;
    
    // Initialize skill inputs
    document.querySelectorAll('#skillEvaluationContainer input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            const value = parseInt(this.value) || 0;
            const preview = this.parentElement.querySelector('.skill-preview');
            
            // Ensure value is within range
            if (value < 0) this.value = 0;
            if (value > 4) this.value = 4;
            
            preview.innerHTML = createSkillRatingHTML(parseInt(this.value));
        });
        
        // Trigger initial update
        input.dispatchEvent(new Event('input'));
    });
}

// Function untuk handle perubahan posisi (membedakan tambah vs edit)
function handlePositionChange() {
    // Jika sedang edit, jangan generate ulang skill tabs
    if (window.editingSkillMatrix) {
        return; // Tidak melakukan apa-apa saat edit
    }
    
    const modeSelect = document.getElementById('evaluationMode');
    const positionSelect = document.getElementById('position');
    const skillContainer = document.getElementById('skillEvaluationContainer');
    
    const selectedMode = modeSelect.value;
    const selectedPosition = positionSelect.value;
    
    if (!selectedMode || !selectedPosition) {
        skillContainer.innerHTML = '<p class="text-muted">Pilih mode dan posisi terlebih dahulu</p>';
        return;
    }
    
    const modeConfig = evaluationModeSkills[selectedMode];
    if (!modeConfig) return;
    
    // Generate skill tabs berdasarkan mode dan posisi yang dipilih
    const skillTabs = generateSkillTabsForMode(modeConfig);
    skillContainer.innerHTML = skillTabs;
    
    // Re-initialize event listeners
    initializeSkillInputs();
    
    // Highlight skill yang sesuai dengan posisi saat ini
    highlightCurrentPositionSkill(selectedMode, selectedPosition);
}

// Fungsi baru untuk highlight skill sesuai posisi saat ini
function highlightCurrentPositionSkill(mode, position) {
    // Cari index skill yang sesuai dengan posisi
    const modeConfig = evaluationModeSkills[mode];
    if (!modeConfig) return;
    
    // Untuk Comp Assy, posisi sesuai dengan urutan skill
    if (mode === 'comp-assy') {
        const positionIndex = modePositions['comp-assy'].indexOf(position);
        if (positionIndex !== -1) {
            const skillNumber = positionIndex + 1;
            highlightSkillInput(skillNumber);
        }
    }
    // Untuk Comp WClutch, posisi sesuai dengan urutan skill
    else if (mode === 'comp-wclutch') {
        const positionIndex = modePositions['comp-wclutch'].indexOf(position);
        if (positionIndex !== -1) {
            const skillNumber = positionIndex + 1;
            highlightSkillInput(skillNumber);
        }
    }
}

// Fungsi untuk highlight skill input
function highlightSkillInput(skillNumber) {
    const skillInput = document.getElementById(`skill${skillNumber}`);
    if (skillInput) {
        const formGroup = skillInput.closest('.form-group');
        if (formGroup) {
            // Tambahkan class highlight
            formGroup.classList.add('current-position-highlight');
            
            // Scroll ke skill yang di-highlight
            setTimeout(() => {
                formGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
}

// ===== OVERTIME SPECIFIC FUNCTIONS =====
function saveOvertime(formData) {
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    
    const newOvertime = {
        id: window.editingRow ? window.editingRow.id : generateOvertimeId(),
        npk: formData.get('npk'),
        nama: formData.get('nama'),
        section: formData.get('section'),
        line: formData.get('line'),
        leader: formData.get('leader'),
        tanggal: formData.get('tanggal'),
        shift: formData.get('shift'),
        jamMulai: formData.get('jamMulai'),
        jamSelesai: formData.get('jamSelesai'),
        totalJam: parseFloat(formData.get('totalJam')) || 0,
        jenisOvertime: formData.get('jenisOvertime'),
        keterangan: formData.get('keterangan'),
        approvedBy: formData.get('approvedBy'),
        status: formData.get('status'),
        createdAt: window.editingRow ? window.editingRow.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!newOvertime.npk || !newOvertime.nama || !newOvertime.tanggal || 
        !newOvertime.jamMulai || !newOvertime.jamSelesai) {
        showNotification('Mohon lengkapi semua field yang wajib diisi!', 'error');
        return;
    }
    
    // Validate time logic
    if (newOvertime.totalJam <= 0) {
        showNotification('Total jam overtime harus lebih dari 0!', 'error');
        return;
    }
    
    if (window.editingRow) {
        // Update existing overtime
        const index = overtimeData.findIndex(item => item.id === window.editingRow.id);
        if (index !== -1) {
            overtimeData[index] = newOvertime;
            showNotification('Data overtime berhasil diupdate!', 'success');
        }
    } else {
        // Add new overtime
        overtimeData.push(newOvertime);
        showNotification('Data overtime berhasil ditambahkan!', 'success');
    }
    
    saveToLocalStorage(STORAGE_KEYS.overtime, overtimeData);
    loadOvertimeData();
    
    // Reset editing state
    window.editingRow = null;
    window.currentModule = null;
}

function generateOvertimeId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `OT${timestamp}${random}`;
}

function loadOvertimeData() {
    console.log('Loading overtime data...');
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    const tableBody = document.getElementById('overtimeTableBody');
    
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    console.log('Found', overtimeData.length, 'overtime records');
    
    // Apply filters
    const dateFilter = document.getElementById('overtimeDateFilter')?.value || '';
    const sectionFilter = document.getElementById('overtimeSectionFilter')?.value || '';
    const searchTerm = document.getElementById('overtimeSearch')?.value.toLowerCase() || '';
    
    let filteredData = [...overtimeData];
    
    // Filter by date (month/year)
    if (dateFilter) {
        const [year, month] = dateFilter.split('-');
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate.getFullYear() == year && (itemDate.getMonth() + 1) == month;
        });
    }
    
    // Filter by section
    if (sectionFilter) {
        filteredData = filteredData.filter(item => item.section === sectionFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            (item.npk || '').toLowerCase().includes(searchTerm) ||
            (item.nama || '').toLowerCase().includes(searchTerm) ||
            (item.section || '').toLowerCase().includes(searchTerm) ||
            (item.line || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date (newest first)
    filteredData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    console.log('Filtered data:', filteredData.length, 'records');
    
    tableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
                    <div style="font-size: 16px; font-weight: 600;">Tidak ada data overtime</div>
                    <div style="font-size: 14px; margin-top: 5px;">Klik tombol "+ Input Overtime" untuk menambah data</div>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${item.npk || '-'}</strong></td>
            <td>${item.nama || '-'}</td>
            <td><span class="badge badge-secondary">${item.section || '-'}</span></td>
            <td>${item.line || '-'}</td>
            <td>${formatDate(item.tanggal)}</td>
            <td><span class="badge badge-info">${item.shift || '-'}</span></td>
            <td><strong>${item.totalJam || 0} jam</strong></td>
            <td><strong>${item.totalJam || 0} jam</strong></td>
            <td><span class="badge jenis-${(item.jenisOvertime || 'normal').toLowerCase()}">${item.jenisOvertime || 'Normal'}</span></td>
            <td><span class="badge status-${(item.status || 'pending').toLowerCase()}">${item.status || 'Pending'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewOvertimeDetail('${item.id}')" title="Lihat Detail">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editOvertime('${item.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOvertime('${item.id}')" title="Hapus">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update summary after loading data
    updateOvertimeSummary();
    console.log('Overtime data loaded successfully');
}

function editOvertime(id) {
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    const overtime = overtimeData.find(item => item.id === id);
    
    if (!overtime) {
        showNotification('Data overtime tidak ditemukan!', 'error');
        return;
    }
    
    window.editingRow = overtime;
    window.currentModule = 'overtime';
    openModal('overtime');
    
    // Fill form after modal opens
    setTimeout(() => {
        document.getElementById('modal-npk').value = overtime.npk;
        document.getElementById('modal-nama').value = overtime.nama;
        document.getElementById('modal-section').value = overtime.section;
        document.getElementById('modal-line').value = overtime.line;
        document.getElementById('modal-leader').value = overtime.leader;
        document.getElementById('modal-tanggal').value = overtime.tanggal;
        document.getElementById('modal-shift').value = overtime.shift;
        document.getElementById('modal-jamMulai').value = overtime.jamMulai;
        document.getElementById('modal-jamSelesai').value = overtime.jamSelesai;
        document.getElementById('modal-totalJam').value = overtime.totalJam;
        document.getElementById('modal-jenisOvertime').value = overtime.jenisOvertime;
        document.getElementById('modal-keterangan').value = overtime.keterangan;
        document.getElementById('modal-approvedBy').value = overtime.approvedBy;
        document.getElementById('modal-status').value = overtime.status;
    }, 200);
}

function deleteOvertime(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data overtime ini?')) {
        return;
    }
    
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    const filteredData = overtimeData.filter(item => item.id !== id);
    
    saveToLocalStorage(STORAGE_KEYS.overtime, filteredData);
    loadOvertimeData();
    showNotification('Data overtime berhasil dihapus!', 'success');
}

function viewOvertimeDetail(id) {
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    const overtime = overtimeData.find(item => item.id === id);
    
    if (!overtime) {
        showNotification('Data overtime tidak ditemukan!', 'error');
        return;
    }
    
    const detailHtml = `
        <div class="overtime-detail">
            <h4>📋 Detail Overtime</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>NPK:</strong> ${overtime.npk}
                </div>
                <div class="detail-item">
                    <strong>Nama:</strong> ${overtime.nama}
                </div>
                <div class="detail-item">
                    <strong>Section:</strong> ${overtime.section}
                </div>
                <div class="detail-item">
                    <strong>Line:</strong> ${overtime.line}
                </div>
                <div class="detail-item">
                    <strong>Leader:</strong> ${overtime.leader}
                </div>
                <div class="detail-item">
                    <strong>Tanggal:</strong> ${formatDate(overtime.tanggal)}
                </div>
                <div class="detail-item">
                    <strong>Shift:</strong> ${overtime.shift}
                </div>
                <div class="detail-item">
                    <strong>Jam:</strong> ${overtime.jamMulai} - ${overtime.jamSelesai}
                </div>
                <div class="detail-item">
                    <strong>Total Jam:</strong> ${overtime.totalJam} jam
                </div>
                <div class="detail-item">
                    <strong>Jenis:</strong> ${overtime.jenisOvertime}
                </div>
                <div class="detail-item">
                    <strong>Status:</strong> ${overtime.status}
                </div>
                <div class="detail-item">
                    <strong>Disetujui Oleh:</strong> ${overtime.approvedBy || '-'}
                </div>
                <div class="detail-item full-width">
                    <strong>Keterangan:</strong><br>
                    ${overtime.keterangan || '-'}
                </div>
                <div class="detail-item">
                    <strong>Dibuat:</strong> ${formatDateTime(overtime.createdAt)}
                </div>
                <div class="detail-item">
                    <strong>Diupdate:</strong> ${formatDateTime(overtime.updatedAt)}
                </div>
            </div>
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = 'Detail Overtime';
    modalBody.innerHTML = detailHtml;
    modal.style.display = 'block';
}

function updateOvertimeSummary(data) {
    const summaryElement = document.getElementById('overtimeSummary');
    if (!summaryElement) {
        // If no data parameter provided, use current month data
        if (!data) {
            const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
            const currentMonth = new Date().toISOString().slice(0, 7);
            data = overtimeData.filter(item => {
                const itemDate = new Date(item.tanggal);
                return itemDate.toISOString().slice(0, 7) === currentMonth;
            });
        }
        return;
    }
    
    // If no data parameter provided, use current month data
    if (!data) {
        const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
        const currentMonth = new Date().toISOString().slice(0, 7);
        data = overtimeData.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate.toISOString().slice(0, 7) === currentMonth;
        });
    }
    
    const totalRecords = data.length;
    const totalHours = data.reduce((sum, item) => sum + (parseFloat(item.totalJam) || 0), 0);
    const pendingCount = data.filter(item => item.status === 'Pending').length;
    const approvedCount = data.filter(item => item.status === 'Approved').length;
    
    summaryElement.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Total Records:</span>
                <span class="summary-value">${totalRecords}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Jam:</span>
                <span class="summary-value">${totalHours.toFixed(1)}h</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Pending:</span>
                <span class="summary-value pending">${pendingCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Approved:</span>
                <span class="summary-value approved">${approvedCount}</span>
            </div>
        </div>
    `;
}

// ===== OVERTIME HELPER FUNCTIONS =====
function openOvertimeModal() {
    window.currentModule = 'overtime';
    openModal('overtime');
}

// ===== OVERTIME FILTER FUNCTIONS =====
function initializeOvertimeFilters() {
    console.log('Initializing overtime filters...');
    
    // Initialize section filter for overtime section
    const sectionFilter = document.getElementById('overtimeSectionFilter');
    if (sectionFilter) {
        const employees = getFromLocalStorage(STORAGE_KEYS.employees);
        const sections = [...new Set(employees.map(emp => emp.section))].filter(Boolean).sort();
        
        sectionFilter.innerHTML = '<option value="">Semua Section</option>';
        sections.forEach(section => {
            sectionFilter.innerHTML += `<option value="${section}">${section}</option>`;
        });
        console.log('Section filter initialized with', sections.length, 'sections');
    }
    
    // Initialize modal section filter for form
    const modalSectionFilter = document.getElementById('modal-sectionFilter');
    const lineFilter = document.getElementById('modal-lineFilter');
    const employeeSelect = document.getElementById('modal-employeeSelect');
    
    if (modalSectionFilter && lineFilter && employeeSelect) {
        // Populate section filter
        const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || '[]');
        const sections = [...new Set(employees.map(emp => emp.section))].filter(Boolean).sort();
        
        modalSectionFilter.innerHTML = '<option value="">Pilih Section</option>';
        sections.forEach(section => {
            modalSectionFilter.innerHTML += `<option value="${section}">${section}</option>`;
        });
    }
    
    // Set default date filter to current month
    const dateFilter = document.getElementById('overtimeDateFilter');
    if (dateFilter) {
        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format
        dateFilter.value = currentMonth;
        console.log('Date filter set to:', currentMonth);
    }
    
    // Initialize summary
    updateOvertimeSummary();
    
    // Load initial data
    loadOvertimeData();
    console.log('Overtime filters initialization complete');
}

function filterOvertimeData() {
    loadOvertimeData();
}

function searchOvertimeData() {
    loadOvertimeData();
}

function resetOvertimeFilters() {
    document.getElementById('overtimeDateFilter').value = '';
    document.getElementById('overtimeSectionFilter').value = '';
    document.getElementById('overtimeSearch').value = '';
    loadOvertimeData();
}

function exportOvertimeData() {
    const overtimeData = getFromLocalStorage(STORAGE_KEYS.overtime);
    
    if (overtimeData.length === 0) {
        showNotification('Tidak ada data overtime untuk diekspor!', 'warning');
        return;
    }
    
    // Apply current filters
    const dateFilter = document.getElementById('overtimeDateFilter')?.value || '';
    const sectionFilter = document.getElementById('overtimeSectionFilter')?.value || '';
    const searchTerm = document.getElementById('overtimeSearch')?.value.toLowerCase() || '';
    
    let filteredData = overtimeData;
    
    if (dateFilter) {
        const [year, month] = dateFilter.split('-');
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate.getFullYear() == year && (itemDate.getMonth() + 1) == month;
        });
    }
    
    if (sectionFilter) {
        filteredData = filteredData.filter(item => item.section === sectionFilter);
    }
    
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.npk.toLowerCase().includes(searchTerm) ||
            item.nama.toLowerCase().includes(searchTerm) ||
            item.section.toLowerCase().includes(searchTerm) ||
            item.line.toLowerCase().includes(searchTerm)
        );
    }
    
    // Create CSV content
    const headers = [
        'No', 'NPK', 'Nama', 'Section', 'Line', 'Leader', 'Tanggal', 'Shift',
        'Jam Mulai', 'Jam Selesai', 'Total Jam', 'Jenis Overtime', 'Keterangan',
        'Disetujui Oleh', 'Status', 'Dibuat', 'Diupdate'
    ];
    
    const csvContent = [
        headers.join(','),
        ...filteredData.map((item, index) => [
            index + 1,
            item.npk,
            `"${item.nama}"`,
            `"${item.section}"`,
            `"${item.line}"`,
            `"${item.leader}"`,
            item.tanggal,
            `"${item.shift}"`,
            item.jamMulai,
            item.jamSelesai,
            item.totalJam,
            `"${item.jenisOvertime}"`,
            `"${item.keterangan || ''}"`,
            `"${item.approvedBy || ''}"`,
            `"${item.status}"`,
            formatDateTime(item.createdAt),
            formatDateTime(item.updatedAt)
        ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `overtime_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data overtime berhasil diekspor!', 'success');
}

// Quick filter functions
function filterOvertimeToday() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('overtimeDateFilter').value = today;
    loadOvertimeData();
}

function filterOvertimeThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    // For simplicity, we'll filter by current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('overtimeDateFilter').value = currentMonth;
    loadOvertimeData();
}

function filterOvertimeThisMonth() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('overtimeDateFilter').value = currentMonth;
    loadOvertimeData();
}

function updateOvertimeLineFilter() {
    const sectionFilter = document.getElementById('modal-sectionFilter');
    const lineFilter = document.getElementById('modal-lineFilter');
    const employeeSelect = document.getElementById('modal-employeeSelect');
    
    const selectedSection = sectionFilter.value;
    
    if (!selectedSection) {
        lineFilter.disabled = true;
        employeeSelect.disabled = true;
        lineFilter.innerHTML = '<option value="">Pilih Line</option>';
        employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || '[]');
    const lines = [...new Set(employees.filter(emp => emp.section === selectedSection).map(emp => emp.line))].sort();
    
    lineFilter.disabled = false;
    lineFilter.innerHTML = '<option value="">Pilih Line</option>';
    lines.forEach(line => {
        lineFilter.innerHTML += `<option value="${line}">${line}</option>`;
    });
    
    employeeSelect.disabled = true;
    employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
}

function updateOvertimeEmployeeFilter() {
    const sectionFilter = document.getElementById('modal-sectionFilter');
    const lineFilter = document.getElementById('modal-lineFilter');
    const employeeSelect = document.getElementById('modal-employeeSelect');
    
    const selectedSection = sectionFilter.value;
    const selectedLine = lineFilter.value;
    
    if (!selectedSection || !selectedLine) {
        employeeSelect.disabled = true;
        employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || '[]');
    const filteredEmployees = employees.filter(emp => 
        emp.section === selectedSection && emp.line === selectedLine
    ).sort((a, b) => a.nama.localeCompare(b.nama));
    
    employeeSelect.disabled = false;
    employeeSelect.innerHTML = '<option value="">Pilih Karyawan</option>';
    filteredEmployees.forEach(employee => {
        employeeSelect.innerHTML += `<option value="${employee.npk}">${employee.npk} - ${employee.nama}</option>`;
    });
}

function autoFillEmployeeOvertime() {
    const select = document.getElementById('modal-employeeSelect');
    const selectedNpk = select.value;
    
    if (!selectedNpk) {
        clearOvertimeEmployeeFields();
        return;
    }
    
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || '[]');
    const employee = employees.find(emp => emp.npk === selectedNpk);
    
    if (employee) {
        document.getElementById('modal-npk').value = employee.npk;
        document.getElementById('modal-nama').value = employee.nama;
        document.getElementById('modal-section').value = employee.section;
        document.getElementById('modal-line').value = employee.line;
        document.getElementById('modal-leader').value = employee.leader;
    } else {
        clearOvertimeEmployeeFields();
    }
}

function clearOvertimeEmployeeFields() {
    const fields = ['modal-npk', 'modal-nama', 'modal-section', 'modal-line', 'modal-leader'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

function calculateOvertimeHours() {
    const jamMulai = document.getElementById('modal-jamMulai').value;
    const jamSelesai = document.getElementById('modal-jamSelesai').value;
    const totalJamField = document.getElementById('modal-totalJam');
    
    if (!jamMulai || !jamSelesai) {
        totalJamField.value = '';
        return;
    }
    
    const [startHour, startMinute] = jamMulai.split(':').map(Number);
    const [endHour, endMinute] = jamSelesai.split(':').map(Number);
    
    let startTime = startHour + startMinute / 60;
    let endTime = endHour + endMinute / 60;
    
    // Handle overnight overtime
    if (endTime < startTime) {
        endTime += 24;
    }
    
    const totalHours = endTime - startTime;
    totalJamField.value = totalHours.toFixed(1);
}

// Export skill matrix to CSV
function exportSkillMatrixToCSV() {
    const currentMode = document.getElementById('skillMatrixModeSelect')?.value || 'comp-assy';
    const modeConfig = evaluationModeSkills[currentMode];
    const sectionFilter = document.getElementById('skillMatrixSectionFilter')?.value || 'all';
    const lineFilter = document.getElementById('skillMatrixLineFilter')?.value || 'all';
    const searchTerm = document.getElementById('skillMatrixSearch')?.value.toLowerCase() || '';
    
    // Get and filter data same as displaySkillMatrixData function
    let filteredData = allSkillMatrix;
    
    // Filter by mode
    filteredData = filteredData.filter(data => {
        if (!data.evaluationMode) {
            if (data.section && data.section.toLowerCase().includes('wclutch')) {
                data.evaluationMode = 'comp-wclutch';
            } else {
                data.evaluationMode = 'comp-assy';
            }
        }
        return data.evaluationMode === currentMode;
    });
    
    // Apply filters
    if (sectionFilter !== 'all') {
        filteredData = filteredData.filter(item => item.section === sectionFilter);
    }
    
    if (lineFilter !== 'all') {
        filteredData = filteredData.filter(item => item.line === lineFilter);
    }
    
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.nama.toLowerCase().includes(searchTerm) ||
            item.npk.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredData.length === 0) {
        showNotification('Tidak ada data skill matrix untuk diekspor!', 'error');
        return;
    }
    
    // Sort by NPK
    filteredData.sort((a, b) => {
        const npkA = parseInt(a.npk) || 0;
        const npkB = parseInt(b.npk) || 0;
        return skillMatrixSortDirection === 'asc' ? npkA - npkB : npkB - npkA;
    });
    
    // Create headers
    const basicHeaders = ['No', 'NPK', 'Nama', 'Section', 'Line', 'Position'];
    
    // Add skill headers based on mode
    const skillHeaders = [];
    if (modeConfig && modeConfig.skills) {
        modeConfig.skills.forEach(skillIndex => {
            skillHeaders.push(`Skill ${skillIndex}`);
        });
    } else {
        // Fallback for backward compatibility
        for (let i = 1; i <= 47; i++) {
            skillHeaders.push(`Skill ${i}`);
        }
    }
    
    const headers = [...basicHeaders, ...skillHeaders];
    const csvContent = [headers.join(',')];
    
    // Position mapping for display
    const positionMap = {
        'mizusumashi-towing': 'Mizusumashi Towing',
        'mizusumashi-shaft': 'Mizusumashi Shaft',
        'pre-check': 'Pre Check',
        'part-washing-big-part-in': 'Part Washing Big Part (IN)',
        'part-washing-inner-part-in': 'Part Washing Inner Part (IN)',
        'pass-room-prepare-piston': 'Pass Room (Prepare Piston)',
        'pass-room-prepare-gasket': 'Pass Room (Prepare Gasket)',
        'prepare-thrust-bearing': 'Prepare Thrust Bearing',
        'prepare-oring-prv': 'Prepare Oring PRV',
        'bearing-assy': 'Bearing Assy',
        'bushing-assy': 'Bushing Assy',
        'mizusumashi-assy': 'Mizusumashi Assy',
        'part-washing-inner-part-out-lip-seal': 'Part Washing Inner Part (OUT) LIP Seal Assy',
        'part-washing-inner-part-out': 'Part Washing Inner Part (OUT)',
        'prv-assy': 'PRV Assy',
        'piston-swash': 'Piston & Swash Measuring',
        'shoe-selecting': 'Shoe Selecting',
        'cylinder-block': 'Cylinder Block Assy',
        'shoe-clearance-muffler-bolt': 'Shoe Clearance & Muffler Bolt',
        'qr-code-label-press-pin': 'QR Code Label Assy & Press Pin',
        'front-side-assy': 'Front Side Assy',
        'front-housing-assy': 'Front Housing Assy',
        'rear-housing-assy': 'Rear Housing Assy',
        'housing-bolt': 'Housing Bolt',
        'bolt-tightening': 'Bolt Tightening',
        'concentricity-torque-check': 'Concentricity Check & Torque Check',
        'empty-weight-dummy-assy': 'Empty Weight & Dummy Assy',
        'vacuum-gas-charging': 'Vacuum & Gas Charging',
        'helium-leak-test': 'Helium Leak Test',
        'high-pressure-check': 'High Pressure Check',
        'performance-test': 'Performance Test',
        'release-dummy': 'Release Dummy',
        'pre-oil-oil-filling': 'Pre Oil & Oil Filling',
        'seal-cap-assy': 'Seal Cap Assy',
        'flange-assy': 'Flange Assy',
        'air-leak-test': 'Air Leak Test',
        'gas-release': 'Gas Release',
        'seal-cap-assy-2': 'Seal Cap Assy 2',
        'final-washing': 'Final Washing',
        'name-plate-assy': 'Name Plate Assy',
        'thermal-sensor': 'Thermal Sensor',
        'felt-assy': 'Felt Assy',
        'foot-boshi-check': 'Foot & Boshi Check',
        'robot-final-check': 'Robot Final Check',
        'taking-laser-name-plate': 'Taking & Laser Name Plate',
        'repair-shoe-clearance': 'Repair Shoe Clearance',
        'repair-dipping': 'Repair Dipping'
    };
    
    // Add data rows
    filteredData.forEach((item, index) => {
        const positionDisplay = positionMap[item.position] || item.position || '-';
        const basicData = [
            index + 1,
            item.npk,
            `"${item.nama}"`,
            `"${item.section}"`,
            `"${item.line}"`,
            `"${positionDisplay}"`
        ];
        
        // Add skill values
        const skillData = [];
        if (modeConfig && modeConfig.skills) {
            modeConfig.skills.forEach(skillIndex => {
                const skillValue = item.skills && item.skills[`skill${skillIndex}`] ? item.skills[`skill${skillIndex}`] : 0;
                skillData.push(skillValue);
            });
        } else {
            // Fallback for backward compatibility
            for (let i = 1; i <= 47; i++) {
                const skillValue = item.skills && item.skills[`skill${i}`] ? item.skills[`skill${i}`] : 0;
                skillData.push(skillValue);
            }
        }
        
        const row = [...basicData, ...skillData];
        csvContent.push(row.join(','));
    });
    
    // Create and download file
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Create filename with current filters
    let filename = `skill_matrix_${currentMode}`;
    if (sectionFilter !== 'all') {
        filename += `_${sectionFilter.replace(/\s+/g, '_')}`;
    }
    if (lineFilter !== 'all') {
        filename += `_${lineFilter.replace(/\s+/g, '_')}`;
    }
    filename += `_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data skill matrix berhasil diekspor!', 'success');
}

// Make functions globally available
window.filterEndContractByMonth = filterEndContractByMonth;
window.updateSkillMatrixSectionFilter = updateSkillMatrixSectionFilter;
window.filterSkillMatrix = filterSkillMatrix;
window.createSkillMatrixRowForMode = createSkillMatrixRowForMode;
window.exportSkillMatrixToCSV = exportSkillMatrixToCSV;

// Tambahkan ke bagian window functions
window.createSearchableDropdown = createSearchableDropdown;
window.filterSkillsByPosition = filterSkillsByPosition;
window.handlePositionChange = handlePositionChange;
window.positionSkillMapping = positionSkillMapping;
window.handleEvaluationModeChange = handleEvaluationModeChange;
window.generateSkillTabsForMode = generateSkillTabsForMode;
window.generateSkillInputsForMode = generateSkillInputsForMode;
window.initializeSkillInputs = initializeSkillInputs;
window.updateSkillMatrixHeaders = updateSkillMatrixHeaders;
window.handleSkillMatrixModeChange = handleSkillMatrixModeChange;
window.initializeSkillMatrixMode = initializeSkillMatrixMode;
window.smartSearchMP = smartSearchMP;
window.filterSkillMatrixData = filterSkillMatrixData;
window.updateSearchResultCounter = updateSearchResultCounter;
window.populateLineFilter = populateLineFilter;
window.highlightCurrentPositionSkill = highlightCurrentPositionSkill;
window.highlightSkillInput = highlightSkillInput;
window.modePositions = modePositions;
window.positionDisplayNames = positionDisplayNames;

// Global functions
window.editOvertime = editOvertime;
window.deleteOvertime = deleteOvertime;
window.viewOvertimeDetail = viewOvertimeDetail;
window.loadOvertimeData = loadOvertimeData;

// Filter Education by Date
function filterEducationByDate() {
    const dateFilter = document.getElementById('educationDateFilter').value;
    
    if (dateFilter) {
        // Clear month-year filter when date filter is used
        document.getElementById('educationMonthYearFilter').value = 'all';
    }
    
    filterEducationData();
}

// Filter Education by Month
function filterEducationByMonth() {
    const monthYearFilter = document.getElementById('educationMonthYearFilter').value;
    
    if (monthYearFilter !== 'all') {
        // Clear date filter when month-year filter is used
        document.getElementById('educationDateFilter').value = '';
    }
    
    filterEducationData();
}

// Clear Education Date Filter
function clearEducationDateFilter() {
    document.getElementById('educationDateFilter').value = '';
    document.getElementById('educationMonthYearFilter').value = 'all';
    filterEducationData();
    showNotification('Filter tanggal dibersihkan', 'info');
}

// Populate Education Month-Year Filter
function populateEducationMonthYearFilter() {
    const education = getFromLocalStorage(STORAGE_KEYS.education);
    const monthYearSet = new Set();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    education.forEach(item => {
        if (item.dateEdukasi) {
            const date = new Date(item.dateEdukasi);
            const monthYear = monthNames[date.getMonth()] + '-' + date.getFullYear().toString().slice(-2);
            monthYearSet.add(monthYear);
        }
    });
    
    const filter = document.getElementById('educationMonthYearFilter');
    if (filter) {
        // Keep the "Semua Periode" option and clear others
        filter.innerHTML = '<option value="all">Semua Periode</option>';
        
        // Sort and add month-year options
        Array.from(monthYearSet).sort().forEach(monthYear => {
            filter.innerHTML += `<option value="${monthYear}">${monthYear}</option>`;
        });
    }
}

// Add these to the existing window assignments
window.filterEducationByDate = filterEducationByDate;
window.filterEducationByMonth = filterEducationByMonth;
window.clearEducationDateFilter = clearEducationDateFilter;
window.populateEducationMonthYearFilter = populateEducationMonthYearFilter;

// Overtime functions
window.openOvertimeModal = openOvertimeModal;
window.updateOvertimeLineFilter = updateOvertimeLineFilter;
window.updateOvertimeEmployeeFilter = updateOvertimeEmployeeFilter;
window.autoFillEmployeeOvertime = autoFillEmployeeOvertime;
window.calculateOvertimeHours = calculateOvertimeHours;
window.saveOvertime = saveOvertime;

// Overtime filter functions
window.filterOvertimeData = filterOvertimeData;
window.searchOvertimeData = searchOvertimeData;
window.resetOvertimeFilters = resetOvertimeFilters;
window.exportOvertimeData = exportOvertimeData;
window.filterOvertimeToday = filterOvertimeToday;
window.filterOvertimeThisWeek = filterOvertimeThisWeek;
window.filterOvertimeThisMonth = filterOvertimeThisMonth;
window.initializeOvertimeFilters = initializeOvertimeFilters;



console.log('Keyboard shortcuts: Ctrl+N (Add), Ctrl+E (Export), Ctrl+B (Backup), Ctrl+S (Save), Esc (Close)');
console.log('📊 Charts: Section, Status, Gender, Employee Type (Tetap vs Kontrak)');
console.log('🆕 New Features: NPK Format 001/002/003, Employee Type, Enhanced End Contract with auto-select kontrak employees');
console.log('🎓 Education Module: Employee integration, PDF upload, auto date planning (6 months), proses tracking');
console.log('🔧 Fixed: Database MP input form, NPK validation, Auto-populate contract employees');