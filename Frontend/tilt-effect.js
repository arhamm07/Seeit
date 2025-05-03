// 3D Tilt Effect for the Assistant Container
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.assistant-container');
    
    // Variables for tilt effect
    const maxTilt = 5; // Maximum tilt in degrees
    const perspective = 1000; // Perspective value for 3D effect
    
    // Add perspective to container parent
    container.parentElement.style.perspective = `${perspective}px`;
    
    // Handle mouse movement
    container.addEventListener('mousemove', function(e) {
        // Get position of mouse cursor relative to container
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left; // X position within the element
        const y = e.clientY - rect.top; // Y position within the element
        
        // Calculate rotation based on mouse position
        // Convert to percentage of container width/height
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        // Calculate tilt angles (centered at 50%)
        const tiltX = ((yPercent - 50) / 50) * maxTilt * -1; // Inverted for natural feel
        const tiltY = ((xPercent - 50) / 50) * maxTilt;
        
        // Apply transform with smooth transition
        container.style.transform = `
            rotateX(${tiltX}deg) 
            rotateY(${tiltY}deg)
            translateZ(10px)
        `;
        
        // Add subtle shadow movement
        const shadowX = tiltY * 2;
        const shadowY = tiltX * 2;
        container.style.boxShadow = `
            ${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, 0.1),
            0 10px 20px rgba(0, 0, 0, 0.08)
        `;
        
        // Add highlight effect based on tilt
        const gradientX = 50 + (tiltY * 3);
        const gradientY = 50 + (tiltX * 3);
        container.style.background = `
            radial-gradient(
                circle at ${gradientX}% ${gradientY}%, 
                rgba(255, 255, 255, 0.95) 0%, 
                rgba(255, 255, 255, 0.85) 100%
            )
        `;
    });
    
    // Reset on mouse leave
    container.addEventListener('mouseleave', function() {
        container.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
        container.style.boxShadow = 'var(--shadow-xl)';
        container.style.background = 'rgba(255, 255, 255, 0.85)';
        
        // Add smooth transition when resetting
        container.style.transition = 'all 0.5s ease';
        
        // Remove transition after reset is complete
        setTimeout(() => {
            container.style.transition = '';
        }, 500);
    });
    
    // Disable transition during mouse movement for smoother effect
    container.addEventListener('mouseenter', function() {
        container.style.transition = 'none';
    });
});
