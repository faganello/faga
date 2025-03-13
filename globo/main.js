import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Globe {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.init();
        this.setupLighting();
        this.createGlobe();
        this.setupControls();
        this.countryPoints = new THREE.Group();
        this.scene.add(this.countryPoints);
        this.addNewsPoints();
        this.setupPointsInteraction();
        this.animate();
        this.handleResize();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('globe-container').appendChild(this.renderer.domElement);
        this.camera.position.z = 2.5;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
    }

    createGlobe() {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Load Earth texture
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
        const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
        const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
        
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specularMap,
            specular: new THREE.Color('grey'),
            shininess: 15
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);

        // Add atmosphere effect
        const atmosphereGeometry = new THREE.SphereGeometry(1.005, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x4040ff,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.1
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.globe.add(atmosphere);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 4;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addNewsPoints() {
        // Clear existing points
        while(this.countryPoints.children.length) {
            this.countryPoints.remove(this.countryPoints.children[0]);
        }

        // Add points for countries with news sources
        countries.forEach(country => {
            const sources = countriesData.loadSources(country.code);
            if (sources && sources.length > 0) {
                const point = this.createCountryPoint(country, sources);
                if (point) {
                    this.countryPoints.add(point);
                }
            }
        });
    }

    createCountryPoint(country, sources) {
        const coords = countryCoordinates[country.code];
        if (!coords) return null;

        const { lat, lng } = coords;
        const position = this.latLngToVector3(lat, lng, 1.02);
        
        const pointGroup = new THREE.Group();
        
        // Create a larger, more visible point
        const geometry = new THREE.SphereGeometry(0.015, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x00aa44,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position);
        point.userData = { country };
        pointGroup.add(point);

        // Add glowing ring
        const ringGeometry = new THREE.RingGeometry(0.02, 0.025, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        pointGroup.add(ring);

        // Add pulsing light
        const pulse = new THREE.PointLight(0x00ff88, 1.5, 0.2);
        pulse.position.copy(position);
        pointGroup.userData = { country };
        pointGroup.add(pulse);

        return pointGroup;
    }

    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);

        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    setupPointsInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            
            // First try to intersect with the point spheres
            const intersects = raycaster.intersectObjects(
                this.countryPoints.children.flatMap(group => 
                    group.children.filter(child => child instanceof THREE.Mesh)
                )
            );

            if (intersects.length > 0) {
                const point = intersects[0].object;
                const group = point.parent;
                const country = group.userData.country;
                if (country) {
                    showNewsCarousel(country);
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        
        // Remove the direct globe rotation since OrbitControls handles it
        // this.globe.rotation.y += 0.001;

        // Update points position to match globe rotation
        this.countryPoints.rotation.copy(this.globe.rotation);

        // Animate points
        this.countryPoints.children.forEach(point => {
            if (point.type === 'PointLight') {
                point.intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Country coordinates data
const countryCoordinates = {
    US: { lat: 37.0902, lng: -95.7129 },
    GB: { lat: 55.3781, lng: -3.4360 },
    CA: { lat: 56.1304, lng: -106.3468 },
    BR: { lat: -14.2350, lng: -51.9253 },
    FR: { lat: 46.2276, lng: 2.2137 },
    DE: { lat: 51.1657, lng: 10.4515 },
    IT: { lat: 41.8719, lng: 12.5674 },
    ES: { lat: 40.4637, lng: -3.7492 },
    PT: { lat: 39.3999, lng: -8.2245 },
    JP: { lat: 36.2048, lng: 138.2529 },
};

// Countries Management
const countriesData = {
    loadSources: function(countryCode) {
        const sources = localStorage.getItem(`newsSources_${countryCode}`);
        return sources ? JSON.parse(sources) : [];
    },

    saveSources: function(countryCode, sources) {
        localStorage.setItem(`newsSources_${countryCode}`, JSON.stringify(sources));
    },

    loadProxySettings: function() {
        const settings = localStorage.getItem('proxySettings');
        return settings ? JSON.parse(settings) : {
            baseUrl: 'https://freeiframegenerator.com/api/proxy?url=',
            additionalParams: '&width=800&height=600'
        };
    },

    saveProxySettings: function(settings) {
        localStorage.setItem('proxySettings', JSON.stringify(settings));
    }
};

const pageCache = {
    async set(url, content) {
        const timestamp = Date.now();
        const maxAge = parseInt(localStorage.getItem('cacheDuration') || '86400000'); // Default 24 hours
        const entry = { content, timestamp, maxAge };
        
        try {
            localStorage.setItem(`pageCache_${url}`, JSON.stringify(entry));
            // Force stats update
            this.updateStats();
        } catch (e) {
            // If storage is full, clear old entries
            this.clearExpired();
            try {
                localStorage.setItem(`pageCache_${url}`, JSON.stringify(entry));
                this.updateStats();
            } catch (e) {
                console.error('Cache storage failed:', e);
            }
        }
    },

    get(url) {
        const entry = localStorage.getItem(`pageCache_${url}`);
        if (!entry) return null;
        
        try {
            const { content, timestamp, maxAge } = JSON.parse(entry);
            const age = Date.now() - timestamp;
            
            if (age > maxAge) {
                localStorage.removeItem(`pageCache_${url}`);
                this.updateStats();
                return null;
            }
            
            return content;
        } catch (e) {
            localStorage.removeItem(`pageCache_${url}`);
            this.updateStats();
            return null;
        }
    },

    clearExpired() {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith('pageCache_')) {
                try {
                    const entry = JSON.parse(localStorage.getItem(key));
                    const age = Date.now() - entry.timestamp;
                    if (age > entry.maxAge) {
                        localStorage.removeItem(key);
                        cleared++;
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });
        
        this.updateStats();
        return cleared;
    },

    clearAll() {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith('pageCache_')) {
                localStorage.removeItem(key);
                cleared++;
            }
        });
        
        this.updateStats();
        return cleared;
    },

    getCacheStats() {
        const keys = Object.keys(localStorage);
        let size = 0;
        let count = 0;
        
        keys.forEach(key => {
            if (key.startsWith('pageCache_')) {
                const item = localStorage.getItem(key);
                if (item) {
                    size += item.length;
                    count++;
                }
            }
        });
        
        return {
            count,
            size: (size / 1024 / 1024).toFixed(2) // Size in MB
        };
    },

    updateStats() {
        const statsElement = document.querySelector('.cache-stats');
        if (statsElement) {
            const stats = this.getCacheStats();
            statsElement.innerHTML = `
                <h4>Cache Statistics</h4>
                <p>Cached pages: ${stats.count}</p>
                <p>Cache size: ${stats.size} MB</p>
            `;
        }
    }
};

function showNewsCarousel(country) {
    const sources = countriesData.loadSources(country.code);
    const modal = document.createElement('div');
    modal.className = 'news-carousel-modal';
    modal.innerHTML = `
        <div class="news-carousel">
            <div class="news-carousel-header">
                <div class="news-carousel-header-top">
                    <h3>${country.flag} ${country.name} News</h3>
                    <div class="news-carousel-header-buttons">
                        <button class="fullscreen-button">
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path fill="currentColor" d="M1.5 1h4v1.5h-2.5v2.5h-1.5v-4zm13 0v4h-1.5v-2.5h-2.5v-1.5h4zm-13 13v-4h-1.5v2.5h-2.5v1.5h4zm13 0h-4v-1.5h2.5v-2.5h1.5v4z"/>
                            </svg>
                        </button>
                        <button class="close-carousel">×</button>
                    </div>
                </div>
                <div class="preload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">Loading news sources...</div>
                </div>
            </div>
            <div class="news-tabs">
                <div class="news-tab active" data-tab="summary">Resumo</div>
                <div class="news-tab" data-tab="pages">Páginas</div>
            </div>
            <div class="news-tab-content summary active" data-tab="summary">
                <p style="color: #888; padding: 20px;">Em breve: Resumo das principais notícias.</p>
            </div>
            <div class="news-tab-content pages" data-tab="pages">
                <div class="news-pages-nav">
                    <button class="nav-button prev-page" disabled>Previous</button>
                    <span class="page-indicator">Page 1 of ${sources.length}</span>
                    <button class="nav-button next-page" ${sources.length <= 1 ? 'disabled' : ''}>Next</button>
                </div>
                <div class="news-sources-container">
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const sourcesContainer = modal.querySelector('.news-sources-container');
    const progressBar = modal.querySelector('.progress-fill');
    const progressText = modal.querySelector('.progress-text');

    // Create a cache for iframes and track loading progress
    const iframeCache = new Map();
    let loadedCount = 0;

    // Pre-create all iframes and start loading immediately
    sources.forEach((source, index) => {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'news-source';
        sourceDiv.style.display = index === 0 ? 'block' : 'none';

        const url = source.useProxy ? getProxyUrl(source.url) : source.url;
        const iframe = document.createElement('iframe');
        iframe.frameBorder = "0";
        iframe.scrolling = "yes";
        iframe.loading = "lazy";
        iframe.allowFullscreen = true;

        const cachedContent = pageCache.get(url);
        
        if (cachedContent) {
            iframe.srcdoc = cachedContent;
            sourceDiv.classList.add('loaded');
            loadedCount++;
            updateLoadingProgress();
        } else {
            iframe.src = url;
            iframe.addEventListener('load', async () => {
                try {
                    // Try to get content through iframe
                    let content;
                    try {
                        content = iframe.contentDocument.documentElement.outerHTML;
                    } catch (e) {
                        // If accessing contentDocument fails, fetch the URL directly
                        const response = await fetch(url);
                        content = await response.text();
                    }
                    
                    // Save to cache
                    await pageCache.set(url, content);
                    
                    loadedCount++;
                    updateLoadingProgress();
                    sourceDiv.classList.add('loaded');
                } catch (e) {
                    console.warn('Could not cache content:', e);
                    loadedCount++;
                    updateLoadingProgress();
                    sourceDiv.classList.add('loaded');
                }
            });
        }

        sourceDiv.appendChild(iframe);
        sourcesContainer.appendChild(sourceDiv);
        iframeCache.set(index, sourceDiv);
    });

    function updateLoadingProgress() {
        const progress = (loadedCount / sources.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Loading news sources... (${loadedCount}/${sources.length})`;
        
        // Hide progress bar when all sources are loaded
        if (loadedCount === sources.length) {
            setTimeout(() => {
                modal.querySelector('.preload-progress').style.display = 'none';
                // Update cache stats after loading completes
                if (document.querySelector('.cache-stats')) {
                    const stats = pageCache.getCacheStats();
                    document.querySelector('.cache-stats').innerHTML = `
                        <h4>Cache Statistics</h4>
                        <p>Cached pages: ${stats.count}</p>
                        <p>Cache size: ${stats.size} MB</p>
                    `;
                }
            }, 500);
        }
    }

    // Tab switching logic
    const tabs = modal.querySelectorAll('.news-tab');
    const tabContents = modal.querySelectorAll('.news-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            modal.querySelector(`.news-tab-content.${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Page navigation logic
    let currentPage = 0;
    const prevButton = modal.querySelector('.prev-page');
    const nextButton = modal.querySelector('.next-page');
    const pageIndicator = modal.querySelector('.page-indicator');

    function updatePage() {
        prevButton.disabled = currentPage === 0;
        nextButton.disabled = currentPage === sources.length - 1;
        pageIndicator.textContent = `Page ${currentPage + 1} of ${sources.length}`;
        
        // Hide all sources and show only the current one
        iframeCache.forEach((sourceDiv, index) => {
            sourceDiv.style.display = index === currentPage ? 'block' : 'none';
        });
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            updatePage();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < sources.length - 1) {
            currentPage++;
            updatePage();
        }
    });

    modal.querySelector('.close-carousel').addEventListener('click', () => {
        modal.remove();
    });

    // Fullscreen functionality
    const carousel = modal.querySelector('.news-carousel');
    const fullscreenButton = modal.querySelector('.fullscreen-button');
    
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            carousel.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Update fullscreen button icon based on state
    document.addEventListener('fullscreenchange', () => {
        const icon = fullscreenButton.querySelector('svg');
        if (document.fullscreenElement) {
            icon.innerHTML = '<path fill="currentColor" d="M5.5 1h-4v1.5h2.5v2.5h1.5v-4zm5 0v4h1.5v-2.5h2.5v-1.5h-4zm-5 13v-4h-1.5v2.5h-2.5v1.5h4zm5 0h4v-1.5h-2.5v-2.5h-1.5v4z"/>';
        } else {
            icon.innerHTML = '<path fill="currentColor" d="M1.5 1h4v1.5h-2.5v2.5h-1.5v-4zm13 0v4h-1.5v-2.5h-2.5v-1.5h4zm-13 13v-4h1.5v2.5h2.5v1.5h-4zm13 0h-4v-1.5h2.5v-2.5h1.5v4z"/>';
        }
    });
}

function showCountrySources(countryCode) {
    const country = countries.find(c => c.code === countryCode);
    const sources = countriesData.loadSources(countryCode);
    const content = document.querySelector('.settings-content');
    
    content.innerHTML = `
        <button class="back-button">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path fill="currentColor" d="M9.75 1.75L4 7.5l5.75 5.75"/>
            </svg>
            Back to Countries
        </button>
        <h3>${country.flag} ${country.name}</h3>
        <div class="country-sources">
            <div id="sources-list">
                ${sources.map(source => `
                    <div class="source-input-group">
                        <input type="checkbox" class="proxy-checkbox" ${source.useProxy ? 'checked' : ''}>
                        <input type="text" class="source-input" value="${source.url}" placeholder="Enter news source URL">
                        <button class="add-source-btn" onclick="this.parentElement.remove()">Remove</button>
                    </div>
                `).join('')}
            </div>
            <button class="add-source-btn" id="add-source">Add News Source</button>
            <button class="save-sources-btn" id="save-sources">Save Sources</button>
        </div>
    `;

    document.querySelector('.back-button').addEventListener('click', () => {
        createCountryList();
    });

    document.getElementById('add-source').addEventListener('click', () => {
        const sourcesList = document.getElementById('sources-list');
        const newSource = document.createElement('div');
        newSource.className = 'source-input-group';
        newSource.innerHTML = `
            <input type="checkbox" class="proxy-checkbox">
            <input type="text" class="source-input" placeholder="Enter news source URL">
            <button class="add-source-btn" onclick="this.parentElement.remove()">Remove</button>
        `;
        sourcesList.appendChild(newSource);
    });

    document.getElementById('save-sources').addEventListener('click', () => {
        const sourceElements = document.querySelectorAll('.source-input-group');
        const sources = Array.from(sourceElements).map(element => ({
            url: element.querySelector('.source-input').value.trim(),
            useProxy: element.querySelector('.proxy-checkbox').checked
        })).filter(source => source.url !== '');
        
        countriesData.saveSources(countryCode, sources);
        globe.addNewsPoints(); // Refresh points after saving sources
        
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            Sources saved successfully!
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('visible'), 100);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    });
}

