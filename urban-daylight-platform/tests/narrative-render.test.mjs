import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformWithEsbuild } from 'vite'

const filename = path.resolve('src/components/LocationNarrative.tsx')
const source = readFileSync(filename, 'utf8')
const compiled = (await transformWithEsbuild(source, filename, { jsx: 'automatic', format: 'cjs' })).code
const componentModule = new Module(filename)
componentModule.filename = filename
componentModule.paths = Module._nodeModulePaths(path.dirname(filename))
componentModule._compile(compiled, filename)
const LocationNarrative = componentModule.exports.default
const atlas = JSON.parse(readFileSync('public/data/atlas.json', 'utf8'))

test('location narrative renders safe qualifications without editorial notices', () => {
  const html = renderToStaticMarkup(React.createElement(LocationNarrative, { narrative: atlas.cities[0].narrative }))
  assert.match(html, /approximately 9\.7 hectares/)
  assert.doesNotMatch(html, /Some material is withheld pending citation or methodology review/)
  assert.doesNotMatch(html, /Greater London Authority, 2013/)
  assert.doesNotMatch(html, /ATLASY_DANE_261107|OPISY-Main Planning Principles!C5|case study_261114\.docx|paragraph \d+/)
  assert.match(html, /should not be interpreted as exclusively vegetated green space/)
  assert.doesNotMatch(html, /citation associations have not been independently verified/)
})

test('Garnizon withholds unresolved passages and hides workbook verification details', () => {
  const html = renderToStaticMarkup(React.createElement(LocationNarrative, { narrative: atlas.cities[1].narrative }))
  assert.doesNotMatch(html, /Some material is withheld pending citation or methodology review/)
  assert.doesNotMatch(html, /The district.s energy supply is based primarily/)
  assert.doesNotMatch(html, /132 dwellings per hectare/)
  assert.match(html, /calculation boundaries should be specified/)
  assert.doesNotMatch(html, /ATLASY_DANE_261107|Garnizon -Key Characteristics|case study_261114\.docx|paragraph \d+/)
})

test('Kronsberg withholds uncited narrative without presenting source coordinates', () => {
  const html = renderToStaticMarkup(React.createElement(LocationNarrative, { narrative: atlas.cities[2].narrative }))
  assert.doesNotMatch(html, /Some material is withheld pending citation or methodology review/)
  assert.doesNotMatch(html, /Kronsberg is one of Europe/)
  assert.match(html, /Approximately 0\.7–1\.2 in documented residential zones/)
  assert.match(html, /Hannover Kronsberg Handbook/)
  assert.doesNotMatch(html, /ATLASY_DANE_261107|Kronsberg-Key characteristics|case study_261114\.docx|paragraph \d+/)
})

test('Aspern withholds citation and methodology problems without displaying source coordinates', () => {
  const html = renderToStaticMarkup(React.createElement(LocationNarrative, { narrative: atlas.cities[3].narrative }))
  assert.doesNotMatch(html, /Some material is withheld pending citation or methodology review/)
  assert.doesNotMatch(html, /Aspern Seestadt is one of Europe/)
  assert.doesNotMatch(html, /1\.02 \/ 0\.26/)
  assert.doesNotMatch(html, /ATLASY_DANE_261107|Aspern Seestadt - Key Chara|case study_261114\.docx|paragraph \d+/)
})

test('Ørestad withholds unidentified citations and spatial analysis', () => {
  const html = renderToStaticMarkup(React.createElement(LocationNarrative, { narrative: atlas.cities[4].narrative }))
  assert.doesNotMatch(html, /Some material is withheld pending citation or methodology review/)
  assert.doesNotMatch(html, /By &amp; Havn, n\.d\./)
  assert.doesNotMatch(html, /The district.s energy strategy relies primarily/)
  assert.match(html, /not be interpreted as verified completed floor area/)
  assert.doesNotMatch(html, /ATLASY_DANE_261107|Ørestad Syd - Key Characteri|case study_261114\.docx|paragraph \d+/)
})
