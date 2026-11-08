(() => {
  const profileCard = document.querySelector('.hero-profile .card');
  profileCard?.addEventListener('click', (event) => {
    if (!event.target.closest('a, button')) profileCard.classList.toggle('is-open');
  });
  document.addEventListener('click', (event) => {
    if (profileCard && !profileCard.contains(event.target)) profileCard.classList.remove('is-open');
  });

  const slides = [...document.querySelectorAll('[data-slide]')];
  if (!slides.length) return;
  const dots = [...document.querySelectorAll('.slide-dot')];
  const number = document.getElementById('slide-number');
  const total = document.getElementById('slide-total');
  let current = 0;
  if (total) total.textContent = String(slides.length).padStart(2, '0');

  function show(index, animate = false) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.toggle('is-current', i === current);
      slide.classList.remove('is-entering');
    });
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => slides[current]?.classList.add('is-entering'));
    }
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    number.textContent = String(current + 1).padStart(2, '0');
  }
  document.getElementById('previous-slide').addEventListener('click', () => show(current - 1, true));
  document.getElementById('next-slide').addEventListener('click', () => show(current + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i, true)));
  document.getElementById('year').textContent = new Date().getFullYear();
})();

