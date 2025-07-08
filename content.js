// Content script untuk Google Forms Auto Filler
console.log('Google Form Auto Filler: Content script loaded');

// Listen untuk pesan dari popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fillForm') {
        console.log('Received fillForm message:', request.data);
        const success = fillGoogleForm(request.data);
        sendResponse({success: success});
    }
    return true; // Menandakan response akan dikirim secara asynchronous
});

// Fungsi utama untuk mengisi Google Form
function fillGoogleForm(settings) {
    try {
        const { dayValue, timeValue, dateValue } = settings;
        let filledFields = 0;

        // Cari semua input fields di form
        const inputs = document.querySelectorAll('input, select, textarea');
        
        // Cari berdasarkan berbagai selector yang mungkin untuk hari
        if (dayValue) {
            const dayFilled = fillFieldByContent(dayValue, [
                'hari', 'day', 'tanggal', 'date', 'waktu', 'time'
            ]);
            if (dayFilled) filledFields++;
        }

        // Cari berdasarkan berbagai selector yang mungkin untuk waktu
        if (timeValue) {
            const timeFilled = fillTimeField(timeValue);
            if (timeFilled) filledFields++;
        }

        // Cari berdasarkan berbagai selector yang mungkin untuk tanggal
        if (dateValue) {
            const dateFilled = fillDateField(dateValue);
            if (dateFilled) filledFields++;
        }

        // Jika tidak ada field yang terisi, coba metode alternatif
        if (filledFields === 0) {
            filledFields = fillFormAlternativeMethod(settings);
        }

        console.log(`Filled ${filledFields} fields`);
        return filledFields > 0;

    } catch (error) {
        console.error('Error filling form:', error);
        return false;
    }
}

// Fungsi untuk mengisi field berdasarkan konten label/placeholder
function fillFieldByContent(value, keywords) {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
    
    for (let input of inputs) {
        // Cek label yang terkait
        const label = findRelatedLabel(input);
        const placeholder = input.placeholder || '';
        const ariaLabel = input.getAttribute('aria-label') || '';
        
        const searchText = (label + ' ' + placeholder + ' ' + ariaLabel).toLowerCase();
        
        // Cek apakah ada keyword yang cocok
        const hasKeyword = keywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword && !input.value) {
            const success = setInputValue(input, value);
            return success;
        }
    }
    
    return false;
}

// Fungsi untuk mengisi field waktu
function fillTimeField(timeValue) {
    // Cari input type="time"
    const timeInputs = document.querySelectorAll('input[type="time"]');
    if (timeInputs.length > 0) {
        const success = setInputValue(timeInputs[0], timeValue);
        return success;
    }

    // Cari berdasarkan label/placeholder yang mengandung kata waktu
    return fillFieldByContent(timeValue, ['waktu', 'time', 'jam', 'hour', 'pukul']);
}

// Fungsi untuk mengisi field tanggal
function fillDateField(dateValue) {
    // Cari input type="date"
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
        const success = setInputValue(dateInputs[0], dateValue);
        return success;
    }

    // Format tanggal untuk tampilan yang lebih user-friendly
    const formattedDate = formatDate(dateValue);
    
    return fillFieldByContent(formattedDate, ['tanggal', 'date', 'tgl']);
}

// Fungsi untuk format tanggal
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('id-ID', options);
}

// Fungsi untuk mencari label yang terkait dengan input
function findRelatedLabel(input) {
    // Cari label dengan atribut 'for'
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent;
    }
    
    // Cari label parent
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent;
    
    // Cari label berdasarkan posisi (sebelum input)
    let sibling = input.previousElementSibling;
    while (sibling) {
        if (sibling.tagName === 'LABEL' || sibling.textContent.trim()) {
            return sibling.textContent;
        }
        sibling = sibling.previousElementSibling;
    }
    
    // Cari dalam parent container
    const container = input.closest('div, fieldset, section');
    if (container) {
        const labelInContainer = container.querySelector('label, .label, [class*="label"]');
        if (labelInContainer) return labelInContainer.textContent;
    }
    
    return '';
}

