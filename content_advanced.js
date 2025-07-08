// content_advanced.js - Advanced form filling for structured data
console.log('Content script advanced loaded on:', window.location.href);

// Enhanced form data mapping for specific fields - Using text-based detection for Google Forms
const FIELD_TEXT_MAPPINGS = {
    nama: [
        'nama', 'name', 'fullname', 'full name', 'nama lengkap', 'nama lengkap siswa',
        'student name', 'your name', 'identitas', 'siapa nama'
    ],
    jenisKelamin: [
        'jenis kelamin', 'gender', 'sex', 'kelamin', 'jk', 'gender selection',
        'pilih jenis kelamin', 'laki-laki atau perempuan', 'male female'
    ],
    kelas: [
        'kelas', 'class', 'grade', 'tingkat', 'level', 'classroom',
        'kelas sekarang', 'current class', 'pilih kelas', 'what class'
    ],
    keperluan: [
        'keperluan', 'purpose', 'reason', 'tujuan', 'alasan', 'necessity',
        'keperluan kunjungan', 'visit purpose', 'keterangan', 'description',
        'apa keperluan', 'what purpose', 'mengapa', 'kebutuhan', 'maksud'
    ],
    lokasi: [
        'lokasi', 'location', 'tempat', 'place', 'destination', 'tujuan lokasi',
        'lokasi tujuan', 'target location', 'pilih lokasi', 'where'
    ],
    asrama: [
        'asrama', 'dormitory', 'dorm', 'hostel', 'residence', 'tempat tinggal',
        'asrama asal', 'dorm name', 'pilih asrama', 'which dorm'
    ]
};

// Radio button value mappings
const RADIO_VALUE_MAPPINGS = {
    jenisKelamin: {
        'L': ['laki-laki', 'laki', 'male', 'l', 'man', 'pria', 'cowok'],
        'P': ['perempuan', 'female', 'p', 'woman', 'wanita', 'cewek']
    },
    kelas: {
        'IV RKS Echo': ['iv rks echo', 'echo', 'rks echo', '4 rks echo'],
        'IV RKS Trace': ['iv rks trace', 'trace', 'rks trace', '4 rks trace'],
        'IV RKS Route': ['iv rks route', 'route', 'rks route', '4 rks route'],
        'IV RPKK': ['iv rpkk', 'rpkk', '4 rpkk'],
        'IV RSK': ['iv rsk', 'rsk', '4 rsk'],
        'IV RPLK': ['iv rplk', 'rplk', '4 rplk']
    },
    lokasi: {
        'IV RKS Echo': ['iv rks echo', 'echo', 'rks echo', '4 rks echo'],
        'IV RKS Trace': ['iv rks trace', 'trace', 'rks trace', '4 rks trace'],
        'IV RKS Route': ['iv rks route', 'route', 'rks route', '4 rks route'],
        'IV RPKK': ['iv rpkk', 'rpkk', '4 rpkk'],
        'IV RSK': ['iv rsk', 'rsk', '4 rsk'],
        'IV RPLK': ['iv rplk', 'rplk', '4 rplk']
    },
    asrama: {
        'E': ['asrama e', 'e', 'dorm e', 'dormitory e', 'blok e'],
        'F': ['asrama f', 'f', 'dorm f', 'dormitory f', 'blok f']
    }
};

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    try {
        if (request.action === 'fillAdvancedForm') {
            const result = fillAdvancedForm(request.formData);
            sendResponse(result);
        } else if (request.action === 'analyzeForm') {
            const analysis = analyzeFormStructure();
            sendResponse({success: true, analysis: analysis});
        } else {
            sendResponse({success: false, error: 'Unknown action'});
        }
    } catch (error) {
        console.error('Error processing message:', error);
        sendResponse({success: false, error: error.message});
    }
    
    return true;
});

