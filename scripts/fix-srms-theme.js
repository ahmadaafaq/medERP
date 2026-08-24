const path = require('path');
const { Client } = require(path.resolve(__dirname, '../backend/node_modules/pg'));

async function fixSrmsTheme() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();
  await client.query(`
    UPDATE public.firms 
    SET theme_color = '#5B4BFF',
        theme_config = jsonb_build_object(
          'primary_color', '#5B4BFF',
          'secondary_color', '#7867FF',
          'accent_color', '#F36C21',
          'sidebar_bg', '#2D2575',
          'header_bg', '#2D2575',
          'page_bg', '#F6F8FC',
          'card_bg', '#FFFFFF',
          'card_radius', '22px'
        )
    WHERE slug = 'srms-cet-bareilly'
  `);

  const res = await client.query(`SELECT title, slug, theme_color, theme_config FROM public.firms WHERE slug = 'srms-cet-bareilly'`);
  console.log('UPDATED SRMS CET FIRM:', JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

fixSrmsTheme().catch(console.error);
