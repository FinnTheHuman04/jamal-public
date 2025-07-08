// background.js - Service Worker for Chrome Extension v2.1.2
console.log('Background script loaded v2.1.2');

let scheduleWatcher = null;
let currentSchedule = null;
let isInitialized = false;

// Install event
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed, setting up background tasks');
    initializeBackground();
});

// Startup event  
chrome.runtime.onStartup.addListener(() => {
    console.log('Chrome started, restoring schedules');
    initializeBackground();
});

// Initialize background tasks
function initializeBackground() {
    console.log('Initializing background...');
    if (isInitialized) {
        console.log('Already initialized, skipping');
        return;
    }
    
    isInitialized = true;
    restoreScheduleFromStorage();
    
    // Test alarm functionality
    chrome.alarms.getAll((alarms) => {
        console.log('Current alarms:', alarms);
    });
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'setupSchedule':
            setupSchedule(request.schedule, request.formUrl, request.formData);
            sendResponse({success: true});
            break;
            
        case 'clearSchedule':
            clearSchedule();
            sendResponse({success: true});
            break;
            
        case 'openAndFillForm':
            openAndFillForm(request.formUrl, request.formData);
            sendResponse({success: true});
            break;
            
        case 'startScheduleWatcher':
            startScheduleWatcher();
            sendResponse({success: true});
            break;
            
        case 'stopScheduleWatcher':
            stopScheduleWatcher();
            sendResponse({success: true});
            break;
            
        case 'getScheduleStatus':
            sendResponse({
                schedule: currentSchedule,
                watcherActive: scheduleWatcher !== null
            });
            break;
            
        case 'debugSchedule':
            debugSchedule();
            sendResponse({success: true});
            break;
            
        default:
            sendResponse({success: false, error: 'Unknown action'});
    }
    
    return true; // Keep message channel open for async response
});

// Alarm listener for scheduled tasks
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('🔔 Alarm triggered:', alarm);
    
    if (alarm.name.startsWith('formSchedule_')) {
        console.log('📋 Form schedule alarm detected, handling...');
        handleScheduledFormFill();
    }
});

function setupSchedule(schedule, formUrl, formData) {
    console.log('🔧 Setting up schedule:', schedule, formUrl, formData);
    
    if (!schedule || !schedule.enabled) {
        console.log('❌ Schedule not enabled, skipping setup');
        return;
    }
    
    currentSchedule = {
        schedule: schedule,
        formUrl: formUrl,
        formData: formData,
        setupTime: new Date().toISOString()
    };
    
    // Save to storage for persistence
    chrome.storage.local.set({
        currentSchedule: currentSchedule
    }, () => {
        console.log('💾 Schedule saved to storage');
    });
    
    // Clear existing alarms first
    chrome.alarms.clearAll(() => {
        console.log('🧹 Cleared all existing alarms');
        
        if (schedule.enabled && schedule.days) {
            // Set up alarms for each enabled day
            const enabledDays = schedule.days.filter(dayData => dayData.enabled && dayData.time);
            console.log('📅 Setting up alarms for enabled days:', enabledDays);
            
            enabledDays.forEach(dayData => {
                setupDayAlarm(dayData.day, dayData.time);
            });
            
            // Start immediate watcher as backup
            startScheduleWatcher();
            
            // Log next alarm
            setTimeout(() => {
                chrome.alarms.getAll((alarms) => {
                    console.log('🕐 Active alarms after setup:', alarms);
                });
            }, 1000);
        }
    });
}