function fillAdvancedForm(formData) {
    console.log('Filling advanced form with data:', formData);
    
    try {
        const results = {
            filled: [],
            failed: [],
            total: 0
        };
        
        // Wait for form to be fully loaded and extra time for Google Forms
        waitForFormLoad(3000).then(() => {
            // Additional wait for Google Forms to fully render
            setTimeout(() => {
                // Fill text inputs
                if (formData.nama) {
                    const namaResult = fillTextField('nama', formData.nama);
                    updateResults(results, 'nama', namaResult);
                }
                
                if (formData.keperluan) {
                    const keperluanResult = fillTextField('keperluan', formData.keperluan);
                    updateResults(results, 'keperluan', keperluanResult);
                }
                
                // Fill radio buttons
                if (formData.jenisKelamin) {
                    const jenkelResult = fillRadioField('jenisKelamin', formData.jenisKelamin);
                    updateResults(results, 'jenisKelamin', jenkelResult);
                }
                
                if (formData.kelas) {
                    const kelasResult = fillRadioField('kelas', formData.kelas);
                    updateResults(results, 'kelas', kelasResult);
                }
                
                if (formData.lokasi) {
                    const lokasiResult = fillRadioField('lokasi', formData.lokasi);
                    updateResults(results, 'lokasi', lokasiResult);
                }
                
                if (formData.asrama) {
                    const asramaResult = fillRadioField('asrama', formData.asrama);
                    updateResults(results, 'asrama', asramaResult);
                }
                
                console.log('Form filling results:', results);
                
                // Show success message
                showFillNotification(results);
            }, 2000); // Wait 2 seconds for Google Forms to fully render
        });
        
        return {
            success: true,
            message: 'Form filling started',
            preview: results
        };
        
    } catch (error) {
        console.error('Error filling form:', error);
        return {
            success: false,
            error: 'Error filling form: ' + error.message
        };
    }
}

function fillTextField(fieldType, value) {
    const possibleTexts = FIELD_TEXT_MAPPINGS[fieldType] || [];
    
    console.log(`Searching for text field ${fieldType} with texts:`, possibleTexts);
    
    // Try to find field by Google Forms specific structure
    for (const text of possibleTexts) {
        // Search for Google Forms question spans with class M7eMe
        const questionSpans = document.querySelectorAll('span.M7eMe');
        for (const span of questionSpans) {
            const spanText = span.textContent.toLowerCase().trim().replace(/<br>/g, '');
            
            if (spanText.includes(text.toLowerCase())) {
                console.log(`Found Google Forms question "${spanText}" for ${fieldType}`);
                
                // Look for input in the same form item container
                let element = null;
                
                // Navigate up to find the form item container
                let container = span;
                for (let i = 0; i < 10; i++) {
                    container = container.parentElement;
                    if (!container) break;
                    
                    // Look for input/textarea in this container
                    element = container.querySelector('input[type="text"], textarea, input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]):not([type="time"]):not([type="date"]):not([type="datetime-local"])');
                    if (element) {
                        console.log(`Found input in container level ${i}:`, element);
                        // Double check it's not a time/date field
                        if (element.type !== 'time' && element.type !== 'date' && element.type !== 'datetime-local') {
                            break;
                        } else {
                            console.log(`Skipping ${element.type} field to avoid conflicts`);
                            element = null;
                        }
                    }
                }
                
                // Alternative: look for the next form item that contains an input
                if (!element) {
                    let nextSibling = span.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem, div[data-params]');
                    if (nextSibling) {
                        element = nextSibling.querySelector('input[type="text"], textarea, input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]):not([type="time"]):not([type="date"]):not([type="datetime-local"])');
                        if (element && (element.type === 'time' || element.type === 'date' || element.type === 'datetime-local')) {
                            console.log(`Skipping ${element.type} field in next sibling`);
                            element = null;
                        } else {
                            console.log(`Found input in next sibling:`, element);
                        }
                    }
                }
                
                if (element) {
                    const success = setInputValue(element, value);
                    if (success) {
                        console.log(`Successfully filled ${fieldType} via Google Forms detection:`, element);
                        return {success: true, element: element, value: value};
                    }
                }
            }
        }
        
        // Fallback: search all spans/labels
        const allSpans = document.querySelectorAll('span, label, div');
        for (const span of allSpans) {
            const spanText = span.textContent.toLowerCase().trim();
            
            if (spanText.includes(text.toLowerCase()) && spanText.length < 100) {
                console.log(`Found fallback text "${spanText}" for ${fieldType}`);
                
                // Look for nearby inputs
                let element = null;
                let container = span.parentElement;
                
                for (let i = 0; i < 5; i++) {
                    if (!container) break;
                    element = container.querySelector('input[type="text"], textarea, input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]):not([type="time"]):not([type="date"]):not([type="datetime-local"])');
                    if (element && (element.type === 'time' || element.type === 'date' || element.type === 'datetime-local')) {
                        console.log(`Skipping ${element.type} field in fallback search`);
                        element = null;
                    }
                    if (element) break;
                    container = container.parentElement;
                }
                
                if (element) {
                    const success = setInputValue(element, value);
                    if (success) {
                        console.log(`Successfully filled ${fieldType} via fallback text search:`, element);
                        return {success: true, element: element, value: value};
                    }
                }
            }
        }
    }
    
    console.warn(`Could not find field for ${fieldType}`);
    return {success: false, error: `Field not found: ${fieldType}`};
}

