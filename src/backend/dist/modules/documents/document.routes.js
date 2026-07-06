"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDocumentRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const security_middleware_1 = require("../../middleware/security.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const logger_1 = __importDefault(require("../../config/logger"));
const router = (0, express_1.Router)();
const createDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.enum(['policy', 'procedure', 'form', 'report', 'memo', 'other']),
    department: zod_1.z.string().min(1, 'Department is required'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.enum(['policy', 'procedure', 'form', 'report', 'memo', 'other']).optional(),
    department: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    status: zod_1.z.enum(['draft', 'review', 'approved', 'archived']).optional(),
});
const documentQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => parseInt(val || '1')),
    limit: zod_1.z.string().optional().transform(val => parseInt(val || '20')),
    category: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['title', 'createdAt', 'updatedAt', 'category']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
let authMiddleware;
let securityMiddleware;
const initializeDocumentRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
    securityMiddleware = new security_middleware_1.SecurityMiddleware(redisClient);
};
exports.initializeDocumentRoutes = initializeDocumentRoutes;
router.get('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateQuery(documentQuerySchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, category, department, status, search, _sortBy = 'createdAt', _sortOrder = 'desc' } = req.query;
    const mockDocuments = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: `doc_${Date.now() + i}`,
        title: `Municipal Document ${i + 1}`,
        description: `Sample document description ${i + 1}`,
        category: ['policy', 'procedure', 'form', 'report', 'memo'][i % 5],
        department: ['Finance', 'Planning', 'Health', 'Education', 'Infrastructure'][i % 5],
        status: ['draft', 'review', 'approved', 'archived'][i % 4],
        fileName: `document-${i + 1}.pdf`,
        fileSize: 1024 * (i + 1),
        fileType: 'application/pdf',
        createdBy: {
            id: 'user_123',
            name: 'John Doe',
            email: 'john@municipal.gov'
        },
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
        tags: ['important', 'financial', 'planning'].slice(0, i % 3 + 1),
        version: i + 1,
        downloadCount: Math.floor(Math.random() * 100),
    }));
    const total = 45;
    (0, errorMiddleware_1.sendSuccess)(res, {
        documents: mockDocuments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
        filters: {
            category,
            department,
            status,
            search,
        },
    }, 'Documents retrieved successfully');
}));
router.get('/:id', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const mockDocument = {
        id,
        title: 'Municipal Policy Document',
        description: 'Official municipal policy regarding urban development',
        category: 'policy',
        department: 'Planning',
        status: 'approved',
        fileName: 'urban-development-policy-2024.pdf',
        fileSize: 2048000,
        fileType: 'application/pdf',
        fileUrl: `/api/v1/documents/${id}/download`,
        createdBy: {
            id: 'user_123',
            name: 'Jane Smith',
            email: 'jane@municipal.gov',
            department: 'Planning'
        },
        reviewedBy: {
            id: 'user_456',
            name: 'Robert Johnson',
            email: 'robert@municipal.gov',
            department: 'Legal'
        },
        approvedBy: {
            id: 'user_789',
            name: 'Sarah Williams',
            email: 'sarah@municipal.gov',
            department: 'Executive'
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        effectiveDate: '2024-02-01',
        reviewDate: '2025-02-01',
        tags: ['policy', 'urban-development', 'planning', 'official'],
        version: 2,
        previousVersion: 'doc_previous_123',
        downloadCount: 42,
        metadata: {
            legislationReferences: ['Act 25 of 1998', 'Regulation 456/2020'],
            affectedDepartments: ['Planning', 'Infrastructure', 'Environment'],
            complianceRequired: true,
            riskLevel: 'medium'
        },
        workflow: {
            currentStep: 'approved',
            steps: [
                { name: 'draft', completed: true, completedAt: '2024-01-10T09:00:00Z', completedBy: 'user_123' },
                { name: 'review', completed: true, completedAt: '2024-01-18T11:30:00Z', completedBy: 'user_456' },
                { name: 'approval', completed: true, completedAt: '2024-01-20T14:45:00Z', completedBy: 'user_789' },
                { name: 'publish', completed: false }
            ]
        },
        permissions: {
            canEdit: true,
            canDelete: false,
            canDownload: true,
            canShare: true,
            canApprove: false
        }
    };
    (0, errorMiddleware_1.sendSuccess)(res, mockDocument, 'Document retrieved successfully');
}));
router.post('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(createDocumentSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const documentData = req.body;
    const newDocument = {
        id: `doc_${Date.now()}`,
        ...documentData,
        status: 'draft',
        createdBy: {
            id: req.user.userId,
            name: 'Current User',
            email: req.user.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        downloadCount: 0,
        permissions: {
            canEdit: true,
            canDelete: true,
            canDownload: true,
            canShare: true,
            canApprove: req.user.role === 'admin'
        }
    };
    logger_1.default.info(`Document created: ${newDocument.id} by ${req.user.userId}`);
    const io = req.app.get('io');
    if (io) {
        io.emit('document:created', {
            documentId: newDocument.id,
            title: newDocument.title,
            createdBy: req.user.userId,
            timestamp: new Date().toISOString()
        });
    }
    (0, errorMiddleware_1.sendSuccess)(res, newDocument, 'Document created successfully', 201);
}));
router.put('/:id', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), validation_middleware_1.ValidationMiddleware.validateBody(updateDocumentSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const { id } = req.params;
    const updates = req.body;
    const updatedDocument = {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: {
            id: req.user.userId,
            name: 'Current User',
            email: req.user.email
        },
        version: 2
    };
    logger_1.default.info(`Document updated: ${id} by ${req.user.userId}`);
    const io = req.app.get('io');
    if (io) {
        io.emit('document:updated', {
            documentId: id,
            updatedBy: req.user.userId,
            updates: Object.keys(updates),
            timestamp: new Date().toISOString()
        });
    }
    (0, errorMiddleware_1.sendSuccess)(res, updatedDocument, 'Document updated successfully');
}));
router.delete('/:id', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Document deleted: ${id} by ${req.user?.userId}`);
    const io = req.app.get('io');
    if (io) {
        io.emit('document:deleted', {
            documentId: id,
            deletedBy: req.user?.userId,
            timestamp: new Date().toISOString()
        });
    }
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Document deleted successfully');
}));
router.post('/:id/upload', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    (0, errorMiddleware_1.sendSuccess)(res, {
        documentId: req.params.id,
        fileName: 'uploaded-file.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf',
        uploadDate: new Date().toISOString()
    }, 'File uploaded successfully');
}));
router.get('/:id/download', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Document downloaded: ${id} by ${req.user?.userId}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="document-${id}.pdf"`);
    res.send('Mock PDF content for document download');
}));
router.post('/:id/share', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), validation_middleware_1.ValidationMiddleware.validateBody(zod_1.z.object({
    users: zod_1.z.array(zod_1.z.string()).optional(),
    departments: zod_1.z.array(zod_1.z.string()).optional(),
    permission: zod_1.z.enum(['view', 'comment', 'edit']).default('view'),
    message: zod_1.z.string().max(500).optional()
})), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { users = [], departments = [], permission, message: _message } = req.body;
    logger_1.default.info(`Document shared: ${id} with ${users.length} users and ${departments.length} departments`);
    (0, errorMiddleware_1.sendSuccess)(res, {
        documentId: id,
        sharedWith: {
            users,
            departments
        },
        permission,
        sharedBy: req.user?.userId,
        sharedAt: new Date().toISOString()
    }, 'Document shared successfully');
}));
router.get('/:id/versions', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const versions = [
        {
            version: 2,
            title: 'Municipal Policy Document v2',
            description: 'Updated with new regulations',
            changedBy: { id: 'user_123', name: 'John Doe' },
            changedAt: '2024-01-20T14:45:00Z',
            changes: ['Updated regulatory references', 'Added new compliance section'],
            fileSize: 2048000
        },
        {
            version: 1,
            title: 'Municipal Policy Document v1',
            description: 'Initial draft',
            changedBy: { id: 'user_456', name: 'Jane Smith' },
            changedAt: '2024-01-15T10:30:00Z',
            changes: ['Initial creation'],
            fileSize: 1024000
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, {
        documentId: id,
        versions,
        currentVersion: 2
    }, 'Version history retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=document.routes.js.map