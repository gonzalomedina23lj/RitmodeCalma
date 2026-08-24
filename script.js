document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Efecto del Menú al hacer Scroll
    const header = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    // 2. Menú Hamburguesa Móvil
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    menuToggle.addEventListener("click", () => {
        menuToggle.classList.toggle("active");
        navMenu.classList.toggle("active");
    });

    // Cerrar menú al hacer clic en un enlace del celular
    document.querySelectorAll(".nav a").forEach(link => {
        link.addEventListener("click", () => {
            menuToggle.classList.remove("active");
            navMenu.classList.remove("active");
        });
    });

    // 3. Aparición suave de elementos (Intersection Observer)
    const hiddenElements = document.querySelectorAll('.hidden');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    hiddenElements.forEach((el) => observer.observe(el));

    // 4. Simulación visual del reproductor de audio
    const playBtn = document.getElementById("playBtn");
    const progress = document.querySelector(".progress");
    let isPlaying = false;
    let width = 0;
    let interval;

    playBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playBtn.innerHTML = "⏸";
            interval = setInterval(() => {
                if(width >= 100) width = 0;
                width += 0.5;
                progress.style.width = width + "%";
            }, 300);
        } else {
            playBtn.innerHTML = "▶";
            clearInterval(interval);
        }
    });
});
