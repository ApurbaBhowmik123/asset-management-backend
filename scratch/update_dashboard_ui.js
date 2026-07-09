const fs = require('fs');

const dashAnalPath = 'f:/asset_management/ams-frontend/src/Page/Dashboard/DashboardAnalytics.jsx';
let code = fs.readFileSync(dashAnalPath, 'utf8');

// Add Select and MenuItem to imports
code = code.replace(
  `import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';`,
  `import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, List, ListItem, ListItemText, ListItemAvatar, Avatar, Select, MenuItem, FormControl } from '@mui/material';`
);

// Add state for depreciationPeriod
code = code.replace(
  `  const [loading, setLoading] = useState(true);`,
  `  const [loading, setLoading] = useState(true);
  const [depreciationPeriod, setDepreciationPeriod] = useState(3);`
);

// Update fetch URL and dependency array
code = code.replace(
  `        const res = await fetch(\`\${baseUrl}/dashboard/analytics\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });`,
  `        const res = await fetch(\`\${baseUrl}/dashboard/analytics?depreciationPeriod=\${depreciationPeriod}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });`
);

code = code.replace(
  `  }, []);`,
  `  }, [depreciationPeriod]);`
);

// Update the Top 5 Categories Header and add Dropdown
code = code.replace(
  `<Typography variant="h6" fontWeight="bold" color="text.secondary" gutterBottom>Top 5 Categories By Value</Typography>`,
  `<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.secondary">Top 5 Categories By Value</Typography>
                  <FormControl size="small">
                    <Select
                      value={depreciationPeriod}
                      onChange={(e) => setDepreciationPeriod(e.target.value)}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value={0}>Today</MenuItem>
                      <MenuItem value={1}>1 Year</MenuItem>
                      <MenuItem value={2}>2 Years</MenuItem>
                      <MenuItem value={3}>3 Years</MenuItem>
                    </Select>
                  </FormControl>
                </Box>`
);

// Update table header for Depreciated Value
code = code.replace(
  `<TableCell align="right" sx={{ fontWeight: 'bold' }}>Depreciated Value (3 Yrs)</TableCell>`,
  `<TableCell align="right" sx={{ fontWeight: 'bold' }}>Depreciated Value ({depreciationPeriod === 0 ? "Today" : depreciationPeriod + " Yrs"})</TableCell>`
);

fs.writeFileSync(dashAnalPath, code);
console.log("DashboardAnalytics.jsx updated.");
