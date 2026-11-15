import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const atlasText = await readFile(new URL('../public/data/atlas.json', import.meta.url), 'utf8')
const atlas = JSON.parse(atlasText)
const sourceFile = 'ATLASY_DANE_261107.xlsx'

test('atlas is generated from the website workbook and all five source locations', () => {
  assert.equal(atlas.version, 2)
  assert.deepEqual(atlas.generatedFrom, [sourceFile])
  assert.equal(
    atlas.sourceWorkbook.path,
    'TEMP__TRUTH/IEA_TASK_70_ATLASY/DANE_NA_STRONE/TABELA_EXCEL/ATLASY_DANE_261107.xlsx',
  )
  assert.deepEqual(atlas.cities.map((city) => city.name), [
    'Elephant & Castle – Elephant Park',
    'Garnizon',
    'Kronsberg',
    'Aspern Seestadt',
    'Ørestad Syd',
  ])
  assert.deepEqual(atlas.benchmarks, [])
  assert.ok(!JSON.stringify(atlas).includes('hudson-yards'))
  assert.ok(!JSON.stringify(atlas).includes('.venv/TEMP'))
})

test('published data contains no retired locations, room scenarios, or legacy shading content', () => {
  assert.deepEqual(atlas.cities.map((city) => city.id), [
    'elephant-and-castle',
    'garnizon',
    'kronsberg',
    'aspern-seestadt',
    'orestad-syd',
  ])
  assert.deepEqual(atlas.benchmarks, [])
  assert.deepEqual(atlas.unassignedProfiles, [])
  assert.ok(atlas.cities.every((city) => !('shadingAnalysis' in city)))
  assert.ok(atlas.cities.every((city) => city.analysisUnits.every((unit) => (
    unit.analysisLevel === 'urban-block'
    && !('daylightFactor' in unit)
    && !('spatialDaylightAutonomy' in unit)
    && !('usefulDaylightIlluminance' in unit)
    && !('shadingAnalysis' in unit)
  ))))
  assert.doesNotMatch(atlasText, /hudson|selected.room|room.scale.simulation|shadingAnalysis/i)
})

test('workbook provenance is public without exposing unapproved narrative text', () => {
  assert.deepEqual(Object.keys(atlas.sourceWorkbook.sheets), [
    'DANE',
    'OPISY',
    'OPISY-Main Planning Principles',
    'Kronsberg-Key characteristics',
    'Aspern Seestadt - Key Chara...',
    'Garnizon -Key Characteristics',
    'Ørestad Syd - Key Characteri...',
    'Elephant Park - Key Character..',
  ])
  const elephant = atlas.cities[0]
  assert.deepEqual(elephant.source, {
    file: sourceFile,
    sheet: 'DANE',
    row: 8,
    cell: 'C8',
    status: 'source',
  })
  assert.ok(!('descriptions' in elephant))
  assert.ok(!('planningPrinciples' in elephant))
  assert.ok(!('keyCharacteristics' in elephant))
  assert.ok(atlas.sourceWorkbook.sheets.OPISY.every((row) => !('cells' in row)))
  assert.ok(atlas.sourceWorkbook.sheets['OPISY-Main Planning Principles'].every((row) => !('cells' in row)))
  assert.ok(atlas.sourceWorkbook.sheets['Elephant Park - Key Character..'].every((row) => !('cells' in row)))
  assert.doesNotMatch(JSON.stringify(atlas), /Elephant Park is a large-scale|Integrated urban regeneration and densification/)
  const block = elephant.analysisUnits.find((item) => item.name === 'UB_1')
  assert.equal(block.source.cell, 'BC8')
  assert.equal(block.sourceData.cells.BE8, 'Elephant_and_Castle_UB_model_3D')
  assert.equal(block.indicators.buildingIntensity, block.sourceData.cells.BF8)
  assert.equal(block.distributions[0].bins[0].value, block.sourceData.cells.BO8)
})

test('the excluded Garnizon UB_2 row is not exported, while its exclusion source is recorded', () => {
  const garnizon = atlas.cities.find((city) => city.name === 'Garnizon')
  assert.deepEqual(garnizon.analysisUnits.map((block) => block.name), ['UB_1', 'UB_3'])
  assert.ok(!atlas.sourceWorkbook.sheets.DANE.some((row) => row.row === 11))
  assert.deepEqual(atlas.exclusions, [{
    reason: 'Excluded by TEMP__TRUTH/IEA_TASK_70_ATLASY/NOTATKI.docx',
    source: {
      file: sourceFile,
      sheet: 'DANE',
      row: 11,
      cell: 'BC11',
    },
  }])
})

