import json

def main():
    geojson = {}
    geojson['type'] = 'FeatureCollection'
    features = []
    for station in json.load(open('stations.json', 'r', encoding='utf-8')):
        feature = {}
        feature['type'] = 'Feature'
        feature['properties'] = {
            'name': station['name'],
            'lines': station['lines'],
            'place_id': station['place_id']
        }
        feature['geometry'] = {
            'type': 'Point',
            'coordinates': [station['lng'], station['lat']]
        }
        features.append(feature)
    geojson['features'] = features

    with open('stationsgeo.json', 'w') as outfile:
        json.dump(geojson, outfile)

if __name__ == '__main__':
    main()
