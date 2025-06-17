from pathlib import Path
from sys import argv
import json


if len(argv) != 2:
    raise Exception("Must include a content file")

target_file = argv[1]

path = Path(argv[1])
f = open(path)

places_dict = json.load(f)

for place, info in places_dict.items():
    [x1, y1, x2, y2] = area_coords[place].split(",")

    # flip y coords - leaflet considers 0 bottom whereas html area considers 0
    # the top of the image
    y1 = MAP_HEIGHT - int(y1)
    y2 = MAP_HEIGHT - int(y2)

    # leaflet latlng wants y first
    coords = [[y1, int(x1)], [y2, int(x2)]]
    places_dict[place]["coords"] = coords

content_file = open(path.parent / "places.json", "w")
json.dump(places_dict, content_file)