function fillRadioField(fieldType, value) {
    const possibleTexts = FIELD_TEXT_MAPPINGS[fieldType] || [];
    const valueMappings = RADIO_VALUE_MAPPINGS[fieldType] || {};
    
    console.log(`Filling radio field ${fieldType} with value ${value}`);
    
    // Get possible values for this selection
    const possibleValues = [value.toLowerCase()];
    if (valueMappings[value]) {
        possibleValues.push(...valueMappings[value]);
    }
    
    console.log(`Looking for radio values:`, possibleValues);
    
    // First, try to find question using Google Forms structure
    for (const text of possibleTexts) {
        // Search for Google Forms question spans with class M7eMe
        const questionSpans = document.querySelectorAll('span.M7eMe');
        for (const span of questionSpans) {
            const spanText = span.textContent.toLowerCase().trim().replace(/<br>/g, '');
            
            if (spanText.includes(text.toLowerCase())) {
                console.log(`Found Google Forms question "${spanText}" for ${fieldType}`);
                
                // Look for radio div elements with role="radio" near this question
                let container = span;
                for (let i = 0; i < 10; i++) {
                    container = container.parentElement;
                    if (!container) break;
                    
                    // Look for Google Forms radio div elements
                    const radioElements = container.querySelectorAll('div[role="radio"]');
                    console.log(`Found ${radioElements.length} Google Forms radio elements in container level ${i}`);
                    
                    for (const radioDiv of radioElements) {
                        const dataValue = (radioDiv.getAttribute('data-value') || '').toLowerCase();
                        const ariaLabel = (radioDiv.getAttribute('aria-label') || '').toLowerCase();
                        
                        console.log(`Checking Google Forms radio: data-value="${dataValue}" aria-label="${ariaLabel}"`);
                        
                        // Check if this radio matches our value
                        for (const possibleValue of possibleValues) {
                            if (dataValue === possibleValue || 
                                ariaLabel === possibleValue ||
                                dataValue.includes(possibleValue) || 
                                ariaLabel.includes(possibleValue)) {
                                
                                try {
                                    console.log(`Matching Google Forms radio found! Clicking div with data-value: ${dataValue}, aria-label: ${ariaLabel}`);
                                    
                                    // Click the radio div
                                    radioDiv.click();
                                    
                                    // Also trigger events
                                    radioDiv.dispatchEvent(new Event('click', {bubbles: true}));
                                    radioDiv.dispatchEvent(new Event('change', {bubbles: true}));
                                    
                                    // Set aria-checked
                                    radioDiv.setAttribute('aria-checked', 'true');
                                    
                                    console.log(`Successfully selected Google Forms radio for ${fieldType}:`, radioDiv);
                                    return {success: true, element: radioDiv, value: value};
                                } catch (error) {
                                    console.error('Error clicking Google Forms radio:', error);
                                }
                            }
                        }
                    }
                    
                    if (radioElements.length > 0) break; // Found radio container, stop searching
                }
            }
        }
    }
    
    // Fallback: Try global search for Google Forms radio elements
    console.log('Trying global Google Forms radio search...');
    const allGoogleRadios = document.querySelectorAll('div[role="radio"]');
    console.log(`Found ${allGoogleRadios.length} total Google Forms radio elements`);
    
    for (const radioDiv of allGoogleRadios) {
        const dataValue = (radioDiv.getAttribute('data-value') || '').toLowerCase();
        const ariaLabel = (radioDiv.getAttribute('aria-label') || '').toLowerCase();
        
        for (const possibleValue of possibleValues) {
            if (dataValue === possibleValue || 
                ariaLabel === possibleValue ||
                dataValue.includes(possibleValue) || 
                ariaLabel.includes(possibleValue)) {
                
                try {
                    console.log(`Global Google Forms radio match! Clicking div with data-value: ${dataValue}, aria-label: ${ariaLabel}`);
                    radioDiv.click();
                    radioDiv.dispatchEvent(new Event('click', {bubbles: true}));
                    radioDiv.setAttribute('aria-checked', 'true');
                    
                    console.log(`Selected Google Forms radio using global search for ${fieldType}:`, radioDiv);
                    return {success: true, element: radioDiv, value: value};
                } catch (error) {
                    console.error('Error with global Google Forms radio:', error);
                }
            }
        }
    }
    
    // Last resort: traditional input[type="radio"] search
    console.log('Trying traditional radio input search...');
    const allTraditionalRadios = document.querySelectorAll('input[type="radio"]');
    for (const radio of allTraditionalRadios) {
        const radioValue = (radio.value || '').toLowerCase();
        const radioLabel = getRadioLabel(radio).toLowerCase();
        
        for (const possibleValue of possibleValues) {
            if (radioValue === possibleValue || 
                radioLabel === possibleValue ||
                radioValue.includes(possibleValue) || 
                radioLabel.includes(possibleValue)) {
                
                try {
                    console.log(`Traditional radio match! Clicking input with value: ${radioValue}, label: ${radioLabel}`);
                    radio.checked = true;
                    radio.click();
                    radio.dispatchEvent(new Event('change', {bubbles: true}));
                    
                    console.log(`Selected traditional radio for ${fieldType}:`, radio);
                    return {success: true, element: radio, value: value};
                } catch (error) {
                    console.error('Error with traditional radio:', error);
                }
            }
        }
    }
    
    console.warn(`Could not find radio field for ${fieldType}`);
    console.log('Available Google Forms radio elements:', Array.from(allGoogleRadios).map(r => ({
        dataValue: r.getAttribute('data-value'),
        ariaLabel: r.getAttribute('aria-label'),
        className: r.className
    })));
    console.log('Available traditional radio inputs:', Array.from(allTraditionalRadios).map(r => ({
        value: r.value,
        label: getRadioLabel(r),
        name: r.name
    })));
    
    return {success: false, error: `Radio field not found: ${fieldType}`};
}

