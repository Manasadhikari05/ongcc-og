/**
 * ONGC Application Form PDF Generator
 * Creates the complete application form from scratch without using a template
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const { formatApplicantData } = require('./bilingualFormatter');

// A4 page dimensions (in points)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

// Font sizes
const TITLE_FONT_SIZE = 16;
const SECTION_FONT_SIZE = 14;
const LABEL_FONT_SIZE = 12;
const DATA_FONT_SIZE = 14; // Increased from 11 to 14 for better visibility

// Colors
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const LIGHT_GRAY = rgb(0.7, 0.7, 0.7);

/**
 * Create a new ONGC application form PDF from scratch
 * @param {Object} applicantData - The applicant data to fill in
 * @param {string} registrationNumber - The registration number
 * @returns {Buffer} PDF buffer
 */
async function createONGCApplicationForm(applicantData, registrationNumber) {
    try {
        console.log('📄 Creating ONGC application form from scratch...');
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        
        // Load and register the multilingual font
        const fontPath = path.join(__dirname, '..', 'templates', 'NotoSansDevanagari-Regular.ttf');
        if (!fs.existsSync(fontPath)) {
            throw new Error(`Font file not found: ${fontPath}`);
        }
        
        const fontBytes = fs.readFileSync(fontPath);
        pdfDoc.registerFontkit(fontkit);
        const customFont = await pdfDoc.embedFont(fontBytes);
        
        console.log(`📁 Font loaded successfully (${fontBytes.length} bytes)`);
        
        // Format applicant data with bilingual strings
        const formattedData = formatApplicantData(applicantData);
        console.log('📄 Formatted applicant data:', formattedData);
        
        // Draw the form structure
        await drawFormStructure(page, customFont);
        
        // Draw applicant data
        await drawApplicantData(page, customFont, formattedData, registrationNumber);
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        console.log('✅ ONGC application form created successfully');
        
        return pdfBytes;
        
    } catch (error) {
        console.error('❌ Error creating ONGC application form:', error);
        throw error;
    }
}

/**
 * Draw the form structure (headers, labels, lines, sections)
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 */
async function drawFormStructure(page, font) {
    console.log('📝 Drawing form structure...');
    
    // Draw main title
    page.drawText('ONGC Internship Application Form', {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 30,
        size: TITLE_FONT_SIZE,
        font: font,
        color: BLACK,
    });
    
    // Draw subtitle
    page.drawText('ओएनजीसी इंटर्नशिप आवेदन फॉर्म', {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 50,
        size: SECTION_FONT_SIZE,
        font: font,
        color: DARK_GRAY,
    });
    
    // Draw horizontal line under title
    page.drawLine({
        start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 60 },
        end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 60 },
        thickness: 1,
        color: BLACK,
    });
    
    // Draw personal information section
    await drawPersonalInfoSection(page, font);
    
    // Draw parent information section
    await drawParentInfoSection(page, font);
    
    // Draw academic information section
    await drawAcademicInfoSection(page, font);
    
    // Draw ONGC employee information section (if applicable)
    await drawONGCEmployeeSection(page, font);
}

/**
 * Draw personal information section
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 */
async function drawPersonalInfoSection(page, font) {
    const startY = PAGE_HEIGHT - MARGIN - 100;
    
    // Section header
    page.drawText('Personal Information / व्यक्तिगत जानकारी', {
        x: MARGIN,
        y: startY,
        size: SECTION_FONT_SIZE,
        font: font,
        color: BLACK,
    });
    
    // Draw horizontal line under section header
    page.drawLine({
        start: { x: MARGIN, y: startY - 10 },
        end: { x: PAGE_WIDTH - MARGIN, y: startY - 10 },
        thickness: 1,
        color: LIGHT_GRAY,
    });
    
    // Field labels and positions
    const fields = [
        { label: 'नाम/Name:', x: MARGIN, y: startY - 40 },
        { label: 'उम्र/Age:', x: MARGIN + 200, y: startY - 40 },
        { label: 'पंजीकरण संख्या/Registration No.:', x: MARGIN + 350, y: startY - 40 },
        { label: 'लिंग/Gender:', x: MARGIN, y: startY - 70 },
        { label: 'श्रेणी/Category:', x: MARGIN + 200, y: startY - 70 },
        { label: 'पता/Address:', x: MARGIN, y: startY - 100 },
        { label: 'मोबाइल नंबर/Mobile No.:', x: MARGIN, y: startY - 130 },
        { label: 'ई-मेल/E-mail:', x: MARGIN + 200, y: startY - 130 },
    ];
    
    // Draw field labels
    fields.forEach(field => {
        page.drawText(field.label, {
            x: field.x,
            y: field.y,
            size: LABEL_FONT_SIZE,
            font: font,
            color: BLACK,
        });
        
        // Draw underline for data entry
        page.drawLine({
            start: { x: field.x, y: field.y - 5 },
            end: { x: field.x + 150, y: field.y - 5 },
            thickness: 0.5,
            color: LIGHT_GRAY,
        });
    });
}

