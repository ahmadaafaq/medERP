const fs = require('fs');

const origPath = 'F:\\AI_DOCKER\\AAFAQ_SIR_PROJECTS\\UNICAMPDIR\\ERP\\eng-erp\\backend\\uploads\\submissions\\srms-cet-bareilly\\sub_1788680327390_original.pdf';
const buf = fs.readFileSync(origPath);

// search for ascii words in binary
const str = buf.toString('latin1');
const matches = str.match(/[A-Za-z0-9\s]{4,}/g) || [];
const filtered = matches.filter(m => m.trim().length > 5).slice(0, 30);
console.log('Sample words from original PDF:', filtered);
