const http = require('http');
http.get('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data).data;
    console.log('Total items:', list?.length);
    console.log(list?.map(i => ({
      title: i.title,
      catCode: i.categoryCode,
      catName: i.categoryName,
      file: i.fileName,
      url: i.fileUrl,
      marks: i.marksObtained
    })));
  });
});