/**
 * Draw parent information section
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 */
async function drawParentInfoSection(page, font) {
    const startY = PAGE_HEIGHT - MARGIN - 200;
    
    // Section header
    page.drawText('Parent Information / अभिभावक जानकारी', {
        x: MARGIN,
        y: startY,
        size: SECTION_FONT_SIZE,
        font: font,
        color: BLACK,
    });
    
    // Draw horizontal line under section header
    page.drawLine({
        start: { x: MARGIN, y: startY - 10 },
        end: { x: PAGE_WIDTH - MARGIN, y: startY - 10 },
        thickness: 1,
        color: LIGHT_GRAY,
    });
    
    // Field labels and positions
    const fields = [
        { label: 'पिता/माता का नाम/Father/Mother\'s Name:', x: MARGIN, y: startY - 40 },
        { label: 'पिता/माता का व्यवसाय/Father/Mother\'s Occupation:', x: MARGIN, y: startY - 70 },
        { label: 'मोबाइल नंबर/Mobile No.:', x: MARGIN, y: startY - 100 },
    ];
    
    // Draw field labels
    fields.forEach(field => {
        page.drawText(field.label, {
            x: field.x,
            y: field.y,
            size: LABEL_FONT_SIZE,
            font: font,
            color: BLACK,
        });
        
        // Draw underline for data entry
        page.drawLine({
            start: { x: field.x, y: field.y - 5 },
            end: { x: field.x + 200, y: field.y - 5 },
            thickness: 0.5,
            color: LIGHT_GRAY,
        });
    });
}

/**
 * Draw academic information section
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 */
async function drawAcademicInfoSection(page, font) {
    const startY = PAGE_HEIGHT - MARGIN - 350;
    
    // Section header
    page.drawText('Academic Details / शैक्षणिक विवरण', {
        x: MARGIN,
        y: startY,
        size: SECTION_FONT_SIZE,
        font: font,
        color: BLACK,
    });
    
    // Draw horizontal line under section header
    page.drawLine({
        start: { x: MARGIN, y: startY - 10 },
        end: { x: PAGE_WIDTH - MARGIN, y: startY - 10 },
        thickness: 1,
        color: LIGHT_GRAY,
    });
    
    // Field labels and positions
    const fields = [
        { label: 'वर्तमान पाठ्यक्रम का नाम/Name of Present Course:', x: MARGIN, y: startY - 40 },
        { label: 'वर्तमान सेमेस्टर/Present Semester:', x: MARGIN, y: startY - 70 },
        { label: 'पिछला सेमेस्टर SGPA/Last Semester SGPA:', x: MARGIN, y: startY - 100 },
        { label: '10+2 में प्रतिशत/%age in 10+2:', x: MARGIN + 200, y: startY - 100 },
        { label: 'संस्थान का नाम/Name of Institute:', x: MARGIN, y: startY - 130 },
    ];
    
    // Draw field labels
    fields.forEach(field => {
        page.drawText(field.label, {
            x: field.x,
            y: field.y,
            size: LABEL_FONT_SIZE,
            font: font,
            color: BLACK,
        });
        
        // Draw underline for data entry
        page.drawLine({
            start: { x: field.x, y: field.y - 5 },
            end: { x: field.x + 200, y: field.y - 5 },
            thickness: 0.5,
            color: LIGHT_GRAY,
        });
    });
}

/**
 * Draw ONGC employee information section
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 */
async function drawONGCEmployeeSection(page, font) {
    const startY = PAGE_HEIGHT - MARGIN - 500;
    
    // Section header
    page.drawText('ONGC Employee Information (if applicable) / ओएनजीसी कर्मचारी जानकारी', {
        x: MARGIN,
        y: startY,
        size: SECTION_FONT_SIZE,
        font: font,
        color: BLACK,
    });
    
    // Draw horizontal line under section header
    page.drawLine({
        start: { x: MARGIN, y: startY - 10 },
        end: { x: PAGE_WIDTH - MARGIN, y: startY - 10 },
        thickness: 1,
        color: LIGHT_GRAY,
    });
    
    // Field labels and positions
    const fields = [
        { label: 'पदनाम/Designation:', x: MARGIN, y: startY - 40 },
        { label: 'CPF:', x: MARGIN + 200, y: startY - 40 },
        { label: 'अनुभाग/Section:', x: MARGIN, y: startY - 70 },
        { label: 'स्थान/Location:', x: MARGIN + 200, y: startY - 70 },
    ];
    
    // Draw field labels
    fields.forEach(field => {
        page.drawText(field.label, {
            x: field.x,
            y: field.y,
            size: LABEL_FONT_SIZE,
            font: font,
            color: BLACK,
        });
        
        // Draw underline for data entry
        page.drawLine({
            start: { x: field.x, y: field.y - 5 },
            end: { x: field.x + 150, y: field.y - 5 },
            thickness: 0.5,
            color: LIGHT_GRAY,
        });
    });
}

/**
 * Draw applicant data in the form
 * @param {PDFPage} page - The PDF page
 * @param {PDFFont} font - The font to use
 * @param {Object} data - The formatted applicant data
 * @param {string} registrationNumber - The registration number
 */
