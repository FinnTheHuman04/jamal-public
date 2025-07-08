// popup_advanced.js v2.1.2
console.log('Popup Advanced Script loaded v2.1.2');

// DOM elements
let namaInput, keperluanInput, formUrlInput;
let autoScheduleEnabled, scheduleGrid, scheduleStatus;
let saveButton, fillNowButton, testScheduleButton, debugButton;
let statusMessage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing popup...');
    
    // Get DOM elements
    namaInput = document.getElementById('namaInput');
    keperluanInput = document.getElementById('keperluanInput');
    formUrlInput = document.getElementById('formUrlInput');
    autoScheduleEnabled = document.getElementById('autoScheduleEnabled');
    scheduleGrid = document.getElementById('scheduleGrid');
    scheduleStatus = document.getElementById('scheduleStatus');
    saveButton = document.getElementById('saveSettings');
    fillNowButton = document.getElementById('fillNow');
    testScheduleButton = document.getElementById('testSchedule');
    debugButton = document.getElementById('debugSchedule');
    statusMessage = document.getElementById('statusMessage');

    // Load saved settings
    loadSettings();
    
    // Add event listeners
    setupEventListeners();
    
    // Update schedule status
    updateScheduleStatus();
    
    // Check schedule status from background
    checkScheduleStatus();
});

function setupEventListeners() {
    // Save settings button
    saveButton.addEventListener('click', saveSettings);
    
    // Fill now button
    fillNowButton.addEventListener('click', fillFormNow);
    
    // Test schedule button
    testScheduleButton.addEventListener('click', testSchedule);
    
    // Debug button
    if (debugButton) {
        debugButton.addEventListener('click', debugSchedule);
    }
    
    // Auto schedule toggle
    autoScheduleEnabled.addEventListener('change', function() {
        scheduleGrid.style.display = this.checked ? 'grid' : 'none';
        updateScheduleStatus();
        if (this.checked) {
            setupScheduleWatcher();
        } else {
            clearScheduleWatcher();
        }
    });
    
    // Day checkboxes
    const dayCheckboxes = document.querySelectorAll('input[name="days"]');
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateScheduleStatus);
    });
    
    // Time inputs
    const timeInputs = document.querySelectorAll('.time-input');
    timeInputs.forEach(input => {
        input.addEventListener('change', updateScheduleStatus);
    });
}

function loadSettings() {
    chrome.storage.sync.get([
        'formData', 
        'scheduleSettings', 
        'formUrl'
    ], function(result) {
        console.log('Loading settings:', result);
        
        // Load form data
        if (result.formData) {
            const data = result.formData;
            
            // Text inputs
            if (namaInput && data.nama) namaInput.value = data.nama;
            if (keperluanInput && data.keperluan) keperluanInput.value = data.keperluan;
            
            // Radio buttons
            if (data.jenisKelamin) {
                const jenkelRadio = document.querySelector(`input[name="jenis_kelamin"][value="${data.jenisKelamin}"]`);
                if (jenkelRadio) jenkelRadio.checked = true;
            }
            
            if (data.kelas) {
                const kelasRadio = document.querySelector(`input[name="kelas"][value="${data.kelas}"]`);
                if (kelasRadio) kelasRadio.checked = true;
            }
            
            if (data.lokasi) {
                const lokasiRadio = document.querySelector(`input[name="lokasi"][value="${data.lokasi}"]`);
                if (lokasiRadio) lokasiRadio.checked = true;
            }
            
            if (data.asrama) {
                const asramaRadio = document.querySelector(`input[name="asrama"][value="${data.asrama}"]`);
                if (asramaRadio) asramaRadio.checked = true;
            }
        }
        
        // Load URL
        if (result.formUrl && formUrlInput) {
            formUrlInput.value = result.formUrl;
        }
        
        // Load schedule settings
        if (result.scheduleSettings) {
            const schedule = result.scheduleSettings;
            
            autoScheduleEnabled.checked = schedule.enabled || false;
            scheduleGrid.style.display = schedule.enabled ? 'grid' : 'none';
            
            if (schedule.days) {
                schedule.days.forEach(dayData => {
                    const dayCheckbox = document.querySelector(`input[name="days"][value="${dayData.day}"]`);
                    const timeInput = document.querySelector(`.time-input[data-day="${dayData.day}"]`);
                    
                    if (dayCheckbox) dayCheckbox.checked = dayData.enabled;
                    if (timeInput && dayData.time) timeInput.value = dayData.time;
                });
            }
        }
        
        updateScheduleStatus();
    });
}

