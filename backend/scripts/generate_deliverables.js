const fs = require('fs');
const path = require('path');

function createPdfBuffer(title, subtitle, sections) {
  // Construct standard valid PDF 1.4
  let contentStream = `BT
/F1 18 Tf
50 750 Td
(${title.replace(/[()]/g, '')}) Tj
ET
BT
/F1 12 Tf
50 725 Td
(${subtitle.replace(/[()]/g, '')}) Tj
ET
`;

  let y = 690;
  sections.forEach((sec) => {
    contentStream += `BT
/F2 14 Tf
50 ${y} Td
(${sec.heading.replace(/[()]/g, '')}) Tj
ET
`;
    y -= 22;
    const lines = sec.body.split('\n');
    lines.forEach((l) => {
      if (l.trim()) {
        contentStream += `BT
/F1 10 Tf
50 ${y} Td
(${l.trim().replace(/[()]/g, '')}) Tj
ET
`;
        y -= 16;
      }
    });
    y -= 12;
  });

  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
0000000377 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
455
%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

const tenantDir = path.join(__dirname, '..', 'uploads', 'submissions', 'srms-cet-bareilly');
fs.mkdirSync(tenantDir, { recursive: true });

const projDir = path.join(__dirname, '..', 'uploads', 'projects', 'srms-cet-bareilly');
fs.mkdirSync(projDir, { recursive: true });

// 1. Generative AI.pdf
const genAiPdf = createPdfBuffer(
  'Generative AI (Gen AI) - Seminar',
  'Candidate: Aafreen Khan | Department of Computer Applications',
  [
    {
      heading: '1. Introduction',
      body: 'Generative Artificial Intelligence (Gen AI) is a branch of AI that can create new content based on the instructions given by a user. It can generate text, images, audio, video, computer programs, and other forms of content.'
    },
    {
      heading: '2. How Gen AI Works',
      body: 'Step 1: User Prompt Input\nStep 2: Gen AI Model processing via Large Language & Diffusion Transformers\nStep 3: Pattern matching against billions of trained weights\nStep 4: Generated High-Fidelity Output (Text, Image, Code)'
    },
    {
      heading: '3. Real-World Applications',
      body: 'Software engineering copilot and automated code completion\nMedical imaging analysis and molecular synthesis\nPersonalized interactive tutoring in higher education'
    }
  ]
);
fs.writeFileSync(path.join(tenantDir, 'Generative_AI.pdf'), genAiPdf);
fs.writeFileSync(path.join(tenantDir, 'Generative AI.pdf'), genAiPdf);

// 2. Topology_Report.pdf
const topologyPdf = createPdfBuffer(
  'Network & Mathematical Topology - Seminar',
  'Candidate: Aafreen Khan | BCA Department',
  [
    {
      heading: '1. Topological Formulations',
      body: 'Topology studies properties of geometric objects that are preserved under continuous deformations including stretching, twisting, and crumpling.'
    },
    {
      heading: '2. Computer Network Topologies',
      body: 'Mesh Topology: High redundancy and point-to-point links\nStar Topology: Central hub switch routing all node packets\nHybrid Topology: Combined tree and star rings for enterprise scalability'
    }
  ]
);
fs.writeFileSync(path.join(tenantDir, 'Topology_Report.pdf'), topologyPdf);

// 3. ecommerceproject.pdf
const ecomPdf = createPdfBuffer(
  'E-Commerce Scalable Platform - Mini Project',
  'Candidate: Aafreen Khan | Project Deliverable',
  [
    {
      heading: '1. Executive Architecture',
      body: 'Full stack enterprise e-commerce platform built with Next.js, NestJS, and PostgreSQL.\nFeatures inventory synchronization, payment gateway integration, and real-time order dispatch.'
    }
  ]
);
fs.writeFileSync(path.join(projDir, 'ecommerceproject.pdf'), ecomPdf);

console.log('PDF files created successfully on disk!');