function getRadioLabel(radioElement) {
    // Try multiple ways to get radio label
    let label = '';
    
    // 1. Associated label element
    const labelElement = document.querySelector(`label[for="${radioElement.id}"]`);
    if (labelElement) {
        label = labelElement.textContent.trim();
    }
    
    // 2. Parent label
    if (!label) {
        const parentLabel = radioElement.closest('label');
        if (parentLabel) {
            label = parentLabel.textContent.trim();
        }
    }
    
    // 3. Next sibling text
    if (!label && radioElement.nextSibling) {
        label = radioElement.nextSibling.textContent || '';
    }
    
    // 4. Parent container text
    if (!label) {
        const parent = radioElement.parentElement;
        if (parent) {
            label = parent.textContent.replace(radioElement.value || '', '').trim();
        }
    }
    
    return label;
}

function findElementByLabel(labelText) {
    // Find label containing the text
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
        if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
            // Get associated input
            if (label.htmlFor) {
                return document.getElementById(label.htmlFor);
            }
            // Or input inside label
            const input = label.querySelector('input, textarea, select');
            if (input) return input;
        }
    }
    return null;
}

function findBestTextInput(fieldType, value) {
    // Generic search for text inputs, excluding time/date fields
    const inputs = document.querySelectorAll('input[type="text"], input[type=""], input:not([type]):not([type="time"]):not([type="date"]):not([type="datetime-local"]), textarea');
    
    for (const input of inputs) {
        // Skip time/date fields
        if (input.type === 'time' || input.type === 'date' || input.type === 'datetime-local' || input.type === 'hidden') {
            continue;
        }
        
        const context = getElementContext(input).toLowerCase();
        const keywords = FIELD_TEXT_MAPPINGS[fieldType] || [];
        
        for (const keyword of keywords) {
            if (context.includes(keyword)) {
                console.log(`Found matching input via context search: ${input.tagName}[${input.type}] for keyword "${keyword}"`);
                return input;
            }
        }
    }
    
    return null;
}

