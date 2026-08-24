const { Client } = require('pg');

async function addThemeConfigColumn() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  await client.query(`
    ALTER TABLE public.firms 
    ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{
      "primary_color": "#5B4BFF",
      "secondary_color": "#7867FF",
      "accent_color": "#F36C21",
      "sidebar_bg": "#2D2575",
      "header_bg": "#FFFFFF",
      "page_bg": "#F6F8FC",
      "card_bg": "#FFFFFF",
      "card_radius": "22px",
      "table_header_bg": "#F8FAFC",
      "table_zebra": true,
      "theme_mode": "LIGHT"
    }'::jsonb;
  `);

  console.log('Successfully ensured theme_config column on public.firms');
  await client.end();
}

addThemeConfigColumn().catch(err => {
  console.error(err);
  process.exit(1);
});
