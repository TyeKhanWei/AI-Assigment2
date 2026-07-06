"""Graph data for the House Tour problem, taken from Assignment 1 (Tables 1.1-1.3).

TIME  = travel time in minutes (directed: TIME[route][from][to]).
DIST  = distance in km (directed).
Route "A" and "B" are the two Google Maps routing options collected in Assignment 1.
"""

# lat/lng from OpenStreetMap Nominatim. Nodes 2 and 6 (Lagoon View blocks A/B)
# are really ~160 m from Sunway University (node 0); their coordinates are
# offset by ~0.7 km here so the three markers don't overlap on the map view.
# Real Lagoon View location: 3.0670, 101.6053.
NODES = [
    {"id": 0, "name": "Sunway University",          "label": "Sunway Uni",              "area": "Bandar Sunway, Subang Jaya", "lat": 3.0672, "lng": 101.6039},
    {"id": 1, "name": "Addison Loo's Residence",    "label": "SS4 (Addison)",           "area": "SS4, Petaling Jaya",         "lat": 3.1095, "lng": 101.6037},
    {"id": 2, "name": "Albert Pang's Residence",    "label": "Lagoon View A (Albert)",  "area": "Bandar Sunway, Subang Jaya", "lat": 3.0607, "lng": 101.6076},
    {"id": 3, "name": "Chin Yung Xuan's Residence", "label": "Kota Kemuning (Yung Xuan)", "area": "Kota Kemuning, Shah Alam", "lat": 3.0049, "lng": 101.5360},
    {"id": 4, "name": "Eng Zheng Yu's Residence",   "label": "Kemuning Utama (Zheng Yu)", "area": "Kemuning Utama, Shah Alam", "lat": 3.0096, "lng": 101.5290},
    {"id": 5, "name": "Tan Yann Bin's Residence",   "label": "SS2 (Yann Bin)",          "area": "SS2, Petaling Jaya",         "lat": 3.1161, "lng": 101.6222},
    {"id": 6, "name": "Tye Khan Wei's Residence",   "label": "Lagoon View B (Khan Wei)", "area": "Bandar Sunway, Subang Jaya", "lat": 3.0731, "lng": 101.6118},
]

TIME = {
    "A": [
        [0, 16, 3, 20, 20, 26, 3],
        [16, 0, 16, 26, 28, 10, 16],
        [3, 16, 0, 18, 20, 24, 3],
        [26, 35, 28, 0, 14, 45, 28],
        [22, 30, 24, 9, 0, 35, 24],
        [18, 8, 18, 28, 30, 0, 18],
        [3, 16, 3, 18, 20, 24, 0],
    ],
    "B": [
        [0, 18, 4, 24, 26, 28, 4],
        [18, 0, 18, 30, 28, 12, 18],
        [8, 16, 0, 24, 26, 30, 3],
        [30, 40, 35, 0, 14, 45, 35],
        [26, 30, 24, 10, 0, 35, 24],
        [20, 8, 20, 35, 30, 0, 20],
        [8, 16, 3, 24, 26, 30, 0],
    ],
}

DIST = {
    "A": [
        [0, 7.4, 0.21, 15.9, 12.9, 11.4, 0.21],
        [8.2, 0, 8.4, 23.9, 20.9, 3.2, 8.4],
        [0.21, 7.0, 0, 15.8, 12.8, 11.0, 0.1],
        [16.9, 22.5, 17.1, 0, 7.9, 26.5, 17.1],
        [16.6, 22.0, 16.8, 6.9, 0, 26.2, 16.8],
        [10.8, 3.0, 10.9, 26.5, 23.5, 0, 10.9],
        [0.21, 7.0, 0.1, 15.8, 12.8, 11.0, 0],
    ],
    "B": [
        [0, 8.7, 0.3, 19.4, 20.0, 15.4, 0.3],
        [10.7, 0, 10.8, 25.0, 19.3, 3.9, 10.8],
        [0.55, 7.1, 0, 19.7, 16.7, 13.3, 0.1],
        [15.5, 25.3, 15.7, 0, 6.6, 26.2, 15.7],
        [17.7, 22.2, 15.4, 6.3, 0, 25.9, 15.4],
        [12.2, 3.2, 12.3, 27.5, 21.8, 0, 12.3],
        [0.55, 7.1, 0.1, 19.7, 16.7, 13.3, 0],
    ],
}

_WALK_PAIRS = {(0, 2), (0, 6), (2, 6)}


def mode(a, b):
    """Transport mode for the directed leg a->b ("walk" or "drive")."""
    return "walk" if (a, b) in _WALK_PAIRS or (b, a) in _WALK_PAIRS else "drive"
