import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const atlas = JSON.parse(await readFile(new URL('../public/data/atlas.json', import.meta.url), 'utf8'))

test('atlas contains the three stable case-study IDs and five benchmarks', () => {
  assert.deepEqual(atlas.cities.map((city) => city.id), ['elephant-and-castle', 'garnizon', 'hudson-yards'])
  assert.equal(atlas.benchmarks.length, 5)
})

test('urban-block and selected-room measurements retain their distinct scales', () => {
  const cities = Object.fromEntries(atlas.cities.map((city) => [city.id, city]))
  assert.deepEqual(cities['elephant-and-castle'].analysisUnits.filter((unit) => unit.analysisLevel === 'urban-block').map((unit) => unit.name), ['UB_1', 'UB_2'])
  assert.ok(cities['elephant-and-castle'].analysisUnits.some((unit) => unit.analysisLevel === 'selected-room'))
  assert.equal(cities['elephant-and-castle'].analysisUnits.find((unit) => unit.analysisLevel === 'selected-room').daylightFactor.simulation1.avgValue, '5,17%')
  assert.equal(cities['elephant-and-castle'].analysisUnits.find((unit) => unit.analysisLevel === 'selected-room').spatialDaylightAutonomy.simulation1.autonomy, 'Average sDA value is 49,54%')
  assert.equal(cities['elephant-and-castle'].analysisUnits.find((unit) => unit.analysisLevel === 'selected-room').usefulDaylightIlluminance.simulation1.avgValue, '64,09%')
  assert.equal(cities['elephant-and-castle'].siteAnalysis.urbanBlocksImage, 'ELEPHANT_AND_CASTLE_260925')
  assert.deepEqual(cities.garnizon.analysisUnits.map((unit) => unit.name), ['UB_1', 'UB_2', 'UB_3'])
  assert.equal(cities['hudson-yards'].analysisUnits[0].analysisLevel, 'selected-room')
  assert.equal(cities['hudson-yards'].analysisUnits[0].comparisonKey, 'room-300lx')
  assert.equal(cities['elephant-and-castle'].analysisUnits.find((unit) => unit.analysisLevel === 'selected-room').comparisonKey, 'room-750lx')
  assert.equal(cities['hudson-yards'].analysisUnits[0].comparisonKey, 'room-300lx')
  assert.ok(atlas.cities.filter((city) => city.id === 'garnizon').every((city) => city.analysisUnits.every((unit) => unit.analysisLevel === 'urban-block')))
})

test('five benchmark records include available site context from Arkusz 1', () => {
  const benchmarks = Object.fromEntries(atlas.benchmarks.map((benchmark) => [benchmark.id, benchmark]))
  assert.equal(benchmarks.kronsberg.context.floorAreaRatio, 0.55)
  assert.equal(benchmarks.seestadt.context.solarEnergySpecs.annualElectricity, 19800000)
  assert.equal(benchmarks.kronsberg.context.source.sheet, 'Arkusz1')
  assert.equal(benchmarks.orestad.name, 'Ørestad')
  assert.equal(benchmarks.orestad.context.country, 'Denmark, Copenhagen')
  assert.equal(benchmarks.kronsberg.unassignedProfiles.length, 1)
  assert.equal(atlas.unassignedProfiles.length, 1)
  assert.match(atlas.unassignedProfiles[0].attributionNote, /without assigning them to a place/)
})

test('all benchmark percentage distributions are complete and sum to 100', () => {
  for (const benchmark of atlas.benchmarks) {
    const bins = benchmark.distribution.bins
    assert.ok(bins.every((bin) => Number.isFinite(bin.value) && bin.value >= 0 && bin.value <= 100))
    assert.ok(Math.abs(bins.reduce((total, bin) => total + bin.value, 0) - 100) <= 2, benchmark.name)
  }
})

test('partial input is disclosed and no invented or lorem-ipsum data is published', () => {
  assert.ok(atlas.notices.some((notice) => notice.includes('DATA_FORMA_260630')))
  assert.doesNotMatch(JSON.stringify(atlas).toLowerCase(), /lorem ipsum|example data/)
  assert.doesNotMatch(JSON.stringify(atlas), /\?rednia warto|Ni\?sze warto\?ci/)
  assert.ok(atlas.cities.every((city) => city.source.status === 'partial' && city.source.row > 0))
  assert.doesNotMatch(JSON.stringify(atlas), /\?rednia warto|Ni\?sze warto\?ci/)
})

test('every published image has source linkage and a resolved public URL', () => {
  assert.ok(Array.isArray(atlas.imageCatalog) && atlas.imageCatalog.length > 0)
  for (const city of atlas.cities) {
    assert.ok(city.imageLinks?.length > 0, city.id)
    for (const link of city.imageLinks) {
      assert.equal(link.sheet, 'Arkusz1')
      assert.match(link.sourceTempPath, /\.csv$/)
      assert.ok(link.row > 0 && link.columnLetter)
      if (link.referencedName) {
        assert.ok(link.publicUrl?.includes(`/${link.resolvedName}.PNG`))
        assert.notEqual(link.status, 'missing')
        if (link.status !== 'public-only') assert.ok(link.tempPath)
      }
    }
  }
  const elephant = atlas.cities.find((city) => city.id === 'elephant-and-castle')
  const block = elephant.analysisUnits.find((unit) => unit.name === 'UB_1')
  const model = block.imageLinks.find((link) => link.field === 'form3d')
  assert.equal(model.resolvedName, 'Elephant_and_Case_UB_1_model_3D')
  assert.match(model.aliasNote, /Known filename alias/)
})

test('every image referenced by the atlas exists in its public location folder', async () => {
  const folders = {
    'elephant-and-castle': 'ELEPHANT_AND_CASTLE',
    garnizon: 'GARNIZON',
    'hudson-yards': 'HUDSON_YARDS',
  }
  const imageKeys = new Set(['imageUrl', 'schwarzplanImage', 'model3dImage', 'plan', 'form3d', 'sunHours', 'daylightPotential', 'daylightPotential2', 'solarEnergy', 'image'])
  const references = []
  const collect = (value, folder) => {
    if (Array.isArray(value)) return value.forEach((item) => collect(item, folder))
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if ((imageKeys.has(key) || key.endsWith('Image')) && typeof child === 'string') references.push(path.resolve('public', folder, `${child}.PNG`))
      else collect(child, folder)
    }
  }
  for (const city of atlas.cities) collect(city, folders[city.id])
  const missing = []
  for (const imagePath of references) {
    try {
      await access(imagePath)
    } catch {
      missing.push(path.relative('public', imagePath))
    }
  }
  assert.deepEqual(missing, [])
})