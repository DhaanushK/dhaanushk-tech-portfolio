# Dhaanush K | AI, Machine Learning and Data Analytics Portfolio

A static technical portfolio featuring six projects across data analytics, machine learning, computer vision, and full-stack engineering.

**Live portfolio:** [dhaanushk-tech-portfolio.netlify.app](https://dhaanushk-tech-portfolio.netlify.app)

## What’s included

- A homepage with a profile card, introduction, technical skills, education, and featured projects.
- A manually controlled project carousel with previous, next, and direct slide controls.
- Individual project pages for the analytics dashboards and interactive machine learning demos.
- Resume downloads, social links, and a research publication.
- No framework or build step is required.

## Project demos

### Wine Oracle

An interactive wine quality prediction demo. The model runs in the browser using TensorFlow.js. Visitors can enter sample measurements and request a prediction. Inputs are processed in the browser and are not sent to a prediction server.

### Medicinal Plant Classification

An image classification demo hosted on Streamlit. Visitors can upload a plant image and view the model’s top predictions.

[Open the classifier](https://medicinal-plant-classifier.streamlit.app/)

### Interactive Power BI reports

The IT Asset Management, Medicinal Plant Price Trend Analysis, and Wine Market Analysis project pages embed their Power BI reports. The report URLs are configured in `report-demo.js`.

The Wine Market Analysis page also links to its PBIX file. The IT Asset Management and Medicinal Plant Price Trend Analysis pages provide their repository links.

Power BI Publish to web reports are publicly viewable, including their underlying model data.

### Automated Accountability System

This project is featured on the homepage and links to its source repository.

## Research

The Wine Oracle project resulted in a co-authored publication in the REST Journal on Data Analytics and Artificial Intelligence.

[Read the publication](https://doi.org/10.46632/jdaai/3/2/13)

## Repository structure

- `index.html` - portfolio homepage
- `styles.css` - site styles
- `script.js` - homepage interactions and manual carousel controls
- `report-demo.js` - Power BI report embed URLs
- `components/` - profile card styles
- `assets/` - project images, profile photo, and resume PDFs
- `projects/` - project detail pages and demo files
- `THIRD_PARTY_NOTICES.md` - third-party component attributions and licenses