test('source distributions retain plausible percentages, band counts and rounding-aware totals', () => {
  for (const city of atlas.cities) {
    const records = [
      ...Object.values(city.siteAnalysis.sunHoursDistribution).map((data) => [data, 10]),
      [city.siteAnalysis.daylightPotentialDistribution, 9],
      ...city.analysisUnits.flatMap((unit) => [
        ...Object.values(unit.sunHoursDistribution).map((data) => [data, 10]),
        [unit.daylightPotentialDistribution, 9],
      ]),
    ]
    for (const [distribution, count] of records) {
      assert.equal(distribution.unit, '%')
      assert.equal(distribution.bins.length, count)
      const values = distribution.bins.map((bin) => bin.value)
      assert.ok(values.every((value) => value === null || (typeof value === 'number' && value >= 0 && value <= 100)))
      if (values.every((value) => value !== null)) {
        const total = values.reduce((sum, value) => sum + value, 0)
        assert.ok(Math.abs(total - 100) <= count * 0.5 + 0.001, `${city.name}: distribution total ${total}`)
      }
    }
  }
})

test('every block has workbook cell provenance for the admin view', () => {
  for (const city of atlas.cities) {
    for (const block of city.analysisUnits) {
      assert.equal(block.source.file, city.source.file)
      assert.equal(block.source.sheet, 'DANE')
      assert.equal(block.source.cell, `BC${block.source.row}`)
      assert.equal(block.source.row, block.sourceRow)
    }
  }
})

test('reported solar panel areas follow the stated coverage or remain flagged', () => {
  for (const city of atlas.cities) {
    const records = [city.siteAnalysis.solarEnergySpecs, ...city.analysisUnits.map((unit) => unit.solarEnergySpecs)]
    for (const specs of records) {
      if (!specs || specs.area === null) continue
      if (specs.panelArea === null) {
        assert.ok(specs.panelAreaWarning, `${city.name}: missing panel-area explanation`)
      } else {
        assert.ok(Math.abs(specs.panelArea - specs.area * 0.6) <= 1, `${city.name}: panel area differs from 60%`)
      }
    }
  }
})