function findBestRadioButton(fieldType, value) {
    // Generic search for radio buttons
    const radios = document.querySelectorAll('input[type="radio"]');
    const valueMappings = RADIO_VALUE_MAPPINGS[fieldType] || {};
    const possibleValues = [value.toLowerCase()];
    
    if (valueMappings[value]) {
        possibleValues.push(...valueMappings[value]);
    }
    
    for (const radio of radios) {
        const context = getElementContext(radio).toLowerCase();
        const radioValue = (radio.value || '').toLowerCase();
        const radioLabel = getRadioLabel(radio).toLowerCase();
        
        for (const possibleValue of possibleValues) {
            if (context.includes(possibleValue) || 
                radioValue.includes(possibleValue) || 
                radioLabel.includes(possibleValue)) {
                return radio;
            }
        }
    }
    
    return null;
}

function getElementContext(element) {
    // Get surrounding text context for better matching
    let context = '';
    
    // Element attributes
    context += ` ${element.name || ''} ${element.id || ''} ${element.placeholder || ''} ${element.className || ''}`;
    
    // Label text
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
        context += ` ${label.textContent}`;
    }
    
    // Parent element text
    const parent = element.parentElement;
    if (parent) {
        context += ` ${parent.textContent.slice(0, 100)}`;
    }
    
    return context;
}

function setInputValue(element, value) {
    try {
        if (!element || !element.tagName) {
            console.error('Invalid element for setInputValue:', element);
            return false;
        }
        
        const tagName = element.tagName.toLowerCase();
        const inputType = (element.type || '').toLowerCase();
        
        console.log(`Setting value "${value}" on ${tagName}[${inputType}] with name="${element.name}" id="${element.id}"`);
        
        // Skip hidden, time, date inputs to avoid conflicts
        if (inputType === 'hidden' || inputType === 'time' || inputType === 'date' || inputType === 'datetime-local') {
            console.log(`Skipping ${inputType} input to avoid conflicts`);
            return false;
        }
        
        // Handle different input types
        if (tagName === 'input' && (inputType === 'text' || inputType === '' || !inputType)) {
            // Clear the field first
            element.value = '';
            element.focus();
            
            // Simulate typing
            for (let i = 0; i < value.length; i++) {
                const char = value[i];
                const keydownEvent = new KeyboardEvent('keydown', {
                    key: char,
                    bubbles: true
                });
                const inputEvent = new InputEvent('input', {
                    inputType: 'insertText',
                    data: char,
                    bubbles: true
                });
                
                element.dispatchEvent(keydownEvent);
                element.value += char;
                element.dispatchEvent(inputEvent);
            }
            
            // Final events
            element.dispatchEvent(new Event('change', {bubbles: true}));
            element.dispatchEvent(new Event('blur', {bubbles: true}));
            
            console.log(`Successfully set input value to: "${element.value}"`);
            return true;
            
        } else if (tagName === 'textarea') {
            // Textarea
            element.value = '';
            element.focus();
            element.value = value;
            
            const events = ['input', 'change', 'blur'];
            events.forEach(eventType => {
                element.dispatchEvent(new Event(eventType, {bubbles: true}));
            });
            
            console.log(`Successfully set textarea value to: "${element.value}"`);
            return true;
            
        } else if (tagName === 'select') {
            // Select dropdown
            const option = Array.from(element.options).find(opt => 
                opt.text.toLowerCase().includes(value.toLowerCase()) ||
                opt.value.toLowerCase().includes(value.toLowerCase())
            );
            
            if (option) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', {bubbles: true}));
                console.log(`Successfully set select value to: "${element.value}"`);
                return true;
            }
            
        } else {
            console.warn('Unsupported element type for setInputValue:', tagName, inputType);
            return false;
        }
        
    } catch (error) {
        console.error('Error in setInputValue:', error);
        return false;
    }
    
    return false;
}

