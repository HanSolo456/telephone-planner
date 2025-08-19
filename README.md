# 📡 Prim's Algorithm Telecom Network Planner  

An interactive web-based tool that demonstrates how **Prim's algorithm** can efficiently design a telecommunication network connecting multiple locations.  

## 🌐 Live Demo  
> Coming soon on Vercel/Netlify...  

## 🚀 Features  
- 🔎 **Dynamic Location Search** – Worldwide search powered by OpenStreetMap (Nominatim API).  
- 🎯 **Custom Start Node** – Choose a primary starting point for the network.  
- 🗺️ **Interactive Map** – Renders selected locations and MST connections on a Leaflet map.  
- 🧮 **Prim’s Algorithm** – Calculates the Minimum Spanning Tree (MST) using real geographical distances.  
- 🎬 **Step-by-Step Animation** – Play, pause, and reset controls to visualize how the network is built.  
- 📊 **Real-Time Insights** – Sidebar displays total network length dynamically.  
- 🎨 **Modern UI** – Clean and responsive design built with Tailwind CSS.  

## 🛠️ Built With  
- ⚛️ React (Vite)  
- 🎨 Tailwind CSS  
- 🗺️ Leaflet.js  
- 🌍 OpenStreetMap (Nominatim API)  

## 📖 How It Works  
1. **Choose a Starting Point**  
   - Use the search bar to select your primary location (highlighted in red).  
2. **Add Other Locations**  
   - Add up to four more nodes (highlighted in blue).  
3. **Visualize the Network**  
   - The map auto-zooms to fit all locations.  
   - Use animation controls to watch Prim’s algorithm build the most efficient network in real time.  