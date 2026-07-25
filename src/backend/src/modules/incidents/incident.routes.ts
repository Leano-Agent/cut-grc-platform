import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeIncidentRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ─── In-memory store ──────────────────────────────────────────────────────────
let incidents: any[] = [
  {
    id: 'inc_1',
    title: 'Suspicious Network Activity Detected',
    description: 'Unauthorized access attempt detected on the municipal network from an external IP address targeting the financial database server.',
    category: 'security',
    severity: 'high',
    priority: 'high',
    status: 'contained',
    reportedBy: 'John Molefe',
    assignedTo: 'user_1',
    department: 'IT',
    location: 'Data Center - Main',
    detectionMethod: 'IDS/IPS Alert',
    impact: 'Potential data exfiltration — no evidence of data loss. Incident contained within 45 minutes.',
    rootCause: 'Brute-force attack on VPN gateway. Multi-factor authentication prevented breach.',
    remediation: 'Blocked source IPs, rotated VPN certificates, enhanced rate-limiting on gateway.',
    lessonsLearned: 'Deploy automated IP blocking and increase VPN monitoring coverage.',
    slaDeadline: '2026-01-20T18:00:00Z',
    slaBreached: false,
    resolvedAt: '2026-01-19T14:30:00Z',
    closedAt: null,
    tags: ['network-security', 'unauthorized-access', 'vpn'],
    evidence: ['IDS_log_2026-01-18.csv', 'network_capture_2026-01-18.pcap'],
    regulatoryObligations: ['POPIA', 'ISO 27001'],
    metadata: {},
    lastUpdated: '2026-01-19T15:00:00Z',
    createdAt: '2026-01-18T09:15:00Z',
  },
  {
    id: 'inc_2',
    title: 'Employee Data Access Violation',
    description: 'HR staff member accessed payroll records without authorisation. Internal audit detected the anomaly.',
    category: 'privacy',
    severity: 'high',
    priority: 'high',
    status: 'investigating',
    reportedBy: 'Audit Team',
    assignedTo: 'user_2',
    department: 'HR',
    location: 'Head Office',
    detectionMethod: 'Internal Audit',
    impact: 'Unauthorised access to 34 employee records containing banking and ID details.',
    rootCause: null,
    remediation: null,
    lessonsLearned: null,
    slaDeadline: '2026-07-30T00:00:00Z',
    slaBreached: false,
    resolvedAt: null,
    closedAt: null,
    tags: ['data-privacy', 'popia', 'unauthorised-access'],
    evidence: ['audit_log_extract_2026-07-20.pdf'],
    regulatoryObligations: ['POPIA', 'Employment Equity Act'],
    metadata: {},
    lastUpdated: '2026-07-22T11:00:00Z',
    createdAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'inc_3',
    title: 'Phishing Campaign Targeting Finance',
    description: 'Targeted phishing emails sent to finance department impersonating the CFO and requesting urgent payment processing.',
    category: 'security',
    severity: 'critical',
    priority: 'critical',
    status: 'resolved',
    reportedBy: 'Thabo Nkosi',
    assignedTo: 'user_1',
    department: 'Finance',
    location: 'Finance Wing - 2nd Floor',
    detectionMethod: 'User Report',
    impact: 'No financial loss. Two employees clicked the link but security awareness training prevented credential submission.',
    rootCause: 'Sophisticated spear-phishing campaign targeting finance personnel during month-end processing.',
    remediation: 'Email gateway rules updated, mandatory security awareness refresher for finance team, CFO communication protocol established.',
    lessonsLearned: 'Implement challenge-response for payment requests exceeding R50,000. Monthly phishing simulations for finance.',
    slaDeadline: '2026-03-16T18:00:00Z',
    slaBreached: false,
    resolvedAt: '2026-03-14T10:00:00Z',
    closedAt: '2026-03-20T16:00:00Z',
    tags: ['phishing', 'social-engineering', 'finance'],
    evidence: ['phishing_email_2026-03-13.eml', 'forensic_report_March_2026.pdf'],
    regulatoryObligations: [],
    metadata: {},
    lastUpdated: '2026-03-20T16:00:00Z',
    createdAt: '2026-03-13T14:30:00Z',
  },
];

