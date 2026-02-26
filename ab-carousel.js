/**
 * AB-Carousel Core JS v2.3 (Ultra-Light)
 * Basic structural functionality for sliders.
 * Developed by ABLY PERU | Alejandro Ttupa Quispe
 */

class ABCarousel {
    constructor(element) {
        if (!element) return;
        this.carousel = element;
        
        this.config = {
            slidesToShow: parseFloat(element.dataset.slides) || 1,
            responsive: element.dataset.responsive ? JSON.parse(element.dataset.responsive) : null,
            gap: element.dataset.gap !== undefined ? parseInt(element.dataset.gap) : 20,
            autoPlay: element.dataset.autoplay === 'true',
            duration: parseInt(element.dataset.duration) || 3000,
            centerMode: element.dataset.center === 'true',
            loop: element.dataset.loop !== 'false'
        };

        this.state = {
            currentIndex: 0,
            isDragging: false,
            startPos: 0,
            currentTranslate: 0,
            prevTranslate: 0,
            isTransitioning: false,
            autoPlayInterval: null,
            isVisible: false,
            animationID: null
        };

        this.setupDOM();
        this.init();
    }

    setupDOM() {
        const items = Array.from(this.carousel.children).filter(child => 
            !child.classList.contains('ab-carousel-nav') && 
            !child.classList.contains('ab-carousel-dots') &&
            !child.classList.contains('ab-carousel-container')
        );

        if (items.length > 0 && !this.carousel.querySelector('.ab-carousel-track')) {
            const container = document.createElement('div');
            container.className = 'ab-carousel-container';
            const track = document.createElement('div');
            track.className = 'ab-carousel-track';
            
            container.appendChild(track);
            items.forEach(item => {
                const wrapper = document.createElement('div');
                wrapper.className = 'ab-carousel-item';
                wrapper.appendChild(item);
                track.appendChild(wrapper);
            });
            this.carousel.prepend(container);
        }

        this.track = this.carousel.querySelector('.ab-carousel-track');
        this.originalItems = Array.from(this.track.children);
        this.setupNavigation();
        
        this.carousel.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));
    }

    setupNavigation() {
        const d = this.carousel.dataset;
        
        if (!this.carousel.querySelector('.ab-carousel-nav') && d.nav !== 'false') {
            const createBtn = (cls, icon) => {
                const btn = document.createElement('button');
                btn.className = `ab-carousel-nav ${cls}`;
                btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="${icon}"></polyline></svg>`;
                this.carousel.appendChild(btn);
                return btn;
            };
            this.prevBtn = createBtn('prev', '15 18 9 12 15 6');
            this.nextBtn = createBtn('next', '9 18 15 12 9 6');
        } else {
            this.prevBtn = d.navPrev ? document.querySelector(d.navPrev) : this.carousel.querySelector('.ab-carousel-nav.prev');
            this.nextBtn = d.navNext ? document.querySelector(d.navNext) : this.carousel.querySelector('.ab-carousel-nav.next');
        }

        this.dotsContainer = d.dotsContainer ? document.querySelector(d.dotsContainer) : this.carousel.querySelector('.ab-carousel-dots');
        if (!this.dotsContainer && d.dots !== 'false') {
            this.dotsContainer = document.createElement('div');
            this.dotsContainer.className = 'ab-carousel-dots';
            this.carousel.appendChild(this.dotsContainer);
        }
    }

    init() {
        if (this.config.loop) {
            this.cloneItems();
            this.state.currentIndex = this.originalItems.length;
        }

        this.updateSlidesCount();
        this.createDots();
        this.addEventListeners();
        this.updateCarousel(false);
        this.setupIntersectionObserver();
        
        this.resizeObserver = new ResizeObserver(() => {
            this.updateSlidesCount();
            this.updateCarousel(false);
            this.updateHeight();
        });
        this.resizeObserver.observe(this.carousel);
    }

    cloneItems() {
        const firstBatch = this.originalItems.map(item => item.cloneNode(true));
        const lastBatch = this.originalItems.map(item => item.cloneNode(true));
        firstBatch.forEach(c => { c.classList.add('ab-clone'); this.track.appendChild(c); });
        lastBatch.reverse().forEach(c => { c.classList.add('ab-clone'); this.track.insertBefore(c, this.track.firstChild); });
        this.items = Array.from(this.track.children);
    }

    updateSlidesCount() {
        const width = window.innerWidth;
        let show = this.config.slidesToShow;

        if (this.config.responsive) {
            const bps = Object.keys(this.config.responsive).map(Number).sort((a, b) => b - a);
            for (let bp of bps) { if (width <= bp) show = this.config.responsive[bp]; }
        }

        this.currentSlidesToShow = show;
        this.items = Array.from(this.track.children);
        const itemWidth = 100 / show;
        this.items.forEach(item => {
            item.style.flex = `0 0 ${itemWidth}%`;
            item.style.padding = `0 ${this.config.gap / 2}px`;
        });
    }

    createDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.innerHTML = '';
        const count = this.originalItems.length;
        if (count <= 1) return;

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = 'ab-carousel-dot';
            dot.onclick = () => this.goTo(this.config.loop ? i + this.originalItems.length : i);
            fragment.appendChild(dot);
        }
        this.dotsContainer.appendChild(fragment);
    }

    addEventListeners() {
        this.nextBtn?.addEventListener('click', () => this.next());
        this.prevBtn?.addEventListener('click', () => this.prev());
        
        const stop = () => this.stopAutoPlay();
        const start = () => this.handleAutoPlay();
        this.carousel.addEventListener('mouseenter', stop);
        this.carousel.addEventListener('mouseleave', start);
        this.carousel.addEventListener('touchstart', stop, { passive: true });
        this.carousel.addEventListener('touchend', start, { passive: true });

        this.track.addEventListener('mousedown', (e) => this.dragStart(e));
        window.addEventListener('mousemove', (e) => this.dragAction(e));
        window.addEventListener('mouseup', () => this.dragEnd());
        
        this.track.addEventListener('touchstart', (e) => this.dragStart(e), { passive: true });
        window.addEventListener('touchmove', (e) => this.dragAction(e), { passive: false });
        window.addEventListener('touchend', () => this.dragEnd());

        this.track.addEventListener('transitionend', () => this.handleTransitionEnd());
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver(([entry]) => {
            this.state.isVisible = entry.isIntersecting;
            this.handleAutoPlay();
        }, { threshold: 0.1 });
        observer.observe(this.carousel);
    }

    handleTransitionEnd() {
        this.state.isTransitioning = false;
        if (!this.config.loop) return;
        const total = this.originalItems.length;
        if (this.state.currentIndex >= total * 2) {
            this.state.currentIndex = total;
            this.updateCarousel(false);
        } else if (this.state.currentIndex < total) {
            this.state.currentIndex = total + (this.state.currentIndex % total);
            this.updateCarousel(false);
        }
    }

    dragStart(e) {
        if (this.state.isTransitioning) return;
        this.state.isDragging = true;
        this.state.startPos = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        this.track.style.transition = 'none';
        this.stopAutoPlay();
    }

    dragEnd() {
        if (!this.state.isDragging) return;
        this.state.isDragging = false;
        const movedBy = this.state.currentTranslate - this.state.prevTranslate;
        const threshold = this.carousel.offsetWidth / 10;
        if (movedBy < -threshold) this.next();
        else if (movedBy > threshold) this.prev();
        else this.updateCarousel();
        this.handleAutoPlay();
    }

    dragAction(e) {
        if (!this.state.isDragging) return;
        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentPosition - this.state.startPos;
        if (Math.abs(diff) > 5 && e.cancelable) e.preventDefault();
        this.state.currentTranslate = this.state.prevTranslate + diff;
        
        if (!this.state.animationID) {
            this.state.animationID = requestAnimationFrame(() => {
                this.track.style.transform = `translate3d(${this.state.currentTranslate}px, 0, 0)`;
                this.updateUI();
                this.state.animationID = null;
            });
        }
    }

    next() {
        if (this.state.isTransitioning) return;
        if (!this.config.loop && this.state.currentIndex >= (this.items.length - this.currentSlidesToShow)) return;
        this.state.isTransitioning = true;
        this.state.currentIndex++;
        this.updateCarousel();
    }

    prev() {
        if (this.state.isTransitioning) return;
        if (!this.config.loop && this.state.currentIndex <= 0) return;
        this.state.isTransitioning = true;
        this.state.currentIndex--;
        this.updateCarousel();
    }

    goTo(index) {
        if (this.state.isTransitioning) return;
        this.state.isTransitioning = true;
        this.state.currentIndex = index;
        this.updateCarousel();
    }

    updateCarousel(animate = true) {
        const containerWidth = this.carousel.offsetWidth;
        const itemWidth = containerWidth / this.currentSlidesToShow;
        let translate = -(this.state.currentIndex * itemWidth);
        if (this.config.centerMode) translate += (containerWidth / 2) - (itemWidth / 2);

        this.track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none';
        this.track.style.transform = `translate3d(${translate.toFixed(4)}px, 0, 0)`;
        this.state.currentTranslate = translate;
        this.state.prevTranslate = translate;
        
        requestAnimationFrame(() => {
            this.updateUI();
            this.updateHeight();
        });
    }

    updateHeight() {
        const container = this.carousel.querySelector('.ab-carousel-container');
        if (!container) return;
        const start = this.state.currentIndex;
        const end = start + Math.ceil(this.currentSlidesToShow);
        let maxHeight = 0;
        for (let i = start; i < end; i++) {
            if (this.items[i]) {
                const height = this.items[i].firstElementChild ? this.items[i].firstElementChild.offsetHeight : this.items[i].offsetHeight;
                if (height > maxHeight) maxHeight = height;
            }
        }
        if (maxHeight > 0) container.style.height = `${maxHeight}px`;
    }

    updateUI() {
        const total = this.originalItems.length;
        const activeRealIndex = this.config.loop ? (this.state.currentIndex % total) : this.state.currentIndex;
        this.items.forEach((item, i) => {
            item.classList.toggle('active', i === this.state.currentIndex);
        });
        const dots = this.dotsContainer?.querySelectorAll('.ab-carousel-dot');
        dots?.forEach((dot, i) => dot.classList.toggle('active', i === activeRealIndex));
        if (!this.config.loop) {
            this.prevBtn?.classList.toggle('hidden', this.state.currentIndex <= 0);
            this.nextBtn?.classList.toggle('hidden', this.state.currentIndex >= (this.items.length - this.currentSlidesToShow));
        }
    }

    handleAutoPlay() {
        this.stopAutoPlay();
        if (this.config.autoPlay && this.state.isVisible) {
            this.state.autoPlayInterval = setInterval(() => this.next(), this.config.duration);
        }
    }

    stopAutoPlay() {
        if (this.state.autoPlayInterval) {
            clearInterval(this.state.autoPlayInterval);
            this.state.autoPlayInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ab-carousel').forEach(el => new ABCarousel(el));
});
