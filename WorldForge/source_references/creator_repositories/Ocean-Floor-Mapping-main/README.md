<div style="display: flex; align-items: center; justify-content: center;">
  <img src="ocean-floor-mapping/assets/icon.png" alt="icon" style="height:60px;width:60px; margin-right: 15px; vertical-align: middle;">
<h1 style="display:inline-block; border-bottom:none; margin:0; vertical-align:middle;">Ocean Floor Mapping</h1>

</div>

---


## Table of Contents
- [Introduction](#abstract)
- [Requirements](#requirements)
- [How to use](#installation-and-usage)
- [Preview](#preview)
- [Team](#team-details)
- [Contribution](#contribution)
- [Improvements](#improvements)

---

## Abstract
The **Ocean Floor Mapping** project leverages deep learning and geospatial data to predict and visualize underwater topography. Using satellite GeoTIFF imagery, our system estimates ocean floor depth, classifies terrain types, analyzes seabed chemical composition, and produces 3D visual representations. This tool supports marine research, underwater navigation, and geological exploration by offering an accessible way to analyze and visualize seabed features.

---

## Requirements
| | |
|---|---|
| **Python** | 3.10+ |
| **TensorFlow** | 2.10+ |
| **Rasterio** | [rasterio.readthedocs.io](https://rasterio.readthedocs.io/) |
| **NumPy** | [numpy.org](https://numpy.org/) |
| **Matplotlib** | [matplotlib.org](https://matplotlib.org/) |
| **scikit-image** | [scikit-image.org](https://scikit-image.org/) |
| **Plotly** | [plotly.com/python](https://plotly.com/python/) |
| **Streamlit** | [streamlit.io](https://streamlit.io/) |

---

## Installation and usage

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/AAC-Open-Source-Pool/25AACL06.git
    cd 25AACL06
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Streamlit app:**
    ```bash
    streamlit run app.py
    ```
Upload a `.tif` or `.tiff` satellite file in the UI to generate predicted depth maps and 3D visualizations. The trained CNN model (`best_depth_model.h5`) will predict depth values, and visualizations such as 3D surface plots and heatmaps will be displayed interactively.

---

## Preview
Screenshots of the project:

<img src="ocean-floor-mapping/assets/Preview1.jpeg" alt="Preview1" style="max-width: 400px; margin-right: 10px;">
<img src="ocean-floor-mapping/assets/Preview2.jpeg" alt="Preview2" style="max-width: 400px;">
---

## Team details
- **Team Number:** 25AACL06
- **Senior Mentor:** Ekanth Sai
- **Junior Mentor:** N. Asritha
- **Team Member 1:** Ganga Nakshatra
- **Team Member 2:** Akshaya Thummala
- **Team Member 3:** Buddhavaram Sai Krishna
- **Team Member 4:** Jaggavarapu Harshith Reddy
- **Team Member 5:** Seelam Bhavana

---

## Contribution
**This section provides instructions and details on how to submit a contribution via a pull request. It is important to follow these guidelines to make sure your pull request is accepted.**

1. Before choosing to propose changes to this project, it is advisable to go through the `README.md` file of the project to get the philosophy and the motive that went behind this project. The pull request should align with the philosophy and the motive of the original poster of this project.
2. To add your changes, make sure that the programming language in which you are proposing the changes should be the same as the programming language that has been used in the project. The versions of the programming language and the libraries(if any) used should also match with the original code.
3. Write a documentation on the changes that you are proposing. The documentation should include the problems you have noticed in the code(if any), the changes you would like to propose, the reason for these changes, and sample test cases. Remember that the topics in the documentation are strictly not limited to the topics aforementioned, but are just an inclusion.
4. Submit a pull request via [Git etiquettes](https://gist.github.com/mikepea/863f63d6e37281e329f8).

---

## Improvements

- **Integration with real-time satellite data:** Implement live satellite data feeds (e.g., Sentinel-2, Landsat-8) to enable near real-time ocean floor updates.
- **Addition of more terrain types:** Expand terrain classification beyond basic categories to include volcanic ridges, seamounts, and subduction zones.
- **Improved depth prediction accuracy:** Use larger datasets and fine-tuned neural architectures for enhanced model precision.
- **Automated anomaly detection:** Detect unusual seabed features like potential hydrothermal vents or fault lines using AI-driven pattern recognition.
- **Multi-layer visualization:** Combine bathymetry, mineral data, and ocean temperature into unified layered 3D maps.
- **Integration with marine research APIs:** Connect with oceanographic databases (like NOAA or GEBCO) for richer contextual insights.
