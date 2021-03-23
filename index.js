const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');
const countrieslist = require('countries-list');
const countrynames = require('countrynames');

// GLOBALS

const dataPapers = require('./json/papers_uist.json');
const dataCommittees = require('./json/committees_uist.json');

const outputFile = path.join('out', 'dataset.json');
const startYear = 10;
const endYear = 20;

// HELPERS

function getFrequencyCount(dataset) {
  const unique = [...new Set(dataset)];

  const result = unique.map((c) => ({
    value: c,
    occurrences: dataset.filter((cnt) => cnt == c).length,
  }));
  return result;
}

// CONTINENT

// a function limited to match countries for the current dataset
function getContinent(country) {
  return countrieslist.countries[country].continent;
}

function getContinentList(data) {
  return data.map((c) => getContinent(c));
}

// COLLABORATIONS

function getCollaborations(papers) {
  const countryList = papers.map(({ country }) => country);

  const intlCollaborations = countryList.filter((l) => l.length > 1).length;
  let intcontinentCollaborations = 0;

  countryList.forEach((cl) => {
    const continentList = cl.map((country) => getContinent(countrinize(country)));
    const continents = [...new Set(continentList)];
    if (continents.length > 1) intcontinentCollaborations += 1;
  });

  return {
    international: intlCollaborations,
    interContinental: intcontinentCollaborations,
  };
}

// COUNTRIES

// Some affiliations are not countries
// These have to be corrected
function countrinize(countryName) {
  const inputCountry = countryName.toLowerCase();
  let country = '';

  switch (inputCountry) {
    case 'adobe research': country = 'united states'; break;
    case 'adobe': country = 'united states'; break;
    case 'apple': country = 'united states'; break;
    case 'autodesk research': country = 'united states'; break;
    case 'berkeley': country = 'united states'; break;
    case 'boston university': country = 'united states'; break;
    case 'carleton university': country = 'canada'; break;
    case 'carleton univesrity': country = 'canada'; break;
    case 'carnegie mellon university': country = 'united states'; break;
    case 'columbia university': country = 'united states'; break;
    case 'cornell university': country = 'united states'; break;
    case 'czech rep': country = 'czech republic'; break;
    case 'eth zurich': country = 'switzerland'; break;
    case 'fxpal': country = 'united states'; break;
    case 'google research': country = 'united states'; break;
    case 'google': country = 'united states'; break;
    case 'harvard university': country = 'united states'; break;
    case 'hasso plattner institute': country = 'germany'; break;
    case 'hong kong': country = 'china'; break; // papers indicate both "china" and "hong kong" as countrybreak;
    case 'inria': country = 'france'; break;
    case 'jst erato igarashi design interface project and the university of tokyo': country = 'japan'; break;
    case 'jst erato igarashi design interface project and university of tsukuba': country = 'japan'; break;
    case 'jst erato igarashi design interface project': country = 'japan'; break;
    case 'kaist': country = 'korea'; break;
    case 'keio university': country = 'japan'; break;
    case 'los angeles': country = 'united states'; break;
    case 'massachusetts institute of technology': country = 'united states'; break;
    case 'microsoft research': country = 'united states'; break;
    case 'microsoft': country = 'united states'; break;
    case 'mishmashmakers': country = 'canada'; break;
    case 'republic of korea': country = 'korea'; break;
    case 'rebublic of korea': country = 'korea'; break;
    case 'republic of': country = 'korea'; break;
    case 'san diego': country = 'united states'; break;
    case 'simon fraser university': country = 'canada'; break;
    case 'simon frasier university': country = 'canada'; break;
    case 'south korea': country = 'korea'; break;
    case 'stanford university': country = 'united states'; break;
    case 'taiwan roc': country = 'taiwan'; break;
    case 'the university of tokyo': country = 'japan'; break;
    case 'uae': country = 'united arab emirates'; break;
    case 'uk': country = 'united kingdom'; break;
    case 'universitá paris-sud': country = 'france'; break;
    case 'university college london': country = 'united kingdom'; break;
    case 'university of bristol': country = 'united kingdom'; break;
    case 'university of british columbia': country = 'canada'; break;
    case 'university of colorado at boulder': country = 'united states'; break;
    case 'university of illinois-urbana champaign': country = 'united states'; break;
    case 'university of michigan': country = 'united states'; break;
    case 'university of st. andrews': country = 'united kingdom'; break;
    case 'university of stuttgart': country = 'germany'; break;
    case 'university of tokyo': country = 'japan'; break;
    case 'university of toronto': country = 'canada'; break;
    case 'usa': country = 'united states'; break;
    case 'york university': country = 'united kingdom'; break;
    case 'zurich': country = 'switzerland'; break;
    default: country = inputCountry; // no changes, keep the country name
  }

  return countrynames.getCode(country);
}

// get countries and normalize the data and return them in a single list
function getCountryListFlat(data) {
  let countryList = data.map(({ country }) => country);
  // if it is a list of lists, reduce to a single list
  if (typeof countryList[0] === 'object') {
    countryList = countryList.reduce((p, e) => [...p, ...e], []);
  }
  // make sure the countries are valid and return them
  return countryList.map((c) => countrinize(c));
}

function getGeoStats(papers) {
  const country = getCountryListFlat(papers);
  const continent = getContinentList(country);

  const freqCountry = getFrequencyCount(country);
  const freqContinent = getFrequencyCount(continent);

  return {
    country: freqCountry.length,
    continent: freqContinent.length,
    countryList: freqCountry,
    continentList: freqContinent,
  };
}

function getSummary(year, dataPapers, dataCommittees) {
  const proceedings = `uist${year}`;
  const { papers } = dataPapers.find(({ proceedings: proc }) => proc.includes(year));
  const committee = dataCommittees.find(({ proceedings: proc }) => proc.includes(year)).people;

  const statsPapers = getGeoStats(papers);
  const statsCommittees = getGeoStats(committee);

  const collaborationStats = getCollaborations(papers);

  // modify the statsPaper to add continent for each country
  statsPapers.countryList.forEach((e) => {
    e.continent = getContinent(e.value);
  });

  const result = {
    year,
    proceedings,
    totPapers: papers.length,
    papers: statsPapers,
    committee: statsCommittees,
    collaborations: collaborationStats,
  };
  return result;
}

// Main

const years = _.range(startYear, endYear + 1);

// Analyze paper data

const all = [];
for (const year of years) {
  const s = getSummary(year, dataPapers, dataCommittees);
  all.push(s);
}

// console.log(all);
console.log(`Writing output to - > ${outputFile}`);
fs.writeFile(outputFile, JSON.stringify(all), (err) => {
  if (err) return console.log(err);
});
