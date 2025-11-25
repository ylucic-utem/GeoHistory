/**
 * Image Preview Module
 * Handles fullscreen image preview functionality
 */

// DOM elements
let modal = null;
let modalImage = null;
let modalClose = null;
let modalCaption = null;

/**
 * Initialize the image preview modal
 * @param {Object} elements - DOM element references
 */
export function init(elements) {
    modal = elements.modal;
    modalImage = elements.image;
    modalClose = elements.close;
    modalCaption = elements.caption;
    
    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Close button click
    if (modalClose) {
        modalClose.addEventListener('click', close);
    }
    
    // Click outside image to close
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                close();
            }
        });
    }
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            close();
        }
    });
}

/**
 * Open the preview modal with an image
 * @param {string} imageSrc - URL of the image to display
 * @param {string} caption - Optional caption text
 */
export function open(imageSrc, caption = '') {
    if (!modal || !modalImage) return;
    
    modalImage.src = imageSrc;
    
    if (modalCaption) {
        modalCaption.textContent = caption;
        modalCaption.style.display = caption ? 'block' : 'none';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the preview modal
 */
export function close() {
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    if (modalImage) {
        modalImage.src = '';
    }
}

/**
 * Attach click handler to an image element
 * @param {HTMLElement} imageElement - The image to make clickable
 * @param {string} caption - Optional caption for the preview
 */
export function attachToImage(imageElement, caption = '') {
    if (!imageElement) return;
    
    imageElement.style.cursor = 'pointer';
    imageElement.title = 'Click to view fullscreen';
    
    imageElement.addEventListener('click', function() {
        open(this.src, caption);
    });
}
