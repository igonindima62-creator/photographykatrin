(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const photos = Array.from(document.querySelectorAll([
    '.hero-image',
    '.home-intro-image img',
    '.home-work img',
    '.about-main-image img',
    '.about-small-image img',
    '.portfolio-card-image img'
  ].join(',')));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('photo-pending');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px 80px 0px' });
    photos.forEach(photo => photo.classList.add('photo-effect', 'photo-pending'));
    requestAnimationFrame(() => requestAnimationFrame(() => photos.forEach(photo => observer.observe(photo))));
    const clearPending = event => {
      if (!event.matches) return;
      observer.disconnect();
      photos.forEach(photo => photo.classList.remove('photo-pending'));
    };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', clearPending);
    else if (reducedMotion.addListener) reducedMotion.addListener(clearPending);
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.hero-image-wrap, .about-main-image, .portfolio-card-image').forEach(frame => {
      const photo = frame.querySelector('img');
      if (!photo) return;
      frame.classList.add('photo-effect-frame');
      photo.classList.add('photo-reactive');
      let frameRequest = null;
      frame.addEventListener('pointermove', event => {
        if (frameRequest !== null) cancelAnimationFrame(frameRequest);
        const x = event.clientX, y = event.clientY;
        frameRequest = requestAnimationFrame(() => {
          const bounds = frame.getBoundingClientRect();
          const dx = ((x - bounds.left) / bounds.width - .5) * -14;
          const dy = ((y - bounds.top) / bounds.height - .5) * -14;
          frame.style.setProperty('--photo-x', `${dx.toFixed(1)}px`);
          frame.style.setProperty('--photo-y', `${dy.toFixed(1)}px`);
          frameRequest = null;
        });
      });
      frame.addEventListener('pointerleave', () => {
        if (frameRequest !== null) cancelAnimationFrame(frameRequest);
        frameRequest = null;
        frame.style.removeProperty('--photo-x');
        frame.style.removeProperty('--photo-y');
      });
    });
  }

  const galleryImage = document.getElementById('gallery-image');
  if (galleryImage && 'MutationObserver' in window) {
    const observer = new MutationObserver(() => {
      galleryImage.classList.remove('photo-changing');
      void galleryImage.offsetWidth;
      galleryImage.classList.add('photo-changing');
    });
    observer.observe(galleryImage, { attributes: true, attributeFilter: ['src'] });
  }
})();
