/**
 * Flow Field Background - Premium Ambient Effect
 * Refined for AI News Dashboard
 * Based on: https://21st.dev/easemize/flow-field-background
 */

class FlowFieldBackground {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('FlowFieldBackground: Container not found');
            return;
        }

        // Refined configuration for subtle, premium look
        this.config = {
            // Colors - using brand with variation
            primaryColor: options.primaryColor || '#90B8F0',
            secondaryColor: options.secondaryColor || '#6a9de8',
            accentColor: options.accentColor || '#a8c8f5',

            // Trail settings - faster fade for cleaner look
            trailOpacity: options.trailOpacity || 0.12,

            // Particles - fewer but more visible
            particleCount: options.particleCount || 350,
            particleSize: options.particleSize || 1.8,

            // Motion - slower, more elegant
            speed: options.speed || 0.5,

            // Mouse interaction - stronger for better feedback
            mouseRadius: options.mouseRadius || 200,
            mouseForce: options.mouseForce || 0.08,

            // Background
            backgroundColor: options.backgroundColor || '#0F1011'
        };

        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.animationFrameId = null;
        this.width = 0;
        this.height = 0;

        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
    `;

        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Pre-calculate colors array for variety
        this.colors = [
            this.config.primaryColor,
            this.config.secondaryColor,
            this.config.accentColor
        ];

        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();

        console.log('✅ FlowFieldBackground initialized (refined)', {
            particles: this.particles.length,
            size: `${this.width}x${this.height}`
        });
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: 0,
            vy: 0,
            age: Math.random() * 100, // Stagger initial ages
            life: Math.random() * 300 + 150, // Longer life
            colorIndex: Math.floor(Math.random() * 3),
            size: this.config.particleSize * (0.8 + Math.random() * 0.4) // Size variation
        };
    }

    updateParticle(p) {
        // Smoother flow field with multiple frequencies
        const scale1 = 0.003;
        const scale2 = 0.006;
        const angle = (
            Math.sin(p.x * scale1 + p.y * scale2) +
            Math.cos(p.y * scale1 - p.x * scale2 * 0.5)
        ) * Math.PI;

        // Gentler flow force
        p.vx += Math.cos(angle) * 0.15 * this.config.speed;
        p.vy += Math.sin(angle) * 0.15 * this.config.speed;

        // Enhanced mouse interaction
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = this.config.mouseRadius;

        if (distance < radius && distance > 0) {
            // Smooth falloff curve
            const force = Math.pow((radius - distance) / radius, 2) * this.config.mouseForce;
            p.vx -= (dx / distance) * force * 10;
            p.vy -= (dy / distance) * force * 10;
        }

        // Apply velocity with higher friction for smoother motion
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Age
        p.age++;
        if (p.age > p.life) {
            this.resetParticle(p);
        }

        // Wrap with smooth transition
        const margin = 50;
        if (p.x < -margin) p.x = this.width + margin;
        if (p.x > this.width + margin) p.x = -margin;
        if (p.y < -margin) p.y = this.height + margin;
        if (p.y > this.height + margin) p.y = -margin;
    }

    resetParticle(p) {
        // Spawn anywhere for even distribution
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = 0;
        p.vy = 0;
        p.age = 0;
        p.life = Math.random() * 300 + 150;
        p.colorIndex = Math.floor(Math.random() * 3);
    }

    drawParticle(p) {
        // Smooth fade in/out curve
        const lifeProgress = p.age / p.life;
        const fadeIn = Math.min(1, p.age / 30);
        const fadeOut = Math.max(0, 1 - Math.pow((lifeProgress - 0.7) / 0.3, 2));
        const alpha = fadeIn * (lifeProgress < 0.7 ? 1 : fadeOut);

        if (alpha <= 0.05) return; // Skip nearly invisible particles

        this.ctx.fillStyle = this.colors[p.colorIndex];
        this.ctx.globalAlpha = alpha * 0.6; // Overall softer

        // Draw as small circles for smoother look
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        // Clear canvas completely - no trails, pure black background
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.globalAlpha = 1;

        // Update and draw
        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 15, g: 16, b: 17 };
    }

    bindEvents() {
        this.handleResize = () => {
            this.resize();
            this.createParticles();
        };

        this.handleMouseMove = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };

        this.handleMouseLeave = () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        };

        window.addEventListener('resize', this.handleResize);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseleave', this.handleMouseLeave);
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseleave', this.handleMouseLeave);
        cancelAnimationFrame(this.animationFrameId);
        this.canvas.remove();
    }
}

// Initialize with refined settings
document.addEventListener('DOMContentLoaded', () => {
    window.flowField = new FlowFieldBackground(document.body, {
        primaryColor: '#90B8F0',    // Brand blue
        secondaryColor: '#7aa8e8',  // Slightly darker
        accentColor: '#a5c4f2',     // Slightly lighter
        trailOpacity: 0.15,         // Faster fade = cleaner
        particleCount: 300,         // Fewer = more elegant
        particleSize: 1.6,          // Slightly smaller
        speed: 0.4,                 // Slower = more ambient
        mouseRadius: 180,           // Good interaction range
        mouseForce: 0.1,            // Strong but not jarring
        backgroundColor: '#0F1011'
    });
});

window.FlowFieldBackground = FlowFieldBackground;
