// Perwez Associate - Static Site Scripts

const WHATSAPP_NUMBER = '917479889661';

function setupWhatsAppQuoteForm() {
    const form = document.getElementById('whatsapp-quote-form');
    const status = document.getElementById('quote-form-status');
    const contactError = document.getElementById('quote-contact-error');

    if (!form || !status) {
        return;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const contact = String(formData.get('contact') || '').trim();
        const category = String(formData.get('category') || '').trim();
        const message = String(formData.get('message') || '').trim();

        // Basic validation with helpful error feedback
        const phonePattern = /^\+?[0-9\s\-]{7,20}$/;
        if (!name || !contact || !category || !message) {
            status.textContent = 'Please fill all fields before sending.';
            return;
        }

        if (!phonePattern.test(contact)) {
            if (contactError) {
                contactError.textContent = 'Please enter a valid contact number (digits, +, spaces or -).';
                document.getElementById('quote-contact').setAttribute('aria-invalid', 'true');
            }
            return;
        } else {
            if (contactError) {
                contactError.textContent = '';
                document.getElementById('quote-contact').removeAttribute('aria-invalid');
            }
        }

        const whatsappMessage = [
            'Hello Perwez Associate,',
            '',
            'I want a free quote.',
            `Name: ${name}`,
            `Contact No: ${contact}`,
            `Category: ${category}`,
            `Message: ${message}`
        ].join('\n');

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

        status.textContent = 'Opening WhatsApp with your quote details...';
        window.open(whatsappUrl, '_blank', 'noopener');
        form.reset();
    });
}

function buildGallerySocialMarkup() {
    return `
        <div class="gallery-social">
            <div class="gallery-social-actions">
                <button type="button" class="gallery-action-btn" data-gallery-support aria-label="Support this post">
                    <i class="fa-regular fa-heart" aria-hidden="true"></i>
                </button>
                <button type="button" class="gallery-action-btn" data-gallery-share aria-label="Share this post">
                    <i class="fa-regular fa-paper-plane" aria-hidden="true"></i>
                </button>
            </div>
            <div class="gallery-social-meta">
                <div class="gallery-support-count"><span data-gallery-support-count>128</span> supporters</div>
            </div>
            <div class="gallery-share-status" data-gallery-share-status aria-live="polite"></div>
        </div>
    `;
}

function setGallerySupportState(supportButton, supportIcon, supportCount, shareStatus, shouldSupport) {
    if (!supportButton || !supportIcon || !supportCount) {
        return;
    }

    supportButton.classList.toggle('is-supported', shouldSupport);
    supportIcon.className = shouldSupport ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    supportCount.textContent = String(shouldSupport ? 129 : 128);

    if (shareStatus) {
        shareStatus.textContent = shouldSupport ? 'Thanks for your support.' : '';
    }
}

function setupGallerySocialFeed() {
    const items = document.querySelectorAll('.gallery-item');

    if (!items.length) {
        return;
    }

    items.forEach((item, index) => {
        if (item.querySelector('.gallery-social')) {
            return;
        }

        const title = item.getAttribute('data-gallery-title') || `Project ${index + 1}`;
        const caption = item.querySelector('.gallery-caption');

        if (!caption) {
            return;
        }

        caption.insertAdjacentHTML('afterend', buildGallerySocialMarkup());

        const supportButton = item.querySelector('[data-gallery-support]');
        const supportIcon = supportButton?.querySelector('i');
        const supportCount = item.querySelector('[data-gallery-support-count]');
        const shareButton = item.querySelector('[data-gallery-share]');
        const shareStatus = item.querySelector('[data-gallery-share-status]');
        const media = item.querySelector('img, video');
        let lastTapTime = 0;

        if (supportButton && supportIcon && supportCount) {
            supportButton.addEventListener('click', () => {
                const supported = !supportButton.classList.contains('is-supported');
                setGallerySupportState(supportButton, supportIcon, supportCount, shareStatus, supported);
            });
        }

        media?.addEventListener('dblclick', () => {
            setGallerySupportState(supportButton, supportIcon, supportCount, shareStatus, true);
        });

        media?.addEventListener('touchend', () => {
            const currentTime = Date.now();
            if (currentTime - lastTapTime <= 320) {
                setGallerySupportState(supportButton, supportIcon, supportCount, shareStatus, true);
            }
            lastTapTime = currentTime;
        }, { passive: true });

        shareButton?.addEventListener('click', async () => {
            const shareUrl = media?.getAttribute('src') || media?.querySelector('source')?.getAttribute('src') || window.location.href;
            const absoluteUrl = new URL(shareUrl, window.location.href).href;
            const shareData = {
                title: `Perwez Associate - ${title}`,
                text: `Check out this gallery update: ${title}`,
                url: absoluteUrl
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    if (shareStatus) {
                        shareStatus.textContent = 'Shared successfully.';
                    }
                } else if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(absoluteUrl);
                    if (shareStatus) {
                        shareStatus.textContent = 'Link copied to clipboard.';
                    }
                } else if (shareStatus) {
                    shareStatus.textContent = 'Sharing is not supported on this device.';
                }
            } catch (error) {
                if (shareStatus && error?.name !== 'AbortError') {
                    shareStatus.textContent = 'Could not share right now.';
                }
            }
        });
        // mark index for lightbox navigation and open on click/keyboard
        item.setAttribute('data-gallery-index', String(index));
        item.addEventListener('click', () => openLightbox(index));
        item.addEventListener('keypress', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                openLightbox(index);
            }
        });
    });
}

