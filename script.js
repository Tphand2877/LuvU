(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toast = byId('toast');
  let toastTimer;

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.textContent = '';
    }, 4500);
  }

  const canvas = byId('celebration');
  const brush = canvas.getContext('2d');
  const petalColors = ['#c25d73', '#e6a5b3', '#d8b780', '#99ab91'];
  let particles = [];
  let animationFrame = 0;
  let previousFrame = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;

  function fitCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasWidth * scale);
    canvas.height = Math.round(canvasHeight * scale);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    if (brush) brush.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function clearCelebration() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    previousFrame = 0;
    particles = [];
    if (brush) brush.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  function drawCelebration(time) {
    const elapsed = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 0;
    previousFrame = time;
    brush.clearRect(0, 0, canvasWidth, canvasHeight);
    particles = particles.filter((particle) => particle.life > 0);
    for (const particle of particles) {
      particle.life -= elapsed;
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      particle.vy += 105 * elapsed;
      particle.angle += particle.spin * elapsed;
      brush.save();
      brush.translate(particle.x, particle.y);
      brush.rotate(particle.angle);
      brush.scale(particle.size, particle.size);
      brush.globalAlpha = Math.max(0, Math.min(1, particle.life / 0.6));
      brush.fillStyle = particle.color;
      brush.beginPath();
      if (particle.heart) {
        brush.moveTo(0, 0.7);
        brush.bezierCurveTo(-1.5, -0.2, -0.7, -1.2, 0, -0.5);
        brush.bezierCurveTo(0.7, -1.2, 1.5, -0.2, 0, 0.7);
      } else {
        brush.ellipse(0, 0, 0.35, 0.8, 0, 0, Math.PI * 2);
      }
      brush.fill();
      brush.restore();
    }
    if (particles.length) animationFrame = requestAnimationFrame(drawCelebration);
    else clearCelebration();
  }

  function celebrate(origin, count = 22) {
    if (!brush || reducedMotion.matches || document.hidden) return;
    if (!animationFrame) fitCanvas();
    const rect = origin.getBoundingClientRect();
    const x = Math.max(24, Math.min(canvasWidth - 24, rect.left + rect.width / 2));
    const y = Math.max(32, Math.min(canvasHeight - 32, rect.top + rect.height / 2));
    const available = Math.min(count, 64 - particles.length);
    for (let index = 0; index < available; index += 1) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 210,
        vy: -95 - Math.random() * 130,
        size: 4 + Math.random() * 5,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 3,
        life: 1.5 + Math.random() * 0.8,
        color: petalColors[index % petalColors.length],
        heart: index % 3 !== 0
      });
    }
    if (!animationFrame) animationFrame = requestAnimationFrame(drawCelebration);
  }

  window.addEventListener('resize', () => {
    if (animationFrame) fitCanvas();
  });

  const runButtons = [...document.querySelectorAll('[data-run-feelings]')];
  const heartStage = byId('heart-stage');
  const terminalOutput = byId('terminal-output');
  const tenderLines = [
    'Giữa bao nhiêu lựa chọn, tớ vẫn muốn dành thời gian cho cậu.',
    'Điều tớ mong hôm nay: cậu vui, và biết có người thương cậu.',
    'Không cần một ngày hoàn hảo. Được nghe cậu kể là đủ rồi.'
  ];
  let runCount = 0;
  let isRunning = false;
  let runTimers = [];
  let runOrigin;

  function finishFeelings() {
    if (!isRunning) return;
    runTimers.forEach(clearTimeout);
    runTimers = [];
    terminalOutput.textContent = tenderLines[runCount % tenderLines.length];
    runCount += 1;
    terminalOutput.setAttribute('aria-busy', 'false');
    heartStage.classList.remove('is-running');
    heartStage.classList.add('is-complete');
    runButtons.forEach((button) => { button.disabled = false; });
    isRunning = false;
    celebrate(runOrigin);
  }

  runButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (isRunning) return;
      isRunning = true;
      runOrigin = button;
      runButtons.forEach((control) => { control.disabled = true; });
      heartStage.classList.remove('is-complete');
      heartStage.classList.add('is-running');
      // Only the completed thought needs a live-region announcement.
      terminalOutput.setAttribute('aria-busy', 'true');
      terminalOutput.textContent = 'Đang gom một chút can đảm…';
      if (reducedMotion.matches) {
        finishFeelings();
        return;
      }
      runTimers = [
        setTimeout(() => { terminalOutput.textContent = 'Đã tìm thấy người tớ luôn mong gặp: cậu.'; }, 500),
        setTimeout(() => { terminalOutput.textContent = 'Bỏ qua lời hoa mỹ. Giữ lại điều thật lòng…'; }, 1000),
        setTimeout(finishFeelings, 1500)
      ];
    });
  });

  document.querySelectorAll('[data-reason]').forEach((button) => {
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(isOpen));
      button.classList.toggle('is-open', isOpen);
      button.querySelector('.reason-secret').hidden = !isOpen;
      button.querySelector('.reason-preview').hidden = isOpen;
      button.querySelector('[data-reason-label]').textContent = isOpen ? 'Khép lại một chút' : 'Mở một chút lòng';
      if (isOpen) celebrate(button, 9);
    });
  });

  byId('open-letter').addEventListener('click', (event) => {
    const trigger = event.currentTarget;
    const letter = byId('personal-letter');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.hidden = true;
    letter.hidden = false;
    byId('letter-desk').classList.add('is-open');
    letter.focus({ preventScroll: true });
    const bounds = letter.getBoundingClientRect();
    if (bounds.top < 24 || bounds.top > window.innerHeight * 0.45) {
      letter.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    }
    celebrate(letter, 16);
  });

  const dialog = byId('reply-dialog');
  const replyMessage = byId('reply-message');
  const copyButton = byId('copy-reply');
  const copyStatus = byId('copy-status');
  const dateMessages = {
    coffee: 'Tớ đọc hết rồi, và tớ cũng muốn gặp cậu. Mình đi uống một ly cà phê nhé? Cùng chọn một hôm cả hai đều rảnh nha.',
    walk: 'Tớ đọc hết rồi, và tớ cũng muốn gặp cậu. Mình đi dạo thật chậm, kể nhau nghe chuyện trong ngày nhé? Cùng chọn một hôm nha.',
    cake: 'Tớ đọc hết rồi, và tớ cũng muốn gặp cậu. Mình đi ăn một chiếc bánh ngon nhé? Bánh cậu chọn, chuyện thì mình cùng kể.'
  };
  let replyVersion = 0;
  let backdropPress = false;

  function openReply(accepted) {
    replyVersion += 1;
    copyStatus.textContent = '';
    copyButton.disabled = false;
    byId('reply-share').hidden = !accepted;
    byId('reply-dismiss').hidden = accepted;
    byId('reply-eyebrow').textContent = accepted ? 'MỘT BUỔI HẸN, NHIỀU ĐIỀU ĐỂ KỂ' : 'CẬU CỨ THEO NHỊP CỦA MÌNH';
    byId('reply-title').textContent = accepted ? 'Một chiếc hẹn sắp bắt đầu.' : 'Không vội đâu, cậu à.';
    byId('reply-description').textContent = accepted
      ? 'Một lời nhắn nhỏ để bắt đầu nhé. Cậu tự gửi cho người làm chiếc web này khi thấy sẵn sàng.'
      : 'Cảm ơn cậu đã đọc đến đây. Cậu không nợ tớ một câu trả lời, và cũng không cần phải thích lại. Điều tớ mong nhất vẫn là cậu thấy thoải mái.';
    const selected = document.querySelector('input[name="date-idea"]:checked');
    replyMessage.value = accepted ? dateMessages[selected ? selected.value : 'coffee'] : '';
    if (!dialog.open) dialog.showModal();
    if (accepted) celebrate(byId('accept-date'), 30);
  }

  byId('accept-date').addEventListener('click', () => openReply(true));
  byId('think-date').addEventListener('click', () => openReply(false));
  byId('close-reply').addEventListener('click', () => dialog.close());
  byId('reply-dismiss').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    replyVersion += 1;
    backdropPress = false;
  });

  function isBackdrop(event) {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom);
  }

  dialog.addEventListener('pointerdown', (event) => {
    backdropPress = event.button === 0 && isBackdrop(event);
  });
  dialog.addEventListener('pointercancel', () => { backdropPress = false; });
  dialog.addEventListener('click', (event) => {
    if (backdropPress && isBackdrop(event)) dialog.close();
    backdropPress = false;
  });

  copyButton.addEventListener('click', async () => {
    if (copyButton.disabled) return;
    const version = replyVersion;
    copyButton.disabled = true;
    copyStatus.textContent = '';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(replyMessage.value);
      if (version !== replyVersion || !dialog.open) return;
      copyStatus.textContent = 'Đã copy lời nhắn. Cậu tự dán vào cuộc trò chuyện và gửi khi sẵn sàng nhé.';
    } catch {
      if (version !== replyVersion || !dialog.open) return;
      replyMessage.focus({ preventScroll: true });
      replyMessage.select();
      replyMessage.setSelectionRange(0, replyMessage.value.length);
      copyStatus.textContent = 'Trình duyệt chưa cho copy tự động. Lời nhắn đã được chọn: nhấn Ctrl+C / ⌘C, hoặc chạm giữ để sao chép, rồi tự gửi nhé.';
    } finally {
      if (version === replyVersion) copyButton.disabled = false;
    }
  });

  const soundButton = byId('sound-toggle');
  const soundLabel = byId('sound-label');
  const melody = [72, 76, 79, 76, 74, 71, 67, 71, 69, 72, 76, 74, 72, 67, 69, 72];
  const voices = new Set();
  let audioContext;
  let masterGain;
  let wantsMusic = false;
  let audioBusy = false;
  let audioDirty = false;
  let musicTimer;
  let noteIndex = 0;

  function updateSoundButton() {
    const playing = wantsMusic && !document.hidden && audioContext && audioContext.state === 'running';
    soundButton.setAttribute('aria-pressed', String(wantsMusic));
    soundButton.setAttribute('aria-label', wantsMusic ? 'Tắt nhạc nền dịu nhẹ' : 'Bật nhạc nền dịu nhẹ');
    soundButton.classList.toggle('is-playing', Boolean(playing));
    soundLabel.textContent = !wantsMusic ? 'Một chút nhạc?' : playing ? 'Nhạc đang khẽ ngân' : 'Nhạc đang tạm nghỉ';
  }

  function silenceMusic() {
    clearTimeout(musicTimer);
    musicTimer = undefined;
    if (masterGain) masterGain.gain.value = 0;
    for (const voice of voices) {
      voice.oscillator.onended = null;
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
    }
    voices.clear();
  }

  function playNote() {
    musicTimer = undefined;
    if (!wantsMusic || document.hidden || audioContext.state !== 'running') return;
    const now = audioContext.currentTime;
    const frequency = 440 * 2 ** ((melody[noteIndex] - 69) / 12);
    // Two soft partials per note; every voice disconnects after its short decay.
    [1, 2].forEach((partial) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(partial === 1 ? 0.36 : 0.055, now + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
      oscillator.connect(envelope);
      envelope.connect(masterGain);
      const voice = { oscillator, envelope };
      voices.add(voice);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        voices.delete(voice);
      };
      oscillator.start(now);
      oscillator.stop(now + 1.6);
    });
    noteIndex = (noteIndex + 1) % melody.length;
    musicTimer = setTimeout(playNote, noteIndex === 0 ? 2400 : 720);
  }

  async function reconcileAudio() {
    audioDirty = true;
    if (audioBusy) return;
    audioBusy = true;
    // Serialize browser resume/suspend promises; the latest user intent always wins.
    try {
      while (audioDirty) {
        audioDirty = false;
        if (!audioContext) continue;
        const shouldPlay = wantsMusic && !document.hidden;
        if (shouldPlay) {
          try {
            if (audioContext.state !== 'running') await audioContext.resume();
            if (wantsMusic && !document.hidden && audioContext.state === 'running') {
              masterGain.gain.value = 0.11;
              if (musicTimer === undefined) playNote();
            }
          } catch {
            if (wantsMusic && !document.hidden) {
              wantsMusic = false;
              silenceMusic();
              notify('Trình duyệt chưa bật được âm thanh. Cậu có thể thử lại bằng nút nhạc nhé.');
            }
          }
        } else {
          silenceMusic();
          if (audioContext.state === 'running') {
            try { await audioContext.suspend(); } catch { /* Disconnected voices remain silent. */ }
          }
        }
        updateSoundButton();
      }
    } finally {
      audioBusy = false;
    }
  }

  soundButton.addEventListener('click', () => {
    wantsMusic = !wantsMusic;
    if (wantsMusic && !audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        wantsMusic = false;
        updateSoundButton();
        notify('Trình duyệt này chưa hỗ trợ nhạc nền. Mình vẫn có những lời thương để đọc nhé.');
        return;
      }
      try {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioContext.destination);
        audioContext.addEventListener('statechange', () => {
          if (audioContext.state === 'running' && wantsMusic && !document.hidden) {
            masterGain.gain.value = 0.11;
            if (musicTimer === undefined) playNote();
          } else {
            silenceMusic();
          }
          updateSoundButton();
        });
      } catch {
        wantsMusic = false;
        if (audioContext) void audioContext.close().catch(() => {});
        audioContext = undefined;
        masterGain = undefined;
        updateSoundButton();
        notify('Chưa mở được âm thanh trên thiết bị này. Cậu vẫn đọc thư bình thường nhé.');
        return;
      }
    }
    if (!wantsMusic) silenceMusic();
    updateSoundButton();
    void reconcileAudio();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearCelebration();
      silenceMusic();
    }
    updateSoundButton();
    void reconcileAudio();
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      clearCelebration();
      finishFeelings();
    }
  });
})();
