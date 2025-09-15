const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// SQL Database imports (removed for Mongo-only mode)
const useMongoAuth = (process.env.AUTH_BACKEND || '').toLowerCase() === 'mongo';
const { router: authRouter, authenticateToken, requireRole } = require('./routes/auth');

// MongoDB imports
const Applicant = require('./models/Applicant');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased from 5 to 20 for testing
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// Compression
app.use(compression());

// Trust proxy (if behind reverse proxy)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Logging
const logFile = process.env.LOG_FILE || './logs/app.log';
const logDir = path.dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('combined')); // Also log to console

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// In-memory storage for development (replace with MongoDB when available)
let users = [
  {
    _id: '1',
    email: 'hr@ongc.co.in',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    name: 'HR Manager',
    role: 'hr_manager',
    department: 'Human Resources',
    employeeId: 'HR001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    email: 'admin@ongc.co.in',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    name: 'System Administrator',
    role: 'admin',
    department: 'IT',
    employeeId: 'IT001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let applicants = [];
let nextApplicantId = 1;

// Configure Nodemailer transporter
const createEmailTransporter = () => {
  console.log('📧 Configuring email transporter...');
  console.log(`📮 Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
  console.log(`🔌 Port: ${process.env.EMAIL_PORT || 587}`);
  console.log(`👤 User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🔐 Password: ${process.env.EMAIL_PASS ? '***configured***' : 'Not configured'}`);
  
  // Use real email transporter (no more mock for development)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  console.log('✅ Email transporter configured successfully.');
  return transporter;
};

// Define schemas and models (applicant model only here; User model lives in models/MongoUser.js when AUTH_BACKEND=mongo)

const applicantSchema = new mongoose.Schema({
  submissionTimestamp: Date,
  email: { type: String, required: true, unique: true },
  instructionAcknowledged: String,
  trainingAcknowledgement: String,
  name: { type: String, required: true },
  age: Number,
  gender: String,
  category: String,
  address: String,
  mobileNo: String,
  email2: String,
  fatherMotherName: String,
  fatherMotherOccupation: String,
  presentInstitute: String,
  areasOfTraining: String,
  presentSemester: String,
  lastSemesterSGPA: Number,
  percentageIn10Plus2: Number,
  declaration01: String,
  declaration02: String,
  declaration03: String,
  designation: String,
  cpf: { type: String, required: true },
  section: String,
  location: String,
  mentorMobileNo: String,
  mentorDetailsAvailable: String,
  guardianOccupationDetails: String,
  mentorCPF: String,
  mentorName: String,
  mentorDesignation: String,
  mentorSection: String,
  mentorLocation: String,
  mentorEmail: String,
  preferenceCriteria: String,
  referredBy: String,
  status: { type: String, default: 'Pending' },
  
  // Computed fields
  term: { type: String, enum: ['Summer', 'Winter'] },
  quotaCategory: { type: String, enum: ['General', 'Reserved'] },
  lateApplication: { type: Boolean, default: false },
  uploadDate: { type: Date, default: Date.now },
  processedBy: String
});

const MongoUser = useMongoAuth ? require('./models/MongoUser') : null;

// SQL Database connection disabled in Mongo-only mode
const connectSQLDB = async () => {
  console.log('🗄️  SQL auth disabled (Mongo-only mode)');
  return false;
};

// MongoDB connection with fallback to in-memory storage
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ongc-internship';
    console.log('🗄️  Connecting to MongoDB...');
    console.log(`📊 URI: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log('✅ Connected to MongoDB successfully');
    
    // Log MongoDB statistics
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 MongoDB Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Check applicant data
    const applicantCount = await Applicant.countDocuments();
    console.log(`👥 Total Applicants in MongoDB: ${applicantCount}`);
    
    await initializeMongoUsers();
  } catch (error) {
    console.error('❌  MongoDB connection failed. Server requires MongoDB in Mongo-only mode.');
    throw error;
  }
};

// Initialize users for MongoDB
const initializeMongoUsers = async () => {
  try {
    const userCount = await MongoUser.countDocuments();
    
    if (userCount === 0) {
      const defaultUsers = [
        {
          email: 'hr@ongc.co.in',
          password: 'password123',
          name: 'HR Manager',
          role: 'hr_manager',
          department: 'Human Resources',
          employeeId: 'HR001',
          isActive: true
        },
        {
          email: 'admin@ongc.co.in',
          password: 'admin123',
          name: 'System Administrator',
          role: 'admin',
          department: 'IT',
          employeeId: 'IT001',
          isActive: true
        }
      ];
      
      await MongoUser.create(defaultUsers);
      console.log('Default users created successfully');
    }
  } catch (error) {
    console.error('Error initializing MongoDB users:', error);
  }
};

// In-memory users are not used in Mongo-only mode

// Note: authenticateToken and requireRole are imported from routes/auth.js
//const fs = require('fs/promises');
//const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit= require('@pdf-lib/fontkit');
// Removed cleanText function - it was stripping Hindi characters
// function cleanText(text) {
//   return text.replace(/[\u0900-\u097F\/]+/g, '');
// }

// Import bilingual formatter utility
const { formatApplicantData } = require('./utils/bilingualFormatter');

// Import new PDF generator
const { createONGCApplicationForm } = require('./utils/pdfGenerator');

// Function to format applicant data with bilingual strings for PDF template
function formatApplicantDataForPDF(applicantData) {
  console.log('🔤 Original applicant data:', JSON.stringify(applicantData, null, 2));
  
  const formattedData = formatApplicantData(applicantData);
  
  console.log('🔤 Final formatted data:', JSON.stringify(formattedData, null, 2));
  return formattedData;
}
// Old coordinate mapping removed - now using new PDF generator
// Authentication routes are handled by authRouter
// Function to create PDF form with applicant data using the new generator
const fillPDFForm = async (applicantData, registrationNumber) => {
    try {
        console.log('📄 Creating ONGC application form with applicant data:', applicantData);
        
        // Use the new PDF generator to create the form from scratch
        const pdfBytes = await createONGCApplicationForm(applicantData, registrationNumber);
        
        return pdfBytes;
        
    } catch (error) {
        console.error('Error creating PDF form:', error);
        return null;
    }
};
// Email sending endpoint
app.post('/api/send-email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, html, text, attachTemplate, applicantData } = req.body;
    console.log(applicantData);
    console.log('📧 Email sending request received:');
    console.log(`   📮 To: ${to}`);
    console.log(`   📝 Subject: ${subject}`);
    console.log(`   📎 Attach Template: ${attachTemplate ? 'Yes' : 'No'}`);
    
    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.log('❌ Missing required email fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and html/text content'
      });
    }
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email configuration not found');
      return res.status(500).json({
        success: false,
        message: 'Email configuration not found. Please configure EMAIL_USER and EMAIL_PASS in environment variables.'
      });
    }
    
    // Create transporter
    console.log('🔧 Creating email transporter...');
    const transporter = createEmailTransporter();
    
    // Verify transporter configuration
    try {
      console.log('🔍 Verifying email transporter...');
      await transporter.verify();
      console.log('✅ Email transporter verified successfully.');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please check your email credentials.'
      });
    }
    
    // Email options
    const mailOptions = {
      from: `"ONGC Dehradun - SAIL" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html?.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      attachments: []
    };
    console.log('LMAO');
    // Add PDF template attachment if requested
    if (attachTemplate) {
          console.log('LMAO2');
      // Check if we have applicant data to fill the form
      let pdfBuffer = null;
      
      // Try to extract applicant data from email content for form filling
      //if (html && html.includes('Registration number is:')) {
            console.log('LMAO3');

            try {
          // Extract registration number from email content
          const regMatch = html.match(/SAIL-\d{4}-\d{4}/);
          const registrationNumber = regMatch ? regMatch[0] : '';
          console.log('ApplicantData', applicantData);
          // Create mock applicant data from email recipient
          // In a real implementation, you'd pass the full applicant data
          const data = {
            // Standardized to match pdfGenerator formatter expectations
            name: applicantData.name,
            age: applicantData.age,
            gender: applicantData.gender,
            category: applicantData.category,
            address: applicantData.address,
            mobileNo: applicantData.mobileNo || applicantData.mobile,
            email: applicantData.email,
            fatherMotherName: applicantData.fatherMotherName || applicantData.father,
            fatherMotherOccupation: applicantData.fatherMotherOccupation || applicantData.father_occupation,
            presentInstitute: applicantData.presentInstitute || applicantData.college,
            areasOfTraining: applicantData.areasOfTraining || applicantData.course,
            presentSemester: applicantData.presentSemester || applicantData.semester,
            lastSemesterSGPA: applicantData.lastSemesterSGPA || applicantData.cgpa,
            percentageIn10Plus2: applicantData.percentageIn10Plus2 || applicantData.percentage,
            designation: applicantData.designation,
            cpf: applicantData.cpf,
            section: applicantData.section,
            location: applicantData.location
          }
                console.log('LMAO4');

          // Fill the PDF form
              

              pdfBuffer = await fillPDFForm(data, registrationNumber);
              console.log('LMAO5');
        } catch (error) {
          console.error('Error creating filled PDF:', error);
        }
      //}
      
      if (pdfBuffer) {
            console.log('LMAO6');

        // Use filled PDF
        mailOptions.attachments.push({
          filename: 'ONGC_Internship_Application_Form2_Filled.pdf',
          content: pdfBuffer,

          contentType: 'application/pdf'
        });
      } else {
        // Fallback to blank template
        const templatePath = path.join(__dirname, 'templates', 'template.pdf');
        
        try {
          if (fs.existsSync(templatePath)) {
            mailOptions.attachments.push({
              filename: 'ONGC_Internship_Application_Form.pdf',
              path: templatePath,
              contentType: 'application/pdf'
            });
          } else {
            console.warn('Template PDF not found at:', templatePath);
          }
        } catch (attachError) {
          console.error('Error attaching template:', attachError);
        }
      }
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Handle specific email errors
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email server. Please check your network connection.';
    } else if (error.responseCode === 550) {
      errorMessage = 'Email rejected by recipient server. Please check the recipient email address.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk email sending endpoint
app.post('/api/send-bulk-emails', authenticateToken, async (req, res) => {
  try {
    const { emails } = req.body; // Array of { to, subject, html, text, attachTemplate } objects
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emails array provided'
      });
    }
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration not found'
      });
    }
    
    const transporter = createEmailTransporter();
    
    // Verify transporter
    try {
      await transporter.verify();
    } catch (verifyError) {
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error'
      });
    }
    
    const results = [];
    const batchSize = 5; // Send emails in batches to avoid overwhelming the server
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (emailData) => {
        try {
          const mailOptions = {
            from: `"ONGC Dehradun - SAIL" <${process.env.EMAIL_USER}>`,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text || emailData.html?.replace(/<[^>]*>/g, ''),
            attachments: []
          };
          
          // Add PDF template attachment if requested
          if (emailData.attachTemplate) {
            // Try to fill PDF with applicant data if available
            let pdfBuffer = null;
            
            if (emailData.applicantData) {
              try {
                // Extract registration number from email content
                const regMatch = emailData.html ? emailData.html.match(/SAIL-\d{4}-\d{4}/) : null;
                const registrationNumber = regMatch ? regMatch[0] : '';
                
                pdfBuffer = await fillPDFForm(emailData.applicantData, registrationNumber);
              } catch (error) {
                console.error(`Error creating filled PDF for ${emailData.to}:`, error);
              }
            }
            
            if (pdfBuffer) {
              // Use filled PDF
              mailOptions.attachments.push({
                filename: 'ONGC_Internship_Application_Form_Filled.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
              });
            } else {
              // Fallback to blank template
              const templatePath = path.join(__dirname, 'templates', 'template.pdf');
              
              try {
                if (fs.existsSync(templatePath)) {
                  mailOptions.attachments.push({
                    filename: 'ONGC_Internship_Application_Form.pdf',
                    path: templatePath,
                    contentType: 'application/pdf'
                  });
                }
              } catch (attachError) {
                console.error(`Error attaching template for ${emailData.to}:`, attachError);
              }
            }
          }
          
          const info = await transporter.sendMail(mailOptions);
          
          return {
            to: emailData.to,
            success: true,
            messageId: info.messageId
          };
        } catch (error) {
          console.error(`Failed to send email to ${emailData.to}:`, error);
          return {
            to: emailData.to,
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Bulk email sending completed. ${successCount} sent, ${failureCount} failed.`,
      results: results,
      summary: {
        total: emails.length,
        sent: successCount,
        failed: failureCount
      }
    });
    
  } catch (error) {
    console.error('Bulk email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Authentication routes (SQL Database)
app.use('/api/auth', authRouter);

// Applicant routes (MongoDB)
const applicantRouter = require('./routes/applicants');
app.use('/api/applicants', applicantRouter);

// Legacy route redirects (for backward compatibility)
app.get('/api/shortlisted', authenticateToken, (req, res) => {
  res.redirect('/api/applicants/shortlisted');
});

app.get('/api/approved', authenticateToken, (req, res) => {
  res.redirect('/api/applicants/approved');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Disconnected';
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    email: emailConfigured ? 'Configured' : 'Not Configured'
  });
});

// Test email endpoint (no authentication required)
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    console.log('📧 Test email request received:');
    console.log(`   📮 To: ${to}`);
    console.log(`   📝 Subject: ${subject}`);
    
    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, html'
      });
    }
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration not found. Please configure EMAIL_USER and EMAIL_PASS in environment variables.'
      });
    }
    
    // Create transporter
    const transporter = createEmailTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully.');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please check your email credentials.'
      });
    }
    
    // Email options
    const mailOptions = {
      from: `"ONGC Dehradun - SAIL" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('❌ Test email sending error:', error);
    
    let errorMessage = 'Failed to send test email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email server. Please check your network connection.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  }

  // In development, show more details
  res.status(500).json({
    error: error.message,
    stack: error.stack
  });
});

// Connect to databases and start server
const startServer = async () => {
  try {
    // Connect to SQL database for authentication
    await connectSQLDB();
    
    // Connect to MongoDB for applicant data
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log('🔐 Authentication Demo credentials:');
      console.log('   HR Manager: hr@ongc.co.in / password123');
      console.log('   Admin: admin@ongc.co.in / admin123');
      console.log('   Viewer: viewer@ongc.co.in / viewer123');
      console.log('📝 Note: MongoDB handles ALL data (Mongo-only mode)');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();