function showProxySettings() {
    const settings = countriesData.loadProxySettings();
    const content = document.querySelector('.settings-content');
    
    content.innerHTML = `
        <div class="proxy-settings">
            <div class="proxy-option">
                <label>Proxy Base URL</label>
                <input type="text" id="proxy-base-url" value="${settings.baseUrl}" placeholder="https://freeiframegenerator.com/api/proxy?url=">
                <small style="color: #666; margin-top: 4px; display: block;">Default: https://freeiframegenerator.com/api/proxy?url=</small>
            </div>
            <div class="proxy-option">
                <label>Additional Parameters</label>
                <input type="text" id="proxy-params" value="${settings.additionalParams}" placeholder="&width=800&height=600">
                <small style="color: #666; margin-top: 4px; display: block;">
                    Examples:<br>
                    &width=800&height=600<br>
                    &scale=1.0&quality=1.0<br>
                    &delay=1000&timeout=30000
                </small>
            </div>
            <button class="save-sources-btn" id="save-proxy">Save Proxy Settings</button>
        </div>
    `;

    document.getElementById('save-proxy').addEventListener('click', () => {
        const settings = {
            baseUrl: document.getElementById('proxy-base-url').value,
            additionalParams: document.getElementById('proxy-params').value
        };
        countriesData.saveProxySettings(settings);
        
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            Proxy settings saved successfully!
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('visible'), 100);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    });
}

