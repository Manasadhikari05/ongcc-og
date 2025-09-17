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
const puppeteer = require('puppeteer');

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
  origin: function (origin, callback) {
    console.log('🌐 [CORS] Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
      ['http://localhost:5173', 'http://localhost:3000'];
    
    console.log('🌐 [CORS] Allowed origins:', allowedOrigins);
    
    // Allow all origins if * is specified
    if (allowedOrigins.includes('*')) {
      console.log('✅ [CORS] Allowing all origins (wildcard)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ [CORS] Origin allowed:', origin);
      return callback(null, true);
    } else {
      console.log('❌ [CORS] Origin blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
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
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

// Clean text function to remove problematic characters
function cleanText(text) {
  return text.replace(/[\u0900-\u097F\/]+/g, '');
}

// Coordinate mapping for PDF form fields
const coords = {
  name: [77, 720],
  age: [240, 718],
  reg: [460, 720],
  gender: [90, 698],
  category: [290, 700],
  address: [90, 678],
  mobile: [128, 658],
  email: [330, 658],
  father: [235, 637],
  father_occupation: [290, 618],
  'father-phone': [128, 602],
  course: [295, 508],
  semester: [200, 492],
  cgpa: [245, 478],
  percentage: [500, 478],
  college: [220, 458],
  date: [460, 440], // optional
};

// Function to create a simple HTML version of the form with data
const createHTMLForm = (applicantData, registrationNumber) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ONGC Internship Application Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .form-container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; }
        .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; }
        .field-row { display: flex; margin-bottom: 10px; }
        .field { flex: 1; margin-right: 20px; }
        .field-label { font-weight: bold; color: #555; }
        .field-value { border-bottom: 1px solid #333; min-height: 20px; padding: 2px; }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="header">
            <h1>ONGC INTERNSHIP APPLICATION FORM</h1>
            <h2>ओएनजीसी इंटर्नशिप आवेदन फॉर्म</h2>
        </div>
        
        <div class="section">
            <div class="section-title">Personal Information / व्यक्तिगत जानकारी</div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">नाम/Name:</div>
                    <div class="field-value">${applicantData.name || ''}</div>
                </div>
                <div class="field">
                    <div class="field-label">उम्र/Age:</div>
                    <div class="field-value">${applicantData.age || ''}</div>
                </div>
                <div class="field">
                    <div class="field-label">पंजीकरण संख्या/Registration No.:</div>
                    <div class="field-value">${registrationNumber || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">लिंग/Gender:</div>
                    <div class="field-value">${applicantData.gender || ''}</div>
                </div>
                <div class="field">
                    <div class="field-label">श्रेणी/Category:</div>
                    <div class="field-value">${applicantData.category || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">पता/Address:</div>
                    <div class="field-value">${applicantData.address || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">मोबाइल नंबर/Mobile No.:</div>
                    <div class="field-value">${applicantData.mobile || ''}</div>
                </div>
                <div class="field">
                    <div class="field-label">ई-मेल/E-mail:</div>
                    <div class="field-value">${applicantData.email || ''}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Parent Information / अभिभावक जानकारी</div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">पिता/माता का नाम/Father/Mother's Name:</div>
                    <div class="field-value">${applicantData.father || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">पिता/माता का व्यवसाय/Father/Mother's Occupation:</div>
                    <div class="field-value">${applicantData.father_occupation || ''}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Academic Information / शैक्षणिक विवरण</div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">वर्तमान पाठ्यक्रम का नाम/Name of Present Course:</div>
                    <div class="field-value">${applicantData.course || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">वर्तमान सेमेस्टर/Present Semester:</div>
                    <div class="field-value">${applicantData.semester || ''}</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">पिछला सेमेस्टर SGPA/Last Semester SGPA:</div>
                    <div class="field-value">${applicantData.cgpa || ''}</div>
                </div>
                <div class="field">
                    <div class="field-label">10+2 में प्रतिशत/%age in 10+2:</div>
                    <div class="field-value">${applicantData.percentage || ''}%</div>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <div class="field-label">संस्थान का नाम/Name of Institute:</div>
                    <div class="field-value">${applicantData.college || ''}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Declaration / घोषणा</div>
            <p>I certify that all the information provided above is true and correct to the best of my knowledge.</p>
            <p>मैं प्रमाणित करता/करती हूँ कि उपरोक्त दी गई सभी जानकारी मेरी जानकारी के अनुसार सत्य और सही है।</p>
        </div>
    </div>
</body>
</html>
    `;
};

// Function to create a structured PDF using PDF-lib
const createStructuredPDF = async (applicantData, registrationNumber) => {
    try {
        console.log('📄 Creating structured PDF with data:', applicantData);
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        
        // Embed fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const { width, height } = page.getSize();
        
        // Helper function to draw text
        const drawText = (text, x, y, options = {}) => {
            page.drawText(String(text || ''), {
                x,
                y,
                size: options.size || 12,
                font: options.bold ? helveticaBoldFont : helveticaFont,
                color: rgb(0, 0, 0),
                ...options
            });
        };
        
        // Draw header
        drawText('ONGC INTERNSHIP APPLICATION FORM', 150, height - 50, { size: 16, bold: true });
        drawText('ओएनजीसी इंटर्नशिप आवेदन फॉर्म', 150, height - 75, { size: 14, bold: true });
        
        let yPosition = height - 120;
        
        // Personal Information Section
        drawText('Personal Information / व्यक्तिगत जानकारी', 50, yPosition, { size: 14, bold: true });
        yPosition -= 30;
        
        // Draw form fields in a structured manner
        const fieldWidth = 200;
        const col1X = 50;
        const col2X = 300;
        
        drawText('Name/नाम:', col1X, yPosition, { bold: true });
        drawText(applicantData.name || '', col1X + 80, yPosition);
        drawText('Age/उम्र:', col2X, yPosition, { bold: true });
        drawText(applicantData.age || '', col2X + 60, yPosition);
        yPosition -= 25;
        
        drawText('Registration No./पंजीकरण संख्या:', col1X, yPosition, { bold: true });
        drawText(registrationNumber || '', col1X + 160, yPosition);
        yPosition -= 25;
        
        drawText('Gender/लिंग:', col1X, yPosition, { bold: true });
        drawText(applicantData.gender || '', col1X + 80, yPosition);
        drawText('Category/श्रेणी:', col2X, yPosition, { bold: true });
        drawText(applicantData.category || '', col2X + 80, yPosition);
        yPosition -= 25;
        
        drawText('Address/पता:', col1X, yPosition, { bold: true });
        drawText(applicantData.address || '', col1X + 80, yPosition);
        yPosition -= 25;
        
        drawText('Mobile/मोबाइल:', col1X, yPosition, { bold: true });
        drawText(applicantData.mobile || '', col1X + 80, yPosition);
        drawText('Email/ई-मेल:', col2X, yPosition, { bold: true });
        drawText(applicantData.email || '', col2X + 60, yPosition);
        yPosition -= 40;
        
        // Parent Information Section
        drawText('Parent Information / अभिभावक जानकारी', 50, yPosition, { size: 14, bold: true });
        yPosition -= 30;
        
        drawText('Father/Mother Name:', col1X, yPosition, { bold: true });
        drawText(applicantData.father || '', col1X + 120, yPosition);
        yPosition -= 25;
        
        drawText('Father/Mother Occupation:', col1X, yPosition, { bold: true });
        drawText(applicantData.father_occupation || '', col1X + 150, yPosition);
        yPosition -= 40;
        
        // Academic Information Section
        drawText('Academic Information / शैक्षणिक विवरण', 50, yPosition, { size: 14, bold: true });
        yPosition -= 30;
        
        drawText('Course/पाठ्यक्रम:', col1X, yPosition, { bold: true });
        drawText(applicantData.course || '', col1X + 100, yPosition);
        yPosition -= 25;
        
        drawText('Semester/सेमेस्टर:', col1X, yPosition, { bold: true });
        drawText(applicantData.semester || '', col1X + 100, yPosition);
        yPosition -= 25;
        
        drawText('SGPA:', col1X, yPosition, { bold: true });
        drawText(applicantData.cgpa || '', col1X + 50, yPosition);
        drawText('10+2 %:', col2X, yPosition, { bold: true });
        drawText((applicantData.percentage || '') + '%', col2X + 50, yPosition);
        yPosition -= 25;
        
        drawText('Institute/संस्थान:', col1X, yPosition, { bold: true });
        drawText(applicantData.college || '', col1X + 80, yPosition);
        yPosition -= 40;
        
        // Declaration
        drawText('Declaration / घोषणा', 50, yPosition, { size: 14, bold: true });
        yPosition -= 25;
        
        const declarationText = 'I certify that all the information provided above is true and correct to the best of my knowledge.';
        drawText(declarationText, 50, yPosition, { size: 10 });
        yPosition -= 20;
        
        const hindiDeclaration = 'मैं प्रमाणित करता/करती हूँ कि उपरोक्त दी गई सभी जानकारी मेरी जानकारी के अनुसार सत्य और सही है।';
        drawText(hindiDeclaration, 50, yPosition, { size: 10 });
        
        console.log('✅ Structured PDF created successfully');
        return await pdfDoc.save();
        
    } catch (error) {
        console.error('❌ Error creating structured PDF:', error);
        return null;
    }
};

// Function to generate PDF from HTML using Puppeteer (with better error handling)
const generatePDFFromHTML = async (applicantData, registrationNumber) => {
    let browser = null;
    try {
        console.log('📄 Attempting HTML to PDF generation with Puppeteer...');
        
        // Create HTML content
        const htmlContent = createHTMLForm(applicantData, registrationNumber);
        
        // Launch browser with Render.com friendly configuration
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-client-side-phishing-detection',
                '--disable-hang-monitor',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--no-default-browser-check',
                '--no-zygote',
                '--single-process'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });
        
        const page = await browser.newPage();
        
        // Set HTML content
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            timeout: 30000
        });
        
        console.log('✅ PDF generated successfully from HTML using Puppeteer');
        return pdfBuffer;
        
    } catch (error) {
        console.error('❌ Error generating PDF from HTML:', error.message);
        console.log('🔄 Puppeteer failed, will use fallback method');
        return null;
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.warn('⚠️ Warning: Could not close Puppeteer browser:', closeError.message);
            }
        }
    }
};

// Updated function to handle PDF creation with multi-layered fallback approach
const fillPDFForm = async (applicantData, registrationNumber) => {
    try {
        console.log('📄 Starting PDF generation process with multi-layered approach...');
        
        // Strategy 1: Try Puppeteer HTML-to-PDF generation (best quality)
        console.log('🎯 Strategy 1: Attempting Puppeteer HTML-to-PDF generation...');
        const htmlPDF = await generatePDFFromHTML(applicantData, registrationNumber);
        if (htmlPDF) {
            console.log('✅ Successfully generated filled PDF from HTML using Puppeteer');
            return htmlPDF;
        }
        
        // Strategy 2: Create structured PDF using PDF-lib (reliable fallback)
        console.log('🎯 Strategy 2: Creating structured PDF using PDF-lib...');
        const structuredPDF = await createStructuredPDF(applicantData, registrationNumber);
        if (structuredPDF) {
            console.log('✅ Successfully generated structured PDF using PDF-lib');
            return structuredPDF;
        }
        
        // Strategy 3: Fallback to template PDF (last resort)
        console.log('🎯 Strategy 3: Using template PDF as final fallback...');
        const templatePath = path.join(__dirname, 'templates', 'template.pdf');
        
        if (fs.existsSync(templatePath)) {
            const templateBytes = fs.readFileSync(templatePath);
            console.log('✅ Using blank template PDF as final fallback');
            return templateBytes;
        }
        
        console.log('❌ All PDF generation strategies failed');
        return null;
        
    } catch (error) {
        console.error('❌ Error in PDF processing:', error);
        return null;
    }
};
// Email sending endpoint
app.post('/api/send-email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, html, text, attachTemplate, applicantData } = req.body;
    console.log('\n=== EMAIL REQUEST START ===');
    console.log('📧 Email sending request received:');
    console.log(`   📮 To: ${to}`);
    console.log(`   📝 Subject: ${subject}`);
    console.log(`   📎 Attach Template: ${attachTemplate ? 'Yes' : 'No'}`);
    console.log(`   📄 Has applicant data: ${applicantData ? 'Yes' : 'No'}`);
    console.log('   📄 Full request body keys:', Object.keys(req.body));
    console.log('=== EMAIL REQUEST END ===\n');
    
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
    console.log('📎 Processing PDF attachment request...');
    // Add PDF template attachment if requested
    if (attachTemplate) {
      console.log('📄 Filling PDF template with applicant data...');
      console.log('📄 Applicant data received:', applicantData);
      
      const templatePath = path.join(__dirname, 'templates', 'template.pdf');
      let pdfBuffer = null;
      
      try {
        if (fs.existsSync(templatePath)) {
          console.log('✅ Template PDF found at:', templatePath);
          
          // Extract registration number from email content
          const regMatch = html.match(/SAIL-\d{4}-\d{4}/);
          const registrationNumber = regMatch ? regMatch[0] : 'SAIL-2025-0001';
          console.log('🔢 Registration number:', registrationNumber);
          
          // Prepare data for PDF filling
          const data = {
            name: applicantData?.name || 'Student Name',
            age: String(applicantData?.age || '22'),
            gender: applicantData?.gender || 'Male',
            category: applicantData?.category || 'General',
            reg: registrationNumber,
            address: applicantData?.address || 'Address',
            mobile: applicantData?.mobileNo || applicantData?.mobile || '9999999999',
            email: applicantData?.email || to,
            father: applicantData?.fatherMotherName || 'Parent Name',
            father_occupation: applicantData?.fatherMotherOccupation || 'Occupation',
            course: applicantData?.areasOfTraining || 'Engineering',
            semester: applicantData?.presentSemester || '6th',
            cgpa: String(applicantData?.lastSemesterSGPA || '8.5'),
            percentage: String(applicantData?.percentageIn10Plus2 || '85'),
            college: applicantData?.presentInstitute || 'Engineering College'
          };
          
          console.log('📄 Data prepared for PDF:', data);
          
          // Fill the PDF template
          pdfBuffer = await fillPDFForm(data, registrationNumber);
          
          if (pdfBuffer && pdfBuffer.length > 0) {
            console.log('✅ PDF filled successfully! Size:', pdfBuffer.length, 'bytes');
            
            mailOptions.attachments.push({
              filename: 'ONGC_Internship_Application_Form_Filled.pdf',
              content: pdfBuffer,
              contentType: 'application/pdf'
            });
          } else {
            console.log('⚠️  PDF filling failed, using blank template');
            
            mailOptions.attachments.push({
              filename: 'ONGC_Internship_Application_Form.pdf',
              path: templatePath,
              contentType: 'application/pdf'
            });
          }
          
        } else {
          console.error('❌ Template PDF not found at:', templatePath);
        }
      } catch (error) {
        console.error('❌ Error processing PDF:', error);
        
        // Fallback to blank template if anything fails
        try {
          mailOptions.attachments.push({
            filename: 'ONGC_Internship_Application_Form.pdf',
            path: templatePath,
            contentType: 'application/pdf'
          });
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
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
  const mongoStatus = mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'In-Memory Storage';
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  // Check if template files exist
  const templatePath = path.join(__dirname, 'templates', 'template.pdf');
  const fontPath = path.join(__dirname, 'templates', 'NotoSansDevanagari-Regular.ttf');
  const templateExists = fs.existsSync(templatePath);
  const fontExists = fs.existsSync(fontPath);
  
  let templateSize = 0;
  if (templateExists) {
    try {
      const stats = fs.statSync(templatePath);
      templateSize = stats.size;
    } catch (e) {}
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    sql: 'Available for Authentication',
    email: emailConfigured ? 'Configured' : 'Not Configured',
    template: {
      exists: templateExists,
      path: templatePath,
      size: templateSize
    },
    font: {
      exists: fontExists,
      path: fontPath
    }
  });
});
// Test PDF generation endpoint (no authentication required)
app.post('/api/test-pdf', async (req, res) => {
  try {
    const { applicantData, registrationNumber } = req.body;
    
    console.log('📄 Test PDF generation request received:');
    console.log('   📝 Applicant Data:', applicantData);
    console.log('   🔢 Registration Number:', registrationNumber);
    
    // Generate PDF
    const pdfBuffer = await fillPDFForm(applicantData, registrationNumber);
    
    if (pdfBuffer) {
      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="ONGC_Test_Form.pdf"');
      res.send(pdfBuffer);
      
      console.log('✅ Test PDF generated and sent successfully');
    } else {
      console.log('❌ Failed to generate PDF');
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }
    
  } catch (error) {
    console.error('❌ Test PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'PDF generation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test PDF email endpoint (no authentication required) 
app.post('/api/test-pdf-email', async (req, res) => {
  try {
    const { applicantData, registrationNumber, to } = req.body;
    
    console.log('📧 Test PDF email request received:');
    console.log('   📝 Applicant Data:', applicantData);
    console.log('   🔢 Registration Number:', registrationNumber);
    console.log('   📮 To Email:', to);
    
    // Validate required fields
    if (!to || !applicantData || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, applicantData, registrationNumber'
      });
    }
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration not found. Please configure EMAIL_USER and EMAIL_PASS in environment variables.'
      });
    }
    
    // Generate PDF
    const pdfBuffer = await fillPDFForm(applicantData, registrationNumber);
    
    // Create transporter
    const transporter = createEmailTransporter();
    
    // Email options
    const mailOptions = {
      from: `"ONGC Dehradun - SAIL" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'ONGC Internship Application Confirmation - Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #d32f2f;">ONGC Internship Application</h2>
            <h3 style="color: #1976d2;">Application Confirmation - Test</h3>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Dear ${applicantData.name || 'Applicant'},</h3>
            <p>This is a test email confirming your ONGC internship application.</p>
            <p><strong>Registration Number:</strong> ${registrationNumber}</p>
            <p><strong>Email:</strong> ${applicantData.email || 'N/A'}</p>
            <p><strong>Course:</strong> ${applicantData.course || 'N/A'}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #1976d2;">
            <p style="margin: 0; color: #1976d2;"><strong>Note:</strong> Please find your filled application form attached as PDF.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated test message from ONGC Dehradun.</p>
          </div>
        </div>
      `,
      attachments: []
    };
    
    // Add PDF attachment
    if (pdfBuffer) {
      mailOptions.attachments.push({
        filename: 'ONGC_Internship_Application_Form_Filled.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    } else {
      // Fallback to template if available
      const templatePath = path.join(__dirname, 'templates', 'template.pdf');
      if (fs.existsSync(templatePath)) {
        mailOptions.attachments.push({
          filename: 'ONGC_Internship_Application_Form.pdf',
          path: templatePath,
          contentType: 'application/pdf'
        });
      }
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test PDF email sent successfully:', {
      messageId: info.messageId,
      to: to,
      pdfGenerated: !!pdfBuffer,
      attachmentCount: mailOptions.attachments.length
    });
    
    res.json({
      success: true,
      message: 'Test PDF email sent successfully',
      messageId: info.messageId,
      pdfGenerated: !!pdfBuffer,
      attachmentCount: mailOptions.attachments.length
    });
    
  } catch (error) {
    console.error('❌ Test PDF email error:', error);
    res.status(500).json({
      success: false,
      message: 'PDF email sending error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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