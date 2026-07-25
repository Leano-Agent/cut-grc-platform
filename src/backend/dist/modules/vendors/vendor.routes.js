"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeVendorRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();

let authMiddleware;

// ─── In-memory store ──────────────────────────────────────────────────────────
let vendors = [
  {
    id: 'vdr_1',
    name: 'Cloud Infrastructure Provider',
    description: 'Primary cloud infrastructure and hosting services provider for all municipal digital platforms.',
    category: 'critical',
    status: 'active',
    vendorType: 'cloud_service',
    contactName: 'Sarah Mbatha',
    contactEmail: 's.mbatha@cloudinfra.co.za',
    contactPhone: '+27 11 234 5678',
    serviceDescription: 'Managed cloud hosting, disaster recovery, CDN, and database services across multiple regions.',
    contractValue: 2500000,
    contractStart: '2026-01-01',
    contractEnd: '2028-12-31',
    cyberScore: 4,
    complianceScore: 4,
    riskScore: 2,
    assessmentStatus: 'assessed',
    lastAssessmentDate: '2026-06-15',
    nextAssessmentDate: '2026-12-15',
    certifications: ['ISO 27001', 'SOC 2 Type II', 'POPIA Compliant'],
    documents: [
      { name: 'Infrastructure Security Audit 2026.pdf', type: 'audit', uploadedAt: '2026-06-15T10:00:00Z' },
      { name: 'Service Level Agreement v3.pdf', type: 'contract', uploadedAt: '2025-12-01T08:00:00Z' },
    ],
    notes: 'Long-standing partner. Recommend quarterly security review meetings.',
    tags: ['cloud', 'infrastructure', 'critical', 'hosting'],
    metadata: { department: 'IT', primaryContactId: 'user_1' },
    createdBy: 'user_1',
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'vdr_2',
    name: 'External Audit Firm',
    description: 'Independent external audit and assurance services for financial and compliance audits.',
    category: 'high',
    status: 'active',
    vendorType: 'consultant',
    contactName: 'John Mokoena',
    contactEmail: 'john.m@auditfirm.co.za',
    contactPhone: '+27 12 345 6789',
    serviceDescription: 'Annual external audit, compliance assessment, and internal audit co-sourcing services.',
    contractValue: 850000,
    contractStart: '2026-03-01',
    contractEnd: '2026-12-31',
    cyberScore: 5,
    complianceScore: 5,
    riskScore: 1,
    assessmentStatus: 'assessed',
    lastAssessmentDate: '2026-05-20',
    nextAssessmentDate: '2026-11-20',
    certifications: ['SAICA Registered', 'IRBA Accredited', 'ISO 27001'],
    documents: [
      { name: 'Audit Engagement Letter 2026.pdf', type: 'contract', uploadedAt: '2026-02-15T09:00:00Z' },
    ],
    notes: 'Top-tier audit firm with strong compliance track record.',
    tags: ['audit', 'compliance', 'financial', 'external'],
    metadata: { department: 'Finance', primaryContactId: 'user_2' },
    createdBy: 'user_2',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-05-20T14:00:00Z',
  },
  {
    id: 'vdr_3',
    name: 'Office Supplies Vendor',
    description: 'General office supplies, stationery, and consumables for all municipal departments.',
    category: 'low',
    status: 'active',
    vendorType: 'other',
    contactName: 'Thandi Ndlovu',
    contactEmail: 'thandi@officesupplies.co.za',
    contactPhone: '+27 21 456 7890',
    serviceDescription: 'Procurement and delivery of office supplies, printing materials, and janitorial consumables.',
    contractValue: 150000,
    contractStart: '2026-04-01',
    contractEnd: '2027-03-31',
    cyberScore: null,
    complianceScore: null,
    riskScore: null,
    assessmentStatus: 'not_assessed',
    lastAssessmentDate: null,
    nextAssessmentDate: null,
    certifications: [],
    documents: [],
    notes: 'Low-risk vendor. No sensitive data access. Basic due diligence completed.',
    tags: ['procurement', 'office-supplies', 'low-risk'],
    metadata: { department: 'Administration', primaryContactId: 'user_3' },
    createdBy: 'user_3',
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
];

let nextId = 4;

const authGuard = (req, res, next) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: filter vendors ──────────────────────────────────────────────────
const filterVendors = (query) => {
  let result = [...vendors];

  if (query.category) {
    result = result.filter(v => v.category === query.category);
  }
  if (query.status) {
    result = result.filter(v => v.status === query.status);
  }
  if (query.vendorType) {
    result = result.filter(v => v.vendorType === query.vendorType);
  }
  if (query.assessmentStatus) {
    result = result.filter(v => v.assessmentStatus === query.assessmentStatus);
  }
  if (query.riskScore) {
    const score = parseInt(query.riskScore, 10);
    result = result.filter(v => v.riskScore !== null && v.riskScore <= score);
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(v =>
      v.name.toLowerCase().includes(s) ||
      (v.description && v.description.toLowerCase().includes(s)) ||
      (v.contactName && v.contactName.toLowerCase().includes(s)) ||
      (v.tags && v.tags.some((t) => t.toLowerCase().includes(s)))
    );
  }

  return result;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/vendors
router.get('/', authGuard, async (req, res) => {
  const filtered = filterVendors(req.query);
  res.json({ success: true, data: filtered });
});

// GET /api/v1/vendors/stats/summary
router.get('/stats/summary', authGuard, async (req, res) => {
  const total = vendors.length;
  const byCategory = {};
  const byStatus = {};
  const byRiskLevel = { low: 0, medium: 0, high: 0, critical: 0 };
  let assessed = 0, expired = 0, inProgress = 0;

  for (const v of vendors) {
    byCategory[v.category] = (byCategory[v.category] || 0) + 1;
    byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    if (byRiskLevel[v.category] !== undefined) byRiskLevel[v.category]++;
    if (v.assessmentStatus === 'assessed') assessed++;
    if (v.assessmentStatus === 'expired') expired++;
    if (v.assessmentStatus === 'in_progress') inProgress++;
  }

  const scored = vendors.filter(v => v.cyberScore !== null);
  res.json({
    success: true,
    data: {
      total, byCategory, byStatus, byRiskLevel, assessed, expired, inProgress,
      notAssessed: total - assessed - expired - inProgress,
      totalContractValue: vendors.reduce((s, v) => s + (v.contractValue || 0), 0),
      avgCyberScore: scored.length > 0 ? (scored.reduce((s, v) => s + v.cyberScore, 0) / scored.length).toFixed(1) : null,
    },
  });
});

// GET /api/v1/vendors/:id
router.get('/:id', authGuard, async (req, res) => {
  const vendor = vendors.find(v => v.id === req.params.id);
  if (!vendor) { res.status(404).json({ success: false, message: 'Vendor not found' }); return; }
  res.json({ success: true, data: vendor });
});

// POST /api/v1/vendors
router.post('/', authGuard, async (req, res) => {
  const { name, description, category, vendorType, contactName, contactEmail, contactPhone } = req.body;
  if (!name || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Vendor name is required' });
    return;
  }
  const now = new Date().toISOString();
  const newVendor = {
    id: `vdr_${nextId++}`, name: name.trim(), description: description || null,
    category: category || 'medium', status: 'active', vendorType: vendorType || 'other',
    contactName: contactName || null, contactEmail: contactEmail || null, contactPhone: contactPhone || null,
    serviceDescription: req.body.serviceDescription || null, contractValue: req.body.contractValue || null,
    contractStart: req.body.contractStart || null, contractEnd: req.body.contractEnd || null,
    cyberScore: null, complianceScore: null, riskScore: null, assessmentStatus: 'not_assessed',
    lastAssessmentDate: null, nextAssessmentDate: null, certifications: req.body.certifications || [],
    documents: req.body.documents || [], notes: req.body.notes || null, tags: req.body.tags || [],
    metadata: req.body.metadata || {}, createdBy: (req.user && req.user.userId) || null,
    createdAt: now, updatedAt: now,
  };
  vendors.unshift(newVendor);
  res.status(201).json({ success: true, data: newVendor });
});

// PUT /api/v1/vendors/:id
router.put('/:id', authGuard, async (req, res) => {
  const index = vendors.findIndex(v => v.id === req.params.id);
  if (index === -1) { res.status(404).json({ success: false, message: 'Vendor not found' }); return; }
  const allowedFields = [
    'name', 'description', 'category', 'status', 'vendorType', 'contactName', 'contactEmail',
    'contactPhone', 'serviceDescription', 'contractValue', 'contractStart', 'contractEnd',
    'certifications', 'documents', 'notes', 'tags', 'metadata',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  vendors[index] = { ...vendors[index], ...updates, id: vendors[index].id, createdAt: vendors[index].createdAt, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: vendors[index] });
});

// PATCH /api/v1/vendors/:id/assess
router.patch('/:id/assess', authGuard, async (req, res) => {
  const vendor = vendors.find(v => v.id === req.params.id);
  if (!vendor) { res.status(404).json({ success: false, message: 'Vendor not found' }); return; }
  const { cyberScore, complianceScore, assessmentDate } = req.body;
  if (cyberScore !== undefined && cyberScore !== null && (cyberScore < 1 || cyberScore > 5)) {
    res.status(400).json({ success: false, message: 'cyberScore must be between 1 and 5' }); return;
  }
  if (complianceScore !== undefined && complianceScore !== null && (complianceScore < 1 || complianceScore > 5)) {
    res.status(400).json({ success: false, message: 'complianceScore must be between 1 and 5' }); return;
  }
  const cs = cyberScore !== undefined ? cyberScore : vendor.cyberScore;
  const comps = complianceScore !== undefined ? complianceScore : vendor.complianceScore;
  if (cs !== null && comps !== null) {
    vendor.riskScore = Math.max(1, Math.min(5, Math.round(6 - ((cs + comps) / 2))));
  }
  vendor.cyberScore = cs;
  vendor.complianceScore = comps;
  vendor.assessmentStatus = 'assessed';
  vendor.lastAssessmentDate = assessmentDate || new Date().toISOString().split('T')[0];
  vendor.nextAssessmentDate = req.body.nextAssessmentDate || null;
  vendor.updatedAt = new Date().toISOString();
  res.json({ success: true, data: vendor });
});

// DELETE /api/v1/vendors/:id
router.delete('/:id', authGuard, async (req, res) => {
  const index = vendors.findIndex(v => v.id === req.params.id);
  if (index === -1) { res.status(404).json({ success: false, message: 'Vendor not found' }); return; }
  vendors[index].status = 'blacklisted';
  vendors[index].updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Vendor blacklisted successfully' });
});

exports.default = router;
exports.initializeVendorRoutes = (redisClient) => {
  const { AuthMiddleware } = require('../../middleware/auth.middleware');
  authMiddleware = new AuthMiddleware(redisClient);
};
