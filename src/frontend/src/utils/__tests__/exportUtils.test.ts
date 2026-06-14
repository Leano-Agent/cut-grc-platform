/**
 * Export Utility Tests
 */
import { exportToCSV, generatePrintHTML } from '@utils/exportUtils'

describe('exportToCSV', () => {
  test('generates CSV from array of objects', () => {
    const data = [
      { id: '1', name: 'Test A', value: 100 },
      { id: '2', name: 'Test B', value: 200 },
    ]
    const result = exportToCSV(data, 'test-report')
    expect(result).toContain('id,name,value')
    expect(result).toContain('1,Test A,100')
    expect(result).toContain('2,Test B,200')
  })

  test('handles empty data array', () => {
    const result = exportToCSV([], 'empty-report')
    expect(result).toBeDefined()
  })

  test('handles special characters in values', () => {
    const data = [
      { name: 'Test, with comma', description: 'Has "quotes" and line\nbreaks' },
    ]
    const result = exportToCSV(data, 'special-chars')
    // Should wrap comma-containing fields in quotes
    expect(result).toContain('"Test, with comma"')
  })
})

describe('generatePrintHTML', () => {
  test('generates HTML with title and data', () => {
    const data = [
      { key: 'Risk Score', value: '68' },
      { key: 'Compliance Rate', value: '72%' },
    ]
    const html = generatePrintHTML('GRC Report', data)
    expect(html).toContain('GRC Report')
    expect(html).toContain('Risk Score')
    expect(html).toContain('68')
    expect(html).toContain('</html>')
  })

  test('includes embedded CSS for print styling', () => {
    const html = generatePrintHTML('Test', [{ key: 'a', value: '1' }])
    expect(html).toContain('@media print')
    expect(html).toContain('table')
  })

  test('handles empty data', () => {
    const html = generatePrintHTML('No Data', [])
    expect(html).toContain('No Data')
  })
})
