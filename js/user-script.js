// User Dashboard Script - Read-only version with real data
// Initialize User Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeUserDashboard();
    updateDashboardStats();
    initializeCharts();
    loadEducationScheduleData();
    initializeScheduleMonthYearFilter();
    setupNavigation();
});

// Navigation Setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.add('hidden'));
            
            // Show selected section
            const targetSection = this.getAttribute('data-section');
            const section = document.getElementById(targetSection + '-section');
            if (section) {
                section.classList.remove('hidden');
            }
            
            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (targetSection === 'dashboard') {
                pageTitle.textContent = 'Dashboard';
            } else if (targetSection === 'education-schedule') {
                pageTitle.textContent = 'Jadwal Edukasi';
            }
        });
    });
}

function initializeUserDashboard() {
    console.log('User Dashboard initialized');
    
    // Set current date
    const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Add date display to header if needed
    const header = document.querySelector('.header');
    if (header && !header.querySelector('.current-date')) {
        const dateElement = document.createElement('div');
        dateElement.className = 'current-date';
        dateElement.style.cssText = 'font-size: 14px; color: #7f8c8d; margin-top: 5px;';
        dateElement.textContent = currentDate;
        header.appendChild(dateElement);
    }
}

// Update Dashboard Statistics (READ-ONLY)
function updateDashboardStats() {
    // Baca data dari localStorage dengan key yang benar (sama seperti admin)
    const employees = JSON.parse(localStorage.getItem('mp_employees') || '[]');
    const endContracts = JSON.parse(localStorage.getItem('mp_end_contracts') || '[]');
    const recruitments = JSON.parse(localStorage.getItem('mp_recruitment') || '[]');
    const educations = JSON.parse(localStorage.getItem('mp_education') || '[]');
    
    // Update statistik real-time
    updateStatCard('#totalEmployeesNumber', employees.length);
    
    // End contracts this month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const endContractsThisMonth = endContracts.filter(contract => {
        const contractDate = new Date(contract.endDate);
        return contractDate.getMonth() + 1 === currentMonth && contractDate.getFullYear() === currentYear;
    }).length;
    updateStatCard('#endContractNumber', endContractsThisMonth);
    
    // Recruitments this month
    const recruitmentsThisMonth = recruitments.filter(recruitment => {
        const recruitmentDate = new Date(recruitment.dateCreated || recruitment.tanggalMasuk);
        return recruitmentDate.getMonth() + 1 === currentMonth && recruitmentDate.getFullYear() === currentYear;
    }).length;
    updateStatCard('#recruitmentNumber', recruitmentsThisMonth);
    
    // Education this month
    const educationsThisMonth = educations.filter(education => {
        const educationDate = new Date(education.dateEdukasi);
        return educationDate.getMonth() + 1 === currentMonth && educationDate.getFullYear() === currentYear;
    }).length;
    updateStatCard('#educationStatNumber', educationsThisMonth);
}

function updateStatCard(selector, value) {
    const numberElement = document.querySelector(selector);
    
    if (numberElement) {
        numberElement.textContent = value;
        numberElement.style.animation = 'countUp 1s ease-out';
    }
}

// Initialize Charts for Monitoring
function initializeCharts() {
    initializeEndContractChart();
    initializeEducationChart();
    populateYearFilters();
}

// Load Education Schedule Data (READ-ONLY)
function loadEducationScheduleData() {
    const educations = JSON.parse(localStorage.getItem('mp_education') || '[]');
    
    // Sort by education date (newest first)
    educations.sort((a, b) => new Date(b.dateEdukasi) - new Date(a.dateEdukasi));
    
    displayFilteredScheduleData(educations);
}

function initializeScheduleMonthYearFilter() {
    const educations = JSON.parse(localStorage.getItem('educations') || '[]');
    const monthYearFilter = document.getElementById('scheduleMonthYearFilter');
    
    if (!monthYearFilter) return;
    
    // Get unique month-year combinations
    const monthYears = new Set();
    educations.forEach(education => {
        const date = new Date(education.dateEdukasi);
        const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
        monthYears.add(monthYear);
    });
    
    // Sort month-years
    const sortedMonthYears = Array.from(monthYears).sort((a, b) => {
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1);
        const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1);
        return dateB - dateA;
    });
    
    // Clear existing options except the first one
    monthYearFilter.innerHTML = '<option value="">Semua Periode</option>';
    
    // Add month-year options
    sortedMonthYears.forEach(monthYear => {
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = getMonthYearText(monthYear);
        monthYearFilter.appendChild(option);
    });
}

