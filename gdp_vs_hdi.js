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
    // Explanations
    var chart_margin = {top: 0, bottom: 20, left: 50, right: 50},
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
        return left_scale(d[left_indicator]);
    }
    var right_x = chart_margin.left+chart_width;
    function right_y(d) {
        return right_scale(d[right_indicator]);
    }
    function different_rank(d) {
        var diff_threshold = rank_diff_threshold;
        var rank_diff = d['HDI']-d['GDP'];
        var is_different = (rank_diff < -1 * diff_threshold) ||
            (rank_diff > diff_threshold);
        return is_different;
    }
    function circle_color(d) {
        var color = neutral_color;
        if(different_rank(d)) {
            if (d['GDP'] > d['HDI']) {
                color = gdp_color;
            } else if (d['GDP'] < d['HDI']) {
                color = hdi_color;
            }
        } 
        return color;              
    }
    function circle_zindex(d) {
        return different_rank(d) ? -1 : 2;
    }
    function slope_zindex(d) {
        return different_rank(d) ? -1 : 1;              
    }
    function slope_width(d) {
        return different_rank(d) ? 2 : 1;
    }
    function slope_color(d) {
        return region_color_scale(d['Region']);
    }
    function slope_opacity(d) {
        return different_rank(d) ? 1.0 : 0.2;
    }
    function circle_radius(d) {
        return different_rank(d) ? '6px' : '3px';
    }
    function region_color(d) {
        var color = "lightBlue";
        if(ccode_to_region.has(d.id)) {
            color = region_color_scale(ccode_to_region.get(d.id));
        }
        return color;
    }

    // Function to explain high or low GDP in a region
    function explainRegion(hi_gdp, region) {
        var explanation = "They are ?";
        if(region=='') {
            if(hi_gdp) {
                explanation = "They are rich in diamond or oil and can achieve high GDP without human productivity.";
            } else {
                explanation = "They were formerly part of larger republics and inherited good literacy rates.";
            }
        } else if(region.match("Sub-Saharan Africa")) {
            if(hi_gdp) {
                explanation = "They are rich in diamond and can achieve high GDP without human productivity.";
            }
        } else if(region.match("Middle East")) {
            if(hi_gdp) {            
                explanation = "They are rich in oil and can achieve high GDP without human productivity.";
            }
        } else if(region.match("Europe")) {
            if(!hi_gdp) {
                explanation = "They were formerly part of larger republics and inherited good literacy rates.";
            } 
        } else if(region.match("East Asia")) {
            ;
        } else if(region.match("South Asia")) {
            if(hi_gdp) {
                explanation = "The economy of this island country, Maldives, is dominated by tourism and fishing, and is less dependent on human productivity."
            }
        } else if(region.match("Latin America")) {
            ;
        } else if(region.match("North America")) {
            ;
        }
        return explanation;
    }
    function explainCountry(hi_gdp, ccode) {
        var region = ccode_to_region.has(ccode) ? ccode_to_region.get(ccode) :
            '';
        var explanation = "They are ?";
        if(region=='') {
            if(hi_gdp) {
                explanation = "They are rich in diamond or oil and can achieve high GDP without human productivity.";
            } else {
                explanation = "They were formerly part of larger republics and inherited good literacy rates.";
            }
        } else if(region.match("Sub-Saharan Africa")) {
            if(hi_gdp) {
                if(ccode=='GAB') {
                    explanation = "Rich in oil";
                } else {
                    explanation = "Rich in diamond";
                }
            }
        } else if(region.match("Middle East")) {
            if(hi_gdp) {            
                if(ccode=='DJI') {
                    explanation = "Strategic port on Red Sea";
                } else {
                    explanation = "Rich in oil";
                }
            }
        } else if(region.match("Europe")) {
            if(!hi_gdp) {
                explanation = "Former republic";
            } 
        } else if(region.match("East Asia")) {
            ;
        } else if(region.match("South Asia")) {
            if(hi_gdp) {
                explanation = "Tourism"
            }
        } else if(region.match("Latin America")) {
            ;
        } else if(region.match("North America")) {
            ;
        }
        return explanation;
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
        var ccodesBright = [], ccodesFade = [];
        gdp_data.forEach(function(d) {
            var ccode = d['Country_Code'];
            if(different_rank(d)) {
                ccodesBright.push(ccode);
            } else {
                ccodesFade.push(ccode);
            } 
        }); 
        map_svg.selectAll('path')
            .attr('opacity', function(d) {
                return (ccodesBright.indexOf(d.id) !== -1) ? 1
                    : (ccodesFade.indexOf(d.id) !== -1) ? 0.2 : 0;
            });
    }
    
    function countryText(count) {
        if(count==0) {
            return "No countries have";
        } else if (count==1) {
            return "Only 1 country has";
        } else {
            return count+" countries have";            
        }
    }
    
    // Function to highlight the countries in gdp_data on the map
    function highlightLegend(year, region, filtered_data) {
        var gcountries = groupCountries(filtered_data);
        var hi_gdp = gcountries.hi_gdp.length;
        var lo_gdp = gcountries.lo_gdp.length;
        var eq_gdp = gcountries.eq_gdp.length;

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
                .attr("width", 40);
            var legend_txt = "";
            if((hi_gdp==0) && (lo_gdp==0)) {
                legend_txt += "All ";
            }
            legend_txt += countryText(eq_gdp);
            legend_txt += " similar GDP and HDI ranks.";
            legend_txt += "They are able to use national income to nurture their people, and engage their people to improve their economy.";
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
                .html(legend_txt)
                .append('br')
                .append('br');            
        }
        if(hi_gdp > 0) {
            var hi_svg = fieldSet.append('svg')
                .attr("height", 24)
                .attr("width", 40);
            var legend_txt = countryText(hi_gdp);
            legend_txt += " much higher GDP than HDI ranks. ";
            legend_txt += explainRegion(true, region);
            hi_svg.append('line')
                .attr("x1", 6)
                .attr("y1", 6)
                .attr("x2", 30)
                .attr("y2", 20)
                .attr("opacity", 0.2)
                .attr("stroke-width", 1)
                .attr("stroke", line_color);
            hi_svg.append('circle')
                .attr("cx", 6)
                .attr("cy", 6)
                .attr("r", 4)
                .attr("fill", gdp_color);
            hi_svg.append('circle')
                .attr("cx", 30)
                .attr("cy", 20)
                .attr("r", 4)
                .attr("fill", gdp_color);
            fieldSet.append("span")
                .html(legend_txt)
                .append('br')
                .append('br');            
        }
        if(lo_gdp > 0) {
            var lo_svg = fieldSet.append('svg')
                .attr("height", 24)
                .attr("width", 40);
            var legend_txt = countryText(lo_gdp);
            legend_txt += " much lower HDI than GDP ranks. ";
            legend_txt += explainRegion(false, region);
            lo_svg.append('line')
                .attr("x1", 6)
                .attr("y1", 20)
                .attr("x2", 30)
                .attr("y2", 6)
                .attr("opacity", 0.2)
                .attr("stroke-width", 1)
                .attr("stroke", line_color);
            lo_svg.append('circle')
                .attr("cx", 6)
                .attr("cy", 20)
                .attr("r", 4)
                .attr("fill", hdi_color);
            lo_svg.append('circle')
                .attr("cx", 30)
                .attr("cy", 6)
                .attr("r", 4)
                .attr("fill", hdi_color);
            fieldSet.append("span")
                .html(legend_txt)
                .append('br')
                .append('br');            
        }
    }
    
    // Function to blink the slopes and maps for a country. 
    function blinkCountry(country_data) {
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
    function unblinkCountry(country_data) {
        var ccode = country_data["Country_Code"];
        chart_svg.selectAll("line")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', slope_opacity);
        chart_svg.selectAll("circle.left_circle")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', 1);
        chart_svg.selectAll("circle.right_circle")
            .data([country_data], key_country_year)
            .transition().duration(100)
            .attr('opacity', 1);
        map_svg.select('path#'+ccode)
            .transition().duration(100)
            .attr('opacity', function(d) {
                var opac = different_rank(country_data) ? 1 : 0.2;
                return opac;
            });
    }
    
    // Create a DOM element for displaying tool tips for a country on hover, and
    // and functions for showing, tracking, and hiding the tips
    var country_tip = d3.select("body #wrap #main .tooltip");
    var tip_table = country_tip.select("table");
    var country_field = tip_table.select("#country_field");
    var region_field = tip_table.select("#region_field");
    var gdp_field = tip_table.select("#gdp_field");
    var hdi_field = tip_table.select("#hdi_field");
    debugger;
    
    // Functions to display, track, and hide country tip on hover
    function showTip(country_data) {
        country_field.html(country_data.Country_Name);
        region_field.html(country_data.Region)
            .style('color', slope_color(country_data));;
        gdp_field.html("GDP: "+country_data.GDP);        
        hdi_field.html("HDI: "+country_data.HDI);
        debugger;
        if(different_rank(country_data)) {
            var ctext = explainCountry(
                country_data['GDP']>country_data['HDI'],
                country_data.Country_Code);
            country_tip.attr('info-tip', ctext)
                .style('border-bottom',
                       '30px solid'+circle_color(country_data));
        } else {
            country_tip.attr('info-tip',null)
                .style('border-bottom', 'none');                        
        }        
        country_tip
            .style('box-shadow', '0 0 10px'+slope_color(country_data))
            .style('display', 'block');
        blinkCountry(country_data);
    }
    function trackTip(country_data) {
        var py = d3.event.pageY;
        var px = d3.event.pageX;
        country_tip.style('top', (py+1) + 'px');
        country_tip.style('left', (px+7) + 'px');
    }
    function hideTip(country_data) {
        country_tip.style('display', 'none');
        unblinkCountry(country_data);
    }

    // Function to hightlight a portion of a slope plot (an svg object)
    // Function to draw a slope plot of all countries in a year
    function prepareSlopPlot(chart_svg, gdp_data) {
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
            .attr("opacity", 0)
            .attr("stroke-width", slope_width)
            .attr("z-index", slope_zindex)
            .on('mouseover', showTip)
            .on('mouseout', hideTip)
            .on('mousemove', trackTip);
        
        // Draw circles on the left to represent GDP rankings
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
            .on('mouseover', showTip)
            .on('mouseout', hideTip)
            .on('mousemove', trackTip);
        
        // Draw circles on the right to represent HDI rankings
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
            .on('mouseover', showTip)
            .on('mouseout', hideTip)
            .on('mousemove', trackTip);
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
        var filtered_data = filterBy(year, region, gdp_data);
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

    // Function to sort data into two groups - one group with uneven
    // GDP/HDI rankings, and one with similar rankings. 
    function sortByRankDifference(gdp_data) {
        gdp_data.sort(function(a, b) {
            if(different_rank(a)) {
                return 1;
            } else {
                return 0;
            } 
        });
    }

    // Function to classify countries in 3 groups; higher GDP ), lower
    // GDP, and similar GDP compared to HDI rank
    function groupCountries(gdp_data) {
        var hi_countries = [], lo_countries=[], eq_countries = [];
        gdp_data.forEach(function(d) {
            var region = d['Region'];
            var ccode = d['Country_Code'];            
            if(is_missing(region)) {
                ;
            } else if(different_rank(d)) {
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
        return {hi_gdp: hi_countries,
                lo_gdp: lo_countries,
                eq_gdp: eq_countries};
    }

    // Function to filter and sort gdp data based on year and rank
    function filterBy(year, region, gdp_data) {
        var filtered_data = gdp_data.filter(function(d) {
            return (is_missing(year) || (d['Year']=='All') ||
                    (d['Year']===year)) &&
                (is_missing(region) || (d['All'] === region) ||
                 (d['Region'] === region));
        });
        return filtered_data;
    }

    // Preprare slope plots of the entire data but keep them invisible
    sortByRankDifference(gdp_data);
    var gcountries = groupCountries(gdp_data);
    prepareSlopPlot(chart_svg, gdp_data);
    
    // Take care of the right side bar
    d3.json("world_countries.json", function(d) {
        drawMap(d); // World map
        showYearOptions(years);                      // Year options
        showRegionOptions(regions);                  // Region options

        // Animate slope plots over the years, ending with all years
        var year_idx = 0;
        var region = '';
        var year = 2005;    
        selectYear(year);
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
    });
}