test('confirmed model and reconciled Aspern images retain provenance; solar ambiguity remains flagged', () => {
  const elephant = atlas.cities[0]
  const block = elephant.analysisUnits.find((item) => item.name === 'UB_1')
  const model = block.imageLinks.find((link) => link.cell === 'BE8')
  assert.equal(model.referencedName, 'Elephant_and_Castle_UB_model_3D')
  assert.equal(model.resolvedName, 'Elephant_and_Case_UB_1_model_3D')
  assert.ok(model.publicUrl.endsWith('/Elephant_and_Case_UB_1_model_3D.PNG'))
  assert.ok(['present', 'copied'].includes(model.status))
  assert.match(model.aliasNote, /owner confirmed/)

  const blockSolar = Object.fromEntries(block.solarEnergySpecsSource.map((item) => [item.label, item.value]))
  assert.equal(blockSolar['area (m²)'], 9971)
  assert.equal(blockSolar['area to be covered by the panels (m²) - 60%'], 59982)
  assert.equal(block.solarEnergySpecs.panelArea, null)
  assert.match(block.solarEnergySpecs.panelAreaWarning, /DG8.*DD8/)
  assert.equal(
    block.solarEnergySpecsSource.find((item) => item.label === 'area to be covered by the panels (m²) - 60%').source.cell,
    'DG8',
  )
  assert.ok(atlas.notices.some((notice) => notice.includes('TASK-16')))

  const aspern = atlas.cities.find((city) => city.name === 'Aspern Seestadt')
  for (const cell of ['Q15', 'AL15', 'AV15']) {
    const link = aspern.imageLinks.find((item) => item.cell === cell)
    assert.ok(link)
    assert.ok(link.publicUrl.includes('/SEESTADT/'))
    assert.match(link.sourceTempPath, /KRONSBERG\/FORMA\//)
    assert.match(link.aliasNote, /matches the supplied Aspern/)
  }
  assert.deepEqual(
    atlas.imageCatalog.filter((link) => link.status === 'unresolved').map((link) => link.cell).sort(),
    [],
  )
})

test('exact approved image references resolve to public assets', async () => {
  const folders = {
    'elephant-and-castle': 'ELEPHANT_AND_CASTLE',
    garnizon: 'GARNIZON',
    kronsberg: 'KRONSBERG',
    'aspern-seestadt': 'SEESTADT',
    'orestad-syd': 'ORESTADT',
  }
  const resolved = atlas.imageCatalog.filter((link) => ['copied', 'present'].includes(link.status))
  assert.ok(resolved.length > 0)
  const expectedAssets = Object.fromEntries(
    Object.values(folders).map((folder) => [folder, []]),
  )
  for (const link of resolved) {
    if (link.cityId === 'elephant-and-castle' && link.cell === 'BE8') {
      assert.equal(link.resolvedName, 'Elephant_and_Case_UB_1_model_3D')
    } else {
      assert.equal(link.referencedName, link.resolvedName)
    }
    assert.equal(link.sheet, 'DANE')
    assert.ok(link.cell)
    const assetPath = path.resolve('public', folders[link.cityId], `${link.resolvedName}.PNG`)
    await access(assetPath)
    expectedAssets[folders[link.cityId]].push(`${link.resolvedName}.PNG`)
  }
  const publishedDirectories = (await readdir(path.resolve('public'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  assert.deepEqual(publishedDirectories, ['data', ...Object.values(folders)].sort())
  for (const [folder, expected] of Object.entries(expectedAssets)) {
    const published = (await readdir(path.resolve('public', folder)))
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .sort()
    assert.deepEqual(published, expected.sort(), `${folder} contains only source-backed images`)
  }
  const elephant = atlas.cities[0]
  assert.ok(elephant.location.imageUrl)
  assert.ok(elephant.overview.schwarzplanImage)
  assert.ok(elephant.overview.model3dImage)
  assert.ok(elephant.siteAnalysis.sunHoursImage)
  assert.equal(elephant.siteAnalysis.urbanBlocksImage, 'ELEPHANT_AND_CASTLE_261017')
  const block = elephant.analysisUnits.find((item) => item.name === 'UB_1')
  assert.equal(block.sunHours, 'Elephant_and_Castle_sun_hours_261107_UB_1')
  assert.equal(block.daylightPotential, 'Elephant_and_Castle_daylight_potential_261107_UB_1')
  for (const [record, cell, name] of [
    [elephant, 'BB8', 'ELEPHANT_AND_CASTLE_261017'],
    [block, 'BN8', 'Elephant_and_Castle_sun_hours_261107_UB_1'],
    [block, 'CS8', 'Elephant_and_Castle_daylight_potential_261107_UB_1'],
  ]) {
    const link = record.imageLinks.find((item) => item.cell === cell)
    assert.ok(link)
    assert.equal(link.referencedName, name)
    assert.equal(link.resolvedName, name)
    assert.ok(['copied', 'present'].includes(link.status))
  }
})

test('four verified map points have matching public feature provenance and other coordinates stay unset', () => {
  const expectedFeatures = {
    'elephant-and-castle': ['way', '366979812', 'Elephant Park'],
    garnizon: ['relation', '17995285', 'Garnizon'],
    kronsberg: ['node', '163156634', 'Kronsberg'],
    'aspern-seestadt': ['way', '28100015', 'Seestadt Aspern'],
  }
  for (const city of atlas.cities.filter((item) => item.id !== 'orestad-syd')) {
    assert.deepEqual(
      [city.location.coordinates.lat, city.location.coordinates.lng],
      {
        'elephant-and-castle': [51.4928183, -0.0962976],
        garnizon: [54.3845063, 18.5928283],
        kronsberg: [52.3381288, 9.834295],
        'aspern-seestadt': [48.2271676, 16.5058256],
      }[city.id],
    )
    assert.equal(city.location.coordinateSource.provider, 'OpenStreetMap')
    assert.match(city.location.coordinateSource.queryUrl, /^https:\/\/nominatim\.openstreetmap\.org\//)
    assert.match(city.location.coordinateSource.featureUrl, /^https:\/\/www\.openstreetmap\.org\//)
    assert.deepEqual(
      [city.location.coordinateSource.osmType, city.location.coordinateSource.osmId, city.location.coordinateSource.matchedName],
      expectedFeatures[city.id],
    )
    assert.match(city.location.coordinateSource.license, /OpenStreetMap contributors, ODbL 1\.0/)
    assert.ok(city.source.row > 0)
  }
  const orestad = atlas.cities.find((city) => city.id === 'orestad-syd')
  assert.equal(orestad.location.coordinates, null)
  assert.equal(orestad.location.coordinateSource, null)
  const dane = atlas.sourceWorkbook.sheets.DANE
  assert.equal(dane.find((row) => row.row === 9).cells.C9, undefined)
  assert.ok(atlas.notices.some((notice) => notice.includes('workbook contains no coordinates')))
  assert.ok(atlas.notices.some((notice) => notice.includes('restaurant, not a district feature')))
})