function setupDayAlarm(day, time) {
    const [hours, minutes] = time.split(':').map(Number);
    console.log(`⏰ Setting alarm for day ${day} at ${hours}:${minutes}`);
    
    // Calculate next occurrence of this day/time
    const now = new Date();
    const alarmTime = new Date();
    
    // Set to the specified time today
    alarmTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, move to next occurrence
    if (alarmTime <= now) {
        // Find next occurrence of this day
        const todayDay = now.getDay();
        let daysToAdd = (day - todayDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // Next week
        alarmTime.setDate(alarmTime.getDate() + daysToAdd);
    } else {
        // Adjust to the correct day of week if not today
        const todayDay = alarmTime.getDay();
        const dayDiff = (day - todayDay + 7) % 7;
        if (dayDiff > 0) {
            alarmTime.setDate(alarmTime.getDate() + dayDiff);
        }
    }
    
    const alarmName = `formSchedule_day${day}_${hours}${minutes}`;
    
    chrome.alarms.create(alarmName, {
        when: alarmTime.getTime(),
        periodInMinutes: 7 * 24 * 60 // Repeat weekly
    });
    
    console.log(`✅ Alarm ${alarmName} set for: ${alarmTime.toLocaleString()}`);
    
    // Verify alarm was created
    setTimeout(() => {
        chrome.alarms.get(alarmName, (alarm) => {
            if (alarm) {
                console.log(`✓ Alarm verified: ${alarmName} at ${new Date(alarm.scheduledTime).toLocaleString()}`);
            } else {
                console.error(`❌ Failed to create alarm: ${alarmName}`);
            }
        });
    }, 100);
}

function clearSchedule() {
    console.log('🗑️ Clearing schedule');
    
    currentSchedule = null;
    chrome.storage.local.remove('currentSchedule');
    chrome.alarms.clearAll(() => {
        console.log('🧹 All alarms cleared');
    });
    stopScheduleWatcher();
}

function startScheduleWatcher() {
    if (scheduleWatcher) {
        clearInterval(scheduleWatcher);
    }
    
    // Check every 30 seconds for more responsive scheduling
    scheduleWatcher = setInterval(() => {
        checkScheduleMatch();
    }, 30000); // 30 seconds
    
    console.log('👀 Schedule watcher started (30s interval)');
    
    // Immediate check
    setTimeout(() => {
        checkScheduleMatch();
    }, 1000);
}

function stopScheduleWatcher() {
    if (scheduleWatcher) {
        clearInterval(scheduleWatcher);
        scheduleWatcher = null;
        console.log('⏹️ Schedule watcher stopped');
    }
}

function checkScheduleMatch() {
    if (!currentSchedule || !currentSchedule.schedule.enabled) {
        console.log('⏸️ No active schedule to check');
        return;
    }
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour.toString().padStart(2, '0') + ':' + currentMinute.toString().padStart(2, '0');
    
    console.log(`🕐 Checking schedule - Day: ${currentDay}, Time: ${currentTime}`);
    
    // Check if current day/time matches any enabled schedule
    const matchingDay = currentSchedule.schedule.days.find(dayData => 
        dayData.enabled && 
        dayData.day === currentDay && 
        dayData.time === currentTime
    );
    
    if (matchingDay) {
        console.log('🎯 Schedule match found:', matchingDay);
        handleScheduledFormFill();
    } else {
        // Log active schedules for debugging
        const activeDays = currentSchedule.schedule.days.filter(d => d.enabled);
        console.log('📅 Active schedules:', activeDays);
    }
}

function handleScheduledFormFill() {
    if (!currentSchedule) {
        console.log('❌ No current schedule found');
        return;
    }
    
    console.log('🚀 Handling scheduled form fill');
    
    // Notify popup if open
    chrome.runtime.sendMessage({
        action: 'scheduleTriggered'
    }).catch(() => {
        console.log('📭 Popup not open for notification');
    });
    
    // Open and fill form
    openAndFillForm(currentSchedule.formUrl, currentSchedule.formData);
}

function openAndFillForm(formUrl, formData) {
    console.log('🌐 Opening and filling form:', formUrl, formData);
    
    if (!formUrl) {
        console.error('❌ No form URL provided');
        notifyFillError('URL form tidak ditemukan');
        return;
    }
    
    // Create new tab with the form
    chrome.tabs.create({
        url: formUrl,
        active: true
    }, (tab) => {
        if (chrome.runtime.lastError) {
            console.error('❌ Error creating tab:', chrome.runtime.lastError.message);
            notifyFillError('Gagal membuka tab baru');
            return;
        }
        
        console.log('🆕 Form tab created:', tab.id);
        
        // Wait for tab to load, then fill form
        chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo, updatedTab) {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                console.log('✅ Tab loaded, sending fill message');
                
                // Remove listener
                chrome.tabs.onUpdated.removeListener(tabUpdateListener);
                
                // Wait a bit for JavaScript to load
                setTimeout(() => {
                    // Send form data to content script
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'fillAdvancedForm',
                        formData: formData
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('❌ Error sending message to content script:', chrome.runtime.lastError.message);
                            notifyFillError('Gagal berkomunikasi dengan halaman form');
                        } else if (response && response.success) {
                            console.log('✅ Form filled successfully');
                            notifyFillSuccess();
                        } else {
                            console.error('❌ Form fill failed:', response);
                            notifyFillError(response ? response.error : 'Unknown error');
                        }
                    });
                }, 2000); // Wait 2 seconds for page to fully load
            }
        });
        
        // Timeout handler
        setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        }, 30000); // 30 second timeout
    });
}

