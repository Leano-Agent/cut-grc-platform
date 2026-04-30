import { Router } from 'express';
import { z } from 'zod';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { SecurityMiddleware } from '../../middleware/security.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import logger from '../../config/logger';

const router = Router();

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['policy', 'procedure', 'form', 'report', 'memo', 'other']),
  department: z.string().min(1, 'Department is required'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['policy', 'procedure', 'form', 'report', 'memo', 'other']).optional(),
  department: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
});

const documentQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  category: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'category']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Initialize middleware
let authMiddleware: AuthMiddleware;
let securityMiddleware: SecurityMiddleware;

export const initializeDocumentRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
  securityMiddleware = new SecurityMiddleware(redisClient);
};

/**
 * @route   GET /api/v1/documents
 * @desc    Get all documents with pagination and filtering
 * @access  Private
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateQuery(documentQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      department,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as any;
    
    // In real application, you would:
    // 1. Build database query with filters
    // 2. Apply pagination
    // 3. Return documents with total count
    
    const mockDocuments = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `doc_${Date.now() + i}`,
      title: `Municipal Document ${i + 1}`,
      description: `Sample document description ${i + 1}`,
      category: ['policy', 'procedure', 'form', 'report', 'memo'][i % 5] as any,
      department: ['Finance', 'Planning', 'Health', 'Education', 'Infrastructure'][i % 5],
      status: ['draft', 'review', 'approved', 'archived'][i % 4] as any,
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
    
    const total = 45; // Mock total count
    
    sendSuccess(res, {
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
  })
);

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // In real application, fetch document from database
    const mockDocument = {
      id,
      title: 'Municipal Policy Document',
      description: 'Official municipal policy regarding urban development',
      category: 'policy' as const,
      department: 'Planning',
      status: 'approved' as const,
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
    
    sendSuccess(res, mockDocument, 'Document retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/documents
 * @desc    Create a new document
 * @access  Private
 */
router.post(
  '/',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateBody(createDocumentSchema),
  (SecurityMiddleware as any).fileUploadProtection(),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    const documentData = req.body;
    
    // In real application:
    // 1. Handle file upload (using multer middleware)
    // 2. Store file in S3/local storage
    // 3. Create document record in database
    // 4. Initiate workflow
    
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
    
    logger.info(`Document created: ${newDocument.id} by ${req.user.userId}`);
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('document:created', {
        documentId: newDocument.id,
        title: newDocument.title,
        createdBy: req.user.userId,
        timestamp: new Date().toISOString()
      });
    }
    
    sendSuccess(res, newDocument, 'Document created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/documents/:id
 * @desc    Update a document
 * @access  Private
 */
router.put(
  '/:id',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  ValidationMiddleware.validateBody(updateDocumentSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    // In real application:
    // 1. Check if document exists
    // 2. Verify user has permission to edit
    // 3. Update document in database
    // 4. Create version history
    
    const updatedDocument = {
      id,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: req.user.userId,
        name: 'Current User',
        email: req.user.email
      },
      version: 2 // Increment version
    };
    
    logger.info(`Document updated: ${id} by ${req.user.userId}`);
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('document:updated', {
        documentId: id,
        updatedBy: req.user.userId,
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
    }
    
    sendSuccess(res, updatedDocument, 'Document updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete a document
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // In real application:
    // 1. Check if document exists
    // 2. Soft delete or archive document
    // 3. Update database
    
    logger.info(`Document deleted: ${id} by ${req.user?.userId}`);
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('document:deleted', {
        documentId: id,
        deletedBy: req.user?.userId,
        timestamp: new Date().toISOString()
      });
    }
    
    sendSuccess(res, null, 'Document deleted successfully');
  })
);

/**
 * @route   POST /api/v1/documents/:id/upload
 * @desc    Upload document file
 * @access  Private
 */
router.post(
  '/:id/upload',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  (SecurityMiddleware as any).fileUploadProtection(),
  asyncHandler(async (req, res) => {
    // Note: File upload would be handled by multer middleware
    // This is a placeholder for the actual file upload logic
    
    sendSuccess(res, {
      documentId: req.params.id,
      fileName: 'uploaded-file.pdf',
      fileSize: 1024000,
      fileType: 'application/pdf',
      uploadDate: new Date().toISOString()
    }, 'File uploaded successfully');
  })
);

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Download document file
 * @access  Private
 */
router.get(
  '/:id/download',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // In real application:
    // 1. Check if document exists and user has permission
    // 2. Get file from storage
    // 3. Increment download count
    // 4. Stream file to response
    
    logger.info(`Document downloaded: ${id} by ${req.user?.userId}`);
    
    // Mock file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="document-${id}.pdf"`);
    res.send('Mock PDF content for document download');
  })
);

/**
 * @route   POST /api/v1/documents/:id/share
 * @desc    Share document with other users/departments
 * @access  Private
 */
router.post(
  '/:id/share',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  ValidationMiddleware.validateBody(z.object({
    users: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    permission: z.enum(['view', 'comment', 'edit']).default('view'),
    message: z.string().max(500).optional()
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { users = [], departments = [], permission, message } = req.body;
    
    // In real application:
    // 1. Create share records in database
    // 2. Send notifications to shared users
    // 3. Log sharing activity
    
    logger.info(`Document shared: ${id} with ${users.length} users and ${departments.length} departments`);
    
    sendSuccess(res, {
      documentId: id,
      sharedWith: {
        users,
        departments
      },
      permission,
      sharedBy: req.user?.userId,
      sharedAt: new Date().toISOString()
    }, 'Document shared successfully');
  })
);

/**
 * @route   GET /api/v1/documents/:id/versions
 * @desc    Get document version history
 * @access  Private
 */
router.get(
  '/:id/versions',
  authMiddleware.verifyToken,
  ValidationMiddleware.validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Mock version history
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
    
    sendSuccess(res, {
      documentId: id,
      versions,
      currentVersion: 2
    }, 'Version history retrieved successfully');
  })
);

export default router;