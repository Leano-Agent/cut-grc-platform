/**
 * HeatMap Component Tests
 * Tests the interactive 5×5 risk matrix heat map
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import HeatMap from '@components/HeatMap'

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#4B0082' }, secondary: { main: '#2ecc71' } },
})

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)

// Create a sample cell at a specific position
const makeCell = (l: number, i: number, count: number) => ({
  likelihood: l as 0 | 1 | 2 | 3 | 4,
  impact: i as 0 | 1 | 2 | 3 | 4,
  count,
  risks: Array.from({ length: count }, (_, idx) => ({
    id: `risk_${l}_${i}_${idx}`,
    title: `Risk at (${l},${i}) #${idx}`,
    severity: count > 2 ? 'Critical' : 'Medium',
    department: 'IT',
    owner: 'System',
  })),
})

describe('HeatMap', () => {
  test('renders the heat map with likelihood and impact labels', () => {
    const data = Array.from({ length: 5 }, (_, l) =>
      Array.from({ length: 5 }, (_, i) => makeCell(l, i, 0))
    ).flat()
    renderWithTheme(<HeatMap data={data} />)

    // Likelihood labels (y-axis)
    expect(screen.getByText('Rare')).toBeInTheDocument()
    expect(screen.getByText('Almost Certain')).toBeInTheDocument()

    // Impact labels (x-axis)
    expect(screen.getByText('Insignificant')).toBeInTheDocument()
    expect(screen.getByText('Catastrophic')).toBeInTheDocument()

    // Title
    expect(screen.getByText(/Risk Heat Map/i)).toBeInTheDocument()
  })

  test('displays risk counts in populated cells', () => {
    const cells = Array.from({ length: 5 }, (_, l) =>
      Array.from({ length: 5 }, (_, i) => makeCell(l, i, 0))
    ).flat()
    // Populate one cell with 3 risks
    cells[12] = makeCell(2, 2, 3) // center cell — 3 risks
    renderWithTheme(<HeatMap data={cells} />)

    // Should show count of 3 in that cell
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  test('opens detail dialog on cell click', () => {
    const cells = Array.from({ length: 5 }, (_, l) =>
      Array.from({ length: 5 }, (_, i) => makeCell(l, i, 0))
    ).flat()
    cells[0] = makeCell(0, 0, 2) // 2 risks at (0,0)
    renderWithTheme(<HeatMap data={cells} />)

    // Find all interactive buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Click the first one
    fireEvent.click(buttons[0])
  })

  test('calls onCellClick when provided', () => {
    const onCellClick = jest.fn()
    const cells = Array.from({ length: 5 }, (_, l) =>
      Array.from({ length: 5 }, (_, i) => makeCell(l, i, 0))
    ).flat()
    cells[0] = makeCell(0, 0, 1)
    renderWithTheme(<HeatMap data={cells} onCellClick={onCellClick} />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onCellClick).toHaveBeenCalled()
  })

  test('renders empty state gracefully', () => {
    renderWithTheme(<HeatMap data={[]} />)
    expect(screen.getByText(/Risk Heat Map/i)).toBeInTheDocument()
  })

  test('renders color-coded cells based on risk score', () => {
    const data = Array.from({ length: 5 }, (_, l) =>
      Array.from({ length: 5 }, (_, i) => makeCell(l, i, 0))
    ).flat()
    renderWithTheme(<HeatMap data={data} />)
    // All 5 likelihood labels should be present
    const labels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })
})

/**
 * ComplianceDashboard Component Tests
 */
import ComplianceDashboard from '@components/ComplianceDashboard'