function notifyFillSuccess() {
    chrome.runtime.sendMessage({
        action: 'formFilled'
    }).catch(() => {
        console.log('📭 Popup not open for success notification');
    });
}

function notifyFillError(error) {
    chrome.runtime.sendMessage({
        action: 'fillError',
        error: error
    }).catch(() => {
        console.log('📭 Popup not open for error notification');
    });
}

function restoreScheduleFromStorage() {
    console.log('🔄 Restoring schedule from storage...');
    
    chrome.storage.local.get(['currentSchedule'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('❌ Error loading from storage:', chrome.runtime.lastError.message);
            return;
        }
        
        if (result.currentSchedule) {
            console.log('📂 Found saved schedule:', result.currentSchedule);
            currentSchedule = result.currentSchedule;
            
            if (currentSchedule.schedule.enabled) {
                console.log('🟢 Schedule enabled, setting up alarms and watcher');
                setupAlarms();
                startScheduleWatcher();
            } else {
                console.log('🔴 Schedule disabled');
            }
        } else {
            console.log('📭 No saved schedule found');
        }
    });
}

function setupAlarms() {
    console.log('⚙️ Setting up alarms from restored schedule');
    
    // Clear existing alarms
    chrome.alarms.clearAll(() => {
        if (currentSchedule && currentSchedule.schedule.enabled) {
            currentSchedule.schedule.days.forEach(dayData => {
                if (dayData.enabled && dayData.time) {
                    setupDayAlarm(dayData.day, dayData.time);
                }
            });
        }
    });
}

function debugSchedule() {
    console.log('🐛 === SCHEDULE DEBUG INFO ===');
    console.log('Current schedule:', currentSchedule);
    console.log('Watcher active:', scheduleWatcher !== null);
    console.log('Is initialized:', isInitialized);
    
    const now = new Date();
    console.log('Current time:', now.toLocaleString());
    console.log('Current day:', now.getDay());
    
    chrome.alarms.getAll((alarms) => {
        console.log('Active alarms:', alarms);
        
        alarms.forEach(alarm => {
            console.log(`Alarm ${alarm.name}: ${new Date(alarm.scheduledTime).toLocaleString()}`);
        });
    });
    
    chrome.storage.local.get(['currentSchedule'], (result) => {
        console.log('Storage contents:', result);
    });
}

// Initialize on script load
initializeBackground();

// Clean up on extension unload
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onSuspend.addListener(() => {
        console.log('💤 Background script suspending, saving state');
        // Schedule is already saved to local storage
    });
} 