(() => {
  const navigation = document.querySelector('.navigation');
  const navSlider = navigation?.querySelector('.nav-slider');
  const navItems = navigation ? Array.from(navigation.querySelectorAll('.nav-item')) : [];
  const currentNav = navItems.find(item => item.getAttribute('aria-current') === 'page');
  if (navigation && navSlider && currentNav) {
    let gesture = null;
    let suppressClick = false;
    const placeSlider = item => {
      const navRect = navigation.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      navSlider.style.width = `${itemRect.width}px`;
      navSlider.style.transform = `translateX(${itemRect.left - navRect.left}px)`;
      navSlider.style.opacity = '1';
    };
    const closestItem = x => navItems.reduce((best, item) => {
      const r = item.getBoundingClientRect();
      return Math.abs(x - (r.left + r.width / 2)) < Math.abs(x - best.center)
        ? { item, center: r.left + r.width / 2 } : best;
    }, { item: currentNav, center: Infinity }).item;
    navigation.classList.add('has-slider');
    navigation.addEventListener('dragstart', event => event.preventDefault());
    let previousIndex = -1;
    try { previousIndex = Number.parseInt(sessionStorage.getItem('site-nav-previous') || '-1', 10); sessionStorage.removeItem('site-nav-previous'); } catch (_) {}
    if (navItems[previousIndex] && navItems[previousIndex] !== currentNav) {
      navSlider.classList.add('no-transition');
      placeSlider(navItems[previousIndex]);
      requestAnimationFrame(() => requestAnimationFrame(() => { navSlider.classList.remove('no-transition'); placeSlider(currentNav); }));
    } else placeSlider(currentNav);
    window.addEventListener('resize', () => placeSlider(currentNav));
    navigation.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
      const item = event.target.closest('.nav-item');
      if (!item) return;
      placeSlider(item);
      try { sessionStorage.setItem('site-nav-previous', String(navItems.indexOf(currentNav))); } catch (_) {}
    }, true);
    navigation.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const item = event.target.closest('.nav-item');
      if (!item) return;
      gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, item };
    });
    navigation.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
      if (!gesture.moved && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        gesture.moved = true;
        navigation.classList.add('is-dragging');
        navigation.setPointerCapture(event.pointerId);
      }
      if (gesture.moved) {
        event.preventDefault();
        gesture.item = closestItem(event.clientX);
        placeSlider(gesture.item);
      }
    });
    navigation.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const finished = gesture;
      gesture = null;
      navigation.classList.remove('is-dragging');
      if (finished.moved) {
        event.preventDefault();
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        if (finished.item !== currentNav) {
          try { sessionStorage.setItem('site-nav-previous', String(navItems.indexOf(currentNav))); } catch (_) {}
          window.location.assign(finished.item.href);
        } else placeSlider(currentNav);
      }
    });
    navigation.addEventListener('pointercancel', () => { gesture = null; navigation.classList.remove('is-dragging'); placeSlider(currentNav); });
  }

  document.querySelectorAll('.comparison input').forEach(input => {
    const update = () => input.parentElement.style.setProperty('--split', `${input.value}%`);
    input.addEventListener('input', update);
    update();
  });

  const catalog = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO : [];
  const display = {
    'wedding': { title: 'Свадьба', cover: 1, label: 'СВАДЕБНАЯ ИСТОРИЯ' },
    'roman-svetlana': { title: 'Роман и Светлана', cover: 8, label: 'ИСТОРИЯ ДВОИХ' },
    'dasha': { title: 'Даша', cover: 21, label: 'ИСТОРИЯ В КАДРАХ' },
    'alina-2': { title: 'Алина', cover: 13, label: 'ИСТОРИЯ 02' },
    'alina': { title: 'Алина', cover: 0, label: 'ИСТОРИЯ 01' },
    'oksana': { title: 'Оксана', cover: 10, label: 'ИСТОРИЯ В КАДРАХ' },
    'yulia': { title: 'Юля', cover: 6, label: 'ИСТОРИЯ В КАДРАХ' },
    'nastya': { title: 'Настя', cover: 14, label: 'ИСТОРИЯ В КАДРАХ' }
  };
  const grid = document.getElementById('portfolio-grid');
  const dialog = document.getElementById('gallery-dialog');
  if (!grid || !dialog) return;
  const galleryTitle = document.getElementById('gallery-title');
  const galleryImage = document.getElementById('gallery-image');
  const galleryCounter = document.getElementById('gallery-counter');
  const thumbs = document.getElementById('gallery-thumbs');
  const stage = document.querySelector('.gallery-stage');
  let currentAlbum = null;
  let currentIndex = 0;
  let opener = null;

  function updateImage(shouldScroll = true) {
    if (!currentAlbum) return;
    const picture = currentAlbum.images[currentIndex];
    galleryImage.src = picture.src;
    galleryImage.alt = picture.alt;
    galleryCounter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(currentAlbum.images.length).padStart(2, '0')}`;
    const buttons = thumbs.querySelectorAll('button');
    buttons.forEach((button, index) => button.setAttribute('aria-current', String(index === currentIndex)));
    if (shouldScroll && buttons[currentIndex]) buttons[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  function moveImage(delta) {
    if (!currentAlbum) return;
    currentIndex = (currentIndex + delta + currentAlbum.images.length) % currentAlbum.images.length;
    updateImage();
  }
  function openGallery(album, card) {
    currentAlbum = album;
    currentIndex = 0;
    opener = card;
    galleryTitle.textContent = display[album.id]?.title || album.title;
    thumbs.replaceChildren();
    album.images.forEach((picture, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-thumb';
      button.setAttribute('aria-label', `Открыть фотографию ${index + 1} из ${album.images.length}`);
      const image = document.createElement('img');
      image.src = picture.thumb;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
      button.addEventListener('click', () => { currentIndex = index; updateImage(); });
      thumbs.append(button);
    });
    updateImage(false);
    dialog.showModal();
    document.body.classList.add('gallery-open');
    dialog.querySelector('.gallery-close').focus();
  }
  const summary = document.getElementById('portfolio-summary');
  if (summary && catalog.length) {
    summary.textContent = `СЕРИЙ: ${catalog.length} / ФОТО: ${catalog.reduce((total, album) => total + album.images.length, 0)}`;
  }
  catalog.forEach((album, albumIndex) => {
    if (!album.images?.length) return;
    const metadata = display[album.id] || { title: album.title, cover: 0, label: 'ФОТОИСТОРИЯ' };
    const picture = album.images[Math.min(metadata.cover, album.images.length - 1)];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'portfolio-card';
    card.dataset.group = ['wedding', 'roman-svetlana', 'dasha'].includes(album.id) ? 'stories' : 'portraits';
    card.dataset.photos = String(album.images.length);
    card.setAttribute('aria-label', `${metadata.title}, ${metadata.label.toLowerCase()}. Открыть съёмку, фотографий: ${album.images.length}`);
    const imageWrap = document.createElement('div');
    imageWrap.className = 'portfolio-card-image';
    const image = document.createElement('img');
    image.src = picture.src;
    image.alt = '';
    image.loading = 'lazy';
    const index = document.createElement('span');
    index.className = 'folio-card-index';
    index.textContent = `${String(albumIndex + 1).padStart(2, '0')} / ${String(catalog.length).padStart(2, '0')}`;
    const open = document.createElement('span');
    open.className = 'folio-card-open';
    open.setAttribute('aria-hidden', 'true');
    open.textContent = 'Смотреть';
    imageWrap.append(image, index, open);
    const meta = document.createElement('div');
    meta.className = 'portfolio-card-meta';
    const title = document.createElement('span');
    title.className = 'portfolio-card-title';
    title.textContent = metadata.title;
    const info = document.createElement('span');
    info.className = 'folio-card-info';
    const sub = document.createElement('span');
    sub.className = 'portfolio-card-sub';
    sub.textContent = metadata.label;
    const count = document.createElement('span');
    count.className = 'folio-card-count';
    count.textContent = `${album.images.length} ФОТО`;
    info.append(sub, count);
    meta.append(title, info);
    card.append(imageWrap, meta);
    card.addEventListener('click', () => openGallery(album, card));
    grid.append(card);
  });
  const filterButtons = Array.from(document.querySelectorAll('[data-portfolio-filter]'));
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.portfolioFilter;
    grid.dataset.filter = selected;
    filterButtons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
    cards.forEach(card => { card.hidden = selected !== 'all' && card.dataset.group !== selected; });
    const visibleCards = cards.filter(card => !card.hidden);
    if (summary) summary.textContent = `СЕРИЙ: ${visibleCards.length} / ФОТО: ${visibleCards.reduce((total, card) => total + Number(card.dataset.photos), 0)}`;
  }));
  if (!catalog.length) {
    const message = document.createElement('p');
    message.className = 'notice';
    message.textContent = 'Не удалось загрузить фотографии портфолио. Попробуйте обновить страницу.';
    grid.append(message);
  }
  dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.gallery-prev').addEventListener('click', () => moveImage(-1));
  dialog.querySelector('.gallery-next').addEventListener('click', () => moveImage(1));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('gallery-open');
    if (opener) opener.focus();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveImage(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveImage(1); }
  });
  let touchStartX = null;
  stage.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 55) moveImage(delta < 0 ? 1 : -1);
    touchStartX = null;
  }, { passive: true });
})();