function saveSettings() {
    console.log('💾 Saving settings...');
    
    // Collect form data
    const formData = {
        nama: namaInput.value,
        jenisKelamin: getSelectedRadioValue('jenis_kelamin'),
        kelas: getSelectedRadioValue('kelas'),
        keperluan: keperluanInput.value,
        lokasi: getSelectedRadioValue('lokasi'),
        asrama: getSelectedRadioValue('asrama')
    };
    
    // Collect schedule data
    const scheduleSettings = {
        enabled: autoScheduleEnabled.checked,
        days: []
    };
    
    const dayCheckboxes = document.querySelectorAll('input[name="days"]');
    dayCheckboxes.forEach(checkbox => {
        const timeInput = document.querySelector(`.time-input[data-day="${checkbox.value}"]`);
        scheduleSettings.days.push({
            day: parseInt(checkbox.value),
            enabled: checkbox.checked,
            time: timeInput.value
        });
    });
    
    const formUrl = formUrlInput.value;
    
    console.log('📊 Schedule data:', scheduleSettings);
    console.log('📝 Form data:', formData);
    console.log('🔗 URL:', formUrl);
    
    // Save to storage
    chrome.storage.sync.set({
        formData: formData,
        scheduleSettings: scheduleSettings,
        formUrl: formUrl
    }, function() {
        console.log('Settings saved:', { formData, scheduleSettings, formUrl });
        showStatus('✅ Pengaturan berhasil disimpan!', 'success');
        
        // Send schedule to background script
        if (scheduleSettings.enabled) {
            console.log('🚀 Sending schedule to background...');
            chrome.runtime.sendMessage({
                action: 'setupSchedule',
                schedule: scheduleSettings,
                formUrl: formUrl,
                formData: formData
            }, (response) => {
                if (response && response.success) {
                    showStatus('🕒 Jadwal otomatis telah diaktifkan', 'info');
                    checkScheduleStatus(); // Refresh status
                } else {
                    showStatus('❌ Gagal mengaktifkan jadwal', 'error');
                }
            });
        } else {
            console.log('🛑 Clearing schedule...');
            chrome.runtime.sendMessage({
                action: 'clearSchedule'
            }, (response) => {
                if (response && response.success) {
                    showStatus('🔴 Jadwal dihentikan', 'info');
                    checkScheduleStatus(); // Refresh status
                }
            });
        }
    });
}

function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value : '';
}

function fillFormNow() {
    console.log('Fill form now clicked');
    
    const formData = {
        nama: namaInput.value,
        jenisKelamin: getSelectedRadioValue('jenis_kelamin'),
        kelas: getSelectedRadioValue('kelas'),
        keperluan: keperluanInput.value,
        lokasi: getSelectedRadioValue('lokasi'),
        asrama: getSelectedRadioValue('asrama')
    };
    
    const formUrl = formUrlInput.value;
    
    if (!formUrl) {
        showStatus('❌ Silakan masukkan URL form terlebih dahulu', 'error');
        return;
    }
    
    // Check if we have enough data
    if (!formData.nama || !formData.jenisKelamin) {
        showStatus('❌ Silakan lengkapi data nama dan jenis kelamin', 'error');
        return;
    }
    
    showStatus('🚀 Membuka form dan mengisi data...', 'info');
    
    // Send message to background to open form and fill
    chrome.runtime.sendMessage({
        action: 'openAndFillForm',
        formUrl: formUrl,
        formData: formData
    }, function(response) {
        if (response && response.success) {
            showStatus('✅ Form berhasil diisi!', 'success');
        } else {
            showStatus('❌ Gagal mengisi form', 'error');
        }
    });
}

function testSchedule() {
    console.log('🧪 Testing schedule...');
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    showStatus(`🧪 Hari ini: ${getDayName(currentDay)}, Waktu: ${currentTime}`, 'info');
    
    // Check if current day/time matches any schedule
    const dayCheckbox = document.querySelector(`input[name="days"][value="${currentDay}"]`);
    const timeInput = document.querySelector(`.time-input[data-day="${currentDay}"]`);
    
    if (dayCheckbox && dayCheckbox.checked) {
        const scheduledTime = timeInput.value;
        const timeStatus = currentTime >= scheduledTime ? 'Sudah lewat' : 'Belum tiba';
        showStatus(`📅 Jadwal hari ini: ${scheduledTime} - ${timeStatus}`, 'info');
        
        // Test fill after delay
        setTimeout(() => {
            showStatus('🚀 Menjalankan test fill...', 'info');
            fillFormNow();
        }, 2000);
    } else {
        showStatus('📅 Tidak ada jadwal untuk hari ini', 'info');
    }
}

