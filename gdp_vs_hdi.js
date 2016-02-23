format = d3.time.format("%d-%m-%Y (%H:%M h)");
// Draw a slope plot from the gdp_data. The left half of the
// plot displays the GDP of the countries and the right half of
// the plot displays the HDI of the countries. Color the
// connecting lines between GDP and HDI of the same same country
// according to the discrepancy beween GDP and HDI - color them one
// way when GDP is higher and the other way when the HDI is higher.
function draw(gdp_data) {
    "use strict";
    // D3.js setup code 
    var rank_diff_threshold = 30;
    var chart_margin = {top: 40, bottom: 10, left: 50, right: 50},
        chart_width = 500 - chart_margin.left - chart_margin.right,
        chart_height = 400 - chart_margin.top - chart_margin.bottom;
    var chart_svg = d3.select("body #wrap #main")
        .append("svg")
        .attr("width", chart_width + chart_margin.left + chart_margin.right)
        .attr("height", chart_height + chart_margin.top + chart_margin.bottom)
        .append('g')
        .attr('class', 'chart');
    var map_margin = {top: 10, bottom: 45, left: 10, right: 130},
        map_width = 300 - map_margin.left - map_margin.right,
        map_height = 200 - map_margin.top - map_margin.bottom;
    var map_svg = d3.select("body #wrap #sidebar .region_map")
        .append("svg")
        .attr("width", map_width + map_margin.left + map_margin.right)
        .attr("height", map_height + map_margin.top + map_margin.bottom)
        .append('g')
        .attr('class', 'map');
    var left_indicator = 'GDP';
    var right_indicator = 'HDI';
    var hdi_color = '#aa015c';
    var gdp_color = '#5539f7';
    var neutral_color = '#a4a7ab';
    var left_extent = d3.extent(gdp_data, function(d) {
        return d[left_indicator];
    });
    var left_scale = d3.scale.linear()
        .domain(left_extent)
        .range([chart_height-chart_margin.top, chart_margin.bottom]);

    var right_extent = d3.extent(gdp_data, function(d) {
        return d[right_indicator];
    });
    var right_scale = d3.scale.linear()
        .domain(right_extent)
        .range([chart_height-chart_margin.top, chart_margin.bottom]);
    var years_set = d3.set();
    var regions_set = d3.set();
    var ccode_to_region = new Map();
    gdp_data.forEach(function(d) {
        years_set.add(d['Year']);
        if(!is_missing(d['Region'])) {
            if(!ccode_to_region.has(d['Country_Code'])) {
                ccode_to_region.set(d['Country_Code'], d['Region']);
            }
            regions_set.add(d['Region']);
        }
    });
    var years = [];
    years_set.forEach(function(d) {
        years.push(+d);
    });
    var regions = [];
    regions_set.forEach(function(d) {
        regions.push(d);
    });
    // State variables shared across functions
    var current_year = NaN;
    var current_region = '';

    var region_color_scale = d3.scale.category10().domain(regions);
    var time_extent = d3.extent(gdp_data, function(d) {
        return d['Year'];
    });
    var time_scale = d3.time.scale()
        .range([chart_margin.left, chart_width])
        .domain(time_extent);

    // Simple utility functions refactored from larger functions that follow.
    function key_country_year(d) {
        return d['Country_Name']+d['Year'];
    }
    function key_all(d) {
        return d;
    }
    function is_missing(d) {
        return !d;
    }
    var left_x = chart_margin.left;
    function left_y(d) {
        return left_scale(d[left_indicator])
    }
    var right_x = chart_margin.left+chart_width;
    function right_y(d) {
        return right_scale(d[right_indicator])
    }
    function different_rank(d, diff_threshold) {
        var rank_diff = d['HDI']-d['GDP'];
        var is_similar = (rank_diff < -1 * diff_threshold) ||
            (rank_diff > diff_threshold);
        return is_similar;
    }
    function circle_color(d) {
        var color = neutral_color;
        if(different_rank(d, rank_diff_threshold)) {
            if (d['GDP'] > d['HDI']) {
                color = gdp_color;
            } else if (d['GDP'] < d['HDI']) {
                color = hdi_color;
            }
        } 
        return color;              
    }
    function circle_zindex(d) {
        var idx = 2;
        if(different_rank(d, rank_diff_threshold)) {
			idx = -1;
        } 
        return idx;              
    }
    function slope_zindex(d) {
        var idx = 1;
        if(different_rank(d, rank_diff_threshold)) {
			idx = -1;
        } 
        return idx;              
    }
    function slope_width(d) {
        var width = 1;
        if(different_rank(d, rank_diff_threshold)) {
            width = 2;
        } 
        return width;              
    }
    function slope_color(d) {
        //var color = neutral_color;
        var color = region_color_scale(d['Region']);
        if(different_rank(d, rank_diff_threshold)) {
            color = region_color_scale(d['Region']);
        }
        return color;
    }
    function slope_opacity(d) {
        var opacity = 0.2;
        if(different_rank(d, rank_diff_threshold)) {
            opacity = 1;
        }
        return opacity;
    }
    function circle_radius(d) {
        var radius = '3px';
        if(different_rank(d, rank_diff_threshold)) {
            radius = '6px';
        }
        return radius;
    }
    function display_style(d) {
        var ds = is_missing(d[left_indicator])||is_missing(d[right_indicator]) ?
            "none" : null;
        return ds;
    }
    function region_color(d) {
        var color = "lightBlue";
        if(ccode_to_region.has(d.id)) {
            color = region_color_scale(ccode_to_region.get(d.id));
        }
        return color;
    }

    // Function Draw a world map with country boundaries
    function drawMap(geo_data) {
        var projection = d3.geo.mercator()
            .scale(45)
            .translate([map_width, map_height]);
        var path = d3.geo.path().projection(projection);
        var map = map_svg.selectAll('path')
            .data(geo_data.features)
            .enter()
            .append('path')
            .attr('id', function(d) {return d.id;})
            .attr('d', path)
            .attr('opacity', 0.2)
		    .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('fill', region_color);
    }

    // Function to highlight the countries in gdp_data on the map
    function highlightMap(map_svg, gdp_data) {
        var ccodes = [];
        gdp_data.forEach(function(d) {
            if(different_rank(d, rank_diff_threshold)) {
                ccodes.push(d['Country_Code']);
            } 
        }); 
        map_svg.selectAll('path')
            .attr('opacity', function(d) {
                return (ccodes.indexOf(d.id) !== -1) ? 1 : 0.2;
            })
    }
	function countryText(count) {
		if(count==0) {
			return "no countries";
		} else if (count==1) {
			return "1 country";
		} else {
			return count+" countries";			
		}
	}
	
	// Function to highlight the countries in gdp_data on the map
    function highlightLegend(year, region, filtered_data) {
        var hi_countries = [], lo_countries=[], eq_countries = [];
        filtered_data.forEach(function(d) {
            var region = d['Region'];
            var ccode = d['Country_Code'];			
			if(is_missing(region)) {
				;
			} else if(different_rank(d, rank_diff_threshold)) {
                if (d['GDP'] > d['HDI']) {
					if(hi_countries.indexOf(ccode) < 0) {
                        hi_countries.push(ccode);
                    }
                } else if(lo_countries.indexOf(ccode) < 0) {
                    lo_countries.push(ccode);
                }
            } else if(eq_countries.indexOf(ccode)<0) {
                eq_countries.push(ccode);
            }
        });
        var hi_gdp = hi_countries.length;
		var lo_gdp = lo_countries.length;
		var eq_gdp = eq_countries.length;

		var line_color = is_missing(region) ? 'black' :
			region_color_scale(region);
		
		var fieldSet = d3.select("body #wrap #main .country_legend");
		fieldSet.selectAll("svg").remove();
		fieldSet.selectAll("span").remove();		

		fieldSet.select("legend")
			.html(writeCaption(year, region));
		if(eq_gdp > 0) {
			var eq_svg = fieldSet.append('svg')
				.attr("height", 12)
				.attr("width", 35);
			eq_svg.append('line')
			    .attr("x1", 6)
				.attr("y1", 6)
				.attr("x2", 30)
				.attr("y2", 6)
			    .attr("opacity", 0.2)
			    .attr("stroke-width", 1)
				.attr("stroke", line_color);
			eq_svg.append('circle')
			    .attr("cx", 6)
				.attr("cy", 6)
				.attr("r", 3)
				.attr("fill", neutral_color);
			eq_svg.append('circle')
			    .attr("cx", 30)
				.attr("cy", 6)
				.attr("r", 3)
				.attr("fill", neutral_color);
			fieldSet.append("span")
				.html(countryText(eq_gdp) + " have simular GDP and HDI ranks")
				.append('br')
				.append('br');			
		}
		if(hi_gdp > 0) {
			var eq_svg = fieldSet.append('svg')
				.attr("height", 24)
				.attr("width", 35);
			eq_svg.append('line')
			    .attr("x1", 6)
				.attr("y1", 6)
				.attr("x2", 30)
				.attr("y2", 20)
			    .attr("opacity", 0.2)
			    .attr("stroke-width", 1)
				.attr("stroke", line_color);
			eq_svg.append('circle')
			    .attr("cx", 6)
				.attr("cy", 6)
				.attr("r", 4)
				.attr("fill", gdp_color);
			eq_svg.append('circle')
			    .attr("cx", 30)
				.attr("cy", 20)
				.attr("r", 4)
				.attr("fill", gdp_color);
			fieldSet.append("span")
				.html(countryText(hi_gdp) +
					  " have much higher GDP than HDI ranks")
				.append('br')
				.append('br');			
		}
		if(lo_gdp > 0) {
			var eq_svg = fieldSet.append('svg')
				.attr("height", 24)
				.attr("width", 35);
			eq_svg.append('line')
			    .attr("x1", 6)
				.attr("y1", 20)
				.attr("x2", 30)
				.attr("y2", 6)
			    .attr("opacity", 0.2)
			    .attr("stroke-width", 1)
				.attr("stroke", line_color);
			eq_svg.append('circle')
			    .attr("cx", 6)
				.attr("cy", 20)
				.attr("r", 4)
				.attr("fill", hdi_color);
			eq_svg.append('circle')
			    .attr("cx", 30)
				.attr("cy", 6)
				.attr("r", 4)
				.attr("fill", hdi_color);
			fieldSet.append("span")
				.html(countryText(lo_gdp) +
					  " have much lower HDI than GDP ranks")
				.append('br')
				.append('br');			

		}
    }
    
    // Function to blink the slopes and maps for a country. 
    function blink_country(country_data) {
        var cline = chart_svg.selectAll("line")
            .data([country_data], key_country_year);
        var lcir = chart_svg.selectAll("circle.left_circle")
            .data([country_data], key_country_year);
        var rcir = chart_svg.selectAll("circle.right_circle")
            .data([country_data], key_country_year);
        var cpath = map_svg.select('path#'+country_data["Country_Code"]);
        var blink_duration = 500;
        var blink_loop = function() {
            var fade = 0.2;
            cline.attr('opacity', fade)
                .transition()
                .duration(blink_duration)
                .attr('opacity', 1)
                .each('end',blink_loop);
            lcir.attr('opacity', fade)
                .transition()
                .duration(blink_duration)
                .attr('opacity', 1)
                .each('end',blink_loop);
            rcir.attr('opacity', fade)
                .transition()
                .duration(blink_duration)
                .attr('opacity', 1)
                .each('end',blink_loop);
            cpath.attr('opacity', fade)
                .transition()
                .duration(blink_duration)
                .attr('opacity', 1)
                .each('end',blink_loop);
        };
        blink_loop();
    }

    // Function to stop blinking
    function unblink_country(country_data) {
        chart_svg.selectAll("line")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', 1);
        chart_svg.selectAll("circle.left_circle")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', 1);
        chart_svg.selectAll("circle.right_circle")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', 1);
        map_svg.select('path#'+country_data["Country_Code"])
            .transition().duration(100)
            .attr('opacity', 1);
    }
    
    // Create a DOM element for displaying tool tips for a country on hover, and
    // and functions for showing, tracking, and hiding the tips
    var country_tip = d3.select("body #wrap #main")
        .append("div").attr("class", "tooltip");
    country_tip.append('div').attr('class', 'region');
    country_tip.append('p').style('clear', 'both');
    country_tip.append('div').attr('class', 'country');
    country_tip.append('p').style('clear', 'both');
    country_tip.append('div').attr('class', 'gdp_indicator');
    country_tip.append('p').style('clear', 'both');
    country_tip.append('div').attr('class', 'hdi_indicator');


    // Functions to display, track, and hide country tip on hover
    function show_tip(country_data) {
        if(different_rank(country_data, rank_diff_threshold)) {
            country_tip.select('.region')
                .attr('color', circle_color(country_data))
                .html("<p class=\"alignleft\"><strong>Region:</strong><\p> <p class=\"alignright\">"+country_data.Region+"</p>");
            country_tip.select('.country')
                .attr('color', slope_color(country_data))
                .html("<p class=\"alignleft\"><strong>Country:</strong><\p> <p class=\"alignright\">"+country_data.Country_Name+"</p>");
            country_tip.select('.gdp_indicator').html(
                "<p class=\"alignleft\"><strong>GDP Rank:</strong><\p> <p class=\"alignright\">"+country_data.GDP+"</p>");
            country_tip.select('.hdi_indicator').html(
                "<p class=\"alignleft\"><strong>HDI Rank:</strong><\p> <p class=\"alignright\">"+country_data.HDI+"</p>");
            country_tip.attr('display', 'block');
            blink_country(country_data);
        }
    }
    function track_tip(country_data) {
        if(different_rank(country_data, rank_diff_threshold)) {
            var py = d3.event.pageY;
            var px = d3.event.pageX;
            country_tip.style('top', (py+1) + 'px');
            country_tip.style('left', (px+7) + 'px');
        }
    }
    function hide_tip(country_data) {
        if(different_rank(country_data, rank_diff_threshold)) {
            country_tip.style('display', 'none');
            unblink_country(country_data);
        }
    }

    // Function to hightlight a portion of a slope plot (an svg object)
    // Function to draw a slope plot of all countries in a year
    function drawSlopPlot(chart_svg, gdp_data) {
        // Remove circles and lines of previous year's slope plot 
        chart_svg.selectAll("line").remove();
        chart_svg.selectAll("circle.left_circle").remove();
        chart_svg.selectAll("circle.right_circle").remove();
        
        // Draw the lines
        var lines = chart_svg.selectAll("line")
            .data(gdp_data, key_country_year);
        lines.enter()
            .append("line")
            .attr("x1", left_x)
            .attr("y1", left_y)
            .attr("x2", right_x)
            .attr("y2", right_y) 
            .attr("stroke", slope_color)
//            .attr("opacity", slope_opacity)
            .attr("opacity", 0)
            .attr("stroke-width", slope_width)
		    .attr("z-index", slope_zindex)
            .on('mouseover', show_tip)
            .on('mouseout', hide_tip)
            .on('mousemove', track_tip);
        
        // Draw circles on the left; the represent GDP rankings
        var left_circles = chart_svg.selectAll("circle.left_circle")
            .data(gdp_data, key_country_year);
        left_circles.enter()
            .append("circle")
            .attr('class', 'left_circle')
            .attr("cx", left_x)
            .attr("cy", left_y)
            .attr("fill", circle_color)
            .attr("opacity", 0)
            .attr("r", circle_radius)
		    .attr("z-index", circle_zindex)
            .on('mouseover', show_tip)
            .on('mouseout', hide_tip)
            .on('mousemove', track_tip);
        
        // Draw circles on the right; they representing HDI rankings
        var right_circles = chart_svg.selectAll("circle.right_circle")
            .data(gdp_data, key_country_year);
        right_circles.enter()
            .append("circle")
            .attr('class', 'right_circle')
            .attr("cx", right_x)
            .attr("cy", right_y)
            .attr("fill", circle_color)
            .attr("opacity", 0)
            .attr("r", circle_radius)
		    .attr("z-index", circle_zindex)
            .on('mouseover', show_tip)
            .on('mouseout', hide_tip)
            .on('mousemove', track_tip);
    }

    function highlightSlopes(chart_svg, sdata) {
        // Show lines and circles for the selected countries and make them
        // react to mouse events. Fade others make make them non-reactive
        var lines = chart_svg.selectAll("line")
            .data(sdata, key_country_year)
            .attr("opacity", slope_opacity)
            .attr('pointer-events', "all");
        lines.exit()
            .attr("opacity", 0)          // faded and non-reactive
            .attr('pointer-events', "none");

        var left_circles = chart_svg.selectAll("circle.left_circle")
            .data(sdata, key_country_year)
            .attr("opacity", 1)            // shown and reactive
            .attr('pointer-events', "all");
        left_circles.exit()
            .attr("opacity", 0)          // faded and non-reactive
            .attr('pointer-events', "none"); 

        var right_circles = chart_svg.selectAll("circle.right_circle")
            .data(sdata, key_country_year)
            .attr("opacity", 1)            // shown and reactive
            .attr('pointer-events', "all");
        right_circles.exit()
            .attr("opacity", 0)          // faded and non-reactive
            .attr('pointer-events', "none"); 
    }


    // Function to highlight slope lines of all countries in a region
    function highlightYearRegion(year, region, gdp_data) {
		var filtered_data = filterAndSort(year, region, gdp_data);		
        writeCaption(year, region);
        highlightSlopes(chart_svg, filtered_data);
        highlightMap(map_svg, filtered_data);
		highlightLegend(year, region, filtered_data);
    }

    // Function to display select options to pick a region to highlight
    function showRegionOptions(regions) {
        var select_elem = d3.select("#sidebar .region_select");
        select_elem.selectAll("option").remove();
        
        var option_values = [''].concat(regions);
        var region_options = select_elem.selectAll("option")
            .data(option_values, key_all);
        region_options.enter().append("option")
            .attr("value", function(d) {return d;})
            .text(function(d) {return (d=='') ? "All" : d;})
            .attr("style", function(d) {
                return "color:"+region_color_scale(d);
            })
            .each(function (d) {
                if(d=='') {
                    d3.select(this).attr("selected", "selected");
                }
            });
        select_elem.style('display', 'block');
        // handle on click event
        select_elem.on('change', function() {
            current_region = d3.select(this).property('value');
            highlightYearRegion(current_year, current_region, gdp_data);
        });
    }

	// Function to write the caption for the slope chart
    function writeCaption(year, region) {
        // Display titile and caption
        //var caption_elem = d3.select("#chart_caption")
        var region_caption;
        if(is_missing(region)) {
            region_caption = "all World Regions";
        } else {
            region_caption = "<span style=\"color:"+region_color_scale(region)+
				"\">"+region+"</span>";
        }
        var year_caption;
        if(is_missing(year)) {
            year_caption = " from "+years[0]+" to "+years[years.length-1];
        } else {
            year_caption = " in "+year;
        }
		return "Countries in "+region_caption+" "+year_caption;
        //caption_elem.html();
    }

/*
    // Function to visualize yearly data on a slope plot and a world map
    function draw_yearly_data(year, gdp_data) {
        // List all regions in order of how ranks differ
		current_region = '';
		
		// Write the caption for the slope chart
        writeCaption(year, current_region);

        // Draw slope plot for the current year
        drawSlopPlot(chart_svg, gdp_data);

        // Highlight the countries on the map
        highlightMap(map_svg, gdp_data);

        // Highlight country legend
        highlightLegend(current_region, gdp_data);
    }
*/
	
    // Function to display a drop down list to select a year
    function showYearOptions(years) {
        var select_elem = d3.select("#sidebar .year_select")
        select_elem.selectAll("option").remove();
        
        var option_values = [NaN].concat(years);
        var year_options = select_elem.selectAll("option")
            .data(option_values, key_all);
        year_options.enter().append("option")
            .attr("value", function(d) {return d;})
            .text(function(d) {return isNaN(d) ? "All" : d;});

        select_elem.style('display', 'block');
        // handle on click event
        select_elem.on('change', function() {
            current_year = +d3.select(this).property('value');
            highlightYearRegion(current_year, current_region, gdp_data);
        });
    }

    function selectYear(year) {
        var select_elem = d3.select("#sidebar .year_select")
        select_elem.selectAll("option").each(function (d) {
            if((isNaN(d)&&isNaN(year)) || (d == year)) {
                current_year = year;
                d3.select(this).attr("selected", "selected");
            }
        });
    }

    // Function to filter and sort gdp data based on year and rank
    function filterAndSort(year, region, gdp_data) {
        // Select data corresponding to a year and region, and sort
        // into two groups - one group with uneven GDP/HDI rankings,
        // and one with similar rankings
        var filtered_data = gdp_data.filter(function(d) {
            return (is_missing(year) || (d['Year']=='All') ||
                    (d['Year']===year)) &&
                (is_missing(region) || (d['All'] === region) ||
                 (d['Region'] === region));
        });
        filtered_data.sort(function(a, b) {
            if(different_rank(a, rank_diff_threshold)) {
                return 1;
            } else {
                return 0;
            } 
        });
        return filtered_data;
    }

    // Draw slope plots of the entire data but keep them invisible
    drawSlopPlot(chart_svg, gdp_data);
	
    // Take care of the right side bar
    d3.json("world_countries.json", drawMap); // World map
    showYearOptions(years);                       // Year options
    showRegionOptions(regions);                   // Region options

    // Animate slope plots over the years, ending with all years
    var year_idx = 0;
	var region = '';
    var year_interval = setInterval(function() {
        var year = years[year_idx];
        selectYear(year);

        //draw_yearly_data(year, yearly_data);
		highlightYearRegion(year, region, gdp_data);
        year_idx++;
        if(year_idx >= years.length) {
            // At the end of animation, plot all years at once, and
            // provide options to highligt any year and drill down
            clearInterval(year_interval);
            year = NaN;
            selectYear(year);
            //draw_yearly_data(year, yearly_data);
			highlightYearRegion(year, region, gdp_data);			
        }
    }, 1000);
};
