/**
 * Date Picker Module
 * Handles date and time selection UI
 */

// Constants
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// DOM elements
let monthSelect = null;
let daySelect = null;
let yearInput = null;
let eraSelect = null;
let hourSelect = null;
let utcTimeDisplay = null;

// State
let timezoneOffset = 0;
let onChangeCallback = null;

/**
 * Initialize the date picker
 * @param {Object} elements - DOM element references
 * @param {Object} defaults - Default values
 */
export function init(elements, defaults = {}) {
    monthSelect = elements.monthSelect;
    daySelect = elements.daySelect;
    yearInput = elements.yearInput;
    eraSelect = elements.eraSelect;
    hourSelect = elements.hourSelect;
    utcTimeDisplay = elements.utcTimeDisplay;
    
    // Set defaults
    const defaultValues = {
        month: defaults.month || 4,
        day: defaults.day || 3,
        year: defaults.year || 33,
        era: defaults.era || 'CE',
        hour: defaults.hour || 15
    };
    
    populateMonths(defaultValues.month);
    populateDays(defaultValues.month, defaultValues.day);
    populateHours(defaultValues.hour);
    
    if (yearInput) {
        yearInput.value = defaultValues.year;
    }
    
    if (eraSelect) {
        eraSelect.value = defaultValues.era;
    }
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Populate month dropdown
 * @param {number} selectedMonth - Default selected month (1-12)
 */
function populateMonths(selectedMonth) {
    if (!monthSelect) return;
    
    monthSelect.innerHTML = '';
    MONTHS.forEach((month, idx) => {
        const option = document.createElement('option');
        option.value = idx + 1;
        option.textContent = month;
        if (idx + 1 === selectedMonth) option.selected = true;
        monthSelect.appendChild(option);
    });
}

/**
 * Populate day dropdown based on month
 * @param {number} month - Month (1-12)
 * @param {number} selectedDay - Default selected day
 */
function populateDays(month, selectedDay) {
    if (!daySelect) return;
    
    const maxDays = getDaysInMonth(month);
    const currentDay = selectedDay || parseInt(daySelect.value) || 1;
    
    daySelect.innerHTML = '';
    for (let i = 1; i <= maxDays; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === Math.min(currentDay, maxDays)) option.selected = true;
        daySelect.appendChild(option);
    }
}

/**
 * Populate hour dropdown
 * @param {number} selectedHour - Default selected hour (0-23)
 */
function populateHours(selectedHour) {
    if (!hourSelect) return;
    
    hourSelect.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i.toString().padStart(2, '0') + ':00';
        if (i === selectedHour) option.selected = true;
        hourSelect.appendChild(option);
    }
}

/**
 * Get days in a month (simplified for historical dates)
 * @param {number} month - Month (1-12)
 * @returns {number} - Number of days
 */
function getDaysInMonth(month) {
    if (month === 2) return 28;
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    if (monthSelect) {
        monthSelect.addEventListener('change', function() {
            populateDays(parseInt(this.value));
            triggerChange();
        });
    }
    
    if (daySelect) {
        daySelect.addEventListener('change', triggerChange);
    }
    
    if (yearInput) {
        yearInput.addEventListener('change', triggerChange);
    }
    
    if (eraSelect) {
        eraSelect.addEventListener('change', triggerChange);
    }
    
    if (hourSelect) {
        hourSelect.addEventListener('change', function() {
            updateUtcDisplay();
            triggerChange();
        });
    }
}

/**
 * Trigger change callback
 */
function triggerChange() {
    if (onChangeCallback) {
        onChangeCallback(getValues());
    }
}

/**
 * Set timezone offset for UTC calculation
 * @param {number} offset - Offset in hours
 */
export function setTimezoneOffset(offset) {
    timezoneOffset = offset;
    updateUtcDisplay();
}

/**
 * Update UTC time display
 */
function updateUtcDisplay() {
    if (!utcTimeDisplay) return;
    
    const utcHour = getUtcHour();
    utcTimeDisplay.textContent = `UTC Time: ${utcHour.toString().padStart(2, '0')}:00`;
    utcTimeDisplay.style.display = 'block';
}

/**
 * Hide UTC display
 */
export function hideUtcDisplay() {
    if (utcTimeDisplay) {
        utcTimeDisplay.style.display = 'none';
    }
}

/**
 * Get UTC hour from local hour
 * @returns {number} - UTC hour (0-23)
 */
export function getUtcHour() {
    const hour = parseInt(hourSelect?.value || 0);
    let utcHour = hour - timezoneOffset;
    if (utcHour < 0) utcHour += 24;
    if (utcHour >= 24) utcHour -= 24;
    return utcHour;
}

/**
 * Get actual year (negative for BCE)
 * @returns {number}
 */
function getActualYear() {
    const year = parseInt(yearInput?.value) || 1;
    const era = eraSelect?.value || 'CE';
    return era === 'BCE' ? -Math.abs(year) : Math.abs(year);
}

/**
 * Get all current values
 * @returns {Object} - Current date/time values
 */
export function getValues() {
    return {
        month: parseInt(monthSelect?.value) || 1,
        day: parseInt(daySelect?.value) || 1,
        year: getActualYear(),
        hour: parseInt(hourSelect?.value) || 0,
        utcHour: getUtcHour()
    };
}

/**
 * Set change callback
 * @param {Function} callback - Function(values) called on change
 */
export function onChange(callback) {
    onChangeCallback = callback;
}