function updateResults(results, fieldName, result) {
    results.total++;
    if (result.success) {
        results.filled.push(fieldName);
    } else {
        results.failed.push({field: fieldName, error: result.error});
    }
}

function waitForFormLoad(timeout = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        function checkForm() {
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input, textarea, select');
            
            if (forms.length > 0 && inputs.length > 0) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                console.warn('Form load timeout, proceeding anyway');
                resolve();
            } else {
                setTimeout(checkForm, 100);
            }
        }
        
        checkForm();
    });
}

function showFillNotification(results) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        max-width: 300px;
    `;
    
    const successCount = results.filled.length;
    const totalCount = results.total;
    
    notification.innerHTML = `
        <strong>🤖 Auto Form Filler</strong><br>
        ✅ ${successCount}/${totalCount} field berhasil diisi<br>
        <small>Field: ${results.filled.join(', ')}</small>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function analyzeFormStructure() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea, select');
    const radios = document.querySelectorAll('input[type="radio"]');
    
    const analysis = {
        forms: forms.length,
        totalInputs: inputs.length,
        radioGroups: new Set(Array.from(radios).map(r => r.name)).size,
        textInputs: document.querySelectorAll('input[type="text"], textarea').length,
        selects: document.querySelectorAll('select').length,
        fields: []
    };
    
    // Analyze each input
    inputs.forEach(input => {
        analysis.fields.push({
            tag: input.tagName.toLowerCase(),
            type: input.type || '',
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            context: getElementContext(input).slice(0, 100)
        });
    });
    
    return analysis;
}

// Auto-analyze form on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Content script ready, analyzing form...');
    setTimeout(() => {
        const analysis = analyzeFormStructure();
        console.log('Form analysis:', analysis);
        
        // Log all text content for debugging Google Forms
        console.log('=== DEBUGGING GOOGLE FORMS ===');
        
        console.log('Google Forms Question Spans (span.M7eMe):');
        document.querySelectorAll('span.M7eMe').forEach((span, i) => {
            const text = span.textContent.trim().replace(/<br>/g, '');
            console.log(`${i}: "${text}"`);
        });
        
        console.log('Google Forms Radio Elements (div[role="radio"]):');
        document.querySelectorAll('div[role="radio"]').forEach((radio, i) => {
            console.log(`${i}: data-value="${radio.getAttribute('data-value')}" aria-label="${radio.getAttribute('aria-label')}" class="${radio.className}"`);
        });
        
        console.log('Traditional Radio Inputs:');
        document.querySelectorAll('input[type="radio"]').forEach((radio, i) => {
            console.log(`${i}: value="${radio.value}" name="${radio.name}" label="${getRadioLabel(radio)}"`);
        });
        
        console.log('Text Inputs and Textareas:');
        document.querySelectorAll('input[type="text"], textarea, input:not([type]):not([type="radio"]):not([type="checkbox"]):not([type="hidden"])').forEach((input, i) => {
            console.log(`${i}: type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}" class="${input.className}"`);
        });
        
        console.log('All Input Elements (all types):');
        document.querySelectorAll('input').forEach((input, i) => {
            console.log(`${i}: type="${input.type}" name="${input.name}" id="${input.id}" value="${input.value}" class="${input.className}"`);
        });
    }, 3000);
});

console.log('Advanced content script initialized'); 