async function drawApplicantData(page, font, data, registrationNumber) {
    console.log('📝 Drawing applicant data...');
    
    const startY = PAGE_HEIGHT - MARGIN - 100;
    
    // Personal Information data positions (adjusted to be below the labels)
    const dataPositions = {
        name: { x: MARGIN + 10, y: startY - 55 },
        age: { x: MARGIN + 210, y: startY - 55 },
        reg: { x: MARGIN + 360, y: startY - 55 },
        gender: { x: MARGIN + 10, y: startY - 85 },
        category: { x: MARGIN + 210, y: startY - 85 },
        address: { x: MARGIN + 10, y: startY - 115 },
        mobile: { x: MARGIN + 10, y: startY - 145 },
        email: { x: MARGIN + 210, y: startY - 145 },
    };
    
    // Draw personal information data
    if (data.name) {
        page.drawText(data.name, {
            x: dataPositions.name.x,
            y: dataPositions.name.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.age) {
        page.drawText(data.age, {
            x: dataPositions.age.x,
            y: dataPositions.age.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (registrationNumber) {
        page.drawText(registrationNumber, {
            x: dataPositions.reg.x,
            y: dataPositions.reg.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.gender) {
        page.drawText(data.gender, {
            x: dataPositions.gender.x,
            y: dataPositions.gender.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.category) {
        page.drawText(data.category, {
            x: dataPositions.category.x,
            y: dataPositions.category.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.address) {
        page.drawText(data.address, {
            x: dataPositions.address.x,
            y: dataPositions.address.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.mobileNo) {
        page.drawText(data.mobileNo, {
            x: dataPositions.mobile.x,
            y: dataPositions.mobile.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.email) {
        page.drawText(data.email, {
            x: dataPositions.email.x,
            y: dataPositions.email.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    // Parent Information data positions (adjusted to be below the labels)
    const parentStartY = PAGE_HEIGHT - MARGIN - 200;
    const parentDataPositions = {
        father: { x: MARGIN + 10, y: parentStartY - 55 },
        father_occupation: { x: MARGIN + 10, y: parentStartY - 85 },
        'father-phone': { x: MARGIN + 10, y: parentStartY - 115 },
    };
    
    // Draw parent information data
    if (data.fatherMotherName) {
        page.drawText(data.fatherMotherName, {
            x: parentDataPositions.father.x,
            y: parentDataPositions.father.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.fatherMotherOccupation) {
        page.drawText(data.fatherMotherOccupation, {
            x: parentDataPositions.father_occupation.x,
            y: parentDataPositions.father_occupation.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    // Academic Information data positions (adjusted to be below the labels)
    const academicStartY = PAGE_HEIGHT - MARGIN - 350;
    const academicDataPositions = {
        course: { x: MARGIN + 10, y: academicStartY - 55 },
        semester: { x: MARGIN + 10, y: academicStartY - 85 },
        cgpa: { x: MARGIN + 10, y: academicStartY - 115 },
        percentage: { x: MARGIN + 210, y: academicStartY - 115 },
        college: { x: MARGIN + 10, y: academicStartY - 145 },
    };
    
    // Draw academic information data
    if (data.areasOfTraining) {
        page.drawText(data.areasOfTraining, {
            x: academicDataPositions.course.x,
            y: academicDataPositions.course.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.presentSemester) {
        page.drawText(data.presentSemester, {
            x: academicDataPositions.semester.x,
            y: academicDataPositions.semester.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.lastSemesterSGPA) {
        page.drawText(String(data.lastSemesterSGPA), {
            x: academicDataPositions.cgpa.x,
            y: academicDataPositions.cgpa.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.percentageIn10Plus2) {
        page.drawText(String(data.percentageIn10Plus2), {
            x: academicDataPositions.percentage.x,
            y: academicDataPositions.percentage.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.presentInstitute) {
        page.drawText(data.presentInstitute, {
            x: academicDataPositions.college.x,
            y: academicDataPositions.college.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    // ONGC Employee Information data positions (adjusted to be below the labels)
    const ongcStartY = PAGE_HEIGHT - MARGIN - 500;
    const ongcDataPositions = {
        designation: { x: MARGIN + 10, y: ongcStartY - 55 },
        cpf: { x: MARGIN + 210, y: ongcStartY - 55 },
        section: { x: MARGIN + 10, y: ongcStartY - 85 },
        location: { x: MARGIN + 210, y: ongcStartY - 85 },
    };
    
    // Draw ONGC employee information data (if available)
    if (data.designation) {
        page.drawText(data.designation, {
            x: ongcDataPositions.designation.x,
            y: ongcDataPositions.designation.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.cpf) {
        page.drawText(data.cpf, {
            x: ongcDataPositions.cpf.x,
            y: ongcDataPositions.cpf.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.section) {
        page.drawText(data.section, {
            x: ongcDataPositions.section.x,
            y: ongcDataPositions.section.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
    
    if (data.location) {
        page.drawText(data.location, {
            x: ongcDataPositions.location.x,
            y: ongcDataPositions.location.y,
            size: DATA_FONT_SIZE,
            font: font,
            color: BLACK,
        });
    }
}

module.exports = {
    createONGCApplicationForm
};
