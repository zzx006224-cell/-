(() => {
    const product = window.SCOOTER_PRODUCT;
    document.querySelectorAll('[data-copy]').forEach(node => {
        node.textContent = product.originals[node.dataset.copy];
    });
    document.querySelectorAll('[data-preview]').forEach(node => {
        node.textContent = product.originals[node.dataset.preview].split('\n')[0];
    });
    document.querySelectorAll('[data-product]').forEach(node => {
        node.textContent = product[node.dataset.product];
    });
    document.querySelectorAll('[data-spec]').forEach(node => {
        node.textContent = product.specs[Number(node.dataset.spec)].value;
    });
    document.querySelectorAll('[data-photo], [data-open-photo], [data-thumb]').forEach(button => {
        const entry = product.photos[Number(button.dataset.photo ?? button.dataset.openPhoto ?? button.dataset.thumb)];
        const image = button.querySelector('img');
        image.src = entry.src;
        image.alt = entry.alt;
        image.width = entry.width;
        image.height = entry.height;
    });

    const toggles = [...document.querySelectorAll('.accordion-toggle')];
    function setExpanded(button, expanded) {
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('span').textContent = expanded ? '收起全文' : '展开全文';
        document.getElementById(button.getAttribute('aria-controls')).hidden = !expanded;
    }
    toggles.forEach(button => button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        if (expanded && matchMedia('(max-width: 760px)').matches) {
            toggles.filter(other => other !== button).forEach(other => setExpanded(other, false));
        }
        setExpanded(button, expanded);
    }));

    const track = document.getElementById('gallery-track');
    const thumbnails = [...document.querySelectorAll('[data-thumb]')];
    let galleryIndex = 0;
    const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    function selectGallery(index) {
        galleryIndex = index;
        track.scrollTo({ left: track.clientWidth * index, behavior: motion() });
        updateGallery(index);
    }
    function updateGallery(index) {
        thumbnails.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
        document.getElementById('gallery-counter').textContent = `${index + 1} / ${product.photos.length}`;
    }
    thumbnails.forEach(button => button.addEventListener('click', () => selectGallery(Number(button.dataset.thumb))));
    track.addEventListener('scroll', () => {
        galleryIndex = Math.max(0, Math.min(product.photos.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
        updateGallery(galleryIndex);
    }, { passive: true });
    track.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            selectGallery((galleryIndex + (event.key === 'ArrowRight' ? 1 : -1) + product.photos.length) % product.photos.length);
        }
    });
    new ResizeObserver(() => track.scrollTo({ left: track.clientWidth * galleryIndex, behavior: 'instant' })).observe(track);

    const lightbox = document.getElementById('photo-lightbox');
    const photo = document.getElementById('lightbox-image');
    let photoIndex = 0;
    function showPhoto(index) {
        photoIndex = (index + product.photos.length) % product.photos.length;
        photo.src = product.photos[photoIndex].src;
        photo.alt = product.photos[photoIndex].alt;
        document.getElementById('lightbox-title').textContent = product.photos[photoIndex].label;
        document.getElementById('lightbox-counter').textContent = `${photoIndex + 1} / ${product.photos.length}`;
    }
    document.querySelectorAll('[data-photo], [data-open-photo]').forEach(button => button.addEventListener('click', () => {
        showPhoto(Number(button.dataset.photo ?? button.dataset.openPhoto));
        lightbox.showModal();
    }));
    document.getElementById('photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
    document.getElementById('photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
    lightbox.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });

    const purchase = document.getElementById('purchase-dialog');
    document.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => {
        const contact = product.contact;
        const link = document.getElementById('purchase-link');
        document.getElementById('purchase-title').textContent = contact ? '联系购买' : '联系方式待补充';
        document.getElementById('purchase-message').textContent = contact ? contact.label : '联系方式待补充';
        link.hidden = true;
        // 仅允许已核实的公开 HTTPS 联系链接，拒绝可执行 URL。
        if (contact?.url) {
            try {
                const url = new URL(contact.url);
                if (url.protocol === 'https:') {
                    link.href = url.href;
                    link.textContent = contact.label;
                    link.hidden = false;
                }
            } catch { /* 没有有效链接时，只展示已提供的联系文字。 */ }
        }
        purchase.showModal();
    }));
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
    [lightbox, purchase].forEach(dialog => {
        let backdropStart = false;
        const outside = event => {
            const box = dialog.getBoundingClientRect();
            return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
        };
        dialog.addEventListener('pointerdown', event => { backdropStart = outside(event); });
        dialog.addEventListener('click', event => { if (backdropStart && outside(event)) dialog.close(); });
    });
})();