function showNavigationSettings() {
    const content = document.querySelector('.settings-content');
    const stats = pageCache.getCacheStats();
    const currentDuration = parseInt(localStorage.getItem('cacheDuration') || '86400000');
    
    content.innerHTML = `
        <div class="navigation-settings">
            <div class="cache-option">
                <label>Cache Duration (hours)</label>
                <input type="number" id="cache-duration" value="${currentDuration / 1000 / 60 / 60}" min="1" max="72">
                <small>How long to keep cached pages (1-72 hours)</small>
            </div>
            
            <div class="cache-stats">
                <h4>Cache Statistics</h4>
                <p>Cached pages: ${stats.count}</p>
                <p>Cache size: ${stats.size} MB</p>
            </div>
            
            <button class="clear-cache-btn" id="clear-cache">Clear Cache</button>
        </div>
    `;

    // Add event listeners
    document.getElementById('cache-duration').addEventListener('change', (e) => {
        const hours = Math.max(1, Math.min(72, parseInt(e.target.value) || 24));
        localStorage.setItem('cacheDuration', (hours * 60 * 60 * 1000).toString());
        e.target.value = hours;
    });

    document.getElementById('clear-cache').addEventListener('click', () => {
        const cleared = pageCache.clearAll();
        const stats = pageCache.getCacheStats();
        
        // Update stats display
        const statsDiv = document.querySelector('.cache-stats');
        statsDiv.innerHTML = `
            <h4>Cache Statistics</h4>
            <p>Cached pages: ${stats.count}</p>
            <p>Cache size: ${stats.size} MB</p>
            <p style="color: #4CAF50; margin-top: 8px;">Cleared ${cleared} cached pages</p>
        `;
    });
}

