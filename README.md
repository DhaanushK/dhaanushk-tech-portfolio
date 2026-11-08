# Dhaanush K | AI, Machine Learning and Data Analytics Portfolio

A responsive, multi-page technical portfolio showcasing six projects across analytics, machine learning, computer vision, and full-stack engineering, with three detailed business intelligence case studies.

## Preview locally

The site is static HTML, CSS, and JavaScript. The Wine Oracle browser model needs to be served over HTTP, so use the local preview command in the Wine Oracle section below instead of opening that page as a `file://` URL. Other project case studies are under `projects/`.

## Features

- Burgundy, ivory, champagne, and antique-gold palette.
- Topbar profile control with portrait and the expandable Uiverse profile-card component.
- Featured-project carousel with automatic advance, previous/next controls, slide selection, and pause. It pauses while hovered, focused, or when the tab is hidden. Reduced-motion preference disables autoplay.
- Editorial project index with project-specific findings and links.
- A dedicated case-study page per project with question, approach, engineering choices, findings, data limitations, tools by role, repository links, and a report demo area.
- Wine Oracle case study with client-side TensorFlow.js inference for red and white wine samples. Sample values stay in the visitor's browser.
- Power BI embed slot and PBIX download link on each case study. Add a public Power BI embed URL to `report-demo.js` only after confirming the report is suitable for public release.
- No dashboard screenshots are used in the portfolio.
- No scroll hijacking, entrance animations, logo marquees, or cursor effects.
- The Uiverse card's attribution and MIT license are in `THIRD_PARTY_NOTICES.md`.

## Power BI report embeds

`report-demo.js` contains an `embedUrls` map. The URLs are currently blank, so each case-study page shows a clear fallback message and a repository/PBIX link. To activate a public interactive report, add the Power BI **Publish to web** embed URL for the corresponding report. Publish to web makes the report and underlying model data accessible to anyone online. Review the report contents before inserting its URL.

## Adding a future ML/DL project

1. Add a case-study page under `projects/` using the shared styles.
2. Explain the dataset, preprocessing, modeling decisions, validation, errors/tradeoffs, and limitations.
3. Link a deployed demo where visitors can provide safe sample inputs and see model outputs.
4. Add a featured slide and project-index row in `index.html`.

## Hosting

The site is static HTML, CSS, and JavaScript and can be deployed to Netlify or Vercel. No build step is required. Project and download links point to the public GitHub repositories.
The profile card is displayed directly in the homepage hero. Its portrait file is `assets/profile-photo.png`.

## Wine Oracle sample predictor

The predictor page is `projects/wine-oracle/index.html`. It loads TensorFlow.js 4.22.0 and the exported model weights from `projects/wine-oracle/demo/` when a visitor first requests a prediction. The example button randomly selects a coherent measurement row from the matching red or white project dataset, cycling through a shuffled sample pool before repeating. Inference runs in the browser, and the input values are not sent to a prediction API. To preview locally, run `python -m http.server 5500` from the portfolio root and open `http://localhost:5500/projects/wine-oracle/`. The static portfolio host serves both the page and model files, so no Python inference service is needed.

To refresh the browser model files after retraining, run the exporter with the Python environment used for the Wine Quality Prediction project:

```powershell
& "D:\College Projects\Wine-Quality-Prediction\.venv\Scripts\python.exe" `
  "D:\Data Analyst Portfolio\projects\wine-oracle\demo\export_model.py" `
  --source "D:\College Projects\Wine-Quality-Prediction" `
  --output "D:\Data Analyst Portfolio\projects\wine-oracle\demo\model-data.js"
```
