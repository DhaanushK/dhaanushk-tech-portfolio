(() => {
  const key = document.body.dataset.report;
  const frame = document.querySelector('[data-report-frame]');
  if (!frame) return;
  const embedUrls = {
    itam: 'https://app.powerbi.com/view?r=eyJrIjoiNmY4ODMxOWYtZWNiMS00MDA4LWExN2UtZDUwYjE4YjNjNTQ2IiwidCI6ImNjNTk0NjhiLWJjNDEtNDdlZi1iYjA0LTg2NTVkYmQ2OTJhNSJ9',
    medicinal: 'https://app.powerbi.com/view?r=eyJrIjoiYzExZWI1ZDAtZGFkNS00MjIzLWIxZTQtZDRmY2IxOTQ1ZjJlIiwidCI6ImNjNTk0NjhiLWJjNDEtNDdlZi1iYjA0LTg2NTVkYmQ2OTJhNSJ9',
    wine: 'https://app.powerbi.com/view?r=eyJrIjoiZjExNzUwZGEtOTVlMC00M2Y5LWI0NTktNGI2YjFjMGVjZDYwIiwidCI6ImNjNTk0NjhiLWJjNDEtNDdlZi1iYjA0LTg2NTVkYmQ2OTJhNSJ9'
  };
  const url = embedUrls[key];
  const placeholder = frame.querySelector('.report-placeholder');
  if (url) {
    const iframe = document.createElement('iframe');
    iframe.title = `${document.title} interactive Power BI report`;
    iframe.src = url;
    iframe.allowFullscreen = true;
    placeholder.replaceWith(iframe);
  }
})();
