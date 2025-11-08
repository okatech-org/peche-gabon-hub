import { useState, useEffect } from 'react';

interface CSVData {
  [key: string]: string | number;
}

export const useCSVData = (filePath: string) => {
  const [data, setData] = useState<CSVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true);
        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${filePath}`);
        }

        const text = await response.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
          setData([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const parsedData: CSVData[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const row: CSVData = {};
          
          headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            // Try to parse as number
            const numValue = parseFloat(value);
            row[header] = isNaN(numValue) ? value : numValue;
          });
          
          parsedData.push(row);
        }

        setData(parsedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadCSV();
  }, [filePath]);

  return { data, loading, error };
};
