# For processing data

data := data
original := $(data)/original
build := $(data)/build
routes := '4', '6', '12', '61', '141', '698'

# Sources
source_routes_terminal := ftp://gisftp.metc.state.mn.us/TransitRoutesByTermLetter.zip
source_routes := ftp://gisftp.metc.state.mn.us/TransitRoutes.zip

# Local
local_routes_terminal_zip := $(original)/TransitRoutesByTermLetter.zip
local_routes_terminal_dir := $(original)/TransitRoutesByTermLetter
local_routes_terminal_shp := $(local_routes_terminal_dir)/TransitRoutesByTermLetter.shp
local_routes_zip := $(original)/TransitRoutes.zip
local_routes_dir := $(original)/TransitRoutes
local_routes_shp := $(local_routes_dir)/TransitRoutes.shp

# Converted
build_routes_terminal_geojson := $(build)/routes-by-terminal.geo.json
build_routes_geojson := $(build)/routes.geo.json


# Get data
$(local_routes_terminal_shp):
	mkdir -p $(original)
	curl -L -o $(local_routes_terminal_zip) "$(source_routes_terminal)"
	unzip -d $(local_routes_terminal_dir) $(local_routes_terminal_zip)
	touch $(local_routes_terminal_shp)

$(local_routes_shp):
	mkdir -p $(original)
	curl -L -o $(local_routes_zip) "$(source_routes)"
	unzip -d $(local_routes_dir) $(local_routes_zip)
	touch $(local_routes_shp)

download: $(local_routes_shp) $(local_routes_terminal_shp)
download_clean:
	rm -r $(original)/*


# Reproject and filter
# http://spatialreference.org/ref/epsg/nad83-utm-zone-15n/
$(build_routes_terminal_geojson): $(local_routes_terminal_shp)
	mkdir -p $(build)
	ogr2ogr -f "GeoJSON" $(build_routes_terminal_geojson) $(local_routes_terminal_shp) -dialect "sqlite" -sql "SELECT ST_LineMerge(geometry) AS geometry, * FROM TransitRoutesByTermLetter WHERE line_id IN ($(routes))" -s_srs EPSG:26915 -t_srs EPSG:4326

$(build_routes_geojson): $(local_routes_shp)
	mkdir -p $(build)
	ogr2ogr -f "GeoJSON" $(build_routes_geojson) $(local_routes_shp) -dialect "sqlite" -where "route IN ($(routes))" -s_srs EPSG:26915 -t_srs EPSG:4326

build: $(build_routes_geojson) $(build_routes_terminal_geojson)
build_clean:
	rm -r $(build)/*


# All
all: build
clean: build_clean download_clean
