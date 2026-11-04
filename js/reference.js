'use strict';

/**
 * js/reference.js
 * Reference Media System
 * Menampilkan foto dan video referensi alat outdoor fitness asli dari direktori src/
 */

const REFERENCE_DB = {
  latPull: {
    label: 'Lat Pull Down',
    media: [
      {
        type: 'photo',
        title: 'Tampak Depan',
        src: 'src/latpull.jpeg',
        caption: 'Lat Pull Down — Foto Asli Tampak Depan',
        thumb: 'src/latpull.jpeg'
      }
    ]
  },
  elliptical: {
    label: 'Elliptical Trainer',
    media: [
      {
        type: 'photo',
        title: 'Tampak Depan',
        src: 'src/elliptical.jpeg',
        caption: 'Elliptical Trainer — Foto Asli Tampak Depan',
        thumb: 'src/elliptical.jpeg'
      },
      {
        type: 'photo',
        title: 'Tampak Samping',
        src: 'src/elliptical-samping.jpeg',
        caption: 'Elliptical Trainer — Foto Asli Tampak Samping',
        thumb: 'src/elliptical-samping.jpeg'
      },
      {
        type: 'video',
        title: 'Mekanisme Gerak',
        src: 'src/gerakan-elliptical.mp4',
        caption: 'Elliptical Trainer — Mekanisme Gerak',
        thumb: 'src/elliptical.jpeg'
      },
      {
        type: 'video',
        title: 'Praktik Gerak',
        src: 'src/praktek-elliptical.mp4',
        caption: 'Elliptical Trainer — Penggunaan Alat',
        thumb: 'src/elliptical-samping.jpeg'
      }
    ]
  },
  airWalker: {
    label: 'Air Walker',
    media: [
      {
        type: 'photo',
        title: 'Tampak Depan',
        src: 'src/airwalker.jpeg',
        caption: 'Air Walker — Foto Asli Tampak Serong',
        thumb: 'src/airwalker.jpeg'
      },
      {
        type: 'video',
        title: 'Praktik Gerak',
        src: 'src/praktek-airwalker.mp4',
        caption: 'Air Walker — Penggunaan Alat',
        thumb: 'src/airwalker.jpeg'
      }
    ]
  }
};

const refState = {
  currentMachine: 'latPull',
  currentIndex: 0,
  isVideoMuted: true,
  isVideoLoop: true
};

let refViewerWrap, refCaption, refThumbnails;
let btnRefMute, btnRefLoop, btnRefLightbox;
let lightboxEl, lightboxInner, lightboxClose, lightboxCaption, lightboxPrev, lightboxNext;
let currentVideoEl = null;

function initReferenceModule() {
  refViewerWrap   = document.getElementById('ref-viewer-wrap');
  refCaption      = document.getElementById('refCaption');
  refThumbnails   = document.getElementById('refThumbnails');

  btnRefMute      = document.getElementById('btnRefMute');
  btnRefLoop      = document.getElementById('btnRefLoop');
  btnRefLightbox  = document.getElementById('btnRefLightbox');

  lightboxEl      = document.getElementById('lightbox');
  lightboxInner   = document.getElementById('lightboxInner');
  lightboxClose   = document.getElementById('lightboxClose');
  lightboxCaption = document.getElementById('lightboxCaption');
  lightboxPrev    = document.getElementById('lightboxPrev');
  lightboxNext    = document.getElementById('lightboxNext');

  btnRefMute?.addEventListener('click', toggleMute);
  btnRefLoop?.addEventListener('click', toggleLoop);
  btnRefLightbox?.addEventListener('click', openLightbox);

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxEl?.addEventListener('click', e => {
    if (e.target === lightboxEl) closeLightbox();
  });
  lightboxPrev?.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext?.addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', e => {
    if (!lightboxEl?.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
    if (e.key === 'ArrowRight')  navigateLightbox(1);
  });

  updateMuteBtn();
  updateLoopBtn();
  switchRefMachine('latPull');
}

function switchRefMachine(machine) {
  if (!REFERENCE_DB[machine]) return;
  refState.currentMachine = machine;
  refState.currentIndex   = 0;

  renderThumbnails();
  renderRefMedia(0);
}

function syncRefMachineFromSelection(machine) {
  if (machine && REFERENCE_DB[machine]) {
    switchRefMachine(machine);
  }
}

