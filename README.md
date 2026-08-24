<img width="1383" height="853" alt="image" src="https://github.com/user-attachments/assets/6238c642-9486-44d1-a65b-e27f21198ce4" />
Overview of the Streetnames by Elo map in Europe. Data by EloEverything. Background map by OpenStreetMap Contributors. 


Streetnames by Elo is an interactive map that combines the rankings from EloEverything.co with street name etymology data from OpenStreetMap. 
On EloEverything, users are asked to vote for the better of two things out of a selection of over 9000 "things". The votes get compiled in an [Elo system](https://en.wikipedia.org/wiki/Elo_rating_system) to produce a ranking of those thousands of "things" in "goodness", ranging from water to the Holocaust. Users can submit "things" to rank, based on English language Wikipedia pages. 
On OpenStreetMap, features like roads can be tagged with name:etymology:wikidata tags to link the geographic features with the wikidata object that is the origin of the (street) name. 
This project uses the tight linking between Wikipedia pages and wikidata objects to combine street name etymology sources with their respective Elo ranking. 



## Why?
I find it interesting to see how different cultures use their street names to honor different people, places and concepts. While some countries have a high number of streets named after Soviet war heroes, other areas have a surprisingly large number of themed neighborhoods where every street is named after musical instruments, salad ingredients, or big tech companies. Of course, using the ranking data from EloEverything shows the (presumably Western) bias of their voters, but that in itself is also culturally interesting. It is also interesting to see the relationship between said western bias and western street names, which presumably emerged from the same cultural context. In Italy, with its generally highly ranked street name origins,  streets named after September 11th 2001 stand out. In the UK, a lot of deep red dots on the map are caused by streets named after former Prince Andrew, presumably before the public opinion on him has shifted. And some naming origins are just weird: In Berlin, there is a street named Kopfstraße (head street). According to the folklore, the person responsible for the naming had to think so hard about what he should name the street that it caused him a headache, leading to this uncommon street name. As you can imagine, headaches are not ranked very highly on EloEverything. 
I hope you're having fun exploring this niche aspect of our world!
While OpenStreetMap data and arguably also EloEverything rankings can be valuable in sociological research, this tool was made for fun and out of curiosity, without any scientific basis. There are many biases that I do not account for. For example, [someone added the name etymology wikidata information to all streets named after Martin Luther King Junior on OpenStreetMap](https://www.openstreetmap.org/changeset/57976724), leading to an overrepresentation of the highly rated civil rights activist in America, where most regions lack widespread etymology data. Aside from having fun and exploring the map, I want to use it to encourage people to contribute to it by adding etymology tags to OpenStreetMap, especially in those underrepresented areas. This will not only fill up the map and make it more colourful, but also help make the data set even more valuable for those who are in the position to do actual research in that area.  

## How?
I manually copy the ranking from EloEverything from the web browser to comply with their usage terms and parsed the resulting HTML with a small Python script, compiling the "things", their Elo scores and number of votes in a CSV file. I then use a second script to query the Wikipedia api to get the Wikidata QIDs for each item. For each subsequent run, only new QIDs are fetched. For "things" that appear several times in the list, I take the ranking with more votes. For example, at the time of writing this, "Rome, Italy" has 1599 votes with an Elo score of 1370, while just "Rome" has 43 votes with a score of 1354. In that case, I assign the ranking of 1370 to any street named after the city of Rome because that score has more votes behind it. 

Next, I query OpenStreetMap via the Overpass API to find all streets with name etymology data: 

```
[out:json][timeout:25000];
way["highway"]["highway"!="bus_stop"]["name"]["name:etymology:wikidata"]({bbox});out geom;
```

The resulting map data gets processed further, removing any highway objects that are rest areas, public transport platforms, elevators or other non street objects that fit the highway tagging scheme. It then gets merged with the Elo scores, removing any tags that are not required for displaying on the website to cut down the file size. The resulting geoJSON file gets converted into a PMTiles map tile file and uploaded to Cloudflare R2, which I use as a tile server for this purpose. 

The website itself uses Leaflet with a desaturated version of OpenStreetMap tiles as a background layer to make sure the colourful streets are well visible. 

## What can I do if my favorite street is not displayed on the map?
That can have several reasons: 
1. The name:etymology:wikidata is not tagged in OpenStreetMap
Global coverage of this tag varies greatly between regions and countries. Please check if they exist in your area and add them if they don't. Some streets are mapped as several connected segments instead of just one OpenStreetMap object, so make sure to apply this change to all segments of the road at once! 
2. The "thing" is not being ranked on EloEverything
In that case, you can click "Add Item" in the top right of EloEverything.co and add it yourself for others to vote on. 
3. There is a mismatch in QIDs between what I get from the Wikipedia API and the OpenStreetMap etymology wikidata tag
This can happen with ambiguous concepts. For example, when querying Wikipedia for the Wikidata Object ID for "chinchilla", the result is [Q192930](https://www.wikidata.org/wiki/Q192930), referring to the genus of the animal, while Chinchillaweg (Chinchilla way) in Berlin, Germany is tagged with [Q650915](https://www.wikidata.org/wiki/Q650915), which refers to the family. Similar ambiguities can occur if it is unclear if some street is named after a city or a district with the same name, or in the case of the several Google streets, where it is not entirely clear if they are named after the company or the search engine. 
In those cases, I need to manually add the additional Wikidata ID to the list. Please notify me by opening an issue if you find such a case where both the name:etymology:wikidata tag exists on OpenStreetMap and the concept has a ranking on EloEverything. 
4. Multiple values
Some streets are named after several Wikidata items, for example Marie and Pierre Curie. These are not yet supported. If you have any suggestions of how I can make that work visually, please let me know! 


I semi-regularly update the data manually, so every few weeks, your changes to OpenStreetMap or EloEverything will be updated to the map. The current dataset is from 24.08.2026. 

## Known issues or future feature ideas
- Missing support for multiple values in the name:etymology:wikidata tag
- It might be fun to have additional filters, maybe based on the Wikidata categories? "Show only roads named after historical military people"? I'm open to suggestions. 

## Where to start contributing?
When gathering the data for this project from OpenStreetMap, I found two distinct areas of low hanging fruit when contributing name:etymology:wikidata tags to OpenStreetMap: 
- Scandinavia: In direct comparison to other European countries, especially bordering Denmark, there are barely any of these tags in Sweden, Norway and Finland. I therefore created a [MapRoulette challenge](https://maproulette.org/browse/projects/63009) for people to add these tags in an organized fashion. 
- Manila and surrounding area: In that area, a lot of housing has been built in larger developments, leading to a wealth of themed areas: There are areas named after big tech companies, metals and minerals, days of the week, or characters from the Bible. The list is endless. I have not made a MapRoulette challenge for Manila, but I encourage everyone to have a look and see if they find an area they would like to contribute to. 
<img width="1400" height="700" alt="Progress24 8 26" src="https://github.com/user-attachments/assets/144b40eb-b532-46c0-b669-c37ddd9d62fc" />
Distribution of etymology data on OpenStreetMap over time since working on the project


## Thank you!

Thank you to  EloEverything for the kind support and letting me use the data and to FairwayMapper for supplying me with an Overpass server that can handle querying all the named streets with their etymology tags. 