function getMonthYearText(monthYear) {
    const [month, year] = monthYear.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${monthNames[parseInt(month) - 1]}-${year}`;
}

function filterEducationSchedule() {
    const monthYearFilter = document.getElementById('scheduleMonthYearFilter');
    const selectedMonthYear = monthYearFilter.value;
    
    const educations = JSON.parse(localStorage.getItem('educations') || '[]');
    
    let filteredEducations = educations;
    
    if (selectedMonthYear) {
        const [month, year] = selectedMonthYear.split('-');
        filteredEducations = educations.filter(education => {
            const date = new Date(education.dateEdukasi);
            const educationMonth = String(date.getMonth() + 1).padStart(2, '0');
            const educationYear = String(date.getFullYear()).slice(-2);
            return educationMonth === month && educationYear === year;
        });
    }
    
    // Sort by education date (newest first)
    filteredEducations.sort((a, b) => new Date(b.dateEdukasi) - new Date(a.dateEdukasi));
    
    displayFilteredScheduleData(filteredEducations);
}

function filterEducationScheduleByDate() {
    const dateFilter = document.getElementById('scheduleDateFilter');
    const selectedDate = dateFilter.value;
    
    if (!selectedDate) {
        loadEducationScheduleData();
        return;
    }
    
    const educations = JSON.parse(localStorage.getItem('educations') || '[]');
    const filteredEducations = educations.filter(education => {
        const educationDate = new Date(education.dateEdukasi).toISOString().split('T')[0];
        return educationDate === selectedDate;
    });
    
    // Sort by education date
    filteredEducations.sort((a, b) => new Date(b.dateEdukasi) - new Date(a.dateEdukasi));
    
    displayFilteredScheduleData(filteredEducations);
    
    // Clear month-year filter when date filter is used
    const monthYearFilter = document.getElementById('scheduleMonthYearFilter');
    if (monthYearFilter) {
        monthYearFilter.value = '';
    }
}

function filterTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('scheduleDateFilter');
    dateFilter.value = today;
    filterEducationScheduleByDate();
}

function filterTomorrowSchedule() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateFilter = document.getElementById('scheduleDateFilter');
    dateFilter.value = tomorrowStr;
    filterEducationScheduleByDate();
}

function clearDateFilter() {
    const dateFilter = document.getElementById('scheduleDateFilter');
    const monthYearFilter = document.getElementById('scheduleMonthYearFilter');
    
    dateFilter.value = '';
    monthYearFilter.value = '';
    
    loadEducationScheduleData();
}

function displayFilteredScheduleData(educations) {
    const tableBody = document.getElementById('educationScheduleTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (educations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="11" style="text-align: center; padding: 20px; color: #7f8c8d;">Tidak ada data jadwal edukasi</td>';
        tableBody.appendChild(row);
        return;
    }
    
    educations.forEach((education, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const educationDate = new Date(education.dateEdukasi);
        const formattedDate = educationDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Get attendance status from localStorage
        const attendanceKey = `attendance_${education.npk}_${education.dateEdukasi}`;
        const attendanceStatus = localStorage.getItem(attendanceKey) || 'Belum Ditentukan';
        
        // Get note from localStorage
        const noteKey = `note_${education.npk}_${education.dateEdukasi}`;
        const note = localStorage.getItem(noteKey) || '-';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${education.npk}</td>
            <td>${education.nama}</td>
            <td>${education.section}</td>
            <td>${education.line || '-'}</td>
            <td>${education.leader || '-'}</td>
            <td>${education.program}</td>
            <td>${education.proses}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${getAttendanceStatusClass(attendanceStatus)}">${attendanceStatus}</span></td>
            <td style="max-width: 150px; word-wrap: break-word;">${note}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function getAttendanceStatusClass(status) {
    switch(status) {
        case 'Hadir': return 'status-present';
        case 'Tidak Hadir': return 'status-absent';
        default: return 'status-pending';
    }
}

function searchEducationSchedule() {
    const searchInput = document.getElementById('scheduleSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    
    const educations = JSON.parse(localStorage.getItem('mp_education') || '[]');
    
    const filteredEducations = educations.filter(education => {
        return education.npk.toLowerCase().includes(searchTerm) ||
               education.nama.toLowerCase().includes(searchTerm) ||
               education.section.toLowerCase().includes(searchTerm) ||
               (education.line && education.line.toLowerCase().includes(searchTerm)) ||
               (education.leader && education.leader.toLowerCase().includes(searchTerm)) ||
               education.program.toLowerCase().includes(searchTerm) ||
               education.proses.toLowerCase().includes(searchTerm);
    });
    
    // Sort by education date (newest first)
    filteredEducations.sort((a, b) => new Date(b.dateEdukasi) - new Date(a.dateEdukasi));
    
    displayFilteredScheduleData(filteredEducations);
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    updateDashboardStats();
    if (window.endContractChart) {
        updateEndContractMonthlyChart();
    }
    if (window.educationChart) {
        updateEducationMonthlyChart();
    }
}, 30000);

function initializeEndContractChart() {
    const ctx = document.getElementById('endContractMonthlyChart');
    if (!ctx) return;
    
    window.endContractChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: 'Comp Assy - Pria',
                    data: [],
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: 'Comp Assy - Wanita',
                    data: [],
                    backgroundColor: '#e91e63',
                    borderColor: '#c2185b',
                    borderWidth: 1
                },
                {
                    label: 'Comp WClutch - Pria',
                    data: [],
                    backgroundColor: '#9b59b6',
                    borderColor: '#8e44ad',
                    borderWidth: 1
                },
                {
                    label: 'Comp WClutch - Wanita',
                    data: [],
                    backgroundColor: '#f39c12',
                    borderColor: '#e67e22',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Monitoring MP End Contract',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    updateEndContractMonthlyChart();
}

function initializeEducationChart() {
    const ctx = document.getElementById('educationMonthlyChart');
    if (!ctx) return;
    
    window.educationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: 'New MP',
                    data: [],
                    backgroundColor: '#27ae60',
                    borderColor: '#229954',
                    borderWidth: 1
                },
                {
                    label: 'Refresh MP',
                    data: [],
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: 'Skill Up MP',
                    data: [],
                    backgroundColor: '#f39c12',
                    borderColor: '#e67e22',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Add stacked configuration
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Monitoring MP Edukasi (Stacked)',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            }
        }
    });
    
    updateEducationMonthlyChart();
}

function updateEndContractMonthlyChart() {
    if (!window.endContractChart) return;
    
    const currentYear = new Date().getFullYear();
    const endContracts = JSON.parse(localStorage.getItem('mp_end_contracts') || '[]');
    
    // Initialize data arrays
    const compAssyPria = new Array(12).fill(0);
    const compAssyWanita = new Array(12).fill(0);
    const compWClutchPria = new Array(12).fill(0);
    const compWClutchWanita = new Array(12).fill(0);
    
    // Process data
    endContracts.forEach(contract => {
        const endDate = new Date(contract.endDate);
        const year = endDate.getFullYear();
        const month = endDate.getMonth();
        
        // Adjust for fiscal year (Apr-Mar)
        let fiscalMonth;
        if (month >= 3) { // Apr-Dec (months 3-11)
            fiscalMonth = month - 3;
        } else { // Jan-Mar (months 0-2)
            fiscalMonth = month + 9;
        }
        
        if ((month >= 3 && year === currentYear) || (month < 3 && year === currentYear + 1)) {
            const section = contract.section || '';
            const gender = contract.gender || '';
            
            if (section.includes('Comp Assy')) {
                if (gender === 'Laki-laki') {
                    compAssyPria[fiscalMonth]++;
                } else if (gender === 'Perempuan') {
                    compAssyWanita[fiscalMonth]++;
                }
            } else if (section.includes('Comp WClutch')) {
                if (gender === 'Laki-laki') {
                    compWClutchPria[fiscalMonth]++;
                } else if (gender === 'Perempuan') {
                    compWClutchWanita[fiscalMonth]++;
                }
            }
        }
    });
    
    // Update chart data
    window.endContractChart.data.datasets[0].data = compAssyPria;
    window.endContractChart.data.datasets[1].data = compAssyWanita;
    window.endContractChart.data.datasets[2].data = compWClutchPria;
    window.endContractChart.data.datasets[3].data = compWClutchWanita;
    window.endContractChart.update();
}

function updateEducationMonthlyChart() {
    if (!window.educationChart) return;
    
    const currentYear = new Date().getFullYear();
    const educations = JSON.parse(localStorage.getItem('mp_education') || '[]');
    
    // Initialize data arrays
    const newMPData = new Array(12).fill(0);
    const refreshMPData = new Array(12).fill(0);
    const skillUpMPData = new Array(12).fill(0);
    
    // Process data
    educations.forEach(education => {
        const eduDate = new Date(education.dateEdukasi);
        const year = eduDate.getFullYear();
        const month = eduDate.getMonth();
        
        // Adjust for fiscal year (Apr-Mar)
        let fiscalMonth;
        if (month >= 3) { // Apr-Dec (months 3-11)
            fiscalMonth = month - 3;
        } else { // Jan-Mar (months 0-2)
            fiscalMonth = month + 9;
        }
        
        if ((month >= 3 && year === currentYear) || (month < 3 && year === currentYear + 1)) {
            const program = education.program || '';
            
            if (program.includes('New MP')) {
                newMPData[fiscalMonth]++;
            } else if (program.includes('Refresh MP')) {
                refreshMPData[fiscalMonth]++;
            } else if (program.includes('Skill Up MP')) {
                skillUpMPData[fiscalMonth]++;
            }
        }
    });
    
    // Update chart data
    window.educationChart.data.datasets[0].data = newMPData;
    window.educationChart.data.datasets[1].data = refreshMPData;
    window.educationChart.data.datasets[2].data = skillUpMPData;
    window.educationChart.update();
}