function renderThumbnails() {
  if (!refThumbnails) return;
  refThumbnails.innerHTML = '';
  const db = REFERENCE_DB[refState.currentMachine];
  if (!db) return;

  db.media.forEach((item, idx) => {
    const thumb = document.createElement('button');
    thumb.className = 'ref-thumb' + (idx === 0 ? ' active' : '');
    thumb.title = item.caption;

    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = item.caption;
    thumb.appendChild(img);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'thumb-title';
    titleSpan.textContent = item.title;
    thumb.appendChild(titleSpan);

    if (item.type === 'video') {
      const vIcon = document.createElement('span');
      vIcon.className = 'thumb-video-icon';
      vIcon.textContent = '▶';
      thumb.appendChild(vIcon);
    }

    thumb.addEventListener('click', () => renderRefMedia(idx));
    refThumbnails.appendChild(thumb);
  });
}

function renderRefMedia(idx) {
  const db = REFERENCE_DB[refState.currentMachine];
  if (!db || !db.media[idx]) return;
  refState.currentIndex = idx;

  stopCurrentVideo();

  const item = db.media[idx];

  document.querySelectorAll('.ref-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  const overlay = refViewerWrap.querySelector('.ref-controls');
  refViewerWrap.querySelectorAll('img, video, .ref-badge').forEach(el => el.remove());

  const placeholder = refViewerWrap.querySelector('#ref-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  if (item.type === 'photo') {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.caption;
    refViewerWrap.insertBefore(img, overlay || refViewerWrap.firstChild);

    if (btnRefMute) btnRefMute.style.display = 'none';
    if (btnRefLoop) btnRefLoop.style.display = 'none';
  } else {
    const video = document.createElement('video');
    video.src = item.src;
    video.muted = refState.isVideoMuted;
    video.loop = refState.isVideoLoop;
    video.autoplay = true;
    video.playsInline = true;
    video.controls = false;
    refViewerWrap.insertBefore(video, overlay || refViewerWrap.firstChild);
    currentVideoEl = video;

    video.addEventListener('click', () => {
      if (video.paused) video.play();
      else video.pause();
    });

    if (btnRefMute) btnRefMute.style.display = 'inline-flex';
    if (btnRefLoop) btnRefLoop.style.display = 'inline-flex';

    updateMuteBtn();
    updateLoopBtn();
  }

  if (refCaption) {
    refCaption.textContent = item.caption;
  }
}

function stopCurrentVideo() {
  if (currentVideoEl) {
    currentVideoEl.pause();
    currentVideoEl.src = '';
    currentVideoEl = null;
  }
}

function toggleMute() {
  refState.isVideoMuted = !refState.isVideoMuted;
  if (currentVideoEl) currentVideoEl.muted = refState.isVideoMuted;
  updateMuteBtn();
}

function updateMuteBtn() {
  if (!btnRefMute) return;
  btnRefMute.textContent = refState.isVideoMuted ? '🔇' : '🔊';
  btnRefMute.title = refState.isVideoMuted ? 'Buka Suara' : 'Bisukan';
}

function toggleLoop() {
  refState.isVideoLoop = !refState.isVideoLoop;
  if (currentVideoEl) currentVideoEl.loop = refState.isVideoLoop;
  updateLoopBtn();
}

function updateLoopBtn() {
  if (!btnRefLoop) return;
  btnRefLoop.style.opacity = refState.isVideoLoop ? '1' : '0.45';
  btnRefLoop.title = refState.isVideoLoop ? 'Ulang: Aktif' : 'Ulang: Mati';
}

function openLightbox() {
  renderLightboxItem(refState.currentIndex);
  lightboxEl?.classList.add('open');
}

function closeLightbox() {
  const lbVideo = lightboxInner?.querySelector('video');
  if (lbVideo) {
    lbVideo.pause();
    lbVideo.src = '';
  }
  lightboxEl?.classList.remove('open');
}

function navigateLightbox(dir) {
  const db = REFERENCE_DB[refState.currentMachine];
  if (!db) return;
  const newIdx = (refState.currentIndex + dir + db.media.length) % db.media.length;
  refState.currentIndex = newIdx;
  renderRefMedia(newIdx);
  renderLightboxItem(newIdx);
}

function renderLightboxItem(idx) {
  const db = REFERENCE_DB[refState.currentMachine];
  if (!db || !db.media[idx]) return;
  const item = db.media[idx];

  const closeBtnEl = lightboxInner.querySelector('.lb-close');
  const capEl      = lightboxInner.querySelector('.lb-caption');
  lightboxInner.innerHTML = '';
  if (closeBtnEl) lightboxInner.appendChild(closeBtnEl);

  if (item.type === 'photo') {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.caption;
    lightboxInner.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = item.src;
    video.controls    = true;
    video.autoplay    = true;
    video.loop        = refState.isVideoLoop;
    video.muted       = refState.isVideoMuted;
    video.playsInline = true;
    lightboxInner.appendChild(video);
  }

  const cap = capEl || document.createElement('div');
  cap.className = 'lb-caption';
  cap.textContent = `${db.label} — ${item.caption} (${idx + 1}/${db.media.length})`;
  lightboxInner.appendChild(cap);
}
