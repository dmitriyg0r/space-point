import { useRef, useEffect } from 'react';

const Starfield = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    
    const stars = [];
    const starCount = 400;
    
    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          brightness: Math.random() * 0.5 + 0.3,
          speed: Math.random() * 0.01 + 0.002 // Уменьшил скорость мерцания
        });
      }
    };
    
    initStars();
    
    let animationFrameId;
    
    const render = () => {
      // Только очищаем canvas прозрачным цветом, без фона
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем только звезды
      stars.forEach(star => {
        star.brightness += star.speed;
        // Увеличил диапазон мерцания для более плавного эффекта
        if (star.brightness > 0.9 || star.brightness < 0.2) {
          star.speed = -star.speed;
        }
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    const handleResize = () => {
      resizeCanvas();
      initStars();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default Starfield;