function createCountryList() {
    const content = document.querySelector('.settings-content');
    content.innerHTML = `
        <div class="country-list">
            ${countries.map(country => `
                <div class="country-item" data-code="${country.code}">
                    ${country.flag} ${country.name}
                </div>
            `).join('')}
        </div>
    `;

    content.querySelectorAll('.country-item').forEach(item => {
        item.addEventListener('click', () => showCountrySources(item.dataset.code));
    });
}

const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const closeSettings = document.getElementById('close-settings');
const sidebarItems = document.querySelectorAll('.settings-sidebar-item');

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.add('visible');
});

closeSettings.addEventListener('click', () => {
    settingsPanel.classList.remove('visible');
});

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        if (item.textContent === "Navigation") {
            showNavigationSettings();
        } else if (item.textContent === "Países e Fontes") {
            createCountryList();
        } else if (item.textContent === "Proxy") {
            showProxySettings();
        }
    });
});

// List of countries with flags
const countries = [
    { name: "United States", code: "US", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
    { name: "Canada", code: "CA", flag: "🇨🇦" },
    { name: "Brazil", code: "BR", flag: "🇧🇷" },
    { name: "France", code: "FR", flag: "🇫🇷" },
    { name: "Germany", code: "DE", flag: "🇩🇪" },
    { name: "Italy", code: "IT", flag: "🇮🇹" },
    { name: "Spain", code: "ES", flag: "🇪🇸" },
    { name: "Portugal", code: "PT", flag: "🇵🇹" },
    { name: "Japan", code: "JP", flag: "🇯🇵" },
    // Add more countries as needed
];

function initializeDefaultSources() {
    // Brazil default sources
    if (!localStorage.getItem('newsSources_BR')) {
        const brSources = [
            { url: 'https://g1.globo.com/', useProxy: true },
            { url: 'https://www.folha.uol.com.br/', useProxy: true },
            { url: 'https://www.cnnbrasil.com.br/', useProxy: true },
            { url: 'https://www.estadao.com.br/', useProxy: true }
        ];
        countriesData.saveSources('BR', brSources);
    }

    // USA default sources
    if (!localStorage.getItem('newsSources_US')) {
        const usSources = [
            { url: 'https://www.nytimes.com/', useProxy: true },
            { url: 'https://www.cnn.com/', useProxy: true },
            { url: 'https://www.washingtonpost.com/', useProxy: true },
            { url: 'https://www.bbc.com/news/world/us_and_canada', useProxy: true }
        ];
        countriesData.saveSources('US', usSources);
    }

    // UK default sources
    if (!localStorage.getItem('newsSources_GB')) {
        const gbSources = [
            { url: 'https://www.bbc.co.uk/news', useProxy: true },
            { url: 'https://www.theguardian.com/uk', useProxy: true },
            { url: 'https://www.independent.co.uk/', useProxy: true },
            { url: 'https://www.telegraph.co.uk/', useProxy: true }
        ];
        countriesData.saveSources('GB', gbSources);
    }

    // Canada default sources
    if (!localStorage.getItem('newsSources_CA')) {
        const caSources = [
            { url: 'https://www.cbc.ca/news', useProxy: true },
            { url: 'https://www.theglobeandmail.com/', useProxy: true },
            { url: 'https://www.nationalpost.com/', useProxy: true },
            { url: 'https://www.ctvnews.ca/', useProxy: true }
        ];
        countriesData.saveSources('CA', caSources);
    }

    // France default sources
    if (!localStorage.getItem('newsSources_FR')) {
        const frSources = [
            { url: 'https://www.lemonde.fr/', useProxy: true },
            { url: 'https://www.lefigaro.fr/', useProxy: true },
            { url: 'https://www.liberation.fr/', useProxy: true },
            { url: 'https://www.france24.com/fr/', useProxy: true }
        ];
        countriesData.saveSources('FR', frSources);
    }

    // Germany default sources
    if (!localStorage.getItem('newsSources_DE')) {
        const deSources = [
            { url: 'https://www.spiegel.de/', useProxy: true },
            { url: 'https://www.zeit.de/', useProxy: true },
            { url: 'https://www.faz.net/', useProxy: true },
            { url: 'https://www.dw.com/de/', useProxy: true }
        ];
        countriesData.saveSources('DE', deSources);
    }

    // Italy default sources
    if (!localStorage.getItem('newsSources_IT')) {
        const itSources = [
            { url: 'https://www.corriere.it/', useProxy: true },
            { url: 'https://www.repubblica.it/', useProxy: true },
            { url: 'https://www.lastampa.it/', useProxy: true },
            { url: 'https://www.ilmessaggero.it/', useProxy: true }
        ];
        countriesData.saveSources('IT', itSources);
    }

    // Spain default sources
    if (!localStorage.getItem('newsSources_ES')) {
        const esSources = [
            { url: 'https://elpais.com/', useProxy: true },
            { url: 'https://www.abc.es/', useProxy: true },
            { url: 'https://www.lavanguardia.com/', useProxy: true },
            { url: 'https://www.elmundo.es/', useProxy: true }
        ];
        countriesData.saveSources('ES', esSources);
    }

    // Portugal default sources
    if (!localStorage.getItem('newsSources_PT')) {
        const ptSources = [
            { url: 'https://www.publico.pt/', useProxy: true },
            { url: 'https://www.dn.pt/', useProxy: true },
            { url: 'https://www.cmjornal.pt/', useProxy: true },
            { url: 'https://expresso.pt/', useProxy: true }
        ];
        countriesData.saveSources('PT', ptSources);
    }

    // Japan default sources
    if (!localStorage.getItem('newsSources_JP')) {
        const jpSources = [
            { url: 'https://www.japantimes.co.jp/', useProxy: true },
            { url: 'https://www.asahi.com/', useProxy: true },
            { url: 'https://mainichi.jp/', useProxy: true },
            { url: 'https://www.nikkei.com/', useProxy: true }
        ];
        countriesData.saveSources('JP', jpSources);
    }
}

function getProxyUrl(url) {
    const settings = countriesData.loadProxySettings();
    const encodedUrl = encodeURIComponent(url);
    return `${settings.baseUrl}${encodedUrl}${settings.additionalParams}`;
}

// Initialize the globe and default sources
initializeDefaultSources();
const globe = new Globe();