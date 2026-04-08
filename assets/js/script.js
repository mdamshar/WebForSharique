// Perwez Associate - Static Site Scripts

const WHATSAPP_NUMBER = '917479889661';

function setupWhatsAppQuoteForm() {
    const form = document.getElementById('whatsapp-quote-form');
    const status = document.getElementById('quote-form-status');

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

        if (!name || !contact || !category || !message) {
            status.textContent = 'Please fill all fields before sending.';
            return;
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
    });
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

    setupWhatsAppQuoteForm();
    setupGallerySocialFeed();
});

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});
