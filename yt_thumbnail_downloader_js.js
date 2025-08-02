// YouTube Thumbnail Downloader Pro - Complete JavaScript
// Author: Professional Development Team
// Version: 2025.1.0
// Features: 8K Enhancement, Black Bar Removal, Image Processing

(function() {
    'use strict';

    // Global variables
    let currentVideoId = '';
    let processingCanvas = null;
    let tempCanvas = null;
    let isDarkMode = false;

    // Initialize the application
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        loadUserPreferences();
    });

    // Initialize application
    function initializeApp() {
        processingCanvas = document.getElementById('ytp-processing-canvas');
        tempCanvas = document.getElementById('ytp-temp-canvas');
        
        if (!processingCanvas || !tempCanvas) {
            console.warn('Canvas elements not found, creating dynamically');
            createCanvasElements();
        }

        // Setup canvas contexts
        if (processingCanvas && tempCanvas) {
            processingCanvas.style.display = 'none';
            tempCanvas.style.display = 'none';
        }

        // Initialize smooth scrolling
        initializeSmoothScrolling();
    }

    // Create canvas elements if they don't exist
    function createCanvasElements() {
        const container = document.querySelector('.ytp-canvas-container') || document.body;
        
        if (!processingCanvas) {
            processingCanvas = document.createElement('canvas');
            processingCanvas.id = 'ytp-processing-canvas';
            processingCanvas.style.display = 'none';
            container.appendChild(processingCanvas);
        }
        
        if (!tempCanvas) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.id = 'ytp-temp-canvas';
            tempCanvas.style.display = 'none';
            container.appendChild(tempCanvas);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        const urlInput = document.getElementById('ytp-youtube-url');
        const extractBtn = document.getElementById('ytp-extract-btn');

        if (urlInput) {
            urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
                    e.preventDefault();
                    ytpExtractThumbnails();
                }
            });

            urlInput.addEventListener('paste', function(e) {
                setTimeout(() => {
                    const url = e.target.value.trim();
                    if (url && isValidYouTubeURL(url)) {
                        showToast('Valid YouTube URL detected!', 'success');
                    }
                }, 100);
            });
        }

        if (extractBtn) {
            extractBtn.addEventListener('click', ytpExtractThumbnails);
        }

        // Add scroll event for header
        window.addEventListener('scroll', handleHeaderScroll);
    }

    // Header scroll effect
    function handleHeaderScroll() {
        const header = document.querySelector('.ytp-nav-header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'var(--background-secondary)';
                header.style.backdropFilter = 'var(--backdrop-blur)';
            } else {
                header.style.background = 'var(--background-secondary)';
            }
        }
    }

    // Load user preferences
    function loadUserPreferences() {
        try {
            const savedTheme = localStorage.getItem('ytp-theme');
            if (savedTheme === 'dark') {
                enableDarkMode();
            }
        } catch (e) {
            console.log('LocalStorage not available, using defaults');
        }
    }

    // Save user preferences
    function saveUserPreferences() {
        try {
            localStorage.setItem('ytp-theme', isDarkMode ? 'dark' : 'light');
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    // Theme toggle functionality
    window.toggleTheme = function() {
        if (isDarkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
        saveUserPreferences();
    };

    // Enable dark mode
    function enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
        isDarkMode = true;
    }

    // Disable dark mode
    function disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '🌙';
        }
        isDarkMode = false;
    }

    // Mobile menu toggle
    window.toggleMobileMenu = function() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('active');
        }
    };

    // FAQ toggle functionality
    window.toggleFAQ = function(element) {
        const answer = element.nextElementSibling;
        const isActive = element.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.ytp-faq-question').forEach(q => {
            q.classList.remove('active');
            q.nextElementSibling.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!isActive) {
            element.classList.add('active');
            answer.classList.add('active');
        }
    };

    // Smooth scrolling
    window.scrollToSection = function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = document.querySelector('.ytp-nav-header')?.offsetHeight || 70;
            const targetPosition = element.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Initialize smooth scrolling for anchor links
    function initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
            });
        });
    }

    // Validate YouTube URL
    function isValidYouTubeURL(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return regex.test(url);
    }

    // Extract video ID from YouTube URL
    function extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Main thumbnail extraction function
    window.ytpExtractThumbnails = async function() {
        const urlInput = document.getElementById('ytp-youtube-url');
        const extractBtn = document.getElementById('ytp-extract-btn');
        const errorDiv = document.getElementById('ytp-error');
        const resultsDiv = document.getElementById('ytp-results');
        const processingDiv = document.getElementById('ytp-processing-status');

        if (!urlInput || !extractBtn) {
            console.error('Required elements not found');
            return;
        }

        const url = urlInput.value.trim();

        // Validate URL
        if (!url) {
            showError('Please enter a YouTube video URL');
            return;
        }

        if (!isValidYouTubeURL(url)) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        // Extract video ID
        const videoId = extractVideoId(url);
        if (!videoId) {
            showError('Could not extract video ID from URL');
            return;
        }

        currentVideoId = videoId;

        // Reset UI
        hideError();
        hideResults();
        showProcessing();

        // Disable button
        extractBtn.disabled = true;
        extractBtn.textContent = 'Processing...';

        try {
            await processThumbnails(videoId);
            showToast('Thumbnails extracted successfully!', 'success');
        } catch (error) {
            console.error('Error processing thumbnails:', error);
            showError('Failed to extract thumbnails. Please try again.');
        } finally {
            // Re-enable button
            extractBtn.disabled = false;
            extractBtn.textContent = 'Download Thumbnails';
            hideProcessing();
        }
    };

    // Process thumbnails based on enhancement setting
    async function processThumbnails(videoId) {
        const enhance8K = document.getElementById('ytp-smooth-8k')?.checked || false;
        
        let thumbnailSizes;
        
        if (enhance8K) {
            // Pro versions only - 8K Enhancement enabled
            thumbnailSizes = [
                { name: '8K Ultra Pro', width: 7680, height: 4320, quality: 'maxresdefault', pro: true },
                { name: '5K Pro', width: 5120, height: 2880, quality: 'maxresdefault', pro: true },
                { name: '4K Pro', width: 3840, height: 2160, quality: 'maxresdefault', pro: true },
                { name: '2K Pro', width: 2560, height: 1440, quality: 'maxresdefault', pro: true },
                { name: '1080p Pro', width: 1920, height: 1080, quality: 'maxresdefault', pro: true },
                { name: '720p Pro', width: 1280, height: 720, quality: 'hqdefault', pro: true },
                { name: '480p Pro', width: 640, height: 480, quality: 'sddefault', pro: true },
                { name: '360p Pro', width: 480, height: 360, quality: 'hqdefault', pro: true },
                { name: '240p Pro', width: 320, height: 240, quality: 'mqdefault', pro: true },
                { name: '144p Pro', width: 256, height: 144, quality: 'default', pro: true }
            ];
        } else {
            // Normal versions only - up to 1080p, no black bar removal for 1080p
            thumbnailSizes = [
                { name: '1080p', width: 1920, height: 1080, quality: 'maxresdefault', normal: true, noBlackBarRemoval: true },
                { name: '720p', width: 1280, height: 720, quality: 'hqdefault', normal: true },
                { name: '480p', width: 640, height: 480, quality: 'sddefault', normal: true },
                { name: '360p', width: 480, height: 360, quality: 'hqdefault', normal: true },
                { name: '240p', width: 320, height: 240, quality: 'mqdefault', normal: true },
                { name: '144p', width: 256, height: 144, quality: 'default', normal: true }
            ];
        }

        const grid = document.getElementById('ytp-thumbnails-grid');
        if (!grid) return;

        grid.innerHTML = '';
        updateProgress(0, 'Initializing thumbnail extraction...');

        for (let i = 0; i < thumbnailSizes.length; i++) {
            const size = thumbnailSizes[i];
            const progress = ((i + 1) / thumbnailSizes.length) * 100;
            
            updateProgress(progress, `Processing ${size.name} thumbnail...`);

            try {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${size.quality}.jpg`;
                
                let processedImageData;
                
                if (size.pro) {
                    // Pro processing with all enhancements
                    processedImageData = await enhanceImagePro(thumbnailUrl, size.width, size.height);
                } else {
                    // Normal processing
                    const removeBlackBars = !size.noBlackBarRemoval;
                    processedImageData = await processImageNormal(thumbnailUrl, removeBlackBars);
                }

                if (processedImageData) {
                    createThumbnailCard(size, processedImageData, videoId);
                }
            } catch (error) {
                console.warn(`Failed to process ${size.name}:`, error);
            }

            // Small delay for smooth progress animation
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        updateProgress(100, 'All thumbnails processed successfully!');
        showResults();
    }

    // Enhanced Pro image processing with focus on clarity
    async function enhanceImagePro(imageUrl, targetWidth, targetHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    if (!processingCanvas || !tempCanvas) {
                        createCanvasElements();
                    }

                    const ctx = processingCanvas.getContext('2d');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Remove black bars first
                    const blackBarResult = removeBlackBars(img, tempCtx);
                    let sourceX = blackBarResult.x;
                    let sourceY = blackBarResult.y;
                    let sourceWidth = blackBarResult.width;
                    let sourceHeight = blackBarResult.height;

                    // Calculate optimal dimensions maintaining aspect ratio
                    const aspectRatio = sourceWidth / sourceHeight;
                    let finalWidth = targetWidth;
                    let finalHeight = Math.round(targetWidth / aspectRatio);
                    
                    if (finalHeight > targetHeight) {
                        finalHeight = targetHeight;
                        finalWidth = Math.round(targetHeight * aspectRatio);
                    }

                    // Set canvas size
                    processingCanvas.width = finalWidth;
                    processingCanvas.height = finalHeight;

                    // Enable high-quality image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw the image with careful upscaling
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalWidth, finalHeight);

                    // Apply Pro enhancements focused on clarity
                    applyProEnhancements(ctx, finalWidth, finalHeight);

                    // Convert to blob with maximum quality
                    processingCanvas.toBlob(resolve, 'image/jpeg', 0.98);
                    
                } catch (error) {
                    console.error('Error enhancing Pro image:', error);
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    // Normal image processing
    async function processImageNormal(imageUrl, removeBlackBars = true) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    if (!processingCanvas || !tempCanvas) {
                        createCanvasElements();
                    }

                    const ctx = processingCanvas.getContext('2d');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    let sourceX = 0;
                    let sourceY = 0;
                    let sourceWidth = img.width;
                    let sourceHeight = img.height;

                    // Remove black bars if enabled
                    if (removeBlackBars) {
                        const blackBarResult = removeBlackBars(img, tempCtx);
                        sourceX = blackBarResult.x;
                        sourceY = blackBarResult.y;
                        sourceWidth = blackBarResult.width;
                        sourceHeight = blackBarResult.height;
                    }

                    // Set canvas size to original dimensions
                    processingCanvas.width = sourceWidth;
                    processingCanvas.height = sourceHeight;

                    // Draw the image without upscaling
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

                    // Convert to blob with good quality
                    processingCanvas.toBlob(resolve, 'image/jpeg', 0.92);
                    
                } catch (error) {
                    console.error('Error processing normal image:', error);
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    // Remove black bars from image
    function removeBlackBars(img, ctx) {
        const canvas = tempCanvas;
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        let topBlackBars = 0;
        let bottomBlackBars = 0;
        let leftBlackBars = 0;
        let rightBlackBars = 0;

        const threshold = 35; // Threshold for considering a pixel "black"

        // Detect top black bars
        for (let y = 0; y < img.height; y++) {
            let isBlackRow = true;
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (isBlackRow) {
                topBlackBars++;
            } else {
                break;
            }
        }

        // Detect bottom black bars
        for (let y = img.height - 1; y >= 0; y--) {
            let isBlackRow = true;
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (isBlackRow) {
                bottomBlackBars++;
            } else {
                break;
            }
        }

        // Detect left black bars
        for (let x = 0; x < img.width; x++) {
            let isBlackCol = true;
            for (let y = topBlackBars; y < img.height - bottomBlackBars; y++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (isBlackCol) {
                leftBlackBars++;
            } else {
                break;
            }
        }

        // Detect right black bars
        for (let x = img.width - 1; x >= 0; x--) {
            let isBlackCol = true;
            for (let y = topBlackBars; y < img.height - bottomBlackBars; y++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (isBlackCol) {
                rightBlackBars++;
            } else {
                break;
            }
        }

        return {
            x: leftBlackBars,
            y: topBlackBars,
            width: img.width - leftBlackBars - rightBlackBars,
            height: img.height - topBlackBars - bottomBlackBars
        };
    }

    // Apply Pro enhancements focused on image clarity
    function applyProEnhancements(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Gentle brightness and contrast enhancement to maintain natural colors
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Subtle brightness boost (5%)
            r = Math.min(255, r * 1.05);
            g = Math.min(255, g * 1.05);
            b = Math.min(255, b * 1.05);

            // Gentle contrast enhancement
            r = Math.min(255, Math.max(0, ((r - 128) * 1.08) + 128));
            g = Math.min(255, Math.max(0, ((g - 128) * 1.08) + 128));
            b = Math.min(255, Math.max(0, ((b - 128) * 1.08) + 128));

            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
        }

        // Apply subtle sharpening for clarity
        applySharpeningFilter(data, width, height);
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Gentle sharpening filter that preserves colors
    function applySharpeningFilter(data, width, height) {
        const sharpenedData = new Uint8ClampedArray(data);
        
        // Gentle sharpening kernel
        const kernel = [
            [0, -0.3, 0],
            [-0.3, 2.2, -0.3],
            [0, -0.3, 0]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += data[pixelIndex] * kernel[ky + 1][kx + 1];
                        }
                    }
                    const index = (y * width + x) * 4 + c;
                    sharpenedData[index] = Math.min(255, Math.max(0, sum));
                }
            }
        }
        
        // Copy sharpened data back
        for (let i = 0; i < data.length; i += 4) {
            data[i] = sharpenedData[i];
            data[i + 1] = sharpenedData[i + 1];
            data[i + 2] = sharpenedData[i + 2];
        }
    }

    // Create thumbnail card
    function createThumbnailCard(size, imageBlob, videoId) {
        const grid = document.getElementById('ytp-thumbnails-grid');
        if (!grid) return;

        const card = document.createElement('div');
        card.className = 'ytp-thumbnail-item';

        const img = document.createElement('img');
        img.className = 'ytp-thumbnail-img';
        img.src = URL.createObjectURL(imageBlob);
        img.alt = `${size.name} YouTube Thumbnail`;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'ytp-thumbnail-info';

        const quality = document.createElement('div');
        quality.className = 'ytp-thumbnail-quality';
        
        const qualityText = document.createElement('span');
        qualityText.textContent = size.name;
        
        const badge = document.createElement('span');
        badge.className = `ytp-quality-badge ${size.pro ? 'ytp-pro' : ''}`;
        badge.textContent = size.pro ? 'PRO' : 'STD';
        
        quality.appendChild(qualityText);
        quality.appendChild(badge);

        const resolution = document.createElement('div');
        resolution.className = 'ytp-thumbnail-resolution';
        resolution.textContent = `${size.width} × ${size.height} pixels`;

        // Enhancement indicators for Pro versions
        if (size.pro) {
            const enhancements = document.createElement('div');
            enhancements.innerHTML = `
                <div class="ytp-enhancement-indicator">✨ Black Bars Removed</div>
                <div class="ytp-enhancement-indicator">🚀 8K Enhanced</div>
                <div class="ytp-enhancement-indicator">⚡ Sharpness Boost</div>
                <div class="ytp-enhancement-indicator">🎨 Color Enhanced</div>
            `;
            info.appendChild(enhancements);
        }

        const downloadBtn = document.createElement('button');
        downloadBtn.className = `ytp-download-btn ${size.pro ? 'ytp-pro' : ''}`;
        downloadBtn.textContent = size.pro ? 'Pro Download' : 'Normal Download';
        downloadBtn.onclick = () => downloadThumbnail(imageBlob, `YouTube_Thumbnail_${videoId}_${size.name.replace(/\s+/g, '_')}.jpg`);

        info.appendChild(quality);
        info.appendChild(resolution);
        info.appendChild(downloadBtn);

        card.appendChild(img);
        card.appendChild(info);
        grid.appendChild(card);
    }

    // Download thumbnail
    function downloadThumbnail(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Downloaded: ${filename}`, 'success');
    }

    // UI Helper Functions
    function showProcessing() {
        const processingDiv = document.getElementById('ytp-processing-status');
        if (processingDiv) {
            processingDiv.style.display = 'block';
        }
    }

    function hideProcessing() {
        const processingDiv = document.getElementById('ytp-processing-status');
        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
    }

    function updateProgress(percentage, message) {
        const progressFill = document.getElementById('ytp-progress-fill');
        const statusText = document.getElementById('ytp-status-text');
        const processingInfo = document.getElementById('ytp-processing-info');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (processingInfo) {
            processingInfo.textContent = `${Math.round(percentage)}% complete`;
        }
    }

    function showResults() {
        const resultsDiv = document.getElementById('ytp-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function hideResults() {
        const resultsDiv = document.getElementById('ytp-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById('ytp-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                hideError();
            }, 5000);
        }
        showToast(message, 'error');
    }

    function hideError() {
        const errorDiv = document.getElementById('ytp-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.ytp-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `ytp-toast ytp-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('ytp-show');
        }, 100);

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('ytp-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Cleanup function for memory management
    function cleanup() {
        // Clean up canvas contexts
        if (processingCanvas) {
            const ctx = processingCanvas.getContext('2d');
            ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
        }
        
        if (tempCanvas) {
            const ctx = tempCanvas.getContext('2d');
            ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // Clean up blob URLs
        document.querySelectorAll('.ytp-thumbnail-img').forEach(img => {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }

    // Auto cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to extract thumbnails
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            ytpExtractThumbnails();
        }
        
        // Escape to close mobile menu
        if (e.key === 'Escape') {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
    });

    // Export functions for external use
    window.YTThumbnailDownloader = {
        extractThumbnails: ytpExtractThumbnails,
        downloadThumbnail: downloadThumbnail,
        cleanup: cleanup,
        showToast: showToast,
        isValidYouTubeURL: isValidYouTubeURL,
        extractVideoId: extractVideoId,
        toggleTheme: window.toggleTheme,
        toggleMobileMenu: window.toggleMobileMenu,
        scrollToSection: window.scrollToSection
    };

    // Console welcome message
    console.log(`
    🚀 YouTube Thumbnail Downloader Pro v2025.1.0
    =============================================
    
    Features loaded:
    ✅ 8K Ultra HD Enhancement
    ✅ Smart Black Bar Removal
    ✅ Pro Image Processing
    ✅ Responsive Design
    ✅ Dark Mode Support
    ✅ Performance Optimization
    
    8K Upscaling: Enhanced Pro versions (144p-8K)
    Normal Mode: Standard versions (144p-1080p)
    `);

})();

// Additional utility functions
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add resize handler with debouncing
window.addEventListener('resize', debounce(() => {
    // Handle responsive adjustments
    const thumbnails = document.querySelectorAll('.ytp-thumbnail-item');
    thumbnails.forEach(thumbnail => {
        // Adjust thumbnail sizes based on new viewport
        thumbnail.style.transition = 'all 0.3s ease';
    });
}, 250));

// Add smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const headerHeight = 70;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', smoothScrollPolyfill);
    } else {
        smoothScrollPolyfill();
    }
}