let nextId = 4;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: filter incidents ─────────────────────────────────────────────────
const filterIncidents = (query: any) => {
  let result = [...incidents];

  if (query.category) result = result.filter(i => i.category === query.category);
  if (query.status) result = result.filter(i => i.status === query.status);
  if (query.severity) result = result.filter(i => i.severity === query.severity);
  if (query.priority) result = result.filter(i => i.priority === query.priority);
  if (query.department) result = result.filter(i => i.department?.toLowerCase() === query.department.toLowerCase());
  if (query.assignedTo) result = result.filter(i => i.assignedTo === query.assignedTo);
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(i =>
      i.title.toLowerCase().includes(s) ||
      i.description?.toLowerCase().includes(s) ||
      i.tags?.some((t: string) => t.toLowerCase().includes(s))
    );
  }
  return result;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/incidents
 * @desc    Get all incidents with filtering
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const filtered = filterIncidents(req.query);
    sendSuccess(res, filtered, 'Incidents retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/incidents/stats/summary
 * @desc    Incident statistics
 */
router.get(
  '/stats/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const total = incidents.length;
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const i of incidents) {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    }

    sendSuccess(res, {
      total,
      byStatus,
      bySeverity,
      byCategory,
      openIncidents: incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length,
      slaBreached: incidents.filter(i => i.slaBreached).length,
      criticalOpen: incidents.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length,
    }, 'Incident statistics retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/incidents/:id
 * @desc    Get incident by ID
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const incident = incidents.find(i => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }
    sendSuccess(res, incident, 'Incident retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/incidents
 * @desc    Create a new incident
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, severity, priority, department, location, detectionMethod, impact, tags, regulatoryObligations } = req.body;

    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: 'Incident title is required' });
      return;
    }

    const now = new Date().toISOString();
    const newIncident = {
      id: `inc_${nextId++}`,
      title: title.trim(),
      description: description || null,
      category: category || 'other',
      severity: severity || 'medium',
      priority: priority || 'medium',
      status: 'reported',
      reportedBy: req.body.reportedBy || null,
      assignedTo: null,
      department: department || null,
      location: location || null,
      detectionMethod: detectionMethod || null,
      impact: impact || null,
      rootCause: null,
      remediation: null,
      lessonsLearned: null,
      slaDeadline: null,
      slaBreached: false,
      resolvedAt: null,
      closedAt: null,
      tags: tags || [],
      evidence: [],
      regulatoryObligations: regulatoryObligations || [],
      metadata: {},
      lastUpdated: now,
      createdAt: now,
    };

    incidents.unshift(newIncident);
    res.status(201).json({ data: newIncident });
  })
);

/**
 * @route   PUT /api/v1/incidents/:id
 * @desc    Update an incident
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = incidents.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }

    const allowedFields = [
      'title', 'description', 'category', 'severity', 'priority',
      'assignedTo', 'department', 'location', 'detectionMethod',
      'impact', 'rootCause', 'remediation', 'lessonsLearned',
      'tags', 'evidence', 'regulatoryObligations'
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    incidents[index] = {
      ...incidents[index],
      ...updates,
      id: incidents[index].id,
      createdAt: incidents[index].createdAt,
      lastUpdated: new Date().toISOString(),
    };

    res.json({ data: incidents[index] });
  })
);

/**
 * @route   PATCH /api/v1/incidents/:id/status
 * @desc    Update incident status workflow
 */
router.patch(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const incident = incidents.find(i => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      reported: ['investigating', 'resolved', 'closed'],
      investigating: ['contained', 'resolved', 'reported'],
      contained: ['resolved', 'investigating'],
      resolved: ['closed', 'investigating'],
      closed: ['investigating'],
    };

    const newStatus = req.body.status;
    const allowed = validTransitions[incident.status] || [];

    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        message: `Cannot transition from '${incident.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      });
      return;
    }

    incident.status = newStatus;
    incident.lastUpdated = new Date().toISOString();

    // Auto-set timestamps on status changes
    if (newStatus === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date().toISOString();
    }
    if (newStatus === 'closed' && !incident.closedAt) {
      incident.closedAt = new Date().toISOString();
    }
    // If reopened from resolved/closed
    if (['reported', 'investigating', 'contained'].includes(newStatus)) {
      incident.resolvedAt = null;
      incident.closedAt = null;
    }

    res.json({ data: incident });
  })
);

/**
 * @route   PATCH /api/v1/incidents/:id/assign
 * @desc    Assign incident to a user
 */
router.patch(
  '/:id/assign',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const incident = incidents.find(i => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }

    incident.assignedTo = req.body.assignedTo || null;
    incident.lastUpdated = new Date().toISOString();
    res.json({ data: incident });
  })
);

/**
 * @route   DELETE /api/v1/incidents/:id
 * @desc    Delete (close) an incident
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = incidents.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }
    incidents[index].status = 'closed';
    incidents[index].closedAt = new Date().toISOString();
    incidents[index].lastUpdated = new Date().toISOString();
    res.json({ message: 'Incident closed successfully' });
  })
);

export default router;
