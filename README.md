## Summary ##
Since economically developed countries generally offer better living standards, modern societies have come to accept that human development is implied by economic progress. However, is this true in all parts of the world ? This is an important question for policymaking international organizations such as United Nations or World Bank. This inforgraphic visually explains the evidence in this regard gathered from publicly available data over the years. 

Economic progress is measured using Gross Domestic Product (GDP) [1], which is the total monetary value of all finished goods and services produced within a country's borders. For reliable comparison among countries over time, we use Purchasing Power Parity (PPP) adjusted per-capita GDP [2] data available from Gapminder [3]. However, can it be called progress if the GDP of a country grows at the expense of depleting natural resources, or at the expense of the overall well-being of its citizens ?

This is why United Nations Human Development Report proposes a new indicator called Human Development Index (HDI) as the criteria for assessing the development of a country [4]. Although some articles speak in favor of HDI [5], a report from Gapminder shows that GDP and HDI values are highly correlated [6, 7]. 

Even though many countries show similar GDP and HDI, there are some countries that do not follow this trend. We highlight these countries and the common factors related to the disparity between their economic progress and human developement. Instead of comparing actual values of GDP HDI, it is more revealing to rank the countries according to their GDP and HDI values and compare the ranks. Although most countries show good correlation between their GDP and HDI ranks, countries in 4 specific regions of the world show sharply different GDP and HDI rankings. The effects are observed in both directions:

* Several countries in middle east and north Africa, south Asia, and sub-Saharian Africa show good GDP rank but poor HDI rank. Some of these countries are rich in  oil (e.g. Kuwait in middle east or Gabon in Africa) or diamond (e.g. Namibia and South Africa) and can achieve high GDP without significant contribution from their people. However, the north African coastal country Djibouti and south Asian island country Maldives probably have different reasons for high GDP and low HDI.

* Several countries in Europe and central Asia show poor GDP ranks and good HDI ranks. Some of these countries were formerly part of the Soviet Republic (e.g. Georgia, Ukraine, Tajikistan, and Moldova) or Yugoslavia (e.g. Serbia, and Montenegro); so they started with good literacy rate and are probably still working toward mature economic systems. 

## Design ##
The charts show the relationship beteen time-series data of two sets of ordered variables, GDP rankings and HDI rankings. Although often scatter plots are best for visualizing correlation, and line charts are for time-series data, we decided to use a different chart type for the following two reasons. First, we want to examine the miscorrelations in both directions, i.e. when GDP is high and HDI is low or when GDP is high and HDI is low, and put them in geographic context. Slope plots seemed like a good idea for comparison of ordinal data (rank order), and maps for geographical context of nominal data (countries and regions). To visualizing time series data, individual years are displayed as frames and animated with the progression of time. Finally, drop-down lists [11], hovering, and highlighting are provided to explore and drill down the data by individually selecting each year, and by individually highlighting each geographical region, and each country.

## Feedback ##

Questions asked

 * What do you notice in the visualization?
 * What questions do you have about the data?
 * What relationships do you notice?
 * What do you think is the main takeaway from this visualization?
 * Is there something you don’t understand in the graphic?

Feedback 1

 * Your visualization is beautiful, and your point is interesting. Just some suggestions:

 * You could include a link to an explanation of what is GDP and HDI
Would be nice see which countries are connected to the blue lines. I am not sure if tooltips when mouse over the lines would be appropriate here, but it is an option
 * Maybe the "Click a country to highlight" filter isn't working properly. I attempted to select "Australia" in 2011, and it didn't highlight any line. If you don't have data for a particular year/country, would be better indicate it somewhere

Feedback 2

Feedback 3


## Resources ##
[[1] Gross Domestic Product - GDP](http://www.investopedia.com/terms/g/gdp.asp)

[[2] Gross Domestic Product](https://en.wikipedia.org/wiki/Gross_domestic_product)

[[3] Per capita Gross Domestic Product (GDP) data from Gapminder](http://spreadsheets.google.com/pub?key=0AkBd6lyS3EmpdHo5S0J6ekhVOF9QaVhod05QSGV4T3c&output=xls)

[[4] United Nations Development Programme, Human Development Report](http://hdr.undp.org/en/content/human-development-index-hdi)

[[5] Gross Domestic Product vs Human Development Index](http://www.statemaster.com/article/Gross-Domestic-Product-vs-Human-Development-Index)

[[6] HDI surprisingly similar to GDP/capita](http://www.gapminder.org/news/hdi-surprisingly-similar-to-gdpcapita/)

[[7] Human Development Index (HDI) data from Gapminder](http://spreadsheets.google.com/pub?key=tyadrylIpQ1K_iHP407374Q&output=xls)

[[8] Alberto Cairo: Three steps to become a visualization/infographics designer (a Tableau version)](http://vizwiz.blogspot.com/2013/01/alberto-cairo-three-steps-to-become.html)

[[9] Slopegraphs in D3.js](http://vandykeindustries.com/slopegraphs-d3.html)

[[10] Enter, Update, Exit: An Introduction to D3.js](https://medium.com/@c_behrens/enter-update-exit-6cafc6014c36)

[[11] D3 How to change dataset based on drop down box selection](http://stackoverflow.com/questions/24193593/d3-how-to-change-dataset-based-on-drop-down-box-selection)


