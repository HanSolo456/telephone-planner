📡 Prim’s Algorithm Telecom Network Planner

A web-based visualization tool that demonstrates how Prim’s algorithm can efficiently design a telecommunication network connecting multiple locations.

This interactive app lets users choose locations, set a starting point, and watch the optimal network being built in real-time on a map.


✨ Features
	•	🔎 Dynamic Location Search – Search any location worldwide using the OpenStreetMap (Nominatim) API.
	•	🎯 User-Defined Start Node – Choose the primary starting point for the network.
	•	🗺️ Interactive Map Visualization – Displays locations and network connections on a Leaflet map.
	•	🧮 Classic Prim’s Algorithm – Computes the Minimum Spanning Tree (MST) based on shortest geographical distance.
	•	🎬 Step-by-Step Animation – Watch the algorithm build the network with play, pause, and reset controls.
	•	📊 Real-Time Insights – Sidebar shows total network length as it builds.
	•	🎨 Modern UI – Clean, responsive design with Tailwind CSS.

⸻

🚀 How It Works
	1.	Choose a Starting Point – Search for your main village/city. This appears in red.
	2.	Add Other Locations – Add up to 4 other destinations (shown in blue).
	3.	Visualize the Network – The app auto-zooms to fit all locations. Use animation controls to watch Prim’s algorithm construct the optimal network step by step.


🛠️ Getting Started

1. Clone the repository

git clone https://github.com/HanSolo456/telephone-planner.git
cd telephone-planner

2. Install dependencies

npm install

3. Run the development server

npm run dev

Now open 👉 http://localhost:5173 in your browser.


🧩 Tech Stack
	•	⚛️ React (Vite)
	•	🎨 Tailwind CSS
	•	🗺️ Leaflet.js
	•	🌍 OpenStreetMap (Nominatim API)


🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to fork this repo and submit pull requests.