function debugSchedule() {
    console.log('🐛 Debug schedule clicked');
    showStatus('🔍 Menjalankan debug...', 'info');
    
    // Get schedule status from background
    chrome.runtime.sendMessage({
        action: 'getScheduleStatus'
    }, (response) => {
        if (response) {
            console.log('📊 Schedule status:', response);
            const schedule = response.schedule;
            const watcherActive = response.watcherActive;
            
            let debugInfo = `🔍 DEBUG INFO:\n`;
            debugInfo += `Watcher: ${watcherActive ? '✅ Aktif' : '❌ Nonaktif'}\n`;
            
            if (schedule) {
                debugInfo += `Schedule: ${schedule.schedule.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
                debugInfo += `Setup time: ${schedule.setupTime || 'Unknown'}\n`;
                
                const activeDays = schedule.schedule.days.filter(d => d.enabled);
                debugInfo += `Active days: ${activeDays.length}\n`;
                
                activeDays.forEach(day => {
                    debugInfo += `- ${getDayName(day.day)}: ${day.time}\n`;
                });
            } else {
                debugInfo += `Schedule: ❌ Tidak ada\n`;
            }
            
            showStatus(debugInfo, 'info');
        }
    });
    
    // Also trigger background debug
    chrome.runtime.sendMessage({
        action: 'debugSchedule'
    });
}

function updateScheduleStatus() {
    const enabled = autoScheduleEnabled.checked;
    const activeDays = document.querySelectorAll('input[name="days"]:checked').length;
    
    if (enabled && activeDays > 0) {
        scheduleStatus.className = 'status-indicator status-active';
        scheduleStatus.title = `✅ Aktif - ${activeDays} hari terjadwal`;
        
        // Show next scheduled time
        const nextSchedule = getNextScheduledTime();
        if (nextSchedule) {
            scheduleStatus.title += `\nSelanjutnya: ${nextSchedule}`;
        }
    } else if (enabled && activeDays === 0) {
        scheduleStatus.className = 'status-indicator status-warning';
        scheduleStatus.title = '⚠️ Aktif tapi tidak ada hari terpilih';
    } else {
        scheduleStatus.className = 'status-indicator status-inactive';
        scheduleStatus.title = '❌ Nonaktif';
    }
}

function getNextScheduledTime() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const enabledSchedules = [];
    const dayCheckboxes = document.querySelectorAll('input[name="days"]:checked');
    
    dayCheckboxes.forEach(checkbox => {
        const day = parseInt(checkbox.value);
        const timeInput = document.querySelector(`.time-input[data-day="${day}"]`);
        if (timeInput && timeInput.value) {
            enabledSchedules.push({
                day: day,
                time: timeInput.value,
                dayName: getDayName(day)
            });
        }
    });
    
    if (enabledSchedules.length === 0) return null;
    
    // Find next occurrence
    for (let i = 0; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const schedule = enabledSchedules.find(s => s.day === checkDay);
        
        if (schedule) {
            if (i === 0 && schedule.time > currentTime) {
                // Today, but time hasn't passed
                return `Hari ini ${schedule.time}`;
            } else if (i > 0) {
                // Future day
                return `${schedule.dayName} ${schedule.time}`;
            }
        }
    }
    
    return null;
}

function checkScheduleStatus() {
    chrome.runtime.sendMessage({
        action: 'getScheduleStatus'
    }, (response) => {
        if (response && response.schedule) {
            console.log('📈 Current schedule status:', response);
            
            // Update visual indicator
            const watcherActive = response.watcherActive;
            const scheduleEnabled = response.schedule.schedule.enabled;
            
            if (scheduleEnabled && watcherActive) {
                // All good
                scheduleStatus.style.background = '#4CAF50';
            } else if (scheduleEnabled && !watcherActive) {
                // Schedule enabled but watcher not active
                scheduleStatus.style.background = '#FF9800';
            } else {
                // Schedule disabled
                scheduleStatus.style.background = '#f44336';
            }
        }
    });
}

function setupScheduleWatcher() {
    chrome.runtime.sendMessage({
        action: 'startScheduleWatcher'
    });
}

function clearScheduleWatcher() {
    chrome.runtime.sendMessage({
        action: 'stopScheduleWatcher'
    });
}

function getDayName(dayNumber) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayNumber] || 'Unknown';
}

function showStatus(message, type = 'info') {
    console.log('Status:', message, type);
    
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 3000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Popup received message:', request);
    
    if (request.action === 'scheduleTriggered') {
        showStatus('⏰ Jadwal terpicu! Mengisi form...', 'info');
    } else if (request.action === 'formFilled') {
        showStatus('✅ Form berhasil diisi otomatis!', 'success');
    } else if (request.action === 'fillError') {
        showStatus('❌ Error: ' + request.error, 'error');
    }
    
    sendResponse({received: true});
}); 