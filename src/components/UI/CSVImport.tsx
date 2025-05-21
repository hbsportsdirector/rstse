import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Upload, FileText, Check, X } from 'lucide-react';
import Button from './Button';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

interface CSVRow {
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  teamId?: string;
}

interface ImportResult {
  success: boolean;
  email: string;
  error?: string;
}

interface CSVImportProps {
  onComplete: () => void;
  teamId?: string;
}

export function CSVImport({ onComplete, teamId }: CSVImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name');
      
      if (!error && data) {
        setTeams(data);
      }
    };

    fetchTeams();
  }, []);

  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .replace(/[^a-z]/g, '') // Remove special characters and spaces
      .trim();
  };

  const detectDelimiter = (content: string): string => {
    const firstLine = content.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCSV = (content: string): CSVRow[] => {
    const delimiter = detectDelimiter(content);
    const lines = content.split('\n');
    
    // Get raw headers and normalize them
    const rawHeaders = lines[0].split(delimiter).map(h => h.trim());
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    
    // Map common header variations
    const headerMap: { [key: string]: string } = {
      'email': 'email',
      'emailaddress': 'email',
      'mail': 'email',
      'firstname': 'firstname',
      'first': 'firstname',
      'fname': 'firstname',
      'givenname': 'firstname',
      'lastname': 'lastname',
      'last': 'lastname',
      'lname': 'lastname',
      'surname': 'lastname',
      'familyname': 'lastname',
      'role': 'role',
      'userrole': 'role',
      'type': 'role',
      'team': 'team',
      'teamname': 'team',
      'group': 'team'
    };

    // Map normalized headers to standard names
    const standardHeaders = normalizedHeaders.map(h => headerMap[h] || h);
    
    // Validate required headers
    const requiredHeaders = ['email', 'firstname', 'lastname'];
    const missingHeaders = requiredHeaders.filter(h => !standardHeaders.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required headers: ${missingHeaders.join(', ')}.\n` +
        `Found headers: ${rawHeaders.join(delimiter)}\n` +
        `Normalized headers: ${normalizedHeaders.join('')}`
      );
    }

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const row: CSVRow = {
          email: values[standardHeaders.indexOf('email')],
          firstName: values[standardHeaders.indexOf('firstname')],
          lastName: values[standardHeaders.indexOf('lastname')],
        };

        // Handle optional role
        const roleIndex = standardHeaders.indexOf('role');
        if (roleIndex !== -1) {
          const role = values[roleIndex]?.toLowerCase();
          if (role && ['player', 'coach', 'admin'].includes(role)) {
            row.role = role as UserRole;
          }
        }

        // Handle optional team
        const teamIndex = standardHeaders.indexOf('team');
        if (teamIndex !== -1) {
          const teamName = values[teamIndex];
          if (teamName) {
            const team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
            if (team) {
              row.teamId = team.id;
            }
          }
        }

        // Use provided teamId if no team specified in CSV
        if (!row.teamId && teamId) {
          row.teamId = teamId;
        }

        return row;
      });
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResults([]);
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setIsProcessing(true);
      const content = await file.text();
      const users = parseCSV(content);
      
      const importResults: ImportResult[] = [];

      for (const user of users) {
        try {
          // Validate data
          if (!validateEmail(user.email)) {
            throw new Error('Invalid email format');
          }
          if (!user.firstName || !user.lastName) {
            throw new Error('First name and last name are required');
          }

          // Create auth user with random password
          const tempPassword = Math.random().toString(36).slice(-8);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: tempPassword,
            options: {
              data: {
                first_name: user.firstName,
                last_name: user.lastName,
                role: user.role || 'player'
              }
            }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Failed to create user');

          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role || 'player',
              team_id: user.teamId
            });

          if (profileError) throw profileError;

          importResults.push({
            success: true,
            email: user.email
          });
        } catch (err: any) {
          importResults.push({
            success: false,
            email: user.email,
            error: err.message
          });
        }
      }

      setResults(importResults);
      
      // If all imports were successful, call onComplete
      if (importResults.every(r => r.success)) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Import Users</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with user information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          Upload CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center text-error">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg divide-y">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{result.email}</span>
              </div>
              <div className="flex items-center">
                {result.success ? (
                  <span className="text-success flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Success
                  </span>
                ) : (
                  <span className="text-error flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {result.error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p className="font-medium">CSV Format:</p>
        <ul className="list-disc list-inside">
          <li>Required columns: email, firstname, lastname</li>
          <li>Optional columns: role (player/coach/admin), team</li>
          <li>First row must contain column headers</li>
          <li>Values can be separated by commas or semicolons</li>
          <li>Example: email,firstname,lastname,role,team</li>
        </ul>
      </div>
    </div>
  );
}