// Fungsi untuk set value input dengan trigger event
function setInputValue(input, value) {
    try {
        // Validasi input element
        if (!input || typeof input.value === 'undefined') {
            console.error('Invalid input element:', input);
            return false;
        }

        // Set value dengan method biasa terlebih dahulu
        input.value = value;
        
        // Trigger events yang mungkin diperlukan
        const events = ['input', 'change', 'blur', 'keyup'];
        events.forEach(eventType => {
            try {
                const event = new Event(eventType, { bubbles: true });
                input.dispatchEvent(event);
            } catch (e) {
                console.warn(`Failed to dispatch ${eventType} event:`, e);
            }
        });
        
        // Khusus untuk React/Angular components - dengan error handling
        try {
            if (window.HTMLInputElement && input instanceof HTMLInputElement) {
                const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
                if (descriptor && descriptor.set) {
                    descriptor.set.call(input, value);
                    
                    // Trigger input event lagi untuk React
                    const inputEvent = new Event('input', { bubbles: true });
                    input.dispatchEvent(inputEvent);
                }
            } else if (window.HTMLTextAreaElement && input instanceof HTMLTextAreaElement) {
                const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
                if (descriptor && descriptor.set) {
                    descriptor.set.call(input, value);
                    
                    // Trigger input event lagi untuk React
                    const inputEvent = new Event('input', { bubbles: true });
                    input.dispatchEvent(inputEvent);
                }
            }
        } catch (e) {
            console.warn('Failed to set value using native setter:', e);
            // Fallback - just ensure the value is set
            input.value = value;
        }
        
        // Final verification
        if (input.value === value) {
            console.log(`Successfully filled field with value: ${value}`);
            return true;
        } else {
            console.warn(`Value not set correctly. Expected: ${value}, Actual: ${input.value}`);
            return false;
        }
        
    } catch (error) {
        console.error('Error in setInputValue:', error);
        return false;
    }
}

// Metode alternatif untuk mengisi form jika metode utama gagal
function fillFormAlternativeMethod(settings) {
    let filledFields = 0;
    const { dayValue, timeValue, dateValue } = settings;
    
    // Cari semua input text yang kosong
    const emptyInputs = document.querySelectorAll('input[type="text"]:not([value]), textarea:not([value])');
    
    emptyInputs.forEach((input, index) => {
        let success = false;
        if (index === 0 && dayValue) {
            success = setInputValue(input, dayValue);
        } else if (index === 1 && timeValue) {
            success = setInputValue(input, timeValue);
        } else if (index === 2 && dateValue) {
            success = setInputValue(input, formatDate(dateValue));
        }
        
        if (success) {
            filledFields++;
        }
    });
    
    return filledFields;
}

// Auto-fill jika diaktifkan dan halaman selesai dimuat
window.addEventListener('load', () => {
    chrome.storage.sync.get(['autoFillEnabled', 'dayValue', 'timeValue', 'dateValue'], (result) => {
        if (result.autoFillEnabled && (result.dayValue || result.timeValue || result.dateValue)) {
            setTimeout(() => {
                const success = fillGoogleForm(result);
                if (success) {
                    console.log('Auto-fill completed successfully');
                    
                    // Tampilkan notifikasi sukses
                    showNotification('Form berhasil diisi otomatis! ✅');
                }
            }, 2000); // Delay 2 detik untuk memastikan form selesai dimuat
        }
    });
});

// Fungsi untuk menampilkan notifikasi
function showNotification(message) {
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        ">
            ${message}
        </div>
    `;
    
    // Tambahkan CSS animasi
    if (!document.getElementById('autoFillStyles')) {
        const style = document.createElement('style');
        style.id = 'autoFillStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Hapus notifikasi setelah 3 detik
    setTimeout(() => {
        notification.firstElementChild.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
} 