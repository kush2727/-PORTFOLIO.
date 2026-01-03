document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Intro Sequence & Sound ---

    const intro = document.getElementById('intro-overlay');
    const wrapper = document.getElementById('wrapper');

    // Check if intro was already shown this session
    const introShown = sessionStorage.getItem('introShown');

    if (introShown) {
        // Skip intro - show content immediately
        if (intro) intro.style.display = 'none';
        if (wrapper) {
            wrapper.classList.add('visible');
            document.body.classList.add('loaded');
        }
    } else {
        // Show intro for first time
        sessionStorage.setItem('introShown', 'true');

        // Play Sound on User Interaction or Try Autoplay
        const playNetflixSound = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                const t = ctx.currentTime;

                // 1. The "Thud" (Low Boom)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(60, t);
                osc1.frequency.exponentialRampToValueAtTime(10, t + 0.5);
                gain1.gain.setValueAtTime(1, t);
                gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(t);
                osc1.stop(t + 0.6);

                // 2. The "Percussive Hit"
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(120, t);
                osc2.frequency.exponentialRampToValueAtTime(30, t + 0.3);
                gain2.gain.setValueAtTime(0.5, t);
                gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(t);
                osc2.stop(t + 0.4);
            } catch (e) {
                console.log("Audio not supported or blocked");
            }
        };

        playNetflixSound();

        setTimeout(() => {
            if (intro && wrapper) {
                intro.classList.add('fade-out');
                setTimeout(() => {
                    wrapper.classList.add('visible');
                    document.body.classList.add('loaded');
                }, 500);

                // Cleanup
                setTimeout(() => {
                    intro.style.display = 'none';
                }, 3000);
            }
        }, 2500);
    }

    // --- 1. Custom Smooth Scroll & Reveal Animation ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));


    // --- 2. Number Counter Animation ---
    const statsSection = document.querySelector('.stats-grid');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const counters = document.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // ms
                    const stepTime = 20;
                    const steps = duration / stepTime;
                    const increment = target / steps;

                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        counter.innerText = Math.floor(current);
                        if (current >= target) {
                            counter.innerText = target;
                            clearInterval(timer);
                        }
                    }, stepTime);
                });
                statsObserver.unobserve(statsSection);
            }
        });
        statsObserver.observe(statsSection);
    }


    // --- 3. Organic Fluid Grid (Canvas) ---
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Configuration
    const gridSpacing = 50;
    const waveSpeed = 0.002;
    const waveAmplitude = 100;
    let time = 0;

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.originX = x;
            this.originY = y;
            this.noiseOffsetX = Math.random() * 1000;
            this.noiseOffsetY = Math.random() * 1000;
        }

        update() {
            // Simple sine wave movement for "breathing" grid
            const dist = Math.sqrt((this.x - width / 2) ** 2 + (this.y - height / 2) ** 2);
            const angle = dist * 0.005 - time;

            // Mouse interaction
            let dx = 0;
            let dy = 0;

            if (mouse.x != null) {
                const mouseDx = this.originX - mouse.x;
                const mouseDy = this.originY - mouse.y;
                const distance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
                const maxDist = 300;

                if (distance < maxDist) {
                    const force = (maxDist - distance) / maxDist;
                    dx = mouseDx * force * 0.8;
                    dy = mouseDy * force * 0.8;
                }
            }

            this.x = this.originX + dx;
            this.y = this.originY + dy + Math.sin(angle) * 10;
        }

        draw() {
            // Only draw points that are significant or grid lines?
            // Let's draw subtle crosshairs
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(this.x, this.y, 1.5, 1.5);
        }
    }

    let points = [];

    function initGrid() {
        points = [];
        for (let x = 0; x < width; x += gridSpacing) {
            for (let y = 0; y < height; y += gridSpacing) {
                points.push(new Point(x, y));
            }
        }
    }

    // Mouse Interaction
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function animate() {
        ctx.clearRect(0, 0, width, height);
        time += 0.02;

        ctx.beginPath();
        points.forEach(p => {
            p.update();
            p.draw();
        });

        // Connect neighbors for 'terrain' look? 
        // No, keep it minimal: floating grid points reacting to mouse (Liquid Grid)
        // But let's add some "Data Streams" - occasional vertical lines

        // Draw occasional connection lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            if (Math.random() > 0.99) { // Random flickering connections
                // ctx.moveTo(points[i].x, points[i].y);
                // ctx.lineTo(points[i].x, points[i].y + 20);
            }
        }
        ctx.stroke();

        // requestAnimationFrame(animate); // Animation stopped as requested
    }

    initGrid();
    animate();

    // Resize handling
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initGrid();
    });


    // --- 4. Navigation Active State & Mobile Menu ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Toggle icon between bars and times (close)
            const icon = menuToggle.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
});

// Toggle Abstract for Publications
function toggleAbstract(id) {
    const abstract = document.getElementById(id);
    const button = event.target;

    if (abstract.style.display === 'none' || abstract.style.display === '') {
        abstract.style.display = 'block';
        button.textContent = 'Hide Abstract';
    } else {
        abstract.style.display = 'none';
        button.textContent = 'Show Abstract';
    }
}

// ===== Back to Top Button =====
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Scroll Progress Bar =====
const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    if (scrollProgress) {
        scrollProgress.style.width = scrollPercent + '%';
    }
});

// ===== Active Nav Link on Scroll =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
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

// ===== Animated Skill Bars =====
const skillBars = document.querySelectorAll('.progress');

const animateSkills = () => {
    skillBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.setProperty('--target-width', width);
        bar.style.width = '0';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        bar.classList.add('animate');
                    }, 200);
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(bar);
    });
};

// Initialize skill bar animations
animateSkills();

// ===== Typing Animation =====
const typingText = document.querySelector('.typing-text');
const words = ['Projects', 'Solutions', 'Experiences', 'Reality'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentWord = words[wordIndex];

    if (isDeleting) {
        typingText.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; // Pause at end of word
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500; // Pause before typing next word
    }

    setTimeout(typeEffect, typeSpeed);
}

// Start typing animation after a delay
setTimeout(typeEffect, 1500);