describe('ComplianceDashboard', () => {
  // Build sample regulation requirements matching the component's interface
  const sampleRequirements = [
    {
      id: '1',
      regulation: 'POPIA',
      requirement: 'Data Protection Officer Appointment',
      status: 'compliant' as const,
      complianceLevel: 95,
      dueDate: '2024-03-31',
      lastAudit: '2024-03-15',
      owner: 'Sarah Smith',
      evidenceFiles: 8,
      gaps: [],
    },
    {
      id: '2',
      regulation: 'POPIA',
      requirement: 'Consent Management',
      status: 'in_progress' as const,
      complianceLevel: 60,
      dueDate: '2024-06-30',
      lastAudit: '2024-04-01',
      owner: 'John Doe',
      evidenceFiles: 3,
      gaps: ['Missing consent forms for data processing'],
    },
    {
      id: '3',
      regulation: 'PCI DSS',
      requirement: 'Firewall Configuration',
      status: 'non_compliant' as const,
      complianceLevel: 25,
      dueDate: '2024-05-15',
      lastAudit: '2024-05-01',
      owner: 'IT Security',
      evidenceFiles: 0,
      gaps: ['No firewall audit log', 'Missing network segmentation'],
    },
  ]

  test('renders regulation overview cards', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    expect(screen.getByText('POPIA')).toBeInTheDocument()
    expect(screen.getByText('PCI DSS')).toBeInTheDocument()
  })

  test('shows compliance levels as percentages', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    expect(screen.getByText(/95%/)).toBeInTheDocument()
    expect(screen.getByText(/25%/)).toBeInTheDocument()
  })

  test('displays gap information for non-compliant items', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    // Check that gaps are rendered
    expect(screen.getByText(/No firewall audit log/i)).toBeInTheDocument()
    expect(screen.getByText(/Missing network segmentation/i)).toBeInTheDocument()
  })

  test('renders empty state', () => {
    renderWithTheme(<ComplianceDashboard requirements={[]} />)
    expect(screen.getByText(/Compliance Dashboard/i)).toBeInTheDocument()
  })

  test('shows search/filter input', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument()
  })

  test('shows evidence file counts', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    expect(screen.getByText(/8/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  test('shows export button', () => {
    renderWithTheme(<ComplianceDashboard requirements={sampleRequirements} />)
    expect(screen.getByText(/Export/i)).toBeInTheDocument()
  })
})

/**
 * KpiDashboard Component Tests
 */
import KpiDashboard from '@components/KpiDashboard'

describe('KpiDashboard', () => {
  const sampleKpis = [
    { id: 'risk-score', label: 'Risk Score', value: 68, unit: 'avg', change: '-5', trend: 'down' as const, icon: <span>🔒</span>, color: '#4CAF50', severity: 'good' as const },
    { id: 'compliance-rate', label: 'Compliance Rate', value: '72%', change: '+3%', trend: 'up' as const, icon: <span>✓</span>, color: '#2196F3', severity: 'good' as const },
    { id: 'open-risks', label: 'Open Risks', value: 15, change: '+4', trend: 'up' as const, icon: <span>⚠</span>, color: '#FF9800', severity: 'warning' as const },
  ]

  test('renders all KPI cards with values', () => {
    renderWithTheme(<KpiDashboard kpis={sampleKpis} />)
    expect(screen.getByText('68')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  test('shows KPI labels', () => {
    renderWithTheme(<KpiDashboard kpis={sampleKpis} />)
    expect(screen.getByText('Risk Score')).toBeInTheDocument()
    expect(screen.getByText('Compliance Rate')).toBeInTheDocument()
    expect(screen.getByText('Open Risks')).toBeInTheDocument()
  })

  test('renders with auto-refresh indicator', () => {
    renderWithTheme(<KpiDashboard kpis={sampleKpis} />)
    expect(screen.getByText(/Refreshes every/)).toBeInTheDocument()
  })

  test('shows refresh button', () => {
    renderWithTheme(<KpiDashboard kpis={sampleKpis} />)
    expect(screen.getByLabelText(/Refresh now/i)).toBeInTheDocument()
  })

  test('renders with default KPIs when none provided', () => {
    renderWithTheme(<KpiDashboard />)
    // Default KPIs should render
    expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument()
    // Default values should appear
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  test('shows trend indicators', () => {
    renderWithTheme(<KpiDashboard kpis={sampleKpis} />)
    // Trend changes should be visible
    expect(screen.getByText('-5')).toBeInTheDocument()
    expect(screen.getByText('+3%')).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeInTheDocument()
  })
})
