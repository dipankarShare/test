import React, { useState } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  color: #e0e1dd;
  margin-bottom: 30px;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #415a77;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background-color: ${props => props.isDragActive ? '#1b263b' : 'transparent'};
  cursor: pointer;
  margin-bottom: 30px;
  transition: all 0.2s ease;
`;

const MappingSection = styled.div`
  background-color: #1b263b;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
`;

const MappingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const MappingField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #778da9;
  font-weight: 500;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #415a77;
  border-radius: 4px;
  background-color: #0d1b2a;
  color: white;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #757575;
    cursor: not-allowed;
  }
`;

const PreviewTable = styled.table`
  width: 100%;
  background-color: #1b263b;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 20px;
`;

const Th = styled.th`
  background-color: #415a77;
  color: white;
  padding: 12px;
  text-align: left;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #415a77;
  color: #e0e1dd;
`;

function CSVImport({ selectedAccount }) {
  const [csvData, setCsvData] = useState(null);
  const [mapping, setMapping] = useState({
    date: '',
    description: '',
    amount: '',
    note: '',
    category: ''
  });
  const [importing, setImporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8000/upload-csv/${selectedAccount.id}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setCsvData(data);
      
      // Auto-detect common column names
      const columns = data.columns;
      const autoMapping = { ...mapping };
      
      columns.forEach(col => {
        const lower = col.toLowerCase();
        if (lower.includes('date') && !autoMapping.date) {
          autoMapping.date = col;
        } else if ((lower.includes('description') || lower.includes('memo')) && !autoMapping.description) {
          autoMapping.description = col;
        } else if ((lower.includes('amount') || lower.includes('debit') || lower.includes('credit')) && !autoMapping.amount) {
          autoMapping.amount = col;
        } else if ((lower.includes('note') || lower.includes('notes')) && !autoMapping.note) {
          autoMapping.note = col;
        } else if (lower.includes('category') && !autoMapping.category) {
          autoMapping.category = col;
        }
      });
      
      setMapping(autoMapping);
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!csvData || !mapping.date || !mapping.description || !mapping.amount || !uploadedFile) {
      alert('Please map required fields: Date, Description, and Amount');
      return;
    }

    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch(`http://localhost:8000/import-transactions/${selectedAccount.id}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setCsvData(null);
        setMapping({ date: '', description: '', amount: '', note: '', category: '' });
        setUploadedFile(null);
      } else {
        alert('Error importing transactions');
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Error importing transactions');
    } finally {
      setImporting(false);
    }
  };

  if (!selectedAccount) {
    return (
      <Container>
        <Title>CSV Import</Title>
        <div style={{ textAlign: 'center', color: '#778da9', padding: '50px' }}>
          Please select an account from the sidebar to import CSV files
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>CSV Import - {selectedAccount.name}</Title>
      
      <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p style={{ color: '#e0e1dd' }}>Drop the CSV file here...</p>
        ) : (
          <div>
            <p style={{ color: '#e0e1dd', marginBottom: '10px' }}>
              Drag & drop a CSV file here, or click to select
            </p>
            <p style={{ color: '#778da9', fontSize: '14px' }}>
              Supports bank statements and transaction exports
            </p>
          </div>
        )}
      </DropzoneContainer>

      {csvData && (
        <>
          <MappingSection>
            <h3 style={{ color: '#e8eaf6', marginBottom: '20px' }}>
              Map CSV Columns ({csvData.total_rows} rows detected)
            </h3>
            
            <MappingGrid>
              <MappingField>
                <Label>Date Column *</Label>
                <Select
                  value={mapping.date}
                  onChange={(e) => setMapping({...mapping, date: e.target.value})}
                >
                  <option value="">Select column</option>
                  {csvData.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </MappingField>

              <MappingField>
                <Label>Description Column *</Label>
                <Select
                  value={mapping.description}
                  onChange={(e) => setMapping({...mapping, description: e.target.value})}
                >
                  <option value="">Select column</option>
                  {csvData.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </MappingField>

              <MappingField>
                <Label>Amount Column *</Label>
                <Select
                  value={mapping.amount}
                  onChange={(e) => setMapping({...mapping, amount: e.target.value})}
                >
                  <option value="">Select column</option>
                  {csvData.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </MappingField>

              <MappingField>
                <Label>Note Column (Optional)</Label>
                <Select
                  value={mapping.note}
                  onChange={(e) => setMapping({...mapping, note: e.target.value})}
                >
                  <option value="">Select column</option>
                  {csvData.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </MappingField>

              <MappingField>
                <Label>Category Column (Optional)</Label>
                <Select
                  value={mapping.category}
                  onChange={(e) => setMapping({...mapping, category: e.target.value})}
                >
                  <option value="">Select column</option>
                  {csvData.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </MappingField>
            </MappingGrid>

            <Button 
              onClick={handleImport}
              disabled={importing || !mapping.date || !mapping.description || !mapping.amount}
            >
              {importing ? 'Importing...' : 'Import Transactions'}
            </Button>
          </MappingSection>

          <h3 style={{ color: '#e8eaf6', marginBottom: '15px' }}>Preview (First 5 rows)</h3>
          <PreviewTable>
            <thead>
              <tr>
                {csvData.columns.map(col => (
                  <Th key={col}>{col}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.preview.map((row, index) => (
                <tr key={index}>
                  {csvData.columns.map(col => (
                    <Td key={col}>{row[col]}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </PreviewTable>
        </>
      )}
    </Container>
  );
}

export default CSVImport;