/* Lightweight lightbox for images and videos */
let _lightbox = null;
function createLightbox() {
    if (_lightbox) return _lightbox;
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'lightbox-content';

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'lightbox-media-wrap';

    const mediaEl = document.createElement('div');
    mediaEl.className = 'lightbox-media';

    const controls = document.createElement('div');
    controls.className = 'lightbox-controls';

    const title = document.createElement('div');
    title.className = 'lightbox-title';
    title.textContent = '';

    const btns = document.createElement('div');
    btns.className = 'lightbox-btns';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-btn';
    prevBtn.innerHTML = '&#9664;';
    prevBtn.title = 'Previous (Arrow Left)';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-btn';
    nextBtn.innerHTML = '&#9654;';
    nextBtn.title = 'Next (Arrow Right)';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close (Esc)';

    btns.appendChild(prevBtn);
    btns.appendChild(nextBtn);
    btns.appendChild(closeBtn);

    controls.appendChild(title);
    controls.appendChild(btns);

    content.appendChild(mediaEl);
    content.appendChild(controls);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // state
    const state = { overlay, mediaEl, title, prevBtn, nextBtn, closeBtn, currentIndex: 0, items: [] };

    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));
    closeBtn.addEventListener('click', closeLightbox);

    overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) closeLightbox();
    });

    document.addEventListener('keydown', (ev) => {
        if (!overlay || overlay.style.display === 'none') return;
        if (ev.key === 'Escape') closeLightbox();
        if (ev.key === 'ArrowLeft') navigateLightbox(-1);
        if (ev.key === 'ArrowRight') navigateLightbox(1);
    });

    _lightbox = state;
    return state;
}

function openLightbox(index) {
    const state = createLightbox();
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    if (!items.length) return;
    state.items = items;
    state.currentIndex = index;
    updateLightbox();
    state.overlay.style.display = 'flex';
    // focus close button for accessibility
    state.closeBtn?.focus();
}

function updateLightbox() {
    const state = _lightbox;
    if (!state) return;
    const item = state.items[state.currentIndex];
    if (!item) return;
    const titleText = item.getAttribute('data-gallery-title') || '';
    state.title.textContent = titleText;
    // clear media
    state.mediaEl.innerHTML = '';
    const img = item.querySelector('img');
    const vid = item.querySelector('video');
    if (img) {
        const large = document.createElement('img');
        large.className = 'lightbox-media';
        large.src = img.getAttribute('src');
        large.alt = img.getAttribute('alt') || titleText;
        state.mediaEl.appendChild(large);
    } else if (vid) {
        const video = document.createElement('video');
        video.className = 'lightbox-media';
        video.controls = true;
        video.preload = 'metadata';
        const source = vid.querySelector('source');
        if (source) {
            const src = source.getAttribute('src');
            const s = document.createElement('source');
            s.src = src;
            s.type = source.getAttribute('type') || 'video/mp4';
            video.appendChild(s);
        }
        state.mediaEl.appendChild(video);
    }
}

function closeLightbox() {
    if (!_lightbox) return;
    _lightbox.overlay.style.display = 'none';
    _lightbox.mediaEl.innerHTML = '';
}

function navigateLightbox(direction) {
    if (!_lightbox) return;
    let idx = _lightbox.currentIndex + direction;
    if (idx < 0) idx = _lightbox.items.length - 1;
    if (idx >= _lightbox.items.length) idx = 0;
    _lightbox.currentIndex = idx;
    updateLightbox();
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    window.addEventListener('scroll', () => {
        let current = '';

        document.querySelectorAll('section[id]').forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Improve mobile nav: close collapsed menu after selecting a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // set clicked link as active immediately
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            try {
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            } catch (e) {
                // bootstrap not available or error — ignore
            }
        });
    });

    // Set active nav link based on current URL/hash on load
    (function setActiveFromUrl() {
        try {
            const currentBase = location.href.split('#')[0];
            const currentHash = location.hash || '#top';
            let matched = false;
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const linkHrefFull = link.href || href;
                const linkBase = String(linkHrefFull).split('#')[0];

                // exact page match
                if (linkBase === currentBase) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    matched = true;
                    return;
                }

                // hash-only links (in-page)
                if (href && href.startsWith('#') && href === currentHash) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    matched = true;
                    return;
                }
            });

            // fallback: if no match and we're on index (no hash), highlight Home link (href contains #top)
            if (!matched && (location.pathname.endsWith('/') || currentBase.toLowerCase().includes('index.html'))) {
                navLinks.forEach(link => {
                    const href = link.getAttribute('href') || '';
                    if (href.includes('#top') || href === '#top') {
                        navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                    }
                });
            }
        } catch (e) {
            // ignore
        }
    })();

    setupWhatsAppQuoteForm();
    setupGallerySocialFeed();
    setupNewsletterForm();
    setupBackToTop();
});

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

/* Newsletter form: no backend, show confirmation and clear input */
function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const status = document.getElementById('newsletter-status');
    const emailInput = document.getElementById('newsletter-email');
    if (!form || !status || !emailInput) return;

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = String(emailInput.value || '').trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            status.textContent = 'Please enter a valid email address.';
            return;
        }
        status.textContent = 'Thanks — you are subscribed (demo).';
        emailInput.value = '';
        setTimeout(() => { status.textContent = ''; }, 4000);
    });
}

/* Back-to-top: smooth scroll and visibility */
function setupBackToTop() {
    const btns = document.querySelectorAll('#back-to-top');
    if (!btns.length) return;
    const handleClick = (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    btns.forEach(b => b.addEventListener('click', handleClick));
}
