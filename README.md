# Miner

Script that takes as input the data from [Scraper](https://github.com/geo-conf/scraper) and the details about the committees (see _JSON_ folder) and uses them to produce an aggregated _json_ file containing the details about the global outreach of a conference (_out/dataset.json_). Country and continent names are saved following the [ISO3166](https://www.iso.org/iso-3166-country-codes.html) standard.

The aggregated output is then pushed via a custom Github action to geo-dataset.

## Run the script
```
npm install
npm run miner
```
