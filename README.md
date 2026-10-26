# NCREE / t0227

Interactive arrival-based AE source locations, published at:

https://leejie910812.github.io/NCREE/

## Views

| Method | Time | Depth |
| --- | --- | --- |
| Way1 | [Time](views/way1/time.html) | [Depth](views/way1/depth.html) |
| Way3 | [Time](views/way3/time.html) | [Depth](views/way3/depth.html) |

The website retains the existing Plotly traces, animation frames, coordinates and controls. The wrapper adds method/view selection and responsive presentation. Animation starts only when Play is selected. It does not recalculate locations or apply the high-frequency magnitude weighting algorithm.

## Updating the Figures

From the original experiment folder, regenerate the HTML figures as usual, then run:

```powershell
.\ae_web\prepare_site.ps1
```

If this repository is elsewhere, pass the source experiment directory:

```powershell
.\prepare_site.ps1 -SourceRoot 'C:\path\to\t0227.exp'
```

Commit and push the four updated files in `views/`. GitHub Pages is configured to publish the `main` branch from `/`.

The source HTML files are not modified. Only the four prepared views and this website are published; raw measurements, CSVs, result pickles and Python calculation scripts are not included. The published HTML contains the plotted experiment data and is public.

Open `index.html` directly for a local copy. An internet connection is needed for the Plotly CDN used by the original figures. Each view contains approximately 30 MiB of data; the website loads one view at a time.

## Dependencies

- Plotly.js 4.1.1, loaded from the original figures' CDN URL with its original integrity attribute.
- Lucide 0.468.0 (ISC license), vendored in `assets/lucide.min.js`; license in `assets/lucide-LICENSE`.
